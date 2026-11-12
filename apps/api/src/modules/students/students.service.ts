
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { randomBytes, randomUUID } from 'node:crypto';
import * as argon2 from 'argon2';

import { PrismaService } from '../../prisma/prisma.service';

export type CreateAdmissionInput = {
  firstName: string;
  middleName?: string;
  lastName?: string;
  studentEmail?: string;

  dateOfBirth?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  bloodGroup?: string;
  category?: string;
  religion?: string;
  motherTongue?: string;
  identityLast4?: string;

  fatherName?: string;
  fatherOccupation?: string;
  motherName?: string;
  motherOccupation?: string;
  guardianName?: string;
  guardianPhone?: string;

  parentPhone?: string;
  phone?: string;
  whatsappPhone?: string;
  parentEmail?: string;
  email?: string;

  address?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  country?: string;

  previousSchool?: string;
  previousClass?: string;
  previousBoard?: string;
  previousMarks?: string;
  previousTCNumber?: string;

  classId: string;
  sectionId?: string;
  declarationAccepted: boolean;
};

export type ReviewAdmissionInput = {
  status?: 'UNDER_REVIEW' | 'CHANGES_REQUESTED';
  note?: string;
};

@Injectable()
export class StudentsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  // -----------------------------------------
  // ROLE VALIDATION
  // -----------------------------------------

  private checkRole(role: string) {
    if (!['HEAD', 'STAFF'].includes(role)) {
      throw new ForbiddenException(
        'Only institution heads and staff can manage admissions.',
      );
    }
  }

  private validateStatus(status?: string) {
    const allowed = [
      'DRAFT',
      'SUBMITTED',
      'UNDER_REVIEW',
      'CHANGES_REQUESTED',
      'APPROVED',
      'REJECTED',
      'ENROLLED',
    ];

    if (status && !allowed.includes(status)) {
      throw new BadRequestException(
        'Invalid admission status.',
      );
    }
  }

  private validateEmail(email: string, label: string) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new BadRequestException(
        `Enter a valid ${label} email address.`,
      );
    }
  }

  private normalizeOptional(value?: string | null) {
    return value?.trim() || null;
  }

  // -----------------------------------------
  // GET CLASSES AND SECTIONS
  // -----------------------------------------

  async getClasses(
    institutionId: string,
    role: string,
  ) {
    this.checkRole(role);

    const classes = await this.prisma.classes.findMany({
      where: {
        institutionId,
      },
      include: {
        sections: {
          orderBy: {
            createdAt: 'asc',
          },
          include: {
            _count: {
              select: {
                student_enrollments: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return classes.map((classItem) => ({
      id: classItem.id,
      name: classItem.name,
      code: classItem.code,

      sections: classItem.sections.map((section) => {
        const occupied =
          section._count.student_enrollments;

        return {
          id: section.id,
          name: section.name,
          code: section.code,
          capacity: section.capacity,
          occupiedSeats: occupied,
          availableSeats: Math.max(
            section.capacity - occupied,
            0,
          ),
        };
      }),
    }));
  }

  // -----------------------------------------
  // CREATE ADMISSION APPLICATION
  // -----------------------------------------

  async createAdmission(
    institutionId: string,
    role: string,
    input: CreateAdmissionInput,
  ) {
    this.checkRole(role);

    const firstName = input.firstName?.trim();
    const middleName = this.normalizeOptional(input.middleName);
    const lastName = this.normalizeOptional(input.lastName);

    const studentEmail =
      input.studentEmail?.trim().toLowerCase() || null;

    const parentPhone = (
      input.parentPhone ?? input.phone
    )?.trim();

    const parentEmail = (
      input.parentEmail ?? input.email
    )?.trim().toLowerCase() || null;

    const classId = input.classId?.trim();
    const sectionId = input.sectionId?.trim() || null;

    if (!firstName || !parentPhone || !classId) {
      throw new BadRequestException(
        'Student name, parent phone and class are required.',
      );
    }

    if (!studentEmail) {
      throw new BadRequestException(
        'Student email is required.',
      );
    }

    if (input.declarationAccepted !== true) {
      throw new BadRequestException(
        'Parent declaration must be accepted.',
      );
    }

    if (firstName.length > 100) {
      throw new BadRequestException(
        'Student name is too long.',
      );
    }

    if (
      middleName && middleName.length > 100
    ) {
      throw new BadRequestException(
        'Middle name is too long.',
      );
    }

    if (
      lastName && lastName.length > 100
    ) {
      throw new BadRequestException(
        'Last name is too long.',
      );
    }

    if (!/^[0-9+\-\s()]{7,20}$/.test(parentPhone)) {
      throw new BadRequestException(
        'Enter a valid parent phone number.',
      );
    }

    this.validateEmail(studentEmail, 'student');

    if (parentEmail) {
      this.validateEmail(parentEmail, 'parent');
    }

    if (
      input.identityLast4 &&
      !/^\d{4}$/.test(input.identityLast4)
    ) {
      throw new BadRequestException(
        'Identity last four digits must contain exactly four numbers.',
      );
    }

    if (
      input.pinCode &&
      !/^[0-9]{4,10}$/.test(input.pinCode.trim())
    ) {
      throw new BadRequestException(
        'Enter a valid PIN code.',
      );
    }

    if (
      input.whatsappPhone &&
      !/^[0-9+\-\s()]{7,20}$/.test(input.whatsappPhone.trim())
    ) {
      throw new BadRequestException(
        'Enter a valid WhatsApp number.',
      );
    }

    let dateOfBirth: Date | null = null;

    if (input.dateOfBirth) {
      dateOfBirth = new Date(input.dateOfBirth);

      if (Number.isNaN(dateOfBirth.getTime())) {
        throw new BadRequestException(
          'Invalid date of birth.',
        );
      }

      if (dateOfBirth.getTime() > Date.now()) {
        throw new BadRequestException(
          'Date of birth cannot be in the future.',
        );
      }
    }

    const existingStudent =
      await this.prisma.users.findUnique({
        where: {
          email: studentEmail,
        },
        select: {
          id: true,
        },
      });

    if (existingStudent) {
      throw new ConflictException(
        'This student email is already registered.',
      );
    }

    const existingApplication =
      await this.prisma.admissionApplication.findFirst({
        where: {
          institutionId,
          studentEmail,
          status: {
            notIn: ['REJECTED'],
          },
        },
        select: {
          id: true,
          applicationNumber: true,
        },
      });

    if (existingApplication) {
      throw new ConflictException(
        'An admission application already exists for this student email.',
      );
    }

    const classItem =
      await this.prisma.classes.findFirst({
        where: {
          id: classId,
          institutionId,
        },
        select: {
          id: true,
          name: true,
        },
      });

    if (!classItem) {
      throw new NotFoundException(
        'Selected class was not found.',
      );
    }

    if (sectionId) {
      const section =
        await this.prisma.sections.findFirst({
          where: {
            id: sectionId,
            classId,
          },
          select: {
            id: true,
            capacity: true,
          },
        });

      if (!section) {
        throw new BadRequestException(
          'Selected section does not belong to this class.',
        );
      }

      const occupied =
        await this.prisma.student_enrollments.count({
          where: {
            classId,
            sectionId,
          },
        });

      if (occupied >= section.capacity) {
        throw new ConflictException(
          'This section is full. Select another section.',
        );
      }
    }

    const applicationNumber =
      `ADM-${new Date().getFullYear()}-${randomBytes(5)
        .toString('hex')
        .toUpperCase()}`;

    const applicationId = randomUUID();

    const application =
      await this.prisma.$transaction(async (tx) => {
        const created =
          await tx.admissionApplication.create({
            data: {
              id: applicationId,
              applicationNumber,
              institutionId,
              classId,
              sectionId,

              status: 'SUBMITTED',

              firstName,
              middleName,
              lastName,
              studentEmail,

              dateOfBirth,
              gender: input.gender,
              bloodGroup: this.normalizeOptional(input.bloodGroup),
              category: this.normalizeOptional(input.category),
              religion: this.normalizeOptional(input.religion),
              motherTongue: this.normalizeOptional(input.motherTongue),
              identityLast4: this.normalizeOptional(input.identityLast4),

              fatherName: this.normalizeOptional(input.fatherName),
              fatherOccupation: this.normalizeOptional(input.fatherOccupation),
              motherName: this.normalizeOptional(input.motherName),
              motherOccupation: this.normalizeOptional(input.motherOccupation),
              guardianName: this.normalizeOptional(input.guardianName),
              guardianPhone: this.normalizeOptional(input.guardianPhone),

              parentPhone,
              whatsappPhone: this.normalizeOptional(input.whatsappPhone),
              parentEmail,

              address: this.normalizeOptional(input.address),
              city: this.normalizeOptional(input.city),
              state: this.normalizeOptional(input.state),
              pinCode: this.normalizeOptional(input.pinCode),
              country: input.country?.trim() || 'India',

              previousSchool: this.normalizeOptional(input.previousSchool),
              previousClass: this.normalizeOptional(input.previousClass),
              previousBoard: this.normalizeOptional(input.previousBoard),
              previousMarks: this.normalizeOptional(input.previousMarks),
              previousTCNumber: this.normalizeOptional(input.previousTCNumber),

              declarationAccepted: true,
              submittedAt: new Date(),
              updatedAt: new Date(),
            },
          });

        await tx.admissionStatusHistory.create({
          data: {
            id: randomUUID(),
            applicationId,
            oldStatus: null,
            newStatus: 'SUBMITTED',
            note: 'Admission application submitted.',
          },
        });

        return created;
      });

    return {
      success: true,
      message: 'Admission application submitted successfully.',
      application,
    };
  }

  // -----------------------------------------
  // LIST ADMISSIONS
  // -----------------------------------------

  async getAdmissions(
    institutionId: string,
    role: string,
    status?: string,
  ) {
    this.checkRole(role);
    this.validateStatus(status);

    const applications =
      await this.prisma.admissionApplication.findMany({
        where: {
          institutionId,
          ...(status
            ? { status: status as any }
            : {}),
        },
        include: {
          classes: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          sections: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          _count: {
            select: {
              documents: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 100,
      });

    // Frontend uses class and section aliases.
    return applications.map((application) => ({
      ...application,
      class: application.classes,
      section: application.sections,
      documentCount: application._count.documents,
    }));
  }

  // -----------------------------------------
  // SINGLE ADMISSION DETAILS
  // -----------------------------------------

  async getAdmission(
    institutionId: string,
    role: string,
    id: string,
  ) {
    this.checkRole(role);

    const application =
      await this.prisma.admissionApplication.findFirst({
        where: {
          id,
          institutionId,
        },
        include: {
          classes: true,
          sections: true,
          documents: {
            select: {
              id: true,
              type: true,
              originalName: true,
              mimeType: true,
              sizeBytes: true,
              verified: true,
              verifiedAt: true,
              remarks: true,
              createdAt: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
          receipt: true,
          statusHistory: {
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      });

    if (!application) {
      throw new NotFoundException(
        'Admission application not found.',
      );
    }

    return {
      ...application,
      class: application.classes,
      section: application.sections,
    };
  }

  // -----------------------------------------
  // REVIEW / REQUEST CHANGES
  // -----------------------------------------

  async reviewAdmission(
    institutionId: string,
    reviewerId: string,
    role: string,
    id: string,
    input: ReviewAdmissionInput,
  ) {
    this.checkRole(role);

    const application =
      await this.getAdmission(
        institutionId,
        role,
        id,
      );

    if (
      ['APPROVED', 'REJECTED', 'ENROLLED'].includes(
        application.status,
      )
    ) {
      throw new ConflictException(
        'This application is already finalized.',
      );
    }

    const newStatus =
      input.status || 'UNDER_REVIEW';

    if (
      !['UNDER_REVIEW', 'CHANGES_REQUESTED'].includes(newStatus)
    ) {
      throw new BadRequestException(
        'Invalid review status.',
      );
    }

    if (
      newStatus === 'CHANGES_REQUESTED' &&
      !input.note?.trim()
    ) {
      throw new BadRequestException(
        'Please provide details about the required changes.',
      );
    }

    const note = input.note?.trim() || null;

    return this.prisma.$transaction(async (tx) => {
      const updated =
        await tx.admissionApplication.update({
          where: {
            id,
          },
          data: {
            status: newStatus,
            reviewedAt: new Date(),
            reviewedById: reviewerId,
            reviewNote: note,
            updatedAt: new Date(),
          },
        });

      await tx.admissionStatusHistory.create({
        data: {
          id: randomUUID(),
          applicationId: id,
          oldStatus: application.status,
          newStatus,
          changedById: reviewerId,
          note,
        },
      });

      return {
        success: true,
        message: 'Admission application reviewed.',
        application: updated,
      };
    });
  }

  // -----------------------------------------
  // APPROVE AND ENROLL STUDENT
  // -----------------------------------------

  async approveAdmission(
    institutionId: string,
    reviewerId: string,
    role: string,
    id: string,
    input: { sectionId?: string },
  ) {
    this.checkRole(role);

    const application =
      await this.getAdmission(
        institutionId,
        role,
        id,
      );

    if (application.approvedStudentId) {
      throw new ConflictException(
        'Student account has already been created.',
      );
    }

    if (
      ['APPROVED', 'REJECTED', 'ENROLLED'].includes(
        application.status,
      )
    ) {
      throw new ConflictException(
        'This application cannot be approved again.',
      );
    }

    if (!application.studentEmail) {
      throw new BadRequestException(
        'Student email is required before approval.',
      );
    }

    const sectionId =
      input.sectionId?.trim() ||
      application.sectionId;

    if (!sectionId) {
      throw new BadRequestException(
        'Select a section before approving this application.',
      );
    }

    const section =
      await this.prisma.sections.findFirst({
        where: {
          id: sectionId,
          classId: application.classId,
        },
      });

    if (!section) {
      throw new NotFoundException(
        'Selected section was not found.',
      );
    }

    // Every uploaded document must be verified before enrollment.
    const unverifiedDocuments =
      await this.prisma.admissionDocument.count({
        where: {
          applicationId: id,
          verified: false,
        },
      });

    if (unverifiedDocuments > 0) {
      throw new ConflictException(
        'Please verify all uploaded admission documents before approval.',
      );
    }

    const existingUser =
      await this.prisma.users.findUnique({
        where: {
          email: application.studentEmail,
        },
        select: {
          id: true,
        },
      });

    if (existingUser) {
      throw new ConflictException(
        'This student email is already registered.',
      );
    }

    const studentId = randomUUID();

    const brxUid =
      `BRX-${randomUUID()
        .replace(/-/g, '')
        .slice(0, 12)
        .toUpperCase()}`;

    const temporaryPassword =
      randomBytes(18).toString('base64url');

    const passwordHash =
      await argon2.hash(temporaryPassword);

    const studentName = [
      application.firstName,
      application.middleName,
      application.lastName,
    ]
      .filter(Boolean)
      .join(' ');

    try {
      const result =
        await this.prisma.$transaction(
          async (tx) => {
            const currentApplication =
              await tx.admissionApplication.findFirst({
                where: {
                  id,
                  institutionId,
                },
              });

            if (!currentApplication) {
              throw new NotFoundException(
                'Admission application not found.',
              );
            }

            if (
              currentApplication.approvedStudentId ||
              ['APPROVED', 'REJECTED', 'ENROLLED'].includes(
                currentApplication.status,
              )
            ) {
              throw new ConflictException(
                'This application has already been finalized.',
              );
            }

            const currentSection =
              await tx.sections.findFirst({
                where: {
                  id: sectionId,
                  classId: currentApplication.classId,
                },
              });

            if (!currentSection) {
              throw new NotFoundException(
                'Selected section was not found.',
              );
            }

            const occupiedSeats =
              await tx.student_enrollments.count({
                where: {
                  classId: currentApplication.classId,
                  sectionId,
                },
              });

            if (occupiedSeats >= currentSection.capacity) {
              throw new ConflictException(
                'This section is full. Select another section.',
              );
            }

            const duplicateUser =
              await tx.users.findUnique({
                where: {
                  email: currentApplication.studentEmail!,
                },
                select: {
                  id: true,
                },
              });

            if (duplicateUser) {
              throw new ConflictException(
                'This student email is already registered.',
              );
            }

            const student = await tx.users.create({
              data: {
                id: studentId,
                email: currentApplication.studentEmail!,
                passwordHash,
                firstName: studentName,
                phone: currentApplication.parentPhone,
                role: 'STUDENT',
                status: 'ACTIVE',
                institutionId,
                brxUid,
                updatedAt: new Date(),
              },
              select: {
                id: true,
                email: true,
                firstName: true,
                brxUid: true,
              },
            });

            await tx.student_enrollments.create({
              data: {
                id: randomUUID(),
                studentId,
                classId: currentApplication.classId,
                sectionId,
                updatedAt: new Date(),
              },
            });

            // Record the approval stage.
            await tx.admissionApplication.update({
              where: {
                id,
              },
              data: {
                status: 'APPROVED',
                sectionId,
                reviewedAt: new Date(),
                reviewedById: reviewerId,
                updatedAt: new Date(),
              },
            });

            await tx.admissionStatusHistory.create({
              data: {
                id: randomUUID(),
                applicationId: id,
                oldStatus: currentApplication.status,
                newStatus: 'APPROVED',
                changedById: reviewerId,
                note: 'Admission application approved.',
              },
            });

            // Enrollment completes the workflow.
            const updatedApplication =
              await tx.admissionApplication.update({
                where: {
                  id,
                },
                data: {
                  status: 'ENROLLED',
                  approvedStudentId: studentId,
                  updatedAt: new Date(),
                },
              });

            await tx.admissionStatusHistory.create({
              data: {
                id: randomUUID(),
                applicationId: id,
                oldStatus: 'APPROVED',
                newStatus: 'ENROLLED',
                changedById: reviewerId,
                note: 'Student account created and enrollment completed.',
              },
            });

            return {
              student,
              application: updatedApplication,
            };
          },
          {
            isolationLevel: 'Serializable',
          },
        );

      return {
        success: true,
        message: 'Admission approved and student enrolled.',
        student: result.student,
        application: result.application,
        credentials: {
          eduNexaId: brxUid,
          email: application.studentEmail,
          temporaryPassword,
        },
      };
    } catch (error) {
      if (
        error instanceof ConflictException ||
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code?: string }).code === 'P2002'
      ) {
        throw new ConflictException(
          'Student account or EduNexa ID already exists.',
        );
      }

      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code?: string }).code === 'P2034'
      ) {
        throw new ConflictException(
          'Another enrollment changed this section at the same time. Please try again.',
        );
      }

      throw error;
    }
  }

  // -----------------------------------------
  // REJECT APPLICATION
  // -----------------------------------------

  async rejectAdmission(
    institutionId: string,
    reviewerId: string,
    role: string,
    id: string,
    input: { reason: string },
  ) {
    this.checkRole(role);

    const reason = input.reason?.trim();

    if (!reason) {
      throw new BadRequestException(
        'Please provide a rejection reason.',
      );
    }

    if (reason.length > 1000) {
      throw new BadRequestException(
        'Rejection reason is too long.',
      );
    }

    const application =
      await this.getAdmission(
        institutionId,
        role,
        id,
      );

    if (
      ['APPROVED', 'REJECTED', 'ENROLLED'].includes(
        application.status,
      )
    ) {
      throw new ConflictException(
        'This application is already finalized.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updated =
        await tx.admissionApplication.update({
          where: {
            id,
          },
          data: {
            status: 'REJECTED',
            rejectionReason: reason,
            reviewedAt: new Date(),
            reviewedById: reviewerId,
            updatedAt: new Date(),
          },
        });

      await tx.admissionStatusHistory.create({
        data: {
          id: randomUUID(),
          applicationId: id,
          oldStatus: application.status,
          newStatus: 'REJECTED',
          changedById: reviewerId,
          note: reason,
        },
      });

      return {
        success: true,
        message: 'Admission application rejected.',
        application: updated,
      };
    });
  }

  // -----------------------------------------
  // CREATE ADMISSION RECEIPT
  // -----------------------------------------

  async createAdmissionReceipt(
    institutionId: string,
    role: string,
    applicationId: string,
    input: {
      amount?: number;
      note?: string;
    },
  ) {
    this.checkRole(role);

    const application =
      await this.prisma.admissionApplication.findFirst({
        where: {
          id: applicationId,
          institutionId,
        },
        select: {
          id: true,
          applicationNumber: true,
        },
      });

    if (!application) {
      throw new NotFoundException('Admission application not found.');
    }

    const amount = input.amount ?? 0;

    if (!Number.isFinite(amount) || amount < 0 || amount > 99999999) {
      throw new BadRequestException('Enter a valid receipt amount.');
    }

    const existing =
      await this.prisma.admissionReceipt.findUnique({
        where: { applicationId },
      });

    if (existing) {
      throw new ConflictException('A receipt already exists for this application.');
    }

    const receiptNumber =
      `RCPT-${new Date().getFullYear()}-${randomBytes(5)
        .toString('hex')
        .toUpperCase()}`;

    try {
      const receipt =
        await this.prisma.admissionReceipt.create({
          data: {
            id: randomUUID(),
            receiptNumber,
            applicationId,
            amount,
            paymentStatus: 'PENDING',
            note: this.normalizeOptional(input.note),
            updatedAt: new Date(),
          },
        });

      return {
        success: true,
        message: 'Admission receipt created successfully.',
        receipt,
      };
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code?: string }).code === 'P2002'
      ) {
        throw new ConflictException('Receipt already exists.');
      }

      throw error;
    }
  }

  // -----------------------------------------
  // GET ADMISSION RECEIPT
  // -----------------------------------------

  async getAdmissionReceipt(
    institutionId: string,
    role: string,
    applicationId: string,
  ) {
    this.checkRole(role);

    const application =
      await this.prisma.admissionApplication.findFirst({
        where: {
          id: applicationId,
          institutionId,
        },
        select: {
          id: true,
          applicationNumber: true,
          firstName: true,
          middleName: true,
          lastName: true,
          parentPhone: true,
          studentEmail: true,
          classes: {
            select: {
              name: true,
              code: true,
            },
          },
          sections: {
            select: {
              name: true,
              code: true,
            },
          },
          receipt: true,
        },
      });

    if (!application) {
      throw new NotFoundException('Admission application not found.');
    }

    if (!application.receipt) {
      throw new NotFoundException('Receipt has not been created yet.');
    }

    return {
      success: true,
      application: {
        id: application.id,
        applicationNumber: application.applicationNumber,
        studentName: [
          application.firstName,
          application.middleName,
          application.lastName,
        ].filter(Boolean).join(' '),
        parentPhone: application.parentPhone,
        studentEmail: application.studentEmail,
        class: application.classes,
        section: application.sections,
      },
      receipt: application.receipt,
    };
  }

  // -----------------------------------------
  // UPDATE ADMISSION PAYMENT
  // -----------------------------------------

  async updateAdmissionPayment(
    institutionId: string,
    role: string,
    applicationId: string,
    input: {
      amount?: number;
      paymentMethod?: 'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER' | 'OTHER';
      transactionId?: string;
      paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
      paymentDate?: string;
      note?: string;
    },
  ) {
    this.checkRole(role);

    const application =
      await this.prisma.admissionApplication.findFirst({
        where: {
          id: applicationId,
          institutionId,
        },
        select: {
          id: true,
        },
      });

    if (!application) {
      throw new NotFoundException('Admission application not found.');
    }

    const receipt =
      await this.prisma.admissionReceipt.findUnique({
        where: {
          applicationId,
        },
      });

    if (!receipt) {
      throw new NotFoundException('Create the admission receipt first.');
    }

    const allowedStatuses = [
      'PENDING',
      'PAID',
      'FAILED',
      'REFUNDED',
    ];

    if (!allowedStatuses.includes(input.paymentStatus)) {
      throw new BadRequestException('Invalid payment status.');
    }

    if (
      input.amount !== undefined &&
      (!Number.isFinite(input.amount) ||
        input.amount < 0 ||
        input.amount > 99999999)
    ) {
      throw new BadRequestException('Enter a valid payment amount.');
    }

    if (
      input.paymentStatus === 'PAID' &&
      !input.paymentMethod
    ) {
      throw new BadRequestException(
        'Payment method is required for a paid receipt.',
      );
    }

    let paymentDate: Date | undefined;

    if (input.paymentDate) {
      paymentDate = new Date(input.paymentDate);

      if (Number.isNaN(paymentDate.getTime())) {
        throw new BadRequestException('Invalid payment date.');
      }

      if (paymentDate.getTime() > Date.now()) {
        throw new BadRequestException('Payment date cannot be in the future.');
      }
    }

    const updated =
      await this.prisma.admissionReceipt.update({
        where: {
          applicationId,
        },
        data: {
          ...(input.amount !== undefined
            ? { amount: input.amount }
            : {}),
          ...(input.paymentMethod
            ? { paymentMethod: input.paymentMethod }
            : {}),
          ...(input.transactionId !== undefined
            ? { transactionId: this.normalizeOptional(input.transactionId) }
            : {}),
          paymentStatus: input.paymentStatus,
          ...(paymentDate
            ? { paymentDate }
            : input.paymentStatus === 'PAID'
              ? { paymentDate: new Date() }
              : {}),
          ...(input.note !== undefined
            ? { note: this.normalizeOptional(input.note) }
            : {}),
          updatedAt: new Date(),
        },
      });

    return {
      success: true,
      message: 'Admission payment updated successfully.',
      receipt: updated,
    };
  }
}
