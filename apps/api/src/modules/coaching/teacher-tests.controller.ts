import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
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
  CoachingTestsService,
  type ResultRow,
  type TestInput,
} from './coaching-tests.service';

/** A coaching teacher works only with tests of the batches assigned to them. */
@Controller('teacher/tests')
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles('TEACHER')
export class TeacherTestsController {
  constructor(private readonly tests: CoachingTestsService) {}

  private institutionId(request: AuthenticatedRequest) {
    const id = request.user?.institutionId;

    if (!id) {
      throw new UnauthorizedException(
        'Your account is not linked to an institution.',
      );
    }

    return id;
  }

  @Get('batches')
  batches(@Req() request: AuthenticatedRequest) {
    return this.tests.teacherBatches(
      this.institutionId(request),
      request.user!.id,
    );
  }

  @Get()
  list(@Req() request: AuthenticatedRequest) {
    return this.tests.listForTeacher(
      this.institutionId(request),
      request.user!.id,
    );
  }

  @Post()
  async create(@Req() request: AuthenticatedRequest, @Body() body: TestInput) {
    const institutionId = this.institutionId(request);
    await this.tests.assertTeacherBatch(
      institutionId,
      request.user!.id,
      body?.batchId,
    );
    return this.tests.create(institutionId, body);
  }

  @Get(':id/sheet')
  async sheet(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    const institutionId = this.institutionId(request);
    await this.tests.assertTeacherTest(institutionId, request.user!.id, id);
    return this.tests.sheet(institutionId, id);
  }

  @Put(':id/results')
  async saveResults(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: { results?: ResultRow[] },
  ) {
    const institutionId = this.institutionId(request);
    await this.tests.assertTeacherTest(institutionId, request.user!.id, id);
    return this.tests.saveResults(institutionId, id, body?.results ?? []);
  }
}
