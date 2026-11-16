import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { OtherController } from './other.controller';
import { OtherService } from './other.service';

@Module({
  imports: [AuthModule, UsersModule],
  controllers: [OtherController],
  providers: [OtherService],
})
export class OtherModule {}
