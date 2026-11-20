import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { StaffJoiningController } from './staff-joining.controller';
import { StaffJoiningService } from './staff-joining.service';

@Module({
  imports: [AuthModule, UsersModule],
  controllers: [StaffJoiningController],
  providers: [StaffJoiningService],
})
export class StaffJoiningModule {}
