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
      this.configService.get<string>('GOOGLE_CLIENT_ID');

    if (!clientId) {
      throw new Error('GOOGLE_CLIENT_ID is not configured');
    }

    this.googleClient = new OAuth2Client(clientId);
  }

  async loginWithGoogle(credential: string) {
    const clientId =
      this.configService.get<string>('GOOGLE_CLIENT_ID');

    if (!clientId) {
      throw new Error('GOOGLE_CLIENT_ID is not configured');
    }

    const ticket =
      await this.googleClient.verifyIdToken({
        idToken: credential,
        audience: clientId,
      });

    const payload = ticket.getPayload();

    if (!payload) {
      throw new UnauthorizedException(
        'Invalid Google credential',
      );
    }

    const email = payload.email?.toLowerCase().trim();

    if (!email || !payload.email_verified) {
      throw new UnauthorizedException(
        'Google email is not verified',
      );
    }

    const googleSub = payload.sub;
    const name = payload.name ?? '';
    const picture = payload.picture ?? null;

    const user = await this.prisma.user.findUnique({
      where: {
        email,
      },
      include: {
        institution: true,
      },
    });

    // NEW GOOGLE USER
    // Do NOT create a HEAD automatically.
    if (!user) {
      return {
        requiresOnboarding: true,

        googleProfile: {
          sub: googleSub,
          email,
          name,
          picture,
        },
      };
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException(
        'Your BRX EduNexa account is not active',
      );
    }

    const accessToken =
      await this.jwtService.signAsync({
        sub: user.id,
        email: user.email,
        role: user.role,
        institutionId: user.institutionId,
      });

    return {
      requiresOnboarding: false,

      accessToken,

      tokenType: 'Bearer',

      user: {
        id: user.id,
        email: user.email,
        name: user.email.split("@")[0],
        role: user.role,
        status: user.status,
        institutionId: user.institutionId,
        institution: user.institution,
      },
    };
  }
}