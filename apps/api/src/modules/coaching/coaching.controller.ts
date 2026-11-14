import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
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
  type CreateTeacherInput,
  TeachersService,
  type UpdateTeacherInput,
} from '../users/teachers.service';
import {
  type BatchInput,
  CoachingService,
  type EnquiryInput,
} from './coaching.service';

@Controller('coaching')
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles('HEAD')
export class CoachingController {
  constructor(
    private readonly coachingService: CoachingService,
    private readonly people: TeachersService,
  ) {}

  private getInstitutionId(request: AuthenticatedRequest) {
    const institutionId = request.user?.institutionId;

    if (!institutionId) {
      throw new UnauthorizedException(
        'Your account is not linked to an institution.',
      );
    }

    return institutionId;
  }

  @Get('summary')
  summary(@Req() request: AuthenticatedRequest) {
    return this.coachingService.summary(this.getInstitutionId(request));
  }

  @Get('people-options')
  peopleOptions(@Req() request: AuthenticatedRequest) {
    return this.coachingService.peopleOptions(this.getInstitutionId(request));
  }

  /* batches */

  @Get('batches')
  listBatches(@Req() request: AuthenticatedRequest) {
    return this.coachingService.listBatches(this.getInstitutionId(request));
  }

  @Post('batches')
  createBatch(@Req() request: AuthenticatedRequest, @Body() body: BatchInput) {
    return this.coachingService.createBatch(
      this.getInstitutionId(request),
      body,
    );
  }

  @Patch('batches/:id')
  updateBatch(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: BatchInput,
  ) {
    return this.coachingService.updateBatch(
      this.getInstitutionId(request),
      id,
      body,
    );
  }

  @Put('batches/:id/members')
  setMembers(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: { studentIds?: string[]; teacherIds?: string[] },
  ) {
    return this.coachingService.setBatchMembers(
      this.getInstitutionId(request),
      id,
      body ?? {},
    );
  }

  /* enquiries */

  @Get('enquiries')
  listEnquiries(@Req() request: AuthenticatedRequest) {
    return this.coachingService.listEnquiries(this.getInstitutionId(request));
  }

  @Post('enquiries')
  createEnquiry(
    @Req() request: AuthenticatedRequest,
    @Body() body: EnquiryInput,
  ) {
    return this.coachingService.createEnquiry(
      this.getInstitutionId(request),
      body,
    );
  }

  @Patch('enquiries/:id')
  updateEnquiry(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: EnquiryInput,
  ) {
    return this.coachingService.updateEnquiry(
      this.getInstitutionId(request),
      id,
      body,
    );
  }

  /* students (no class needed in coaching) */

  @Get('students')
  async listStudents(@Req() request: AuthenticatedRequest) {
    const institutionId = this.getInstitutionId(request);
    await this.coachingService.assertCoaching(institutionId);
    return this.people.list(institutionId, 'STUDENT');
  }

  @Post('students')
  async createStudent(
    @Req() request: AuthenticatedRequest,
    @Body() body: CreateTeacherInput,
  ) {
    const institutionId = this.getInstitutionId(request);
    await this.coachingService.assertCoaching(institutionId);
    return this.people.create(institutionId, body, 'STUDENT');
  }

  @Patch('students/:id')
  async updateStudent(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: UpdateTeacherInput,
  ) {
    const institutionId = this.getInstitutionId(request);
    await this.coachingService.assertCoaching(institutionId);
    return this.people.update(institutionId, id, body, 'STUDENT');
  }
}
