import { Module } from '@nestjs/common';

import { FeesModule } from './fees/fees.module';

import { AcademicsController } from './controllers/academics.controller';
import { AcademicsService } from './services/academics.service';

@Module({
  imports: [
    FeesModule,
  ],

  controllers: [
    AcademicsController,
  ],

  providers: [
    AcademicsService,
  ],
})
export class AcademicsModule {}