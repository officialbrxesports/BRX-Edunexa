import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';

import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';

import { AdmissionDocumentsController } from './admission-documents.controller';
import { AdmissionDocumentsService } from './admission-documents.service';
import { PublicAdmissionController } from './public-admission.controller';

@Module({
  imports: [AuthModule, UsersModule],
  controllers: [
    StudentsController,
    AdmissionDocumentsController,
    PublicAdmissionController,
  ],
  providers: [
    StudentsService,
    AdmissionDocumentsService,
  ],
})
export class StudentsModule {}