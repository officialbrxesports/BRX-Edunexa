import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';

import { randomBytes } from 'node:crypto';
import { OAuth2Client } from 'google-auth-library';
import * as argon2 from 'argon2';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './login.dto';

const googleClient = new OAuth2Client();

const SESSION_DURATION_DAYS = 7;

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  private formatUser(user: {
    id: string;
    institutionId: string | null;
    firstName: string;
    lastName: string | null;
    email: string;
    brxUid: string;
    role: string;
  }) {
    return {
      id: user.id,
      institutionId: user.institutionId,
      name: [user.firstName, user.lastName]
        .filter(Boolean)
        .join(' '),
      email: user.email,
      eduNexaId: user.brxUid,
      role: user.role,
    };
  }

  private async verifyPassword(
    password: string,
    passwordHash: string,
  ): Promise<boolean> {
    try {
      if (/^\$2[aby]\$/.test(passwordHash)) {
        return await bcrypt.compare(password, passwordHash);
      }

      if (passwordHash.startsWith('$argon2')) {
        return await argon2.verify(passwordHash, password);
      }

      return false;
    } catch {
      return false;
    }
  }

  private checkAccountAccess(user: {
    institutionId: string | null;
    role: string;
    status: string;
    institutions: { status: string } | null;
  }) {
    if (user.status !== 'ACTIVE') {
      throw new ForbiddenException(
        'Your account is not active. Contact your institution administrator.',
      );
    }

    if (user.role === 'PLATFORM_ADMIN') {
      if (user.institutionId !== null) {
        throw new ForbiddenException(
          'Invalid platform administrator account.',
        );
      }

      return;
    }

    if (
      !user.institutions ||
      user.institutions.status !== 'ACTIVE'
    ) {
      throw new ForbiddenException(
        'Your institution is awaiting approval or is inactive.',
      );
    }
  }

  private async createSession(user: {
    id: string;
    institutionId: string | null;
    firstName: string;
    lastName: string | null;
    email: string;
    brxUid: string;
    role: string;
  }) {
    // A 256-bit random token is used as the session ID.
    const sessionToken = randomBytes(32).toString('base64url');

    const expiresAt = new Date(
      Date.now() +
        SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000,
    );

    await this.prisma.login_sessions.create({
      data: {
        id: sessionToken,
        userId: user.id,
        expiresAt,
      },
    });

    return {
      user: this.formatUser(user),
      sessionToken,
      expiresAt,
    };
  }

  async login(dto: LoginDto) {
    const identifier = dto.identifier.trim();

    const user = await this.prisma.users.findFirst({
      where: {
        OR: [
          {
            email: {
              equals: identifier,
              mode: 'insensitive',
            },
          },
          {
            brxUid: identifier,
          },
        ],
      },
      include: {
        institutions: {
          select: {
            status: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const valid = await this.verifyPassword(
      dto.password,
      user.passwordHash,
    );

    if (!valid) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    this.checkAccountAccess(user);

    return this.createSession(user);
  }

  async loginWithGoogle(credential: string) {
    const clientId = process.env.GOOGLE_CLIENT_ID;

    if (!clientId) {
      throw new InternalServerErrorException(
        'Google sign-in is not configured.',
      );
    }

    let payload;

    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: clientId,
      });

      payload = ticket.getPayload();
    } catch {
      throw new UnauthorizedException(
        'Invalid Google credential.',
      );
    }

    if (!payload?.email || payload.email_verified !== true) {
      throw new UnauthorizedException(
        'Google account email must be verified.',
      );
    }

    const user = await this.prisma.users.findFirst({
      where: {
        email: {
          equals: payload.email.trim(),
          mode: 'insensitive',
        },
      },
      include: {
        institutions: {
          select: {
            status: true,
          },
        },
      },
    });

    if (!user) {
      throw new ForbiddenException(
        'No EduNexa account exists for this Google email.',
      );
    }

    this.checkAccountAccess(user);

    return this.createSession(user);
  }

  async getCurrentUser(sessionToken?: string) {
    if (!sessionToken) {
      throw new UnauthorizedException('Not authenticated.');
    }

    const session =
      await this.prisma.login_sessions.findFirst({
        where: {
          id: sessionToken,
          revokedAt: null,
          expiresAt: {
            gt: new Date(),
          },
        },
        include: {
          users: {
            include: {
              institutions: {
                select: {
                  status: true,
                },
              },
            },
          },
        },
      });

    if (!session) {
      throw new UnauthorizedException(
        'Session invalid or expired.',
      );
    }

    const user = session.users;

    try {
      this.checkAccountAccess(user);
    } catch {
      throw new UnauthorizedException(
        'Session invalid or account inactive.',
      );
    }

    await this.prisma.login_sessions.update({
      where: {
        id: session.id,
      },
      data: {
        lastActiveAt: new Date(),
      },
    });

    return this.formatUser(user);
  }

  async logout(sessionToken?: string) {
    if (sessionToken) {
      await this.prisma.login_sessions.updateMany({
        where: {
          id: sessionToken,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      });
    }

    return { success: true };
  }
}