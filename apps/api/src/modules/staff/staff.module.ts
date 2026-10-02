import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';
import { PermissionsModule } from '../permissions/permissions.module';

import { StaffController } from './controllers/staff.controller';
import { StaffService } from './services/staff.service';

@Module({
  imports: [
    DatabaseModule,
    PermissionsModule,
  ],
  controllers: [
    StaffController,
  ],
  providers: [
    StaffService,
  ],
  exports: [
    StaffService,
  ],
})
export class StaffModule {}
