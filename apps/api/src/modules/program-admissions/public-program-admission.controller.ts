import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';

import { PrismaService } from '../../prisma/prisma.service';
import { AttemptLimiter } from '../../common/security/attempt-limiter';
import { missingProgramDocuments } from './program-admission-profiles';
import {
  ProgramAdmissionsService,
  type ProgramApplicationInput,
} from './program-admissions.service';

/* Public apply link for coaching and institutes.
   The institution comes only from the code in the URL.
   Nothing here creates a login; staff must approve first. */

const submitLimiter = new AttemptLimiter(5, 60 * 60 * 1000);
const lookupLimiter = new AttemptLimiter(8, 15 * 60 * 1000);
const uploadLimiter = new AttemptLimiter(40, 60 * 60 * 1000);

@Controller('public/apply-program')
export class PublicProgramAdmissionController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly admissions: ProgramAdmissionsService,
  ) {}

  private ip(request: Request): string {
    return request.ip ?? 'unknown';
  }

  private async institutionByCode(code: string) {
    const clean = String(code || '').trim();

    const institution =
      clean && clean.length <= 40
        ? await this.prisma.institutions.findFirst({
            where: {
              code: { equals: clean, mode: 'insensitive' },
              type: { in: ['COACHING', 'INSTITUTE'] },
              status: 'ACTIVE',
            },
            select: { id: true, name: true, city: true, state: true, type: true },
          })
        : null;

    if (!institution) {
      throw new NotFoundException('Admissions are not open for this link.');
    }

    return institution;
  }

  private async findApplication(
    institutionId: string,
    number: unknown,
    phone: unknown,
    key: string,
  ) {
    lookupLimiter.assertAllowed(key);

    const applicationNumber = String(number || '').trim().toUpperCase();
    const mobile = String(phone || '').trim();

    const application =
      applicationNumber && mobile
        ? await this.prisma.program_applications.findFirst({
            where: { institutionId, applicationNumber, phone: mobile },
            include: { documents: { select: { type: true } } },
          })
        : null;

    if (!application) {
      lookupLimiter.recordFailure(key);
      throw new NotFoundException(
        'Application not found. Check the application number and mobile.',
      );
    }

    return application;
  }

  @Get(':code')
  async info(@Param('code') code: string) {
    const institution = await this.institutionByCode(code);

    const kind = institution.type as 'COACHING' | 'INSTITUTE';

    return {
      institution: {
        name: institution.name,
        city: institution.city,
        state: institution.state,
      },
      kind,
      profile: this.admissions.profile(kind),
      targets: await this.admissions.targets(institution.id, kind),
    };
  }

  @Post(':code')
  async submit(
    @Req() request: Request,
    @Param('code') code: string,
    @Body() body: ProgramApplicationInput & { website?: string },
  ) {
    const key = this.ip(request);

    submitLimiter.assertAllowed(key);

    if (body?.website) {
      throw new BadRequestException('Could not submit the form.');
    }

    const institution = await this.institutionByCode(code);

    try {
      const result = await this.admissions.create(institution.id, body);

      submitLimiter.recordFailure(key);

      return {
        message: result.message,
        applicationNumber: result.application.applicationNumber,
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw new ConflictException(
          'An application or account already exists for this email. Please contact the institution.',
        );
      }

      throw error;
    }
  }

  @Post(':code/status')
  async status(
    @Req() request: Request,
    @Param('code') code: string,
    @Body() body: { applicationNumber?: string; phone?: string },
  ) {
    const institution = await this.institutionByCode(code);

    const a = await this.findApplication(
      institution.id,
      body?.applicationNumber,
      body?.phone,
      this.ip(request),
    );

    const uploaded = a.documents.map((doc) => doc.type);

    return {
      application: {
        applicationNumber: a.applicationNumber,
        status: a.status,
        kind: a.kind,
        targetName: await this.admissions.targetNameFor(
          institution.id,
          a.kind,
          a.targetId,
        ),
        submittedAt: a.submittedAt,
        reviewNote: a.status === 'CHANGES_REQUESTED' ? a.reviewNote : null,
        firstName: a.firstName,
        middleName: a.middleName,
        lastName: a.lastName,
        dateOfBirth: a.dateOfBirth,
        gender: a.gender,
        studentEmail: a.studentEmail,
        phone: a.phone,
        fatherName: a.fatherName,
        motherName: a.motherName,
        category: a.category,
        identityLast4: a.identityLast4,
        address: a.address,
        city: a.city,
        state: a.state,
        pinCode: a.pinCode,
        details: a.details,
      },
      uploadedTypes: uploaded,
      missingRequired: missingProgramDocuments(a.kind, uploaded),
    };
  }

  @Post(':code/documents')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 2 * 1024 * 1024, files: 1 },
      fileFilter: (_request, file, callback) => {
        const allowed = ['image/jpeg', 'image/png', 'application/pdf'];

        if (!allowed.includes(file.mimetype)) {
          return callback(
            new BadRequestException('Only JPG, PNG and PDF files are allowed.'),
            false,
          );
        }

        callback(null, true);
      },
    }),
  )
  async upload(
    @Req() request: Request,
    @Param('code') code: string,
    @Body()
    body: { applicationNumber?: string; phone?: string; type?: string },
    @UploadedFile() file: any,
  ) {
    const key = this.ip(request);

    uploadLimiter.assertAllowed(key);
    uploadLimiter.recordFailure(key);

    const institution = await this.institutionByCode(code);

    const application = await this.findApplication(
      institution.id,
      body?.applicationNumber,
      body?.phone,
      key,
    );

    const result = await this.admissions.uploadDocument(
      institution.id,
      application.id,
      String(body?.type || ''),
      file,
    );

    return { message: result.message, type: result.document.type };
  }
}
