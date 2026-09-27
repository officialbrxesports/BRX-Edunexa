import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import * as bcrypt from 'bcrypt';
import { randomInt } from 'crypto';

import { PrismaService } from '../../../database/prisma.service';

import {
  RegistrationVerificationType,
} from '../../../generated/prisma/enums';

import { SendOtpDto } from '../dto/send-otp.dto';
import { VerifyOtpDto } from '../dto/verify-otp.dto';

@Injectable()
export class OtpService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  // ============================================
  // Security settings
  // ============================================

  private readonly OTP_EXPIRY_MINUTES = 5;

  private readonly MAX_ATTEMPTS = 5;

  private readonly RESEND_COOLDOWN_SECONDS = 60;

  // ============================================
  // Generate secure 6 digit OTP
  // ============================================

  private generateOtp(): string {
    return randomInt(
      100000,
      1000000,
    ).toString();
  }

  // ============================================
  // Send OTP
  // ============================================

  async sendOtp(dto: SendOtpDto) {
    const session =
      await this.prisma.registrationSession.findUnique({
        where: {
          id: dto.sessionId,
        },
      });

    if (!session) {
      throw new NotFoundException(
        'Registration session not found',
      );
    }

    // ==========================================
    // Session expiry
    // ==========================================

    if (
      session.expiresAt.getTime() <=
      Date.now()
    ) {
      throw new BadRequestException(
        'Registration session has expired',
      );
    }

    // ==========================================
    // Already verified
    // ==========================================

    if (
      dto.type ===
        RegistrationVerificationType.MOBILE &&
      session.mobileVerified
    ) {
      throw new BadRequestException(
        'Mobile number is already verified',
      );
    }

    if (
      dto.type ===
        RegistrationVerificationType.EMAIL &&
      session.emailVerified
    ) {
      throw new BadRequestException(
        'Email is already verified',
      );
    }

    // ==========================================
    // Check latest OTP
    // ==========================================

    const latestOtp =
      await this.prisma.registrationOtpVerification.findFirst(
        {
          where: {
            sessionId: dto.sessionId,
            type: dto.type,
          },

          orderBy: {
            createdAt: 'desc',
          },
        },
      );

    if (latestOtp) {
      const secondsSinceCreation =
        Math.floor(
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

    // ==========================================
    // Invalidate previous active OTPs
    // ==========================================

    await this.prisma.registrationOtpVerification.updateMany(
      {
        where: {
          sessionId: dto.sessionId,
          type: dto.type,
          verifiedAt: null,
        },

        data: {
          expiresAt: new Date(),
        },
      },
    );

    // ==========================================
    // Generate OTP
    // ==========================================

    const otp = this.generateOtp();

    // ==========================================
    // Hash OTP
    // ==========================================

    const otpHash = await bcrypt.hash(
      otp,
      10,
    );

    // ==========================================
    // Expiry
    // ==========================================

    const expiresAt = new Date(
      Date.now() +
        this.OTP_EXPIRY_MINUTES *
          60 *
          1000,
    );

    // ==========================================
    // Save OTP
    // ==========================================

    await this.prisma.registrationOtpVerification.create(
      {
        data: {
          sessionId: dto.sessionId,

          type: dto.type,

          otpHash,

          expiresAt,

          attempts: 0,
        },
      },
    );

    // ==========================================
    // DELIVERY PLACEHOLDER
    // ==========================================
    //
    // IMPORTANT:
    // In production this OTP will be sent
    // through SMS / Email provider.
    //
    // For local development we log it in
    // the server terminal only.
    // ==========================================

    console.log(
      `[BRX OTP] ${dto.type} OTP for session ${dto.sessionId}: ${otp}`,
    );

    return {
      success: true,

      message:
        dto.type ===
        RegistrationVerificationType.MOBILE
          ? 'Mobile OTP sent successfully'
          : 'Email OTP sent successfully',

      expiresInSeconds:
        this.OTP_EXPIRY_MINUTES * 60,

      resendAfterSeconds:
        this.RESEND_COOLDOWN_SECONDS,
    };
  }

  // ============================================
  // Verify OTP
  // ============================================

  async verifyOtp(dto: VerifyOtpDto) {
    const session =
      await this.prisma.registrationSession.findUnique({
        where: {
          id: dto.sessionId,
        },
      });

    if (!session) {
      throw new NotFoundException(
        'Registration session not found',
      );
    }

    // ==========================================
    // Session expiry
    // ==========================================

    if (
      session.expiresAt.getTime() <=
      Date.now()
    ) {
      throw new BadRequestException(
        'Registration session has expired',
      );
    }

    // ==========================================
    // Latest OTP
    // ==========================================

    const otpRecord =
      await this.prisma.registrationOtpVerification.findFirst(
        {
          where: {
            sessionId: dto.sessionId,
            type: dto.type,
            verifiedAt: null,
          },

          orderBy: {
            createdAt: 'desc',
          },
        },
      );

    if (!otpRecord) {
      throw new BadRequestException(
        'No active OTP found. Please request a new OTP.',
      );
    }

    // ==========================================
    // Maximum attempts
    // ==========================================

    if (
      otpRecord.attempts >=
      this.MAX_ATTEMPTS
    ) {
      throw new BadRequestException(
        'Maximum OTP attempts exceeded. Please request a new OTP.',
      );
    }

    // ==========================================
    // Expiry
    // ==========================================

    if (
      otpRecord.expiresAt.getTime() <=
      Date.now()
    ) {
      throw new BadRequestException(
        'OTP has expired. Please request a new OTP.',
      );
    }

    // ==========================================
    // Compare OTP
    // ==========================================

    const valid = await bcrypt.compare(
      dto.otp,
      otpRecord.otpHash,
    );

    if (!valid) {
      const updatedAttempts =
        otpRecord.attempts + 1;

      await this.prisma.registrationOtpVerification.update(
        {
          where: {
            id: otpRecord.id,
          },

          data: {
            attempts: updatedAttempts,
          },
        },
      );

      const remaining =
        Math.max(
          0,
          this.MAX_ATTEMPTS -
            updatedAttempts,
        );

      throw new BadRequestException(
        remaining > 0
          ? `Invalid OTP. ${remaining} attempts remaining.`
          : 'Invalid OTP. Maximum attempts exceeded.',
      );
    }

    // ==========================================
    // Mark OTP verified + session verified
    // ==========================================

    await this.prisma.$transaction(
      async (tx) => {
        await tx.registrationOtpVerification.update(
          {
            where: {
              id: otpRecord.id,
            },

            data: {
              verifiedAt: new Date(),
            },
          },
        );

        if (
          dto.type ===
          RegistrationVerificationType.MOBILE
        ) {
          await tx.registrationSession.update(
            {
              where: {
                id: dto.sessionId,
              },

              data: {
                mobileVerified: true,
              },
            },
          );
        }

        if (
          dto.type ===
          RegistrationVerificationType.EMAIL
        ) {
          await tx.registrationSession.update(
            {
              where: {
                id: dto.sessionId,
              },

              data: {
                emailVerified: true,
              },
            },
          );
        }
      },
    );

    // ==========================================
    // Return verification status
    // ==========================================

    const updatedSession =
      await this.prisma.registrationSession.findUnique(
        {
          where: {
            id: dto.sessionId,
          },

          select: {
            mobileVerified: true,
            emailVerified: true,
          },
        },
      );

    return {
      success: true,

      message:
        dto.type ===
        RegistrationVerificationType.MOBILE
          ? 'Mobile number verified successfully'
          : 'Email verified successfully',

      verification: {
        mobileVerified:
          updatedSession?.mobileVerified ??
          false,

        emailVerified:
          updatedSession?.emailVerified ??
          false,

        completed: Boolean(
          updatedSession?.mobileVerified &&
            updatedSession?.emailVerified,
        ),
      },
    };
  }
}