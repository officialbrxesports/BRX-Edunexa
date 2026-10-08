import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import type { Request } from 'express';

import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';

import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { VerifyResetOtpDto } from '../dto/verify-reset-otp.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';

import { GoogleLoginDto } from '../google/dto/google-login.dto';

import { JwtAuthGuard } from '../guards/jwt-auth.guard';

import { AuthService } from '../services/auth.service';
import { PasswordResetService } from '../services/password-reset.service';
import { GoogleAuthService } from '../google/google-auth.service';

interface AuthenticatedRequest
  extends Request {
  user: {
    userId: string;
    email: string;
    brxUid: string | null;
    role: string;
    institutionId: string | null;
    sessionId: string;
  };
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,

    private readonly passwordResetService:
      PasswordResetService,

    private readonly googleAuthService:
      GoogleAuthService,
  ) {}

  @Post('register')
  async register(
    @Body() dto: RegisterDto,
  ) {
    return this.authService.register(dto);
  }

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
  ) {
    return this.authService.login(
      dto,
      {
        ip:
          req.ip ??
          req.socket.remoteAddress ??
          undefined,

        userAgent:
          req.headers[
            'user-agent'
          ] ?? undefined,
      },
    );
  }

  @Post('google')
  async googleLogin(
    @Body() dto: GoogleLoginDto,
    @Req() req: Request,
  ) {
    return this.googleAuthService.loginWithGoogle(
      dto.credential,
      {
        ip:
          req.ip ??
          req.socket.remoteAddress ??
          undefined,

        userAgent:
          req.headers[
            'user-agent'
          ] ?? undefined,
      },
    );
  }

  @Post('forgot-password')
  async forgotPassword(
    @Body() dto: ForgotPasswordDto,
  ) {
    return this.passwordResetService.forgotPassword(
      dto,
    );
  }

  @Post('verify-reset-otp')
  async verifyResetOtp(
    @Body() dto: VerifyResetOtpDto,
  ) {
    return this.passwordResetService.verifyOtp(
      dto,
    );
  }

  @Post('reset-password')
  async resetPassword(
    @Body() dto: ResetPasswordDto,
  ) {
    return this.passwordResetService.resetPassword(
      dto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(
    @Req() req: AuthenticatedRequest,
  ) {
    return {
      user: req.user,
    };
  }
}