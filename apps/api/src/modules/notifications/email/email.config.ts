import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailConfig {
  constructor(
    private readonly configService: ConfigService,
  ) {}

  get apiKey(): string | undefined {
    return this.configService.get<string>(
      'RESEND_API_KEY',
    );
  }

  get from(): string {
    return (
      this.configService.get<string>(
        'EMAIL_FROM',
      ) ??
      'BRX EduNexa <onboarding@resend.dev>'
    );
  }

  get appUrl(): string {
    return (
      this.configService.get<string>(
        'APP_URL',
      ) ??
      'https://brx-edunexa-apps.vercel.app'
    );
  }
}