import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';

export type BatchInput = {
  name?: string;
  code?: string;
  schedule?: string;
  description?: string;
  capacity?: number | string;
  startDate?: string | null;
  endDate?: string | null;
  status?: string;
};

export type EnquiryInput = {
  name?: string;
  phone?: string;
  email?: string;
  interest?: string;
  source?: string;
  note?: string;
  status?: string;
  followUpOn?: string | null;
};

const BATCH_STATUSES = ['ACTIVE', 'COMPLETED', 'ARCHIVED'] as const;
const ENQUIRY_STATUSES = ['NEW', 'CONTACTED', 'JOINED', 'LOST'] as const;
const PHONE_PATTERN = /^[0-9+\-\s]{7,15}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type BatchStatus = (typeof BATCH_STATUSES)[number];
type EnquiryStatus = (typeof ENQUIRY_STATUSES)[number];

@Injectable()
export class CoachingService {
  constructor(private readonly prisma: PrismaService) {}

  /** Coaching tools exist only for coaching institutions. */
  async assertCoaching(institutionId: string) {
    const institution = await this.prisma.institutions.findUnique({
      where: { id: institutionId },
      select: { type: true },
    });

    if (!institution || institution.type !== 'COACHING') {
      throw new ForbiddenException(
        'This feature is only available for coaching institutions.',
      );
    }
  }

  private text(value: string | null | undefined, max: number, label: string) {
    const cleaned = value?.trim() || null;

    if (cleaned && cleaned.length > max) {
      throw new BadRequestException(`${label} is too long.`);
    }

    return cleaned;
  }

  private date(value: string | null | undefined, label: string) {
    if (value === undefined) return undefined;
    if (value === null || value === '') return null;

    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException(`${label} is not a valid date.`);
    }

    return parsed;
  }

  private personName(first: string, last: string | null) {
    return [first, last].filter(Boolean).join(' ');
  }

  /* ------------------------------ summary ------------------------------ */

  async summary(institutionId: string) {
    await this.assertCoaching(institutionId);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const [
      batchGroups,
      studentRows,
      teachers,
      enquiryGroups,
      followUpsDue,
      recentEnquiries,
    ] = await Promise.all([
      this.prisma.batches.groupBy({
        by: ['status'],
        where: { institutionId },
        _count: { _all: true },
      }),
      this.prisma.batch_students.findMany({
        where: { institutionId, batch: { status: 'ACTIVE' } },
        distinct: ['studentId'],
        select: { studentId: true },
      }),
      this.prisma.users.count({
        where: { institutionId, role: 'TEACHER', status: 'ACTIVE' },
      }),
      this.prisma.enquiries.groupBy({
        by: ['status'],
        where: { institutionId },
        _count: { _all: true },
      }),
      this.prisma.enquiries.count({
        where: {
          institutionId,
          status: { in: ['NEW', 'CONTACTED'] },
          followUpOn: { lte: endOfToday },
        },
      }),
      this.prisma.enquiries.findMany({
        where: { institutionId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          name: true,
          phone: true,
          interest: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);

    const batches: Record<string, number> = {};
    for (const status of BATCH_STATUSES) batches[status] = 0;
    for (const row of batchGroups) batches[row.status] = row._count._all;

    const enquiries: Record<string, number> = {};
    for (const status of ENQUIRY_STATUSES) enquiries[status] = 0;
    for (const row of enquiryGroups) enquiries[row.status] = row._count._all;

    return {
      counts: {
        activeBatches: batches.ACTIVE,
        studentsInBatches: studentRows.length,
        teachers,
        openEnquiries: enquiries.NEW + enquiries.CONTACTED,
        followUpsDue,
      },
      batches,
      enquiries,
      recentEnquiries,
    };
  }

  /* ------------------------------ batches ------------------------------ */

  private batchSelect = {
    id: true,
    name: true,
    code: true,
    schedule: true,
    description: true,
    capacity: true,
    startDate: true,
    endDate: true,
    status: true,
    students: { select: { studentId: true } },
    teachers: {
      select: {
        teacher: { select: { id: true, firstName: true, lastName: true } },
      },
    },
  } as const;

  private shapeBatch(batch: {
    id: string;
    name: string;
    code: string;
    schedule: string | null;
    description: string | null;
    capacity: number;
    startDate: Date | null;
    endDate: Date | null;
    status: string;
    students: { studentId: string }[];
    teachers: {
      teacher: { id: string; firstName: string; lastName: string | null };
    }[];
  }) {
    const { students, teachers, ...rest } = batch;

    return {
      ...rest,
      studentCount: students.length,
      studentIds: students.map((item) => item.studentId),
      teacherIds: teachers.map((item) => item.teacher.id),
      teacherNames: teachers.map((item) =>
        this.personName(item.teacher.firstName, item.teacher.lastName),
      ),
    };
  }

  async listBatches(institutionId: string) {
    await this.assertCoaching(institutionId);

    const batches = await this.prisma.batches.findMany({
      where: { institutionId },
      orderBy: { createdAt: 'desc' },
      select: this.batchSelect,
    });

    return batches.map((batch) => this.shapeBatch(batch));
  }

  private codeFrom(name: string) {
    return name
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 24);
  }

  private parseCapacity(value: number | string | undefined) {
    if (value === undefined || value === '') return undefined;

    const capacity = Number(value);

    if (!Number.isInteger(capacity) || capacity < 1 || capacity > 5000) {
      throw new BadRequestException('Capacity must be between 1 and 5000.');
    }

    return capacity;
  }

  async createBatch(institutionId: string, input: BatchInput) {
    await this.assertCoaching(institutionId);

    const name = this.text(input.name, 120, 'Batch name');

    if (!name) {
      throw new BadRequestException('Batch name is required.');
    }

    const code = (
      this.text(input.code, 30, 'Batch code') ?? this.codeFrom(name)
    ).toUpperCase();

    if (!code) {
      throw new BadRequestException('Batch code is required.');
    }

    const startDate = this.date(input.startDate, 'Start date');
    const endDate = this.date(input.endDate, 'End date');

    if (startDate && endDate && endDate < startDate) {
      throw new BadRequestException('End date cannot be before start date.');
    }

    try {
      const batch = await this.prisma.batches.create({
        data: {
          id: randomUUID(),
          institutionId,
          name,
          code,
          schedule: this.text(input.schedule, 160, 'Schedule'),
          description: this.text(input.description, 500, 'Description'),
          capacity: this.parseCapacity(input.capacity) ?? 30,
          startDate: startDate ?? null,
          endDate: endDate ?? null,
          updatedAt: new Date(),
        },
        select: this.batchSelect,
      });

      return { success: true, batch: this.shapeBatch(batch) };
    } catch (error) {
      if ((error as { code?: string })?.code === 'P2002') {
        throw new ConflictException('A batch with this code already exists.');
      }

      throw error;
    }
  }

  private async findBatch(institutionId: string, id: string) {
    const batch = await this.prisma.batches.findFirst({
      where: { id, institutionId },
      select: { id: true, capacity: true },
    });

    if (!batch) {
      throw new NotFoundException('Batch not found.');
    }

    return batch;
  }

  async updateBatch(institutionId: string, id: string, input: BatchInput) {
    await this.assertCoaching(institutionId);
    const existing = await this.findBatch(institutionId, id);

    const data: {
      name?: string;
      schedule?: string | null;
      description?: string | null;
      capacity?: number;
      startDate?: Date | null;
      endDate?: Date | null;
      status?: BatchStatus;
      updatedAt: Date;
    } = { updatedAt: new Date() };

    if (input.name !== undefined) {
      const name = this.text(input.name, 120, 'Batch name');
      if (!name) throw new BadRequestException('Batch name is required.');
      data.name = name;
    }

    if (input.schedule !== undefined) {
      data.schedule = this.text(input.schedule, 160, 'Schedule');
    }

    if (input.description !== undefined) {
      data.description = this.text(input.description, 500, 'Description');
    }

    const capacity = this.parseCapacity(input.capacity);

    if (capacity !== undefined) {
      const enrolled = await this.prisma.batch_students.count({
        where: { batchId: id },
      });

      if (capacity < enrolled) {
        throw new BadRequestException(
          `Capacity cannot be lower than the ${enrolled} students already in this batch.`,
        );
      }

      data.capacity = capacity;
    } else {
      void existing;
    }

    const startDate = this.date(input.startDate, 'Start date');
    const endDate = this.date(input.endDate, 'End date');

    if (startDate !== undefined) data.startDate = startDate;
    if (endDate !== undefined) data.endDate = endDate;

    if (input.status !== undefined) {
      if (!(BATCH_STATUSES as readonly string[]).includes(input.status)) {
        throw new BadRequestException('Invalid batch status.');
      }
      data.status = input.status as BatchStatus;
    }

    const batch = await this.prisma.batches.update({
      where: { id },
      data,
      select: this.batchSelect,
    });

    return { success: true, batch: this.shapeBatch(batch) };
  }

  async setBatchMembers(
    institutionId: string,
    id: string,
    input: { studentIds?: string[]; teacherIds?: string[] },
  ) {
    await this.assertCoaching(institutionId);
    const batch = await this.findBatch(institutionId, id);

    const studentIds = [...new Set(input.studentIds ?? [])];
    const teacherIds = [...new Set(input.teacherIds ?? [])];

    if (studentIds.length > batch.capacity) {
      throw new BadRequestException(
        `This batch can hold only ${batch.capacity} students.`,
      );
    }

    const [studentCount, teacherCount] = await Promise.all([
      this.prisma.users.count({
        where: {
          id: { in: studentIds },
          institutionId,
          role: 'STUDENT',
          status: { not: 'DELETED' },
        },
      }),
      this.prisma.users.count({
        where: {
          id: { in: teacherIds },
          institutionId,
          role: 'TEACHER',
          status: { not: 'DELETED' },
        },
      }),
    ]);

    if (studentCount !== studentIds.length || teacherCount !== teacherIds.length) {
      throw new BadRequestException('Some selected people were not found.');
    }

    const [currentStudents, currentTeachers] = await Promise.all([
      this.prisma.batch_students.findMany({
        where: { batchId: id },
        select: { studentId: true },
      }),
      this.prisma.batch_teachers.findMany({
        where: { batchId: id },
        select: { teacherId: true },
      }),
    ]);

    const hadStudents = new Set(currentStudents.map((row) => row.studentId));
    const hadTeachers = new Set(currentTeachers.map((row) => row.teacherId));
    const now = new Date();

    await this.prisma.$transaction([
      this.prisma.batch_students.deleteMany({
        where: { batchId: id, studentId: { notIn: studentIds } },
      }),
      this.prisma.batch_students.createMany({
        data: studentIds
          .filter((studentId) => !hadStudents.has(studentId))
          .map((studentId) => ({
            id: randomUUID(),
            institutionId,
            batchId: id,
            studentId,
            updatedAt: now,
          })),
      }),
      this.prisma.batch_teachers.deleteMany({
        where: { batchId: id, teacherId: { notIn: teacherIds } },
      }),
      this.prisma.batch_teachers.createMany({
        data: teacherIds
          .filter((teacherId) => !hadTeachers.has(teacherId))
          .map((teacherId) => ({
            id: randomUUID(),
            institutionId,
            batchId: id,
            teacherId,
            updatedAt: now,
          })),
      }),
    ]);

    return {
      success: true,
      students: studentIds.length,
      teachers: teacherIds.length,
    };
  }

  async peopleOptions(institutionId: string) {
    await this.assertCoaching(institutionId);

    const [students, teachers] = await Promise.all([
      this.prisma.users.findMany({
        where: { institutionId, role: 'STUDENT', status: 'ACTIVE' },
        orderBy: { firstName: 'asc' },
        select: { id: true, firstName: true, lastName: true, brxUid: true },
      }),
      this.prisma.users.findMany({
        where: { institutionId, role: 'TEACHER', status: 'ACTIVE' },
        orderBy: { firstName: 'asc' },
        select: { id: true, firstName: true, lastName: true, brxUid: true },
      }),
    ]);

    const shape = (list: typeof students) =>
      list.map((person) => ({
        id: person.id,
        name: this.personName(person.firstName, person.lastName),
        brxUid: person.brxUid,
      }));

    return { students: shape(students), teachers: shape(teachers) };
  }

  /* ----------------------------- enquiries ----------------------------- */

  private enquirySelect = {
    id: true,
    name: true,
    phone: true,
    email: true,
    interest: true,
    source: true,
    note: true,
    status: true,
    followUpOn: true,
    createdAt: true,
  } as const;

  async listEnquiries(institutionId: string) {
    await this.assertCoaching(institutionId);

    return this.prisma.enquiries.findMany({
      where: { institutionId },
      orderBy: { createdAt: 'desc' },
      take: 500,
      select: this.enquirySelect,
    });
  }

  private checkContact(phone: string | null, email: string | null) {
    if (phone && !PHONE_PATTERN.test(phone)) {
      throw new BadRequestException('Enter a valid phone number.');
    }

    if (email && !EMAIL_PATTERN.test(email)) {
      throw new BadRequestException('Enter a valid email address.');
    }
  }

  async createEnquiry(institutionId: string, input: EnquiryInput) {
    await this.assertCoaching(institutionId);

    const name = this.text(input.name, 120, 'Name');
    const phone = this.text(input.phone, 20, 'Phone');
    const email = this.text(input.email, 254, 'Email')?.toLowerCase() ?? null;

    if (!name || !phone) {
      throw new BadRequestException('Name and phone are required.');
    }

    this.checkContact(phone, email);

    const enquiry = await this.prisma.enquiries.create({
      data: {
        id: randomUUID(),
        institutionId,
        name,
        phone,
        email,
        interest: this.text(input.interest, 160, 'Interest'),
        source: this.text(input.source, 60, 'Source'),
        note: this.text(input.note, 1000, 'Note'),
        followUpOn: this.date(input.followUpOn, 'Follow-up date') ?? null,
        updatedAt: new Date(),
      },
      select: this.enquirySelect,
    });

    return { success: true, enquiry };
  }

  async updateEnquiry(institutionId: string, id: string, input: EnquiryInput) {
    await this.assertCoaching(institutionId);

    const existing = await this.prisma.enquiries.findFirst({
      where: { id, institutionId },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Enquiry not found.');
    }

    const data: {
      name?: string;
      phone?: string;
      email?: string | null;
      interest?: string | null;
      source?: string | null;
      note?: string | null;
      status?: EnquiryStatus;
      followUpOn?: Date | null;
      updatedAt: Date;
    } = { updatedAt: new Date() };

    if (input.name !== undefined) {
      const name = this.text(input.name, 120, 'Name');
      if (!name) throw new BadRequestException('Name is required.');
      data.name = name;
    }

    if (input.phone !== undefined) {
      const phone = this.text(input.phone, 20, 'Phone');
      if (!phone) throw new BadRequestException('Phone is required.');
      this.checkContact(phone, null);
      data.phone = phone;
    }

    if (input.email !== undefined) {
      const email = this.text(input.email, 254, 'Email')?.toLowerCase() ?? null;
      this.checkContact(null, email);
      data.email = email;
    }

    if (input.interest !== undefined) {
      data.interest = this.text(input.interest, 160, 'Interest');
    }

    if (input.source !== undefined) {
      data.source = this.text(input.source, 60, 'Source');
    }

    if (input.note !== undefined) {
      data.note = this.text(input.note, 1000, 'Note');
    }

    const followUpOn = this.date(input.followUpOn, 'Follow-up date');
    if (followUpOn !== undefined) data.followUpOn = followUpOn;

    if (input.status !== undefined) {
      if (!(ENQUIRY_STATUSES as readonly string[]).includes(input.status)) {
        throw new BadRequestException('Invalid enquiry status.');
      }
      data.status = input.status as EnquiryStatus;
    }

    const enquiry = await this.prisma.enquiries.update({
      where: { id },
      data,
      select: this.enquirySelect,
    });

    return { success: true, enquiry };
  }
}
