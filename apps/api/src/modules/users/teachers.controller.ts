import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
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
import {
  type CreateTeacherInput,
  TeachersService,
  type UpdateTeacherInput,
} from './teachers.service';

@Controller('teachers')
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles('HEAD')
export class TeachersController {
  constructor(private readonly teachersService: TeachersService) {}

  private getInstitutionId(request: AuthenticatedRequest) {
    const institutionId = request.user?.institutionId;

    if (!institutionId) {
      throw new UnauthorizedException(
        'Your account is not linked to an institution.',
      );
    }

    return institutionId;
  }

  @Get()
  list(@Req() request: AuthenticatedRequest) {
    return this.teachersService.list(this.getInstitutionId(request));
  }

  @Post()
  create(
    @Req() request: AuthenticatedRequest,
    @Body() body: CreateTeacherInput,
  ) {
    return this.teachersService.create(this.getInstitutionId(request), body);
  }

  @Patch(':id')
  update(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: UpdateTeacherInput,
  ) {
    return this.teachersService.update(
      this.getInstitutionId(request),
      id,
      body,
    );
  }
}

@Controller('staff')
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles('HEAD')
export class StaffController {
  constructor(private readonly teachersService: TeachersService) {}

  private getInstitutionId(request: AuthenticatedRequest) {
    const institutionId = request.user?.institutionId;

    if (!institutionId) {
      throw new UnauthorizedException(
        'Your account is not linked to an institution.',
      );
    }

    return institutionId;
  }

  @Get()
  list(@Req() request: AuthenticatedRequest) {
    return this.teachersService.list(this.getInstitutionId(request), 'STAFF');
  }

  @Post()
  create(
    @Req() request: AuthenticatedRequest,
    @Body() body: CreateTeacherInput,
  ) {
    return this.teachersService.create(
      this.getInstitutionId(request),
      body,
      'STAFF',
    );
  }

  @Patch(':id')
  update(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: UpdateTeacherInput,
  ) {
    return this.teachersService.update(
      this.getInstitutionId(request),
      id,
      body,
      'STAFF',
    );
  }
}

@Controller('guards')
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles('HEAD')
export class GuardsController {
  constructor(private readonly teachersService: TeachersService) {}

  private getInstitutionId(request: AuthenticatedRequest) {
    const institutionId = request.user?.institutionId;

    if (!institutionId) {
      throw new UnauthorizedException(
        'Your account is not linked to an institution.',
      );
    }

    return institutionId;
  }

  @Get()
  list(@Req() request: AuthenticatedRequest) {
    return this.teachersService.list(this.getInstitutionId(request), 'GUARD');
  }

  @Post()
  create(
    @Req() request: AuthenticatedRequest,
    @Body() body: CreateTeacherInput,
  ) {
    return this.teachersService.create(
      this.getInstitutionId(request),
      body,
      'GUARD',
    );
  }

  @Patch(':id')
  update(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: UpdateTeacherInput,
  ) {
    return this.teachersService.update(
      this.getInstitutionId(request),
      id,
      body,
      'GUARD',
    );
  }
}
