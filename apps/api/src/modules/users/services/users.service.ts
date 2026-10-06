import { generateBrxUid } from '../../../common/brx-uid.util';
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from '../dto/create-user.dto';
import { PrismaService } from '../../../database/prisma.service';
import { UpdateProfileDto } from '../dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async createInstitutionUser(
  institutionId: string | null,
  dto: CreateUserDto,
) {
  if (!institutionId) {
    throw new NotFoundException('Institution not found');
  }

  const allowedRoles = ['TEACHER', 'STAFF', 'STUDENT'];

  if (!allowedRoles.includes(dto.role)) {
    throw new ConflictException(
      'HEAD can only create TEACHER, STAFF, or STUDENT users',
    );
  }

  const existingUser = await this.prisma.user.findUnique({
    where: {
      email: dto.email,
    },
  });

  if (existingUser) {
    throw new ConflictException('Email already exists');
  }

  const passwordHash = await bcrypt.hash(dto.password, 12);

  return this.prisma.user.create({
    data: {
        brxUid: generateBrxUid(),
      email: dto.email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      role: dto.role,
      institutionId,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      role: true,
      status: true,
      institutionId: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        status: true,
        institutionId: true,
        institution: {
          select: {
            id: true,
            name: true,
            code: true,
            type: true,
            status: true,
            country: true,
            state: true,
            city: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ) {
    const existingUser = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        brxUid: generateBrxUid(),
        ...(dto.firstName !== undefined && {
          firstName: dto.firstName,
        }),
        ...(dto.lastName !== undefined && {
          lastName: dto.lastName,
        }),
        ...(dto.phone !== undefined && {
          phone: dto.phone,
        }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        status: true,
        institutionId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findInstitutionUsers(institutionId: string | null) {
    if (!institutionId) {
      return [];
    }

    return this.prisma.user.findMany({
      where: {
        institutionId,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        status: true,
        institutionId: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findInstitutionUser(
    institutionId: string | null,
    userId: string,
  ) {
    if (!institutionId) {
      throw new NotFoundException('User not found');
    }

    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        institutionId,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        status: true,
        institutionId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateInstitutionUser(
    institutionId: string | null,
    userId: string,
    dto: UpdateProfileDto,
  ) {
    await this.findInstitutionUser(institutionId, userId);

    return this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        brxUid: generateBrxUid(),
        ...(dto.firstName !== undefined && {
          firstName: dto.firstName,
        }),
        ...(dto.lastName !== undefined && {
          lastName: dto.lastName,
        }),
        ...(dto.phone !== undefined && {
          phone: dto.phone,
        }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        status: true,
        institutionId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
    async assignStudentToTeacher(
    institutionId: string | null,
    teacherId: string,
    studentId: string,
  ) {
    if (!institutionId) {
      throw new NotFoundException('Institution not found');
    }

    const teacher = await this.prisma.user.findFirst({
      where: {
        id: teacherId,
        institutionId,
        role: 'TEACHER',
      },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    const student = await this.prisma.user.findFirst({
      where: {
        id: studentId,
        institutionId,
        role: 'STUDENT',
      },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const existingAssignment =
      await this.prisma.teacherStudent.findUnique({
        where: {
          teacherId_studentId: {
            teacherId,
            studentId,
          },
        },
      });

    if (existingAssignment) {
      throw new ConflictException(
        'Student is already assigned to this teacher',
      );
    }

    return this.prisma.teacherStudent.create({
      data: {teacherId,
        studentId,
      },
      select: {
        id: true,
        teacherId: true,
        studentId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findTeacherStudents(
    institutionId: string | null,
    teacherId: string,
  ) {
    if (!institutionId) {
      throw new NotFoundException('Institution not found');
    }

    const teacher = await this.prisma.user.findFirst({
      where: {
        id: teacherId,
        institutionId,
        role: 'TEACHER',
      },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    return this.prisma.teacherStudent.findMany({
      where: {
        teacherId,
        student: {
          institutionId,
        },
      },
      select: {
        id: true,
        student: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            role: true,
            status: true,
            institutionId: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async removeStudentFromTeacher(
    institutionId: string | null,
    teacherId: string,
    studentId: string,
  ) {
    if (!institutionId) {
      throw new NotFoundException('Institution not found');
    }

    const assignment =
      await this.prisma.teacherStudent.findFirst({
        where: {
          teacherId,
          studentId,
          teacher: {
            institutionId,
            role: 'TEACHER',
          },
          student: {
            institutionId,
            role: 'STUDENT',
          },
        },
      });

    if (!assignment) {
      throw new NotFoundException(
        'Student assignment not found',
      );
    }

    return this.prisma.teacherStudent.delete({
      where: { id: assignment.id },
    });
  }
}

