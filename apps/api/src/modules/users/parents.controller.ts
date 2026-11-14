import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
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
  type ChildLinkInput,
  type CreateParentInput,
  ParentsService,
} from './parents.service';
import { TeachersService, type UpdateTeacherInput } from './teachers.service';

@Controller('parents')
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles('HEAD')
export class ParentsController {
  constructor(
    private readonly parentsService: ParentsService,
    private readonly teachersService: TeachersService,
  ) {}

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
    return this.parentsService.list(this.getInstitutionId(request));
  }

  @Get('student-options')
  studentOptions(@Req() request: AuthenticatedRequest) {
    return this.parentsService.studentOptions(this.getInstitutionId(request));
  }

  @Post()
  create(
    @Req() request: AuthenticatedRequest,
    @Body() body: CreateParentInput,
  ) {
    return this.parentsService.create(this.getInstitutionId(request), body);
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
      'PARENT',
    );
  }

  @Put(':id/children')
  setChildren(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: { children?: ChildLinkInput[] },
  ) {
    return this.parentsService.setChildren(
      this.getInstitutionId(request),
      id,
      body?.children,
    );
  }
}
