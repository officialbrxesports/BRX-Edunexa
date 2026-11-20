import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { PublicStaffJoiningController } from './public-staff-joining.controller';
import { StaffJoiningController } from './staff-joining.controller';
import { StaffJoiningService } from './staff-joining.service';

@Module({
  imports: [AuthModule, UsersModule],
  controllers: [StaffJoiningController, PublicStaffJoiningController],
  providers: [StaffJoiningService],
})
export class StaffJoiningModule {}
