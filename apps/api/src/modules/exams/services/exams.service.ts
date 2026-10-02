import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../../database/prisma.service';

import {
  ExamStatus,
  ResultStatus,
  UserRole,
} from '../../../generated/prisma/enums';

import { CreateExamDto } from '../dto/create-exam.dto';
import { UpdateExamDto } from '../dto/update-exam.dto';
import { CreateResultDto } from '../dto/create-result.dto';
import { UpdateResultDto } from '../dto/update-result.dto';

type AuthUser = {
  userId: string;
  email: string;
  role: UserRole;
  institutionId?: string | null;
};

@Injectable()
export class ExamsService {
  constructor(private readonly prisma: PrismaService) {}

  private requireInstitutionId(user: AuthUser): string {
    if (!user.institutionId) {
      throw new ForbiddenException(
        'Institution access is required.',
      );
    }

    return user.institutionId;
  }

  private canManageExams(role: UserRole): boolean {
    return (
      role === UserRole.HEAD ||
      role === UserRole.TEACHER
    );
  }

  private canManageResults(role: UserRole): boolean {
    return (
      role === UserRole.HEAD ||
      role === UserRole.TEACHER
    );
  }

  private calculateGrade(
    marks: number,
    maxMarks: number,
  ): string {
    if (maxMarks <= 0) {
      return 'N/A';
    }

    const percentage =
      (marks / maxMarks) * 100;

    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C';
    if (percentage >= 40) return 'D';

    return 'F';
  }

  private validateMarks(
    marks: number,
    maxMarks: number,
  ) {
    if (!Number.isFinite(marks)) {
      throw new BadRequestException(
        'Marks must be a valid number.',
      );
    }

    if (!Number.isFinite(maxMarks) || maxMarks <= 0) {
      throw new BadRequestException(
        'Maximum marks must be greater than zero.',
      );
    }

    if (marks < 0) {
      throw new BadRequestException(
        'Marks cannot be negative.',
      );
    }

    if (marks > maxMarks) {
      throw new BadRequestException(
        'Marks cannot be greater than maximum marks.',
      );
    }
  }

  private async validateClassAndSection(
    institutionId: string,
    classId?: string,
    sectionId?: string,
  ) {
    if (classId) {
      const classRecord =
        await this.prisma.class.findFirst({
          where: {
            id: classId,
            institutionId,
          },
        });

      if (!classRecord) {
        throw new NotFoundException(
          'Class not found in this institution.',
        );
      }
    }

    if (sectionId) {
      const section =
        await this.prisma.section.findFirst({
          where: {
            id: sectionId,
            ...(classId ? { classId } : {}),
            class: {
              institutionId,
            },
          },
        });

      if (!section) {
        throw new NotFoundException(
          'Section not found in this institution.',
        );
      }
    }
  }

  // --------------------------------------------------
  // EXAMS
  // --------------------------------------------------

  async createExam(
    user: AuthUser,
    dto: CreateExamDto,
  ) {
    const institutionId =
      this.requireInstitutionId(user);

    if (!this.canManageExams(user.role)) {
      throw new ForbiddenException(
        'You cannot create examinations.',
      );
    }

    if (dto.passingMarks > dto.totalMarks) {
      throw new BadRequestException(
        'Passing marks cannot be greater than total marks.',
      );
    }

    await this.validateClassAndSection(
      institutionId,
      dto.classId,
      dto.sectionId,
    );

    return this.prisma.exam.create({
      data: {
        title: dto.title.trim(),
        description:
          dto.description?.trim() || null,
        examDate: new Date(dto.examDate),
        totalMarks: dto.totalMarks,
        passingMarks: dto.passingMarks,
        status: dto.status ?? ExamStatus.DRAFT,
        institutionId,
        classId: dto.classId ?? null,
        sectionId: dto.sectionId ?? null,
      },
      include: {
        class: true,
        section: true,
        _count: {
          select: {
            results: true,
          },
        },
      },
    });
  }

  async findAllExams(
    user: AuthUser,
    search?: string,
    status?: ExamStatus,
  ) {
    const institutionId =
      this.requireInstitutionId(user);

    const query = search?.trim();

    return this.prisma.exam.findMany({
      where: {
        institutionId,

        ...(status
          ? {
              status,
            }
          : {}),

        ...(query
          ? {
              OR: [
                {
                  title: {
                    contains: query,
                    mode: 'insensitive',
                  },
                },
                {
                  description: {
                    contains: query,
                    mode: 'insensitive',
                  },
                },
                {
                  class: {
                    name: {
                      contains: query,
                      mode: 'insensitive',
                    },
                  },
                },
                {
                  section: {
                    name: {
                      contains: query,
                      mode: 'insensitive',
                    },
                  },
                },
              ],
            }
          : {}),
      },

      orderBy: {
        examDate: 'desc',
      },

      include: {
        class: true,
        section: true,
        _count: {
          select: {
            results: true,
          },
        },
      },
    });
  }

  async findExamById(
    user: AuthUser,
    examId: string,
  ) {
    const institutionId =
      this.requireInstitutionId(user);

    const exam =
      await this.prisma.exam.findFirst({
        where: {
          id: examId,
          institutionId,
        },
        include: {
          class: true,
          section: true,
          results: {
            include: {
              student: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
            orderBy: {
              marks: 'desc',
            },
          },
          _count: {
            select: {
              results: true,
            },
          },
        },
      });

    if (!exam) {
      throw new NotFoundException(
        'Examination not found.',
      );
    }

    if (user.role === UserRole.STUDENT) {
      return {
        ...exam,
        results: exam.results.filter(
          (result) =>
            result.studentId === user.userId,
        ),
      };
    }

    return exam;
  }

  async updateExam(
    user: AuthUser,
    examId: string,
    dto: UpdateExamDto,
  ) {
    const institutionId =
      this.requireInstitutionId(user);

    if (!this.canManageExams(user.role)) {
      throw new ForbiddenException(
        'You cannot update examinations.',
      );
    }

    const existing =
      await this.prisma.exam.findFirst({
        where: {
          id: examId,
          institutionId,
        },
      });

    if (!existing) {
      throw new NotFoundException(
        'Examination not found.',
      );
    }

    const totalMarks =
      dto.totalMarks ?? existing.totalMarks;

    const passingMarks =
      dto.passingMarks ?? existing.passingMarks;

    if (passingMarks > totalMarks) {
      throw new BadRequestException(
        'Passing marks cannot be greater than total marks.',
      );
    }

    await this.validateClassAndSection(
      institutionId,
      dto.classId,
      dto.sectionId,
    );

    return this.prisma.exam.update({
      where: {
        id: examId,
      },

      data: {
        ...(dto.title !== undefined
          ? {
              title: dto.title.trim(),
            }
          : {}),

        ...(dto.description !== undefined
          ? {
              description:
                dto.description?.trim() || null,
            }
          : {}),

        ...(dto.examDate !== undefined
          ? {
              examDate: new Date(
                dto.examDate,
              ),
            }
          : {}),

        ...(dto.totalMarks !== undefined
          ? {
              totalMarks: dto.totalMarks,
            }
          : {}),

        ...(dto.passingMarks !== undefined
          ? {
              passingMarks: dto.passingMarks,
            }
          : {}),

        ...(dto.status !== undefined
          ? {
              status: dto.status,
            }
          : {}),

        ...(dto.classId !== undefined
          ? {
              classId: dto.classId || null,
            }
          : {}),

        ...(dto.sectionId !== undefined
          ? {
              sectionId: dto.sectionId || null,
            }
          : {}),
      },

      include: {
        class: true,
        section: true,
        _count: {
          select: {
            results: true,
          },
        },
      },
    });
  }

  async deleteExam(
    user: AuthUser,
    examId: string,
  ) {
    const institutionId =
      this.requireInstitutionId(user);

    if (user.role !== UserRole.HEAD) {
      throw new ForbiddenException(
        'Only the institution head can delete examinations.',
      );
    }

    const exam =
      await this.prisma.exam.findFirst({
        where: {
          id: examId,
          institutionId,
        },
      });

    if (!exam) {
      throw new NotFoundException(
        'Examination not found.',
      );
    }

    await this.prisma.exam.delete({
      where: {
        id: examId,
      },
    });

    return {
      success: true,
      message: 'Examination deleted successfully.',
    };
  }

  async publishExam(
    user: AuthUser,
    examId: string,
  ) {
    return this.updateExam(
      user,
      examId,
      {
        status: ExamStatus.PUBLISHED,
      },
    );
  }

  async completeExam(
    user: AuthUser,
    examId: string,
  ) {
    return this.updateExam(
      user,
      examId,
      {
        status: ExamStatus.COMPLETED,
      },
    );
  }

  async cancelExam(
    user: AuthUser,
    examId: string,
  ) {
    return this.updateExam(
      user,
      examId,
      {
        status: ExamStatus.CANCELLED,
      },
    );
  }

  // --------------------------------------------------
  // RESULTS
  // --------------------------------------------------

  async createResult(
    user: AuthUser,
    dto: CreateResultDto,
  ) {
    const institutionId =
      this.requireInstitutionId(user);

    if (!this.canManageResults(user.role)) {
      throw new ForbiddenException(
        'You cannot enter examination results.',
      );
    }

    this.validateMarks(
      dto.marks,
      dto.maxMarks,
    );

    const exam =
      await this.prisma.exam.findFirst({
        where: {
          id: dto.examId,
          institutionId,
        },
      });

    if (!exam) {
      throw new NotFoundException(
        'Examination not found.',
      );
    }

    if (
      exam.status === ExamStatus.CANCELLED
    ) {
      throw new BadRequestException(
        'Results cannot be added to a cancelled examination.',
      );
    }

    const student =
      await this.prisma.user.findFirst({
        where: {
          id: dto.studentId,
          institutionId,
          role: UserRole.STUDENT,
        },
      });

    if (!student) {
      throw new NotFoundException(
        'Student not found in this institution.',
      );
    }

    const duplicate =
      await this.prisma.result.findUnique({
        where: {
          examId_studentId: {
            examId: dto.examId,
            studentId: dto.studentId,
          },
        },
      });

    if (duplicate) {
      throw new ConflictException(
        'Result already exists for this student and examination.',
      );
    }

    const grade =
      dto.grade?.trim() ||
      this.calculateGrade(
        dto.marks,
        dto.maxMarks,
      );

    return this.prisma.result.create({
      data: {
        examId: dto.examId,
        studentId: dto.studentId,
        institutionId,
        marks: dto.marks,
        maxMarks: dto.maxMarks,
        grade,
        remarks:
          dto.remarks?.trim() || null,
        status:
          dto.status ?? ResultStatus.DRAFT,
      },

      include: {
        exam: true,
        student: {
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

  async findAllResults(
    user: AuthUser,
    search?: string,
    examId?: string,
    studentId?: string,
    status?: ResultStatus,
  ) {
    const institutionId =
      this.requireInstitutionId(user);

    const query = search?.trim();

    const effectiveStudentId =
      user.role === UserRole.STUDENT
        ? user.userId
        : studentId;

    return this.prisma.result.findMany({
      where: {
        institutionId,

        ...(effectiveStudentId
          ? {
              studentId:
                effectiveStudentId,
            }
          : {}),

        ...(examId
          ? {
              examId,
            }
          : {}),

        ...(status
          ? {
              status,
            }
          : {}),

        ...(query
          ? {
              OR: [
                {
                  grade: {
                    contains: query,
                    mode: 'insensitive',
                  },
                },
                {
                  remarks: {
                    contains: query,
                    mode: 'insensitive',
                  },
                },
                {
                  exam: {
                    title: {
                      contains: query,
                      mode: 'insensitive',
                    },
                  },
                },
                {
                  student: {
                    firstName: {
                      contains: query,
                      mode: 'insensitive',
                    },
                  },
                },
                {
                  student: {
                    lastName: {
                      contains: query,
                      mode: 'insensitive',
                    },
                  },
                },
              ],
            }
          : {}),
      },

      orderBy: [
        {
          updatedAt: 'desc',
        },
      ],

      include: {
        exam: {
          select: {
            id: true,
            title: true,
            examDate: true,
            totalMarks: true,
            passingMarks: true,
            status: true,
          },
        },

        student: {
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

  async findResultById(
    user: AuthUser,
    resultId: string,
  ) {
    const institutionId =
      this.requireInstitutionId(user);

    const result =
      await this.prisma.result.findFirst({
        where: {
          id: resultId,
          institutionId,
        },

        include: {
          exam: true,

          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

    if (!result) {
      throw new NotFoundException(
        'Result not found.',
      );
    }

    if (
      user.role === UserRole.STUDENT &&
      result.studentId !== user.userId
    ) {
      throw new ForbiddenException(
        'You can only access your own result.',
      );
    }

    return result;
  }

  async updateResult(
    user: AuthUser,
    resultId: string,
    dto: UpdateResultDto,
  ) {
    const institutionId =
      this.requireInstitutionId(user);

    if (!this.canManageResults(user.role)) {
      throw new ForbiddenException(
        'You cannot update examination results.',
      );
    }

    const existing =
      await this.prisma.result.findFirst({
        where: {
          id: resultId,
          institutionId,
        },
      });

    if (!existing) {
      throw new NotFoundException(
        'Result not found.',
      );
    }

    const marks =
      dto.marks ?? existing.marks;

    const maxMarks =
      dto.maxMarks ?? existing.maxMarks;

    this.validateMarks(
      marks,
      maxMarks,
    );

    let examId =
      dto.examId ?? existing.examId;

    let studentId =
      dto.studentId ?? existing.studentId;

    if (dto.examId) {
      const exam =
        await this.prisma.exam.findFirst({
          where: {
            id: dto.examId,
            institutionId,
          },
        });

      if (!exam) {
        throw new NotFoundException(
          'Examination not found.',
        );
      }
    }

    if (dto.studentId) {
      const student =
        await this.prisma.user.findFirst({
          where: {
            id: dto.studentId,
            institutionId,
            role: UserRole.STUDENT,
          },
        });

      if (!student) {
        throw new NotFoundException(
          'Student not found in this institution.',
        );
      }
    }

    const duplicate =
      await this.prisma.result.findFirst({
        where: {
          examId,
          studentId,
          NOT: {
            id: resultId,
          },
        },
      });

    if (duplicate) {
      throw new ConflictException(
        'Another result already exists for this student and examination.',
      );
    }

    const grade =
      dto.grade !== undefined
        ? dto.grade?.trim() || null
        : dto.marks !== undefined ||
            dto.maxMarks !== undefined
          ? this.calculateGrade(
              marks,
              maxMarks,
            )
          : existing.grade;

    return this.prisma.result.update({
      where: {
        id: resultId,
      },

      data: {
        ...(dto.examId !== undefined
          ? {
              examId,
            }
          : {}),

        ...(dto.studentId !== undefined
          ? {
              studentId,
            }
          : {}),

        ...(dto.marks !== undefined
          ? {
              marks,
            }
          : {}),

        ...(dto.maxMarks !== undefined
          ? {
              maxMarks,
            }
          : {}),

        ...(dto.grade !== undefined ||
        dto.marks !== undefined ||
        dto.maxMarks !== undefined
          ? {
              grade,
            }
          : {}),

        ...(dto.remarks !== undefined
          ? {
              remarks:
                dto.remarks?.trim() || null,
            }
          : {}),

        ...(dto.status !== undefined
          ? {
              status: dto.status,
            }
          : {}),
      },

      include: {
        exam: true,

        student: {
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

  async deleteResult(
    user: AuthUser,
    resultId: string,
  ) {
    const institutionId =
      this.requireInstitutionId(user);

    if (user.role !== UserRole.HEAD) {
      throw new ForbiddenException(
        'Only the institution head can delete results.',
      );
    }

    const result =
      await this.prisma.result.findFirst({
        where: {
          id: resultId,
          institutionId,
        },
      });

    if (!result) {
      throw new NotFoundException(
        'Result not found.',
      );
    }

    await this.prisma.result.delete({
      where: {
        id: resultId,
      },
    });

    return {
      success: true,
      message: 'Result deleted successfully.',
    };
  }

  async publishResult(
    user: AuthUser,
    resultId: string,
  ) {
    const institutionId =
      this.requireInstitutionId(user);

    if (!this.canManageResults(user.role)) {
      throw new ForbiddenException(
        'You cannot publish results.',
      );
    }

    const result =
      await this.prisma.result.findFirst({
        where: {
          id: resultId,
          institutionId,
        },
      });

    if (!result) {
      throw new NotFoundException(
        'Result not found.',
      );
    }

    return this.prisma.result.update({
      where: {
        id: resultId,
      },

      data: {
        status: ResultStatus.PUBLISHED,
      },

      include: {
        exam: true,

        student: {
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

  async getStudentResultSummary(
    user: AuthUser,
    studentId: string,
  ) {
    const institutionId =
      this.requireInstitutionId(user);

    if (
      user.role === UserRole.STUDENT &&
      studentId !== user.userId
    ) {
      throw new ForbiddenException(
        'You can only access your own result summary.',
      );
    }

    const results =
      await this.prisma.result.findMany({
        where: {
          institutionId,
          studentId,
          status: ResultStatus.PUBLISHED,
        },

        include: {
          exam: {
            select: {
              id: true,
              title: true,
              examDate: true,
              totalMarks: true,
              passingMarks: true,
            },
          },
        },

        orderBy: {
          exam: {
            examDate: 'desc',
          },
        },
      });

    const totalMarks = results.reduce(
      (sum, result) =>
        sum + result.marks,
      0,
    );

    const totalMaxMarks = results.reduce(
      (sum, result) =>
        sum + result.maxMarks,
      0,
    );

    const percentage =
      totalMaxMarks > 0
        ? (totalMarks / totalMaxMarks) * 100
        : 0;

    const passed = results.filter(
      (result) =>
        result.marks >=
        (result.maxMarks *
          0.4),
    ).length;

    return {
      studentId,
      totalExams: results.length,
      passed,
      failed:
        results.length - passed,
      totalMarks,
      totalMaxMarks,
      percentage:
        Number(percentage.toFixed(2)),
      results,
    };
  }
}