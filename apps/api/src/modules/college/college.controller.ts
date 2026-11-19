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
  type CreateTeacherInput,
  TeachersService,
  type UpdateTeacherInput,
} from '../users/teachers.service';
import {
  CollegeService,
  type CourseInput,
  type DepartmentInput,
  type EnrollmentInput,
  type FacultyInput,
  type ProgramInput,
  type ResultRow,
} from './college.service';

@Controller('college')
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles('HEAD')
export class CollegeController {
  constructor(
    private readonly college: CollegeService,
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
    return this.college.summary(this.institutionId(request));
  }

  @Get('people-options')
  peopleOptions(@Req() request: AuthenticatedRequest) {
    return this.college.peopleOptions(this.institutionId(request));
  }

  /* faculties (universities only) */

  @Get('faculties')
  listFaculties(@Req() request: AuthenticatedRequest) {
    return this.college.listFaculties(this.institutionId(request));
  }

  @Post('faculties')
  createFaculty(
    @Req() request: AuthenticatedRequest,
    @Body() body: FacultyInput,
  ) {
    return this.college.createFaculty(this.institutionId(request), body);
  }

  @Patch('faculties/:id')
  updateFaculty(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: FacultyInput,
  ) {
    return this.college.updateFaculty(this.institutionId(request), id, body);
  }

  /* results */

  @Get('results/sheet')
  resultSheet(
    @Req() request: AuthenticatedRequest,
    @Query('courseId') courseId?: string,
  ) {
    return this.college.resultSheet(this.institutionId(request), courseId);
  }

  @Put('results')
  saveResults(
    @Req() request: AuthenticatedRequest,
    @Body() body: { courseId?: string; results?: ResultRow[] },
  ) {
    return this.college.saveResults(
      this.institutionId(request),
      body?.courseId,
      body?.results ?? [],
    );
  }

  /* departments */

  @Get('departments')
  listDepartments(@Req() request: AuthenticatedRequest) {
    return this.college.listDepartments(this.institutionId(request));
  }

  @Post('departments')
  createDepartment(
    @Req() request: AuthenticatedRequest,
    @Body() body: DepartmentInput,
  ) {
    return this.college.createDepartment(this.institutionId(request), body);
  }

  @Patch('departments/:id')
  updateDepartment(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: DepartmentInput,
  ) {
    return this.college.updateDepartment(this.institutionId(request), id, body);
  }

  /* programs */

  @Get('programs')
  listPrograms(@Req() request: AuthenticatedRequest) {
    return this.college.listPrograms(this.institutionId(request));
  }

  @Post('programs')
  createProgram(
    @Req() request: AuthenticatedRequest,
    @Body() body: ProgramInput,
  ) {
    return this.college.createProgram(this.institutionId(request), body);
  }

  @Patch('programs/:id')
  updateProgram(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: ProgramInput,
  ) {
    return this.college.updateProgram(this.institutionId(request), id, body);
  }

  /* courses */

  @Get('templates')
  templates() {
    return this.college.listTemplates();
  }

  @Post('templates/apply')
  applyTemplates(
    @Req() request: AuthenticatedRequest,
    @Body() body: { ids?: string[] },
  ) {
    return this.college.applyTemplates(this.institutionId(request), body?.ids);
  }

  @Get('courses')
  listCourses(
    @Req() request: AuthenticatedRequest,
    @Query('programId') programId?: string,
  ) {
    return this.college.listCourses(this.institutionId(request), programId);
  }

  @Post('courses')
  createCourse(@Req() request: AuthenticatedRequest, @Body() body: CourseInput) {
    return this.college.createCourse(this.institutionId(request), body);
  }

  @Patch('courses/:id')
  updateCourse(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: CourseInput,
  ) {
    return this.college.updateCourse(this.institutionId(request), id, body);
  }

  @Delete('courses/:id')
  deleteCourse(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.college.deleteCourse(this.institutionId(request), id);
  }

  /* enrollments */

  @Get('enrollments')
  listEnrollments(@Req() request: AuthenticatedRequest) {
    return this.college.listEnrollments(this.institutionId(request));
  }

  @Put('enrollments/:studentId')
  enroll(
    @Req() request: AuthenticatedRequest,
    @Param('studentId') studentId: string,
    @Body() body: EnrollmentInput,
  ) {
    return this.college.enroll(this.institutionId(request), studentId, body);
  }

  @Delete('enrollments/:studentId')
  unenroll(
    @Req() request: AuthenticatedRequest,
    @Param('studentId') studentId: string,
  ) {
    return this.college.unenroll(this.institutionId(request), studentId);
  }

  /* students (account only; program is set through enrollments) */

  @Get('students')
  async listStudents(@Req() request: AuthenticatedRequest) {
    const institutionId = this.institutionId(request);
    await this.college.assertCollege(institutionId);
    return this.people.list(institutionId, 'STUDENT');
  }

  @Post('students')
  async createStudent(
    @Req() request: AuthenticatedRequest,
    @Body() body: CreateTeacherInput,
  ) {
    const institutionId = this.institutionId(request);
    await this.college.assertCollege(institutionId);
    return this.people.create(institutionId, body, 'STUDENT');
  }

  @Patch('students/:id')
  async updateStudent(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: UpdateTeacherInput,
  ) {
    const institutionId = this.institutionId(request);
    await this.college.assertCollege(institutionId);
    return this.people.update(institutionId, id, body, 'STUDENT');
  }
}
