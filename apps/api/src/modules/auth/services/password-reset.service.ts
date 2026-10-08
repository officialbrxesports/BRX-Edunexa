import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';

import * as bcrypt from 'bcrypt';
import { randomInt } from 'crypto';

import { PrismaService } from '../../../database/prisma.service';

import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { VerifyResetOtpDto } from '../dto/verify-reset-otp.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';

import { EmailService } from '../../notifications/services/email.service';
import { SessionsService } from '../../sessions/services/sessions.service';

@Injectable()
export class PasswordResetService {
  private readonly OTP_EXPIRY_MINUTES = 5;
  private readonly MAX_ATTEMPTS = 5;
  private readonly RESEND_COOLDOWN_SECONDS = 60;

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly sessionsService: SessionsService,
  ) {}

  private generateOtp(): string {
    return randomInt(100000, 1000000).toString();
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const email = dto.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    /*
     * Always return the same response when the email
     * does not exist. This prevents account enumeration.
     */
    if (!user) {
      return {
        success: true,
        message:
          'If an account exists with this email, a reset OTP has been sent.',
      };
    }

    const latestOtp =
      await this.prisma.passwordResetOtp.findFirst({
        where: {
          userId: user.id,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

    if (latestOtp) {
      const secondsSinceCreation = Math.floor(
        (Date.now() -
          latestOtp.createdAt.getTime()) /
          1000,
      );

      if (
        secondsSinceCreation <
        this.RESEND_COOLDOWN_SECONDS
      ) {
        const remaining =
          this.RESEND_COOLDOWN_SECONDS -
          secondsSinceCreation;

        throw new BadRequestException(
          `Please wait ${remaining} seconds before requesting another OTP`,
        );
      }
    }

    /*
     * Expire all previous unused OTPs.
     */
    await this.prisma.passwordResetOtp.updateMany({
      where: {
        userId: user.id,
        verifiedAt: null,
      },
      data: {
        expiresAt: new Date(),
      },
    });

    const otp = this.generateOtp();

    const otpHash = await bcrypt.hash(
      otp,
      10,
    );

    const expiresAt = new Date(
      Date.now() +
        this.OTP_EXPIRY_MINUTES *
          60 *
          1000,
    );

    await this.prisma.passwordResetOtp.create({
      data: {
        userId: user.id,
        otpHash,
        expiresAt,
        attempts: 0,
      },
    });

    /*
     * Send OTP through the configured email provider.
     * Never log the actual OTP.
     */
    await this.emailService.sendPasswordResetOtpEmail({
      firstName: user.firstName,
      email: user.email,
      otp,
      expiresInMinutes:
        this.OTP_EXPIRY_MINUTES,
    });

    return {
      success: true,
      message:
        'If an account exists with this email, a reset OTP has been sent.',
      expiresInSeconds:
        this.OTP_EXPIRY_MINUTES * 60,
      resendAfterSeconds:
        this.RESEND_COOLDOWN_SECONDS,
    };
  }

  async verifyOtp(dto: VerifyResetOtpDto) {
    const email = dto.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new BadRequestException(
        'Invalid or expired OTP',
      );
    }

    const otpRecord =
      await this.prisma.passwordResetOtp.findFirst({
        where: {
          userId: user.id,
          verifiedAt: null,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

    if (!otpRecord) {
      throw new BadRequestException(
        'No active OTP found. Please request a new OTP.',
      );
    }

    if (
      otpRecord.attempts >=
      this.MAX_ATTEMPTS
    ) {
      throw new BadRequestException(
        'Maximum OTP attempts exceeded. Please request a new OTP.',
      );
    }

    if (
      otpRecord.expiresAt.getTime() <=
      Date.now()
    ) {
      throw new BadRequestException(
        'OTP has expired. Please request a new OTP.',
      );
    }

    const valid = await bcrypt.compare(
      dto.otp,
      otpRecord.otpHash,
    );

    if (!valid) {
      const attempts =
        otpRecord.attempts + 1;

      await this.prisma.passwordResetOtp.update({
        where: {
          id: otpRecord.id,
        },
        data: {
          attempts,
        },
      });

      const remaining = Math.max(
        0,
        this.MAX_ATTEMPTS - attempts,
      );

      throw new BadRequestException(
        remaining > 0
          ? `Invalid OTP. ${remaining} attempts remaining.`
          : 'Invalid OTP. Maximum attempts exceeded.',
      );
    }

    return {
      success: true,
      message: 'OTP verified successfully',
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const email = dto.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new BadRequestException(
        'Invalid or expired OTP',
      );
    }

    const otpRecord =
      await this.prisma.passwordResetOtp.findFirst({
        where: {
          userId: user.id,
          verifiedAt: null,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

    if (!otpRecord) {
      throw new BadRequestException(
        'No active OTP found. Please request a new OTP.',
      );
    }

    if (
      otpRecord.attempts >=
      this.MAX_ATTEMPTS
    ) {
      throw new BadRequestException(
        'Maximum OTP attempts exceeded.',
      );
    }

    if (
      otpRecord.expiresAt.getTime() <=
      Date.now()
    ) {
      throw new BadRequestException(
        'OTP has expired. Please request a new OTP.',
      );
    }

    const valid = await bcrypt.compare(
      dto.otp,
      otpRecord.otpHash,
    );

    if (!valid) {
      const attempts =
        otpRecord.attempts + 1;

      await this.prisma.passwordResetOtp.update({
        where: {
          id: otpRecord.id,
        },
        data: {
          attempts,
        },
      });

      throw new BadRequestException(
        'Invalid OTP',
      );
    }

    const passwordHash =
      await bcrypt.hash(
        dto.password,
        12,
      );

    /*
     * Change password and consume the OTP
     * atomically.
     */
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          passwordHash,
        },
      }),

      this.prisma.passwordResetOtp.update({
        where: {
          id: otpRecord.id,
        },
        data: {
          verifiedAt: new Date(),
        },
      }),

      this.prisma.passwordResetOtp.updateMany({
        where: {
          userId: user.id,
          id: {
            not: otpRecord.id,
          },
          verifiedAt: null,
        },
        data: {
          expiresAt: new Date(),
        },
      }),
    ]);

    /*
     * Password reset invalidates all existing
     * login sessions.
     */
    await this.sessionsService.revokeAllSessions(
      user.id,
    );

    return {
      success: true,
      message:
        'Password reset successfully. Please log in again.',
    };
  }
}