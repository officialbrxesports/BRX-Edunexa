import {
  Body,
  Controller,
  BadRequestException,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AttemptLimiter } from '../../common/security/attempt-limiter';
import { AuthService } from './auth.service';
import { LoginDto } from './login.dto';
import { GoogleLoginDto } from './google-login.dto';
import { ChangePasswordDto } from './change-password.dto';

const COOKIE_NAME = 'brx_session';

// 8 wrong passwords per person and device in 15 minutes, then a short lock.
const loginLimiter = new AttemptLimiter(8, 15 * 60 * 1000);
const passwordChangeLimiter = new AttemptLimiter(5, 15 * 60 * 1000);

function getSessionToken(request: Request): string | undefined {
  const cookieHeader = request.headers.cookie;

  if (!cookieHeader) return undefined;

  const entry = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${COOKIE_NAME}=`));

  if (!entry) return undefined;

  const token = entry.slice(COOKIE_NAME.length + 1);

  try {
    return decodeURIComponent(token) || undefined;
  } catch {
    return undefined;
  }
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private setSessionCookie(response: Response, session: {
    sessionToken: string;
    expiresAt: Date;
  }) {
    response.cookie(COOKIE_NAME, session.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires: session.expiresAt,
    });
  }

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const key = `${request.ip ?? 'unknown'}|${dto.identifier.trim().toLowerCase()}`;
    loginLimiter.assertAllowed(key);

    let result: Awaited<ReturnType<AuthService['login']>>;

    try {
      result = await this.authService.login(dto);
    } catch (error) {
      if (error instanceof UnauthorizedException) loginLimiter.recordFailure(key);
      throw error;
    }

    loginLimiter.clear(key);
    this.setSessionCookie(response, result);

    return {
      user: result.user,
      expiresAt: result.expiresAt,
    };
  }

  @Post('google')
  async googleLogin(
    @Body() dto: GoogleLoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.loginWithGoogle(dto.credential);
    this.setSessionCookie(response, result);

    return {
      user: result.user,
      expiresAt: result.expiresAt,
    };
  }

  @Get('me')
  async me(@Req() request: Request) {
    const user = await this.authService.getCurrentUser(
      getSessionToken(request),
    );

    return { user };
  }

  @Post('change-password')
  async changePassword(
    @Req() request: Request,
    @Body() dto: ChangePasswordDto,
  ) {
    const token = getSessionToken(request);
    const key = token ?? request.ip ?? 'unknown';
    passwordChangeLimiter.assertAllowed(key);

    try {
      const result = await this.authService.changePassword(token, dto);
      passwordChangeLimiter.clear(key);
      return result;
    } catch (error) {
      if (error instanceof BadRequestException) {
        passwordChangeLimiter.recordFailure(key);
      }
      throw error;
    }
  }

  @Post('logout')
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.authService.logout(getSessionToken(request));

    response.clearCookie(COOKIE_NAME, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return { success: true };
  }
}