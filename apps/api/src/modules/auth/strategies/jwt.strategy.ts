import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

import { PassportStrategy } from '@nestjs/passport';

import {
  ExtractJwt,
  Strategy,
} from 'passport-jwt';

import { SessionsService } from '../../sessions/services/sessions.service';

interface JwtPayload {
  sub: string;
  email: string;
  brxUid?: string;
  role: string;
  institutionId?: string | null;
  sessionId: string;
}

@Injectable()
export class JwtStrategy
  extends PassportStrategy(Strategy)
{
  constructor(
    private readonly configService: ConfigService,
    private readonly sessionsService: SessionsService,
  ) {
    const secret =
      configService.get<string>(
        'JWT_SECRET',
      );

    if (!secret) {
      throw new Error(
        'JWT_SECRET is not configured',
      );
    }

    super({
      jwtFromRequest:
        ExtractJwt.fromAuthHeaderAsBearerToken(),

      ignoreExpiration: false,

      secretOrKey: secret,
    });
  }

  async validate(
    payload: JwtPayload,
  ) {
    if (
      !payload.sub ||
      !payload.email ||
      !payload.sessionId
    ) {
      throw new UnauthorizedException(
        'Invalid authentication token',
      );
    }

    const active =
      await this.sessionsService.isActive(
        payload.sessionId,
        payload.sub,
      );

    if (!active) {
      throw new UnauthorizedException(
        'Your login session has expired or been logged out',
      );
    }

    await this.sessionsService.touch(
      payload.sessionId,
    );

    return {
      userId: payload.sub,
      email: payload.email,
      brxUid: payload.brxUid ?? null,
      role: payload.role,
      institutionId:
        payload.institutionId ?? null,
      sessionId: payload.sessionId,
    };
  }
}