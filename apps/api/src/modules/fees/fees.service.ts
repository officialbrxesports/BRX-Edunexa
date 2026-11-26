import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';

export type AssignInput = {
  title?: string;
  classId?: string;
  sectionId?: string | null;
  amount?: number | string;
  dueDate?: string;
};

export type PayInput = {
  amount?: number | string;
  method?: string;
  transactionId?: string;
  note?: string;
};

const METHODS = ['CASH', 'UPI', 'CARD', 'BANK_TRANSFER', 'OTHER'] as const;
type Method = (typeof METHODS)[number];

const money = (value: unknown) => Math.round(Number(value) * 100) / 100;

const fullName = (first: string, last: string | null) =>
  [first, last].filter(Boolean).join(' ');

/** PAID / PARTIAL / OVERDUE / PENDING, worked out from the amounts and date. */
function effectiveStatus(paid: number, due: number, dueDate: Date) {
  if (due <= 0) return 'PAID';

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  if (dueDate < startOfToday) return 'OVERDUE';

  return paid > 0 ? 'PARTIAL' : 'PENDING';
}

@Injectable()
export class FeesService {
  constructor(private readonly prisma: PrismaService) {}

  async assertSchool(institutionId: string) {
    const institution = await this.prisma.institutions.findUnique({
      where: { id: institutionId },
      select: { type: true },
    });

    if (!institution || institution.type !== 'SCHOOL') {
      throw new ForbiddenException('Fees are available for schools only.');
    }
  }

  private row(item: {
    id: string;
    title: string | null;
    totalAmount: unknown;
    paidAmount: unknown;
    dueAmount: unknown;
    dueDate: Date;
    classes: { name: string };
    sections: { name: string };
    users: { id: string; firstName: string; lastName: string | null; brxUid: string };
  }) {
    const paid = money(item.paidAmount);
    const due = money(item.dueAmount);

    return {
      id: item.id,
      title: item.title || 'Fee',
      studentId: item.users.id,
      name: fullName(item.users.firstName, item.users.lastName),
      brxUid: item.users.brxUid,
      className: item.classes.name,
      sectionName: item.sections.name,
      total: money(item.totalAmount),
      paid,
      due,
      dueDate: item.dueDate,
      status: effectiveStatus(paid, due, item.dueDate),
    };
  }

  private readonly select = {
    id: true,
    title: true,
    totalAmount: true,
    paidAmount: true,
    dueAmount: true,
    dueDate: true,
    classes: { select: { name: true } },
    sections: { select: { name: true } },
    users: {
      select: { id: true, firstName: true, lastName: true, brxUid: true },
    },
  } as const;

  /** Give every active student of a class (or one section) a fee due. */
  async assign(institutionId: string, input: AssignInput) {
    await this.assertSchool(institutionId);

    const amount = money(input.amount);
    const dueDate = new Date(input.dueDate ?? '');
    const title = (input.title ?? '').trim().slice(0, 80) || 'Fee';

    if (!input.classId) throw new BadRequestException('Please choose a class.');

    if (!Number.isFinite(amount) || amount <= 0 || amount > 10000000) {
      throw new BadRequestException('Enter a fee amount greater than 0.');
    }

    if (Number.isNaN(dueDate.getTime())) {
      throw new BadRequestException('Choose a valid due date.');
    }

    const enrollments = await this.prisma.student_enrollments.findMany({
      where: {
        classId: input.classId,
        ...(input.sectionId ? { sectionId: input.sectionId } : {}),
        classes: { institutionId },
        users: { institutionId, role: 'STUDENT', status: 'ACTIVE' },
      },
      select: { studentId: true, classId: true, sectionId: true },
    });

    if (enrollments.length === 0) {
      throw new BadRequestException('No active student found in this class.');
    }

    const now = new Date();

    await this.prisma.student_fees.createMany({
      data: enrollments.map((item) => ({
        id: randomUUID(),
        studentId: item.studentId,
        classId: item.classId,
        sectionId: item.sectionId,
        title,
        totalAmount: amount,
        paidAmount: 0,
        dueAmount: amount,
        dueDate,
        status: 'PENDING' as const,
        createdAt: now,
        updatedAt: now,
      })),
    });

    return { created: enrollments.length };
  }

  async summary(institutionId: string) {
    await this.assertSchool(institutionId);

    const rows = await this.prisma.student_fees.findMany({
      where: { classes: { institutionId } },
      select: this.select,
    });

    const items = rows.map((item) => this.row(item));
    const sum = (list: typeof items, key: 'total' | 'paid' | 'due') =>
      money(list.reduce((total, item) => total + item[key], 0));

    const classes = new Map<string, typeof items>();

    for (const item of items) {
      classes.set(item.className, [...(classes.get(item.className) ?? []), item]);
    }

    return {
      totals: {
        billed: sum(items, 'total'),
        collected: sum(items, 'paid'),
        due: sum(items, 'due'),
        overdueCount: items.filter((item) => item.status === 'OVERDUE').length,
        studentsWithDues: new Set(
          items.filter((item) => item.due > 0).map((item) => item.studentId),
        ).size,
      },
      classes: [...classes.entries()]
        .map(([className, list]) => ({
          className,
          billed: sum(list, 'total'),
          collected: sum(list, 'paid'),
          due: sum(list, 'due'),
        }))
        .sort((a, b) => a.className.localeCompare(b.className)),
    };
  }

  async list(
    institutionId: string,
    filters: { classId?: string; status?: string; q?: string },
  ) {
    await this.assertSchool(institutionId);

    const q = (filters.q ?? '').trim();
    const rows = await this.prisma.student_fees.findMany({
      where: {
        classes: { institutionId },
        ...(filters.classId ? { classId: filters.classId } : {}),
        ...(q
          ? {
              users: {
                OR: [
                  { firstName: { contains: q, mode: 'insensitive' as const } },
                  { lastName: { contains: q, mode: 'insensitive' as const } },
                  { brxUid: { contains: q, mode: 'insensitive' as const } },
                ],
              },
            }
          : {}),
      },
      orderBy: { dueDate: 'asc' },
      take: 500,
      select: this.select,
    });

    const items = rows.map((item) => this.row(item));

    return filters.status
      ? items.filter((item) => item.status === filters.status)
      : items;
  }

  async pay(institutionId: string, id: string, input: PayInput) {
    await this.assertSchool(institutionId);

    const fee = await this.prisma.student_fees.findFirst({
      where: { id, classes: { institutionId } },
      select: { id: true, totalAmount: true, paidAmount: true, dueAmount: true },
    });

    if (!fee) throw new NotFoundException('Fee not found.');

    const amount = money(input.amount);
    const due = money(fee.dueAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException('Enter an amount greater than 0.');
    }

    if (amount > due) {
      throw new BadRequestException(`Amount is more than the due (${due}).`);
    }

    const method = (input.method ?? 'CASH') as Method;

    if (!METHODS.includes(method)) {
      throw new BadRequestException('Invalid payment method.');
    }

    const paid = money(Number(fee.paidAmount) + amount);
    const left = money(Number(fee.totalAmount) - paid);
    const now = new Date();

    await this.prisma.$transaction([
      this.prisma.fee_payments.create({
        data: {
          id: randomUUID(),
          feeId: fee.id,
          amount,
          paymentMethod: method,
          paymentDate: now,
          transactionId: input.transactionId?.trim() || null,
          note: input.note?.trim() || null,
          createdAt: now,
          updatedAt: now,
        },
      }),
      this.prisma.student_fees.update({
        where: { id: fee.id },
        data: {
          paidAmount: paid,
          dueAmount: left,
          status: left <= 0 ? 'PAID' : 'PARTIAL',
          updatedAt: now,
        },
      }),
    ]);

    return { paid, due: left };
  }

  /**
   * Send a due reminder to the parents of every student with a pending fee
   * (the student gets it when no parent is linked). Optionally overdue only.
   */
  async remind(
    institutionId: string,
    senderId: string,
    input: { classId?: string; overdueOnly?: boolean },
  ) {
    await this.assertSchool(institutionId);

    const rows = await this.prisma.student_fees.findMany({
      where: {
        classes: { institutionId },
        dueAmount: { gt: 0 },
        ...(input.classId ? { classId: input.classId } : {}),
      },
      select: this.select,
    });

    const dues = rows
      .map((item) => this.row(item))
      .filter((item) => !input.overdueOnly || item.status === 'OVERDUE');

    if (dues.length === 0) {
      throw new BadRequestException('No pending fee found for this choice.');
    }

    const links = await this.prisma.parent_students.findMany({
      where: {
        institutionId,
        studentId: { in: [...new Set(dues.map((item) => item.studentId))] },
        parent: { status: 'ACTIVE' },
      },
      select: { studentId: true, parentId: true },
    });

    const now = new Date();
    const data: {
      id: string;
      institutionId: string;
      senderId: string;
      recipientId: string;
      title: string;
      message: string;
      type: 'ANNOUNCEMENT';
      createdAt: Date;
      updatedAt: Date;
    }[] = [];

    for (const item of dues) {
      const recipients = links
        .filter((link) => link.studentId === item.studentId)
        .map((link) => link.parentId);
      const targets = recipients.length > 0 ? recipients : [item.studentId];
      const when = new Date(item.dueDate).toLocaleDateString('en-IN');
      const message =
        item.status === 'OVERDUE'
          ? `${item.title}: ₹${item.due} for ${item.name} was due on ${when}. Please pay at the school office.`
          : `${item.title}: ₹${item.due} for ${item.name} is due on ${when}.`;

      for (const recipientId of targets) {
        data.push({
          id: randomUUID(),
          institutionId,
          senderId,
          recipientId,
          title: 'Fee reminder',
          message,
          type: 'ANNOUNCEMENT',
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    if (data.length > 5000) {
      throw new BadRequestException('Too many reminders at once. Choose a class.');
    }

    await this.prisma.notifications.createMany({ data });

    return { sent: data.length, students: dues.length };
  }

  /** Payments received against one fee (newest first), for history and receipts. */
  async payments(institutionId: string, id: string) {
    await this.assertSchool(institutionId);

    const fee = await this.prisma.student_fees.findFirst({
      where: { id, classes: { institutionId } },
      select: {
        ...this.select,
        fee_payments: { orderBy: { paymentDate: 'desc' } },
      },
    });

    if (!fee) throw new NotFoundException('Fee not found.');

    const institution = await this.prisma.institutions.findUnique({
      where: { id: institutionId },
      select: { name: true },
    });

    return {
      institution: institution?.name ?? '',
      fee: this.row(fee),
      payments: fee.fee_payments.map((item) => ({
        id: item.id,
        amount: money(item.amount),
        method: item.paymentMethod,
        date: item.paymentDate,
        transactionId: item.transactionId,
        note: item.note,
      })),
    };
  }

  async remove(institutionId: string, id: string) {
    await this.assertSchool(institutionId);

    const fee = await this.prisma.student_fees.findFirst({
      where: { id, classes: { institutionId } },
      select: { id: true, paidAmount: true },
    });

    if (!fee) throw new NotFoundException('Fee not found.');

    if (Number(fee.paidAmount) > 0) {
      throw new BadRequestException(
        'A fee with payments cannot be deleted.',
      );
    }

    await this.prisma.student_fees.delete({ where: { id: fee.id } });

    return { id: fee.id };
  }

  /** Fees of a student (own) or of a parent's children. */
  async mine(user: { id: string; role: string; institutionId: string }) {
    let students: { id: string; name: string }[] = [];

    if (user.role === 'STUDENT') {
      const me = await this.prisma.users.findUnique({
        where: { id: user.id },
        select: { id: true, firstName: true, lastName: true },
      });

      if (me) students = [{ id: me.id, name: fullName(me.firstName, me.lastName) }];
    } else if (user.role === 'PARENT') {
      const links = await this.prisma.parent_students.findMany({
        where: { parentId: user.id, institutionId: user.institutionId },
        select: {
          student: { select: { id: true, firstName: true, lastName: true } },
        },
      });

      students = links.map((link) => ({
        id: link.student.id,
        name: fullName(link.student.firstName, link.student.lastName),
      }));
    } else {
      throw new ForbiddenException('Only students and parents can use this.');
    }

    if (students.length === 0) return { students: [] };

    const rows = await this.prisma.student_fees.findMany({
      where: {
        studentId: { in: students.map((item) => item.id) },
        classes: { institutionId: user.institutionId },
      },
      orderBy: { dueDate: 'asc' },
      select: this.select,
    });

    const items = rows.map((item) => this.row(item));

    return {
      students: students.map((student) => {
        const fees = items.filter((item) => item.studentId === student.id);

        return {
          id: student.id,
          name: student.name,
          totalDue: money(fees.reduce((total, item) => total + item.due, 0)),
          fees: fees.map((item) => ({
            id: item.id,
            title: item.title,
            total: item.total,
            paid: item.paid,
            due: item.due,
            dueDate: item.dueDate,
            status: item.status,
          })),
        };
      }),
    };
  }
}
