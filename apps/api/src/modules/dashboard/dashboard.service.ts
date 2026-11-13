import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

const ADMISSION_STATUSES = [
  'DRAFT',
  'SUBMITTED',
  'UNDER_REVIEW',
  'CHANGES_REQUESTED',
  'APPROVED',
  'REJECTED',
  'ENROLLED',
] as const;

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSchoolSummary(institutionId: string) {
    const institution = await this.prisma.institutions.findUnique({
      where: { id: institutionId },
      select: { id: true, name: true, type: true, status: true },
    });

    if (!institution) {
      throw new NotFoundException('Institution not found.');
    }

    const [
      classes,
      sections,
      subjects,
      enrolledStudents,
      teachers,
      staff,
      admissionGroups,
      recentAdmissions,
    ] = await Promise.all([
      this.prisma.classes.count({ where: { institutionId } }),
      this.prisma.sections.count({ where: { classes: { institutionId } } }),
      this.prisma.subjects.count({ where: { institutionId, isActive: true } }),
      this.prisma.student_enrollments.count({
        where: { classes: { institutionId } },
      }),
      this.prisma.users.count({
        where: { institutionId, role: 'TEACHER', status: 'ACTIVE' },
      }),
      this.prisma.users.count({
        where: { institutionId, role: 'STAFF', status: 'ACTIVE' },
      }),
      this.prisma.admissionApplication.groupBy({
        by: ['status'],
        where: { institutionId },
        _count: { _all: true },
      }),
      this.prisma.admissionApplication.findMany({
        where: { institutionId, status: { not: 'DRAFT' } },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          applicationNumber: true,
          firstName: true,
          lastName: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);

    const admissions: Record<string, number> = {};
    for (const status of ADMISSION_STATUSES) admissions[status] = 0;
    for (const row of admissionGroups) {
      admissions[row.status] = row._count._all;
    }

    return {
      institution: {
        name: institution.name,
        type: institution.type,
        status: institution.status,
      },
      counts: { classes, sections, subjects, enrolledStudents, teachers, staff },
      admissions,
      recentAdmissions,
    };
  }
}
