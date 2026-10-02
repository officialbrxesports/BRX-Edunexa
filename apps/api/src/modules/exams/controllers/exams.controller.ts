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

import { Request } from 'express';

import { JwtAuthGuard } from '../../../modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../modules/auth/guards/roles.guard';

import { RequireFeature } from '../../../modules/permissions/decorators/feature.decorator';
import { FeatureGuard } from '../../../modules/permissions/guards/feature.guard';

import {
  ExamStatus,
  ResultStatus,
  UserRole,
} from '../../../generated/prisma/enums';

import { CreateExamDto } from '../dto/create-exam.dto';
import { UpdateExamDto } from '../dto/update-exam.dto';
import { CreateResultDto } from '../dto/create-result.dto';
import { UpdateResultDto } from '../dto/update-result.dto';

import { ExamsService } from '../services/exams.service';

type AuthenticatedRequest = Request & {
  user: {
    userId: string;
    email: string;
    role: UserRole;
    institutionId?: string | null;
  };
};

@Controller('exams')
@UseGuards(
  JwtAuthGuard,
  RolesGuard,
  FeatureGuard,
)
export class ExamsController {
  constructor(
    private readonly examsService: ExamsService,
  ) {}

  // ==================================================
  // EXAMS
  // ==================================================

  @Post()
  @RequireFeature('exams')
  async createExam(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateExamDto,
  ) {
    return this.examsService.createExam(
      req.user,
      dto,
    );
  }

  @Get()
  @RequireFeature('exams')
  async findAllExams(
    @Req() req: AuthenticatedRequest,
    @Query('search') search?: string,
    @Query('status') status?: ExamStatus,
  ) {
    return this.examsService.findAllExams(
      req.user,
      search,
      status,
    );
  }

  @Get(':examId')
  @RequireFeature('exams')
  async findExam(
    @Req() req: AuthenticatedRequest,
    @Param('examId') examId: string,
  ) {
    return this.examsService.findExamById(
      req.user,
      examId,
    );
  }

  @Patch(':examId')
  @RequireFeature('exams')
  async updateExam(
    @Req() req: AuthenticatedRequest,
    @Param('examId') examId: string,
    @Body() dto: UpdateExamDto,
  ) {
    return this.examsService.updateExam(
      req.user,
      examId,
      dto,
    );
  }

  @Delete(':examId')
  @RequireFeature('exams')
  async deleteExam(
    @Req() req: AuthenticatedRequest,
    @Param('examId') examId: string,
  ) {
    return this.examsService.deleteExam(
      req.user,
      examId,
    );
  }

  @Post(':examId/publish')
  @RequireFeature('exams')
  async publishExam(
    @Req() req: AuthenticatedRequest,
    @Param('examId') examId: string,
  ) {
    return this.examsService.publishExam(
      req.user,
      examId,
    );
  }

  @Post(':examId/complete')
  @RequireFeature('exams')
  async completeExam(
    @Req() req: AuthenticatedRequest,
    @Param('examId') examId: string,
  ) {
    return this.examsService.completeExam(
      req.user,
      examId,
    );
  }

  @Post(':examId/cancel')
  @RequireFeature('exams')
  async cancelExam(
    @Req() req: AuthenticatedRequest,
    @Param('examId') examId: string,
  ) {
    return this.examsService.cancelExam(
      req.user,
      examId,
    );
  }

  // ==================================================
  // RESULTS
  // ==================================================

  @Post('results')
  @RequireFeature('results')
  async createResult(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateResultDto,
  ) {
    return this.examsService.createResult(
      req.user,
      dto,
    );
  }

  @Get('results')
  @RequireFeature('results')
  async findAllResults(
    @Req() req: AuthenticatedRequest,
    @Query('search') search?: string,
    @Query('examId') examId?: string,
    @Query('studentId') studentId?: string,
    @Query('status') status?: ResultStatus,
  ) {
    return this.examsService.findAllResults(
      req.user,
      search,
      examId,
      studentId,
      status,
    );
  }

  @Get('results/student/:studentId/summary')
  @RequireFeature('results')
  async getStudentResultSummary(
    @Req() req: AuthenticatedRequest,
    @Param('studentId') studentId: string,
  ) {
    return this.examsService.getStudentResultSummary(
      req.user,
      studentId,
    );
  }

  @Get('results/:resultId')
  @RequireFeature('results')
  async findResult(
    @Req() req: AuthenticatedRequest,
    @Param('resultId') resultId: string,
  ) {
    return this.examsService.findResultById(
      req.user,
      resultId,
    );
  }

  @Patch('results/:resultId')
  @RequireFeature('results')
  async updateResult(
    @Req() req: AuthenticatedRequest,
    @Param('resultId') resultId: string,
    @Body() dto: UpdateResultDto,
  ) {
    return this.examsService.updateResult(
      req.user,
      resultId,
      dto,
    );
  }

  @Delete('results/:resultId')
  @RequireFeature('results')
  async deleteResult(
    @Req() req: AuthenticatedRequest,
    @Param('resultId') resultId: string,
  ) {
    return this.examsService.deleteResult(
      req.user,
      resultId,
    );
  }

  @Post('results/:resultId/publish')
  @RequireFeature('results')
  async publishResult(
    @Req() req: AuthenticatedRequest,
    @Param('resultId') resultId: string,
  ) {
    return this.examsService.publishResult(
      req.user,
      resultId,
    );
  }
}