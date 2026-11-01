
import {
  Controller,
  Get,
  Param,
  Req,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { DashboardService } from "./dashboard.service";

@Controller("dashboard")
@UseGuards(AuthGuard("jwt"))
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get(":institutionId")
  getSummary(
    @Param("institutionId") institutionId: string,
    @Req() request: { user: { role: string; institutionId?: string | null } },
  ) {
    return this.dashboardService.getInstitutionSummary(
      institutionId,
      request.user,
    );
  }
}
