import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { SessionsController } from './sessions.controller';

import { SessionsService } from './services/sessions.service';

@Module({
  imports: [
    DatabaseModule,
  ],

  controllers: [
    SessionsController,
  ],

  providers: [
    SessionsService,
    JwtAuthGuard,
  ],

  exports: [
    SessionsService,
  ],
})
export class SessionsModule {}