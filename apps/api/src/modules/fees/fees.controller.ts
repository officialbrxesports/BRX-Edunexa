import {
  Body,
  Controller,
  Get,
  Param,
  Post,
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
import { FeesService, type AssignInput, type PayInput } from './fees.service';

function institutionId(request: AuthenticatedRequest) {
  const id = request.user?.institutionId;

  if (!id) {
    throw new UnauthorizedException(
      'Your account is not linked to an institution.',
    );
  }

  return id;
}

@Controller('fees')
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles('HEAD')
export class FeesController {
  constructor(private readonly fees: FeesService) {}

  @Get('summary')
  summary(@Req() request: AuthenticatedRequest) {
    return this.fees.summary(institutionId(request));
  }

  @Get()
  list(
    @Req() request: AuthenticatedRequest,
    @Query('classId') classId?: string,
    @Query('status') status?: string,
    @Query('q') q?: string,
  ) {
    return this.fees.list(institutionId(request), { classId, status, q });
  }

  @Post('assign')
  assign(@Req() request: AuthenticatedRequest, @Body() body: AssignInput) {
    return this.fees.assign(institutionId(request), body);
  }

  @Post(':id/pay')
  pay(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: PayInput,
  ) {
    return this.fees.pay(institutionId(request), id, body);
  }

  @Post(':id/delete')
  remove(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.fees.remove(institutionId(request), id);
  }
}

/** A student (or a parent) reads their own dues here. */
@Controller('my-fees')
@UseGuards(SessionAuthGuard)
export class MyFeesController {
  constructor(private readonly fees: FeesService) {}

  @Get()
  async mine(@Req() request: AuthenticatedRequest) {
    const user = request.user!;

    return this.fees.mine({
      id: user.id,
      role: user.role,
      institutionId: institutionId(request),
    });
  }
}
