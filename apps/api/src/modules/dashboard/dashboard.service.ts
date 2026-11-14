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

  // What a signed-in person sees on their own home page. Everything is
  // scoped to their own id and institution; nothing is guessed or faked.
  async getMySummary(user: {
    id: string;
    institutionId: string | null;
    role: string;
  }) {
    if (!user.institutionId) {
      throw new NotFoundException('Your account is not linked to an institution.');
    }

    const institutionId = user.institutionId;

    const [institution, me] = await Promise.all([
      this.prisma.institutions.findUnique({
        where: { id: institutionId },
        select: { name: true, type: true },
      }),
      this.prisma.users.findUnique({
        where: { id: user.id },
        select: {
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          brxUid: true,
        },
      }),
    ]);

    if (!institution || !me) {
      throw new NotFoundException('Account not found.');
    }

    const fullName = (first: string, last: string | null) =>
      [first, last].filter(Boolean).join(' ');

    const base = {
      role: user.role,
      institution,
      profile: {
        name: fullName(me.firstName, me.lastName),
        email: me.email,
        phone: me.phone,
        eduNexaId: me.brxUid,
      },
    };

    if (user.role === 'STUDENT') {
      const [enrollment, links] = await Promise.all([
        this.prisma.student_enrollments.findFirst({
          where: { studentId: user.id },
          orderBy: { createdAt: 'desc' },
          select: {
            classes: { select: { name: true } },
            sections: { select: { name: true } },
          },
        }),
        this.prisma.parent_students.findMany({
          where: { studentId: user.id, institutionId },
          select: {
            relation: true,
            parent: { select: { firstName: true, lastName: true } },
          },
        }),
      ]);

      return {
        ...base,
        student: {
          className: enrollment?.classes.name ?? null,
          sectionName: enrollment?.sections.name ?? null,
          guardians: links.map((link) => ({
            name: fullName(link.parent.firstName, link.parent.lastName),
            relation: link.relation,
          })),
        },
      };
    }

    if (user.role === 'TEACHER') {
      const assignments = await this.prisma.subject_teachers.findMany({
        where: { teacherId: user.id, institutionId },
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          weeklyPeriods: true,
          subjects: { select: { name: true, code: true } },
          classes: { select: { name: true } },
          sections: { select: { name: true } },
        },
      });

      return {
        ...base,
        teacher: {
          assignments: assignments.map((item) => ({
            id: item.id,
            subject: item.subjects.name,
            subjectCode: item.subjects.code,
            className: item.classes.name,
            sectionName: item.sections?.name ?? null,
            weeklyPeriods: item.weeklyPeriods,
          })),
        },
      };
    }

    if (user.role === 'PARENT') {
      const links = await this.prisma.parent_students.findMany({
        where: { parentId: user.id, institutionId },
        select: {
          relation: true,
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              brxUid: true,
              student_enrollments: {
                take: 1,
                orderBy: { createdAt: 'desc' },
                select: {
                  classes: { select: { name: true } },
                  sections: { select: { name: true } },
                },
              },
            },
          },
        },
      });

      return {
        ...base,
        parent: {
          children: links.map((link) => {
            const enrollment = link.student.student_enrollments[0];

            return {
              id: link.student.id,
              name: fullName(link.student.firstName, link.student.lastName),
              eduNexaId: link.student.brxUid,
              relation: link.relation,
              className: enrollment?.classes.name ?? null,
              sectionName: enrollment?.sections.name ?? null,
            };
          }),
        },
      };
    }

    return base;
  }
}
