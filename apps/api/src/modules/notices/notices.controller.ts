import {
  Body,
  Controller,
  Get,
  Post,
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
import { NoticesService, type NoticeInput } from './notices.service';

function institutionId(request: AuthenticatedRequest) {
  const id = request.user?.institutionId;

  if (!id) {
    throw new UnauthorizedException(
      'Your account is not linked to an institution.',
    );
  }

  return id;
}

@Controller('notices')
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles('HEAD')
export class NoticesController {
  constructor(private readonly notices: NoticesService) {}

  @Get('sent')
  sent(@Req() request: AuthenticatedRequest) {
    return this.notices.sent(institutionId(request));
  }

  @Post()
  send(@Req() request: AuthenticatedRequest, @Body() body: NoticeInput) {
    return this.notices.send(institutionId(request), request.user!.id, body);
  }

  @Post('delete')
  remove(
    @Req() request: AuthenticatedRequest,
    @Body() body: { title?: string; message?: string; createdAt?: string },
  ) {
    return this.notices.remove(institutionId(request), body);
  }
}

/** Every signed-in person reads their own notices here. */
@Controller('inbox')
@UseGuards(SessionAuthGuard)
export class InboxController {
  constructor(private readonly notices: NoticesService) {}

  @Get()
  inbox(@Req() request: AuthenticatedRequest) {
    return this.notices.inbox(request.user!.id);
  }

  @Post('read')
  read(@Req() request: AuthenticatedRequest, @Body() body: { id?: string }) {
    return this.notices.markRead(request.user!.id, body?.id);
  }
}
