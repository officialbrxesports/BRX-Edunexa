import {
  Body,
  Controller,
  ForbiddenException,
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
import { StaffAttendanceService, type MarkInput } from './staff-attendance.service';

function institutionId(request: AuthenticatedRequest) {
  const id = request.user?.institutionId;

  if (!id) {
    throw new UnauthorizedException(
      'Your account is not linked to an institution.',
    );
  }

  return id;
}

/** The head marks and reads attendance of teachers, staff and guards. */
@Controller('staff-attendance')
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles('HEAD')
export class StaffAttendanceController {
  constructor(private readonly attendance: StaffAttendanceService) {}

  @Get()
  day(@Req() request: AuthenticatedRequest, @Query('date') date?: string) {
    return this.attendance.day(institutionId(request), date);
  }

  @Put()
  mark(@Req() request: AuthenticatedRequest, @Body() body: MarkInput) {
    return this.attendance.mark(
      institutionId(request),
      request.user!.id,
      body,
    );
  }

  @Get('report')
  report(@Req() request: AuthenticatedRequest, @Query('month') month?: string) {
    return this.attendance.report(institutionId(request), month);
  }
}

/** A teacher, staff member or guard reads their own attendance. */
@Controller('my-staff-attendance')
@UseGuards(SessionAuthGuard)
export class MyStaffAttendanceController {
  constructor(private readonly attendance: StaffAttendanceService) {}

  @Get()
  mine(@Req() request: AuthenticatedRequest, @Query('month') month?: string) {
    const user = request.user!;

    if (!['TEACHER', 'STAFF', 'GUARD'].includes(user.role)) {
      throw new ForbiddenException('Only staff members can use this.');
    }

    return this.attendance.mine(user.id, month);
  }
}
