import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
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
  type CreateTeacherInput,
  TeachersService,
  type UpdateTeacherInput,
} from '../users/teachers.service';
import {
  type CourseInput,
  type EnrollInput,
  InstituteService,
  type UpdateEnrollmentInput,
} from './institute.service';

@Controller('institute')
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles('HEAD')
export class InstituteController {
  constructor(
    private readonly institute: InstituteService,
    private readonly people: TeachersService,
  ) {}

  private institutionId(request: AuthenticatedRequest) {
    const id = request.user?.institutionId;

    if (!id) {
      throw new UnauthorizedException(
        'Your account is not linked to an institution.',
      );
    }

    return id;
  }

  @Get('summary')
  summary(@Req() request: AuthenticatedRequest) {
    return this.institute.summary(this.institutionId(request));
  }

  @Get('people-options')
  peopleOptions(@Req() request: AuthenticatedRequest) {
    return this.institute.peopleOptions(this.institutionId(request));
  }

  @Get('courses')
  listCourses(@Req() request: AuthenticatedRequest) {
    return this.institute.listCourses(this.institutionId(request));
  }

  @Post('courses')
  createCourse(@Req() request: AuthenticatedRequest, @Body() body: CourseInput) {
    return this.institute.createCourse(this.institutionId(request), body);
  }

  @Patch('courses/:id')
  updateCourse(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: CourseInput,
  ) {
    return this.institute.updateCourse(this.institutionId(request), id, body);
  }

  @Get('enrollments')
  listEnrollments(
    @Req() request: AuthenticatedRequest,
    @Query('courseId') courseId?: string,
  ) {
    return this.institute.listEnrollments(this.institutionId(request), courseId);
  }

  @Post('enrollments')
  enroll(@Req() request: AuthenticatedRequest, @Body() body: EnrollInput) {
    return this.institute.enroll(this.institutionId(request), body);
  }

  @Patch('enrollments/:id')
  updateEnrollment(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: UpdateEnrollmentInput,
  ) {
    return this.institute.updateEnrollment(this.institutionId(request), id, body);
  }

  @Get('certificates')
  listCertificates(@Req() request: AuthenticatedRequest) {
    return this.institute.listCertificates(this.institutionId(request));
  }

  @Post('enrollments/:id/certificate')
  issue(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.institute.issueCertificate(
      this.institutionId(request),
      request.user!.id,
      id,
    );
  }

  @Get('students')
  async listStudents(@Req() request: AuthenticatedRequest) {
    const institutionId = this.institutionId(request);
    await this.institute.assertInstitute(institutionId);
    return this.people.list(institutionId, 'STUDENT');
  }

  @Post('students')
  async createStudent(
    @Req() request: AuthenticatedRequest,
    @Body() body: CreateTeacherInput,
  ) {
    const institutionId = this.institutionId(request);
    await this.institute.assertInstitute(institutionId);
    return this.people.create(institutionId, body, 'STUDENT');
  }

  @Patch('students/:id')
  async updateStudent(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: UpdateTeacherInput,
  ) {
    const institutionId = this.institutionId(request);
    await this.institute.assertInstitute(institutionId);
    return this.people.update(institutionId, id, body, 'STUDENT');
  }
}

/** Anyone (for example an employer) can check a certificate number. */
@Controller('public/certificates')
export class PublicCertificateController {
  constructor(private readonly institute: InstituteService) {}

  @Get(':number')
  verify(@Param('number') number: string) {
    return this.institute.verifyCertificate(number);
  }
}
