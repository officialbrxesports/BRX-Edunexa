import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { gradeFor } from '../../common/grading';
import { PrismaService } from '../../prisma/prisma.service';

export type DepartmentInput = {
  name?: string;
  code?: string;
  hodId?: string | null;
  facultyId?: string | null;
};

export type FacultyInput = {
  name?: string;
  code?: string;
  deanId?: string | null;
};

export type ResultRow = { studentId?: string; marks?: number | string | null };

export type ProgramInput = {
  departmentId?: string;
  name?: string;
  code?: string;
  semesters?: number | string;
  isActive?: boolean;
};

export type CourseInput = {
  programId?: string;
  semester?: number | string;
  code?: string;
  title?: string;
  credits?: number | string;
};

export type EnrollmentInput = {
  programId?: string;
  semester?: number | string;
  rollNo?: string;
};

const isDuplicate = (error: unknown) =>
  (error as { code?: string })?.code === 'P2002';

@Injectable()
export class CollegeService {
  constructor(private readonly prisma: PrismaService) {}

  /** College tools exist only for colleges and universities. */
  async assertCollege(institutionId: string) {
    const institution = await this.prisma.institutions.findUnique({
      where: { id: institutionId },
      select: { type: true },
    });

    if (
      !institution ||
      (institution.type !== 'COLLEGE' && institution.type !== 'UNIVERSITY')
    ) {
      throw new ForbiddenException(
        'This feature is only available for colleges and universities.',
      );
    }

    return institution.type;
  }

  private async assertUniversity(institutionId: string) {
    const type = await this.assertCollege(institutionId);

    if (type !== 'UNIVERSITY') {
      throw new ForbiddenException('Faculties exist only in universities.');
    }
  }

  private async checkFaculty(
    institutionId: string,
    type: string,
    facultyId: string | null | undefined,
  ) {
    if (!facultyId) return null;

    if (type !== 'UNIVERSITY') {
      throw new BadRequestException('Faculties exist only in universities.');
    }

    const faculty = await this.prisma.faculties.findFirst({
      where: { id: facultyId, institutionId },
      select: { id: true },
    });

    if (!faculty) throw new BadRequestException('The chosen faculty was not found.');

    return faculty.id;
  }

  private name(first: string, last: string | null) {
    return [first, last].filter(Boolean).join(' ');
  }

  private text(value: string | undefined, max: number, label: string) {
    const cleaned = value?.trim() || null;

    if (cleaned && cleaned.length > max) {
      throw new BadRequestException(`${label} is too long.`);
    }

    return cleaned;
  }

  private required(value: string | undefined, max: number, label: string) {
    const cleaned = this.text(value, max, label);

    if (!cleaned) {
      throw new BadRequestException(`${label} is required.`);
    }

    return cleaned;
  }

  private code(value: string | undefined, fallback: string, label: string) {
    const raw = this.text(value, 30, label) ?? fallback;

    return raw
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 30);
  }

  private whole(
    value: number | string | undefined,
    min: number,
    max: number,
    label: string,
  ) {
    const number = Number(value);

    if (!Number.isInteger(number) || number < min || number > max) {
      throw new BadRequestException(
        `${label} must be a whole number from ${min} to ${max}.`,
      );
    }

    return number;
  }

  private async findProgram(institutionId: string, id: string | undefined) {
    const program = id
      ? await this.prisma.programs.findFirst({
          where: { id, institutionId },
          select: { id: true, semesters: true },
        })
      : null;

    if (!program) throw new NotFoundException('Program not found.');

    return program;
  }

  private async checkHod(institutionId: string, hodId: string | null | undefined) {
    if (!hodId) return null;

    const teacher = await this.prisma.users.findFirst({
      where: { id: hodId, institutionId, role: 'TEACHER', status: 'ACTIVE' },
      select: { id: true },
    });

    if (!teacher) {
      throw new BadRequestException('The chosen head of department was not found.');
    }

    return teacher.id;
  }

  /* ------------------------------- summary ------------------------------- */

  async summary(institutionId: string) {
    const type = await this.assertCollege(institutionId);

    const [
      departments,
      programs,
      enrolled,
      teachers,
      allStudents,
      byDepartment,
      admissionGroups,
      recentApplications,
    ] = await Promise.all([
        this.prisma.departments.count({ where: { institutionId } }),
        this.prisma.programs.count({ where: { institutionId, isActive: true } }),
        this.prisma.program_students.count({
          where: { institutionId, student: { status: 'ACTIVE' } },
        }),
        this.prisma.users.count({
          where: { institutionId, role: 'TEACHER', status: 'ACTIVE' },
        }),
        this.prisma.users.count({
          where: { institutionId, role: 'STUDENT', status: 'ACTIVE' },
        }),
        this.prisma.departments.findMany({
          where: { institutionId },
          orderBy: { name: 'asc' },
          select: {
            id: true,
            name: true,
            code: true,
            programs: {
              select: {
                _count: { select: { students: true } },
              },
            },
          },
        }),
        this.prisma.college_applications.groupBy({
          by: ['status'],
          where: { institutionId },
          _count: { _all: true },
        }),
        this.prisma.college_applications.findMany({
          where: { institutionId },
          orderBy: { createdAt: 'desc' },
          take: 6,
          select: {
            id: true,
            applicationNumber: true,
            status: true,
            firstName: true,
            lastName: true,
            program: { select: { name: true } },
          },
        }),
    ]);

    const byStatus: Record<string, number> = {};

    for (const group of admissionGroups) {
      byStatus[group.status] = group._count._all;
    }

    const faculties =
      type === 'UNIVERSITY'
        ? await this.prisma.faculties.findMany({
            where: { institutionId },
            orderBy: { name: 'asc' },
            select: {
              id: true,
              name: true,
              code: true,
              departments: {
                select: {
                  programs: { select: { _count: { select: { students: true } } } },
                },
              },
            },
          })
        : undefined;

    return {
      type,
      faculties: faculties?.map((faculty) => ({
        id: faculty.id,
        name: faculty.name,
        code: faculty.code,
        departments: faculty.departments.length,
        students: faculty.departments.reduce(
          (sum, department) =>
            sum +
            department.programs.reduce(
              (inner, program) => inner + program._count.students,
              0,
            ),
          0,
        ),
      })),
      admissions: {
        byStatus,
        total: Object.values(byStatus).reduce((sum, n) => sum + n, 0),
        recent: recentApplications.map((item) => ({
          id: item.id,
          applicationNumber: item.applicationNumber,
          status: item.status,
          name: [item.firstName, item.lastName].filter(Boolean).join(' '),
          programName: item.program.name,
        })),
      },
      counts: {
        faculties: faculties?.length,
        departments,
        programs,
        studentsEnrolled: enrolled,
        studentsWithoutProgram: Math.max(0, allStudents - enrolled),
        teachers,
      },
      departments: byDepartment.map((department) => ({
        id: department.id,
        name: department.name,
        code: department.code,
        programs: department.programs.length,
        students: department.programs.reduce(
          (sum, program) => sum + program._count.students,
          0,
        ),
      })),
    };
  }

  async peopleOptions(institutionId: string) {
    await this.assertCollege(institutionId);

    const teachers = await this.prisma.users.findMany({
      where: { institutionId, role: 'TEACHER', status: 'ACTIVE' },
      orderBy: { firstName: 'asc' },
      select: { id: true, firstName: true, lastName: true, brxUid: true },
    });

    return {
      teachers: teachers.map((teacher) => ({
        id: teacher.id,
        name: this.name(teacher.firstName, teacher.lastName),
        brxUid: teacher.brxUid,
      })),
    };
  }

  /* ----------------------------- departments ----------------------------- */

  async listDepartments(institutionId: string) {
    await this.assertCollege(institutionId);

    const rows = await this.prisma.departments.findMany({
      where: { institutionId },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        code: true,
        hodId: true,
        facultyId: true,
        faculty: { select: { name: true } },
        hod: { select: { firstName: true, lastName: true } },
        programs: { select: { id: true } },
      },
    });

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      code: row.code,
      hodId: row.hodId,
      facultyId: row.facultyId,
      facultyName: row.faculty?.name ?? null,
      hodName: row.hod ? this.name(row.hod.firstName, row.hod.lastName) : null,
      programCount: row.programs.length,
    }));
  }

  async createDepartment(institutionId: string, input: DepartmentInput) {
    const type = await this.assertCollege(institutionId);

    const name = this.required(input.name, 120, 'Department name');
    const hodId = await this.checkHod(institutionId, input.hodId);
    const facultyId = await this.checkFaculty(institutionId, type, input.facultyId);

    try {
      const created = await this.prisma.departments.create({
        data: {
          id: randomUUID(),
          institutionId,
          name,
          code: this.code(input.code, name, 'Department code'),
          hodId,
          facultyId,
          updatedAt: new Date(),
        },
        select: { id: true },
      });

      return { success: true, id: created.id };
    } catch (error) {
      if (isDuplicate(error)) {
        throw new ConflictException('A department with this code already exists.');
      }

      throw error;
    }
  }

  async updateDepartment(
    institutionId: string,
    id: string,
    input: DepartmentInput,
  ) {
    const type = await this.assertCollege(institutionId);

    const existing = await this.prisma.departments.findFirst({
      where: { id, institutionId },
      select: { id: true },
    });

    if (!existing) throw new NotFoundException('Department not found.');

    const data: {
      name?: string;
      hodId?: string | null;
      facultyId?: string | null;
      updatedAt: Date;
    } = {
      updatedAt: new Date(),
    };

    if (input.name !== undefined) {
      data.name = this.required(input.name, 120, 'Department name');
    }

    if (input.hodId !== undefined) {
      data.hodId = await this.checkHod(institutionId, input.hodId);
    }

    if (input.facultyId !== undefined) {
      data.facultyId = await this.checkFaculty(institutionId, type, input.facultyId);
    }

    await this.prisma.departments.update({ where: { id }, data });

    return { success: true, id };
  }

  /* ------------------------------- faculties ------------------------------- */

  async listFaculties(institutionId: string) {
    await this.assertUniversity(institutionId);

    const rows = await this.prisma.faculties.findMany({
      where: { institutionId },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        code: true,
        deanId: true,
        dean: { select: { firstName: true, lastName: true } },
        departments: { select: { id: true } },
      },
    });

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      code: row.code,
      deanId: row.deanId,
      deanName: row.dean ? this.name(row.dean.firstName, row.dean.lastName) : null,
      departmentCount: row.departments.length,
    }));
  }

  async createFaculty(institutionId: string, input: FacultyInput) {
    await this.assertUniversity(institutionId);

    const name = this.required(input.name, 120, 'Faculty name');
    const deanId = await this.checkHod(institutionId, input.deanId);

    try {
      const created = await this.prisma.faculties.create({
        data: {
          id: randomUUID(),
          institutionId,
          name,
          code: this.code(input.code, name, 'Faculty code'),
          deanId,
          updatedAt: new Date(),
        },
        select: { id: true },
      });

      return { success: true, id: created.id };
    } catch (error) {
      if (isDuplicate(error)) {
        throw new ConflictException('A faculty with this code already exists.');
      }

      throw error;
    }
  }

  async updateFaculty(institutionId: string, id: string, input: FacultyInput) {
    await this.assertUniversity(institutionId);

    const existing = await this.prisma.faculties.findFirst({
      where: { id, institutionId },
      select: { id: true },
    });

    if (!existing) throw new NotFoundException('Faculty not found.');

    const data: { name?: string; deanId?: string | null; updatedAt: Date } = {
      updatedAt: new Date(),
    };

    if (input.name !== undefined) {
      data.name = this.required(input.name, 120, 'Faculty name');
    }

    if (input.deanId !== undefined) {
      data.deanId = await this.checkHod(institutionId, input.deanId);
    }

    await this.prisma.faculties.update({ where: { id }, data });

    return { success: true, id };
  }

  /* ------------------------------- programs ------------------------------- */

  async listPrograms(institutionId: string) {
    await this.assertCollege(institutionId);

    const rows = await this.prisma.programs.findMany({
      where: { institutionId },
      orderBy: [{ department: { name: 'asc' } }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        code: true,
        semesters: true,
        isActive: true,
        departmentId: true,
        department: { select: { name: true } },
        courses: { select: { semester: true, credits: true } },
        _count: { select: { students: true } },
      },
    });

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      code: row.code,
      semesters: row.semesters,
      isActive: row.isActive,
      departmentId: row.departmentId,
      departmentName: row.department.name,
      studentCount: row._count.students,
      courseCount: row.courses.length,
      totalCredits: row.courses.reduce((sum, course) => sum + course.credits, 0),
    }));
  }

  async createProgram(institutionId: string, input: ProgramInput) {
    await this.assertCollege(institutionId);

    const name = this.required(input.name, 120, 'Program name');
    const department = input.departmentId
      ? await this.prisma.departments.findFirst({
          where: { id: input.departmentId, institutionId },
          select: { id: true },
        })
      : null;

    if (!department) {
      throw new BadRequestException('Please choose a department.');
    }

    try {
      const created = await this.prisma.programs.create({
        data: {
          id: randomUUID(),
          institutionId,
          departmentId: department.id,
          name,
          code: this.code(input.code, name, 'Program code'),
          semesters: this.whole(input.semesters ?? 6, 1, 12, 'Semesters'),
          updatedAt: new Date(),
        },
        select: { id: true },
      });

      return { success: true, id: created.id };
    } catch (error) {
      if (isDuplicate(error)) {
        throw new ConflictException('A program with this code already exists.');
      }

      throw error;
    }
  }

  async updateProgram(institutionId: string, id: string, input: ProgramInput) {
    await this.assertCollege(institutionId);
    const program = await this.findProgram(institutionId, id);

    const data: {
      name?: string;
      semesters?: number;
      isActive?: boolean;
      updatedAt: Date;
    } = { updatedAt: new Date() };

    if (input.name !== undefined) {
      data.name = this.required(input.name, 120, 'Program name');
    }

    if (input.semesters !== undefined) {
      const semesters = this.whole(input.semesters, 1, 12, 'Semesters');
      const beyond = await this.prisma.courses.count({
        where: { programId: program.id, semester: { gt: semesters } },
      });
      const studentsBeyond = await this.prisma.program_students.count({
        where: { programId: program.id, semester: { gt: semesters } },
      });

      if (beyond > 0 || studentsBeyond > 0) {
        throw new BadRequestException(
          'Some courses or students are in a higher semester than this.',
        );
      }

      data.semesters = semesters;
    }

    if (input.isActive !== undefined) {
      data.isActive = Boolean(input.isActive);
    }

    await this.prisma.programs.update({ where: { id: program.id }, data });

    return { success: true, id: program.id };
  }

  /* -------------------------------- courses -------------------------------- */

  async listCourses(institutionId: string, programId?: string) {
    await this.assertCollege(institutionId);

    return this.prisma.courses.findMany({
      where: { institutionId, ...(programId ? { programId } : {}) },
      orderBy: [{ semester: 'asc' }, { code: 'asc' }],
      select: {
        id: true,
        programId: true,
        semester: true,
        code: true,
        title: true,
        credits: true,
        program: { select: { name: true } },
      },
    });
  }

  async createCourse(institutionId: string, input: CourseInput) {
    await this.assertCollege(institutionId);

    const program = await this.findProgram(institutionId, input.programId);
    const semester = this.whole(input.semester, 1, program.semesters, 'Semester');
    const title = this.required(input.title, 160, 'Course title');

    try {
      const created = await this.prisma.courses.create({
        data: {
          id: randomUUID(),
          institutionId,
          programId: program.id,
          semester,
          code: this.code(input.code, title, 'Course code'),
          title,
          credits: this.whole(input.credits ?? 3, 1, 12, 'Credits'),
          updatedAt: new Date(),
        },
        select: { id: true },
      });

      return { success: true, id: created.id };
    } catch (error) {
      if (isDuplicate(error)) {
        throw new ConflictException(
          'This program already has a course with this code.',
        );
      }

      throw error;
    }
  }

  async updateCourse(institutionId: string, id: string, input: CourseInput) {
    await this.assertCollege(institutionId);

    const course = await this.prisma.courses.findFirst({
      where: { id, institutionId },
      select: { id: true, program: { select: { semesters: true } } },
    });

    if (!course) throw new NotFoundException('Course not found.');

    const data: {
      title?: string;
      semester?: number;
      credits?: number;
      updatedAt: Date;
    } = { updatedAt: new Date() };

    if (input.title !== undefined) {
      data.title = this.required(input.title, 160, 'Course title');
    }

    if (input.semester !== undefined) {
      data.semester = this.whole(
        input.semester,
        1,
        course.program.semesters,
        'Semester',
      );
    }

    if (input.credits !== undefined) {
      data.credits = this.whole(input.credits, 1, 12, 'Credits');
    }

    await this.prisma.courses.update({ where: { id }, data });

    return { success: true, id };
  }

  async deleteCourse(institutionId: string, id: string) {
    await this.assertCollege(institutionId);

    const course = await this.prisma.courses.findFirst({
      where: { id, institutionId },
      select: { id: true },
    });

    if (!course) throw new NotFoundException('Course not found.');

    await this.prisma.courses.delete({ where: { id } });

    return { success: true, id };
  }

  /* -------------------------------- results -------------------------------- */

  async resultSheet(institutionId: string, courseId: string | undefined) {
    await this.assertCollege(institutionId);

    const course = courseId
      ? await this.prisma.courses.findFirst({
          where: { id: courseId, institutionId },
          select: {
            id: true,
            title: true,
            code: true,
            credits: true,
            semester: true,
            programId: true,
          },
        })
      : null;

    if (!course) throw new NotFoundException('Course not found.');

    const [enrolled, saved] = await Promise.all([
      this.prisma.program_students.findMany({
        where: {
          programId: course.programId,
          semester: { gte: course.semester },
          student: { status: 'ACTIVE' },
        },
        select: {
          semester: true,
          student: {
            select: { id: true, firstName: true, lastName: true, brxUid: true },
          },
        },
      }),
      this.prisma.course_results.findMany({
        where: { courseId: course.id },
        select: { studentId: true, marks: true, grade: true },
      }),
    ]);

    const byStudent = new Map(saved.map((row) => [row.studentId, row]));

    return {
      course: {
        id: course.id,
        title: course.title,
        code: course.code,
        credits: course.credits,
        semester: course.semester,
      },
      students: enrolled
        .map((row) => ({
          id: row.student.id,
          name: this.name(row.student.firstName, row.student.lastName),
          brxUid: row.student.brxUid,
          semester: row.semester,
          marks: byStudent.get(row.student.id)?.marks ?? null,
          grade: byStudent.get(row.student.id)?.grade ?? null,
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    };
  }

  async saveResults(
    institutionId: string,
    courseId: string | undefined,
    rows: ResultRow[],
  ) {
    const sheet = await this.resultSheet(institutionId, courseId);

    if (!Array.isArray(rows) || rows.length > 1000) {
      throw new BadRequestException('Invalid marks list.');
    }

    const allowed = new Set(sheet.students.map((student) => student.id));
    const clean = new Map<string, number | 'clear'>();

    for (const row of rows) {
      if (!row.studentId || !allowed.has(row.studentId)) {
        throw new BadRequestException(
          'A student in the list is not in this course\'s program.',
        );
      }

      if (row.marks === null || row.marks === undefined || row.marks === '') {
        clean.set(row.studentId, 'clear');
        continue;
      }

      const marks = Number(row.marks);

      if (!Number.isFinite(marks) || marks < 0 || marks > 100) {
        throw new BadRequestException('Marks must be between 0 and 100.');
      }

      clean.set(row.studentId, Math.round(marks * 100) / 100);
    }

    const existing = await this.prisma.course_results.findMany({
      where: { courseId: sheet.course.id, studentId: { in: [...clean.keys()] } },
      select: { id: true, studentId: true },
    });
    const existingBy = new Map(existing.map((row) => [row.studentId, row.id]));
    const now = new Date();
    const operations = [];

    for (const [studentId, value] of clean) {
      const existingId = existingBy.get(studentId);

      if (value === 'clear') {
        if (existingId) {
          operations.push(
            this.prisma.course_results.delete({ where: { id: existingId } }),
          );
        }

        continue;
      }

      const { grade, gradePoint } = gradeFor(value);

      if (existingId) {
        operations.push(
          this.prisma.course_results.update({
            where: { id: existingId },
            data: { marks: value, grade, gradePoint, updatedAt: now },
          }),
        );
      } else {
        operations.push(
          this.prisma.course_results.create({
            data: {
              id: randomUUID(),
              institutionId,
              courseId: sheet.course.id,
              studentId,
              marks: value,
              grade,
              gradePoint,
              updatedAt: now,
            },
          }),
        );
      }
    }

    await this.prisma.$transaction(operations);

    return { saved: operations.length };
  }

  /* ------------------------------ enrollments ------------------------------ */

  async listEnrollments(institutionId: string) {
    await this.assertCollege(institutionId);

    const students = await this.prisma.users.findMany({
      where: { institutionId, role: 'STUDENT', status: 'ACTIVE' },
      orderBy: { firstName: 'asc' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        brxUid: true,
        program_enrollment: {
          select: {
            programId: true,
            semester: true,
            rollNo: true,
            program: { select: { name: true } },
          },
        },
      },
    });

    return students.map((student) => ({
      id: student.id,
      name: this.name(student.firstName, student.lastName),
      brxUid: student.brxUid,
      programId: student.program_enrollment?.programId ?? null,
      programName: student.program_enrollment?.program.name ?? null,
      semester: student.program_enrollment?.semester ?? null,
      rollNo: student.program_enrollment?.rollNo ?? null,
    }));
  }

  async enroll(institutionId: string, studentId: string, input: EnrollmentInput) {
    await this.assertCollege(institutionId);

    const student = await this.prisma.users.findFirst({
      where: { id: studentId, institutionId, role: 'STUDENT', status: 'ACTIVE' },
      select: { id: true },
    });

    if (!student) throw new NotFoundException('Student not found.');

    const program = await this.findProgram(institutionId, input.programId);
    const semester = this.whole(
      input.semester ?? 1,
      1,
      program.semesters,
      'Semester',
    );
    const rollNo = this.text(input.rollNo, 40, 'Roll number');
    const now = new Date();

    await this.prisma.program_students.upsert({
      where: { studentId: student.id },
      create: {
        id: randomUUID(),
        institutionId,
        programId: program.id,
        studentId: student.id,
        semester,
        rollNo,
        updatedAt: now,
      },
      update: { programId: program.id, semester, rollNo, updatedAt: now },
    });

    return { success: true };
  }

  async unenroll(institutionId: string, studentId: string) {
    await this.assertCollege(institutionId);

    await this.prisma.program_students.deleteMany({
      where: { studentId, institutionId },
    });

    return { success: true };
  }
}
