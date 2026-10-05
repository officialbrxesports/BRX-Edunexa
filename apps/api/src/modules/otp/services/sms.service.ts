import { Injectable, InternalServerErrorException } from '@nestjs/common';

@Injectable()
export class SmsService {
  private readonly apiUrl = 'https://control.msg91.com/api/v5/flow';

  async sendOtp(
    mobile: string,
    otp: string,
  ): Promise<{ success: boolean; messageId?: string }> {
    const authKey = process.env.MSG91_AUTH_KEY;
    const templateId = process.env.MSG91_OTP_TEMPLATE_ID;

    if (!authKey || !templateId) {
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[BRX OTP DEV] ${mobile}: ${otp}`);
        return { success: true };
      }

      throw new InternalServerErrorException(
        'SMS service is not configured',
      );
    }

    const normalizedMobile = this.normalizeIndianMobile(mobile);

    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        authkey: authKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        template_id: templateId,
        short_url: '0',
        recipients: [
          {
            mobiles: normalizedMobile,
            VAR1: otp,
          },
        ],
      }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new InternalServerErrorException(
        'Unable to send OTP SMS',
      );
    }

    return {
      success: true,
      messageId:
        typeof data?.request_id === 'string'
          ? data.request_id
          : undefined,
    };
  }

  private normalizeIndianMobile(mobile: string): string {
    const digits = mobile.replace(/\D/g, '');

    if (digits.length === 10) {
      return `91${digits}`;
    }

    if (digits.length === 12 && digits.startsWith('91')) {
      return digits;
    }

    throw new InternalServerErrorException(
      'Invalid Indian mobile number',
    );
  }
}