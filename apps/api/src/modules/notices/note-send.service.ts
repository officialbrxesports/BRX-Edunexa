import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { NoticesService } from './notices.service';

export type NoteSendInput = {
  documentId?: string;
  audience?: string;
  classId?: string | null;
  sectionId?: string | null;
};

type Sender = {
  id: string;
  name: string;
  role: string;
  institutionId: string;
};

const AUDIENCES = ['EVERYONE', 'TEACHERS', 'STAFF', 'STUDENTS', 'PARENTS', 'CLASS'];
const TEACHER_AUDIENCES = ['STUDENTS', 'PARENTS', 'CLASS'];

const MAX_RECIPIENTS = 5000;
const MAX_EMAIL_PER_SEND = 50;
const MAX_EMAIL_PER_DAY = 150; // per institution; Brevo's free plan is 300/day in total
const PORTAL_TEXT_LIMIT = 2000;

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** Plain text version of a note, for the portal inbox and the email text part. */
function htmlToText(html: string) {
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6]|tr)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Keeps formatting but drops anything active, and heavy inline images. */
function safeHtml(html: string) {
  return html
    .replace(/<(script|style|iframe|object|embed|form)[\s\S]*?<\/\1>/gi, '')
    .replace(/<img[^>]+src=["']data:[^>]*>/gi, '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*')/gi, '')
    .replace(/javascript:/gi, '');
}

@Injectable()
export class NoteSendService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notices: NoticesService,
    private readonly email: EmailService,
  ) {}

  /** The teacher may only reach classes/sections assigned to them. */
  private async assertTeacherClass(
    sender: Sender,
    classId: string,
    sectionId: string | null,
  ) {
    const rows = await this.prisma.subject_teachers.findMany({
      where: { teacherId: sender.id, institutionId: sender.institutionId },
      select: { classId: true, sectionId: true },
    });

    const allowed = rows.some(
      (row) =>
        row.classId === classId &&
        (row.sectionId === null || row.sectionId === sectionId),
    );

    if (!allowed) {
      throw new ForbiddenException(
        'You can send notes only to classes assigned to you.',
      );
    }
  }

  async send(sender: Sender, input: NoteSendInput) {
    const audience = input.audience ?? '';
    const classId = input.classId || null;
    const sectionId = input.sectionId || null;

    if (!AUDIENCES.includes(audience)) {
      throw new BadRequestException('Please choose who should get this note.');
    }

    if (sender.role === 'TEACHER') {
      if (!TEACHER_AUDIENCES.includes(audience) || !classId) {
        throw new ForbiddenException(
          'Teachers can send notes to students or parents of their own class.',
        );
      }

      await this.assertTeacherClass(sender, classId, sectionId);
    }

    const document = input.documentId
      ? await this.prisma.editor_documents.findFirst({
          where: { id: input.documentId, userId: sender.id },
          select: { id: true, title: true, content: true },
        })
      : null;

    if (!document) {
      throw new NotFoundException('Save the note to cloud first, then send it.');
    }

    const people = await this.notices.recipients(
      sender.institutionId,
      sender.id,
      audience as 'EVERYONE' | 'TEACHERS' | 'STAFF' | 'STUDENTS' | 'PARENTS' | 'CLASS',
      classId,
      sectionId,
    );

    if (people.length === 0) {
      throw new BadRequestException('No active person matches this audience.');
    }

    if (people.length > MAX_RECIPIENTS) {
      throw new BadRequestException('Too many recipients for one note.');
    }

    const title = `Note: ${document.title}`.slice(0, 160);
    const text = htmlToText(document.content);
    const portalText =
      text.length > PORTAL_TEXT_LIMIT
        ? `${text.slice(0, PORTAL_TEXT_LIMIT - 40).trimEnd()}… (shortened)`
        : text || '(empty note)';
    const now = new Date();

    await this.prisma.notifications.createMany({
      data: people.map((person) => ({
        id: randomUUID(),
        institutionId: sender.institutionId,
        senderId: sender.id,
        recipientId: person.id,
        title,
        message: portalText,
        type: 'ANNOUNCEMENT' as const,
        createdAt: now,
        updatedAt: now,
      })),
    });

    // ---- email: only people who opted in, within the daily limits ----
    const optedIn = await this.prisma.users.findMany({
      where: {
        id: { in: people.map((person) => person.id) },
        emailOptIn: true,
        status: 'ACTIVE',
      },
      select: { email: true },
    });

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const used = await this.prisma.note_sends.aggregate({
      where: {
        institutionId: sender.institutionId,
        createdAt: { gte: startOfDay },
      },
      _sum: { emailed: true },
    });

    const configured = this.email.isConfigured();
    const room = configured
      ? Math.max(
          0,
          Math.min(MAX_EMAIL_PER_SEND, MAX_EMAIL_PER_DAY - (used._sum.emailed ?? 0)),
        )
      : 0;
    const targets = optedIn.slice(0, room);
    let emailed = 0;

    const html = `<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#0f172a">
<p style="color:#475569;font-size:13px">From ${escapeHtml(sender.name)} via BRX EduNexa</p>
<h2 style="margin:8px 0 16px">${escapeHtml(document.title)}</h2>
${safeHtml(document.content)}
<p style="margin-top:24px;color:#94a3b8;font-size:12px">You get this because you chose to receive notes by email. You can turn it off on your dashboard.</p>
</div>`;

    for (let index = 0; index < targets.length; index += 5) {
      const results = await Promise.all(
        targets.slice(index, index + 5).map((person) =>
          this.email.send({
            to: person.email,
            subject: title,
            html,
            text: `${sender.name} sent you a note: ${document.title}\n\n${text}`,
          }),
        ),
      );

      emailed += results.filter(Boolean).length;
    }

    await this.prisma.note_sends.create({
      data: {
        id: randomUUID(),
        institutionId: sender.institutionId,
        senderId: sender.id,
        documentId: document.id,
        title: document.title.slice(0, 160),
        audience,
        classId,
        sectionId,
        recipients: people.length,
        emailed,
        createdAt: now,
      },
    });

    return {
      portal: people.length,
      emailed,
      optedIn: optedIn.length,
      emailConfigured: configured,
      limited: configured && optedIn.length > targets.length,
    };
  }

  async history(senderId: string) {
    const rows = await this.prisma.note_sends.findMany({
      where: { senderId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      audience: row.audience,
      recipients: row.recipients,
      emailed: row.emailed,
      createdAt: row.createdAt,
    }));
  }
}
