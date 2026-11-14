import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTeacherInput, TeachersService } from './teachers.service';

const RELATIONS = ['FATHER', 'MOTHER', 'GUARDIAN', 'OTHER'] as const;

export type ChildLinkInput = { studentId: string; relation?: string };

export type CreateParentInput = CreateTeacherInput & {
  children?: ChildLinkInput[];
};

@Injectable()
export class ParentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly people: TeachersService,
  ) {}

  private normalizeLinks(children?: ChildLinkInput[]) {
    const links = new Map<string, string>();

    for (const child of children ?? []) {
      const studentId = child?.studentId?.trim();
      if (!studentId) continue;

      const relation = (child.relation ?? 'GUARDIAN').toUpperCase();

      if (!(RELATIONS as readonly string[]).includes(relation)) {
        throw new BadRequestException('Invalid relation.');
      }

      links.set(studentId, relation);
    }

    return [...links.entries()].map(([studentId, relation]) => ({
      studentId,
      relation,
    }));
  }

  private async assertStudents(institutionId: string, ids: string[]) {
    if (ids.length === 0) return;

    const count = await this.prisma.users.count({
      where: {
        id: { in: ids },
        institutionId,
        role: 'STUDENT',
        status: { not: 'DELETED' },
      },
    });

    if (count !== ids.length) {
      throw new BadRequestException(
        'One or more selected students were not found.',
      );
    }
  }

  private childSelect = {
    relation: true,
    student: {
      select: { id: true, firstName: true, lastName: true, brxUid: true },
    },
  } as const;

  async list(institutionId: string) {
    const parents = await this.prisma.users.findMany({
      where: { institutionId, role: 'PARENT', status: { not: 'DELETED' } },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        brxUid: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        status: true,
        parent_links: { select: this.childSelect },
      },
    });

    return parents.map(({ parent_links, ...parent }) => ({
      ...parent,
      children: parent_links.map((link) => ({
        id: link.student.id,
        name: [link.student.firstName, link.student.lastName]
          .filter(Boolean)
          .join(' '),
        brxUid: link.student.brxUid,
        relation: link.relation,
      })),
    }));
  }

  async studentOptions(institutionId: string) {
    const students = await this.prisma.users.findMany({
      where: { institutionId, role: 'STUDENT', status: 'ACTIVE' },
      orderBy: { firstName: 'asc' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        brxUid: true,
        student_enrollments: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: {
            classes: { select: { name: true } },
            sections: { select: { name: true } },
          },
        },
      },
    });

    return students.map((student) => {
      const enrollment = student.student_enrollments[0];

      return {
        id: student.id,
        name: [student.firstName, student.lastName].filter(Boolean).join(' '),
        brxUid: student.brxUid,
        className: enrollment?.classes.name ?? null,
        sectionName: enrollment?.sections.name ?? null,
      };
    });
  }

  async create(institutionId: string, input: CreateParentInput) {
    const links = this.normalizeLinks(input.children);

    // Check the students first so a bad link never leaves a half-made parent.
    await this.assertStudents(
      institutionId,
      links.map((link) => link.studentId),
    );

    const result = await this.people.create(institutionId, input, 'PARENT');

    if (links.length > 0) {
      await this.prisma.parent_students.createMany({
        data: links.map((link) => ({
          id: randomUUID(),
          institutionId,
          parentId: result.teacher.id,
          studentId: link.studentId,
          relation: link.relation,
          updatedAt: new Date(),
        })),
      });
    }

    return result;
  }

  async setChildren(
    institutionId: string,
    parentId: string,
    children?: ChildLinkInput[],
  ) {
    const parent = await this.prisma.users.findFirst({
      where: { id: parentId, institutionId, role: 'PARENT' },
      select: { id: true },
    });

    if (!parent) {
      throw new NotFoundException('Parent not found.');
    }

    const links = this.normalizeLinks(children);

    await this.assertStudents(
      institutionId,
      links.map((link) => link.studentId),
    );

    await this.prisma.$transaction([
      this.prisma.parent_students.deleteMany({ where: { parentId } }),
      this.prisma.parent_students.createMany({
        data: links.map((link) => ({
          id: randomUUID(),
          institutionId,
          parentId,
          studentId: link.studentId,
          relation: link.relation,
          updatedAt: new Date(),
        })),
      }),
    ]);

    return { success: true, children: links.length };
  }
}
