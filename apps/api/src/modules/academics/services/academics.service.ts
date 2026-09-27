import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'; 

import { PrismaService } from '../../../database/prisma.service';

import { CreateClassDto } from '../dto/create-class.dto';
import { CreateSectionDto } from '../dto/create-section.dto';
import { CreateEnrollmentDto } from '../dto/create-enrollment.dto';
import { CreateAttendanceDto } from '../dto/create-attendance.dto';

@Injectable()
export class AcademicsService {
  constructor(private readonly prisma: PrismaService) {}

  async createClass(
    institutionId: string,
    dto: CreateClassDto,
  ) {
    const existingClass = await this.prisma.class.findUnique({
      where: {
        institutionId_code: {
          institutionId,
          code: dto.code,
        },
      },
    });

    if (existingClass) {
      throw new ConflictException(
        'A class with this code already exists in this institution',
      );
    }

    const institution = await this.prisma.institution.findUnique({
      where: {
        id: institutionId,
      },
    });

    if (!institution) {
      throw new NotFoundException(
        'Institution not found',
      );
    }

    return this.prisma.class.create({
      data: {
        name: dto.name,
        code: dto.code,
        institutionId,
      },
    });
  }

  async findClasses(institutionId: string) {
    return this.prisma.class.findMany({
      where: {
        institutionId,
      },
      include: {
        sections: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findClass(
    institutionId: string,
    classId: string,
  ) {
    const classRecord = await this.prisma.class.findFirst({
      where: {
        id: classId,
        institutionId,
      },
      include: {
        sections: true,
      },
    });

    if (!classRecord) {
      throw new NotFoundException(
        'Class not found',
      );
    }

    return classRecord;
  }

  async deleteClass(
    institutionId: string,
    classId: string,
  ) {
    const classRecord = await this.prisma.class.findFirst({
      where: {
        id: classId,
        institutionId,
      },
    });

    if (!classRecord) {
      throw new NotFoundException(
        'Class not found',
      );
    }

    await this.prisma.class.delete({
      where: {
        id: classId,
      },
    });

    return {
      message: 'Class deleted successfully',
    };
  }

  async createSection(
    institutionId: string,
    classId: string,
    dto: CreateSectionDto,
  ) {
    const classRecord = await this.prisma.class.findFirst({
      where: {
        id: classId,
        institutionId,
      },
    });

    if (!classRecord) {
      throw new NotFoundException(
        'Class not found',
      );
    }

    const existingSection =
      await this.prisma.section.findUnique({
        where: {
          classId_code: {
            classId,
            code: dto.code,
          },
        },
      });

    if (existingSection) {
      throw new ConflictException(
        'A section with this code already exists in this class',
      );
    }

    return this.prisma.section.create({
      data: {
        name: dto.name,
        code: dto.code,
        classId,
      },
    });
  }

  async findSections(
    institutionId: string,
    classId: string,
  ) {
    const classRecord = await this.prisma.class.findFirst({
      where: {
        id: classId,
        institutionId,
      },
    });

    if (!classRecord) {
      throw new NotFoundException(
        'Class not found',
      );
    }

    return this.prisma.section.findMany({
      where: {
        classId,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async deleteSection(
    institutionId: string,
    sectionId: string,
  ) {
    const section = await this.prisma.section.findFirst({
      where: {
        id: sectionId,
        class: {
          institutionId,
        },
      },
    });

    if (!section) {
      throw new NotFoundException(
        'Section not found',
      );
    }

    await this.prisma.section.delete({
      where: {
        id: sectionId,
      },
    });

        return {
      message: 'Section deleted successfully',
    };
  }

  async createStudentEnrollment(
    institutionId: string,
    dto: CreateEnrollmentDto,
  ) {
    const student = await this.prisma.user.findFirst({
      where: {
        id: dto.studentId,
        institutionId,
        role: 'STUDENT',
      },
    });

    if (!student) {
      throw new NotFoundException(
        'Student not found in this institution',
      );
    }

    const classRecord = await this.prisma.class.findFirst({
      where: {
        id: dto.classId,
        institutionId,
      },
    });

    if (!classRecord) {
      throw new NotFoundException(
        'Class not found in this institution',
      );
    }

    const section = await this.prisma.section.findFirst({
      where: {
        id: dto.sectionId,
        classId: dto.classId,
      },
    });

    if (!section) {
      throw new NotFoundException(
        'Section not found for this class',
      );
    }

    const existingEnrollment =
      await this.prisma.studentEnrollment.findFirst({
        where: {
          studentId: dto.studentId,
          classId: dto.classId,
          sectionId: dto.sectionId,
        },
      });

    if (existingEnrollment) {
      throw new ConflictException(
        'Student is already enrolled in this class and section',
      );
    }

    return this.prisma.studentEnrollment.create({
      data: {
        studentId: dto.studentId,
        classId: dto.classId,
        sectionId: dto.sectionId,
      },
      include: {
        student: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        class: true,
        section: true,
      },
    });
  }

  async findStudentEnrollment(
    institutionId: string,
    studentId: string,
  ) {
    const student = await this.prisma.user.findFirst({
      where: {
        id: studentId,
        institutionId,
        role: 'STUDENT',
      },
    });

    if (!student) {
      throw new NotFoundException(
        'Student not found in this institution',
      );
    }

    return this.prisma.studentEnrollment.findMany({
      where: {
        studentId,
        class: {
          institutionId,
        },
      },
      include: {
        class: true,
        section: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findSectionStudents(
  institutionId: string,
  classId: string,
  sectionId: string,
) {
  const section = await this.prisma.section.findFirst({
    where: {
      id: sectionId,
      classId,
      class: {
        institutionId,
      },
    },
  });

  if (!section) {
    throw new NotFoundException(
      'Section not found in this institution',
    );
  }

  return this.prisma.studentEnrollment.findMany({
    where: {
      classId,
      sectionId,
      student: {
        institutionId,
        role: 'STUDENT',
      },
    },
    include: {
      student: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      },
    },
    orderBy: {
      student: {
        firstName: 'asc',
      },
    },
  });
}

  async deleteStudentEnrollment(
    institutionId: string,
    enrollmentId: string,
  ) {
    const enrollment =
      await this.prisma.studentEnrollment.findFirst({
        where: {
          id: enrollmentId,
          class: {
            institutionId,
          },
        },
      });

    if (!enrollment) {
      throw new NotFoundException(
        'Student enrollment not found',
      );
    }

    await this.prisma.studentEnrollment.delete({
      where: {
        id: enrollmentId,
      },
    });

       return {
      message: 'Student enrollment deleted successfully',
    };
  }

      async createAttendance(
      institutionId: string,
      markedBy: string,
      dto: CreateAttendanceDto,
    ) {
      const student = await this.prisma.user.findFirst({
        where: {
          id: dto.studentId,
          institutionId,
          role: 'STUDENT',
        },
      });

      const marker = await this.prisma.user.findFirst({
        where: {
          id: markedBy,
          institutionId,
        },
        select: {
          id: true,
          role: true,
        },
      });

      if (!marker) {
        throw new ForbiddenException(
          'You are not authorized to mark attendance',
        );
      }

      if (marker.role === 'TEACHER') {
        const assignment =
          await this.prisma.teacherStudent.findUnique({
            where: {
              teacherId_studentId: {
                teacherId: markedBy,
                studentId: dto.studentId,
              },
            },
          });

        if (!assignment) {
          throw new ForbiddenException(
            'Teacher is not assigned to this student',
          );
        }
      }

      if (
        marker.role !== 'HEAD' &&
        marker.role !== 'STAFF' &&
        marker.role !== 'TEACHER'
      ) {
        throw new ForbiddenException(
          'You are not authorized to mark attendance',
        );
      }

      if (!student) {
        throw new NotFoundException(
          'Student not found in this institution',
        );
      }

      const classRecord = await this.prisma.class.findFirst({
        where: {
          id: dto.classId,
          institutionId,
        },
      });

      if (!classRecord) {
        throw new NotFoundException(
          'Class not found in this institution',
        );
      }

      const section = await this.prisma.section.findFirst({
        where: {
          id: dto.sectionId,
          classId: dto.classId,
        },
      });

      if (!section) {
        throw new NotFoundException(
          'Section not found for this class',
        );
      }

      const attendanceDate = new Date(dto.date);

      if (Number.isNaN(attendanceDate.getTime())) {
        throw new BadRequestException(
          'Invalid attendance date',
        );
      }

      const existingAttendance =
        await this.prisma.attendance.findFirst({
          where: {
            studentId: dto.studentId,
            classId: dto.classId,
            sectionId: dto.sectionId,
            date: attendanceDate,
          },
        });

      // Attendance already exists → update it
      if (existingAttendance) {
        return this.prisma.attendance.update({
          where: {
            id: existingAttendance.id,
          },
          data: {
            status: dto.status,
            markedBy,
          },
          include: {
            student: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
              },
            },
            class: true,
            section: true,
          },
        });
      }

      // Attendance doesn't exist → create it
      return this.prisma.attendance.create({
        data: {
          studentId: dto.studentId,
          classId: dto.classId,
          sectionId: dto.sectionId,
          markedBy,
          date: attendanceDate,
          status: dto.status,
        },
        include: {
          student: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
          class: true,
          section: true,
        },
      });
    }

  async findStudentAttendance(
    institutionId: string,
    studentId: string,
  ) {
    const student = await this.prisma.user.findFirst({
      where: {
        id: studentId,
        institutionId,
        role: 'STUDENT',
      },
    });

    if (!student) {
      throw new NotFoundException(
        'Student not found in this institution',
      );
    }

    return this.prisma.attendance.findMany({
      where: {
        studentId,
        class: {
          institutionId,
        },
      },
      include: {
        class: true,
        section: true,
      },
      orderBy: {
        date: 'desc',
      },
    });

  }

    async findSectionAttendance(
  institutionId: string,
  classId: string,
  sectionId: string,
  date?: string,
) {
  const section = await this.prisma.section.findFirst({
    where: {
      id: sectionId,
      classId,
      class: {
        institutionId,
      },
    },
  });

  if (!section) {
    throw new NotFoundException(
      'Section not found in this institution',
    );
  }

  const where: {
    classId: string;
    sectionId: string;
    date?: Date;
  } = {
    classId,
    sectionId,
  };

  if (date) {
    const attendanceDate = new Date(date);

    if (Number.isNaN(attendanceDate.getTime())) {
      throw new BadRequestException(
        'Invalid attendance date',
      );
    }

    where.date = attendanceDate;
  }

  return this.prisma.attendance.findMany({
    where,
    include: {
      student: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      },
      class: true,
      section: true,
    },
    orderBy: {
      student: {
        firstName: 'asc',
      },
    },
  });

}

  async getMonthlyAttendanceReport(
  institutionId: string,
  classId: string,
  sectionId: string,
  month: string,
) {
  const section = await this.prisma.section.findFirst({
    where: {
      id: sectionId,
      classId,
      class: {
        institutionId,
      },
    },
  });

  if (!section) {
    throw new NotFoundException(
      'Section not found in this institution',
    );
  }

  if (!/^\d{4}-\d{2}$/.test(month)) {
    throw new BadRequestException(
      'Invalid month. Use YYYY-MM format.',
    );
  }

  const [year, monthNumber] = month
    .split('-')
    .map(Number);

  const startDate = new Date(
    Date.UTC(year, monthNumber - 1, 1),
  );

  const endDate = new Date(
    Date.UTC(year, monthNumber, 1),
  );

  const attendance =
    await this.prisma.attendance.findMany({
      where: {
        classId,
        sectionId,
        date: {
          gte: startDate,
          lt: endDate,
        },
      },
      include: {
        student: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        student: {
          firstName: 'asc',
        },
      },
    });

  const studentMap = new Map<
    string,
    {
      student: {
        id: string;
        email: string;
        firstName: string;
        lastName: string | null;
      };
      present: number;
      absent: number;
      late: number;
      total: number;
    }
  >();

  for (const record of attendance) {
    const existing = studentMap.get(
      record.studentId,
    );

    if (!existing) {
      studentMap.set(record.studentId, {
        student: record.student,
        present:
          record.status === 'PRESENT' ? 1 : 0,
        absent:
          record.status === 'ABSENT' ? 1 : 0,
        late:
          record.status === 'LATE' ? 1 : 0,
        total: 1,
      });

      continue;
    }

    existing.total += 1;

    if (record.status === 'PRESENT') {
      existing.present += 1;
    }

    if (record.status === 'ABSENT') {
      existing.absent += 1;
    }

    if (record.status === 'LATE') {
      existing.late += 1;
    }
  }

  const students = Array.from(
    studentMap.values(),
  ).map((item) => ({
    ...item,
    attendancePercentage:
      item.total === 0
        ? 0
        : Number(
            (
              (item.present / item.total) *
              100
            ).toFixed(2),
          ),
  }));

        const totalPresent = attendance.filter(
          (item) => item.status === 'PRESENT',
        ).length;

        const totalAbsent = attendance.filter(
          (item) => item.status === 'ABSENT',
        ).length;

        const totalLate = attendance.filter(
          (item) => item.status === 'LATE',
        ).length;

        const totalMarked = attendance.length;

    return {
    month,
    classId,
    sectionId,
    summary: {
      totalMarked,
      present: totalPresent,
      absent: totalAbsent,
      late: totalLate,
      attendancePercentage:
        totalMarked === 0
          ? 0
          : Number(
              (
                (totalPresent / totalMarked) *
                100
              ).toFixed(2),
            ),
    },
    students,
  };
}
}