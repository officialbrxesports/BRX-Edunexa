import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import {
  MyStaffAttendanceController,
  StaffAttendanceController,
} from './staff-attendance.controller';
import { StaffAttendanceService } from './staff-attendance.service';

@Module({
  imports: [AuthModule],
  controllers: [StaffAttendanceController, MyStaffAttendanceController],
  providers: [StaffAttendanceService],
})
export class StaffAttendanceModule {}
