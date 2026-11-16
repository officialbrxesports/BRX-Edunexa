import {
  Body,
  Controller,
  Get,
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
import { AttendanceService, type AttendanceRow } from './attendance.service';

/** A teacher takes attendance only for the sections / batches assigned to them. */
@Controller('teacher/attendance')
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles('TEACHER')
export class TeacherAttendanceController {
  constructor(private readonly attendance: AttendanceService) {}

  private institutionId(request: AuthenticatedRequest) {
    const id = request.user?.institutionId;

    if (!id) {
      throw new UnauthorizedException(
        'Your account is not linked to an institution.',
      );
    }

    return id;
  }

  @Get('groups')
  groups(@Req() request: AuthenticatedRequest) {
    return this.attendance.teacherGroups(
      this.institutionId(request),
      request.user!.id,
    );
  }

  @Get('sheet')
  async sheet(
    @Req() request: AuthenticatedRequest,
    @Query('groupId') groupId?: string,
    @Query('date') date?: string,
  ) {
    const institutionId = this.institutionId(request);
    await this.attendance.assertTeacherGroup(
      institutionId,
      request.user!.id,
      groupId,
    );
    return this.attendance.sheet(institutionId, groupId, date);
  }

  @Put('sheet')
  async save(
    @Req() request: AuthenticatedRequest,
    @Body() body: { groupId?: string; date?: string; records?: AttendanceRow[] },
  ) {
    const institutionId = this.institutionId(request);
    await this.attendance.assertTeacherGroup(
      institutionId,
      request.user!.id,
      body?.groupId,
    );
    return this.attendance.save(
      institutionId,
      request.user!.id,
      body?.groupId,
      body?.date,
      body?.records ?? [],
    );
  }
}
