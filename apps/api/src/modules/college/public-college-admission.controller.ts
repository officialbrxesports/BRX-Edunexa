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
import {
  CollegeAdmissionsService,
  type CollegeApplicationInput,
} from './college-admissions.service';
import { missingCollegeDocuments } from './college-admission-profiles';

/* Public apply link for colleges and universities.
   The institution comes only from the code in the URL. */

const submitLimiter = new AttemptLimiter(5, 60 * 60 * 1000);
const lookupLimiter = new AttemptLimiter(8, 15 * 60 * 1000);
const uploadLimiter = new AttemptLimiter(40, 60 * 60 * 1000);

@Controller('public/apply-college')
export class PublicCollegeAdmissionController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly admissions: CollegeAdmissionsService,
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
              type: { in: ['COLLEGE', 'UNIVERSITY'] },
              status: 'ACTIVE',
            },
            select: { id: true, name: true, city: true, state: true },
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
        ? await this.prisma.college_applications.findFirst({
            where: { institutionId, applicationNumber, phone: mobile },
            include: {
              program: { select: { name: true } },
              documents: { select: { type: true } },
            },
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

    return {
      institution: {
        name: institution.name,
        city: institution.city,
        state: institution.state,
      },
      programs: await this.admissions.programOptions(institution.id),
      profiles: this.admissions.profiles(),
    };
  }

  @Post(':code')
  async submit(
    @Req() request: Request,
    @Param('code') code: string,
    @Body() body: CollegeApplicationInput & { website?: string },
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
          'An application or account already exists for this email. Please contact the college.',
        );
      }

      throw error;
    }
  }

  @Post(':code/status')
  async status(
    @Req() request: Request,
    @Param('code') code: string,
    @Body() body: { applicationNumber?: string; parentPhone?: string },
  ) {
    const institution = await this.institutionByCode(code);

    const a = await this.findApplication(
      institution.id,
      body?.applicationNumber,
      body?.parentPhone,
      this.ip(request),
    );

    const uploaded = a.documents.map((doc) => doc.type);

    return {
      application: {
        applicationNumber: a.applicationNumber,
        status: a.status,
        className: a.program.name,
        submittedAt: a.submittedAt,
        reviewNote: a.status === 'CHANGES_REQUESTED' ? a.reviewNote : null,
        formProfile: a.formProfile,
        firstName: a.firstName,
        middleName: a.middleName,
        lastName: a.lastName,
        dateOfBirth: a.dateOfBirth,
        gender: a.gender,
        category: a.category,
        studentEmail: a.studentEmail,
        fatherName: a.fatherName,
        motherName: a.motherName,
        parentPhone: a.phone,
        identityLast4: a.identityLast4,
        address: a.address,
        city: a.city,
        state: a.state,
        pinCode: a.pinCode,
        details: a.details,
      },
      uploadedTypes: uploaded,
      missingRequired: missingCollegeDocuments(a.formProfile, uploaded, a.details),
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
    body: { applicationNumber?: string; parentPhone?: string; type?: string },
    @UploadedFile() file: any,
  ) {
    const key = this.ip(request);

    uploadLimiter.assertAllowed(key);
    uploadLimiter.recordFailure(key);

    const institution = await this.institutionByCode(code);

    const application = await this.findApplication(
      institution.id,
      body?.applicationNumber,
      body?.parentPhone,
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
