import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';

export type TestInput = {
  batchId?: string;
  title?: string;
  subject?: string;
  testDate?: string;
  maxMarks?: number | string;
};

export type ResultRow = {
  studentId?: string;
  marks?: number | string | null;
  absent?: boolean;
};

const round2 = (value: number) => Math.round(value * 100) / 100;

/** Standard competition ranking: equal scores share a rank (1, 2, 2, 4). */
export function rankOf(score: number, allScores: number[]) {
  return 1 + allScores.filter((other) => other > score).length;
}

@Injectable()
export class CoachingTestsService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertCoaching(institutionId: string) {
    const institution = await this.prisma.institutions.findUnique({
      where: { id: institutionId },
      select: { type: true },
    });

    if (!institution || institution.type !== 'COACHING') {
      throw new ForbiddenException(
        'This feature is only available for coaching institutions.',
      );
    }
  }

  private name(first: string, last: string | null) {
    return [first, last].filter(Boolean).join(' ');
  }

  private async findBatch(institutionId: string, batchId: string) {
    const batch = await this.prisma.batches.findFirst({
      where: { id: batchId, institutionId },
      select: { id: true, name: true, code: true },
    });

    if (!batch) {
      throw new NotFoundException('Batch not found.');
    }

    return batch;
  }

  private async findTest(institutionId: string, id: string) {
    const test = await this.prisma.tests.findFirst({
      where: { id, institutionId },
      select: {
        id: true,
        batchId: true,
        title: true,
        subject: true,
        testDate: true,
        maxMarks: true,
        batch: { select: { name: true, code: true } },
      },
    });

    if (!test) {
      throw new NotFoundException('Test not found.');
    }

    return test;
  }

  private parseMax(value: number | string | undefined) {
    const max = Number(value);

    if (!Number.isInteger(max) || max < 1 || max > 1000) {
      throw new BadRequestException(
        'Maximum marks must be a whole number from 1 to 1000.',
      );
    }

    return max;
  }

  private parseDate(value: string | undefined) {
    const parsed = value ? new Date(value) : null;

    if (!parsed || Number.isNaN(parsed.getTime())) {
      throw new BadRequestException('Please enter a valid test date.');
    }

    return parsed;
  }

  private cleanText(value: string | undefined, max: number, label: string) {
    const cleaned = value?.trim() || null;

    if (cleaned && cleaned.length > max) {
      throw new BadRequestException(`${label} is too long.`);
    }

    return cleaned;
  }

  /* ------------------------------- tests ------------------------------- */

  async list(institutionId: string, batchId?: string) {
    await this.assertCoaching(institutionId);

    const rows = await this.prisma.tests.findMany({
      where: { institutionId, ...(batchId ? { batchId } : {}) },
      orderBy: { testDate: 'desc' },
      select: {
        id: true,
        batchId: true,
        title: true,
        subject: true,
        testDate: true,
        maxMarks: true,
        batch: { select: { name: true, code: true } },
        results: {
          select: {
            marks: true,
            absent: true,
            student: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    return rows.map((test) => {
      const scored = test.results.filter(
        (result) => !result.absent && result.marks !== null,
      );
      const total = scored.reduce((sum, result) => sum + (result.marks ?? 0), 0);
      const top = scored.reduce<(typeof scored)[number] | null>(
        (best, result) =>
          !best || (result.marks ?? 0) > (best.marks ?? 0) ? result : best,
        null,
      );

      return {
        id: test.id,
        batchId: test.batchId,
        batchName: test.batch.name,
        batchCode: test.batch.code,
        title: test.title,
        subject: test.subject,
        testDate: test.testDate,
        maxMarks: test.maxMarks,
        appeared: scored.length,
        absent: test.results.filter((result) => result.absent).length,
        average: scored.length > 0 ? round2(total / scored.length) : null,
        topper: top
          ? {
              name: this.name(top.student.firstName, top.student.lastName),
              marks: top.marks,
            }
          : null,
      };
    });
  }

  async create(institutionId: string, input: TestInput) {
    await this.assertCoaching(institutionId);

    if (!input.batchId) {
      throw new BadRequestException('Please choose a batch.');
    }

    const title = this.cleanText(input.title, 120, 'Title');

    if (!title) {
      throw new BadRequestException('Test title is required.');
    }

    await this.findBatch(institutionId, input.batchId);

    const created = await this.prisma.tests.create({
      data: {
        id: randomUUID(),
        institutionId,
        batchId: input.batchId,
        title,
        subject: this.cleanText(input.subject, 80, 'Subject'),
        testDate: this.parseDate(input.testDate),
        maxMarks: this.parseMax(input.maxMarks),
        updatedAt: new Date(),
      },
      select: { id: true },
    });

    return created;
  }

  async update(institutionId: string, id: string, input: TestInput) {
    await this.assertCoaching(institutionId);
    const existing = await this.findTest(institutionId, id);

    const data: {
      title?: string;
      subject?: string | null;
      testDate?: Date;
      maxMarks?: number;
      updatedAt: Date;
    } = { updatedAt: new Date() };

    if (input.title !== undefined) {
      const title = this.cleanText(input.title, 120, 'Title');

      if (!title) {
        throw new BadRequestException('Test title is required.');
      }

      data.title = title;
    }

    if (input.subject !== undefined) {
      data.subject = this.cleanText(input.subject, 80, 'Subject');
    }

    if (input.testDate !== undefined) {
      data.testDate = this.parseDate(input.testDate);
    }

    if (input.maxMarks !== undefined) {
      const max = this.parseMax(input.maxMarks);
      const tooHigh = await this.prisma.test_results.count({
        where: { testId: existing.id, marks: { gt: max } },
      });

      if (tooHigh > 0) {
        throw new BadRequestException(
          'Some saved marks are higher than this maximum. Fix those marks first.',
        );
      }

      data.maxMarks = max;
    }

    await this.prisma.tests.update({ where: { id: existing.id }, data });

    return { id: existing.id };
  }

  async remove(institutionId: string, id: string) {
    await this.assertCoaching(institutionId);
    const existing = await this.findTest(institutionId, id);

    await this.prisma.tests.delete({ where: { id: existing.id } });

    return { id: existing.id, deleted: true };
  }

  /* ------------------------------ marks sheet ------------------------------ */

  async sheet(institutionId: string, id: string) {
    await this.assertCoaching(institutionId);
    const test = await this.findTest(institutionId, id);

    const [members, results] = await Promise.all([
      this.prisma.batch_students.findMany({
        where: { batchId: test.batchId, institutionId },
        select: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              brxUid: true,
              status: true,
            },
          },
        },
      }),
      this.prisma.test_results.findMany({
        where: { testId: test.id },
        select: { studentId: true, marks: true, absent: true },
      }),
    ]);

    const byStudent = new Map(results.map((row) => [row.studentId, row]));

    const students = members
      .filter((member) => member.student.status === 'ACTIVE')
      .map((member) => {
        const saved = byStudent.get(member.student.id);

        return {
          id: member.student.id,
          name: this.name(member.student.firstName, member.student.lastName),
          brxUid: member.student.brxUid,
          marks: saved?.marks ?? null,
          absent: saved?.absent ?? false,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    return {
      test: {
        id: test.id,
        title: test.title,
        subject: test.subject,
        testDate: test.testDate,
        maxMarks: test.maxMarks,
        batchName: test.batch.name,
        batchCode: test.batch.code,
      },
      students,
    };
  }

  async saveResults(institutionId: string, id: string, rows: ResultRow[]) {
    await this.assertCoaching(institutionId);
    const test = await this.findTest(institutionId, id);

    if (!Array.isArray(rows) || rows.length > 500) {
      throw new BadRequestException('Invalid marks list.');
    }

    const members = await this.prisma.batch_students.findMany({
      where: { batchId: test.batchId, institutionId },
      select: { studentId: true },
    });
    const allowed = new Set(members.map((member) => member.studentId));

    const clean = new Map<
      string,
      { marks: number | null; absent: boolean } | 'clear'
    >();

    for (const row of rows) {
      if (!row.studentId || !allowed.has(row.studentId)) {
        throw new BadRequestException(
          'A student in the list does not belong to this batch.',
        );
      }

      if (row.absent) {
        clean.set(row.studentId, { marks: null, absent: true });
        continue;
      }

      if (row.marks === null || row.marks === undefined || row.marks === '') {
        clean.set(row.studentId, 'clear');
        continue;
      }

      const marks = Number(row.marks);

      if (!Number.isFinite(marks) || marks < 0 || marks > test.maxMarks) {
        throw new BadRequestException(
          `Marks must be between 0 and ${test.maxMarks}.`,
        );
      }

      clean.set(row.studentId, { marks: round2(marks), absent: false });
    }

    const existing = await this.prisma.test_results.findMany({
      where: { testId: test.id, studentId: { in: [...clean.keys()] } },
      select: { id: true, studentId: true },
    });
    const existingByStudent = new Map(
      existing.map((row) => [row.studentId, row.id]),
    );

    const now = new Date();
    const operations = [];

    for (const [studentId, value] of clean) {
      const existingId = existingByStudent.get(studentId);

      if (value === 'clear') {
        if (existingId) {
          operations.push(
            this.prisma.test_results.delete({ where: { id: existingId } }),
          );
        }

        continue;
      }

      if (existingId) {
        operations.push(
          this.prisma.test_results.update({
            where: { id: existingId },
            data: { marks: value.marks, absent: value.absent, updatedAt: now },
          }),
        );
      } else {
        operations.push(
          this.prisma.test_results.create({
            data: {
              id: randomUUID(),
              institutionId,
              testId: test.id,
              studentId,
              marks: value.marks,
              absent: value.absent,
              updatedAt: now,
            },
          }),
        );
      }
    }

    await this.prisma.$transaction(operations);

    return { saved: operations.length };
  }

  /* ------------------------------ leaderboard ------------------------------ */

  async leaderboard(institutionId: string, batchId: string) {
    await this.assertCoaching(institutionId);
    const batch = await this.findBatch(institutionId, batchId);

    const results = await this.prisma.test_results.findMany({
      where: {
        institutionId,
        absent: false,
        marks: { not: null },
        test: { batchId: batch.id },
      },
      select: {
        marks: true,
        test: { select: { maxMarks: true } },
        student: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    const totals = new Map<
      string,
      { name: string; tests: number; marks: number; max: number }
    >();

    for (const row of results) {
      const entry = totals.get(row.student.id) ?? {
        name: this.name(row.student.firstName, row.student.lastName),
        tests: 0,
        marks: 0,
        max: 0,
      };

      entry.tests += 1;
      entry.marks += row.marks ?? 0;
      entry.max += row.test.maxMarks;
      totals.set(row.student.id, entry);
    }

    const rows = [...totals.entries()].map(([studentId, entry]) => ({
      studentId,
      name: entry.name,
      tests: entry.tests,
      marks: round2(entry.marks),
      maxMarks: entry.max,
      percent: entry.max > 0 ? round2((entry.marks / entry.max) * 100) : 0,
    }));
    const percents = rows.map((row) => row.percent);

    return {
      batch: { id: batch.id, name: batch.name, code: batch.code },
      rows: rows
        .map((row) => ({ ...row, rank: rankOf(row.percent, percents) }))
        .sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name)),
    };
  }
}
