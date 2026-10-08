import { generateBrxUid } from '../../../common/brx-uid.util';

import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';

import { PrismaService } from '../../../database/prisma.service';

import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';

import { PasswordService } from './password.service';

import { SessionsService } from '../../sessions/services/sessions.service';

import { EmailService } from '../../notifications/services/email.service';

import { parseDevice } from '../../sessions/utils/device-parser.util';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
    private readonly jwtService: JwtService,
    private readonly sessionsService: SessionsService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Create a normal user account.
   *
   * BRX UID is generated ONLY here.
   * It must never be regenerated during profile updates,
   * password changes, or future logins.
   */
  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();

    const existingUser = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await this.passwordService.hash(dto.password);

    const brxUid = generateBrxUid();

    const user = await this.prisma.user.create({
      data: {
        brxUid,

        email,

        passwordHash,

        firstName: dto.firstName.trim(),

        lastName: dto.lastName?.trim() || null,

        phone: dto.phone?.trim() || null,

        role: 'HEAD',
        
        institutionId: null,
      },

      select: {
        id: true,
        brxUid: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        status: true,
        institutionId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    /**
     * Send BRX UID welcome email.
     *
     * Password is NEVER included in this email.
     */
    await this.emailService.sendWelcomeEmail({
      firstName: user.firstName,
      brxUid: user.brxUid,
      email: user.email,
    });

    return {
      success: true,
      message: 'Account created successfully',
      user,
    };
  }

  /**
   * Find user using either:
   * - Email
   * - BRX UID
   */
  private async findUserByIdentifier(identifier: string) {
    const value = identifier.trim();

    const brxUidPattern =
      /^BRX-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/i;

    if (brxUidPattern.test(value)) {
      return this.prisma.user.findUnique({
        where: {
          brxUid: value.toUpperCase(),
        },
      });
    }

    return this.prisma.user.findUnique({
      where: {
        email: value.toLowerCase(),
      },
    });
  }

  /**
   * Validate login credentials.
   */
  async validateUser(dto: LoginDto) {
    const user = await this.findUserByIdentifier(dto.identifier);

    if (!user) {
      throw new UnauthorizedException(
        'Invalid email/BRX UID or password',
      );
    }

    const passwordValid = await this.passwordService.compare(
      dto.password,
      user.passwordHash,
    );

    if (!passwordValid) {
      throw new UnauthorizedException(
        'Invalid email/BRX UID or password',
      );
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException(
        'User account is not active',
      );
    }

    return user;
  }

  /**
   * Login
   *
   * Flow:
   * 1. Validate credentials
   * 2. Detect device
   * 3. Create LoginSession
   * 4. Create JWT containing session ID
   * 5. Send login security email
   * 6. Return token + user
   */
  async login(
    dto: LoginDto,
    request?: {
      ip?: string;
      userAgent?: string;
    },
  ) {
    const user = await this.validateUser(dto);

    const device = parseDevice(request?.userAgent);

    const session = await this.sessionsService.create({
      userId: user.id,

      deviceType: device.deviceType,

      deviceName: device.deviceName,

      browser: device.browser,

      operatingSystem: device.operatingSystem,

      ipAddress: request?.ip ?? null,

      userAgent: request?.userAgent ?? null,
    });

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,

      email: user.email,

      brxUid: user.brxUid,

      role: user.role,

      institutionId: user.institutionId,

      /**
       * Session ID used for:
       * - Current device logout
       * - Logout other devices
       * - Session history
       * - Session revocation
       */
      sid: session.id,

      /**
       * Keep sessionId as well for backward compatibility
       * with code that may already reference this property.
       */
      sessionId: session.id,
    });

    /**
     * Security alert email.
     *
     * Email failure should ideally not prevent login.
     * EmailService should handle provider errors safely.
     */
    await this.emailService.sendLoginAlertEmail({
      firstName: user.firstName,

      brxUid: user.brxUid,

      email: user.email,

      deviceType: device.deviceType,

      deviceName: device.deviceName,

      browser: device.browser,

      operatingSystem: device.operatingSystem,

      ipAddress: request?.ip ?? 'Unavailable',

      loginTime: new Date().toISOString(),
    });

    return {
      accessToken,

      tokenType: 'Bearer',

      sessionId: session.id,

      user: {
        id: user.id,

        brxUid: user.brxUid,

        email: user.email,

        firstName: user.firstName,

        lastName: user.lastName,

        phone: user.phone,

        role: user.role,

        status: user.status,

        institutionId: user.institutionId,
      },
    };
  }
}