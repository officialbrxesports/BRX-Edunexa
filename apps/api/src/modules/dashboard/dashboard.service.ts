import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(institutionId: string) {
    const [
      students,
      teachers,
      staff,
      classes,
      activeStudents,
      activeTeachers,
      activeStaff,
    ] = await Promise.all([
      this.prisma.user.count({
        where: {
          institutionId,
          role: 'STUDENT',
        },
      }),

      this.prisma.user.count({
        where: {
          institutionId,
          role: 'TEACHER',
        },
      }),

      this.prisma.user.count({
        where: {
          institutionId,
          role: 'STAFF',
        },
      }),

      this.prisma.class.count({
        where: {
          institutionId,
        },
      }),

      this.prisma.user.count({
        where: {
          institutionId,
          role: 'STUDENT',
          status: 'ACTIVE',
        },
      }),

      this.prisma.user.count({
        where: {
          institutionId,
          role: 'TEACHER',
          status: 'ACTIVE',
        },
      }),

      this.prisma.user.count({
        where: {
          institutionId,
          role: 'STAFF',
          status: 'ACTIVE',
        },
      }),
    ]);

    return {
      students,
      teachers,
      staff,
      classes,
      activeStudents,
      activeTeachers,
      activeStaff,
      totalUsers: students + teachers + staff,
      generatedAt: new Date().toISOString(),
    };
  }
}
