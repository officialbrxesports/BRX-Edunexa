import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';

export type GroupInput = {
  name?: string;
  description?: string;
  isActive?: boolean;
};

export type NoticeInput = {
  title?: string;
  body?: string;
  groupId?: string | null;
};

type MemberRole = 'STUDENT' | 'TEACHER' | 'STAFF' | 'PARENT' | 'GUARD';

const MEMBER_ROLES: MemberRole[] = [
  'STUDENT',
  'TEACHER',
  'STAFF',
  'PARENT',
  'GUARD',
];

const isDuplicate = (error: unknown) =>
  (error as { code?: string })?.code === 'P2002';

@Injectable()
export class OtherService {
  constructor(private readonly prisma: PrismaService) {}

  /** These tools exist only for "Other" organisations. */
  async assertOther(institutionId: string) {
    const institution = await this.prisma.institutions.findUnique({
      where: { id: institutionId },
      select: { type: true },
    });

    if (!institution || institution.type !== 'OTHER') {
      throw new ForbiddenException(
        'This feature is only available for this organisation type.',
      );
    }
  }

  private name(first: string, last: string | null) {
    return [first, last].filter(Boolean).join(' ');
  }

  private text(value: string | undefined, max: number, label: string) {
    const cleaned = value?.trim() || null;

    if (cleaned && cleaned.length > max) {
      throw new BadRequestException(`${label} is too long.`);
    }

    return cleaned;
  }

  private async ownGroup(institutionId: string, groupId: string) {
    const group = await this.prisma.groups.findFirst({
      where: { id: groupId, institutionId },
      select: { id: true },
    });

    if (!group) throw new NotFoundException('Group not found.');

    return group;
  }

  /* ------------------------------- summary ------------------------------- */

  async summary(institutionId: string) {
    await this.assertOther(institutionId);

    const [people, staff, groups, notices, recent] = await Promise.all([
      this.prisma.users.count({
        where: { institutionId, role: { in: MEMBER_ROLES }, status: 'ACTIVE' },
      }),
      this.prisma.users.count({
        where: { institutionId, role: 'STAFF', status: 'ACTIVE' },
      }),
      this.prisma.groups.count({ where: { institutionId, isActive: true } }),
      this.prisma.notices.count({ where: { institutionId } }),
      this.prisma.notices.findMany({
        where: { institutionId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          title: true,
          body: true,
          createdAt: true,
          group: { select: { name: true } },
        },
      }),
    ]);

    return {
      counts: { people, staff, groups, notices },
      recentNotices: recent.map((notice) => ({
        id: notice.id,
        title: notice.title,
        body: notice.body,
        createdAt: notice.createdAt,
        groupName: notice.group?.name ?? null,
      })),
    };
  }

  async peopleOptions(institutionId: string) {
    await this.assertOther(institutionId);

    const users = await this.prisma.users.findMany({
      where: { institutionId, role: { in: MEMBER_ROLES }, status: 'ACTIVE' },
      orderBy: { firstName: 'asc' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        brxUid: true,
        role: true,
      },
    });

    return {
      people: users.map((user) => ({
        id: user.id,
        name: this.name(user.firstName, user.lastName),
        brxUid: user.brxUid,
        role: user.role,
      })),
    };
  }

  /* -------------------------------- groups -------------------------------- */

  async listGroups(institutionId: string) {
    await this.assertOther(institutionId);

    const rows = await this.prisma.groups.findMany({
      where: { institutionId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true,
        members: {
          orderBy: { createdAt: 'asc' },
          select: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                brxUid: true,
                role: true,
              },
            },
          },
        },
      },
    });

    return rows.map((group) => ({
      id: group.id,
      name: group.name,
      description: group.description,
      isActive: group.isActive,
      members: group.members.map((member) => ({
        id: member.user.id,
        name: this.name(member.user.firstName, member.user.lastName),
        brxUid: member.user.brxUid,
        role: member.user.role,
      })),
    }));
  }

  async createGroup(institutionId: string, input: GroupInput) {
    await this.assertOther(institutionId);

    const name = this.text(input.name, 120, 'Group name');

    if (!name) throw new BadRequestException('Group name is required.');

    try {
      const created = await this.prisma.groups.create({
        data: {
          id: randomUUID(),
          institutionId,
          name,
          description: this.text(input.description, 500, 'Description'),
          updatedAt: new Date(),
        },
        select: { id: true },
      });

      return { success: true, id: created.id };
    } catch (error) {
      if (isDuplicate(error)) {
        throw new ConflictException('A group with this name already exists.');
      }

      throw error;
    }
  }

  async updateGroup(institutionId: string, id: string, input: GroupInput) {
    await this.assertOther(institutionId);
    await this.ownGroup(institutionId, id);

    const data: {
      name?: string;
      description?: string | null;
      isActive?: boolean;
      updatedAt: Date;
    } = { updatedAt: new Date() };

    if (input.name !== undefined) {
      const name = this.text(input.name, 120, 'Group name');

      if (!name) throw new BadRequestException('Group name is required.');

      data.name = name;
    }

    if (input.description !== undefined) {
      data.description = this.text(input.description, 500, 'Description');
    }

    if (typeof input.isActive === 'boolean') data.isActive = input.isActive;

    try {
      await this.prisma.groups.update({ where: { id }, data });
      return { success: true };
    } catch (error) {
      if (isDuplicate(error)) {
        throw new ConflictException('A group with this name already exists.');
      }

      throw error;
    }
  }

  async addMember(institutionId: string, groupId: string, userId?: string) {
    await this.assertOther(institutionId);
    await this.ownGroup(institutionId, groupId);

    if (!userId) throw new BadRequestException('Choose a person to add.');

    const user = await this.prisma.users.findFirst({
      where: {
        id: userId,
        institutionId,
        role: { in: MEMBER_ROLES },
        status: 'ACTIVE',
      },
      select: { id: true },
    });

    if (!user) throw new NotFoundException('Person not found.');

    try {
      await this.prisma.group_members.create({
        data: { id: randomUUID(), institutionId, groupId, userId },
      });

      return { success: true };
    } catch (error) {
      if (isDuplicate(error)) {
        throw new ConflictException('Already a member of this group.');
      }

      throw error;
    }
  }

  async removeMember(institutionId: string, groupId: string, userId: string) {
    await this.assertOther(institutionId);

    const result = await this.prisma.group_members.deleteMany({
      where: { institutionId, groupId, userId },
    });

    if (result.count === 0) throw new NotFoundException('Member not found.');

    return { success: true };
  }

  /* -------------------------------- notices -------------------------------- */

  async listNotices(institutionId: string) {
    await this.assertOther(institutionId);

    const rows = await this.prisma.notices.findMany({
      where: { institutionId },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        title: true,
        body: true,
        createdAt: true,
        group: { select: { name: true } },
      },
    });

    return rows.map((notice) => ({
      id: notice.id,
      title: notice.title,
      body: notice.body,
      createdAt: notice.createdAt,
      groupName: notice.group?.name ?? null,
    }));
  }

  async createNotice(
    institutionId: string,
    authorId: string,
    input: NoticeInput,
  ) {
    await this.assertOther(institutionId);

    const title = this.text(input.title, 160, 'Title');
    const body = this.text(input.body, 2000, 'Message');

    if (!title) throw new BadRequestException('Title is required.');
    if (!body) throw new BadRequestException('Message is required.');

    const groupId = input.groupId || null;

    if (groupId) await this.ownGroup(institutionId, groupId);

    const created = await this.prisma.notices.create({
      data: {
        id: randomUUID(),
        institutionId,
        groupId,
        title,
        body,
        createdBy: authorId,
        updatedAt: new Date(),
      },
      select: { id: true },
    });

    return { success: true, id: created.id };
  }

  async deleteNotice(institutionId: string, id: string) {
    await this.assertOther(institutionId);

    const result = await this.prisma.notices.deleteMany({
      where: { id, institutionId },
    });

    if (result.count === 0) throw new NotFoundException('Notice not found.');

    return { success: true };
  }
}
