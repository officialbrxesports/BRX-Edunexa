import { Global, Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { ApplicationMailService } from './application-mail.service';

@Global()
@Module({
  providers: [EmailService, ApplicationMailService],
  exports: [EmailService, ApplicationMailService],
})
export class EmailModule {}
