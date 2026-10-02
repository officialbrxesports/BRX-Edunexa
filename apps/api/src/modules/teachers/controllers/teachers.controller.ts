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

import { TeachersService } from '../services/teachers.service';
import { CreateTeacherDto } from '../dto/create-teacher.dto';
import { UpdateTeacherDto } from '../dto/update-teacher.dto';
import { ListTeachersQueryDto } from '../dto/list-teachers-query.dto';

type AuthenticatedRequest = Request & {
  user?: {
    institutionId: string | null;
  };
};

@Controller('teachers')
@UseGuards(JwtAuthGuard, RolesGuard, FeatureGuard)
@RequireFeature('teachers')
export class TeachersController {
  constructor(private readonly teachersService: TeachersService) {}

  @Get()
  @Roles('HEAD')
  findAll(
    @Req() req: AuthenticatedRequest,
    @Query() query: ListTeachersQueryDto,
  ) {
    return this.teachersService.findAll(
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
    return this.teachersService.findOne(
      req.user?.institutionId ?? null,
      id,
    );
  }

  @Post()
  @Roles('HEAD')
  create(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateTeacherDto,
  ) {
    return this.teachersService.create(
      req.user?.institutionId ?? null,
      dto,
    );
  }

  @Patch(':id')
  @Roles('HEAD')
  update(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateTeacherDto,
  ) {
    return this.teachersService.update(
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
    return this.teachersService.deactivate(
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
    return this.teachersService.activate(
      req.user?.institutionId ?? null,
      id,
    );
  }
}
