import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';

import { CreateUserDto } from '../dto/create-user.dto';
import { AssignStudentDto } from '../dto/assign-student.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/auth/guards/roles.guard';
import { Roles } from '../../../common/auth/decorators/roles.decorator';

import { UpdateProfileDto } from '../dto/update-profile.dto';
import { UsersService } from '../services/users.service';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
    role: string;
    institutionId: string | null;
  };
}

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles('HEAD')
  @Post()
  async createUser(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateUserDto,
  ) {
    return this.usersService.createInstitutionUser(
      req.user.institutionId,
      dto,
    );
  }

  @Get('me')
  async getProfile(@Req() req: AuthenticatedRequest) {
    return this.usersService.getProfile(req.user.userId);
  }

  @Roles('HEAD', 'TEACHER', 'STAFF', 'STUDENT')
  @Get('me/role')
  async getMyRole(
    @Req() req: AuthenticatedRequest,
  ) {
    return {
      userId: req.user.userId,
      role: req.user.role,
      institutionId: req.user.institutionId,
    };
  }

  @Patch('me')
  async updateProfile(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(
      req.user.userId,
      dto,
    );
  }

  @Roles('HEAD')
  @Get()
  async findAll(@Req() req: AuthenticatedRequest) {
    return this.usersService.findInstitutionUsers(
      req.user.institutionId,
    );
  }

  @Roles('HEAD')
  @Get(':id')
  async findOne(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.usersService.findInstitutionUser(
      req.user.institutionId,
      id,
    );
  }

  @Roles('HEAD')
  @Patch(':id')
  async updateUser(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateInstitutionUser(
      req.user.institutionId,
      id,
      dto,
    );
  }

    @Roles('HEAD')
  @Post(':teacherId/students')
  async assignStudent(
    @Req() req: AuthenticatedRequest,
    @Param('teacherId') teacherId: string,
    @Body() dto: AssignStudentDto,
  ) {
    return this.usersService.assignStudentToTeacher(
      req.user.institutionId,
      teacherId,
      dto.studentId,
    );
  }

  @Roles('HEAD', 'TEACHER')
  @Get(':teacherId/students')
  async getTeacherStudents(
    @Req() req: AuthenticatedRequest,
    @Param('teacherId') teacherId: string,
  ) {
    return this.usersService.findTeacherStudents(
      req.user.institutionId,
      teacherId,
    );
  }

    @Roles('HEAD')
    @Delete(':teacherId/students/:studentId')
    async removeStudent(
      @Req() req: AuthenticatedRequest,
      @Param('teacherId') teacherId: string,
      @Param('studentId') studentId: string,
    ) {
      return this.usersService.removeStudentFromTeacher(
        req.user.institutionId,
        teacherId,
        studentId,
      );
    }
}