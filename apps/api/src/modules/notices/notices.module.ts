import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { InboxController, NoticesController } from './notices.controller';
import { TeacherNoticesController } from './teacher-notices.controller';
import { NoticesService } from './notices.service';

@Module({
  imports: [AuthModule],
  controllers: [NoticesController, InboxController, TeacherNoticesController],
  providers: [NoticesService],
})
export class NoticesModule {}
