import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';

const AUDIENCES = [
  'EVERYONE',
  'TEACHERS',
  'STAFF',
  'STUDENTS',
  'PARENTS',
  'CLASS',
] as const;

export type Audience = (typeof AUDIENCES)[number];

export type NoticeInput = {
  title?: string;
  message?: string;
  audience?: string;
  classId?: string | null;
  sectionId?: string | null;
};

const MAX_RECIPIENTS = 5000;

@Injectable()
export class NoticesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Active people of this school who should receive the notice. */
  async recipients(
    institutionId: string,
    senderId: string,
    audience: Audience,
    classId: string | null,
    sectionId: string | null,
  ) {
    const base = {
      institutionId,
      status: 'ACTIVE' as const,
      id: { not: senderId },
    };

    if (audience === 'TEACHERS' || audience === 'STAFF') {
      return this.prisma.users.findMany({
        where: { ...base, role: audience === 'TEACHERS' ? 'TEACHER' : 'STAFF' },
        select: { id: true },
      });
    }

    if (audience === 'EVERYONE') {
      return this.prisma.users.findMany({
        where: {
          ...base,
          role: { in: ['TEACHER', 'STAFF', 'STUDENT', 'PARENT', 'GUARD'] },
        },
        select: { id: true },
      });
    }

    const enrollment =
      classId || sectionId
        ? {
            ...(classId ? { classId } : {}),
            ...(sectionId ? { sectionId } : {}),
          }
        : null;

    if (enrollment) {
      const found = await this.prisma.classes.findFirst({
        where: { institutionId, ...(classId ? { id: classId } : {}) },
        select: { id: true },
      });

      if (!found) throw new BadRequestException('Class not found.');

      if (sectionId) {
        const section = await this.prisma.sections.findFirst({
          where: { id: sectionId, classes: { institutionId } },
          select: { id: true },
        });

        if (!section) throw new BadRequestException('Section not found.');
      }
    } else if (audience === 'CLASS') {
      throw new BadRequestException('Please choose a class.');
    }

    const studentFilter = enrollment
      ? { student_enrollments: { some: enrollment } }
      : {};

    const wantStudents = audience !== 'PARENTS';
    const wantParents = audience !== 'STUDENTS';

    const [students, parents] = await Promise.all([
      wantStudents
        ? this.prisma.users.findMany({
            where: { ...base, role: 'STUDENT', ...studentFilter },
            select: { id: true },
          })
        : Promise.resolve([]),
      wantParents
        ? this.prisma.users.findMany({
            where: {
              ...base,
              role: 'PARENT',
              ...(enrollment
                ? { parent_links: { some: { student: studentFilter } } }
                : {}),
            },
            select: { id: true },
          })
        : Promise.resolve([]),
    ]);

    return [...students, ...parents];
  }

  async send(institutionId: string, senderId: string, input: NoticeInput) {
    const title = (input.title ?? '').trim();
    const message = (input.message ?? '').trim();

    if (!title || title.length > 160) {
      throw new BadRequestException('Title is required (up to 160 characters).');
    }

    if (!message || message.length > 2000) {
      throw new BadRequestException('Message is required (up to 2000 characters).');
    }

    if (!AUDIENCES.includes(input.audience as Audience)) {
      throw new BadRequestException('Please choose who should get this notice.');
    }

    const audience = input.audience as Audience;
    const people = await this.recipients(
      institutionId,
      senderId,
      audience,
      input.classId || null,
      input.sectionId || null,
    );

    if (people.length === 0) {
      throw new BadRequestException('No active person matches this audience.');
    }

    if (people.length > MAX_RECIPIENTS) {
      throw new BadRequestException('Too many recipients for one notice.');
    }

    const now = new Date();

    await this.prisma.notifications.createMany({
      data: people.map((person) => ({
        id: randomUUID(),
        institutionId,
        senderId,
        recipientId: person.id,
        title,
        message,
        type: 'ANNOUNCEMENT' as const,
        createdAt: now,
        updatedAt: now,
      })),
    });

    return { sent: people.length };
  }

  /** Notices this school has sent, newest first (one row per notice). */
  async sent(institutionId: string) {
    const where = {
      institutionId,
      type: 'ANNOUNCEMENT' as const,
      senderId: { not: null },
    };

    const [all, read] = await Promise.all([
      this.prisma.notifications.groupBy({
        by: ['title', 'message', 'createdAt'],
        where,
        _count: { _all: true },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      this.prisma.notifications.groupBy({
        by: ['title', 'message', 'createdAt'],
        where: { ...where, isRead: true },
        _count: { _all: true },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
    ]);

    return all.map((row) => ({
      title: row.title,
      message: row.message,
      createdAt: row.createdAt,
      recipients: row._count._all,
      read:
        read.find(
          (item) =>
            item.title === row.title &&
            item.message === row.message &&
            item.createdAt.getTime() === row.createdAt.getTime(),
        )?._count._all ?? 0,
    }));
  }

  async remove(institutionId: string, input: { title?: string; message?: string; createdAt?: string }) {
    const createdAt = new Date(input.createdAt ?? '');

    if (!input.title || !input.message || Number.isNaN(createdAt.getTime())) {
      throw new BadRequestException('Notice not found.');
    }

    const result = await this.prisma.notifications.deleteMany({
      where: {
        institutionId,
        type: 'ANNOUNCEMENT',
        senderId: { not: null },
        title: input.title,
        message: input.message,
        createdAt,
      },
    });

    return { removed: result.count };
  }

  /* ------------------------------- inbox ------------------------------- */

  async inbox(userId: string) {
    const [items, unread] = await Promise.all([
      this.prisma.notifications.findMany({
        where: { recipientId: userId },
        orderBy: { createdAt: 'desc' },
        take: 30,
        select: {
          id: true,
          title: true,
          message: true,
          isRead: true,
          createdAt: true,
          users_notifications_senderIdTousers: {
            select: { firstName: true, lastName: true },
          },
        },
      }),
      this.prisma.notifications.count({
        where: { recipientId: userId, isRead: false },
      }),
    ]);

    return {
      unread,
      items: items.map((item) => ({
        id: item.id,
        title: item.title,
        message: item.message,
        isRead: item.isRead,
        createdAt: item.createdAt,
        from: item.users_notifications_senderIdTousers
          ? [
              item.users_notifications_senderIdTousers.firstName,
              item.users_notifications_senderIdTousers.lastName,
            ]
              .filter(Boolean)
              .join(' ')
          : null,
      })),
    };
  }

  async emailPref(userId: string) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      select: { emailOptIn: true },
    });

    return { enabled: user?.emailOptIn ?? false };
  }

  async setEmailPref(userId: string, enabled: boolean) {
    await this.prisma.users.update({
      where: { id: userId },
      data: { emailOptIn: Boolean(enabled), updatedAt: new Date() },
    });

    return { enabled: Boolean(enabled) };
  }

  async markRead(userId: string, id?: string) {
    const now = new Date();
    const result = await this.prisma.notifications.updateMany({
      where: { recipientId: userId, isRead: false, ...(id ? { id } : {}) },
      data: { isRead: true, readAt: now, updatedAt: now },
    });

    return { updated: result.count };
  }
}
