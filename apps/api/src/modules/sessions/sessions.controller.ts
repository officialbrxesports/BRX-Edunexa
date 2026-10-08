import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { Request } from 'express';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { SessionsService } from './services/sessions.service';

interface AuthenticatedRequest
  extends Request {
  user: {
    userId: string;
    email: string;
    brxUid?: string | null;
    role: string;
    institutionId?: string | null;
    sessionId: string;
  };
}

@Controller('sessions')
@UseGuards(JwtAuthGuard)
export class SessionsController {
  constructor(
    private readonly sessionsService: SessionsService,
  ) {}

  // ============================================================
  // Get all login sessions
  // ============================================================

  @Get()
  async getSessions(
    @Req()
    request: AuthenticatedRequest,
  ) {
    return this.sessionsService.getUserSessions(
      request.user.userId,
      request.user.sessionId,
    );
  }

  // ============================================================
  // Logout current session
  // ============================================================

  @Delete('current')
  async logoutCurrent(
    @Req()
    request: AuthenticatedRequest,
  ) {
    return this.sessionsService.revokeCurrentSession(
      request.user.userId,
      request.user.sessionId,
    );
  }

  // ============================================================
  // Logout selected session
  // ============================================================

  @Delete(':sessionId')
  async logoutSession(
    @Req()
    request: AuthenticatedRequest,

    @Param('sessionId')
    sessionId: string,
  ) {
    return this.sessionsService.revokeSession(
      request.user.userId,
      sessionId,
    );
  }

  // ============================================================
  // Logout all other devices
  // ============================================================

  @Post('logout-all-other')
  async logoutAllOther(
    @Req()
    request: AuthenticatedRequest,
  ) {
    return this.sessionsService.revokeOtherSessions(
      request.user.userId,
      request.user.sessionId,
    );
  }

  // ============================================================
  // Logout every device
  // ============================================================

  @Post('logout-all')
  async logoutAll(
    @Req()
    request: AuthenticatedRequest,
  ) {
    return this.sessionsService.revokeAllSessions(
      request.user.userId,
    );
  }
}