import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class SessionsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  // ============================================================
  // Create login session
  // ============================================================

  async create(data: {
    userId: string;
    deviceType?: string | null;
    deviceName?: string | null;
    browser?: string | null;
    operatingSystem?: string | null;
    ipAddress?: string | null;
    userAgent?: string | null;
  }) {
    const expiresAt = new Date(
      Date.now() + 60 * 60 * 1000,
    );

    return this.prisma.loginSession.create({
      data: {
        userId: data.userId,

        deviceType:
          data.deviceType ?? null,

        deviceName:
          data.deviceName ?? null,

        browser:
          data.browser ?? null,

        operatingSystem:
          data.operatingSystem ?? null,

        ipAddress:
          data.ipAddress ?? null,

        userAgent:
          data.userAgent ?? null,

        expiresAt,
      },
    });
  }

  // ============================================================
  // Check whether a session is active
  // ============================================================

  async isActive(
    sessionId: string,
    userId: string,
  ): Promise<boolean> {
    const session =
      await this.prisma.loginSession.findFirst({
        where: {
          id: sessionId,

          userId,

          revokedAt: null,

          expiresAt: {
            gt: new Date(),
          },
        },

        select: {
          id: true,
        },
      });

    return !!session;
  }

  // ============================================================
  // Update session activity
  // ============================================================

  async touch(
    sessionId: string,
  ): Promise<void> {
    const session =
      await this.prisma.loginSession.findUnique({
        where: {
          id: sessionId,
        },

        select: {
          id: true,
          lastActiveAt: true,
          revokedAt: true,
          expiresAt: true,
        },
      });

    if (!session) {
      return;
    }

    if (session.revokedAt) {
      return;
    }

    if (session.expiresAt <= new Date()) {
      return;
    }

    const fiveMinutesAgo =
      new Date(
        Date.now() -
          5 * 60 * 1000,
      );

    if (
      session.lastActiveAt <
      fiveMinutesAgo
    ) {
      await this.prisma.loginSession.update({
        where: {
          id: session.id,
        },

        data: {
          lastActiveAt: new Date(),
        },
      });
    }
  }

  // ============================================================
  // Validate active session
  // ============================================================

  async validateSession(
    userId: string,
    sessionId: string,
  ) {
    const session =
      await this.prisma.loginSession.findFirst({
        where: {
          id: sessionId,

          userId,

          revokedAt: null,

          expiresAt: {
            gt: new Date(),
          },
        },
      });

    if (!session) {
      return null;
    }

    await this.touch(session.id);

    return session;
  }

  // ============================================================
  // Get all user sessions
  // ============================================================

  async getUserSessions(
    userId: string,
    currentSessionId?: string,
  ) {
    const sessions =
      await this.prisma.loginSession.findMany({
        where: {
          userId,
        },

        orderBy: {
          lastActiveAt: 'desc',
        },

        select: {
          id: true,

          deviceType: true,

          deviceName: true,

          browser: true,

          operatingSystem: true,

          ipAddress: true,

          createdAt: true,

          lastActiveAt: true,

          expiresAt: true,

          revokedAt: true,
        },
      });

    const now = new Date();

    return sessions.map(
      (session) => ({
        id: session.id,

        deviceType:
          session.deviceType,

        deviceName:
          session.deviceName,

        browser:
          session.browser,

        operatingSystem:
          session.operatingSystem,

        ipAddress:
          session.ipAddress,

        createdAt:
          session.createdAt,

        lastActiveAt:
          session.lastActiveAt,

        expiresAt:
          session.expiresAt,

        isCurrent:
          session.id ===
          currentSessionId,

        isActive:
          session.revokedAt === null &&
          session.expiresAt > now,
      }),
    );
  }

  // ============================================================
  // Logout current session
  // ============================================================

  async revokeCurrentSession(
    userId: string,
    sessionId: string,
  ) {
    const session =
      await this.prisma.loginSession.findFirst({
        where: {
          id: sessionId,

          userId,
        },

        select: {
          id: true,
        },
      });

    if (!session) {
      throw new NotFoundException(
        'Session not found',
      );
    }

    await this.prisma.loginSession.update({
      where: {
        id: session.id,
      },

      data: {
        revokedAt: new Date(),
      },
    });

    return {
      success: true,

      message:
        'Current session logged out successfully',
    };
  }

  // ============================================================
  // Logout selected device
  // ============================================================

  async revokeSession(
    userId: string,
    sessionId: string,
  ) {
    const session =
      await this.prisma.loginSession.findFirst({
        where: {
          id: sessionId,

          userId,
        },

        select: {
          id: true,
        },
      });

    if (!session) {
      throw new NotFoundException(
        'Session not found',
      );
    }

    await this.prisma.loginSession.update({
      where: {
        id: session.id,
      },

      data: {
        revokedAt: new Date(),
      },
    });

    return {
      success: true,

      message:
        'Device session logged out successfully',
    };
  }

  // ============================================================
  // Logout all other devices
  // ============================================================

  async revokeOtherSessions(
    userId: string,
    currentSessionId: string,
  ) {
    const result =
      await this.prisma.loginSession.updateMany({
        where: {
          userId,

          id: {
            not: currentSessionId,
          },

          revokedAt: null,
        },

        data: {
          revokedAt: new Date(),
        },
      });

    return {
      success: true,

      message:
        'All other devices have been logged out',

      revokedCount:
        result.count,
    };
  }

  // ============================================================
  // Logout every device
  // ============================================================

  async revokeAllSessions(
    userId: string,
  ) {
    const result =
      await this.prisma.loginSession.updateMany({
        where: {
          userId,

          revokedAt: null,
        },

        data: {
          revokedAt: new Date(),
        },
      });

    return {
      success: true,

      message:
        'All devices have been logged out',

      revokedCount:
        result.count,
    };
  }
}