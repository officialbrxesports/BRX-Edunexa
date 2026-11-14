import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import {
  GuardsController,
  StaffController,
  TeachersController,
} from './teachers.controller';
import { ParentsController } from './parents.controller';
import { ParentsService } from './parents.service';
import { TeachersService } from './teachers.service';

@Module({
  imports: [AuthModule],
  controllers: [
    TeachersController,
    StaffController,
    GuardsController,
    ParentsController,
  ],
  providers: [TeachersService, ParentsService],
  exports: [TeachersService],
})
export class UsersModule {}
