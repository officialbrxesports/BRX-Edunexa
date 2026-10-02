import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(institutionId: string) {
    const [
      students,
      teachers,
      staff,
      classes,
      activeStudents,
      activeTeachers,
      activeStaff,
      feeRecords,
      payments,
      todayAttendance,
    ] = await Promise.all([
      this.prisma.user.count({
        where: {
          institutionId,
          role: 'STUDENT',
        },
      }),

      this.prisma.user.count({
        where: {
          institutionId,
          role: 'TEACHER',
        },
      }),

      this.prisma.user.count({
        where: {
          institutionId,
          role: 'STAFF',
        },
      }),

      this.prisma.class.count({
        where: {
          institutionId,
        },
      }),

      this.prisma.user.count({
        where: {
          institutionId,
          role: 'STUDENT',
          status: 'ACTIVE',
        },
      }),

      this.prisma.user.count({
        where: {
          institutionId,
          role: 'TEACHER',
          status: 'ACTIVE',
        },
      }),

      this.prisma.user.count({
        where: {
          institutionId,
          role: 'STAFF',
          status: 'ACTIVE',
        },
      }),

      this.prisma.studentFee.findMany({
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
      }),

      this.prisma.feePayment.findMany({
        where: {
          fee: {
            student: {
              institutionId,
            },
          },

        },
        select: {
          amount: true,
          paymentDate: true,
        },
      }),

      this.prisma.attendance.findMany({
        where: {
          student: {
            institutionId,
          },
          date: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
        select: {
          status: true,
        },
      }),
    ]);

    const totalFees = feeRecords.reduce(
      (sum, fee) => sum + Number(fee.totalAmount),
      0,
    );

    const collectedFees = feeRecords.reduce(
      (sum, fee) => sum + Number(fee.paidAmount),
      0,
    );

    const pendingFees = feeRecords.reduce(
      (sum, fee) => sum + Number(fee.dueAmount),
      0,
    );

    const todayCollection = payments
      .filter((payment) => {
        const date = new Date(payment.paymentDate);
        const today = new Date();

        return (
          date.getFullYear() === today.getFullYear() &&
          date.getMonth() === today.getMonth() &&
          date.getDate() === today.getDate()
        );
      })
      .reduce(
        (sum, payment) => sum + Number(payment.amount),
        0,
      );

    const attendanceTotal = todayAttendance.length;

    const attendancePresent = todayAttendance.filter(
      (item) =>
        String(item.status).toUpperCase() === 'PRESENT',
    ).length;

    const attendanceAbsent = todayAttendance.filter(
      (item) =>
        String(item.status).toUpperCase() === 'ABSENT',
    ).length;

    const attendancePercentage =
      attendanceTotal > 0
        ? Number(
            (
              (attendancePresent / attendanceTotal) *
              100
            ).toFixed(2),
          )
        : 0;

    return {
      people: {
        students,
        teachers,
        staff,
        totalUsers: students + teachers + staff,
      },

      active: {
        students: activeStudents,
        teachers: activeTeachers,
        staff: activeStaff,
      },

      academics: {
        classes,
      },

      fees: {
        totalFees,
        collectedFees,
        pendingFees,
        todayCollection,
        feeRecords: feeRecords.length,
      },

      attendance: {
        total: attendanceTotal,
        present: attendancePresent,
        absent: attendanceAbsent,
        percentage: attendancePercentage,
      },

      generatedAt: new Date().toISOString(),
    };
  }
}

