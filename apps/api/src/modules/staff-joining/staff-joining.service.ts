import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { randomBytes, randomUUID } from 'node:crypto';
import { basename } from 'node:path';
import { Readable } from 'node:stream';

import { PrismaService } from '../../prisma/prisma.service';
import { validateDetails } from '../students/admission-profiles';
import { TeachersService } from '../users/teachers.service';
import {
  JOIN_DOCUMENT_TYPES,
  JOIN_PROFILES,
  JOIN_ROLES,
  type JoinRole,
  missingJoinDocuments,
  profileForRole,
} from './staff-joining-profiles';

export type StaffApplicationInput = {
  role?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  dateOfBirth?: string;
  gender?: string;
  email?: string;
  phone?: string;
  fatherName?: string;
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
export class StaffJoiningService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly people: TeachersService,
  ) {}

  profiles() {
    return JOIN_PROFILES;
  }

  private role(value: unknown): JoinRole {
    const role = String(value || '');

    if (!JOIN_ROLES.includes(role as JoinRole)) {
      throw new BadRequestException('Choose Teacher, Staff or Security Guard.');
    }

    return role as JoinRole;
  }

  /* ---------- create ---------- */

  async create(institutionId: string, input: StaffApplicationInput) {
    const role = this.role(input.role);

    const firstName = clean(input.firstName, 100);
    const phone = clean(input.phone, 20);
    const email = clean(input.email, 160)?.toLowerCase() ?? null;

    if (!firstName) throw new BadRequestException('First name is required.');
    if (!phone || !/^[0-9+\-\s]{7,20}$/.test(phone)) {
      throw new BadRequestException('Enter a valid mobile number.');
    }
    if (!email || !EMAIL.test(email)) {
      throw new BadRequestException('A valid email address is required.');
    }
    if (input.declarationAccepted !== true) {
      throw new BadRequestException('Please accept the declaration.');
    }

    let dateOfBirth: Date | null = null;

    if (input.dateOfBirth) {
      dateOfBirth = new Date(input.dateOfBirth);

      const age =
        (Date.now() - dateOfBirth.getTime()) / (365.25 * 24 * 3600 * 1000);

      if (Number.isNaN(dateOfBirth.getTime()) || age < 16 || age > 80) {
        throw new BadRequestException('Enter a valid date of birth (age 16 to 80).');
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

    const checked = validateDetails(profileForRole(role), input.details);

    const existingUser = await this.prisma.users.findUnique({
      where: { email },
      select: { id: true },
    });

    const existingApplication = await this.prisma.staff_applications.findFirst({
      where: {
        institutionId,
        email,
        status: { in: OPEN_STATUSES as never[] },
      },
      select: { id: true },
    });

    if (existingUser || existingApplication) {
      throw new ConflictException(
        'An application or account already exists for this email.',
      );
    }

    const applicationNumber = `JOIN-${new Date().getFullYear()}-${randomBytes(5)
      .toString('hex')
      .toUpperCase()}`;

    const now = new Date();

    const application = await this.prisma.staff_applications.create({
      data: {
        id: randomUUID(),
        applicationNumber,
        institutionId,
        role,
        status: 'SUBMITTED',
        firstName,
        middleName: clean(input.middleName, 100),
        lastName: clean(input.lastName, 100),
        dateOfBirth,
        gender: gender as never,
        email,
        phone,
        fatherName: clean(input.fatherName, 120),
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

    return { message: 'Application saved.', application };
  }

  /* ---------- read ---------- */

  async list(
    institutionId: string,
    filters: { status?: string; role?: string; search?: string },
  ) {
    const search = clean(filters.search, 60);

    const rows = await this.prisma.staff_applications.findMany({
      where: {
        institutionId,
        ...(filters.status ? { status: filters.status as never } : {}),
        ...(filters.role ? { role: this.role(filters.role) } : {}),
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
        role: true,
        firstName: true,
        lastName: true,
        phone: true,
        submittedAt: true,
        _count: { select: { documents: true } },
      },
    });

    return rows.map((row) => ({
      id: row.id,
      applicationNumber: row.applicationNumber,
      status: row.status,
      role: row.role,
      name: [row.firstName, row.lastName].filter(Boolean).join(' '),
      phone: row.phone,
      submittedAt: row.submittedAt,
      documentCount: row._count.documents,
    }));
  }

  async get(institutionId: string, id: string) {
    const application = await this.prisma.staff_applications.findFirst({
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
      application,
      missingRequired: missingJoinDocuments(
        application.role,
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

    const update = (data: Record<string, unknown>) =>
      this.prisma.staff_applications.update({
        where: { id },
        data: { ...data, reviewedAt: now, reviewedById: userId, updatedAt: now } as never,
        select: { id: true, status: true },
      });

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

    if (action === 'create_account') {
      if (application.status !== 'APPROVED') {
        throw new BadRequestException('Approve the application before creating the login.');
      }

      const created = await this.people.create(
        institutionId,
        {
          firstName: application.firstName,
          lastName: application.lastName ?? undefined,
          email: application.email,
          phone: application.phone,
        },
        application.role as JoinRole,
      );

      await update({ status: 'ENROLLED', createdUserId: created.teacher.id as string });

      return {
        message: 'Login created. Share the credentials once.',
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
    if (!JOIN_DOCUMENT_TYPES.includes(type)) {
      throw new BadRequestException('Invalid document type.');
    }

    const application = await this.prisma.staff_applications.findFirst({
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

    const document = await this.prisma.staff_application_documents.create({
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
    const document = await this.prisma.staff_application_documents.findFirst({
      where: { id: documentId, applicationId, application: { institutionId } },
      select: { id: true },
    });

    if (!document) throw new NotFoundException('Document not found.');

    const now = new Date();

    await this.prisma.staff_application_documents.update({
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
    const document = await this.prisma.staff_application_documents.findFirst({
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
