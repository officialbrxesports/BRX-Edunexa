
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';

import {
  AuthenticatedRequest,
  SessionAuthGuard,
} from '../../../common/guards/session-auth.guard';

import {
  AssignSubjectTeacherInput,
  CreateSubjectInput,
  SubjectsService,
  UpdateSubjectInput,
} from './subjects.service';

@Controller('academics/subjects')
@UseGuards(SessionAuthGuard)
export class SubjectsController {
  constructor(
    private readonly subjectsService: SubjectsService,
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

  @Get('classes')
  findClasses(@Req() request: AuthenticatedRequest) {
    return this.subjectsService.findClasses(
      this.getInstitutionId(request),
    );
  }

  @Get('teachers')
  findTeachers(@Req() request: AuthenticatedRequest) {
    return this.subjectsService.findTeachers(
      this.getInstitutionId(request),
    );
  }

  @Post()
  create(
    @Req() request: AuthenticatedRequest,
    @Body() body: CreateSubjectInput,
  ) {
    return this.subjectsService.create(
      this.getInstitutionId(request),
      body,
    );
  }

  @Get()
  findAll(@Req() request: AuthenticatedRequest) {
    return this.subjectsService.findAll(
      this.getInstitutionId(request),
    );
  }

  @Get(':id')
  findOne(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.subjectsService.findOne(
      this.getInstitutionId(request),
      id,
    );
  }

  @Patch(':id')
  update(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: UpdateSubjectInput,
  ) {
    return this.subjectsService.update(
      this.getInstitutionId(request),
      id,
      body,
    );
  }

  // Assign subject to class
  @Post(':id/classes')
  assignClass(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body('classId') classId: string,
  ) {
    return this.subjectsService.assignClass(
      this.getInstitutionId(request),
      id,
      classId,
    );
  }

  // Remove subject from class
  @Delete(':id/classes/:classId')
  removeClass(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Param('classId') classId: string,
  ) {
    return this.subjectsService.removeClass(
      this.getInstitutionId(request),
      id,
      classId,
    );
  }

  // Assign teacher
  @Post(':id/teachers')
  assignTeacher(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: AssignSubjectTeacherInput,
  ) {
    return this.subjectsService.assignTeacher(
      this.getInstitutionId(request),
      id,
      body,
    );
  }

  // Edit teacher assignment
  @Patch(':id/teachers/:assignmentId')
  updateTeacherAssignment(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Param('assignmentId') assignmentId: string,
    @Body() body: AssignSubjectTeacherInput,
  ) {
    return this.subjectsService.updateTeacherAssignment(
      this.getInstitutionId(request),
      id,
      assignmentId,
      body,
    );
  }

  // Remove teacher assignment
  @Delete(':id/teachers/:assignmentId')
  removeTeacherAssignment(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Param('assignmentId') assignmentId: string,
  ) {
    return this.subjectsService.removeTeacherAssignment(
      this.getInstitutionId(request),
      id,
      assignmentId,
    );
  }
}
