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

import { StudentsService } from '../services/students.service';
import { CreateStudentDto } from '../dto/create-student.dto';
import { UpdateStudentDto } from '../dto/update-student.dto';
import { ListStudentsQueryDto } from '../dto/list-students-query.dto';

type AuthenticatedRequest = Request & {
  user?: {
    userId: string;
    email: string;
    role: string;
    institutionId: string | null;
  };
};

@Controller('students')
@UseGuards(JwtAuthGuard, RolesGuard, FeatureGuard)
@RequireFeature('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get()
  @Roles('HEAD', 'TEACHER')
  findAll(
    @Req() req: AuthenticatedRequest,
    @Query() query: ListStudentsQueryDto,
  ) {
    return this.studentsService.findAll(
      req.user?.institutionId ?? null,
      query,
    );
  }

  @Get(':id')
  @Roles('HEAD', 'TEACHER')
  findOne(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.studentsService.findOne(
      req.user?.institutionId ?? null,
      id,
    );
  }

  @Post()
  @Roles('HEAD')
  create(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateStudentDto,
  ) {
    return this.studentsService.create(
      req.user?.institutionId ?? null,
      dto,
    );
  }

  @Patch(':id')
  @Roles('HEAD')
  update(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateStudentDto,
  ) {
    return this.studentsService.update(
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
    return this.studentsService.deactivate(
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
    return this.studentsService.activate(
      req.user?.institutionId ?? null,
      id,
    );
  }
}
