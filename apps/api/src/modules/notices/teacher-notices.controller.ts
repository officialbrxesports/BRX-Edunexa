import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import {
  type AuthenticatedRequest,
  SessionAuthGuard,
} from '../../common/guards/session-auth.guard';
import { PrismaService } from '../../prisma/prisma.service';
import { NoticesService } from './notices.service';

type TeacherNoticeInput = {
  title?: string;
  message?: string;
  classId?: string;
  sectionId?: string | null;
  audience?: string;
};

/** A teacher sends notices only to the classes/sections assigned to them. */
@Controller('teacher/notices')
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles('TEACHER')
export class TeacherNoticesController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notices: NoticesService,
  ) {}

  private institutionId(request: AuthenticatedRequest) {
    const id = request.user?.institutionId;

    if (!id) {
      throw new UnauthorizedException(
        'Your account is not linked to an institution.',
      );
    }

    return id;
  }

  private assigned(institutionId: string, teacherId: string) {
    return this.prisma.subject_teachers.findMany({
      where: { teacherId, institutionId },
      select: {
        classId: true,
        sectionId: true,
        classes: { select: { name: true } },
        sections: { select: { name: true } },
      },
    });
  }

  @Get('targets')
  async targets(@Req() request: AuthenticatedRequest) {
    const rows = await this.assigned(
      this.institutionId(request),
      request.user!.id,
    );
    const seen = new Set<string>();
    const targets: {
      classId: string;
      sectionId: string | null;
      label: string;
    }[] = [];

    for (const row of rows) {
      const key = `${row.classId}:${row.sectionId ?? ''}`;

      if (seen.has(key)) continue;

      seen.add(key);
      targets.push({
        classId: row.classId,
        sectionId: row.sectionId,
        label: row.sections
          ? `${row.classes.name} · Section ${row.sections.name}`
          : row.classes.name,
      });
    }

    return { targets };
  }

  @Post()
  async send(
    @Req() request: AuthenticatedRequest,
    @Body() body: TeacherNoticeInput,
  ) {
    const institutionId = this.institutionId(request);
    const rows = await this.assigned(institutionId, request.user!.id);
    const classId = body.classId || '';
    const sectionId = body.sectionId || null;

    if (!classId) throw new BadRequestException('Please choose a class.');

    // Allowed when assigned to the whole class, or to that exact section.
    const allowed = rows.some(
      (row) =>
        row.classId === classId &&
        (row.sectionId === null || row.sectionId === sectionId),
    );

    if (!allowed) {
      throw new ForbiddenException(
        'You can send notices only to classes assigned to you.',
      );
    }

    const audience = ['STUDENTS', 'PARENTS', 'CLASS'].includes(
      body.audience ?? '',
    )
      ? body.audience
      : 'CLASS';

    return this.notices.send(institutionId, request.user!.id, {
      title: body.title,
      message: body.message,
      audience,
      classId,
      sectionId,
    });
  }
}
