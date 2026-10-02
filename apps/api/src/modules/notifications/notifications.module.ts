import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';
import { PermissionsModule } from '../permissions/permissions.module';

import { NotificationsController } from './controllers/notifications.controller';
import { NotificationsService } from './services/notifications.service';

@Module({
  imports: [
    DatabaseModule,
    PermissionsModule,
  ],
  controllers: [
    NotificationsController,
  ],
  providers: [
    NotificationsService,
  ],
  exports: [
    NotificationsService,
  ],
})
export class NotificationsModule {}
