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
import { StaffJoiningModule } from './modules/staff-joining/staff-joining.module';
import { ProgramAdmissionsModule } from './modules/program-admissions/program-admissions.module';
import { InstituteModule } from './modules/institute/institute.module';
import { OtherModule } from './modules/other/other.module';
import { EmailModule } from './modules/email/email.module';

@Module({
  imports: [
    PrismaModule,
    EmailModule,
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
    StaffJoiningModule,
    ProgramAdmissionsModule,
    InstituteModule,
    OtherModule,
  ],
})
export class AppModule {}