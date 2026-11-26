import {
  Controller,
  ForbiddenException,
  Get,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  type AuthenticatedRequest,
  SessionAuthGuard,
} from '../../common/guards/session-auth.guard';
import { PrismaService } from '../../prisma/prisma.service';
import { gradeFor } from './exams.service';

const round2 = (value: number) => Math.round(value * 100) / 100;

/** Competition ranking: equal scores share a rank (1, 2, 2, 4). */
const rankOf = (score: number, all: number[]) =>
  1 + all.filter((other) => other > score).length;

/**
 * Published exam results for a student (own) or a parent (own children).
 * Only exams that the head has published are visible.
 */
@Controller('my-results')
@UseGuards(SessionAuthGuard)
export class MyResultsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async mine(@Req() request: AuthenticatedRequest) {
    const user = request.user;

    if (!user?.institutionId) {
      throw new UnauthorizedException(
        'Your account is not linked to an institution.',
      );
    }

    const institutionId = user.institutionId;
    let students: { id: string; name: string }[] = [];

    if (user.role === 'STUDENT') {
      students = [{ id: user.id, name: user.name }];
    } else if (user.role === 'PARENT') {
      const links = await this.prisma.parent_students.findMany({
        where: { parentId: user.id, institutionId },
        select: {
          student: { select: { id: true, firstName: true, lastName: true } },
        },
      });

      students = links.map((link) => ({
        id: link.student.id,
        name: [link.student.firstName, link.student.lastName]
          .filter(Boolean)
          .join(' '),
      }));
    } else {
      throw new ForbiddenException('Only students and parents can use this.');
    }

    if (students.length === 0) return { students: [] };

    const mine = await this.prisma.results.findMany({
      where: {
        institutionId,
        studentId: { in: students.map((item) => item.id) },
        exams: { status: { in: ['PUBLISHED', 'COMPLETED'] } },
      },
      select: {
        studentId: true,
        examId: true,
        marks: true,
        exams: {
          select: {
            id: true,
            title: true,
            examDate: true,
            totalMarks: true,
            passingMarks: true,
          },
        },
      },
    });

    const examIds = [...new Set(mine.map((row) => row.examId))];
    const everyone = examIds.length
      ? await this.prisma.results.findMany({
          where: { examId: { in: examIds } },
          select: { examId: true, marks: true },
        })
      : [];

    const scoresByExam = new Map<string, number[]>();

    for (const row of everyone) {
      const list = scoresByExam.get(row.examId) ?? [];
      list.push(row.marks);
      scoresByExam.set(row.examId, list);
    }

    return {
      students: students.map((student) => ({
        id: student.id,
        name: student.name,
        results: mine
          .filter((row) => row.studentId === student.id)
          .map((row) => {
            const scores = scoresByExam.get(row.examId) ?? [];
            const percent = round2((row.marks / row.exams.totalMarks) * 100);
            const pass = row.marks >= row.exams.passingMarks;

            return {
              examId: row.examId,
              title: row.exams.title,
              examDate: row.exams.examDate,
              totalMarks: row.exams.totalMarks,
              passingMarks: row.exams.passingMarks,
              marks: row.marks,
              percent,
              grade: pass ? gradeFor(percent) : 'F',
              pass,
              rank: rankOf(row.marks, scores),
              appeared: scores.length,
            };
          })
          .sort(
            (a, b) =>
              new Date(b.examDate).getTime() - new Date(a.examDate).getTime(),
          ),
      })),
    };
  }
}
