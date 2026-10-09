import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { EmailConfig } from './email/email.config';
import { EmailService } from './services/email.service';

@Module({
  imports: [ConfigModule],
  providers: [
    EmailConfig,
    EmailService,
  ],
  exports: [
    EmailService,
  ],
})
export class NotificationsModule {}