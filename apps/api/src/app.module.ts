import { Module } from '@nestjs/common';
import { HealthModule } from './modules/health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { InstitutionsModule } from './modules/institutions/institutions.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { AcademicsModule } from './modules/academics/academics.module';
import { StudentsModule } from './modules/students/students.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { UsersModule } from './modules/users/users.module';
import { CoachingModule } from './modules/coaching/coaching.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { CollegeModule } from './modules/college/college.module';

@Module({
  imports: [
    PrismaModule,
    HealthModule,
    AuthModule,
    InstitutionsModule,
    DocumentsModule,
    AcademicsModule,
    StudentsModule,
    DashboardModule,
    UsersModule,
    CoachingModule,
    AttendanceModule,
    CollegeModule,
  ],
})
export class AppModule {}