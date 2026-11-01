import {
  Controller,
  Get,
  Param,
  Patch,
  UseGuards,
} from "@nestjs/common";

import { InstitutionsApprovalService } from "./institutions-approval.service";
import { SessionAuthGuard } from "../../common/guards/session-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";

@Controller("admin/institutions")
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles("PLATFORM_ADMIN")
export class InstitutionsApprovalController {
  constructor(
    private readonly approvalService: InstitutionsApprovalService,
  ) {}

  @Get("pending")
  listPending() {
    return this.approvalService.listPending();
  }

  @Patch(":id/approve")
  approve(@Param("id") id: string) {
    return this.approvalService.approve(id);
  }

  @Patch(":id/reject")
  reject(@Param("id") id: string) {
    return this.approvalService.reject(id);
  }
}