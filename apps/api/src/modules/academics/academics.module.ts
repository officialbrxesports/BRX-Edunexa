import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';

import { ClassesController } from './classes/classes.controller';
import { ClassesService } from './classes/classes.service';

import { SubjectsController } from './subjects/subjects.controller';
import { SubjectsService } from './subjects/subjects.service';

@Module({
  imports: [AuthModule],
  controllers: [
    ClassesController,
    SubjectsController,
  ],
  providers: [
    ClassesService,
    SubjectsService,
  ],
})
export class AcademicsModule {}
