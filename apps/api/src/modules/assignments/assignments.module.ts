import { Module } from '@nestjs/common';
import { AssignmentsController } from './controllers/assignments.controller';
import { AssignmentsService } from './services/assignments.service';

@Module({
  controllers: [AssignmentsController],
  providers: [AssignmentsService],
  exports: [AssignmentsService],
})
export class AssignmentsModule {}