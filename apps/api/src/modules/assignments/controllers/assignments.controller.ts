import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
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

import { AssignmentStatus } from '../../../generated/prisma/enums';
import { CreateAssignmentDto } from '../dto/create-assignment.dto';
import { UpdateAssignmentDto } from '../dto/update-assignment.dto';
import { AssignmentsService } from '../services/assignments.service';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
    role: string;
    institutionId: string | null;
  };
}

@Controller('assignments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AssignmentsController {
  constructor(
    private readonly assignmentsService: AssignmentsService,
  ) {}

  @Roles('HEAD', 'TEACHER')
  @Post()
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateAssignmentDto,
  ) {
    return this.assignmentsService.create(
      req.user.institutionId,
      req.user.userId,
      req.user.role,
      dto,
    );
  }

  @Roles('HEAD', 'TEACHER', 'STAFF', 'STUDENT')
  @Get()
  async findAll(
    @Req() req: AuthenticatedRequest,
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 12,
    @Query('search') search = '',
    @Query('status') status?: AssignmentStatus,
  ) {
    return this.assignmentsService.findAll(
      req.user.institutionId,
      req.user.userId,
      req.user.role,
      page,
      limit,
      search,
      status,
    );
  }

  @Roles('HEAD', 'TEACHER', 'STAFF', 'STUDENT')
  @Get(':id')
  async findOne(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.assignmentsService.findOne(
      req.user.institutionId,
      req.user.userId,
      req.user.role,
      id,
    );
  }

  @Roles('HEAD', 'TEACHER')
  @Patch(':id')
  async update(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateAssignmentDto,
  ) {
    return this.assignmentsService.update(
      req.user.institutionId,
      req.user.userId,
      req.user.role,
      id,
      dto,
    );
  }

  @Roles('HEAD', 'TEACHER')
  @Delete(':id')
  async remove(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.assignmentsService.remove(
      req.user.institutionId,
      req.user.userId,
      req.user.role,
      id,
    );
  }

  @Roles('HEAD', 'TEACHER')
  @Post(':id/publish')
  async publish(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.assignmentsService.publish(
      req.user.institutionId,
      req.user.userId,
      req.user.role,
      id,
    );
  }
}