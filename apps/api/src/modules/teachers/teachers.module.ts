import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';
import { PermissionsModule } from '../permissions/permissions.module';

import { TeachersController } from './controllers/teachers.controller';
import { TeachersService } from './services/teachers.service';

@Module({
  imports: [
    DatabaseModule,
    PermissionsModule,
  ],
  controllers: [
    TeachersController,
  ],
  providers: [
    TeachersService,
  ],
  exports: [
    TeachersService,
  ],
})
export class TeachersModule {}
