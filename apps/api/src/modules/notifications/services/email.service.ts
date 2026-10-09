import {
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

import { EmailConfig } from '../email/email.config';

import { passwordResetOtpEmailTemplate } from '../templates/password-reset-otp-email.template';
import { welcomeEmailTemplate } from '../templates/welcome-email.template';
import { loginAlertEmailTemplate } from '../templates/login-alert-email.template';
import { registrationOtpEmailTemplate } from '../templates/registration-otp-email.template';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  private readonly transporter!: nodemailer.Transporter;

  constructor(
    private readonly emailConfig: EmailConfig,
    private readonly configService: ConfigService,
  ) {
    const host = this.configService.get<string>('EMAIL_HOST');
    const port = Number(
      this.configService.get<string>('EMAIL_PORT') ?? 465,
    );
    const user = this.configService.get<string>('EMAIL_USER');
    const pass = this.configService.get<string>('EMAIL_PASS');

    if (!host || !user || !pass) {
      this.logger.warn(
        'Gmail SMTP configuration is incomplete. Email sending is disabled.',
      );
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });
  }

  private async sendEmail(params: {
    to: string;
    subject: string;
    html: string;
  }) {
    if (!this.transporter) {
      this.logger.warn('Email skipped because Gmail SMTP is not configured.');
      return { sent: false, skipped: true };
    }

    const fromAddress = this.configService.get<string>('EMAIL_FROM')
      || this.configService.get<string>('EMAIL_USER');

    try {
      const result = await this.transporter.sendMail({
        from: fromAddress,
        to: params.to,
        subject: params.subject,
        html: params.html,
      });

      this.logger.log(
        `Email accepted by SMTP server. Message ID: ${result.messageId}`,
      );

      return { sent: true, skipped: false };
    } catch (error) {
      this.logger.error(
        'Gmail SMTP email delivery failed.',
        error instanceof Error ? error.stack : String(error),
      );

      return { sent: false, skipped: false };
    }
  }

  async sendWelcomeEmail(params: {
    firstName: string;
    brxUid: string;
    email: string;
  }) {
    const template = welcomeEmailTemplate({
      ...params,
      appUrl: this.emailConfig.appUrl,
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
    const template = loginAlertEmailTemplate({
      ...params,
      appUrl: this.emailConfig.appUrl,
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
    const template = passwordResetOtpEmailTemplate({
      firstName: params.firstName,
      otp: params.otp,
      expiresInMinutes: params.expiresInMinutes,
      appUrl: this.emailConfig.appUrl,
    });

    return this.sendEmail({
      to: params.email,
      subject: template.subject,
      html: template.html,
    });
  }

  async sendRegistrationOtpEmail(params: {
    firstName: string;
    email: string;
    otp: string;
    expiresInMinutes: number;
  }) {
    const template = registrationOtpEmailTemplate({
      firstName: params.firstName,
      otp: params.otp,
      expiresInMinutes: params.expiresInMinutes,
      appUrl: this.emailConfig.appUrl,
    });

    return this.sendEmail({
      to: params.email,
      subject: template.subject,
      html: template.html,
    });
  }
}