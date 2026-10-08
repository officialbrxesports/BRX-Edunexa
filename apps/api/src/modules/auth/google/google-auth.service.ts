import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import {
  ConfigService,
} from '@nestjs/config';

import {
  JwtService,
} from '@nestjs/jwt';

import {
  OAuth2Client,
} from 'google-auth-library';

import { PrismaService } from '../../../database/prisma.service';

import { SessionsService } from '../../sessions/services/sessions.service';

import { EmailService } from '../../notifications/services/email.service';

import { parseDevice } from '../../sessions/utils/device-parser.util';

@Injectable()
export class GoogleAuthService {
  private readonly googleClient: OAuth2Client;

  constructor(
    private readonly prisma: PrismaService,

    private readonly jwtService: JwtService,

    private readonly configService: ConfigService,

    private readonly sessionsService: SessionsService,

    private readonly emailService: EmailService,
  ) {
    const clientId =
      this.configService.get<string>(
        'GOOGLE_CLIENT_ID',
      );

    if (!clientId) {
      throw new Error(
        'GOOGLE_CLIENT_ID is not configured',
      );
    }

    this.googleClient =
      new OAuth2Client(clientId);
  }

  async loginWithGoogle(
    credential: string,
    request?: {
      ip?: string;
      userAgent?: string;
    },
  ) {
    const clientId =
      this.configService.get<string>(
        'GOOGLE_CLIENT_ID',
      );

    if (!clientId) {
      throw new Error(
        'GOOGLE_CLIENT_ID is not configured',
      );
    }

    const ticket =
      await this.googleClient.verifyIdToken({
        idToken:
          credential,

        audience:
          clientId,
      });

    const payload =
      ticket.getPayload();

    if (!payload) {
      throw new UnauthorizedException(
        'Invalid Google credential',
      );
    }

    const email =
      payload.email
        ?.toLowerCase()
        .trim();

    if (
      !email ||
      !payload.email_verified
    ) {
      throw new UnauthorizedException(
        'Google email is not verified',
      );
    }

    const user =
      await this.prisma.user.findUnique({
        where: {
          email,
        },

        include: {
          institution: true,
        },
      });

    if (!user) {
      return {
        requiresOnboarding:
          true,

        googleProfile: {
          sub:
            payload.sub,

          email,

          name:
            payload.name ??
            '',

          picture:
            payload.picture ??
            null,
        },
      };
    }

    if (
      user.status !== 'ACTIVE'
    ) {
      throw new UnauthorizedException(
        'Your BRX EduNexa account is not active',
      );
    }

    const device =
      parseDevice(
        request?.userAgent,
      );

    const session =
      await this.sessionsService.create({
        userId:
          user.id,

        deviceType:
          device.deviceType,

        deviceName:
          device.deviceName,

        browser:
          device.browser,

        operatingSystem:
          device.operatingSystem,

        ipAddress:
          request?.ip,

        userAgent:
          request?.userAgent,
      });

    const accessToken =
      await this.jwtService.signAsync({
        sub:
          user.id,

        email:
          user.email,

        brxUid:
          user.brxUid,

        role:
          user.role,

        institutionId:
          user.institutionId,

        sessionId:
          session.id,
      });

    await this.emailService.sendLoginAlertEmail({
      firstName:
        user.firstName,

      brxUid:
        user.brxUid,

      email:
        user.email,

      deviceType:
        device.deviceType,

      deviceName:
        device.deviceName,

      browser:
        device.browser,

      operatingSystem:
        device.operatingSystem,

      ipAddress:
        request?.ip ??
        'Unavailable',

      loginTime:
        new Date().toISOString(),
    });

    return {
      requiresOnboarding:
        false,

      accessToken,

      tokenType:
        'Bearer',

      user: {
        id:
          user.id,

        brxUid:
          user.brxUid,

        email:
          user.email,

        firstName:
          user.firstName,

        lastName:
          user.lastName,

        role:
          user.role,

        status:
          user.status,

        institutionId:
          user.institutionId,

        institution:
          user.institution,
      },
    };
  }
}