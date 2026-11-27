import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { InboxController, NoticesController } from './notices.controller';
import { TeacherNoticesController } from './teacher-notices.controller';
import { NoteSendController } from './note-send.controller';
import { NoteSendService } from './note-send.service';
import { NoticesService } from './notices.service';

@Module({
  imports: [AuthModule],
  controllers: [
    NoticesController,
    InboxController,
    TeacherNoticesController,
    NoteSendController,
  ],
  providers: [NoticesService, NoteSendService],
})
export class NoticesModule {}
