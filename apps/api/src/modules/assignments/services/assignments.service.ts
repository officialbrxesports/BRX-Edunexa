import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AssignmentStatus } from '../../../generated/prisma/enums';
import { PrismaService } from '../../../database/prisma.service';
import { CreateAssignmentDto } from '../dto/create-assignment.dto';
import { UpdateAssignmentDto } from '../dto/update-assignment.dto';

@Injectable()
export class AssignmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    institutionId: string | null,
    userId: string,
    role: string,
    dto: CreateAssignmentDto,
  ) {
    if (!institutionId) {
      throw new ForbiddenException('Institution is required');
    }

    const teacherId = role === 'TEACHER' ? userId : dto.teacherId;

    if (!teacherId) {
      throw new BadRequestException('Teacher is required');
    }

    const teacher = await this.prisma.user.findFirst({
      where: {
        id: teacherId,
        institutionId,
        role: 'TEACHER',
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    });

    if (!teacher) {
      throw new BadRequestException('Teacher not found in this institution');
    }

    await this.validateTargets(
      institutionId,
      dto.classId,
      dto.sectionId,
      dto.studentId,
    );

    return this.prisma.assignment.create({
      data: {
        institutionId,
        teacherId,
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        status: dto.status ?? AssignmentStatus.DRAFT,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        classId: dto.classId || null,
        sectionId: dto.sectionId || null,
        studentId: dto.studentId || null,
      },
      include: this.includeRelations(),
    });
  }

  async findAll(
    institutionId: string | null,
    userId: string,
    role: string,
    page = 1,
    limit = 12,
    search = '',
    status?: AssignmentStatus,
  ) {
    if (!institutionId) {
      throw new ForbiddenException('Institution is required');
    }

    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(50, Math.max(1, Number(limit) || 12));

    const where: any = {
      institutionId,
    };

    if (role === 'TEACHER') {
      where.teacherId = userId;
    }

    if (role === 'STUDENT') {
      where.status = AssignmentStatus.PUBLISHED;
      where.OR = [
        { studentId: userId },
        {
          studentId: null,
        },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (search?.trim()) {
      where.AND = [
        {
          OR: [
            {
              title: {
                contains: search.trim(),
                mode: 'insensitive',
              },
            },
            {
              description: {
                contains: search.trim(),
                mode: 'insensitive',
              },
            },
          ],
        },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.assignment.findMany({
        where,
        include: this.includeRelations(),
        orderBy: {
          createdAt: 'desc',
        },
        skip: (safePage - 1) * safeLimit,
        take: safeLimit,
      }),
      this.prisma.assignment.count({
        where,
      }),
    ]);

    return {
      data,
      meta: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit),
      },
    };
  }

  async findOne(
    institutionId: string | null,
    userId: string,
    role: string,
    id: string,
  ) {
    if (!institutionId) {
      throw new ForbiddenException('Institution is required');
    }

    const assignment = await this.prisma.assignment.findFirst({
      where: {
        id,
        institutionId,
      },
      include: this.includeRelations(),
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    this.checkAccess(assignment, userId, role);

    return assignment;
  }

  async update(
    institutionId: string | null,
    userId: string,
    role: string,
    id: string,
    dto: UpdateAssignmentDto,
  ) {
    const assignment = await this.findOne(
      institutionId,
      userId,
      role,
      id,
    );

    if (role === 'TEACHER' && assignment.teacherId !== userId) {
      throw new ForbiddenException('You cannot update this assignment');
    }

    const classId = dto.classId ?? assignment.classId;
    const sectionId = dto.sectionId ?? assignment.sectionId;
    const studentId = dto.studentId ?? assignment.studentId;

    await this.validateTargets(
      institutionId!,
      classId,
      sectionId,
      studentId,
    );

    const data: any = {};

    if (dto.title !== undefined) {
      data.title = dto.title.trim();
    }

    if (dto.description !== undefined) {
      data.description = dto.description.trim() || null;
    }

    if (dto.teacherId !== undefined) {
      if (role !== 'HEAD') {
        throw new ForbiddenException(
          'Only Head can change assignment teacher',
        );
      }

      const teacher = await this.prisma.user.findFirst({
        where: {
          id: dto.teacherId,
          institutionId: institutionId!,
          role: 'TEACHER',
        },
      });

      if (!teacher) {
        throw new BadRequestException('Teacher not found');
      }

      data.teacherId = dto.teacherId;
    }

    if (dto.classId !== undefined) {
      data.classId = dto.classId || null;
    }

    if (dto.sectionId !== undefined) {
      data.sectionId = dto.sectionId || null;
    }

    if (dto.studentId !== undefined) {
      data.studentId = dto.studentId || null;
    }

    if (dto.dueDate !== undefined) {
      data.dueDate = dto.dueDate
        ? new Date(dto.dueDate)
        : null;
    }

    if (dto.status !== undefined) {
      data.status = dto.status;

      if (dto.status === AssignmentStatus.PUBLISHED) {
        data.publishedAt = new Date();
      }
    }

    return this.prisma.assignment.update({
      where: {
        id: assignment.id,
      },
      data,
      include: this.includeRelations(),
    });
  }

  async remove(
    institutionId: string | null,
    userId: string,
    role: string,
    id: string,
  ) {
    const assignment = await this.findOne(
      institutionId,
      userId,
      role,
      id,
    );

    if (role === 'TEACHER' && assignment.teacherId !== userId) {
      throw new ForbiddenException('You cannot delete this assignment');
    }

    await this.prisma.assignment.delete({
      where: {
        id: assignment.id,
      },
    });

    return {
      success: true,
      message: 'Assignment deleted successfully',
      id: assignment.id,
    };
  }

  async publish(
    institutionId: string | null,
    userId: string,
    role: string,
    id: string,
  ) {
    const assignment = await this.findOne(
      institutionId,
      userId,
      role,
      id,
    );

    if (role === 'TEACHER' && assignment.teacherId !== userId) {
      throw new ForbiddenException(
        'You cannot publish this assignment',
      );
    }

    return this.prisma.assignment.update({
      where: {
        id: assignment.id,
      },
      data: {
        status: AssignmentStatus.PUBLISHED,
        publishedAt: new Date(),
      },
      include: this.includeRelations(),
    });
  }

  private async validateTargets(
    institutionId: string,
    classId?: string | null,
    sectionId?: string | null,
    studentId?: string | null,
  ) {
    if (classId) {
      const academicClass = await this.prisma.class.findFirst({
        where: {
          id: classId,
          institutionId,
        },
      });

      if (!academicClass) {
        throw new BadRequestException(
          'Class not found in this institution',
        );
      }
    }

    if (sectionId) {
      if (!classId) {
        throw new BadRequestException(
          'Class is required when section is selected',
        );
      }

      const section = await this.prisma.section.findFirst({
        where: {
          id: sectionId,
          classId,
        },
      });

      if (!section) {
        throw new BadRequestException(
          'Section does not belong to selected class',
        );
      }
    }

    if (studentId) {
      const student = await this.prisma.user.findFirst({
        where: {
          id: studentId,
          institutionId,
          role: 'STUDENT',
        },
      });

      if (!student) {
        throw new BadRequestException(
          'Student not found in this institution',
        );
      }
    }
  }

  private checkAccess(
    assignment: { teacherId: string; studentId: string | null; status: AssignmentStatus },
    userId: string,
    role: string,
  ) {
    if (role === 'TEACHER' && assignment.teacherId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    if (
      role === 'STUDENT' &&
      assignment.status !== AssignmentStatus.PUBLISHED
    ) {
      throw new ForbiddenException('Assignment is not published');
    }

    if (
      role === 'STUDENT' &&
      assignment.studentId &&
      assignment.studentId !== userId
    ) {
      throw new ForbiddenException('Access denied');
    }
  }

  private includeRelations() {
    return {
      teacher: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      class: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
      section: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
      student: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          status: true,
        },
      },
    };
  }
}