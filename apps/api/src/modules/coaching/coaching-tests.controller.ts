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
  CoachingTestsService,
  type ResultRow,
  type TestInput,
} from './coaching-tests.service';

@Controller('coaching/tests')
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles('HEAD')
export class CoachingTestsController {
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

  @Get()
  list(
    @Req() request: AuthenticatedRequest,
    @Query('batchId') batchId?: string,
  ) {
    return this.tests.list(this.institutionId(request), batchId);
  }

  @Post()
  create(@Req() request: AuthenticatedRequest, @Body() body: TestInput) {
    return this.tests.create(this.institutionId(request), body);
  }

  @Get('leaderboard/:batchId')
  leaderboard(
    @Req() request: AuthenticatedRequest,
    @Param('batchId') batchId: string,
  ) {
    return this.tests.leaderboard(this.institutionId(request), batchId);
  }

  @Get(':id/sheet')
  sheet(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.tests.sheet(this.institutionId(request), id);
  }

  @Put(':id/results')
  saveResults(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: { results?: ResultRow[] },
  ) {
    return this.tests.saveResults(
      this.institutionId(request),
      id,
      body?.results ?? [],
    );
  }

  @Patch(':id')
  update(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: TestInput,
  ) {
    return this.tests.update(this.institutionId(request), id, body);
  }

  @Delete(':id')
  remove(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.tests.remove(this.institutionId(request), id);
  }
}
