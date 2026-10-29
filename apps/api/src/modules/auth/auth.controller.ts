import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './login.dto';
import { GoogleLoginDto } from './google-login.dto';

const COOKIE_NAME = 'brx_session';

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
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.login(dto);
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
