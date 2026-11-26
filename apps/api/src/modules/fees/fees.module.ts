import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { FeesController, MyFeesController } from './fees.controller';
import { FeesService } from './fees.service';

@Module({
  imports: [AuthModule],
  controllers: [FeesController, MyFeesController],
  providers: [FeesService],
})
export class FeesModule {}
