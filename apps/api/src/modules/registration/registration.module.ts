import { Module } from '@nestjs/common';

import { RegistrationController } from './controllers/registration.controller';

import { RegistrationService } from './services/registration.service';

import { DatabaseModule } from '../../database/database.module';

import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    DatabaseModule,
    NotificationsModule,
  ],

  controllers: [
    RegistrationController,
  ],

  providers: [
    RegistrationService,
  ],

  exports: [
    RegistrationService,
  ],
})
export class RegistrationModule {}