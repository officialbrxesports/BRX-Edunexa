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

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
    role: string;
    institutionId: string | null;
  };
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly passwordResetService: PasswordResetService,
    private readonly googleAuthService: GoogleAuthService,
  ) {}

  // ============================================
  // Legacy registration endpoint
  // ============================================

  @Post('register')
  async register(
    @Body() dto: RegisterDto,
  ) {
    return this.authService.register(dto);
  }

  // ============================================
  // Existing email/password login
  // ============================================

  @Post('login')
  async login(
    @Body() dto: LoginDto,
  ) {
    return this.authService.login(dto);
  }

  // ============================================
  // Google Login
  // ============================================

  @Post('google')
  async googleLogin(
    @Body() dto: GoogleLoginDto,
  ) {
    return this.googleAuthService.loginWithGoogle(
      dto.credential,
    );
  }

  // ============================================
  // Forgot Password
  // ============================================

  @Post('forgot-password')
  async forgotPassword(
    @Body() dto: ForgotPasswordDto,
  ) {
    return this.passwordResetService.forgotPassword(
      dto,
    );
  }

  // ============================================
  // Verify Password Reset OTP
  // ============================================

  @Post('verify-reset-otp')
  async verifyResetOtp(
    @Body() dto: VerifyResetOtpDto,
  ) {
    return this.passwordResetService.verifyOtp(
      dto,
    );
  }

  // ============================================
  // Reset Password
  // ============================================

  @Post('reset-password')
  async resetPassword(
    @Body() dto: ResetPasswordDto,
  ) {
    return this.passwordResetService.resetPassword(
      dto,
    );
  }

  // ============================================
  // Current authenticated user
  // ============================================

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