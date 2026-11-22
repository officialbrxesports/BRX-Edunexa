import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { InboxController, NoticesController } from './notices.controller';
import { NoticesService } from './notices.service';

@Module({
  imports: [AuthModule],
  controllers: [NoticesController, InboxController],
  providers: [NoticesService],
})
export class NoticesModule {}
