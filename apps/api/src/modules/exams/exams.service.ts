import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';

export type ExamInput = {
  title?: string;
  description?: string;
  examDate?: string;
  totalMarks?: number | string;
  passingMarks?: number | string;
  classId?: string;
  sectionId?: string | null;
};

export type ResultRow = {
  studentId?: string;
  marks?: number | string | null;
};

const STATUSES = ['DRAFT', 'PUBLISHED', 'COMPLETED', 'CANCELLED'] as const;
type ExamStatusName = (typeof STATUSES)[number];

const round2 = (value: number) => Math.round(value * 100) / 100;

/** Standard competition ranking: equal scores share a rank (1, 2, 2, 4). */
const rankOf = (score: number, all: number[]) =>
  1 + all.filter((other) => other > score).length;

export function gradeFor(percent: number) {
  if (percent >= 90) return 'A+';
  if (percent >= 80) return 'A';
  if (percent >= 70) return 'B+';
  if (percent >= 60) return 'B';
  if (percent >= 50) return 'C';
  if (percent >= 40) return 'D';

  return 'F';
}

@Injectable()
export class ExamsService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertSchool(institutionId: string) {
    const institution = await this.prisma.institutions.findUnique({
      where: { id: institutionId },
      select: { type: true },
    });

    if (!institution || institution.type !== 'SCHOOL') {
      throw new ForbiddenException(
        'Exams and ranks are available for schools only.',
      );
    }
  }

  private name(first: string, last: string | null) {
    return [first, last].filter(Boolean).join(' ');
  }

  private cleanText(value: string | undefined | null, max: number, label: string) {
    const cleaned = value?.trim() || null;

    if (cleaned && cleaned.length > max) {
      throw new BadRequestException(`${label} is too long.`);
    }

    return cleaned;
  }

  private parseMarks(value: unknown, label: string, min: number, max: number) {
    const parsed = Number(value);

    if (value === '' || value === null || !Number.isFinite(parsed)) {
      throw new BadRequestException(`Please enter a valid ${label}.`);
    }

    if (parsed < min || parsed > max) {
      throw new BadRequestException(`${label} must be between ${min} and ${max}.`);
    }

    return round2(parsed);
  }

  private parseDate(value?: string) {
    const parsed = value ? new Date(value) : null;

    if (!parsed || Number.isNaN(parsed.getTime())) {
      throw new BadRequestException('Please enter a valid exam date.');
    }

    return parsed;
  }

  private async findExam(institutionId: string, id: string) {
    const exam = await this.prisma.exams.findFirst({
      where: { id, institutionId },
      select: {
        id: true,
        title: true,
        description: true,
        examDate: true,
        totalMarks: true,
        passingMarks: true,
        status: true,
        classId: true,
        sectionId: true,
        classes: { select: { name: true } },
        sections: { select: { name: true } },
      },
    });

    if (!exam) {
      throw new NotFoundException('Exam not found.');
    }

    return exam;
  }

  private async checkClassAndSection(
    institutionId: string,
    classId: string | undefined,
    sectionId: string | null | undefined,
  ) {
    if (!classId) {
      throw new BadRequestException('Please choose a class.');
    }

    const found = await this.prisma.classes.findFirst({
      where: { id: classId, institutionId },
      select: { id: true },
    });

    if (!found) {
      throw new NotFoundException('Class not found.');
    }

    if (sectionId) {
      const section = await this.prisma.sections.findFirst({
        where: { id: sectionId, classId },
        select: { id: true },
      });

      if (!section) {
        throw new BadRequestException('That section does not belong to the class.');
      }
    }
  }

  /** Active students of the exam's class (and section, when it has one). */
  private async studentsOf(
    institutionId: string,
    exam: { classId: string | null; sectionId: string | null },
  ) {
    if (!exam.classId) return [];

    const rows = await this.prisma.student_enrollments.findMany({
      where: {
        classId: exam.classId,
        ...(exam.sectionId ? { sectionId: exam.sectionId } : {}),
        users: { institutionId, role: 'STUDENT', status: 'ACTIVE' },
      },
      select: {
        sections: { select: { name: true } },
        users: {
          select: { id: true, firstName: true, lastName: true, brxUid: true },
        },
      },
    });

    return rows
      .map((row) => ({
        id: row.users.id,
        name: this.name(row.users.firstName, row.users.lastName),
        brxUid: row.users.brxUid,
        section: row.sections.name,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  /* -------------------------------- exams -------------------------------- */

  async list(institutionId: string, classId?: string) {
    await this.assertSchool(institutionId);

    const rows = await this.prisma.exams.findMany({
      where: { institutionId, ...(classId ? { classId } : {}) },
      orderBy: { examDate: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        examDate: true,
        totalMarks: true,
        passingMarks: true,
        status: true,
        classId: true,
        sectionId: true,
        classes: { select: { name: true } },
        sections: { select: { name: true } },
        results: {
          select: {
            marks: true,
            users: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    return rows.map((exam) => {
      const total = exam.results.reduce((sum, row) => sum + row.marks, 0);
      const top = exam.results.reduce<(typeof exam.results)[number] | null>(
        (best, row) => (!best || row.marks > best.marks ? row : best),
        null,
      );
      const passed = exam.results.filter(
        (row) => row.marks >= exam.passingMarks,
      ).length;

      return {
        id: exam.id,
        title: exam.title,
        description: exam.description,
        examDate: exam.examDate,
        totalMarks: exam.totalMarks,
        passingMarks: exam.passingMarks,
        status: exam.status,
        classId: exam.classId,
        sectionId: exam.sectionId,
        className: exam.classes?.name ?? null,
        sectionName: exam.sections?.name ?? null,
        appeared: exam.results.length,
        passed,
        average:
          exam.results.length > 0 ? round2(total / exam.results.length) : null,
        topper: top
          ? {
              name: this.name(top.users.firstName, top.users.lastName),
              marks: top.marks,
            }
          : null,
      };
    });
  }

  async create(institutionId: string, input: ExamInput) {
    await this.assertSchool(institutionId);

    const title = this.cleanText(input.title, 120, 'Title');

    if (!title) {
      throw new BadRequestException('Exam title is required.');
    }

    await this.checkClassAndSection(institutionId, input.classId, input.sectionId);

    const totalMarks = this.parseMarks(input.totalMarks, 'total marks', 1, 1000);
    const passingMarks = this.parseMarks(
      input.passingMarks ?? 0,
      'passing marks',
      0,
      totalMarks,
    );

    return this.prisma.exams.create({
      data: {
        id: randomUUID(),
        institutionId,
        title,
        description: this.cleanText(input.description, 500, 'Description'),
        examDate: this.parseDate(input.examDate),
        totalMarks: Math.round(totalMarks),
        passingMarks: Math.round(passingMarks),
        classId: input.classId,
        sectionId: input.sectionId || null,
        updatedAt: new Date(),
      },
      select: { id: true },
    });
  }

  async update(institutionId: string, id: string, input: ExamInput) {
    await this.assertSchool(institutionId);

    const exam = await this.findExam(institutionId, id);
    const data: {
      title?: string;
      description?: string | null;
      examDate?: Date;
      totalMarks?: number;
      passingMarks?: number;
      updatedAt: Date;
    } = { updatedAt: new Date() };

    if (input.title !== undefined) {
      const title = this.cleanText(input.title, 120, 'Title');

      if (!title) {
        throw new BadRequestException('Exam title is required.');
      }

      data.title = title;
    }

    if (input.description !== undefined) {
      data.description = this.cleanText(input.description, 500, 'Description');
    }

    if (input.examDate !== undefined) {
      data.examDate = this.parseDate(input.examDate);
    }

    const total =
      input.totalMarks !== undefined
        ? Math.round(this.parseMarks(input.totalMarks, 'total marks', 1, 1000))
        : exam.totalMarks;
    const passing =
      input.passingMarks !== undefined
        ? Math.round(this.parseMarks(input.passingMarks, 'passing marks', 0, total))
        : exam.passingMarks;

    if (passing > total) {
      throw new BadRequestException('Passing marks cannot be more than total marks.');
    }

    if (total !== exam.totalMarks) {
      const tooHigh = await this.prisma.results.count({
        where: { examId: exam.id, marks: { gt: total } },
      });

      if (tooHigh > 0) {
        throw new BadRequestException(
          'Some saved marks are higher than this total. Fix those marks first.',
        );
      }
    }

    data.totalMarks = total;
    data.passingMarks = passing;

    await this.prisma.$transaction([
      this.prisma.exams.update({ where: { id: exam.id }, data }),
      this.prisma.results.updateMany({
        where: { examId: exam.id },
        data: { maxMarks: total, updatedAt: new Date() },
      }),
    ]);

    return { id: exam.id };
  }

  async setStatus(institutionId: string, id: string, status?: string) {
    await this.assertSchool(institutionId);

    if (!status || !STATUSES.includes(status as ExamStatusName)) {
      throw new BadRequestException('Invalid exam status.');
    }

    const exam = await this.findExam(institutionId, id);
    const visible = status === 'PUBLISHED' || status === 'COMPLETED';

    await this.prisma.$transaction([
      this.prisma.exams.update({
        where: { id: exam.id },
        data: { status: status as ExamStatusName, updatedAt: new Date() },
      }),
      this.prisma.results.updateMany({
        where: { examId: exam.id },
        data: { status: visible ? 'PUBLISHED' : 'DRAFT', updatedAt: new Date() },
      }),
    ]);

    return { id: exam.id, status };
  }

  async remove(institutionId: string, id: string) {
    await this.assertSchool(institutionId);

    const exam = await this.findExam(institutionId, id);

    await this.prisma.exams.delete({ where: { id: exam.id } });

    return { id: exam.id, deleted: true };
  }

  /* ------------------------------ marks sheet ------------------------------ */

  async sheet(institutionId: string, id: string) {
    await this.assertSchool(institutionId);

    const exam = await this.findExam(institutionId, id);
    const [students, results] = await Promise.all([
      this.studentsOf(institutionId, exam),
      this.prisma.results.findMany({
        where: { examId: exam.id },
        select: { studentId: true, marks: true },
      }),
    ]);
    const byStudent = new Map(results.map((row) => [row.studentId, row.marks]));

    return {
      exam: {
        id: exam.id,
        title: exam.title,
        examDate: exam.examDate,
        totalMarks: exam.totalMarks,
        passingMarks: exam.passingMarks,
        status: exam.status,
        className: exam.classes?.name ?? null,
        sectionName: exam.sections?.name ?? null,
      },
      students: students.map((student) => ({
        ...student,
        marks: byStudent.get(student.id) ?? null,
      })),
    };
  }

  async saveResults(institutionId: string, id: string, rows: ResultRow[]) {
    await this.assertSchool(institutionId);

    const exam = await this.findExam(institutionId, id);

    if (!Array.isArray(rows) || rows.length > 500) {
      throw new BadRequestException('Invalid marks list.');
    }

    const allowed = new Set(
      (await this.studentsOf(institutionId, exam)).map((student) => student.id),
    );
    const clean = new Map<string, number | 'clear'>();

    for (const row of rows) {
      if (!row.studentId || !allowed.has(row.studentId)) {
        throw new BadRequestException(
          'A student in the list does not belong to this exam.',
        );
      }

      if (row.marks === null || row.marks === undefined || row.marks === '') {
        clean.set(row.studentId, 'clear');
        continue;
      }

      const marks = Number(row.marks);

      if (!Number.isFinite(marks) || marks < 0 || marks > exam.totalMarks) {
        throw new BadRequestException(
          `Marks must be between 0 and ${exam.totalMarks}.`,
        );
      }

      clean.set(row.studentId, round2(marks));
    }

    const existing = await this.prisma.results.findMany({
      where: { examId: exam.id, studentId: { in: [...clean.keys()] } },
      select: { id: true, studentId: true },
    });
    const existingByStudent = new Map(
      existing.map((row) => [row.studentId, row.id]),
    );
    const status =
      exam.status === 'PUBLISHED' || exam.status === 'COMPLETED'
        ? 'PUBLISHED'
        : 'DRAFT';
    const now = new Date();
    const operations = [];

    for (const [studentId, value] of clean) {
      const existingId = existingByStudent.get(studentId);

      if (value === 'clear') {
        if (existingId) {
          operations.push(this.prisma.results.delete({ where: { id: existingId } }));
        }

        continue;
      }

      const percent = (value / exam.totalMarks) * 100;
      const grade = value >= exam.passingMarks ? gradeFor(percent) : 'F';

      if (existingId) {
        operations.push(
          this.prisma.results.update({
            where: { id: existingId },
            data: {
              marks: value,
              maxMarks: exam.totalMarks,
              grade,
              status,
              updatedAt: now,
            },
          }),
        );
      } else {
        operations.push(
          this.prisma.results.create({
            data: {
              id: randomUUID(),
              institutionId,
              examId: exam.id,
              studentId,
              marks: value,
              maxMarks: exam.totalMarks,
              grade,
              status,
              updatedAt: now,
            },
          }),
        );
      }
    }

    await this.prisma.$transaction(operations);

    return { saved: operations.length };
  }

  /* -------------------------------- rankings -------------------------------- */

  async rankList(institutionId: string, id: string) {
    await this.assertSchool(institutionId);

    const exam = await this.findExam(institutionId, id);
    const results = await this.prisma.results.findMany({
      where: { examId: exam.id },
      select: {
        marks: true,
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            brxUid: true,
            student_enrollments: {
              where: exam.classId ? { classId: exam.classId } : undefined,
              take: 1,
              select: { sections: { select: { name: true } } },
            },
          },
        },
      },
    });

    const scores = results.map((row) => row.marks);
    const rows = results
      .map((row) => {
        const percent = round2((row.marks / exam.totalMarks) * 100);
        const pass = row.marks >= exam.passingMarks;

        return {
          rank: rankOf(row.marks, scores),
          studentId: row.users.id,
          name: this.name(row.users.firstName, row.users.lastName),
          brxUid: row.users.brxUid,
          section: row.users.student_enrollments[0]?.sections.name ?? null,
          marks: row.marks,
          percent,
          grade: pass ? gradeFor(percent) : 'F',
          pass,
        };
      })
      .sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name));

    const passed = rows.filter((row) => row.pass).length;

    return {
      exam: {
        id: exam.id,
        title: exam.title,
        examDate: exam.examDate,
        totalMarks: exam.totalMarks,
        passingMarks: exam.passingMarks,
        status: exam.status,
        className: exam.classes?.name ?? null,
        sectionName: exam.sections?.name ?? null,
      },
      summary: {
        appeared: rows.length,
        passed,
        failed: rows.length - passed,
        passPercent: rows.length ? round2((passed / rows.length) * 100) : null,
        average: rows.length
          ? round2(scores.reduce((sum, value) => sum + value, 0) / rows.length)
          : null,
        highest: rows.length ? Math.max(...scores) : null,
        lowest: rows.length ? Math.min(...scores) : null,
      },
      rows,
    };
  }

  /** Overall ranking of a class across all of its exams. */
  async classRanking(institutionId: string, classId: string, sectionId?: string) {
    await this.assertSchool(institutionId);
    await this.checkClassAndSection(institutionId, classId, sectionId);

    const results = await this.prisma.results.findMany({
      where: {
        institutionId,
        exams: { classId, status: { not: 'CANCELLED' } },
        users: {
          student_enrollments: {
            some: { classId, ...(sectionId ? { sectionId } : {}) },
          },
        },
      },
      select: {
        marks: true,
        maxMarks: true,
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            brxUid: true,
            student_enrollments: {
              where: { classId },
              take: 1,
              select: { sections: { select: { name: true } } },
            },
          },
        },
      },
    });

    const totals = new Map<
      string,
      {
        name: string;
        brxUid: string;
        section: string | null;
        exams: number;
        marks: number;
        max: number;
      }
    >();

    for (const row of results) {
      const entry = totals.get(row.users.id) ?? {
        name: this.name(row.users.firstName, row.users.lastName),
        brxUid: row.users.brxUid,
        section: row.users.student_enrollments[0]?.sections.name ?? null,
        exams: 0,
        marks: 0,
        max: 0,
      };

      entry.exams += 1;
      entry.marks += row.marks;
      entry.max += row.maxMarks;
      totals.set(row.users.id, entry);
    }

    const rows = [...totals.entries()].map(([studentId, entry]) => {
      const percent = entry.max > 0 ? round2((entry.marks / entry.max) * 100) : 0;

      return {
        studentId,
        name: entry.name,
        brxUid: entry.brxUid,
        section: entry.section,
        exams: entry.exams,
        marks: round2(entry.marks),
        maxMarks: round2(entry.max),
        percent,
        grade: gradeFor(percent),
      };
    });
    const percents = rows.map((row) => row.percent);

    return {
      rows: rows
        .map((row) => ({ ...row, rank: rankOf(row.percent, percents) }))
        .sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name)),
    };
  }
}
