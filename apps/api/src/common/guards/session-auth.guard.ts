import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from '../../modules/auth/auth.service';

const COOKIE_NAME = 'brx_session';

export type AuthenticatedUser = {
  id: string;
  institutionId: string | null;
  name: string;
  email: string;
  eduNexaId: string;
  role: string;
};

export type AuthenticatedRequest = Request & {
  user?: AuthenticatedUser;
};

function getSessionToken(request: Request): string | undefined {
  const cookieHeader = request.headers.cookie;

  if (!cookieHeader) return undefined;

  const entry = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${COOKIE_NAME}=`));

  if (!entry) return undefined;

  try {
    return decodeURIComponent(entry.slice(COOKIE_NAME.length + 1)) || undefined;
  } catch {
    return undefined;
  }
}

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request =
      context.switchToHttp().getRequest<AuthenticatedRequest>();

    const token = getSessionToken(request);

    if (!token) {
      throw new UnauthorizedException('Authentication required');
    }

    const user = await this.authService.getCurrentUser(token);

    if (!user) {
      throw new UnauthorizedException('Invalid or expired session');
    }

    request.user = user;
    return true;
  }
}