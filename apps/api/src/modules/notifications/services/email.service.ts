import {
  Injectable,
  Logger,
} from '@nestjs/common';

import { EmailConfig } from '../email/email.config';

import { passwordResetOtpEmailTemplate } from '../templates/password-reset-otp-email.template';
import { welcomeEmailTemplate } from '../templates/welcome-email.template';
import { loginAlertEmailTemplate } from '../templates/login-alert-email.template';

@Injectable()
export class EmailService { 
  private readonly logger = new Logger(
    EmailService.name,
  );

  constructor(
    private readonly emailConfig: EmailConfig,
  ) {}

  private async sendEmail(params: {
    to: string;
    subject: string;
    html: string;
  }) {
    const apiKey = this.emailConfig.apiKey;

    if (!apiKey) {
      this.logger.warn(
        'RESEND_API_KEY is not configured. Email skipped.',
      );

      return {
        sent: false,
        skipped: true,
      };
    }

    try {
      const response = await fetch(
        'https://api.resend.com/emails',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: this.emailConfig.from,
            to: [params.to],
            subject: params.subject,
            html: params.html,
          }),
        },
      );

      if (!response.ok) {
        const errorText =
          await response.text();

        this.logger.error(
          `Email provider error: ${response.status} ${errorText}`,
        );

        return {
          sent: false,
          skipped: false,
        };
      }

      return {
        sent: true,
        skipped: false,
      };
    } catch (error) {
      this.logger.error(
        'Failed to send email',
        error instanceof Error
          ? error.stack
          : String(error),
      );

      return {
        sent: false,
        skipped: false,
      };
    }
  }

  async sendWelcomeEmail(params: {
    firstName: string;
    brxUid: string;
    email: string;
  }) {
    const template =
      welcomeEmailTemplate({
        ...params,
        appUrl:
          this.emailConfig.appUrl,
      });

    return this.sendEmail({
      to: params.email,
      subject: template.subject,
      html: template.html,
    });
  }

  async sendLoginAlertEmail(params: {
    firstName: string;
    brxUid: string;
    email: string;
    deviceType: string;
    deviceName: string;
    browser: string;
    operatingSystem: string;
    ipAddress: string;
    loginTime: string;
  }) {
    const template =
      loginAlertEmailTemplate({
        ...params,
        appUrl:
          this.emailConfig.appUrl,
      });

    return this.sendEmail({
      to: params.email,
      subject: template.subject,
      html: template.html,
    });
  }

  async sendPasswordResetOtpEmail(params: {
    firstName: string;
    email: string;
    otp: string;
    expiresInMinutes: number;
  }) {
    const template =
      passwordResetOtpEmailTemplate({
        firstName: params.firstName,
        otp: params.otp,
        expiresInMinutes:
          params.expiresInMinutes,
        appUrl:
          this.emailConfig.appUrl,
      });

    return this.sendEmail({
      to: params.email,
      subject: template.subject,
      html: template.html,
    });
  }
}