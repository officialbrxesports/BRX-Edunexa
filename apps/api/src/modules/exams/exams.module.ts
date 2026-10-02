import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';
import { PermissionsModule } from '../permissions/permissions.module';

import { ExamsController } from './controllers/exams.controller';
import { ExamsService } from './services/exams.service';

@Module({
  imports: [
    DatabaseModule,
    PermissionsModule,
  ],
  controllers: [
    ExamsController,
  ],
  providers: [
    ExamsService,
  ],
  exports: [
    ExamsService,
  ],
})
export class ExamsModule {}