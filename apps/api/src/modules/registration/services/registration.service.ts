import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

import { PrismaService } from '../../../database/prisma.service';
import { generateBrxUid } from '../../../common/brx-uid.util';

import { EmailService } from '../../notifications/services/email.service';

import { CreateRegistrationDto } from '../dto/create-registration.dto';
import { CreateRegistrationPasswordDto } from '../dto/create-registration-password.dto';
import { GoogleOnboardingDto } from '../dto/google-onboarding.dto';

@Injectable()
export class RegistrationService {
  private readonly sessionDurationMs = 30 * 60 * 1000;

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  // ============================================================
  // Helpers
  // ============================================================

  private generateInstitutionCode(name: string): string {
    const prefix =
      name
        .replace(/[^a-zA-Z0-9]/g, '')
        .slice(0, 6)
        .toUpperCase() || 'BRX';

    const suffix = randomBytes(4)
      .toString('hex')
      .toUpperCase();

    return `${prefix}-${suffix}`;
  }

  private parseEstablishedYear(
    value?: number | string | null,
  ): number | null {
    if (
      value === undefined ||
      value === null ||
      String(value).trim() === ''
    ) {
      return null;
    }

    const year = Number(value);

    if (
      !Number.isInteger(year) ||
      year < 2000 ||
      year > 2100
    ) {
      throw new BadRequestException(
        'Established year must be between 2000 and 2100',
      );
    }

    return year;
  }

  // ============================================================
  // NORMAL REGISTRATION
  // ============================================================

  async createRegistrationSession(
    dto: CreateRegistrationDto,
  ) {
    const institutionEmail =
      dto.institutionEmail.trim().toLowerCase();

    const ownerEmail =
      dto.ownerEmail.trim().toLowerCase();

    const institutionPhone =
      dto.institutionPhone.trim();

    const ownerPhone =
      dto.ownerPhone.trim();

    const [
      existingInstitutionEmail,
      existingInstitutionPhone,
      existingOwnerEmail,
      existingOwnerPhone,
    ] = await Promise.all([
      this.prisma.institution.findFirst({
        where: {
          email: institutionEmail,
        },
        select: {
          id: true,
        },
      }),

      this.prisma.institution.findFirst({
        where: {
          phone: institutionPhone,
        },
        select: {
          id: true,
        },
      }),

      this.prisma.user.findFirst({
        where: {
          email: ownerEmail,
        },
        select: {
          id: true,
        },
      }),

      this.prisma.user.findFirst({
        where: {
          phone: ownerPhone,
        },
        select: {
          id: true,
        },
      }),
    ]);

    if (existingInstitutionEmail) {
      throw new ConflictException(
        'An institution with this official email already exists',
      );
    }

    if (existingInstitutionPhone) {
      throw new ConflictException(
        'An institution with this official mobile number already exists',
      );
    }

    if (existingOwnerEmail) {
      throw new ConflictException(
        'An account with this email already exists',
      );
    }

    if (existingOwnerPhone) {
      throw new ConflictException(
        'An account with this mobile number already exists',
      );
    }

    const session =
      await this.prisma.registrationSession.create({
        data: {
          institutionType: dto.institutionType,

          institutionName:
            dto.institutionName.trim(),

          institutionEmail,

          institutionPhone,

          country:
            dto.country.trim(),

          state:
            dto.state.trim(),

          district:
            dto.district?.trim() || null,

          city:
            dto.city?.trim() || null,

          pinCode:
            dto.pinCode?.trim() || null,

          postOffice:
            dto.postOffice?.trim() || null,

          policeStation:
            dto.policeStation?.trim() || null,

          area:
            dto.area?.trim() || null,

          street:
            dto.street?.trim() || null,

          building:
            dto.building?.trim() || null,

          landmark:
            dto.landmark?.trim() || null,

          address:
            dto.address?.trim() || null,

          website:
            dto.website?.trim() || null,

          designation:
            dto.designation.trim(),

          firstName:
            dto.firstName.trim(),

          lastName:
            dto.lastName?.trim() || null,

          ownerEmail,

          ownerPhone,

          establishedYear:
            dto.establishedYear ?? null,

          registrationNumber:
            dto.registrationNumber?.trim() || null,

          gstin:
            dto.gstin?.trim() || null,

          passwordHash: null,

          mobileVerified: false,

          emailVerified: false,

          expiresAt:
            new Date(
              Date.now() +
                this.sessionDurationMs,
            ),
        },

        select: {
          id: true,
          institutionType: true,
          institutionName: true,
          institutionEmail: true,
          ownerEmail: true,
          expiresAt: true,
          emailVerified: true,
        },
      });

    return {
      success: true,

      message:
        'Registration session created. Please verify your email to continue.',

      session,

      requiresEmailVerification: true,
    };
  }

  // ============================================================
  // CREATE REGISTRATION PASSWORD
  // ============================================================

  async createRegistrationPassword(
    dto: CreateRegistrationPasswordDto,
  ) {
    if (
      dto.password !==
      dto.confirmPassword
    ) {
      throw new BadRequestException(
        'Password and confirm password do not match',
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

    if (session.completedAt) {
      throw new BadRequestException(
        'This registration has already been completed',
      );
    }

    if (
      session.expiresAt.getTime() <
      Date.now()
    ) {
      throw new BadRequestException(
        'Registration session has expired. Please start again.',
      );
    }

    if (!session.emailVerified) {
      throw new BadRequestException(
        'Please verify your email before creating a password',
      );
    }

    if (session.passwordHash) {
      throw new BadRequestException(
        'Password has already been created for this registration',
      );
    }

    const passwordHash =
      await bcrypt.hash(
        dto.password,
        12,
      );

    await this.prisma.registrationSession.update({
      where: {
        id: session.id,
      },

      data: {
        passwordHash,
      },
    });

    return {
      success: true,

      message:
        'Password created successfully. You can now complete registration.',

      sessionId: session.id,

      passwordCreated: true,
    };
  }

  // ============================================================
  // COMPLETE REGISTRATION
  // ============================================================

  async completeRegistration(
    sessionId: string,
  ) {
    const session =
      await this.prisma.registrationSession.findUnique({
        where: {
          id: sessionId,
        },
      });

    if (!session) {
      throw new NotFoundException(
        'Registration session not found',
      );
    }

    if (session.completedAt) {
      throw new BadRequestException(
        'This registration has already been completed',
      );
    }

    if (
      session.expiresAt.getTime() <
      Date.now()
    ) {
      throw new BadRequestException(
        'Registration session has expired. Please start again.',
      );
    }

    if (!session.emailVerified) {
      throw new BadRequestException(
        'Please verify your email before completing registration',
      );
    }

    if (!session.passwordHash) {
      throw new BadRequestException(
        'Please create your password before completing registration',
      );
    }

    const passwordHash =
      session.passwordHash;

    const [
      existingInstitutionEmail,
      existingInstitutionPhone,
      existingOwnerEmail,
      existingOwnerPhone,
    ] = await Promise.all([
      this.prisma.institution.findFirst({
        where: {
          email:
            session.institutionEmail,
        },
        select: {
          id: true,
        },
      }),

      this.prisma.institution.findFirst({
        where: {
          phone:
            session.institutionPhone,
        },
        select: {
          id: true,
        },
      }),

      this.prisma.user.findFirst({
        where: {
          email:
            session.ownerEmail,
        },
        select: {
          id: true,
        },
      }),

      this.prisma.user.findFirst({
        where: {
          phone:
            session.ownerPhone,
        },
        select: {
          id: true,
        },
      }),
    ]);

    if (existingInstitutionEmail) {
      throw new ConflictException(
        'An institution with this official email already exists',
      );
    }

    if (existingInstitutionPhone) {
      throw new ConflictException(
        'An institution with this official mobile number already exists',
      );
    }

    if (existingOwnerEmail) {
      throw new ConflictException(
        'An account with this email already exists',
      );
    }

    if (existingOwnerPhone) {
      throw new ConflictException(
        'An account with this mobile number already exists',
      );
    }

    const institutionCode =
      this.generateInstitutionCode(
        session.institutionName,
      );

    const brxUid =
      generateBrxUid();

    const result =
      await this.prisma.$transaction(
        async (tx) => {
          const institution =
            await tx.institution.create({
              data: {
                name:
                  session.institutionName,

                code:
                  institutionCode,

                type:
                  session.institutionType,

                status:
                  'ACTIVE',

                email:
                  session.institutionEmail,

                phone:
                  session.institutionPhone,

                country:
                  session.country,

                state:
                  session.state,

                city:
                  session.city,

                address:
                  session.address,

                website:
                  session.website,
              },
            });

          const head =
            await tx.user.create({
              data: {
                email:
                  session.ownerEmail,

                passwordHash,

                firstName:
                  session.firstName,

                lastName:
                  session.lastName,

                phone:
                  session.ownerPhone,

                role:
                  'HEAD',

                status:
                  'ACTIVE',

                institutionId:
                  institution.id,

                brxUid,
              },

              select: {
                id: true,
                brxUid: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                role: true,
                status: true,
                institutionId: true,
              },
            });

          await tx.registrationSession.update({
            where: {
              id: session.id,
            },

            data: {
              completedAt:
                new Date(),
            },
          });

          return {
            institution,
            head,
          };
        },
      );

    await this.emailService.sendWelcomeEmail({
      email:
        result.head.email,

      firstName:
        result.head.firstName,

      brxUid:
        result.head.brxUid,
    });

    return {
      success: true,

      message:
        'Registration completed successfully. Your BRX UID has been generated.',

      institution: {
        id:
          result.institution.id,

        name:
          result.institution.name,

        code:
          result.institution.code,

        type:
          result.institution.type,
      },

      head: {
        id:
          result.head.id,

        brxUid:
          result.head.brxUid,

        email:
          result.head.email,

        firstName:
          result.head.firstName,

        lastName:
          result.head.lastName,

        phone:
          result.head.phone,

        role:
          result.head.role,

        status:
          result.head.status,
      },

      requiresLogin: true,
    };
  }

  // ============================================================
  // GOOGLE ONBOARDING
  // ============================================================

  async completeGoogleOnboarding(
    dto: GoogleOnboardingDto,
  ) {
    const googleProfile =
      await this.verifyGoogleCredential(
        dto.credential,
      );

    const googleEmail =
      googleProfile.email
        .trim()
        .toLowerCase();

    const institutionEmail =
      dto.institutionEmail
        .trim()
        .toLowerCase();

    const institutionPhone =
      dto.institutionPhone.trim();

    const ownerPhone =
      dto.ownerPhone.trim();

    const existingGoogleUser =
      await this.prisma.user.findFirst({
        where: {
          email: googleEmail,
        },

        select: {
          id: true,
          status: true,
        },
      });

    if (existingGoogleUser) {
      throw new ConflictException(
        'An account with this Google email already exists. Please login instead.',
      );
    }

    const [
      existingInstitutionEmail,
      existingInstitutionPhone,
      existingOwnerPhone,
    ] = await Promise.all([
      this.prisma.institution.findFirst({
        where: {
          email:
            institutionEmail,
        },

        select: {
          id: true,
        },
      }),

      this.prisma.institution.findFirst({
        where: {
          phone:
            institutionPhone,
        },

        select: {
          id: true,
        },
      }),

      this.prisma.user.findFirst({
        where: {
          phone:
            ownerPhone,
        },

        select: {
          id: true,
        },
      }),
    ]);

    if (existingInstitutionEmail) {
      throw new ConflictException(
        'An institution with this official email already exists',
      );
    }

    if (existingInstitutionPhone) {
      throw new ConflictException(
        'An institution with this official mobile number already exists',
      );
    }

    if (existingOwnerPhone) {
      throw new ConflictException(
        'An account with this mobile number already exists',
      );
    }

    const establishedYear =
      this.parseEstablishedYear(
        dto.establishedYear,
      );

    const session =
      await this.prisma.registrationSession.create({
        data: {
          institutionType:
            dto.institutionType,

          institutionName:
            dto.institutionName.trim(),

          institutionEmail,

          institutionPhone,

          country:
            dto.country.trim(),

          state:
            dto.state.trim(),

          district:
            dto.district?.trim() || null,

          city:
            dto.city?.trim() || null,

          pinCode:
            dto.pinCode?.trim() || null,

          postOffice:
            dto.postOffice?.trim() || null,

          policeStation:
            dto.policeStation?.trim() || null,

          area:
            dto.area?.trim() || null,

          street:
            dto.street?.trim() || null,

          building:
            dto.building?.trim() || null,

          landmark:
            dto.landmark?.trim() || null,

          address:
            dto.address?.trim() || null,

          website:
            dto.website?.trim() || null,

          designation:
            dto.designation.trim(),

          firstName:
            dto.firstName.trim(),

          lastName:
            dto.lastName?.trim() || null,

          // Google verified email
          ownerEmail:
            googleEmail,

          ownerPhone,

          passwordHash:
            null,

          establishedYear,

          registrationNumber:
            dto.registrationNumber?.trim() ||
            null,

          gstin:
            dto.gstin?.trim() || null,

          // Google already verified the email.
          emailVerified:
            true,

          mobileVerified:
            false,

          expiresAt:
            new Date(
              Date.now() +
                this.sessionDurationMs,
            ),
        },

        select: {
          id: true,
          institutionType: true,
          institutionName: true,
          institutionEmail: true,
          ownerEmail: true,
          firstName: true,
          lastName: true,
          expiresAt: true,
          emailVerified: true,
        },
      });

    return {
      success: true,

      message:
        'Google verification successful. Create your password to continue.',

      session,

      requiresPassword: true,

      emailVerified: true,

      googleVerified: true,
    };
  }

  // ============================================================
  // GOOGLE CREDENTIAL VERIFICATION
  // ============================================================

  private async verifyGoogleCredential(
    credential: string,
  ) {
    const clientId =
      process.env.GOOGLE_CLIENT_ID;

    if (!clientId) {
      throw new BadRequestException(
        'Google authentication is not configured',
      );
    }

    try {
      const response =
        await fetch(
          `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(
            credential,
          )}`,
        );

      if (!response.ok) {
        throw new Error(
          'Google token verification failed',
        );
      }

      const payload =
        (await response.json()) as {
          sub?: string;
          email?: string;
          email_verified?:
            | string
            | boolean;
          name?: string;
          picture?: string;
          aud?: string;
        };

      if (
        !payload.sub ||
        !payload.email
      ) {
        throw new Error(
          'Invalid Google profile',
        );
      }

      if (
        payload.aud !==
        clientId
      ) {
        throw new Error(
          'Google client ID mismatch',
        );
      }

      const emailVerified =
        payload.email_verified === true ||
        payload.email_verified ===
          'true';

      if (!emailVerified) {
        throw new Error(
          'Google email is not verified',
        );
      }

      return {
        sub:
          payload.sub,

        email:
          payload.email,

        name:
          payload.name ?? '',

        picture:
          payload.picture ?? null,
      };
    } catch {
      throw new BadRequestException(
        'Google verification failed. Please try again.',
      );
    }
  }
}