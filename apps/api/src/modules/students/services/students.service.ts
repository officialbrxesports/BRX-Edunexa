import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import * as bcrypt from 'bcrypt';

import { generateBrxUid } from '../../../common/brx-uid.util';
import { PrismaService } from '../../../database/prisma.service';

import { CreateStudentDto } from '../dto/create-student.dto';
import { UpdateStudentDto } from '../dto/update-student.dto';
import { ListStudentsQueryDto } from '../dto/list-students-query.dto';

@Injectable()
export class StudentsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  private checkInstitution(
    institutionId: string | null,
  ): string {
    if (!institutionId) {
      throw new ForbiddenException(
        'Institution context is missing',
      );
    }

    return institutionId;
  }

  async create(
    institutionId: string | null,
    dto: CreateStudentDto,
  ) {
    const id =
      this.checkInstitution(institutionId);

    const existing =
      await this.prisma.user.findUnique({
        where: {
          email: dto.email,
        },
      });

    if (existing) {
      throw new ConflictException(
        'Email already exists',
      );
    }

    if (dto.classId) {
      const cls =
        await this.prisma.class.findFirst({
          where: {
            id: dto.classId,
            institutionId: id,
          },
        });

      if (!cls) {
        throw new NotFoundException(
          'Class not found',
        );
      }
    }

    if (dto.sectionId) {
      const section =
        await this.prisma.section.findFirst({
          where: {
            id: dto.sectionId,
            class: {
              institutionId: id,
            },
          },
        });

      if (!section) {
        throw new NotFoundException(
          'Section not found',
        );
      }
    }

    const passwordHash =
      await bcrypt.hash(
        dto.password,
        12,
      );

    return this.prisma.$transaction(
      async (tx) => {
        const student =
          await tx.user.create({
            data: {
              // Generate once at creation.
              brxUid: generateBrxUid(),

              email: dto.email,
              passwordHash,
              firstName: dto.firstName,
              lastName: dto.lastName,
              phone: dto.phone,
              role: 'STUDENT',
              status: 'ACTIVE',
              institutionId: id,
            },

            select: {
              id: true,
              brxUid: true,
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

        if (
          dto.classId &&
          dto.sectionId
        ) {
          await tx.studentEnrollment.create({
            data: {
              studentId: student.id,
              classId: dto.classId,
              sectionId: dto.sectionId,
            },
          });
        }

        return student;
      },
    );
  }

  async findAll(
    institutionId: string | null,
    query: ListStudentsQueryDto,
  ) {
    const id =
      this.checkInstitution(institutionId);

    const page = Math.max(
      1,
      Number(query.page) || 1,
    );

    const limit = Math.min(
      100,
      Math.max(
        1,
        Number(query.limit) || 20,
      ),
    );

    const skip =
      (page - 1) * limit;

    const where: any = {
      institutionId: id,
      role: 'STUDENT',
    };

    if (
      query.userStatus &&
      query.userStatus !== 'all'
    ) {
      where.status =
        query.userStatus;
    }

    if (query.search) {
      const search =
        query.search.trim();

      where.OR = [
        {
          firstName: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          lastName: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          email: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          phone: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          brxUid: {
            contains:
              search.toUpperCase(),
            mode: 'insensitive',
          },
        },
      ];
    }

    if (
      query.classId ||
      query.sectionId
    ) {
      where.enrollments = {
        some: {
          ...(query.classId
            ? {
                classId:
                  query.classId,
              }
            : {}),

          ...(query.sectionId
            ? {
                sectionId:
                  query.sectionId,
              }
            : {}),
        },
      };
    }

    const [data, total] =
      await this.prisma.$transaction([
        this.prisma.user.findMany({
          where,

          select: {
            id: true,
            brxUid: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            role: true,
            status: true,
            institutionId: true,
            createdAt: true,
            updatedAt: true,

            enrollments: {
              include: {
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
              },

              orderBy: {
                createdAt: 'desc',
              },

              take: 1,
            },
          },

          orderBy: {
            createdAt: 'desc',
          },

          skip,
          take: limit,
        }),

        this.prisma.user.count({
          where,
        }),
      ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.max(
          1,
          Math.ceil(total / limit),
        ),
      },
    };
  }

  async findOne(
    institutionId: string | null,
    studentId: string,
  ) {
    const id =
      this.checkInstitution(institutionId);

    const student =
      await this.prisma.user.findFirst({
        where: {
          id: studentId,
          institutionId: id,
          role: 'STUDENT',
        },

        select: {
          id: true,
          brxUid: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          status: true,
          institutionId: true,
          createdAt: true,
          updatedAt: true,

          enrollments: {
            include: {
              class: true,
              section: true,
            },

            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      });

    if (!student) {
      throw new NotFoundException(
        'Student not found',
      );
    }

    return student;
  }

  async update(
    institutionId: string | null,
    studentId: string,
    dto: UpdateStudentDto,
  ) {
    const id =
      this.checkInstitution(institutionId);

    const existing =
      await this.prisma.user.findFirst({
        where: {
          id: studentId,
          institutionId: id,
          role: 'STUDENT',
        },
      });

    if (!existing) {
      throw new NotFoundException(
        'Student not found',
      );
    }

    if (
      dto.email &&
      dto.email !== existing.email
    ) {
      const emailExists =
        await this.prisma.user.findUnique({
          where: {
            email: dto.email,
          },
        });

      if (emailExists) {
        throw new ConflictException(
          'Email already exists',
        );
      }
    }

    const passwordHash =
      dto.password
        ? await bcrypt.hash(
            dto.password,
            12,
          )
        : undefined;

    await this.prisma.$transaction(
      async (tx) => {
        // BRX UID is NOT modified.
        await tx.user.update({
          where: {
            id: studentId,
          },

          data: {
            ...(dto.email !== undefined && {
              email: dto.email,
            }),

            ...(dto.firstName !==
              undefined && {
              firstName:
                dto.firstName,
            }),

            ...(dto.lastName !==
              undefined && {
              lastName:
                dto.lastName,
            }),

            ...(dto.phone !==
              undefined && {
              phone: dto.phone,
            }),

            ...(passwordHash && {
              passwordHash,
            }),
          },
        });

        if (
          dto.classId &&
          dto.sectionId
        ) {
          const cls =
            await tx.class.findFirst({
              where: {
                id: dto.classId,
                institutionId: id,
              },
            });

          if (!cls) {
            throw new NotFoundException(
              'Class not found',
            );
          }

          const section =
            await tx.section.findFirst({
              where: {
                id: dto.sectionId,
                class: {
                  institutionId: id,
                },
              },
            });

          if (!section) {
            throw new NotFoundException(
              'Section not found',
            );
          }

          await tx.studentEnrollment.deleteMany(
            {
              where: {
                studentId,
              },
            },
          );

          await tx.studentEnrollment.create({
            data: {
              studentId,
              classId: dto.classId,
              sectionId: dto.sectionId,
            },
          });
        }
      },
    );

    return this.findOne(
      id,
      studentId,
    );
  }

  async deactivate(
    institutionId: string | null,
    studentId: string,
  ) {
    const id =
      this.checkInstitution(institutionId);

    const result =
      await this.prisma.user.updateMany({
        where: {
          id: studentId,
          institutionId: id,
          role: 'STUDENT',
        },

        data: {
          status: 'DELETED',
        },
      });

    if (result.count === 0) {
      throw new NotFoundException(
        'Student not found',
      );
    }

    return this.findOne(
      id,
      studentId,
    );
  }

  async activate(
    institutionId: string | null,
    studentId: string,
  ) {
    const id =
      this.checkInstitution(institutionId);

    const result =
      await this.prisma.user.updateMany({
        where: {
          id: studentId,
          institutionId: id,
          role: 'STUDENT',
        },

        data: {
          status: 'ACTIVE',
        },
      });

    if (result.count === 0) {
      throw new NotFoundException(
        'Student not found',
      );
    }

    return this.findOne(
      id,
      studentId,
    );
  }
}