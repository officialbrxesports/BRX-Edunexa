import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import type { Request } from 'express';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { RolesGuard } from '../../auth/guards/roles.guard';

import { CreateClassDto } from '../dto/create-class.dto';
import { CreateSectionDto } from '../dto/create-section.dto';
import { CreateEnrollmentDto } from '../dto/create-enrollment.dto';
import { CreateAttendanceDto } from '../dto/create-attendance.dto';

import { AcademicsService } from '../services/academics.service';

@Controller('academics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AcademicsController {
  constructor(
    private readonly academicsService: AcademicsService,
  ) {}

  // =========================================
  // CLASSES
  // =========================================

  @Post('classes')
  @Roles('HEAD')
  async createClass(
    @Req() request: Request,
    @Body() dto: CreateClassDto,
  ) {
    const user = request.user as {
      institutionId?: string;
    };

    return this.academicsService.createClass(
      user.institutionId!,
      dto,
    );
  }

  @Get('classes')
  @Roles('HEAD', 'TEACHER', 'STAFF')
  async getClasses(
    @Req() request: Request,
  ) {
    const user = request.user as {
      institutionId?: string;
    };

    return this.academicsService.findClasses(
      user.institutionId!,
    );
  }

  @Get('classes/:classId')
  @Roles('HEAD', 'TEACHER', 'STAFF')
  async getClass(
    @Req() request: Request,
    @Param('classId') classId: string,
  ) {
    const user = request.user as {
      institutionId?: string;
    };

    return this.academicsService.findClass(
      user.institutionId!,
      classId,
    );
  }

  @Delete('classes/:classId')
  @Roles('HEAD')
  async deleteClass(
    @Req() request: Request,
    @Param('classId') classId: string,
  ) {
    const user = request.user as {
      institutionId?: string;
    };

    return this.academicsService.deleteClass(
      user.institutionId!,
      classId,
    );
  }

  // =========================================
  // SECTIONS
  // =========================================

  @Post('classes/:classId/sections')
  @Roles('HEAD')
  async createSection(
    @Req() request: Request,
    @Param('classId') classId: string,
    @Body() dto: CreateSectionDto,
  ) {
    const user = request.user as {
      institutionId?: string;
    };

    return this.academicsService.createSection(
      user.institutionId!,
      classId,
      dto,
    );
  }

  @Get('classes/:classId/sections')
  @Roles('HEAD', 'TEACHER', 'STAFF')
  async getSections(
    @Req() request: Request,
    @Param('classId') classId: string,
  ) {
    const user = request.user as {
      institutionId?: string;
    };

    return this.academicsService.findSections(
      user.institutionId!,
      classId,
    );
  }

  @Get(
    'classes/:classId/sections/:sectionId/students',
  )
  @Roles('HEAD', 'TEACHER', 'STAFF')
  async getSectionStudents(
    @Req() request: Request,
    @Param('classId') classId: string,
    @Param('sectionId') sectionId: string,
  ) {
    const user = request.user as {
      institutionId?: string;
    };

    return this.academicsService.findSectionStudents(
      user.institutionId!,
      classId,
      sectionId,
    );
  }

  @Delete('sections/:sectionId')
  @Roles('HEAD')
  async deleteSection(
    @Req() request: Request,
    @Param('sectionId') sectionId: string,
  ) {
    const user = request.user as {
      institutionId?: string;
    };

    return this.academicsService.deleteSection(
      user.institutionId!,
      sectionId,
    );
  }

  // =========================================
  // ENROLLMENTS
  // =========================================

  @Post('enrollments')
  @Roles('HEAD')
  async createStudentEnrollment(
    @Req() request: Request,
    @Body() dto: CreateEnrollmentDto,
  ) {
    const user = request.user as {
      institutionId?: string;
    };

    return this.academicsService.createStudentEnrollment(
      user.institutionId!,
      dto,
    );
  }

  @Get('students/:studentId/enrollments')
  @Roles('HEAD', 'TEACHER', 'STAFF')
  async getStudentEnrollments(
    @Req() request: Request,
    @Param('studentId') studentId: string,
  ) {
    const user = request.user as {
      institutionId?: string;
    };

    return this.academicsService.findStudentEnrollment(
      user.institutionId!,
      studentId,
    );
  }

  @Delete('enrollments/:enrollmentId')
  @Roles('HEAD')
  async deleteStudentEnrollment(
    @Req() request: Request,
    @Param('enrollmentId') enrollmentId: string,
  ) {
    const user = request.user as {
      institutionId?: string;
    };

    return this.academicsService.deleteStudentEnrollment(
      user.institutionId!,
      enrollmentId,
    );
  }

  // =========================================
  // ATTENDANCE
  // =========================================

  @Post('attendance')
  @Roles('HEAD', 'TEACHER', 'STAFF')
  async createAttendance(
    @Req() request: Request,
    @Body() dto: CreateAttendanceDto,
  ) {
    const user = request.user as {
      institutionId?: string;
      userId?: string;
    };

    return this.academicsService.createAttendance(
      user.institutionId!,
      user.userId!,
      dto,
    );
  }

  @Get('students/:studentId/attendance')
  @Roles('HEAD', 'TEACHER', 'STAFF')
  async getStudentAttendance(
    @Req() request: Request,
    @Param('studentId') studentId: string,
  ) {
    const user = request.user as {
      institutionId?: string;
    };

    return this.academicsService.findStudentAttendance(
      user.institutionId!,
      studentId,
    );
  }

    // =========================================
  // SECTION ATTENDANCE / HISTORY
  // =========================================

  @Get(
    'classes/:classId/sections/:sectionId/attendance',
  )
  @Roles('HEAD', 'TEACHER', 'STAFF')
  async getSectionAttendance(
    @Req() request: Request,
    @Param('classId') classId: string,
    @Param('sectionId') sectionId: string,
    @Query('date') date?: string,
  ) {
    const user = request.user as {
      institutionId?: string;
    };

    return this.academicsService.findSectionAttendance(
      user.institutionId!,
      classId,
      sectionId,
      date,
    );
  }

  // =========================================
  // MONTHLY ATTENDANCE REPORT
  // =========================================

  @Get(
    'classes/:classId/sections/:sectionId/attendance/monthly',
  )
  @Roles('HEAD', 'TEACHER', 'STAFF')
  async getMonthlyAttendanceReport(
    @Req() request: Request,
    @Param('classId') classId: string,
    @Param('sectionId') sectionId: string,
    @Query('month') month: string,
  ) {
    const user = request.user as {
      institutionId?: string;
    };

    return this.academicsService.getMonthlyAttendanceReport(
      user.institutionId!,
      classId,
      sectionId,
      month,
    );
  }
}