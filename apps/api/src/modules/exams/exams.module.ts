import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ExamsController } from './exams.controller';
import { ExamsService } from './exams.service';
import { MyResultsController } from './my-results.controller';

@Module({
  imports: [AuthModule],
  controllers: [ExamsController, MyResultsController],
  providers: [ExamsService],
})
export class ExamsModule {}
