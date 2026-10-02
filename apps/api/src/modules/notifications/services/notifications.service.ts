import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../../database/prisma.service';
import {
  NotificationType,
  UserRole,
} from '../../../generated/prisma/enums';

import { CreateNotificationDto } from '../dto/create-notification.dto';
import { BroadcastNotificationDto } from '../dto/broadcast-notification.dto';
import { ListNotificationsQueryDto } from '../dto/list-notifications-query.dto';

@Injectable()
export class NotificationsService {
  constructor(private readonly db: PrismaService) {}

  private ensureInstitution(
    institutionId: string | null | undefined,
  ): string {
    if (!institutionId) {
      throw new ForbiddenException('Institution context is required');
    }

    return institutionId;
  }

  async create(
    institutionId: string | null | undefined,
    senderId: string,
    dto: CreateNotificationDto,
  ) {
    const institution = this.ensureInstitution(institutionId);

    const recipient = await this.db.user.findFirst({
      where: {
        id: dto.recipientId,
        institutionId: institution,
      },
      select: {
        id: true,
        role: true,
        status: true,
      },
    });

    if (!recipient) {
      throw new NotFoundException('Recipient not found');
    }

    if (recipient.role === UserRole.PLATFORM_ADMIN) {
      throw new ForbiddenException(
        'Platform administrators cannot receive institution notifications',
      );
    }

    if (recipient.id === senderId) {
      throw new BadRequestException(
        'You cannot send a notification to yourself',
      );
    }

    if (recipient.status !== 'ACTIVE') {
      throw new BadRequestException(
        'Recipient account is not active',
      );
    }

    return this.db.notification.create({
      data: {
        institutionId: institution,
        senderId,
        recipientId: recipient.id,
        title: dto.title.trim(),
        message: dto.message.trim(),
        type: dto.type ?? NotificationType.INFO,
      },
      select: {
        id: true,
        title: true,
        message: true,
        type: true,
        isRead: true,
        readAt: true,
        recipientId: true,
        senderId: true,
        createdAt: true,
      },
    });
  }

  async broadcast(
    institutionId: string | null | undefined,
    senderId: string,
    senderRole: UserRole,
    dto: BroadcastNotificationDto,
  ) {
    const institution = this.ensureInstitution(institutionId);

    if (
      (!dto.recipientIds || dto.recipientIds.length === 0) &&
      !dto.recipientRole
    ) {
      throw new BadRequestException(
        'Provide recipientIds or recipientRole',
      );
    }

    if (dto.recipientRole === UserRole.PLATFORM_ADMIN) {
      throw new BadRequestException(
        'Platform administrators cannot be broadcast recipients',
      );
    }

    const users = await this.db.user.findMany({
      where: {
        institutionId: institution,
        status: 'ACTIVE',
        ...(dto.recipientIds?.length
          ? {
              id: {
                in: dto.recipientIds,
              },
            }
          : {}),
        ...(dto.recipientRole
          ? {
              role: dto.recipientRole,
            }
          : {}),
      },
      select: {
        id: true,
        role: true,
      },
    });

    if (users.length === 0) {
      throw new NotFoundException('No recipients found');
    }

    const allowedRecipients = this.filterRecipients(
      senderRole,
      users,
    );

    if (allowedRecipients.length === 0) {
      throw new ForbiddenException(
        'You are not allowed to notify these recipients',
      );
    }

    const result = await this.db.notification.createMany({
      data: allowedRecipients.map((user) => ({
        institutionId: institution,
        senderId,
        recipientId: user.id,
        title: dto.title.trim(),
        message: dto.message.trim(),
        type: dto.type ?? NotificationType.ANNOUNCEMENT,
      })),
    });

    return {
      sent: result.count,
      recipients: allowedRecipients.map((user) => ({
        id: user.id,
        role: user.role,
      })),
    };
  }

  private filterRecipients(
    senderRole: UserRole,
    users: Array<{ id: string; role: UserRole }>,
  ) {
    if (senderRole === UserRole.HEAD) {
      return users.filter(
        (user) => user.role !== UserRole.PLATFORM_ADMIN,
      );
    }

    if (senderRole === UserRole.TEACHER) {
      return users.filter(
        (user) => user.role === UserRole.STUDENT,
      );
    }

    if (senderRole === UserRole.STAFF) {
      return users.filter(
        (user) =>
          user.role === UserRole.STUDENT ||
          user.role === UserRole.TEACHER,
      );
    }

    return [];
  }

  async listMine(
    institutionId: string | null | undefined,
    recipientId: string,
    query: ListNotificationsQueryDto,
  ) {
    const institution = this.ensureInstitution(institutionId);

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where = {
      institutionId: institution,
      recipientId,
      ...(query.unreadOnly
        ? {
            isRead: false,
          }
        : {}),
      ...(query.type
        ? {
            type: query.type,
          }
        : {}),
      ...(query.search
        ? {
            OR: [
              {
                title: {
                  contains: query.search,
                  mode: 'insensitive' as const,
                },
              },
              {
                message: {
                  contains: query.search,
                  mode: 'insensitive' as const,
                },
              },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.db.notification.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          title: true,
          message: true,
          type: true,
          isRead: true,
          readAt: true,
          createdAt: true,
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
        },
      }),
      this.db.notification.count({
        where,
      }),
    ]);

    return {
      items,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async unreadCount(
    institutionId: string | null | undefined,
    recipientId: string,
  ) {
    const institution = this.ensureInstitution(institutionId);

    const count = await this.db.notification.count({
      where: {
        institutionId: institution,
        recipientId,
        isRead: false,
      },
    });

    return {
      unread: count,
    };
  }

  async markRead(
    institutionId: string | null | undefined,
    recipientId: string,
    notificationId: string,
    isRead: boolean,
  ) {
    const institution = this.ensureInstitution(institutionId);

    const notification = await this.db.notification.findFirst({
      where: {
        id: notificationId,
        institutionId: institution,
        recipientId,
      },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return this.db.notification.update({
      where: {
        id: notification.id,
      },
      data: {
        isRead,
        readAt: isRead ? new Date() : null,
      },
      select: {
        id: true,
        isRead: true,
        readAt: true,
      },
    });
  }

  async markAllRead(
    institutionId: string | null | undefined,
    recipientId: string,
  ) {
    const institution = this.ensureInstitution(institutionId);

    const result = await this.db.notification.updateMany({
      where: {
        institutionId: institution,
        recipientId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return {
      updated: result.count,
    };
  }

  async remove(
    institutionId: string | null | undefined,
    userId: string,
    role: UserRole,
    notificationId: string,
  ) {
    const institution = this.ensureInstitution(institutionId);

    const notification = await this.db.notification.findFirst({
      where: {
        id: notificationId,
        institutionId: institution,
        ...(role === UserRole.HEAD
          ? {}
          : {
              recipientId: userId,
            }),
      },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    await this.db.notification.delete({
      where: {
        id: notification.id,
      },
    });

    return {
      success: true,
      id: notification.id,
    };
  }
}
