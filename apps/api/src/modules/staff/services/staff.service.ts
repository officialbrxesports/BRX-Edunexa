import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../../../database/prisma.service';
import { CreateStaffDto } from '../dto/create-staff.dto';
import { UpdateStaffDto } from '../dto/update-staff.dto';
import { ListStaffQueryDto } from '../dto/list-staff-query.dto';

@Injectable()
export class StaffService {
  constructor(private readonly prisma: PrismaService) {}

  private institution(institutionId: string | null): string {
    if (!institutionId) {
      throw new ForbiddenException('Institution context is missing');
    }

    return institutionId;
  }

  async create(
    institutionId: string | null,
    dto: CreateStaffDto,
  ) {
    const id = this.institution(institutionId);

    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (exists) {
      throw new ConflictException('Email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    return this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        role: 'STAFF',
        status: 'ACTIVE',
        institutionId: id,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        status: true,
        institutionId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findAll(
    institutionId: string | null,
    query: ListStaffQueryDto,
  ) {
    const id = this.institution(institutionId);

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {
      institutionId: id,
      role: 'STAFF',
    };

    if (query.status === 'active') {
      where.status = 'ACTIVE';
    }

    if (query.status === 'inactive') {
      where.status = 'DELETED';
    }

    if (query.search) {
      const search = query.search.trim();

      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          status: true,
          institutionId: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async findOne(
    institutionId: string | null,
    staffId: string,
  ) {
    const id = this.institution(institutionId);

    const staff = await this.prisma.user.findFirst({
      where: {
        id: staffId,
        institutionId: id,
        role: 'STAFF',
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        status: true,
        institutionId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!staff) {
      throw new NotFoundException('Staff member not found');
    }

    return staff;
  }

  async update(
    institutionId: string | null,
    staffId: string,
    dto: UpdateStaffDto,
  ) {
    const id = this.institution(institutionId);

    const staff = await this.prisma.user.findFirst({
      where: {
        id: staffId,
        institutionId: id,
        role: 'STAFF',
      },
    });

    if (!staff) {
      throw new NotFoundException('Staff member not found');
    }

    if (dto.email && dto.email !== staff.email) {
      const exists = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });

      if (exists) {
        throw new ConflictException('Email already exists');
      }
    }

    const passwordHash = dto.password
      ? await bcrypt.hash(dto.password, 12)
      : undefined;

    await this.prisma.user.update({
      where: { id: staffId },
      data: {
        ...(dto.email !== undefined ? { email: dto.email } : {}),
        ...(dto.firstName !== undefined ? { firstName: dto.firstName } : {}),
        ...(dto.lastName !== undefined ? { lastName: dto.lastName } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
        ...(passwordHash ? { passwordHash } : {}),
      },
    });

    return this.findOne(id, staffId);
  }

  async deactivate(
    institutionId: string | null,
    staffId: string,
  ) {
    const id = this.institution(institutionId);

    const result = await this.prisma.user.updateMany({
      where: {
        id: staffId,
        institutionId: id,
        role: 'STAFF',
      },
      data: { status: 'DELETED' },
    });

    if (!result.count) {
      throw new NotFoundException('Staff member not found');
    }

    return this.findOne(id, staffId);
  }

  async activate(
    institutionId: string | null,
    staffId: string,
  ) {
    const id = this.institution(institutionId);

    const result = await this.prisma.user.updateMany({
      where: {
        id: staffId,
        institutionId: id,
        role: 'STAFF',
      },
      data: { status: 'ACTIVE' },
    });

    if (!result.count) {
      throw new NotFoundException('Staff member not found');
    }

    return this.findOne(id, staffId);
  }
}
