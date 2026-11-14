import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { StaffController, TeachersController } from './teachers.controller';
import { TeachersService } from './teachers.service';

@Module({
  imports: [AuthModule],
  controllers: [TeachersController, StaffController],
  providers: [TeachersService],
})
export class UsersModule {}
