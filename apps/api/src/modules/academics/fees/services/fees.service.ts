import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../../../database/prisma.service';

import { CreateFeeDto } from '../dto/create-fee.dto';
import { CreateFeePaymentDto } from '../dto/create-fee-payment.dto';
import { UpdateFeeDto } from '../dto/update-fee.dto';

@Injectable()
export class FeesService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  private calculateStatus(
    totalAmount: number,
    paidAmount: number,
    dueDate: Date,
  ) {
    const dueAmount =
      Math.max(totalAmount - paidAmount, 0);

    if (dueAmount <= 0) {
      return 'PAID' as const;
    }

    if (paidAmount > 0) {
      return 'PARTIAL' as const;
    }

    if (dueDate.getTime() < Date.now()) {
      return 'OVERDUE' as const;
    }

    return 'PENDING' as const;
  }

  async createFee(
    institutionId: string | null,
    dto: CreateFeeDto,
  ) {
    if (!institutionId) {
      throw new ForbiddenException(
        'Institution not found',
      );
    }

    const totalAmount = Number(dto.totalAmount);

    if (totalAmount <= 0) {
      throw new BadRequestException(
        'Total fee must be greater than 0',
      );
    }

    const dueDate = new Date(dto.dueDate);

    if (Number.isNaN(dueDate.getTime())) {
      throw new BadRequestException(
        'Invalid due date',
      );
    }

    const student =
      await this.prisma.user.findFirst({
        where: {
          id: dto.studentId,
          institutionId,
          role: 'STUDENT',
        },
      });

    if (!student) {
      throw new NotFoundException(
        'Student not found',
      );
    }

    const classRecord =
      await this.prisma.class.findFirst({
        where: {
          id: dto.classId,
          institutionId,
        },
      });

    if (!classRecord) {
      throw new NotFoundException(
        'Class not found',
      );
    }

    const section =
      await this.prisma.section.findFirst({
        where: {
          id: dto.sectionId,
          classId: dto.classId,
        },
      });

    if (!section) {
      throw new NotFoundException(
        'Section not found',
      );
    }

    const enrollment =
      await this.prisma.studentEnrollment.findFirst({
        where: {
          studentId: dto.studentId,
          classId: dto.classId,
          sectionId: dto.sectionId,
        },
      });

    if (!enrollment) {
      throw new BadRequestException(
        'Student is not enrolled in this class and section',
      );
    }

    const existingFee =
      await this.prisma.studentFee.findFirst({
        where: {
          studentId: dto.studentId,
          classId: dto.classId,
          sectionId: dto.sectionId,
        },
      });

    if (existingFee) {
      throw new ConflictException(
        'Fee record already exists for this student',
      );
    }

    const status = this.calculateStatus(
      totalAmount,
      0,
      dueDate,
    );

    return this.prisma.studentFee.create({
      data: {
        studentId: dto.studentId,
        classId: dto.classId,
        sectionId: dto.sectionId,
        totalAmount,
        paidAmount: 0,
        dueAmount: totalAmount,
        dueDate,
        status,
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        class: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        section: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        payments: true,
      },
    });
  }

  async getAllFees(
    institutionId: string | null,
  ) {
    if (!institutionId) {
      throw new ForbiddenException(
        'Institution not found',
      );
    }

    return this.prisma.studentFee.findMany({
      where: {
        student: {
          institutionId,
        },
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        class: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        section: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        payments: {
          orderBy: {
            paymentDate: 'desc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getStudentFees(
    institutionId: string | null,
    studentId: string,
  ) {
    if (!institutionId) {
      throw new ForbiddenException(
        'Institution not found',
      );
    }

    const student =
      await this.prisma.user.findFirst({
        where: {
          id: studentId,
          institutionId,
          role: 'STUDENT',
        },
      });

    if (!student) {
      throw new NotFoundException(
        'Student not found',
      );
    }

    return this.prisma.studentFee.findMany({
      where: {
        studentId,
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        section: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        payments: {
          orderBy: {
            paymentDate: 'desc',
          },
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
    });
  }

  async getFeeById(
    institutionId: string | null,
    feeId: string,
    userId?: string,
    role?: string,
  ) {
    if (!institutionId) {
      throw new ForbiddenException(
        'Institution not found',
      );
    }

    const normalizedRole = role?.toUpperCase();

    const fee =
      await this.prisma.studentFee.findFirst({
        where: {
          id: feeId,
          student: {
            institutionId,
            ...(normalizedRole === 'STUDENT'
              ? { id: userId }
              : {}),
          },
        },
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
          class: true,
          section: true,
          payments: {
            orderBy: {
              paymentDate: 'desc',
            },
          },
        },
      });

    if (!fee) {
      throw new NotFoundException(
        'Fee record not found',
      );
    }

    return fee;
  }
  async updateFee(
    institutionId: string | null,
    feeId: string,
    dto: UpdateFeeDto,
  ) {
    const existingFee =
      await this.getFeeById(
        institutionId,
        feeId,
      );

    const currentTotal =
      Number(existingFee.totalAmount);

    const currentPaid =
      Number(existingFee.paidAmount);

    const totalAmount =
      dto.totalAmount !== undefined
        ? Number(dto.totalAmount)
        : currentTotal;

    if (totalAmount < currentPaid) {
      throw new BadRequestException(
        'Total fee cannot be less than already paid amount',
      );
    }

    const dueDate =
      dto.dueDate !== undefined
        ? new Date(dto.dueDate)
        : existingFee.dueDate;

    if (Number.isNaN(dueDate.getTime())) {
      throw new BadRequestException(
        'Invalid due date',
      );
    }

    const dueAmount = Math.max(
      totalAmount - currentPaid,
      0,
    );

    const status =
      dto.status ??
      this.calculateStatus(
        totalAmount,
        currentPaid,
        dueDate,
      );

    return this.prisma.studentFee.update({
      where: {
        id: feeId,
      },
      data: {
        totalAmount,
        dueAmount,
        dueDate,
        status,
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        payments: {
          orderBy: {
            paymentDate: 'desc',
          },
        },
      },
    });
  }

  async addPayment(
    institutionId: string | null,
    feeId: string,
    dto: CreateFeePaymentDto,
  ) {
    const fee =
      await this.getFeeById(
        institutionId,
        feeId,
      );

    const paymentAmount =
      Number(dto.amount);

    const totalAmount =
      Number(fee.totalAmount);

    const paidAmount =
      Number(fee.paidAmount);

    const remainingAmount =
      Math.max(
        totalAmount - paidAmount,
        0,
      );

    if (paymentAmount > remainingAmount) {
      throw new BadRequestException(
        `Payment cannot exceed due amount of ${remainingAmount}`,
      );
    }

    if (paymentAmount <= 0) {
      throw new BadRequestException(
        'Payment amount must be greater than 0',
      );
    }

    const newPaidAmount =
      paidAmount + paymentAmount;

    const newDueAmount =
      Math.max(
        totalAmount - newPaidAmount,
        0,
      );

    const status =
      this.calculateStatus(
        totalAmount,
        newPaidAmount,
        fee.dueDate,
      );

    return this.prisma.$transaction(
      async (tx) => {
        const payment =
          await tx.feePayment.create({
            data: {
              feeId,
              amount: paymentAmount,
              paymentMethod:
                dto.paymentMethod,
              transactionId:
                dto.transactionId,
              note: dto.note,
            },
          });

        const updatedFee =
          await tx.studentFee.update({
            where: {
              id: feeId,
            },
            data: {
              paidAmount: newPaidAmount,
              dueAmount: newDueAmount,
              status,
            },
          });

        return {
          payment,
          fee: updatedFee,
        };
      },
    );
  }

  async getPaymentHistory(
    institutionId: string | null,
    feeId: string,
  ) {
    await this.getFeeById(
      institutionId,
      feeId,
    );

    return this.prisma.feePayment.findMany({
      where: {
        feeId,
      },
      orderBy: {
        paymentDate: 'desc',
      },
    });
  }

  async getPaymentReceipt(
    institutionId: string | null,
    feeId: string,
    paymentId: string,
  ) {
    if (!institutionId) {
      throw new ForbiddenException(
        'Institution not found',
      );
    }

    const payment =
      await this.prisma.feePayment.findFirst({
        where: {
          id: paymentId,
          feeId,
          fee: {
            student: {
              institutionId,
            },
          },
        },
        include: {
          fee: {
            include: {
              student: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  phone: true,
                },
              },
              class: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                },
              },
              section: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                },
              },
            },
          },
        },
      });

    if (!payment) {
      throw new NotFoundException(
        'Payment receipt not found',
      );
    }

    const receiptNumber =
      `BRX-FEE-${payment.id
        .replace(/-/g, '')
        .slice(0, 10)
        .toUpperCase()}`;

    return {
      receiptNumber,

      payment: {
        id: payment.id,
        amount: Number(payment.amount),
        paymentMethod: payment.paymentMethod,
        transactionId: payment.transactionId,
        note: payment.note,
        paymentDate: payment.paymentDate,
      },

      fee: {
        id: payment.fee.id,
        totalAmount: Number(
          payment.fee.totalAmount,
        ),
        paidAmount: Number(
          payment.fee.paidAmount,
        ),
        dueAmount: Number(
          payment.fee.dueAmount,
        ),
        dueDate: payment.fee.dueDate,
        status: payment.fee.status,
      },

      student: payment.fee.student,
      class: payment.fee.class,
      section: payment.fee.section,
    };
  }

  async getFeeSummary(
    institutionId: string | null,
  ) {
    if (!institutionId) {
      throw new ForbiddenException(
        'Institution not found',
      );
    }

    const fees =
      await this.prisma.studentFee.findMany({
        where: {
          student: {
            institutionId,
          },
        },
        select: {
          totalAmount: true,
          paidAmount: true,
          dueAmount: true,
          status: true,
        },
      });

    let totalAmount = 0;
    let paidAmount = 0;
    let dueAmount = 0;

    let pendingCount = 0;
    let partialCount = 0;
    let paidCount = 0;
    let overdueCount = 0;

    for (const fee of fees) {
      totalAmount += Number(
        fee.totalAmount,
      );

      paidAmount += Number(
        fee.paidAmount,
      );

      dueAmount += Number(
        fee.dueAmount,
      );

      if (fee.status === 'PENDING') {
        pendingCount++;
      }

      if (fee.status === 'PARTIAL') {
        partialCount++;
      }

      if (fee.status === 'PAID') {
        paidCount++;
      }

      if (fee.status === 'OVERDUE') {
        overdueCount++;
      }
    }

    return {
      totalRecords: fees.length,
      totalAmount,
      paidAmount,
      dueAmount,
      pendingCount,
      partialCount,
      paidCount,
      overdueCount,
    };
  }
    async generateFees(
    institutionId: string | null,
    dto: {
      feePlanId: string;
      dueDate: string;
      sectionId?: string;
      studentIds?: string[];
    },
  ) {
    if (!institutionId) {
      throw new BadRequestException(
        'Institution is required',
      );
    }

    const feePlan =
      await this.prisma.feePlan.findFirst({
        where: {
          id: dto.feePlanId,
          institutionId,
          isActive: true,
        },
      });

    if (!feePlan) {
      throw new NotFoundException(
        'Fee plan not found',
      );
    }

    const dueDate = new Date(dto.dueDate);

    if (Number.isNaN(dueDate.getTime())) {
      throw new BadRequestException(
        'Invalid due date',
      );
    }

    const enrollmentWhere = {
      classId: feePlan.classId,

      ...(dto.sectionId
        ? {
            sectionId: dto.sectionId,
          }
        : feePlan.sectionId
          ? {
              sectionId: feePlan.sectionId,
            }
          : {}),

      ...(dto.studentIds?.length
        ? {
            studentId: {
              in: dto.studentIds,
            },
          }
        : {}),

      student: {
        institutionId,
        role: 'STUDENT' as const,
      },
    };

    const enrollments =
      await this.prisma.studentEnrollment.findMany({
        where: enrollmentWhere,
        select: {
          studentId: true,
          classId: true,
          sectionId: true,
        },
      });

    if (enrollments.length === 0) {
      throw new NotFoundException(
        'No students found for this fee plan',
      );
    }

    const results = {
      created: 0,
      skipped: 0,
      fees: [] as unknown[],
    };

    for (const enrollment of enrollments) {
      const existingFee =
        await this.prisma.studentFee.findFirst({
          where: {
            studentId: enrollment.studentId,
            classId: enrollment.classId,
            sectionId: enrollment.sectionId,
            dueDate,
          },
        });

      if (existingFee) {
        results.skipped++;
        continue;
      }

      const fee =
        await this.prisma.studentFee.create({
          data: {
            studentId: enrollment.studentId,
            classId: enrollment.classId,
            sectionId: enrollment.sectionId,

            totalAmount: feePlan.amount,
            paidAmount: 0,
            dueAmount: feePlan.amount,

            dueDate,
            status: 'PENDING',
          },
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            class: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
            section: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        });

      results.created++;
      results.fees.push(fee);
    }

    return {
      message: 'Fees generated successfully',
      feePlanId: feePlan.id,
      planName: feePlan.name,
      amount: feePlan.amount,
      dueDate,
      totalStudents: enrollments.length,
      created: results.created,
      skipped: results.skipped,
      fees: results.fees,
    };
  }
}

