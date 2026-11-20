import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { ProgramAdmissionsController } from './program-admissions.controller';
import { ProgramAdmissionsService } from './program-admissions.service';
import { PublicProgramAdmissionController } from './public-program-admission.controller';

@Module({
  imports: [AuthModule, UsersModule],
  controllers: [ProgramAdmissionsController, PublicProgramAdmissionController],
  providers: [ProgramAdmissionsService],
})
export class ProgramAdmissionsModule {}
