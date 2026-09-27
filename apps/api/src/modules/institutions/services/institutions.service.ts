import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../../database/prisma.service';
import { CreateInstitutionDto } from '../dto/create-institution.dto';
import { UpdateInstitutionDto } from '../dto/update-institution.dto';

@Injectable()
export class InstitutionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateInstitutionDto) {
    const existing = await this.prisma.institution.findUnique({
      where: {
        code: dto.code,
      },
    });

    if (existing) {
      throw new ConflictException(
        'Institution code already exists',
      );
    }

    return this.prisma.institution.create({
      data: {
        name: dto.name,
        code: dto.code,
        type: dto.type,
        country: dto.country,
        state: dto.state,
        city: dto.city,
        address: dto.address,
        email: dto.email,
        phone: dto.phone,
        website: dto.website,
      },
    });
  }

  async findAll(institutionId: string | null) {
    if (!institutionId) {
      throw new NotFoundException(
        'Institution not found',
      );
    }

    const institution =
      await this.prisma.institution.findUnique({
        where: {
          id: institutionId,
        },
      });

    if (!institution) {
      throw new NotFoundException(
        'Institution not found',
      );
    }

    return [institution];
  }

  async findOne(
    institutionId: string | null,
    id: string,
  ) {
    if (!institutionId || institutionId !== id) {
      throw new NotFoundException(
        'Institution not found',
      );
    }

    const institution =
      await this.prisma.institution.findUnique({
        where: {
          id,
        },
      });

    if (!institution) {
      throw new NotFoundException(
        'Institution not found',
      );
    }

    return institution;
  }

  async update(
    institutionId: string | null,
    id: string,
    dto: UpdateInstitutionDto,
  ) {
    await this.findOne(institutionId, id);

    if (dto.code) {
      const existing =
        await this.prisma.institution.findFirst({
          where: {
            code: dto.code,
            NOT: {
              id,
            },
          },
        });

      if (existing) {
        throw new ConflictException(
          'Institution code already exists',
        );
      }
    }

    return this.prisma.institution.update({
      where: {
        id,
      },
      data: dto,
    });
  }

  async remove(
    institutionId: string | null,
    id: string,
  ) {
    await this.findOne(institutionId, id);

    return this.prisma.institution.delete({
      where: {
        id,
      },
    });
  }
}