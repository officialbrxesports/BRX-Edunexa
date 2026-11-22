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

@Controller('attendance')
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles('HEAD')
export class AttendanceController {
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
    return this.attendance.groups(this.institutionId(request));
  }

  @Get('sheet')
  sheet(
    @Req() request: AuthenticatedRequest,
    @Query('groupId') groupId?: string,
    @Query('date') date?: string,
  ) {
    return this.attendance.sheet(this.institutionId(request), groupId, date);
  }

  @Put('sheet')
  save(
    @Req() request: AuthenticatedRequest,
    @Body() body: { groupId?: string; date?: string; records?: AttendanceRow[] },
  ) {
    return this.attendance.save(
      this.institutionId(request),
      request.user!.id,
      body?.groupId,
      body?.date,
      body?.records ?? [],
    );
  }

  @Get('overview')
  overview(@Req() request: AuthenticatedRequest, @Query('date') date?: string) {
    return this.attendance.overview(this.institutionId(request), date);
  }

  @Get('trend')
  trend(@Req() request: AuthenticatedRequest, @Query('days') days?: string) {
    return this.attendance.trend(this.institutionId(request), days);
  }

  @Get('absentees')
  absentees(@Req() request: AuthenticatedRequest, @Query('date') date?: string) {
    return this.attendance.absentees(this.institutionId(request), date);
  }

  @Get('low')
  low(@Req() request: AuthenticatedRequest, @Query('below') below?: string) {
    return this.attendance.lowAttendance(this.institutionId(request), below);
  }

  @Get('summary')
  summary(@Req() request: AuthenticatedRequest, @Query('date') date?: string) {
    return this.attendance.summary(this.institutionId(request), date);
  }
}
