import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../../../../database/prisma.service';

import { CreateFeePlanDto } from '../dto/create-fee-plan.dto';
import { UpdateFeePlanDto } from '../dto/update-fee-plan.dto';

@Injectable()
export class FeePlansService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async createFeePlan(
    institutionId: string | null,
    dto: CreateFeePlanDto,
  ) {
    if (!institutionId) {
      throw new BadRequestException(
        'Institution is required',
      );
    }

    const institution =
      await this.prisma.institution.findFirst({
        where: {
          id: institutionId,
        },
      });

    if (!institution) {
      throw new NotFoundException(
        'Institution not found',
      );
    }

    const classItem =
      await this.prisma.class.findFirst({
        where: {
          id: dto.classId,
          institutionId,
        },
      });

    if (!classItem) {
      throw new NotFoundException(
        'Class not found',
      );
    }

    if (dto.sectionId) {
      const section =
        await this.prisma.section.findFirst({
          where: {
            id: dto.sectionId,
            classId: dto.classId,
          },
        });

      if (!section) {
        throw new NotFoundException(
          'Section not found for this class',
        );
      }
    }

    if (dto.amount <= 0) {
      throw new BadRequestException(
        'Fee amount must be greater than 0',
      );
    }

    if (
      dto.frequency === 'CUSTOM' &&
      (!dto.customDays || dto.customDays <= 0)
    ) {
      throw new BadRequestException(
        'customDays is required for CUSTOM frequency',
      );
    }

    if (
      dto.dueDay !== undefined &&
      (dto.dueDay < 1 || dto.dueDay > 31)
    ) {
      throw new BadRequestException(
        'dueDay must be between 1 and 31',
      );
    }

    const lateFeeAmount =
      dto.lateFeeAmount ?? 0;

    if (lateFeeAmount < 0) {
      throw new BadRequestException(
        'lateFeeAmount cannot be negative',
      );
    }

    return this.prisma.feePlan.create({
      data: {
        institutionId,
        classId: dto.classId,
        sectionId: dto.sectionId ?? null,

        name: dto.name,
        description: dto.description ?? null,

        amount: dto.amount,
        frequency: dto.frequency,
        customDays: dto.customDays ?? null,

        dueDay: dto.dueDay ?? null,

        lateFeeType: dto.lateFeeType,
        lateFeeAmount,

        discountAllowed:
          dto.discountAllowed ?? false,

        startDate: new Date(dto.startDate),

        endDate: dto.endDate
          ? new Date(dto.endDate)
          : null,

        isActive: true,
      },

      include: {
        institution: true,
        class: true,
        section: true,
      },
    });
  }

  async getAllFeePlans(
    institutionId: string | null,
  ) {
    if (!institutionId) {
      throw new BadRequestException(
        'Institution is required',
      );
    }

    return this.prisma.feePlan.findMany({
      where: {
        institutionId,
      },

      include: {
        class: true,
        section: true,
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getFeePlanById(
    institutionId: string | null,
    id: string,
  ) {
    if (!institutionId) {
      throw new BadRequestException(
        'Institution is required',
      );
    }

    const feePlan =
      await this.prisma.feePlan.findFirst({
        where: {
          id,
          institutionId,
        },

        include: {
          class: true,
          section: true,
        },
      });

    if (!feePlan) {
      throw new NotFoundException(
        'Fee plan not found',
      );
    }

    return feePlan;
  }

  async updateFeePlan(
    institutionId: string | null,
    id: string,
    dto: UpdateFeePlanDto,
  ) {
    if (!institutionId) {
      throw new BadRequestException(
        'Institution is required',
      );
    }

    const existing =
      await this.prisma.feePlan.findFirst({
        where: {
          id,
          institutionId,
        },
      });

    if (!existing) {
      throw new NotFoundException(
        'Fee plan not found',
      );
    }

    if (
      dto.amount !== undefined &&
      dto.amount <= 0
    ) {
      throw new BadRequestException(
        'Fee amount must be greater than 0',
      );
    }

    if (
      dto.dueDay !== undefined &&
      (dto.dueDay < 1 || dto.dueDay > 31)
    ) {
      throw new BadRequestException(
        'dueDay must be between 1 and 31',
      );
    }

    if (
      dto.frequency === 'CUSTOM' &&
      (!dto.customDays || dto.customDays <= 0)
    ) {
      throw new BadRequestException(
        'customDays is required for CUSTOM frequency',
      );
    }

    const lateFeeAmount = Number(
      dto.lateFeeAmount ?? existing.lateFeeAmount,
    );

    if (lateFeeAmount < 0) {
      throw new BadRequestException(
        'lateFeeAmount cannot be negative',
      );
    }

    return this.prisma.feePlan.update({
      where: {
        id,
      },

      data: {
        name: dto.name,
        description: dto.description,

        amount: dto.amount,

        frequency: dto.frequency,
        customDays: dto.customDays,

        dueDay: dto.dueDay,

        lateFeeType: dto.lateFeeType,
        lateFeeAmount,

        discountAllowed:
          dto.discountAllowed,

        startDate: dto.startDate
          ? new Date(dto.startDate)
          : undefined,

        endDate:
          dto.endDate !== undefined
            ? dto.endDate
              ? new Date(dto.endDate)
              : null
            : undefined,

        isActive: dto.isActive,
      },

      include: {
        class: true,
        section: true,
      },
    });
  }

  async deleteFeePlan(
    institutionId: string | null,
    id: string,
  ) {
    if (!institutionId) {
      throw new BadRequestException(
        'Institution is required',
      );
    }

    const existing =
      await this.prisma.feePlan.findFirst({
        where: {
          id,
          institutionId,
        },
      });

    if (!existing) {
      throw new NotFoundException(
        'Fee plan not found',
      );
    }

    await this.prisma.feePlan.delete({
      where: {
        id,
      },
    });

    return {
      success: true,
      message: 'Fee plan deleted successfully',
    };
  }
}