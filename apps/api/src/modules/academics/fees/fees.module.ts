import { Module } from '@nestjs/common';

import { FeePlansController } from './plans/controllers/fee-plans.controller';
import { FeePlansService } from './plans/services/fee-plans.service';

import { FeesController } from './controllers/fees.controller';
import { FeesService } from './services/fees.service';

@Module({
  controllers: [
    FeePlansController,
    FeesController,
  ],

  providers: [
    FeePlansService,
    FeesService,
  ],

  exports: [
    FeePlansService,
    FeesService,
  ],
})
export class FeesModule {}