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
import { NoteSendService, type NoteSendInput } from './note-send.service';

/** A head or teacher sends a saved note to people's portal inbox and email. */
@Controller('notes')
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles('HEAD', 'TEACHER')
export class NoteSendController {
  constructor(private readonly notes: NoteSendService) {}

  @Post('send')
  send(@Req() request: AuthenticatedRequest, @Body() body: NoteSendInput) {
    const user = request.user!;

    if (!user.institutionId) {
      throw new UnauthorizedException(
        'Your account is not linked to an institution.',
      );
    }

    return this.notes.send(
      {
        id: user.id,
        name: user.name,
        role: user.role,
        institutionId: user.institutionId,
      },
      body,
    );
  }

  @Get('sends')
  history(@Req() request: AuthenticatedRequest) {
    return this.notes.history(request.user!.id);
  }
}
