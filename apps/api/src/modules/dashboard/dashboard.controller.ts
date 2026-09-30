import {
  Controller,
  Get,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

type AuthenticatedRequest = Request & {
  user?: {
    sub?: string;
    institutionId?: string | null;
    role?: string;
  };
};

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
  ) {}

  @Get('overview')
  async getOverview(@Req() req: AuthenticatedRequest) {
    const institutionId = req.user?.institutionId;

    if (!institutionId) {
      return {
        students: 0,
        teachers: 0,
        staff: 0,
        classes: 0,
        activeStudents: 0,
        activeTeachers: 0,
        activeStaff: 0,
        totalUsers: 0,
        generatedAt: new Date().toISOString(),
      };
    }

    return this.dashboardService.getOverview(institutionId);
  }
}
