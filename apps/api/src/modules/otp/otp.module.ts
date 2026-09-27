import { Module } from '@nestjs/common';

import { OtpController } from './controllers/otp.controller';

import { OtpService } from './services/otp.service';

@Module({
  controllers: [
    OtpController,
  ],

  providers: [
    OtpService,
  ],

  exports: [
    OtpService,
  ],
})
export class OtpModule {}