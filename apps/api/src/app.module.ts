import { Module } from '@nestjs/common';
import { HealthModule } from './modules/health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { InstitutionsModule } from './modules/institutions/institutions.module';
@Module({
  imports: [PrismaModule, HealthModule, AuthModule, InstitutionsModule],
})
export class AppModule {}
