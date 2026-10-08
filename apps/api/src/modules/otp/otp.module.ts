import { Module } from '@nestjs/common';

import { OtpController } from './controllers/otp.controller';
import { OtpService } from './services/otp.service';

import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],

  controllers: [OtpController],

  providers: [OtpService],

  exports: [OtpService],
})
export class OtpModule {}