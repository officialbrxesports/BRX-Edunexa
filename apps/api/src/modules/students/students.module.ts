import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';

import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';

import { AdmissionDocumentsController } from './admission-documents.controller';
import { AdmissionDocumentsService } from './admission-documents.service';

@Module({
  imports: [AuthModule],
  controllers: [
    StudentsController,
    AdmissionDocumentsController,
  ],
  providers: [
    StudentsService,
    AdmissionDocumentsService,
  ],
})
export class StudentsModule {}