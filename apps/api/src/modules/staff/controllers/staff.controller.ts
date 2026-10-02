import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/auth/guards/roles.guard';
import { Roles } from '../../../common/auth/decorators/roles.decorator';
import { RequireFeature } from '../../permissions/decorators/feature.decorator';
import { FeatureGuard } from '../../permissions/guards/feature.guard';

import { StaffService } from '../services/staff.service';
import { CreateStaffDto } from '../dto/create-staff.dto';
import { UpdateStaffDto } from '../dto/update-staff.dto';
import { ListStaffQueryDto } from '../dto/list-staff-query.dto';

type AuthenticatedRequest = Request & {
  user?: {
    institutionId: string | null;
  };
};

@Controller('staff')
@UseGuards(JwtAuthGuard, RolesGuard, FeatureGuard)
@RequireFeature('staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Get()
  @Roles('HEAD')
  findAll(
    @Req() req: AuthenticatedRequest,
    @Query() query: ListStaffQueryDto,
  ) {
    return this.staffService.findAll(
      req.user?.institutionId ?? null,
      query,
    );
  }

  @Get(':id')
  @Roles('HEAD')
  findOne(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.staffService.findOne(
      req.user?.institutionId ?? null,
      id,
    );
  }

  @Post()
  @Roles('HEAD')
  create(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateStaffDto,
  ) {
    return this.staffService.create(
      req.user?.institutionId ?? null,
      dto,
    );
  }

  @Patch(':id')
  @Roles('HEAD')
  update(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateStaffDto,
  ) {
    return this.staffService.update(
      req.user?.institutionId ?? null,
      id,
      dto,
    );
  }

  @Delete(':id')
  @Roles('HEAD')
  deactivate(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.staffService.deactivate(
      req.user?.institutionId ?? null,
      id,
    );
  }

  @Post(':id/activate')
  @Roles('HEAD')
  activate(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.staffService.activate(
      req.user?.institutionId ?? null,
      id,
    );
  }
}
