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

import { JwtAuthGuard } from '../../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../auth/guards/roles.guard';
import { Roles } from '../../../../auth/decorators/roles.decorator';

import { CreateFeePlanDto } from '../dto/create-fee-plan.dto';
import { UpdateFeePlanDto } from '../dto/update-fee-plan.dto';
import { FeePlansService } from '../services/fee-plans.service';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
    role: string;
    institutionId: string | null;
  };
}

@Controller('academics/fees/plans')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FeePlansController {
  constructor(
    private readonly feePlansService: FeePlansService,
  ) {}

  @Roles('HEAD', 'STAFF')
  @Post()
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateFeePlanDto,
  ) {
    return this.feePlansService.createFeePlan(
      req.user.institutionId,
      dto,
    );
  }

  @Roles('HEAD', 'STAFF', 'TEACHER', 'STUDENT')
  @Get()
  async findAll(
    @Req() req: AuthenticatedRequest,
  ) {
    return this.feePlansService.getAllFeePlans(
      req.user.institutionId,
    );
  }

  @Roles('HEAD', 'STAFF', 'TEACHER', 'STUDENT')
  @Get(':id')
  async findOne(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.feePlansService.getFeePlanById(
      req.user.institutionId,
      id,
    );
  }

  @Roles('HEAD', 'STAFF')
  @Patch(':id')
  async update(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateFeePlanDto,
  ) {
    return this.feePlansService.updateFeePlan(
      req.user.institutionId,
      id,
      dto,
    );
  }

  @Roles('HEAD', 'STAFF')
  @Delete(':id')
  async remove(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.feePlansService.deleteFeePlan(
      req.user.institutionId,
      id,
    );
  }
}