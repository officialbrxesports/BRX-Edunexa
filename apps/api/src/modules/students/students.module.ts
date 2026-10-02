import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';
import { PermissionsModule } from '../permissions/permissions.module';

import { StudentsController } from './controllers/students.controller';
import { StudentsService } from './services/students.service';

@Module({
  imports: [
    DatabaseModule,
    PermissionsModule,
  ],
  controllers: [
    StudentsController,
  ],
  providers: [
    StudentsService,
  ],
  exports: [
    StudentsService,
  ],
})
export class StudentsModule {}
