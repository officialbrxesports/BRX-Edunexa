import { generateBrxUid } from '../../../common/brx-uid.util';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

import * as crypto from 'crypto';

import { JwtService } from '@nestjs/jwt';

import { GoogleOnboardingDto } from '../dto/google-onboarding.dto';

import * as bcrypt from 'bcrypt';

import { PrismaService } from '../../../database/prisma.service';

import {
  InstitutionStatus,
  UserRole,
  UserStatus,
} from '../../../generated/prisma/enums';

import { CreateRegistrationDto } from '../dto/create-registration.dto';

@Injectable()
export class RegistrationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  // ============================================
  // Generate unique institution code
  // ============================================

  private async generateInstitutionCode(
    name: string,
  ): Promise<string> {
    const cleanedName = name
      .replace(/[^a-zA-Z0-9]/g, '')
      .toUpperCase()
      .slice(0, 5);

    const prefix = cleanedName || 'BRX';

    for (let attempt = 0; attempt < 20; attempt++) {
      const random = Math.floor(
        1000 + Math.random() * 9000,
      );

      const code = `${prefix}${random}`;

      const existing =
        await this.prisma.institution.findUnique({
          where: {
            code,
          },
          select: {
            id: true,
          },
        });

      if (!existing) {
        return code;
      }
    }

    throw new InternalServerErrorException(
      'Unable to generate unique institution code',
    );
  }

  // ============================================
  // Create registration session
  // ============================================

  async createRegistrationSession(
    dto: CreateRegistrationDto,
  ) {
    const institutionEmail =
      dto.email.trim().toLowerCase();

    const ownerEmail =
      dto.ownerEmail.trim().toLowerCase();

    const institutionPhone =
      dto.phone.trim();

    const ownerPhone =
      dto.ownerPhone.trim();

    // ==========================================
    // Existing institution
    // ==========================================

    const existingInstitution =
      await this.prisma.institution.findFirst({
        where: {
          OR: [
            {
              email: institutionEmail,
            },
            {
              phone: institutionPhone,
            },
          ],
        },
        select: {
          id: true,
          name: true,
        },
      });

    if (existingInstitution) {
      throw new ConflictException(
        'An institution with this email or phone already exists',
      );
    }

    // ==========================================
    // Existing user
    // ==========================================

    const existingUser =
      await this.prisma.user.findUnique({
        where: {
          email: ownerEmail,
        },
        select: {
          id: true,
          email: true,
        },
      });

    if (existingUser) {
      throw new ConflictException(
        'An account with this email already exists',
      );
    }

    // ==========================================
    // Hash password
    // ==========================================

    const passwordHash =
      await bcrypt.hash(
        dto.password,
        12,
      );

    // ==========================================
    // Session expires in 30 minutes
    // ==========================================

    const expiresAt = new Date(
      Date.now() +
        30 * 60 * 1000,
    );

    // ==========================================
    // Create session
    // ==========================================

    const session =
      await this.prisma.registrationSession.create({
        data: {institutionType:
            dto.institutionType,

          institutionName:
            dto.institutionName.trim(),

          institutionEmail,

          institutionPhone,

          country:
            dto.country.trim(),

          state:
            dto.state.trim(),

          city:
            dto.city?.trim() || null,

          address:
            dto.address?.trim() || null,

          website:
            dto.website?.trim() || null,

          firstName:
            dto.firstName.trim(),

          lastName:
            dto.lastName?.trim() || null,

          ownerEmail,

          ownerPhone,

          passwordHash,

          establishedYear:
            dto.establishedYear ?? null,

          registrationNumber:
            dto.registrationNumber?.trim() ||
            null,

          gstin:
            dto.gstin?.trim() || null,

          expiresAt,

          mobileVerified: false,

          emailVerified: false,
        },

        select: {
          id: true,

          institutionType: true,

          institutionName: true,

          institutionEmail: true,

          institutionPhone: true,

          ownerEmail: true,

          ownerPhone: true,

          mobileVerified: true,

          emailVerified: true,

          expiresAt: true,

          createdAt: true,
        },
      });

    return {
      success: true,

      message:
        'Registration session created successfully',

      session: {
        id: session.id,

        institutionType:
          session.institutionType,

        institutionName:
          session.institutionName,

        institutionEmail:
          session.institutionEmail,

        institutionPhone:
          session.institutionPhone,

        ownerEmail:
          session.ownerEmail,

        ownerPhone:
          session.ownerPhone,

        mobileVerified:
          session.mobileVerified,

        emailVerified:
          session.emailVerified,

        expiresAt:
          session.expiresAt,

        createdAt:
          session.createdAt,
      },
    };
  }

  // ============================================
  // Complete registration
  // ============================================

    // ============================================
  // Google onboarding
  // ============================================

  async completeGoogleOnboarding(
    dto: GoogleOnboardingDto,
  ) {
    const clientId =
      process.env.GOOGLE_CLIENT_ID;

    if (!clientId) {
      throw new InternalServerErrorException(
        'GOOGLE_CLIENT_ID is not configured',
      );
    }

    // ==========================================
    // Verify Google credential
    // ==========================================

    const { OAuth2Client } =
      await import('google-auth-library');

    const googleClient =
      new OAuth2Client(clientId);

    const ticket =
      await googleClient.verifyIdToken({
        idToken: dto.credential,
        audience: clientId,
      });

    const payload =
      ticket.getPayload();

    if (!payload) {
      throw new BadRequestException(
        'Invalid Google credential',
      );
    }

    const googleEmail =
      payload.email?.trim().toLowerCase();

    if (
      !googleEmail ||
      !payload.email_verified
    ) {
      throw new BadRequestException(
        'Google email is not verified',
      );
    }

    // ==========================================
    // Check existing user
    // ==========================================

    const existingUser =
      await this.prisma.user.findUnique({
        where: {
          email: googleEmail,
        },
        select: {
          id: true,
        },
      });

    if (existingUser) {
      throw new ConflictException(
        'An account with this Google email already exists. Please login with Google.',
      );
    }

    // ==========================================
    // Check institution
    // ==========================================

    const institutionEmail =
      dto.institutionEmail
        .trim()
        .toLowerCase();

    const institutionPhone =
      dto.institutionPhone.trim();

    const existingInstitution =
      await this.prisma.institution.findFirst({
        where: {
          OR: [
            {
              email: institutionEmail,
            },
            {
              phone: institutionPhone,
            },
          ],
        },
        select: {
          id: true,
        },
      });

    if (existingInstitution) {
      throw new ConflictException(
        'An institution with this email or phone already exists',
      );
    }

    // ==========================================
    // Institution code
    // ==========================================

    const institutionCode =
      await this.generateInstitutionCode(
        dto.institutionName.trim(),
      );

    // ==========================================
    // Google accounts still need a passwordHash
    //
    // We generate an unusable random password.
    // Google authentication remains the login method.
    // ==========================================

    const randomPassword =
      `${crypto.randomUUID()}-${crypto.randomUUID()}`;

    const passwordHash =
      await bcrypt.hash(
        randomPassword,
        12,
      );

    // ==========================================
    // Create Institution + HEAD
    // ==========================================

    try {
      const result =
        await this.prisma.$transaction(
          async (tx) => {
            const institution =
              await tx.institution.create({
                data: {
                  name:
                    dto.institutionName.trim(),

                  code:
                    institutionCode,

                  type:
                    dto.institutionType,

                  status:
                    InstitutionStatus.ACTIVE,

                  country:
                    dto.country.trim(),

                  state:
                    dto.state.trim(),

                  city:
                    dto.city?.trim() || null,

                  address:
                    dto.address?.trim() || null,

                  email:
                    institutionEmail,

                  phone:
                    institutionPhone,

                  website:
                    dto.website?.trim() || null,
                },
              });

            const head =
              await tx.user.create({
                data: {
                  brxUid:
                    generateBrxUid(),

                  email:
                    googleEmail,

                  passwordHash,

                  firstName:
                    dto.firstName.trim(),

                  lastName:
                    dto.lastName?.trim() ||
                    null,

                  phone:
                    dto.ownerPhone.trim(),

                  role:
                    UserRole.HEAD,

                  status:
                    UserStatus.ACTIVE,

                  institutionId:
                    institution.id,
                },
              });

            return {
              institution,
              head,
            };
          },
        );

      const accessToken =
  await this.jwtService.signAsync({
    sub: result.head.id,
    email: result.head.email,
    role: result.head.role,
    institutionId:
      result.head.institutionId,
  });

    return {
      success: true,

      message:
        'Google onboarding completed successfully',

      accessToken,

      tokenType: 'Bearer',

      user: {
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

        institutionId:
          result.head.institutionId,
      },

      institution: {
        id:
          result.institution.id,

        code:
          result.institution.code,

        name:
          result.institution.name,

        type:
          result.institution.type,

        status:
          result.institution.status,
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
    };
    } catch (error) {
      if (
        error instanceof ConflictException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Unable to complete Google onboarding',
      );
    }
  }
  
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

    // ==========================================
    // Session expired
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
    // Verification check
    // ==========================================

    if (!session.mobileVerified) {
      throw new BadRequestException(
        'Mobile number is not verified',
      );
    }

    if (!session.emailVerified) {
      throw new BadRequestException(
        'Email is not verified',
      );
    }

    // ==========================================
    // Already completed
    // ==========================================

    if (session.completedAt) {
      throw new BadRequestException(
        'Registration has already been completed',
      );
    }

    // ==========================================
    // Double-check email conflicts
    // ==========================================

    const existingUser =
      await this.prisma.user.findUnique({
        where: {
          email: session.ownerEmail,
        },
        select: {
          id: true,
        },
      });

    if (existingUser) {
      throw new ConflictException(
        'An account with this email already exists',
      );
    }

    const existingInstitution =
      await this.prisma.institution.findFirst({
        where: {
          OR: [
            {
              email:
                session.institutionEmail,
            },
            {
              phone:
                session.institutionPhone,
            },
          ],
        },
        select: {
          id: true,
        },
      });

    if (existingInstitution) {
      throw new ConflictException(
        'This institution is already registered',
      );
    }

    // ==========================================
    // Generate institution code
    // ==========================================

    const institutionCode =
      await this.generateInstitutionCode(
        session.institutionName,
      );

    // ==========================================
    // Final transaction
    // ==========================================

    try {
      const result =
        await this.prisma.$transaction(
          async (tx) => {
            // ------------------------------------
            // Institution
            // ------------------------------------

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
                    InstitutionStatus.ACTIVE,

                  country:
                    session.country,

                  state:
                    session.state,

                  city:
                    session.city,

                  address:
                    session.address,

                  email:
                    session.institutionEmail,

                  phone:
                    session.institutionPhone,

                  website:
                    session.website,
                },
              });

            // ------------------------------------
            // HEAD
            // ------------------------------------

            const head =
              await tx.user.create({
                data: {
        brxUid: generateBrxUid(),
                  email:
                    session.ownerEmail,

                  passwordHash:
                    session.passwordHash,

                  firstName:
                    session.firstName,

                  lastName:
                    session.lastName,

                  phone:
                    session.ownerPhone,

                  role:
                    UserRole.HEAD,

                  status:
                    UserStatus.ACTIVE,

                  institutionId:
                    institution.id,
                },
              });

            // ------------------------------------
            // Complete session
            // ------------------------------------

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

      return {
        success: true,

        message:
          'Registration completed successfully',

        institution: {
          id:
            result.institution.id,

          code:
            result.institution.code,

          name:
            result.institution.name,

          type:
            result.institution.type,

          status:
            result.institution.status,
        },

        head: {
          id:
            result.head.id,

          email:
            result.head.email,

          firstName:
            result.head.firstName,

          lastName:
            result.head.lastName,

          role:
            result.head.role,

          status:
            result.head.status,
        },
      };
    } catch (error) {
      if (
        error instanceof ConflictException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Unable to complete registration',
      );
    }
  }
}


