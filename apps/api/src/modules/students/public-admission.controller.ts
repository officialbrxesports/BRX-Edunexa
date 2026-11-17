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

import { PROFILES, missingRequiredDocuments } from './admission-profiles';
import { AdmissionDocumentsService } from './admission-documents.service';
import {
  CreateAdmissionInput,
  StudentsService,
} from './students.service';

/* Public admission link: /apply/<school code>.
   No login. The institution comes only from the school code in the URL,
   never from the request body. Limits are per IP and in memory. */

// Counts successful submissions: 5 applications per IP per hour.
const submitLimiter = new AttemptLimiter(5, 60 * 60 * 1000);
// Counts wrong application number / phone guesses.
const lookupLimiter = new AttemptLimiter(8, 15 * 60 * 1000);
// Counts every document upload: 40 per IP per hour.
const uploadLimiter = new AttemptLimiter(40, 60 * 60 * 1000);

const MAX_DOCUMENTS = 15;

@Controller('public/apply')
export class PublicAdmissionController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly studentsService: StudentsService,
    private readonly documentsService: AdmissionDocumentsService,
  ) {}

  private ip(request: Request): string {
    return request.ip ?? 'unknown';
  }

  private async institutionByCode(code: string) {
    const clean = String(code || '').trim();

    if (!clean || clean.length > 40) {
      throw new NotFoundException('Admissions are not open for this link.');
    }

    const institution = await this.prisma.institutions.findFirst({
      where: {
        code: { equals: clean, mode: 'insensitive' },
        type: 'SCHOOL',
        status: 'ACTIVE',
      },
      select: { id: true, name: true, city: true, state: true },
    });

    if (!institution) {
      throw new NotFoundException('Admissions are not open for this link.');
    }

    return institution;
  }

  private async findApplication(
    institutionId: string,
    applicationNumber: unknown,
    parentPhone: unknown,
    key: string,
  ) {
    lookupLimiter.assertAllowed(key);

    const number = String(applicationNumber || '').trim().toUpperCase();
    const phone = String(parentPhone || '').trim();

    const application =
      number && phone
        ? await this.prisma.admissionApplication.findFirst({
            where: {
              institutionId,
              applicationNumber: number,
              parentPhone: phone,
            },
            include: { documents: { select: { type: true } } },
          })
        : null;

    if (!application) {
      lookupLimiter.recordFailure(key);
      throw new NotFoundException(
        'Application not found. Check the application number and parent phone.',
      );
    }

    return application;
  }

  /* School name + classes for the form. */
  @Get(':code')
  async info(@Param('code') code: string) {
    const institution = await this.institutionByCode(code);

    const classes = await this.prisma.classes.findMany({
      where: { institutionId: institution.id },
      select: { id: true, name: true },
      orderBy: { createdAt: 'asc' },
    });

    const withProfile = await this.studentsService.publicClassList(classes);

    return {
      institution: {
        name: institution.name,
        city: institution.city,
        state: institution.state,
      },
      classes: withProfile,
      profiles: PROFILES,
    };
  }

  /* Parent submits the application. */
  @Post(':code')
  async submit(
    @Req() request: Request,
    @Param('code') code: string,
    @Body() body: CreateAdmissionInput & { website?: string },
  ) {
    const key = this.ip(request);

    submitLimiter.assertAllowed(key);

    // Hidden "website" field: only bots fill it in.
    if (body?.website) {
      throw new BadRequestException('Could not submit the form.');
    }

    if (
      body?.gender &&
      !['MALE', 'FEMALE', 'OTHER'].includes(String(body.gender))
    ) {
      throw new BadRequestException('Choose a valid gender.');
    }

    const institution = await this.institutionByCode(code);

    const input: CreateAdmissionInput = {
      ...body,
      sectionId: undefined, // the school assigns the section later
    };

    try {
      const result = await this.studentsService.createAdmission(
        institution.id,
        'STAFF',
        input,
      );

      // Only successful applications count toward the hourly limit.
      submitLimiter.recordFailure(key);

      return {
        message: 'Application submitted.',
        applicationNumber: result.application.applicationNumber,
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        // Do not reveal which emails already have accounts.
        throw new ConflictException(
          'An application or account already exists for this student email. Please contact the school.',
        );
      }

      throw error;
    }
  }

  /* Parent checks status and what is still missing. */
  @Post(':code/status')
  async status(
    @Req() request: Request,
    @Param('code') code: string,
    @Body() body: { applicationNumber?: string; parentPhone?: string },
  ) {
    const institution = await this.institutionByCode(code);

    const application = await this.findApplication(
      institution.id,
      body?.applicationNumber,
      body?.parentPhone,
      this.ip(request),
    );

    const uploaded = application.documents.map((doc) => doc.type);

    const cls = await this.prisma.classes.findUnique({
      where: { id: application.classId },
      select: { name: true },
    });

    const a = application;

    return {
      application: {
        applicationNumber: a.applicationNumber,
        status: a.status,
        className: cls?.name ?? '',
        submittedAt: a.submittedAt,
        reviewNote: a.status === 'CHANGES_REQUESTED' ? a.reviewNote : null,
        formProfile: a.formProfile,
        firstName: a.firstName,
        middleName: a.middleName,
        lastName: a.lastName,
        dateOfBirth: a.dateOfBirth,
        gender: a.gender,
        bloodGroup: a.bloodGroup,
        category: a.category,
        religion: a.religion,
        motherTongue: a.motherTongue,
        identityLast4: a.identityLast4,
        studentEmail: a.studentEmail,
        fatherName: a.fatherName,
        fatherOccupation: a.fatherOccupation,
        motherName: a.motherName,
        motherOccupation: a.motherOccupation,
        guardianName: a.guardianName,
        guardianPhone: a.guardianPhone,
        parentPhone: a.parentPhone,
        whatsappPhone: a.whatsappPhone,
        parentEmail: a.parentEmail,
        address: a.address,
        city: a.city,
        state: a.state,
        pinCode: a.pinCode,
        country: a.country,
        previousSchool: a.previousSchool,
        previousClass: a.previousClass,
        previousBoard: a.previousBoard,
        previousMarks: a.previousMarks,
        previousTCNumber: a.previousTCNumber,
        details: a.details,
      },
      uploadedTypes: uploaded,
      missingRequired: missingRequiredDocuments(
        a.formProfile,
        uploaded,
        a.details,
      ),
    };
  }

  /* Parent uploads a document for their own application. */
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

    if (['APPROVED', 'ENROLLED', 'REJECTED'].includes(application.status)) {
      throw new ConflictException(
        'This application is closed. Please contact the school.',
      );
    }

    if (application.documents.length >= MAX_DOCUMENTS) {
      throw new ConflictException(
        'Document limit reached. Please contact the school.',
      );
    }

    const result = await this.documentsService.upload(
      institution.id,
      'STAFF',
      application.id,
      String(body?.type || ''),
      file,
    );

    return { message: result.message, type: result.document.type };
  }
}
