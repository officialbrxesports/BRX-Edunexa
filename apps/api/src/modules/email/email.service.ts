import { Injectable, Logger } from '@nestjs/common';

type MailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

/**
 * Sends transactional email through Brevo (free plan, 300 emails a day).
 * Needs three settings on the API server:
 *   BREVO_API_KEY      the API key from Brevo (a secret, never commit it)
 *   MAIL_FROM_EMAIL    a sender address verified inside Brevo
 *   MAIL_FROM_NAME     optional, defaults to "BRX EduNexa"
 * When they are missing the app keeps working and email is simply skipped.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  isConfigured(): boolean {
    return Boolean(process.env.BREVO_API_KEY && process.env.MAIL_FROM_EMAIL);
  }

  /** Returns true when Brevo accepted the message. Never throws. */
  async send(input: MailInput): Promise<boolean> {
    const apiKey = process.env.BREVO_API_KEY;
    const fromEmail = process.env.MAIL_FROM_EMAIL;

    if (!apiKey || !fromEmail) {
      this.logger.warn(
        'Email skipped: BREVO_API_KEY or MAIL_FROM_EMAIL is not set.',
      );
      return false;
    }

    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': apiKey,
          'content-type': 'application/json',
          accept: 'application/json',
        },
        body: JSON.stringify({
          sender: {
            email: fromEmail,
            name: process.env.MAIL_FROM_NAME || 'BRX EduNexa',
          },
          to: [{ email: input.to }],
          subject: input.subject,
          htmlContent: input.html,
          textContent: input.text,
        }),
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        // Log only the status and Brevo's short reason, never the key.
        const reason = (await response.text().catch(() => '')).slice(0, 300);
        this.logger.error(`Brevo refused the email (${response.status}): ${reason}`);
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error(
        `Brevo request failed: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
      return false;
    }
  }
}
