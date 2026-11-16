import {
  Controller,
  Param,
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
import { TeachersService } from './teachers.service';

/** Account actions a head can take for people in their own institution. */
@Controller('users')
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles('HEAD')
export class AccountsController {
  constructor(private readonly people: TeachersService) {}

  @Post(':id/reset-password')
  resetPassword(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    const institutionId = request.user?.institutionId;

    if (!institutionId) {
      throw new UnauthorizedException(
        'Your account is not linked to an institution.',
      );
    }

    return this.people.resetPassword(institutionId, id);
  }
}
