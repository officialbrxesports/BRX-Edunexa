import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { CollegeAdmissionsController } from './college-admissions.controller';
import { CollegeAdmissionsService } from './college-admissions.service';
import { CollegeController } from './college.controller';
import { CollegeService } from './college.service';
import { PublicCollegeAdmissionController } from './public-college-admission.controller';

@Module({
  imports: [AuthModule, UsersModule],
  controllers: [
    CollegeController,
    CollegeAdmissionsController,
    PublicCollegeAdmissionController,
  ],
  providers: [CollegeService, CollegeAdmissionsService],
})
export class CollegeModule {}
