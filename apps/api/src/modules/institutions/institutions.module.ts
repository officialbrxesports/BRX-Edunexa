import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { RolesGuard } from "../../common/guards/roles.guard";
import { InstitutionsService } from "./institutions.service";
import { InstitutionsController } from "./institutions.controller";
import { InstitutionsApprovalService } from "./institutions-approval.service";
import { InstitutionsApprovalController } from "./institutions-approval.controller";

@Module({
imports: [AuthModule],
controllers: [
InstitutionsController,
InstitutionsApprovalController,
],
providers: [
  InstitutionsService,
  InstitutionsApprovalService,
  RolesGuard,
],
exports: [
InstitutionsService,
InstitutionsApprovalService,
],
})
export class InstitutionsModule {}
