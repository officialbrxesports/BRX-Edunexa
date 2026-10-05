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
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { StudentsModule } from './modules/students/students.module';
import { TeachersModule } from './modules/teachers/teachers.module';
import { StaffModule } from './modules/staff/staff.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ExamsModule } from './modules/exams/exams.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: 'apps/api/.env',
    }),

    DatabaseModule,
    AuthModule,
    UsersModule,
    InstitutionsModule,
    AcademicsModule,
    RegistrationModule,
    OtpModule,
    AssignmentsModule,
    DashboardModule,
    PermissionsModule,
    StudentsModule,
    TeachersModule,
    StaffModule,
    ExamsModule,
    NotificationsModule,
  ],

  controllers: [
    AppController,
  ],

  providers: [
    AppService,
  ],
})
export class AppModule {}
