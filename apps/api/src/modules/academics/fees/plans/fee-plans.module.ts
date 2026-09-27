import { Module } from '@nestjs/common';

import { FeePlansController } from './controllers/fee-plans.controller';
import { FeePlansService } from './services/fee-plans.service';

@Module({
  controllers: [FeePlansController],
  providers: [FeePlansService],
  exports: [FeePlansService],
})
export class FeePlansModule {}