import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import {
  InstituteController,
  PublicCertificateController,
} from './institute.controller';
import { InstituteService } from './institute.service';

@Module({
  imports: [AuthModule, UsersModule],
  controllers: [InstituteController, PublicCertificateController],
  providers: [InstituteService],
})
export class InstituteModule {}
