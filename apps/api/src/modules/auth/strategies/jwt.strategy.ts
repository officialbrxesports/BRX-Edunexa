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

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  institutionId?: string | null;
}

@Injectable()
export class JwtStrategy
  extends PassportStrategy(Strategy)
{
  constructor(
    private readonly configService: ConfigService,
  ) {
    const secret =
      configService.get<string>('JWT_SECRET');

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
      !payload.email
    ) {
      throw new UnauthorizedException(
        'Invalid authentication token',
      );
    }

    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      institutionId:
        payload.institutionId ?? null,
    };
  }
}