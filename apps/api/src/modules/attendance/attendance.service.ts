import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';

export type AttendanceRow = { studentId?: string; status?: string | null };

const STATUSES = ['PRESENT', 'ABSENT', 'LATE'] as const;
type Status = (typeof STATUSES)[number];

type Mode = 'SECTION' | 'BATCH';

/** "2026-11-15" -> that day at 00:00 UTC. Rejects bad and far-future dates. */
export function parseDay(value: string | undefined) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new BadRequestException('Please choose a valid date.');
  }

  const day = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(day.getTime()) || day.toISOString().slice(0, 10) !== value) {
    throw new BadRequestException('Please choose a valid date.');
  }

  const now = new Date();
  // +1 day so a user ahead of UTC (like India) can still mark "today".
  const limit =
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) +
    24 * 60 * 60 * 1000;

  if (day.getTime() > limit) {
    throw new BadRequestException('Attendance cannot be marked for a future date.');
  }

  return day;
}

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  private async mode(institutionId: string): Promise<Mode> {
    const institution = await this.prisma.institutions.findUnique({
      where: { id: institutionId },
      select: { type: true },
    });

    if (institution?.type === 'SCHOOL') return 'SECTION';
    if (institution?.type === 'COACHING') return 'BATCH';

    throw new ForbiddenException(
      'Attendance is not available yet for this institution type.',
    );
  }

  private name(first: string, last: string | null) {
    return [first, last].filter(Boolean).join(' ');
  }

  /* ------------------------------- groups ------------------------------- */

  async groups(institutionId: string) {
    const mode = await this.mode(institutionId);

    if (mode === 'SECTION') {
      const sections = await this.prisma.sections.findMany({
        where: { classes: { institutionId } },
        orderBy: [{ classes: { name: 'asc' } }, { name: 'asc' }],
        select: { id: true, name: true, classes: { select: { name: true } } },
      });

      return {
        mode,
        groups: sections.map((section) => ({
          id: section.id,
          label: `${section.classes.name} - ${section.name}`,
        })),
      };
    }

    const batches = await this.prisma.batches.findMany({
      where: { institutionId, status: 'ACTIVE' },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, code: true },
    });

    return {
      mode,
      groups: batches.map((batch) => ({
        id: batch.id,
        label: `${batch.name} (${batch.code})`,
      })),
    };
  }

  /** Students of one section / batch, only after proving it is ours. */
  private async roster(institutionId: string, mode: Mode, groupId: string) {
    if (mode === 'SECTION') {
      const section = await this.prisma.sections.findFirst({
        where: { id: groupId, classes: { institutionId } },
        select: { id: true, classId: true },
      });

      if (!section) throw new NotFoundException('Section not found.');

      const rows = await this.prisma.student_enrollments.findMany({
        where: {
          sectionId: section.id,
          users: { institutionId, role: 'STUDENT', status: 'ACTIVE' },
        },
        select: {
          users: {
            select: { id: true, firstName: true, lastName: true, brxUid: true },
          },
        },
      });

      return {
        classId: section.classId,
        students: rows.map((row) => row.users),
      };
    }

    const batch = await this.prisma.batches.findFirst({
      where: { id: groupId, institutionId },
      select: { id: true },
    });

    if (!batch) throw new NotFoundException('Batch not found.');

    const rows = await this.prisma.batch_students.findMany({
      where: { batchId: batch.id, institutionId, student: { status: 'ACTIVE' } },
      select: {
        student: {
          select: { id: true, firstName: true, lastName: true, brxUid: true },
        },
      },
    });

    return { classId: null, students: rows.map((row) => row.student) };
  }

  /* --------------------------- teacher access --------------------------- */

  /** The sections / batches this teacher is assigned to, and nothing else. */
  async teacherGroupIds(institutionId: string, teacherId: string) {
    const mode = await this.mode(institutionId);
    const ids = new Set<string>();

    if (mode === 'BATCH') {
      const rows = await this.prisma.batch_teachers.findMany({
        where: { institutionId, teacherId },
        select: { batchId: true },
      });

      rows.forEach((row) => ids.add(row.batchId));
      return ids;
    }

    const rows = await this.prisma.subject_teachers.findMany({
      where: { institutionId, teacherId },
      select: { classId: true, sectionId: true },
    });
    const wholeClasses: string[] = [];

    for (const row of rows) {
      if (row.sectionId) ids.add(row.sectionId);
      else wholeClasses.push(row.classId);
    }

    if (wholeClasses.length > 0) {
      const sections = await this.prisma.sections.findMany({
        where: { classId: { in: wholeClasses }, classes: { institutionId } },
        select: { id: true },
      });

      sections.forEach((section) => ids.add(section.id));
    }

    return ids;
  }

  async teacherGroups(institutionId: string, teacherId: string) {
    const [data, ids] = await Promise.all([
      this.groups(institutionId),
      this.teacherGroupIds(institutionId, teacherId),
    ]);

    return {
      mode: data.mode,
      groups: data.groups.filter((group) => ids.has(group.id)),
    };
  }

  async assertTeacherGroup(
    institutionId: string,
    teacherId: string,
    groupId?: string,
  ) {
    const ids = await this.teacherGroupIds(institutionId, teacherId);

    if (!groupId || !ids.has(groupId)) {
      throw new ForbiddenException(
        'You can only take attendance for your own classes or batches.',
      );
    }
  }

  /* -------------------------------- sheet -------------------------------- */

  async sheet(institutionId: string, groupId?: string, dateText?: string) {
    const mode = await this.mode(institutionId);

    if (!groupId) throw new BadRequestException('Please choose a group.');

    const date = parseDay(dateText);
    const { students } = await this.roster(institutionId, mode, groupId);

    const saved =
      mode === 'SECTION'
        ? await this.prisma.attendance.findMany({
            where: { sectionId: groupId, date },
            select: { studentId: true, status: true },
          })
        : await this.prisma.batch_attendance.findMany({
            where: { batchId: groupId, date },
            select: { studentId: true, status: true },
          });
    const byStudent = new Map(saved.map((row) => [row.studentId, row.status]));

    return {
      mode,
      date: dateText,
      students: students
        .map((student) => ({
          id: student.id,
          name: this.name(student.firstName, student.lastName),
          brxUid: student.brxUid,
          status: byStudent.get(student.id) ?? null,
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    };
  }

  async save(
    institutionId: string,
    markedBy: string,
    groupId: string | undefined,
    dateText: string | undefined,
    records: AttendanceRow[],
  ) {
    const mode = await this.mode(institutionId);

    if (!groupId) throw new BadRequestException('Please choose a group.');

    const date = parseDay(dateText);

    if (!Array.isArray(records) || records.length > 500) {
      throw new BadRequestException('Invalid attendance list.');
    }

    const { classId, students } = await this.roster(
      institutionId,
      mode,
      groupId,
    );
    const allowed = new Set(students.map((student) => student.id));

    const clean = new Map<string, Status | 'clear'>();

    for (const row of records) {
      if (!row.studentId || !allowed.has(row.studentId)) {
        throw new BadRequestException(
          'A student in the list does not belong to this group.',
        );
      }

      if (!row.status) {
        clean.set(row.studentId, 'clear');
        continue;
      }

      if (!(STATUSES as readonly string[]).includes(row.status)) {
        throw new BadRequestException('Invalid attendance status.');
      }

      clean.set(row.studentId, row.status as Status);
    }

    const ids = [...clean.keys()];
    const now = new Date();
    const operations = [];

    if (mode === 'SECTION') {
      const existing = await this.prisma.attendance.findMany({
        where: { sectionId: groupId, date, studentId: { in: ids } },
        select: { id: true, studentId: true },
      });
      const existingBy = new Map(existing.map((row) => [row.studentId, row.id]));

      for (const [studentId, value] of clean) {
        const existingId = existingBy.get(studentId);

        if (value === 'clear') {
          if (existingId) {
            operations.push(
              this.prisma.attendance.delete({ where: { id: existingId } }),
            );
          }
        } else if (existingId) {
          operations.push(
            this.prisma.attendance.update({
              where: { id: existingId },
              data: { status: value, markedBy, updatedAt: now },
            }),
          );
        } else {
          operations.push(
            this.prisma.attendance.create({
              data: {
                id: randomUUID(),
                studentId,
                classId: classId as string,
                sectionId: groupId,
                markedBy,
                date,
                status: value,
                updatedAt: now,
              },
            }),
          );
        }
      }
    } else {
      const existing = await this.prisma.batch_attendance.findMany({
        where: { batchId: groupId, date, studentId: { in: ids } },
        select: { id: true, studentId: true },
      });
      const existingBy = new Map(existing.map((row) => [row.studentId, row.id]));

      for (const [studentId, value] of clean) {
        const existingId = existingBy.get(studentId);

        if (value === 'clear') {
          if (existingId) {
            operations.push(
              this.prisma.batch_attendance.delete({ where: { id: existingId } }),
            );
          }
        } else if (existingId) {
          operations.push(
            this.prisma.batch_attendance.update({
              where: { id: existingId },
              data: { status: value, markedBy, updatedAt: now },
            }),
          );
        } else {
          operations.push(
            this.prisma.batch_attendance.create({
              data: {
                id: randomUUID(),
                institutionId,
                batchId: groupId,
                studentId,
                markedBy,
                date,
                status: value,
                updatedAt: now,
              },
            }),
          );
        }
      }
    }

    await this.prisma.$transaction(operations);

    return { saved: operations.length };
  }

  /* ------------------------------- summary ------------------------------- */

  async summary(institutionId: string, dateText?: string) {
    const mode = await this.mode(institutionId);
    const date = parseDay(dateText);
    const monthStart = new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1),
    );
    const nextMonth = new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1),
    );

    const [dayRows, monthRows, expected] =
      mode === 'SECTION'
        ? await Promise.all([
            this.prisma.attendance.groupBy({
              by: ['status'],
              where: { date, classes: { institutionId } },
              _count: { _all: true },
            }),
            this.prisma.attendance.groupBy({
              by: ['status'],
              where: {
                date: { gte: monthStart, lt: nextMonth },
                classes: { institutionId },
              },
              _count: { _all: true },
            }),
            this.prisma.student_enrollments.count({
              where: {
                users: { institutionId, role: 'STUDENT', status: 'ACTIVE' },
              },
            }),
          ])
        : await Promise.all([
            this.prisma.batch_attendance.groupBy({
              by: ['status'],
              where: { institutionId, date },
              _count: { _all: true },
            }),
            this.prisma.batch_attendance.groupBy({
              by: ['status'],
              where: { institutionId, date: { gte: monthStart, lt: nextMonth } },
              _count: { _all: true },
            }),
            this.prisma.batch_students.count({
              where: { institutionId, batch: { status: 'ACTIVE' } },
            }),
          ]);

    const count = (rows: typeof dayRows, status: Status) =>
      rows.find((row) => row.status === status)?._count._all ?? 0;

    const monthTotal = monthRows.reduce((sum, row) => sum + row._count._all, 0);
    const monthPresent = count(monthRows, 'PRESENT') + count(monthRows, 'LATE');

    return {
      mode,
      date: dateText,
      day: {
        present: count(dayRows, 'PRESENT'),
        absent: count(dayRows, 'ABSENT'),
        late: count(dayRows, 'LATE'),
        expected,
      },
      month: {
        records: monthTotal,
        percent:
          monthTotal > 0 ? Math.round((monthPresent / monthTotal) * 1000) / 10 : null,
      },
    };
  }
}
