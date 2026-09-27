import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/auth/guards/roles.guard';
import { Roles } from '../../../common/auth/decorators/roles.decorator';

import { CreateInstitutionDto } from '../dto/create-institution.dto';
import { UpdateInstitutionDto } from '../dto/update-institution.dto';
import { InstitutionsService } from '../services/institutions.service';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
    role: string;
    institutionId: string | null;
  };
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('institutions')
export class InstitutionsController {
  constructor(
    private readonly institutionsService: InstitutionsService,
  ) {}

  @Roles('HEAD')
  @Post()
  create(
    @Body() dto: CreateInstitutionDto,
  ) {
    return this.institutionsService.create(dto);
  }

  @Roles('HEAD')
  @Get()
  findAll(
    @Req() req: AuthenticatedRequest,
  ) {
    return this.institutionsService.findAll(
      req.user.institutionId,
    );
  }

  @Roles('HEAD')
  @Get(':id')
  findOne(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.institutionsService.findOne(
      req.user.institutionId,
      id,
    );
  }

  @Roles('HEAD')
  @Patch(':id')
  update(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateInstitutionDto,
  ) {
    return this.institutionsService.update(
      req.user.institutionId,
      id,
      dto,
    );
  }

  @Roles('HEAD')
  @Delete(':id')
  remove(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.institutionsService.remove(
      req.user.institutionId,
      id,
    );
  }
}