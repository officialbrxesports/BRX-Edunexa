import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes, randomUUID } from 'node:crypto';
import * as argon2 from 'argon2';
import { PrismaService } from '../../prisma/prisma.service';

export type CreateTeacherInput = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
};

export type UpdateTeacherInput = {
  firstName?: string;
  lastName?: string;
  phone?: string;
  status?: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[0-9+\-\s]{7,15}$/;

const TEACHER_SELECT = {
  id: true,
  brxUid: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  status: true,
  createdAt: true,
  _count: { select: { subject_teachers: true } },
} as const;

@Injectable()
export class TeachersService {
  constructor(private readonly prisma: PrismaService) {}

  private clean(value?: string | null) {
    return value?.trim() || null;
  }

  private validatePhone(phone: string | null) {
    if (phone && !PHONE_PATTERN.test(phone)) {
      throw new BadRequestException('Enter a valid phone number.');
    }
  }

  async list(institutionId: string) {
    const teachers = await this.prisma.users.findMany({
      where: {
        institutionId,
        role: 'TEACHER',
        status: { not: 'DELETED' },
      },
      orderBy: { createdAt: 'desc' },
      select: TEACHER_SELECT,
    });

    return teachers.map(({ _count, ...teacher }) => ({
      ...teacher,
      assignments: _count.subject_teachers,
    }));
  }

  async create(institutionId: string, input: CreateTeacherInput) {
    const firstName = this.clean(input.firstName);
    const lastName = this.clean(input.lastName);
    const email = this.clean(input.email)?.toLowerCase() ?? null;
    const phone = this.clean(input.phone);

    if (!firstName || !email) {
      throw new BadRequestException('Teacher name and email are required.');
    }

    if (firstName.length > 80 || (lastName && lastName.length > 80)) {
      throw new BadRequestException('Name is too long.');
    }

    if (!EMAIL_PATTERN.test(email)) {
      throw new BadRequestException('Enter a valid email address.');
    }

    this.validatePhone(phone);

    const existing = await this.prisma.users.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException('This email is already registered.');
    }

    const temporaryPassword = randomBytes(18).toString('base64url');
    const passwordHash = await argon2.hash(temporaryPassword);
    const brxUid = `BRX-${randomUUID()
      .replace(/-/g, '')
      .slice(0, 12)
      .toUpperCase()}`;

    try {
      const teacher = await this.prisma.users.create({
        data: {
          id: randomUUID(),
          email,
          passwordHash,
          firstName,
          lastName,
          phone,
          role: 'TEACHER',
          status: 'ACTIVE',
          institutionId,
          brxUid,
          updatedAt: new Date(),
        },
        select: TEACHER_SELECT,
      });

      const { _count, ...safeTeacher } = teacher;

      return {
        success: true,
        message: 'Teacher account created.',
        teacher: { ...safeTeacher, assignments: _count.subject_teachers },
        credentials: {
          eduNexaId: brxUid,
          email,
          temporaryPassword,
        },
      };
    } catch (error) {
      if ((error as { code?: string })?.code === 'P2002') {
        throw new ConflictException('This email is already registered.');
      }

      throw error;
    }
  }

  async update(institutionId: string, id: string, input: UpdateTeacherInput) {
    const teacher = await this.prisma.users.findFirst({
      where: { id, institutionId, role: 'TEACHER', status: { not: 'DELETED' } },
      select: { id: true },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found.');
    }

    const data: {
      firstName?: string;
      lastName?: string | null;
      phone?: string | null;
      status?: 'ACTIVE' | 'SUSPENDED';
      updatedAt: Date;
    } = { updatedAt: new Date() };

    if (input.firstName !== undefined) {
      const firstName = this.clean(input.firstName);
      if (!firstName || firstName.length > 80) {
        throw new BadRequestException('Enter a valid teacher name.');
      }
      data.firstName = firstName;
    }

    if (input.lastName !== undefined) {
      const lastName = this.clean(input.lastName);
      if (lastName && lastName.length > 80) {
        throw new BadRequestException('Last name is too long.');
      }
      data.lastName = lastName;
    }

    if (input.phone !== undefined) {
      const phone = this.clean(input.phone);
      this.validatePhone(phone);
      data.phone = phone;
    }

    if (input.status !== undefined) {
      if (input.status !== 'ACTIVE' && input.status !== 'SUSPENDED') {
        throw new BadRequestException('Status must be ACTIVE or SUSPENDED.');
      }
      data.status = input.status;
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.users.update({
        where: { id },
        data,
        select: TEACHER_SELECT,
      });

      // A suspended teacher is signed out everywhere.
      if (data.status === 'SUSPENDED') {
        await tx.login_sessions.updateMany({
          where: { userId: id, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      }

      return result;
    });

    const { _count, ...safeTeacher } = updated;

    return {
      success: true,
      teacher: { ...safeTeacher, assignments: _count.subject_teachers },
    };
  }
}
