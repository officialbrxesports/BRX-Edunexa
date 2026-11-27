import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';

type Status = 'PRESENT' | 'ABSENT' | 'LATE';

export type MarkInput = {
  date?: string;
  entries?: { userId?: string; status?: string }[];
};

const STAFF_ROLES: ('TEACHER' | 'STAFF' | 'GUARD')[] = ['TEACHER', 'STAFF', 'GUARD'];
const STATUSES: Status[] = ['PRESENT', 'ABSENT', 'LATE'];
const DAY = /^\d{4}-\d{2}-\d{2}$/;

const fullName = (first: string, last: string | null) =>
  [first, last].filter(Boolean).join(' ');

/** "2026-11-27" -> a Date at UTC midnight (the column is a plain date). */
function dayOf(value: string | undefined) {
  const text = value || new Date().toISOString().slice(0, 10);

  if (!DAY.test(text)) throw new BadRequestException('Choose a valid date.');

  const date = new Date(`${text}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException('Choose a valid date.');
  }

  return { text, date };
}

function monthRange(value: string | undefined) {
  const text = value || new Date().toISOString().slice(0, 7);

  if (!/^\d{4}-\d{2}$/.test(text)) {
    throw new BadRequestException('Choose a valid month.');
  }

  const from = new Date(`${text}-01T00:00:00.000Z`);

  if (Number.isNaN(from.getTime())) {
    throw new BadRequestException('Choose a valid month.');
  }

  const to = new Date(from);
  to.setUTCMonth(to.getUTCMonth() + 1);

  return { text, from, to };
}

const percent = (present: number, late: number, marked: number) =>
  marked > 0 ? Math.round(((present + late) / marked) * 100) : null;

@Injectable()
export class StaffAttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  private people(institutionId: string) {
    return this.prisma.users.findMany({
      where: {
        institutionId,
        role: { in: STAFF_ROLES },
        status: 'ACTIVE',
      },
      orderBy: [{ role: 'asc' }, { firstName: 'asc' }],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        brxUid: true,
        role: true,
      },
    });
  }

  /** Everyone on staff with their mark for one day (null = not marked yet). */
  async day(institutionId: string, dateText?: string) {
    const { text, date } = dayOf(dateText);
    const [people, records] = await Promise.all([
      this.people(institutionId),
      this.prisma.staff_attendance.findMany({
        where: { institutionId, date },
        select: { userId: true, status: true },
      }),
    ]);
    const byUser = new Map(records.map((item) => [item.userId, item.status]));

    return {
      date: text,
      people: people.map((person) => ({
        id: person.id,
        name: fullName(person.firstName, person.lastName),
        brxUid: person.brxUid,
        role: person.role,
        status: byUser.get(person.id) ?? null,
      })),
    };
  }

  async mark(institutionId: string, markerId: string, input: MarkInput) {
    const { date } = dayOf(input.date);
    const entries = input.entries ?? [];

    const tomorrow = new Date();
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 2);

    if (date > tomorrow) {
      throw new BadRequestException('You cannot mark a future date.');
    }

    if (entries.length === 0 || entries.length > 500) {
      throw new BadRequestException('Nothing to save.');
    }

    for (const entry of entries) {
      if (!entry.userId || !STATUSES.includes(entry.status as Status)) {
        throw new BadRequestException('Each person needs a valid status.');
      }
    }

    const valid = await this.prisma.users.findMany({
      where: {
        id: { in: entries.map((entry) => entry.userId as string) },
        institutionId,
        role: { in: STAFF_ROLES },
      },
      select: { id: true },
    });
    const allowed = new Set(valid.map((item) => item.id));

    if (entries.some((entry) => !allowed.has(entry.userId as string))) {
      throw new BadRequestException('Someone in the list is not on your staff.');
    }

    const now = new Date();

    await this.prisma.$transaction(
      entries.map((entry) =>
        this.prisma.staff_attendance.upsert({
          where: { userId_date: { userId: entry.userId as string, date } },
          create: {
            id: randomUUID(),
            institutionId,
            userId: entry.userId as string,
            date,
            status: entry.status as Status,
            markedBy: markerId,
            createdAt: now,
            updatedAt: now,
          },
          update: {
            status: entry.status as Status,
            markedBy: markerId,
            updatedAt: now,
          },
        }),
      ),
    );

    return { saved: entries.length };
  }

  /** Month report plus a summary of today, for the dashboard. */
  async report(institutionId: string, monthText?: string) {
    const { text, from, to } = monthRange(monthText);
    const today = dayOf(undefined).date;
    const [people, records] = await Promise.all([
      this.people(institutionId),
      this.prisma.staff_attendance.findMany({
        where: { institutionId, date: { gte: from, lt: to } },
        select: { userId: true, status: true, date: true },
      }),
    ]);

    const rows = people.map((person) => {
      const mine = records.filter((item) => item.userId === person.id);
      const count = (status: Status) =>
        mine.filter((item) => item.status === status).length;
      const present = count('PRESENT');
      const late = count('LATE');
      const absent = count('ABSENT');

      return {
        id: person.id,
        name: fullName(person.firstName, person.lastName),
        brxUid: person.brxUid,
        role: person.role,
        present,
        late,
        absent,
        marked: mine.length,
        percent: percent(present, late, mine.length),
      };
    });

    const todayMarks = new Map(
      records
        .filter((item) => item.date.getTime() === today.getTime())
        .map((item) => [item.userId, item.status]),
    );
    const todayCount = (status: Status) =>
      people.filter((person) => todayMarks.get(person.id) === status).length;

    return {
      month: text,
      today: {
        total: people.length,
        present: todayCount('PRESENT'),
        late: todayCount('LATE'),
        absent: todayCount('ABSENT'),
        unmarked: people.filter((person) => !todayMarks.has(person.id)).length,
      },
      rows,
    };
  }

  /** A staff member's own month and the last few days. */
  async mine(userId: string, monthText?: string) {
    const { text, from, to } = monthRange(monthText);
    const records = await this.prisma.staff_attendance.findMany({
      where: { userId, date: { gte: from, lt: to } },
      orderBy: { date: 'desc' },
      select: { date: true, status: true },
    });
    const count = (status: Status) =>
      records.filter((item) => item.status === status).length;
    const present = count('PRESENT');
    const late = count('LATE');

    return {
      month: text,
      present,
      late,
      absent: count('ABSENT'),
      percent: percent(present, late, records.length),
      recent: records.slice(0, 14).map((item) => ({
        date: item.date.toISOString().slice(0, 10),
        status: item.status,
      })),
    };
  }
}
