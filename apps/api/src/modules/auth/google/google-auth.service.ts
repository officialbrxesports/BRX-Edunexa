import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { OAuth2Client } from 'google-auth-library';

import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class GoogleAuthService {
  private readonly googleClient: OAuth2Client;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
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

    this.googleClient = new OAuth2Client(clientId);
  }

  async loginWithGoogle(
    credential: string,
  ) {
    const clientId =
      this.configService.getOrThrow<string>(
        'GOOGLE_CLIENT_ID',
      );

    let ticket;

    try {
      ticket =
        await this.googleClient.verifyIdToken({
          idToken: credential,
          audience: clientId,
        });
    } catch {
      throw new UnauthorizedException(
        'Invalid Google authentication',
      );
    }

    const payload =
      ticket.getPayload();

    if (!payload) {
      throw new UnauthorizedException(
        'Unable to read Google account',
      );
    }

    const googleEmail =
      payload.email?.trim().toLowerCase();

    if (!googleEmail) {
      throw new UnauthorizedException(
        'Google account email is unavailable',
      );
    }

    if (payload.email_verified !== true) {
      throw new UnauthorizedException(
        'Google email is not verified',
      );
    }

    /*
     * IMPORTANT:
     *
     * We do NOT create a random BRX account here.
     *
     * The BRX database decides whether this
     * Google account already belongs to a
     * HEAD / TEACHER / STAFF / STUDENT.
     *
     * Invitation-based account creation will be
     * added in the next phase.
     */

    const user =
      await this.prisma.user.findUnique({
        where: {
          email: googleEmail,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          status: true,
          institutionId: true,
        },
      });

    if (!user) {
      throw new UnauthorizedException(
        'No BRX EduNexa account is linked to this Google account. Please use your institution invitation or create an institution account.',
      );
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException(
        `Your BRX EduNexa account is ${user.status.toLowerCase()}. Please contact your institution administrator.`,
      );
    }

    const accessToken =
      await this.jwtService.signAsync({
        sub: user.id,
        email: user.email,
        role: user.role,
        institutionId:
          user.institutionId,
      });

    return {
      accessToken,
      tokenType: 'Bearer',
      user,
    };
  }
}