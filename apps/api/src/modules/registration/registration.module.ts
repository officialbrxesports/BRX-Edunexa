import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';

import { RegistrationController } from './controllers/registration.controller';
import { RegistrationService } from './services/registration.service';

@Module({
  imports: [
    AuthModule,
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