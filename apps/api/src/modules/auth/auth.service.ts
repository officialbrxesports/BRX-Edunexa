import {
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { OAuth2Client } from 'google-auth-library';
import * as argon2 from 'argon2';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './login.dto';
import * as bcrypt from 'bcrypt';
interface DatabaseUser {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string | null;
  role: string;
  status: string;
  brxUid: string;
}

interface SessionUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string | null;
  role: string;
  brxUid: string;
}

const googleClient = new OAuth2Client();

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private formatUser(user: SessionUser) {
    return {
      id: user.id,
      name: [user.firstName, user.lastName].filter(Boolean).join(' '),
      email: user.email,
      eduNexaId: user.brxUid,
      role: user.role,
    };
  }

  private async createSession(user: SessionUser) {
    const sessionToken = randomBytes(32).toString('base64url');
    const tokenHash = this.hashToken(sessionToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.prisma.$executeRaw`
      INSERT INTO "login_sessions" ("id", "userId", "expiresAt")
      VALUES (${tokenHash}, ${user.id}, ${expiresAt})
    `;

    return {
      user: this.formatUser(user),
      sessionToken,
      expiresAt,
    };
  }

  async login(dto: LoginDto) {
    const identifier = dto.identifier.trim();

    const users = await this.prisma.$queryRaw<DatabaseUser[]>`
      SELECT "id", "email", "passwordHash", "firstName",
             "lastName", "role", "status", "brxUid"
      FROM "users"
      WHERE (
        LOWER("email") = LOWER(${identifier})
        OR "brxUid" = ${identifier}
      )
      AND "status" = 'ACTIVE'
      LIMIT 1
    `;

    const user = users[0];

    if (!user?.passwordHash) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    let valid = false;

      try {
        if (
          user.passwordHash.startsWith('$2a$') ||
          user.passwordHash.startsWith('$2b$') ||
          user.passwordHash.startsWith('$2y$')
        ) {
          valid = await bcrypt.compare(dto.password, user.passwordHash);
        } else if (user.passwordHash.startsWith('$argon2')) {
          valid = await argon2.verify(user.passwordHash, dto.password);
        }
      } catch {
        valid = false;
      }

      if (!valid) {
        throw new UnauthorizedException('Invalid credentials.');
      }
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
        } catch (error) {
          console.error(
            'Google ID token verification failed:',
            error instanceof Error ? error.message : 'Unknown verification error',
          );
          throw new UnauthorizedException('Invalid Google credential.');
        }

    if (!payload?.email || payload.email_verified !== true) {
      throw new UnauthorizedException(
        'Google account email must be verified.',
      );
    }

    const email = payload.email.trim().toLowerCase();

    const users = await this.prisma.$queryRaw<SessionUser[]>`
      SELECT "id", "email", "firstName", "lastName", "role", "brxUid"
      FROM "users"
      WHERE LOWER("email") = ${email}
        AND "status" = 'ACTIVE'
      LIMIT 1
    `;

    const user = users[0];

    if (!user) {
      throw new UnauthorizedException(
        'No active EduNexa account exists for this Google email.',
      );
    }

    return this.createSession(user);
  }

  async getCurrentUser(sessionToken?: string) {
    if (!sessionToken) {
      throw new UnauthorizedException('Not authenticated.');
    }

    const tokenHash = this.hashToken(sessionToken);

    const users = await this.prisma.$queryRaw<SessionUser[]>`
      SELECT u."id", u."email", u."firstName", u."lastName",
             u."role", u."brxUid"
      FROM "login_sessions" s
      INNER JOIN "users" u ON u."id" = s."userId"
      WHERE s."id" = ${tokenHash}
        AND s."expiresAt" > NOW()
        AND s."revokedAt" IS NULL
        AND u."status" = 'ACTIVE'
      LIMIT 1
    `;

    if (!users[0]) {
      throw new UnauthorizedException('Session invalid or expired.');
    }

    return this.formatUser(users[0]);
  }

  async logout(sessionToken?: string) {
    if (sessionToken) {
      const tokenHash = this.hashToken(sessionToken);

      await this.prisma.$executeRaw`
        UPDATE "login_sessions"
        SET "revokedAt" = NOW()
        WHERE "id" = ${tokenHash}
          AND "revokedAt" IS NULL
      `;
    }

    return { success: true };
  }
}