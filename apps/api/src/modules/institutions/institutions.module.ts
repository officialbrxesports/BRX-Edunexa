import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';
import { InstitutionsController } from './controllers/institutions.controller';
import { InstitutionsService } from './services/institutions.service';

@Module({
  imports: [DatabaseModule],
  controllers: [InstitutionsController],
  providers: [InstitutionsService],
  exports: [InstitutionsService],
})
export class InstitutionsModule {}