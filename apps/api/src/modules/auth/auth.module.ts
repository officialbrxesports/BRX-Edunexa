import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { PasswordResetService } from "./password-reset.service";
import { SessionAuthGuard } from "../../common/guards/session-auth.guard";

@Module({
controllers: [AuthController],
providers: [AuthService, PasswordResetService, SessionAuthGuard],
exports: [AuthService, SessionAuthGuard],
})
export class AuthModule {}
