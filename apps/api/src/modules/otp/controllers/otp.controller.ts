import {
  Body,
  Controller,
  Post,
} from '@nestjs/common';

import { OtpService } from '../services/otp.service';

import { SendOtpDto } from '../dto/send-otp.dto';
import { VerifyOtpDto } from '../dto/verify-otp.dto';

@Controller('otp')
export class OtpController {
  constructor(
    private readonly otpService: OtpService,
  ) {}

  // ============================================
  // Send OTP
  // ============================================

  @Post('send')
  async sendOtp(
    @Body() dto: SendOtpDto,
  ) {
    return this.otpService.sendOtp(dto);
  }

  // ============================================
  // Verify OTP
  // ============================================

  @Post('verify')
  async verifyOtp(
    @Body() dto: VerifyOtpDto,
  ) {
    return this.otpService.verifyOtp(dto);
  }
}