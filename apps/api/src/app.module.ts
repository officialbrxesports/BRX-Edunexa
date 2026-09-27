import { Module } from '@nestjs/common';

import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { DatabaseModule } from './database/database.module';
import { AssignmentsModule } from './modules/assignments/assignments.module';

import { AuthModule } from './modules/auth/auth.module';
import { InstitutionsModule } from './modules/institutions/institutions.module';
import { UsersModule } from './modules/users/users.module';
import { AcademicsModule } from './modules/academics/academics.module';
import { RegistrationModule } from './modules/registration/registration.module';
import { OtpModule } from './modules/otp/otp.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
    }),

    DatabaseModule,
    AuthModule,
    UsersModule,
    InstitutionsModule,
    AcademicsModule,
    RegistrationModule,
    OtpModule,
    AssignmentsModule,
  ],

  controllers: [
    AppController,
  ],

  providers: [
    AppService,
  ],
})
export class AppModule {}