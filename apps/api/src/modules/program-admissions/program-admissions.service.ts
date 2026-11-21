import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { randomBytes, randomUUID } from 'node:crypto';
import { basename } from 'node:path';
import { Readable } from 'node:stream';

import { PrismaService } from '../../prisma/prisma.service';
import { ApplicationMailService } from '../email/application-mail.service';
import { validateDetails } from '../students/admission-profiles';
import { TeachersService } from '../users/teachers.service';
import {
  PROGRAM_DOCUMENT_TYPES,
  PROGRAM_PROFILES,
  type ProgramKind,
  missingProgramDocuments,
  profileForKind,
} from './program-admission-profiles';

export type ProgramApplicationInput = {
  targetId?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  dateOfBirth?: string;
  gender?: string;
  studentEmail?: string;
  phone?: string;
  fatherName?: string;
  motherName?: string;
  category?: string;
  nationality?: string;
  identityLast4?: string;
  address?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  details?: unknown;
  declarationAccepted?: boolean;
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_FILE_SIZE = 2 * 1024 * 1024;
const MAX_DOCUMENTS = 15;

const MIME_EXTENSIONS: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'application/pdf': '.pdf',
};

const OPEN_STATUSES = ['SUBMITTED', 'UNDER_REVIEW', 'CHANGES_REQUESTED'];

function clean(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;

  // eslint-disable-next-line no-control-regex
  const text = value.replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max);

  return text || null;
}

@Injectable()
export class ProgramAdmissionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly people: TeachersService,
    private readonly mail: ApplicationMailService,
  ) {}

  /* Coaching and institutes only. Anything else is refused. */
  async kindOf(institutionId: string): Promise<ProgramKind> {
    const institution = await this.prisma.institutions.findUnique({
      where: { id: institutionId },
      select: { type: true },
    });

    if (institution?.type !== 'COACHING' && institution?.type !== 'INSTITUTE') {
      throw new ForbiddenException(
        'This feature is only available for coaching and institutes.',
      );
    }

    return institution.type;
  }

  profile(kind: ProgramKind) {
    return profileForKind(kind);
  }

  allProfiles() {
    return PROGRAM_PROFILES;
  }

  async targets(institutionId: string, kind: ProgramKind) {
    if (kind === 'COACHING') {
      const batches = await this.prisma.batches.findMany({
        where: { institutionId, status: 'ACTIVE' },
        orderBy: { name: 'asc' },
        select: { id: true, name: true, code: true, schedule: true },
      });

      return batches.map((b) => ({
        id: b.id,
        name: b.name,
        code: b.code,
        detail: b.schedule,
      }));
    }

    const courses = await this.prisma.short_courses.findMany({
      where: { institutionId, isActive: true },
      orderBy: { title: 'asc' },
      select: { id: true, title: true, code: true, durationWeeks: true },
    });

    return courses.map((c) => ({
      id: c.id,
      name: c.title,
      code: c.code,
      detail: `${c.durationWeeks} weeks`,
    }));
  }

  private async targetName(institutionId: string, kind: string, targetId: string) {
    if (kind === 'COACHING') {
      const batch = await this.prisma.batches.findFirst({
        where: { id: targetId, institutionId },
        select: { name: true },
      });

      return batch?.name ?? 'Batch removed';
    }

    const course = await this.prisma.short_courses.findFirst({
      where: { id: targetId, institutionId },
      select: { title: true },
    });

    return course?.title ?? 'Course removed';
  }

  targetNameFor(institutionId: string, kind: string, targetId: string) {
    return this.targetName(institutionId, kind, targetId);
  }

  /* ---------- create ---------- */

  async create(institutionId: string, input: ProgramApplicationInput) {
    const kind = await this.kindOf(institutionId);

    const firstName = clean(input.firstName, 100);
    const phone = clean(input.phone, 20);
    const email = clean(input.studentEmail, 160)?.toLowerCase() ?? null;
    const targetId = clean(input.targetId, 80);

    if (!firstName) throw new BadRequestException('First name is required.');
    if (!phone || !/^[0-9+\-\s]{7,20}$/.test(phone)) {
      throw new BadRequestException('Enter a valid mobile number.');
    }
    if (!email || !EMAIL.test(email)) {
      throw new BadRequestException('A valid email address is required.');
    }
    if (!targetId) {
      throw new BadRequestException(
        kind === 'COACHING' ? 'Select a batch.' : 'Select a course.',
      );
    }
    if (input.declarationAccepted !== true) {
      throw new BadRequestException('Please accept the declaration.');
    }

    const targets = await this.targets(institutionId, kind);

    if (!targets.some((t) => t.id === targetId)) {
      throw new BadRequestException(
        kind === 'COACHING' ? 'Batch not found.' : 'Course not found.',
      );
    }

    let dateOfBirth: Date | null = null;

    if (input.dateOfBirth) {
      dateOfBirth = new Date(input.dateOfBirth);

      if (
        Number.isNaN(dateOfBirth.getTime()) ||
        dateOfBirth.getTime() > Date.now()
      ) {
        throw new BadRequestException('Enter a valid date of birth.');
      }
    }

    const gender = input.gender ? String(input.gender) : null;

    if (gender && !['MALE', 'FEMALE', 'OTHER'].includes(gender)) {
      throw new BadRequestException('Choose a valid gender.');
    }

    const identityLast4 = clean(input.identityLast4, 4);

    if (identityLast4 && !/^[0-9]{4}$/.test(identityLast4)) {
      throw new BadRequestException(
        'Aadhaar last 4 digits must be exactly 4 numbers.',
      );
    }

    const checked = validateDetails(profileForKind(kind), input.details);

    const existingUser = await this.prisma.users.findUnique({
      where: { email },
      select: { id: true },
    });

    const existingApplication = await this.prisma.program_applications.findFirst({
      where: {
        institutionId,
        studentEmail: email,
        targetId,
        status: { in: OPEN_STATUSES as never[] },
      },
      select: { id: true },
    });

    if (existingUser || existingApplication) {
      throw new ConflictException(
        'An application or account already exists for this email.',
      );
    }

    const applicationNumber = `${kind === 'COACHING' ? 'COA' : 'INS'}-${new Date().getFullYear()}-${randomBytes(5)
      .toString('hex')
      .toUpperCase()}`;

    const now = new Date();

    const application = await this.prisma.program_applications.create({
      data: {
        id: randomUUID(),
        applicationNumber,
        institutionId,
        kind,
        targetId,
        formProfile: kind,
        status: 'SUBMITTED',
        firstName,
        middleName: clean(input.middleName, 100),
        lastName: clean(input.lastName, 100),
        dateOfBirth,
        gender: gender as never,
        studentEmail: email,
        phone,
        fatherName: clean(input.fatherName, 120),
        motherName: clean(input.motherName, 120),
        category: clean(input.category, 40),
        nationality: clean(input.nationality, 40),
        identityLast4,
        address: clean(input.address, 300),
        city: clean(input.city, 80),
        state: clean(input.state, 80),
        pinCode: clean(input.pinCode, 10),
        details: checked.details as never,
        declarationAccepted: true,
        submittedAt: now,
        updatedAt: now,
      },
      select: { id: true, applicationNumber: true },
    });

    return { message: 'Application submitted.', application };
  }

  /* ---------- read ---------- */

  async list(
    institutionId: string,
    filters: { status?: string; targetId?: string; search?: string },
  ) {
    const kind = await this.kindOf(institutionId);
    const search = clean(filters.search, 60);

    const rows = await this.prisma.program_applications.findMany({
      where: {
        institutionId,
        ...(filters.status ? { status: filters.status as never } : {}),
        ...(filters.targetId ? { targetId: filters.targetId } : {}),
        ...(search
          ? {
              OR: [
                { firstName: { contains: search, mode: 'insensitive' as const } },
                { lastName: { contains: search, mode: 'insensitive' as const } },
                { applicationNumber: { contains: search, mode: 'insensitive' as const } },
                { phone: { contains: search } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: {
        id: true,
        applicationNumber: true,
        status: true,
        targetId: true,
        firstName: true,
        lastName: true,
        phone: true,
        submittedAt: true,
        _count: { select: { documents: true } },
      },
    });

    const targets = await this.targets(institutionId, kind);
    const names = new Map(targets.map((t) => [t.id, t.name]));

    return rows.map((row) => ({
      id: row.id,
      applicationNumber: row.applicationNumber,
      status: row.status,
      name: [row.firstName, row.lastName].filter(Boolean).join(' '),
      phone: row.phone,
      submittedAt: row.submittedAt,
      targetId: row.targetId,
      targetName: names.get(row.targetId) ?? '-',
      documentCount: row._count.documents,
    }));
  }

  async get(institutionId: string, id: string) {
    await this.kindOf(institutionId);

    const application = await this.prisma.program_applications.findFirst({
      where: { id, institutionId },
      include: {
        documents: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            type: true,
            originalName: true,
            mimeType: true,
            sizeBytes: true,
            verified: true,
            remarks: true,
            createdAt: true,
          },
        },
      },
    });

    if (!application) throw new NotFoundException('Application not found.');

    return {
      application: {
        ...application,
        targetName: await this.targetName(
          institutionId,
          application.kind,
          application.targetId,
        ),
      },
      missingRequired: missingProgramDocuments(
        application.kind,
        application.documents.map((doc) => doc.type),
      ),
    };
  }

  /* ---------- review ---------- */

  async review(
    institutionId: string,
    userId: string,
    id: string,
    body: { action?: string; note?: string },
  ) {
    const found = await this.get(institutionId, id);
    const application = found.application;
    const note = clean(body.note, 500);
    const action = String(body.action || '');
    const now = new Date();

    const update = async (data: Record<string, unknown>) => {
      const saved = await this.prisma.program_applications.update({
        where: { id },
        data: { ...data, reviewedAt: now, reviewedById: userId, updatedAt: now } as never,
        select: { id: true, status: true },
      });

      void this.mail.notify({
        institutionId,
        to: application.studentEmail,
        name: application.firstName,
        number: application.applicationNumber,
        status: String(data.status ?? saved.status),
        note: (data.rejectionReason ?? data.reviewNote ?? null) as string | null,
      });

      return saved;
    };

    const open = () => {
      if (!OPEN_STATUSES.includes(application.status)) {
        throw new BadRequestException('This application is already closed.');
      }
    };

    if (action === 'start_review') {
      if (application.status !== 'SUBMITTED') {
        throw new BadRequestException('Only a submitted application can be reviewed.');
      }

      return update({ status: 'UNDER_REVIEW' });
    }

    if (action === 'request_changes') {
      open();
      if (!note) throw new BadRequestException('Write what needs to change.');

      return update({ status: 'CHANGES_REQUESTED', reviewNote: note });
    }

    if (action === 'reject') {
      open();
      if (!note) throw new BadRequestException('Write the reason for rejection.');

      return update({ status: 'REJECTED', rejectionReason: note });
    }

    if (action === 'approve') {
      open();

      if (found.missingRequired.length > 0) {
        throw new BadRequestException(
          `Missing required documents: ${found.missingRequired.join(', ')}.`,
        );
      }

      if (application.documents.some((doc) => !doc.verified)) {
        throw new BadRequestException('Verify all uploaded documents first.');
      }

      return update({ status: 'APPROVED', reviewNote: note });
    }

    if (action === 'enroll') {
      if (application.status !== 'APPROVED') {
        throw new BadRequestException('Approve the application before enrolling.');
      }

      if (!application.studentEmail) {
        throw new BadRequestException('Student email is missing.');
      }

      // Check the seat before creating a login so nothing is left half done.
      if (application.kind === 'COACHING') {
        const batch = await this.prisma.batches.findFirst({
          where: { id: application.targetId, institutionId, status: 'ACTIVE' },
          select: { id: true, capacity: true },
        });

        if (!batch) throw new BadRequestException('The batch is no longer active.');

        const filled = await this.prisma.batch_students.count({
          where: { batchId: batch.id },
        });

        if (filled >= batch.capacity) {
          throw new ConflictException('This batch is full.');
        }
      } else {
        const course = await this.prisma.short_courses.findFirst({
          where: { id: application.targetId, institutionId, isActive: true },
          select: { id: true },
        });

        if (!course) throw new BadRequestException('The course is no longer active.');
      }

      const created = await this.people.create(
        institutionId,
        {
          firstName: application.firstName,
          lastName: application.lastName ?? undefined,
          email: application.studentEmail,
          phone: application.phone,
        },
        'STUDENT',
      );

      const studentId = created.teacher.id as string;

      if (application.kind === 'COACHING') {
        await this.prisma.batch_students.create({
          data: {
            id: randomUUID(),
            institutionId,
            batchId: application.targetId,
            studentId,
            updatedAt: now,
          },
        });
      } else {
        await this.prisma.course_enrollments.create({
          data: {
            id: randomUUID(),
            institutionId,
            courseId: application.targetId,
            studentId,
            updatedAt: now,
          },
        });
      }

      await update({ status: 'ENROLLED', approvedStudentId: studentId });

      return {
        message: 'Student enrolled. Share the login once.',
        status: 'ENROLLED',
        credentials: created.credentials,
      };
    }

    throw new BadRequestException('Unknown action.');
  }

  /* ---------- documents ---------- */

  private validateFile(file: any) {
    if (!file?.buffer || !Buffer.isBuffer(file.buffer)) {
      throw new BadRequestException('Please select a file.');
    }

    const buffer: Buffer = file.buffer;

    if (buffer.length === 0) throw new BadRequestException('The selected file is empty.');
    if (buffer.length > MAX_FILE_SIZE) {
      throw new BadRequestException('Maximum file size is 2 MB.');
    }

    const mime = file.mimetype;

    if (!MIME_EXTENSIONS[mime]) {
      throw new BadRequestException('Only JPG, PNG or PDF files are allowed.');
    }

    const ok =
      mime === 'application/pdf'
        ? buffer.subarray(0, 5).toString('ascii') === '%PDF-'
        : mime === 'image/jpeg'
          ? buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff
          : buffer
              .subarray(0, 8)
              .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));

    if (!ok) {
      throw new BadRequestException('The file content does not match its type.');
    }
  }

  async uploadDocument(
    institutionId: string,
    applicationId: string,
    type: string,
    file: any,
  ) {
    await this.kindOf(institutionId);

    if (!PROGRAM_DOCUMENT_TYPES.includes(type)) {
      throw new BadRequestException('Invalid document type.');
    }

    const application = await this.prisma.program_applications.findFirst({
      where: { id: applicationId, institutionId },
      select: { id: true, status: true, _count: { select: { documents: true } } },
    });

    if (!application) throw new NotFoundException('Application not found.');

    if (['APPROVED', 'ENROLLED', 'REJECTED'].includes(application.status)) {
      throw new ConflictException('This application is closed.');
    }

    if (application._count.documents >= MAX_DOCUMENTS) {
      throw new ConflictException('Document limit reached.');
    }

    this.validateFile(file);

    const originalName = basename(String(file.originalname || 'document'))
      .replace(/[^\w.\- ()]/g, '_')
      .slice(0, 180);

    const document = await this.prisma.program_application_documents.create({
      data: {
        id: randomUUID(),
        applicationId,
        type,
        originalName: originalName || 'document',
        mimeType: file.mimetype,
        sizeBytes: file.buffer.length,
        updatedAt: new Date(),
        file: { create: { data: new Uint8Array(file.buffer) } },
      },
      select: { id: true, type: true },
    });

    return { message: 'Document uploaded successfully.', document };
  }

  async verifyDocument(
    institutionId: string,
    applicationId: string,
    documentId: string,
    verified: boolean,
    remarks?: string,
  ) {
    await this.kindOf(institutionId);

    const document = await this.prisma.program_application_documents.findFirst({
      where: { id: documentId, applicationId, application: { institutionId } },
      select: { id: true },
    });

    if (!document) throw new NotFoundException('Document not found.');

    const now = new Date();

    await this.prisma.program_application_documents.update({
      where: { id: documentId },
      data: {
        verified: verified === true,
        verifiedAt: verified === true ? now : null,
        remarks: clean(remarks, 300),
        updatedAt: now,
      },
    });

    return { message: verified ? 'Document verified.' : 'Verification removed.' };
  }

  async getFile(institutionId: string, applicationId: string, documentId: string) {
    await this.kindOf(institutionId);

    const document = await this.prisma.program_application_documents.findFirst({
      where: { id: documentId, applicationId, application: { institutionId } },
      select: { mimeType: true, file: { select: { data: true } } },
    });

    if (!document?.file) throw new NotFoundException('File not found.');

    return {
      mimeType: document.mimeType,
      stream: Readable.from([Buffer.from(document.file.data)]),
    };
  }
}
