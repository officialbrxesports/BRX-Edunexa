
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../../prisma/prisma.service';

export type CreateSubjectInput = {
  name: string;
  type?: 'CORE' | 'OPTIONAL' | 'ADDITIONAL';
  category?: 'THEORY' | 'PRACTICAL' | 'BOTH';
  description?: string;
  classIds?: string[];
};

export type UpdateSubjectInput = {
  name?: string;
  code?: string;
  type?: 'CORE' | 'OPTIONAL' | 'ADDITIONAL';
  category?: 'THEORY' | 'PRACTICAL' | 'BOTH';
  description?: string | null;
  isActive?: boolean;
};

export type AssignSubjectTeacherInput = {
  classId: string;
  sectionId?: string;
  teacherId: string;
  weeklyPeriods?: number;
  theoryPeriods?: number;
  practicalPeriods?: number;
};

@Injectable()
export class SubjectsService {
  constructor(private readonly prisma: PrismaService) {}

  // -----------------------------------------------
  // AUTO GENERATE SUBJECT CODE
  // -----------------------------------------------

  private async generateSubjectCode(
    institutionId: string,
    subjectName: string,
  ): Promise<string> {
    const firstWord = subjectName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .match(/[a-zA-Z]+/)?.[0];

    const prefix = (
      firstWord?.slice(0, 4) || 'SUBJ'
    ).toUpperCase();

    const existingSubjects =
      await this.prisma.subjects.findMany({
        where: {
          institutionId,
          code: {
            startsWith: prefix,
          },
        },
        select: {
          code: true,
        },
      });

    let highestNumber = 0;

    const pattern = new RegExp(`^${prefix}(\\d+)$`);

    for (const subject of existingSubjects) {
      const match = subject.code.match(pattern);

      if (match) {
        highestNumber = Math.max(
          highestNumber,
          Number(match[1]),
        );
      }
    }

    return `${prefix}${String(
      highestNumber + 1,
    ).padStart(3, '0')}`;
  }

  // -----------------------------------------------
  // GET CLASSES
  // -----------------------------------------------

  async findClasses(institutionId: string) {
    return this.prisma.classes.findMany({
      where: { institutionId },
      include: {
        sections: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  // -----------------------------------------------
  // GET ACTIVE TEACHERS
  // -----------------------------------------------

  async findTeachers(institutionId: string) {
    return this.prisma.users.findMany({
      where: {
        institutionId,
        role: 'TEACHER',
        status: 'ACTIVE',
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
      },
      orderBy: {
        firstName: 'asc',
      },
    });
  }

  // -----------------------------------------------
  // CREATE SUBJECT WITH AUTO CODE
  // -----------------------------------------------

  async create(
    institutionId: string,
    input: CreateSubjectInput,
  ) {
    const name = input.name?.trim();

    if (!name) {
      throw new BadRequestException(
        'Subject name is required.',
      );
    }

    const classIds = [
      ...new Set(input.classIds ?? []),
    ];

    // Validate selected classes
    if (classIds.length > 0) {
      const classes =
        await this.prisma.classes.findMany({
          where: {
            institutionId,
            id: {
              in: classIds,
            },
          },
          select: {
            id: true,
          },
        });

      if (classes.length !== classIds.length) {
        throw new BadRequestException(
          'One or more selected classes are invalid.',
        );
      }
    }

    // Retry if simultaneous requests generate same code.
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = await this.generateSubjectCode(
        institutionId,
        name,
      );

      try {
        const subject = await this.prisma.$transaction(
          async (tx) => {
            return tx.subjects.create({
              data: {
                id: randomUUID(),
                institutionId,
                name,
                code,
                type: input.type ?? 'CORE',
                category: input.category ?? 'BOTH',
                description:
                  input.description?.trim() || null,
                updatedAt: new Date(),

                class_subjects:
                  classIds.length > 0
                    ? {
                        create: classIds.map(
                          (classId) => ({
                            id: randomUUID(),
                            classId,
                            updatedAt: new Date(),
                          }),
                        ),
                      }
                    : undefined,
              },
              include: {
                class_subjects: {
                  include: {
                    classes: true,
                  },
                },
              },
            });
          },
        );

        return {
          message: 'Subject created successfully.',
          subject,
        };
      } catch (error) {
        const isUniqueError =
          typeof error === 'object' &&
          error !== null &&
          'code' in error &&
          error.code === 'P2002';

        if (isUniqueError && attempt < 4) {
          continue;
        }

        this.handlePrismaError(error);
      }
    }

    throw new ConflictException(
      'Could not generate a unique subject code. Please try again.',
    );
  }

  // -----------------------------------------------
  // GET ALL SUBJECTS
  // -----------------------------------------------

  async findAll(institutionId: string) {
    return this.prisma.subjects.findMany({
      where: {
        institutionId,
      },
      include: {
        class_subjects: {
          include: {
            classes: true,
          },
        },
        subject_teachers: {
          include: {
            classes: true,
            sections: true,
            users: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // -----------------------------------------------
  // GET SINGLE SUBJECT
  // -----------------------------------------------

  async findOne(
    institutionId: string,
    id: string,
  ) {
    const subject =
      await this.prisma.subjects.findFirst({
        where: {
          id,
          institutionId,
        },
        include: {
          class_subjects: {
            include: {
              classes: true,
            },
          },
          subject_teachers: {
            include: {
              classes: true,
              sections: true,
              users: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
        },
      });

    if (!subject) {
      throw new NotFoundException(
        'Subject not found.',
      );
    }

    return subject;
  }

  // -----------------------------------------------
  // UPDATE SUBJECT
  // -----------------------------------------------

  async update(
    institutionId: string,
    id: string,
    input: UpdateSubjectInput,
  ) {
    const existing =
      await this.prisma.subjects.findFirst({
        where: {
          id,
          institutionId,
        },
      });

    if (!existing) {
      throw new NotFoundException(
        'Subject not found.',
      );
    }

    const name = input.name?.trim();
    const code = input.code?.trim().toUpperCase();

    if (input.name !== undefined && !name) {
      throw new BadRequestException(
        'Subject name cannot be empty.',
      );
    }

    if (input.code !== undefined && !code) {
      throw new BadRequestException(
        'Subject code cannot be empty.',
      );
    }

    if (code) {
      const duplicate =
        await this.prisma.subjects.findFirst({
          where: {
            institutionId,
            code,
            NOT: {
              id,
            },
          },
        });

      if (duplicate) {
        throw new ConflictException(
          'This subject code already exists.',
        );
      }
    }

    try {
      return await this.prisma.subjects.update({
        where: {
          id,
        },
        data: {
          ...(name !== undefined ? { name } : {}),
          ...(code !== undefined ? { code } : {}),
          ...(input.type !== undefined
            ? { type: input.type }
            : {}),
          ...(input.category !== undefined
            ? { category: input.category }
            : {}),
          ...(input.description !== undefined
            ? {
                description:
                  input.description?.trim() || null,
              }
            : {}),
          ...(input.isActive !== undefined
            ? { isActive: input.isActive }
            : {}),
          updatedAt: new Date(),
        },
        include: {
          class_subjects: {
            include: {
              classes: true,
            },
          },
          subject_teachers: true,
        },
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  // -----------------------------------------------
  // ASSIGN TEACHER
  // -----------------------------------------------

  async assignTeacher(
    institutionId: string,
    subjectId: string,
    input: AssignSubjectTeacherInput,
  ) {
    const subject =
      await this.prisma.subjects.findFirst({
        where: {
          id: subjectId,
          institutionId,
        },
      });

    if (!subject) {
      throw new NotFoundException(
        'Subject not found.',
      );
    }

    const classItem =
      await this.prisma.classes.findFirst({
        where: {
          id: input.classId,
          institutionId,
        },
      });

    if (!classItem) {
      throw new BadRequestException(
        'Selected class is invalid.',
      );
    }

    const classSubject =
      await this.prisma.class_subjects.findUnique({
        where: {
          classId_subjectId: {
            classId: input.classId,
            subjectId,
          },
        },
      });

    if (!classSubject) {
      throw new BadRequestException(
        'First assign this subject to the selected class.',
      );
    }

    if (input.sectionId) {
      const section =
        await this.prisma.sections.findFirst({
          where: {
            id: input.sectionId,
            classId: input.classId,
          },
        });

      if (!section) {
        throw new BadRequestException(
          'Selected section does not belong to this class.',
        );
      }
    }

    const teacher =
      await this.prisma.users.findFirst({
        where: {
          id: input.teacherId,
          institutionId,
          role: 'TEACHER',
          status: 'ACTIVE',
        },
      });

    if (!teacher) {
      throw new BadRequestException(
        'Selected teacher is not an active teacher of this institution.',
      );
    }

    const weeklyPeriods =
      input.weeklyPeriods ?? 0;

    const theoryPeriods =
      input.theoryPeriods ?? 0;

    const practicalPeriods =
      input.practicalPeriods ?? 0;

    for (const value of [
      weeklyPeriods,
      theoryPeriods,
      practicalPeriods,
    ]) {
      if (
        !Number.isInteger(value) ||
        value < 0 ||
        value > 100
      ) {
        throw new BadRequestException(
          'Periods must be whole numbers between 0 and 100.',
        );
      }
    }

    if (
      theoryPeriods + practicalPeriods >
      weeklyPeriods
    ) {
      throw new BadRequestException(
        'Theory and practical periods cannot exceed weekly periods.',
      );
    }

    const existingAssignment =
      await this.prisma.subject_teachers.findFirst({
        where: {
          institutionId,
          subjectId,
          classId: input.classId,
          sectionId: input.sectionId ?? null,
          teacherId: input.teacherId,
        },
      });

    if (existingAssignment) {
      return this.prisma.subject_teachers.update({
        where: {
          id: existingAssignment.id,
        },
        data: {
          weeklyPeriods,
          theoryPeriods,
          practicalPeriods,
          updatedAt: new Date(),
        },
      });
    }

    return this.prisma.subject_teachers.create({
      data: {
        id: randomUUID(),
        institutionId,
        subjectId,
        classId: input.classId,
        sectionId: input.sectionId ?? null,
        teacherId: input.teacherId,
        weeklyPeriods,
        theoryPeriods,
        practicalPeriods,
        updatedAt: new Date(),
      },
      include: {
        subjects: true,
        classes: true,
        sections: true,
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  // -----------------------------------------------
  // ASSIGN CLASS
  // -----------------------------------------------

  async assignClass(
    institutionId: string,
    subjectId: string,
    classId: string,
  ) {
    const subject =
      await this.prisma.subjects.findFirst({
        where: {
          id: subjectId,
          institutionId,
        },
      });

    if (!subject) {
      throw new NotFoundException(
        'Subject not found.',
      );
    }

    const classItem =
      await this.prisma.classes.findFirst({
        where: {
          id: classId,
          institutionId,
        },
      });

    if (!classItem) {
      throw new BadRequestException(
        'Selected class is invalid.',
      );
    }

    const existing =
      await this.prisma.class_subjects.findUnique({
        where: {
          classId_subjectId: {
            classId,
            subjectId,
          },
        },
      });

    if (existing) {
      return existing;
    }

    return this.prisma.class_subjects.create({
      data: {
        id: randomUUID(),
        classId,
        subjectId,
        updatedAt: new Date(),
      },
      include: {
        classes: true,
        subjects: true,
      },
    });
  }


  // -----------------------------------------------
  // REMOVE SUBJECT FROM CLASS
  // -----------------------------------------------

  async removeClass(
    institutionId: string,
    subjectId: string,
    classId: string,
  ) {
    const subject = await this.prisma.subjects.findFirst({
      where: { id: subjectId, institutionId },
    });

    if (!subject) {
      throw new NotFoundException('Subject not found.');
    }

    const classItem = await this.prisma.classes.findFirst({
      where: { id: classId, institutionId },
    });

    if (!classItem) {
      throw new BadRequestException('Selected class is invalid.');
    }

    const mapping = await this.prisma.class_subjects.findUnique({
      where: {
        classId_subjectId: { classId, subjectId },
      },
    });

    if (!mapping) {
      throw new NotFoundException(
        'This subject is not assigned to the selected class.',
      );
    }

    // Do not remove a class mapping while teacher assignments
    // still depend on it. Remove those assignments first.
    const teacherAssignments =
      await this.prisma.subject_teachers.count({
        where: {
          institutionId,
          subjectId,
          classId,
        },
      });

    if (teacherAssignments > 0) {
      throw new ConflictException(
        'Remove the teacher assignments for this class first.',
      );
    }

    await this.prisma.class_subjects.deleteMany({
      where: { classId, subjectId },
    });

    return {
      message: 'Subject removed from class successfully.',
    };
  }

  // -----------------------------------------------
  // UPDATE TEACHER ASSIGNMENT
  // -----------------------------------------------

  async updateTeacherAssignment(
    institutionId: string,
    subjectId: string,
    assignmentId: string,
    input: AssignSubjectTeacherInput,
  ) {
    const existing =
      await this.prisma.subject_teachers.findFirst({
        where: {
          id: assignmentId,
          institutionId,
          subjectId,
        },
      });

    if (!existing) {
      throw new NotFoundException(
        'Teacher assignment not found.',
      );
    }

    const classId = input.classId;
    const teacherId = input.teacherId;

    if (!classId || !teacherId) {
      throw new BadRequestException(
        'Class and teacher are required.',
      );
    }

    const classItem = await this.prisma.classes.findFirst({
      where: { id: classId, institutionId },
    });

    if (!classItem) {
      throw new BadRequestException('Selected class is invalid.');
    }

    const classSubject =
      await this.prisma.class_subjects.findUnique({
        where: {
          classId_subjectId: { classId, subjectId },
        },
      });

    if (!classSubject) {
      throw new BadRequestException(
        'First assign this subject to the selected class.',
      );
    }

    const sectionId = input.sectionId ?? null;

    if (sectionId) {
      const section = await this.prisma.sections.findFirst({
        where: { id: sectionId, classId },
      });

      if (!section) {
        throw new BadRequestException(
          'Selected section does not belong to this class.',
        );
      }
    }

    const teacher = await this.prisma.users.findFirst({
      where: {
        id: teacherId,
        institutionId,
        role: 'TEACHER',
        status: 'ACTIVE',
      },
    });

    if (!teacher) {
      throw new BadRequestException(
        'Selected teacher is not an active teacher of this institution.',
      );
    }

    const weeklyPeriods = input.weeklyPeriods ?? 0;
    const theoryPeriods = input.theoryPeriods ?? 0;
    const practicalPeriods = input.practicalPeriods ?? 0;

    for (const value of [
      weeklyPeriods,
      theoryPeriods,
      practicalPeriods,
    ]) {
      if (
        !Number.isInteger(value) ||
        value < 0 ||
        value > 100
      ) {
        throw new BadRequestException(
          'Periods must be whole numbers between 0 and 100.',
        );
      }
    }

    if (theoryPeriods + practicalPeriods > weeklyPeriods) {
      throw new BadRequestException(
        'Theory and practical periods cannot exceed weekly periods.',
      );
    }

    const duplicate =
      await this.prisma.subject_teachers.findFirst({
        where: {
          institutionId,
          subjectId,
          classId,
          sectionId,
          teacherId,
          NOT: { id: assignmentId },
        },
      });

    if (duplicate) {
      throw new ConflictException(
        'This teacher assignment already exists.',
      );
    }

    return this.prisma.subject_teachers.update({
      where: { id: assignmentId },
      data: {
        classId,
        sectionId,
        teacherId,
        weeklyPeriods,
        theoryPeriods,
        practicalPeriods,
        updatedAt: new Date(),
      },
      include: {
        subjects: true,
        classes: true,
        sections: true,
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  // -----------------------------------------------
  // REMOVE TEACHER ASSIGNMENT
  // -----------------------------------------------

  async removeTeacherAssignment(
    institutionId: string,
    subjectId: string,
    assignmentId: string,
  ) {
    const assignment =
      await this.prisma.subject_teachers.findFirst({
        where: {
          id: assignmentId,
          institutionId,
          subjectId,
        },
      });

    if (!assignment) {
      throw new NotFoundException(
        'Teacher assignment not found.',
      );
    }

    await this.prisma.subject_teachers.deleteMany({
      where: {
        id: assignmentId,
        institutionId,
        subjectId,
      },
    });

    return {
      message: 'Teacher assignment removed successfully.',
    };
  }

  
  // -----------------------------------------------
  // PRISMA ERROR HANDLER
  // -----------------------------------------------

  private handlePrismaError(
    error: unknown,
  ): never {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    ) {
      throw new ConflictException(
        'A record with these details already exists.',
      );
    }

    throw error;
  }
}
