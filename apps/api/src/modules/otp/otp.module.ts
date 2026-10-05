import { Module } from '@nestjs/common';
import { OtpController } from './controllers/otp.controller';
import { OtpService } from './services/otp.service';
import { SmsService } from './services/sms.service';

@Module({
  controllers: [OtpController],
  providers: [OtpService, SmsService],
  exports: [OtpService, SmsService],
})
export class OtpModule {}