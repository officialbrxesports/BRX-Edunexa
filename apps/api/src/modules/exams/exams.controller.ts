import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import {
  type AuthenticatedRequest,
  SessionAuthGuard,
} from '../../common/guards/session-auth.guard';
import {
  ExamsService,
  type ExamInput,
  type ResultRow,
} from './exams.service';

@Controller('exams')
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles('HEAD')
export class ExamsController {
  constructor(private readonly exams: ExamsService) {}

  private institutionId(request: AuthenticatedRequest) {
    const id = request.user?.institutionId;

    if (!id) {
      throw new UnauthorizedException(
        'Your account is not linked to an institution.',
      );
    }

    return id;
  }

  @Get()
  list(
    @Req() request: AuthenticatedRequest,
    @Query('classId') classId?: string,
  ) {
    return this.exams.list(this.institutionId(request), classId);
  }

  @Post()
  create(@Req() request: AuthenticatedRequest, @Body() body: ExamInput) {
    return this.exams.create(this.institutionId(request), body);
  }

  @Get('class-ranking/:classId')
  classRanking(
    @Req() request: AuthenticatedRequest,
    @Param('classId') classId: string,
    @Query('sectionId') sectionId?: string,
  ) {
    return this.exams.classRanking(
      this.institutionId(request),
      classId,
      sectionId || undefined,
    );
  }

  @Get(':id/sheet')
  sheet(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.exams.sheet(this.institutionId(request), id);
  }

  @Put(':id/results')
  saveResults(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: { results?: ResultRow[] },
  ) {
    return this.exams.saveResults(
      this.institutionId(request),
      id,
      body?.results ?? [],
    );
  }

  @Get(':id/ranklist')
  rankList(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.exams.rankList(this.institutionId(request), id);
  }

  @Post(':id/status')
  setStatus(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: { status?: string },
  ) {
    return this.exams.setStatus(this.institutionId(request), id, body?.status);
  }

  @Patch(':id')
  update(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: ExamInput,
  ) {
    return this.exams.update(this.institutionId(request), id, body);
  }

  @Delete(':id')
  remove(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.exams.remove(this.institutionId(request), id);
  }
}
