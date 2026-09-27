import { Module } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { UsersController } from './controllers/users.controller';
import { UsersService } from './services/users.service';

@Module({
  controllers: [UsersController],
  providers: [
    UsersService,
    PrismaService,
    JwtAuthGuard,
  ],
})
export class UsersModule {}