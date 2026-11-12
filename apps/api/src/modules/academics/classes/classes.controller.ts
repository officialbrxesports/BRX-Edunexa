
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

import {
  AuthenticatedRequest,
  SessionAuthGuard,
} from '../../../common/guards/session-auth.guard';

import {
  ClassesService,
  CreateClassInput,
  UpdateClassInput,
} from './classes.service';

@Controller('academics/classes')
@UseGuards(SessionAuthGuard)
export class ClassesController {
  constructor(
    private readonly classesService: ClassesService,
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

  @Post()
  create(
    @Req() request: AuthenticatedRequest,
    @Body() body: CreateClassInput,
  ) {
    return this.classesService.create(
      this.getInstitutionId(request),
      body,
    );
  }

  @Get()
  findAll(@Req() request: AuthenticatedRequest) {
    return this.classesService.findAll(
      this.getInstitutionId(request),
    );
  }

  @Get('seating')
  findSeating(@Req() request: AuthenticatedRequest) {
    return this.classesService.findSeating(
      this.getInstitutionId(request),
    );
  }

  @Get(':id')
  findOne(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.classesService.findOne(
      this.getInstitutionId(request),
      id,
    );
  }

  @Patch(':id')
update(
  @Req() request: AuthenticatedRequest,
  @Param('id') id: string,
  @Body() body: UpdateClassInput,
) {
    return this.classesService.update(
      this.getInstitutionId(request),
      id,
      body,
    );
  }
}
