import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { CoachingController } from './coaching.controller';
import { CoachingService } from './coaching.service';
import { CoachingTestsController } from './coaching-tests.controller';
import { CoachingTestsService } from './coaching-tests.service';

@Module({
  imports: [AuthModule, UsersModule],
  controllers: [CoachingController, CoachingTestsController],
  providers: [CoachingService, CoachingTestsService],
})
export class CoachingModule {}
