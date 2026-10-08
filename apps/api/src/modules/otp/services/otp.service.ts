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

import { EmailService } from '../../notifications/services/email.service';

import { SendOtpDto } from '../dto/send-otp.dto';
import { VerifyOtpDto } from '../dto/verify-otp.dto';

@Injectable()
export class OtpService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  private readonly OTP_EXPIRY_MINUTES = 5;

  private readonly MAX_ATTEMPTS = 5;

  private readonly RESEND_COOLDOWN_SECONDS = 60;

  private generateOtp(): string {
    return randomInt(100000, 1000000).toString();
  }

  async sendOtp(dto: SendOtpDto) {
    if (
      dto.type !==
      RegistrationVerificationType.EMAIL
    ) {
      throw new BadRequestException(
        'Registration OTP is available only through email',
      );
    }

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

    if (session.expiresAt.getTime() <= Date.now()) {
      throw new BadRequestException(
        'Registration session has expired',
      );
    }

    if (session.emailVerified) {
      throw new BadRequestException(
        'Email is already verified',
      );
    }

    const latestOtp =
      await this.prisma.registrationOtpVerification.findFirst({
        where: {
          sessionId: dto.sessionId,
          type: dto.type,
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

    await this.prisma.registrationOtpVerification.updateMany({
      where: {
        sessionId: dto.sessionId,
        type: dto.type,
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

    await this.prisma.registrationOtpVerification.create({
      data: {
        sessionId: dto.sessionId,
        type: dto.type,
        otpHash,
        expiresAt,
        attempts: 0,
      },
    });

    await this.emailService.sendRegistrationOtpEmail({
      firstName: session.firstName,
      email: session.ownerEmail,
      otp,
      expiresInMinutes:
        this.OTP_EXPIRY_MINUTES,
    });

    return {
      success: true,

      message:
        'Verification OTP sent to your email successfully',

      expiresInSeconds:
        this.OTP_EXPIRY_MINUTES * 60,

      resendAfterSeconds:
        this.RESEND_COOLDOWN_SECONDS,
    };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    if (
      dto.type !==
      RegistrationVerificationType.EMAIL
    ) {
      throw new BadRequestException(
        'Registration OTP is available only through email',
      );
    }

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

    if (session.expiresAt.getTime() <= Date.now()) {
      throw new BadRequestException(
        'Registration session has expired',
      );
    }

    const otpRecord =
      await this.prisma.registrationOtpVerification.findFirst({
        where: {
          sessionId: dto.sessionId,
          type: dto.type,
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
      otpRecord.expiresAt.getTime() <= Date.now()
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
      const updatedAttempts =
        otpRecord.attempts + 1;

      await this.prisma.registrationOtpVerification.update({
        where: {
          id: otpRecord.id,
        },
        data: {
          attempts: updatedAttempts,
        },
      });

      const remaining = Math.max(
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

    await this.prisma.$transaction(
      async (tx) => {
        await tx.registrationOtpVerification.update({
          where: {
            id: otpRecord.id,
          },
          data: {
            verifiedAt: new Date(),
          },
        });

        await tx.registrationSession.update({
          where: {
            id: dto.sessionId,
          },
          data: {
            emailVerified: true,
          },
        });
      },
    );

    return {
      success: true,

      message:
        'Email verified successfully',

      verification: {
        mobileVerified: false,

        emailVerified: true,

        completed: true,
      },
    };
  }
}