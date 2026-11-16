import {
  Body,
  Controller,
  Delete,
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
} from '../users/teachers.service';
import {
  type GroupInput,
  type NoticeInput,
  OtherService,
} from './other.service';

@Controller('other')
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles('HEAD')
export class OtherController {
  constructor(
    private readonly other: OtherService,
    private readonly people: TeachersService,
  ) {}

  private institutionId(request: AuthenticatedRequest) {
    const id = request.user?.institutionId;

    if (!id) {
      throw new UnauthorizedException(
        'Your account is not linked to an institution.',
      );
    }

    return id;
  }

  @Get('summary')
  summary(@Req() request: AuthenticatedRequest) {
    return this.other.summary(this.institutionId(request));
  }

  @Get('people-options')
  peopleOptions(@Req() request: AuthenticatedRequest) {
    return this.other.peopleOptions(this.institutionId(request));
  }

  @Get('groups')
  listGroups(@Req() request: AuthenticatedRequest) {
    return this.other.listGroups(this.institutionId(request));
  }

  @Post('groups')
  createGroup(@Req() request: AuthenticatedRequest, @Body() body: GroupInput) {
    return this.other.createGroup(this.institutionId(request), body);
  }

  @Patch('groups/:id')
  updateGroup(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: GroupInput,
  ) {
    return this.other.updateGroup(this.institutionId(request), id, body);
  }

  @Post('groups/:id/members')
  addMember(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: { userId?: string },
  ) {
    return this.other.addMember(this.institutionId(request), id, body.userId);
  }

  @Delete('groups/:id/members/:userId')
  removeMember(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Param('userId') userId: string,
  ) {
    return this.other.removeMember(this.institutionId(request), id, userId);
  }

  @Get('notices')
  listNotices(@Req() request: AuthenticatedRequest) {
    return this.other.listNotices(this.institutionId(request));
  }

  @Post('notices')
  createNotice(
    @Req() request: AuthenticatedRequest,
    @Body() body: NoticeInput,
  ) {
    return this.other.createNotice(
      this.institutionId(request),
      request.user!.id,
      body,
    );
  }

  @Delete('notices/:id')
  deleteNotice(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.other.deleteNotice(this.institutionId(request), id);
  }

  /* Members (the "student" role) of an Other organisation. */

  @Get('members')
  async listMembers(@Req() request: AuthenticatedRequest) {
    const institutionId = this.institutionId(request);
    await this.other.assertOther(institutionId);
    return this.people.list(institutionId, 'STUDENT');
  }

  @Post('members')
  async createMember(
    @Req() request: AuthenticatedRequest,
    @Body() body: CreateTeacherInput,
  ) {
    const institutionId = this.institutionId(request);
    await this.other.assertOther(institutionId);
    return this.people.create(institutionId, body, 'STUDENT');
  }

  @Patch('members/:id')
  async updateMember(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: UpdateTeacherInput,
  ) {
    const institutionId = this.institutionId(request);
    await this.other.assertOther(institutionId);
    return this.people.update(institutionId, id, body, 'STUDENT');
  }
}
