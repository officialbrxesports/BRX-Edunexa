import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

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