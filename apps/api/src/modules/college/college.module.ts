import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { CollegeController } from './college.controller';
import { CollegeService } from './college.service';

@Module({
  imports: [AuthModule, UsersModule],
  controllers: [CollegeController],
  providers: [CollegeService],
})
export class CollegeModule {}
