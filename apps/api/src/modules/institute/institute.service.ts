import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes, randomUUID } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';

export type CourseInput = {
  title?: string;
  code?: string;
  durationWeeks?: number | string;
  description?: string;
  isActive?: boolean;
};

export type EnrollInput = { courseId?: string; studentId?: string };

export type UpdateEnrollmentInput = { status?: string; grade?: string };

const isDuplicate = (error: unknown) =>
  (error as { code?: string })?.code === 'P2002';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I

function newCertificateNo() {
  const bytes = randomBytes(12);
  const chars = Array.from(bytes, (byte) => ALPHABET[byte % ALPHABET.length]);

  return `BRX-${chars.slice(0, 4).join('')}-${chars.slice(4, 8).join('')}-${chars
    .slice(8, 12)
    .join('')}`;
}

@Injectable()
export class InstituteService {
  constructor(private readonly prisma: PrismaService) {}

  /** Institute tools exist only for institutes. */
  async assertInstitute(institutionId: string) {
    const institution = await this.prisma.institutions.findUnique({
      where: { id: institutionId },
      select: { type: true },
    });

    if (!institution || institution.type !== 'INSTITUTE') {
      throw new ForbiddenException(
        'This feature is only available for institutes.',
      );
    }
  }

  private name(first: string, last: string | null) {
    return [first, last].filter(Boolean).join(' ');
  }

  private text(value: string | undefined, max: number, label: string) {
    const cleaned = value?.trim() || null;

    if (cleaned && cleaned.length > max) {
      throw new BadRequestException(`${label} is too long.`);
    }

    return cleaned;
  }

  private weeks(value: number | string | undefined) {
    const weeks = Number(value);

    if (!Number.isInteger(weeks) || weeks < 1 || weeks > 208) {
      throw new BadRequestException(
        'Duration must be a whole number of weeks from 1 to 208.',
      );
    }

    return weeks;
  }

  /* ------------------------------- summary ------------------------------- */

  async summary(institutionId: string) {
    await this.assertInstitute(institutionId);

    const [activeCourses, groups, certificates, recent] = await Promise.all([
      this.prisma.short_courses.count({ where: { institutionId, isActive: true } }),
      this.prisma.course_enrollments.groupBy({
        by: ['status'],
        where: { institutionId },
        _count: { _all: true },
      }),
      this.prisma.certificates.count({ where: { institutionId } }),
      this.prisma.certificates.findMany({
        where: { institutionId },
        orderBy: { issuedOn: 'desc' },
        take: 5,
        select: {
          certificateNo: true,
          issuedOn: true,
          enrollment: {
            select: {
              course: { select: { title: true } },
              student: { select: { firstName: true, lastName: true } },
            },
          },
        },
      }),
    ]);

    const count = (status: string) =>
      groups.find((row) => row.status === status)?._count._all ?? 0;

    return {
      counts: {
        activeCourses,
        enrolled: count('ENROLLED'),
        completed: count('COMPLETED'),
        certificates,
      },
      recentCertificates: recent.map((row) => ({
        certificateNo: row.certificateNo,
        issuedOn: row.issuedOn,
        course: row.enrollment.course.title,
        student: this.name(
          row.enrollment.student.firstName,
          row.enrollment.student.lastName,
        ),
      })),
    };
  }

  async peopleOptions(institutionId: string) {
    await this.assertInstitute(institutionId);

    const students = await this.prisma.users.findMany({
      where: { institutionId, role: 'STUDENT', status: 'ACTIVE' },
      orderBy: { firstName: 'asc' },
      select: { id: true, firstName: true, lastName: true, brxUid: true },
    });

    return {
      students: students.map((student) => ({
        id: student.id,
        name: this.name(student.firstName, student.lastName),
        brxUid: student.brxUid,
      })),
    };
  }

  /* -------------------------------- courses -------------------------------- */

  async listCourses(institutionId: string) {
    await this.assertInstitute(institutionId);

    const rows = await this.prisma.short_courses.findMany({
      where: { institutionId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        code: true,
        durationWeeks: true,
        description: true,
        isActive: true,
        enrollments: { select: { status: true } },
      },
    });

    return rows.map(({ enrollments, ...course }) => ({
      ...course,
      enrolled: enrollments.filter((item) => item.status === 'ENROLLED').length,
      completed: enrollments.filter((item) => item.status === 'COMPLETED').length,
    }));
  }

  async createCourse(institutionId: string, input: CourseInput) {
    await this.assertInstitute(institutionId);

    const title = this.text(input.title, 160, 'Course title');

    if (!title) throw new BadRequestException('Course title is required.');

    const code = (this.text(input.code, 30, 'Course code') ?? title)
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 30);

    try {
      const created = await this.prisma.short_courses.create({
        data: {
          id: randomUUID(),
          institutionId,
          title,
          code,
          durationWeeks: this.weeks(input.durationWeeks),
          description: this.text(input.description, 500, 'Description'),
          updatedAt: new Date(),
        },
        select: { id: true },
      });

      return { success: true, id: created.id };
    } catch (error) {
      if (isDuplicate(error)) {
        throw new ConflictException('A course with this code already exists.');
      }

      throw error;
    }
  }

  async updateCourse(institutionId: string, id: string, input: CourseInput) {
    await this.assertInstitute(institutionId);

    const existing = await this.prisma.short_courses.findFirst({
      where: { id, institutionId },
      select: { id: true },
    });

    if (!existing) throw new NotFoundException('Course not found.');

    const data: {
      title?: string;
      durationWeeks?: number;
      description?: string | null;
      isActive?: boolean;
      updatedAt: Date;
    } = { updatedAt: new Date() };

    if (input.title !== undefined) {
      const title = this.text(input.title, 160, 'Course title');

      if (!title) throw new BadRequestException('Course title is required.');

      data.title = title;
    }

    if (input.durationWeeks !== undefined) {
      data.durationWeeks = this.weeks(input.durationWeeks);
    }

    if (input.description !== undefined) {
      data.description = this.text(input.description, 500, 'Description');
    }

    if (input.isActive !== undefined) data.isActive = Boolean(input.isActive);

    await this.prisma.short_courses.update({ where: { id }, data });

    return { success: true, id };
  }

  /* ------------------------------ enrollments ------------------------------ */

  async listEnrollments(institutionId: string, courseId?: string) {
    await this.assertInstitute(institutionId);

    const rows = await this.prisma.course_enrollments.findMany({
      where: { institutionId, ...(courseId ? { courseId } : {}) },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        courseId: true,
        status: true,
        startedOn: true,
        completedOn: true,
        grade: true,
        course: { select: { title: true } },
        student: {
          select: { firstName: true, lastName: true, brxUid: true },
        },
        certificate: { select: { certificateNo: true } },
      },
    });

    return rows.map((row) => ({
      id: row.id,
      courseId: row.courseId,
      courseTitle: row.course.title,
      studentName: this.name(row.student.firstName, row.student.lastName),
      brxUid: row.student.brxUid,
      status: row.status,
      startedOn: row.startedOn,
      completedOn: row.completedOn,
      grade: row.grade,
      certificateNo: row.certificate?.certificateNo ?? null,
    }));
  }

  async enroll(institutionId: string, input: EnrollInput) {
    await this.assertInstitute(institutionId);

    const [course, student] = await Promise.all([
      input.courseId
        ? this.prisma.short_courses.findFirst({
            where: { id: input.courseId, institutionId, isActive: true },
            select: { id: true },
          })
        : null,
      input.studentId
        ? this.prisma.users.findFirst({
            where: {
              id: input.studentId,
              institutionId,
              role: 'STUDENT',
              status: 'ACTIVE',
            },
            select: { id: true },
          })
        : null,
    ]);

    if (!course) throw new BadRequestException('Please choose an active course.');
    if (!student) throw new BadRequestException('Please choose a student.');

    try {
      await this.prisma.course_enrollments.create({
        data: {
          id: randomUUID(),
          institutionId,
          courseId: course.id,
          studentId: student.id,
          updatedAt: new Date(),
        },
      });

      return { success: true };
    } catch (error) {
      if (isDuplicate(error)) {
        throw new ConflictException('This student is already in this course.');
      }

      throw error;
    }
  }

  async updateEnrollment(
    institutionId: string,
    id: string,
    input: UpdateEnrollmentInput,
  ) {
    await this.assertInstitute(institutionId);

    const existing = await this.prisma.course_enrollments.findFirst({
      where: { id, institutionId },
      select: { id: true, status: true, certificate: { select: { id: true } } },
    });

    if (!existing) throw new NotFoundException('Enrollment not found.');

    const data: {
      status?: 'ENROLLED' | 'COMPLETED' | 'DROPPED';
      completedOn?: Date | null;
      grade?: string | null;
      updatedAt: Date;
    } = { updatedAt: new Date() };

    if (input.status !== undefined) {
      if (!['ENROLLED', 'COMPLETED', 'DROPPED'].includes(input.status)) {
        throw new BadRequestException('Invalid status.');
      }

      if (existing.certificate && input.status !== 'COMPLETED') {
        throw new BadRequestException(
          'A certificate was already issued, so this cannot be changed.',
        );
      }

      data.status = input.status as 'ENROLLED' | 'COMPLETED' | 'DROPPED';
      data.completedOn = input.status === 'COMPLETED' ? new Date() : null;
    }

    if (input.grade !== undefined) {
      data.grade = this.text(input.grade, 20, 'Grade');
    }

    await this.prisma.course_enrollments.update({ where: { id }, data });

    return { success: true, id };
  }

  /* ------------------------------ certificates ------------------------------ */

  async listCertificates(institutionId: string) {
    await this.assertInstitute(institutionId);

    const rows = await this.prisma.certificates.findMany({
      where: { institutionId },
      orderBy: { issuedOn: 'desc' },
      select: {
        certificateNo: true,
        issuedOn: true,
        enrollment: {
          select: {
            grade: true,
            course: { select: { title: true } },
            student: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    return rows.map((row) => ({
      certificateNo: row.certificateNo,
      issuedOn: row.issuedOn,
      grade: row.enrollment.grade,
      course: row.enrollment.course.title,
      student: this.name(
        row.enrollment.student.firstName,
        row.enrollment.student.lastName,
      ),
    }));
  }

  async issueCertificate(
    institutionId: string,
    issuedBy: string,
    enrollmentId: string,
  ) {
    await this.assertInstitute(institutionId);

    const enrollment = await this.prisma.course_enrollments.findFirst({
      where: { id: enrollmentId, institutionId },
      select: { id: true, status: true, certificate: { select: { id: true } } },
    });

    if (!enrollment) throw new NotFoundException('Enrollment not found.');

    if (enrollment.status !== 'COMPLETED') {
      throw new BadRequestException(
        'A certificate can be issued only after the course is completed.',
      );
    }

    if (enrollment.certificate) {
      throw new ConflictException('A certificate was already issued.');
    }

    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        const created = await this.prisma.certificates.create({
          data: {
            id: randomUUID(),
            institutionId,
            enrollmentId: enrollment.id,
            certificateNo: newCertificateNo(),
            issuedBy,
          },
          select: { certificateNo: true },
        });

        return { success: true, certificateNo: created.certificateNo };
      } catch (error) {
        if (!isDuplicate(error)) throw error;

        const already = await this.prisma.certificates.findUnique({
          where: { enrollmentId: enrollment.id },
          select: { certificateNo: true },
        });

        if (already) {
          throw new ConflictException('A certificate was already issued.');
        }
      }
    }

    throw new ConflictException('Could not create a certificate. Please try again.');
  }

  /** Public: only name, course, grade and dates. No contact details. */
  async verifyCertificate(number: string) {
    const cleaned = (number ?? '').trim().toUpperCase();

    if (!/^BRX-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(cleaned)) {
      throw new NotFoundException('Certificate not found.');
    }

    const certificate = await this.prisma.certificates.findUnique({
      where: { certificateNo: cleaned },
      select: {
        certificateNo: true,
        issuedOn: true,
        institutions: { select: { name: true } },
        enrollment: {
          select: {
            grade: true,
            startedOn: true,
            completedOn: true,
            course: { select: { title: true, durationWeeks: true } },
            student: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    if (!certificate) throw new NotFoundException('Certificate not found.');

    return {
      valid: true,
      certificateNo: certificate.certificateNo,
      issuedOn: certificate.issuedOn,
      institution: certificate.institutions.name,
      student: this.name(
        certificate.enrollment.student.firstName,
        certificate.enrollment.student.lastName,
      ),
      course: certificate.enrollment.course.title,
      durationWeeks: certificate.enrollment.course.durationWeeks,
      grade: certificate.enrollment.grade,
      startedOn: certificate.enrollment.startedOn,
      completedOn: certificate.enrollment.completedOn,
    };
  }
}
