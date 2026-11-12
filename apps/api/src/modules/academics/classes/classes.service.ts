
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../../prisma/prisma.service';

type SectionInput = {
  id?: string;
  name: string;
  code: string;
  capacity: number;
};

export type CreateClassInput = {
  name: string;
  code: string;
  sections: SectionInput[];
};

export type UpdateClassInput = {
  name: string;
  code: string;
  sections: SectionInput[];
};

@Injectable()
export class ClassesService {
  constructor(private readonly prisma: PrismaService) {}

  private validateClassInput(
    input: CreateClassInput | UpdateClassInput,
  ) {
    const name = input.name?.trim();
    const code = input.code?.trim().toUpperCase();

    if (!name || !code) {
      throw new BadRequestException(
        'Class name and code are required.',
      );
    }

    if (!Array.isArray(input.sections) || input.sections.length === 0) {
      throw new BadRequestException(
        'At least one section is required.',
      );
    }

    const sections = input.sections.map((section) => ({
      id: section.id,
      name: section.name?.trim(),
      code: section.code?.trim().toUpperCase(),
      capacity: Number(section.capacity),
    }));

    for (const section of sections) {
      if (!section.name || !section.code) {
        throw new BadRequestException(
          'Every section must have a name and code.',
        );
      }

      if (
        !Number.isInteger(section.capacity) ||
        section.capacity < 1 ||
        section.capacity > 10000
      ) {
        throw new BadRequestException(
          'Section capacity must be between 1 and 10000.',
        );
      }
    }

    const codes = sections.map((section) => section.code);

    if (new Set(codes).size !== codes.length) {
      throw new BadRequestException(
        'Section codes must be unique within a class.',
      );
    }

    const ids = sections
      .map((section) => section.id)
      .filter((id): id is string => Boolean(id));

    if (new Set(ids).size !== ids.length) {
      throw new BadRequestException(
        'Duplicate section IDs are not allowed.',
      );
    }

    return { name, code, sections };
  }

  private async getClassWithSeatCounts(
    institutionId: string,
    id: string,
  ) {
    const item = await this.prisma.classes.findFirst({
      where: {
        id,
        institutionId,
      },
      include: {
        sections: {
          orderBy: { createdAt: 'asc' },
          include: {
            _count: {
              select: {
                student_enrollments: true,
              },
            },
          },
        },
      },
    });

    if (!item) {
      throw new NotFoundException('Class not found.');
    }

    const sections = item.sections.map((section) => ({
      ...section,
      occupiedSeats: section._count.student_enrollments,
      _count: undefined,
    }));

    return {
      ...item,
      sections,
      totalSeats: sections.reduce(
        (total, section) => total + section.capacity,
        0,
      ),
      occupiedSeats: sections.reduce(
        (total, section) => total + section.occupiedSeats,
        0,
      ),
    };
  }

  async create(
    institutionId: string,
    input: CreateClassInput,
  ) {
    const { name, code, sections } =
      this.validateClassInput(input);

    const existingClass = await this.prisma.classes.findUnique({
      where: {
        institutionId_code: {
          institutionId,
          code,
        },
      },
    });

    if (existingClass) {
      throw new ConflictException(
        'This class code already exists.',
      );
    }

    try {
      const createdClass = await this.prisma.$transaction(
        async (tx) => {
          return tx.classes.create({
            data: {
              id: randomUUID(),
              name,
              code,
              institutionId,
              updatedAt: new Date(),
              sections: {
                create: sections.map((section) => ({
                  id: randomUUID(),
                  name: section.name,
                  code: section.code,
                  capacity: section.capacity,
                  updatedAt: new Date(),
                })),
              },
            },
            include: {
              sections: true,
            },
          });
        },
      );

      return {
        message: 'Class created successfully.',
        class: {
          ...createdClass,
          sections: createdClass.sections.map((section) => ({
            ...section,
            occupiedSeats: 0,
          })),
          totalSeats: createdClass.sections.reduce(
            (total, section) => total + section.capacity,
            0,
          ),
          occupiedSeats: 0,
        },
      };
    } catch (error) {
      this.handlePrismaConflict(error);
    }
  }

  async findAll(institutionId: string) {
    const classes = await this.prisma.classes.findMany({
      where: { institutionId },
      include: {
        sections: {
          orderBy: { createdAt: 'asc' },
          include: {
            _count: {
              select: {
                student_enrollments: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return classes.map((item) => {
      const sections = item.sections.map((section) => ({
        ...section,
        occupiedSeats: section._count.student_enrollments,
        _count: undefined,
      }));

      return {
        ...item,
        sections,
        totalSeats: sections.reduce(
          (total, section) => total + section.capacity,
          0,
        ),
        occupiedSeats: sections.reduce(
          (total, section) => total + section.occupiedSeats,
          0,
        ),
      };
    });
  }


  async findSeating(institutionId: string) {
    const classes = await this.prisma.classes.findMany({
      where: { institutionId },
      include: {
        sections: {
          orderBy: { createdAt: 'asc' },
          include: {
            student_enrollments: {
              orderBy: { createdAt: 'asc' },
              include: {
                users: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    brxUid: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return classes.map((classItem) => ({
      id: classItem.id,
      name: classItem.name,
      code: classItem.code,
      totalSeats: classItem.sections.reduce(
        (total, section) => total + section.capacity,
        0,
      ),
      sections: classItem.sections.map((section) => {
        const enrollments = section.student_enrollments;

        const seats = Array.from(
          { length: section.capacity },
          (_, index) => {
            const enrollment = enrollments[index];

            return {
              seatNumber: index + 1,
              occupied: Boolean(enrollment),
              student: enrollment
                ? {
                    id: enrollment.users.id,
                    name: [
                      enrollment.users.firstName,
                      enrollment.users.lastName,
                    ]
                      .filter(Boolean)
                      .join(' '),
                    brxUid: enrollment.users.brxUid,
                    email: enrollment.users.email,
                  }
                : null,
            };
          },
        );

        return {
          id: section.id,
          name: section.name,
          code: section.code,
          capacity: section.capacity,
          enrolledCount: enrollments.length,
          availableSeats: Math.max(
            section.capacity - enrollments.length,
            0,
          ),
          overflowCount: Math.max(
            enrollments.length - section.capacity,
            0,
          ),
          seats,
        };
      }),
    }));
  }

  async findOne(
    institutionId: string,
    id: string,
  ) {
    return this.getClassWithSeatCounts(institutionId, id);
  }

  async update(
    institutionId: string,
    id: string,
    input: UpdateClassInput,
  ) {
    const { name, code, sections } =
      this.validateClassInput(input);

    const existingClass = await this.prisma.classes.findFirst({
      where: {
        id,
        institutionId,
      },
      include: {
        sections: true,
      },
    });

    if (!existingClass) {
      throw new NotFoundException('Class not found.');
    }

    const duplicateClass = await this.prisma.classes.findFirst({
      where: {
        institutionId,
        code,
        NOT: { id },
      },
    });

    if (duplicateClass) {
      throw new ConflictException(
        'This class code already exists.',
      );
    }

    const existingSectionIds = new Set(
      existingClass.sections.map((section) => section.id),
    );

    for (const section of sections) {
      if (section.id && !existingSectionIds.has(section.id)) {
        throw new BadRequestException(
          'One or more section IDs do not belong to this class.',
        );
      }
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.classes.update({
          where: { id },
          data: {
            name,
            code,
            updatedAt: new Date(),
          },
        });

        const submittedIds = sections
          .map((section) => section.id)
          .filter((sectionId): sectionId is string =>
            Boolean(sectionId),
          );

        const removedSections = existingClass.sections.filter(
          (section) => !submittedIds.includes(section.id),
        );

        // Never delete a section that contains enrolled students.
        for (const section of removedSections) {
          const enrolledCount = await tx.student_enrollments.count({
            where: {
              sectionId: section.id,
            },
          });

          if (enrolledCount > 0) {
            throw new ConflictException(
              `Section ${section.name} has ${enrolledCount} enrolled student(s). Move those students before removing this section.`,
            );
          }
        }

        if (removedSections.length > 0) {
          await tx.sections.deleteMany({
            where: {
              classId: id,
              id: {
                in: removedSections.map((section) => section.id),
              },
            },
          });
        }

        for (const section of sections) {
          if (section.id) {
            const enrolledCount = await tx.student_enrollments.count({
              where: {
                sectionId: section.id,
              },
            });

            if (section.capacity < enrolledCount) {
              throw new ConflictException(
                `Section ${section.name} already has ${enrolledCount} enrolled student(s). Capacity cannot be reduced below that number.`,
              );
            }

            await tx.sections.update({
              where: { id: section.id },
              data: {
                name: section.name,
                code: section.code,
                capacity: section.capacity,
                updatedAt: new Date(),
              },
            });
          } else {
            await tx.sections.create({
              data: {
                id: randomUUID(),
                classId: id,
                name: section.name,
                code: section.code,
                capacity: section.capacity,
                updatedAt: new Date(),
              },
            });
          }
        }
      });

      return {
        message: 'Class updated successfully.',
        class: await this.getClassWithSeatCounts(
          institutionId,
          id,
        ),
      };
    } catch (error) {
      this.handlePrismaConflict(error);
    }
  }

  private handlePrismaConflict(error: unknown): never {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    ) {
      throw new ConflictException(
        'A class or section with this code already exists.',
      );
    }

    throw error;
  }
}
