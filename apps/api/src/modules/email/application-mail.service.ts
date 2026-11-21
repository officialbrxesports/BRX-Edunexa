import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from './email.service';

type Kind = 'admission' | 'joining';

export type StatusMail = {
  institutionId: string;
  /** Applicant email. When empty nothing is sent. */
  to?: string | null;
  name: string;
  number: string;
  status: string;
  note?: string | null;
  kind?: Kind;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Tells an applicant when the status of their admission or joining
 * application changes. Best effort: it never throws and never blocks
 * the staff member who pressed the button.
 */
@Injectable()
export class ApplicationMailService {
  private readonly logger = new Logger(ApplicationMailService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
  ) {}

  private lines(status: string, kind: Kind, note: string): string[] | null {
    const thing = kind === 'joining' ? 'joining application' : 'admission application';

    switch (status) {
      case 'UNDER_REVIEW':
        return [`Your ${thing} is now being reviewed.`];
      case 'CHANGES_REQUESTED':
        return [
          `The institution needs a few changes in your ${thing}.`,
          note ? `What to change: ${note}` : 'Please contact the institution for details.',
        ];
      case 'APPROVED':
        return [
          `Good news. Your ${thing} has been approved.`,
          'The institution will contact you about the next steps.',
        ];
      case 'REJECTED':
        return [
          `Your ${thing} was not approved.`,
          note ? `Reason: ${note}` : 'Please contact the institution for details.',
        ];
      case 'ENROLLED':
        return kind === 'joining'
          ? ['Welcome. Your joining is complete.', 'The institution will share your login details.']
          : ['Welcome. Your admission is complete.', 'The institution will share your login details.'];
      default:
        return null;
    }
  }

  async notify(input: StatusMail): Promise<void> {
    try {
      const to = input.to?.trim();

      if (!to) return;

      const lines = this.lines(input.status, input.kind ?? 'admission', (input.note ?? '').trim());

      if (!lines) return;

      const institution = await this.prisma.institutions.findUnique({
        where: { id: input.institutionId },
        select: { name: true },
      });
      const school = institution?.name ?? 'your institution';
      const name = input.name || 'there';

      await this.email.send({
        to,
        subject: `${school}: update on application ${input.number}`,
        text:
          `Hello ${name},\n\n${lines.join('\n')}\n\n` +
          `Institution: ${school}\nApplication number: ${input.number}\n\n` +
          'This is an automatic message. Please contact the institution for questions.',
        html:
          `<p>Hello ${escapeHtml(name)},</p>` +
          lines.map((line) => `<p>${escapeHtml(line)}</p>`).join('') +
          `<p>Institution: <b>${escapeHtml(school)}</b><br>Application number: <b>${escapeHtml(input.number)}</b></p>` +
          '<p style="color:#666">This is an automatic message. Please contact the institution for questions.</p>',
      });
    } catch (error) {
      this.logger.warn(
        `Status email skipped: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
    }
  }
}
