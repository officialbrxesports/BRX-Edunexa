
import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { randomBytes, createHash } from 'node:crypto';
import * as argon2 from 'argon2';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './login.dto';

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

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async login(dto: LoginDto) {
    const identifier = dto.identifier.trim();

    const users = await this.prisma.$queryRaw<DatabaseUser[]>`
      SELECT
        "id",
        "email",
        "passwordHash",
        "firstName",
        "lastName",
        "role",
        "status",
        "brxUid"
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

    const passwordIsValid = await argon2
      .verify(user.passwordHash, dto.password)
      .catch(() => false);

    if (!passwordIsValid) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    // The raw token is returned to the controller.
    // Only its SHA-256 hash is stored in the existing session ID column.
    const sessionToken = randomBytes(32).toString('base64url');

    const tokenHash = createHash('sha256')
      .update(sessionToken)
      .digest('hex');

    const expiresAt = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000,
    );

    await this.prisma.$executeRaw`
      INSERT INTO "login_sessions" (
        "id",
        "userId",
        "expiresAt"
      )
      VALUES (
        ${tokenHash},
        ${user.id},
        ${expiresAt}
      )
    `;

    return {
      user: {
        id: user.id,
        name: [user.firstName, user.lastName]
          .filter(Boolean)
          .join(' '),
        email: user.email,
        eduNexaId: user.brxUid,
        role: user.role,
      },
      sessionToken,
      expiresAt,
    };
  }
}
