import { BadRequestException, Injectable } from '@nestjs/common';
import { randomBytes, randomInt } from 'node:crypto';
import * as argon2 from 'argon2';

import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../email/email.service';

const CODE_MINUTES = 10;
const MAX_WRONG_CODES = 5;
const RESEND_SECONDS = 60;

export const FORGOT_REPLY = {
  message:
    'Agar ye account maujood hai, to uske email par 6 digit ka code bhej diya gaya hai. Code 10 minute tak chalega.',
};

@Injectable()
export class PasswordResetService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
  ) {}

  private findUser(identifier: string) {
    const value = identifier.trim();

    return this.prisma.users.findFirst({
      where: {
        OR: [{ email: { equals: value, mode: 'insensitive' } }, { brxUid: value }],
      },
    });
  }

  /** Always answers the same way so nobody can test which accounts exist. */
  async request(identifier: string) {
    const user = await this.findUser(identifier);

    if (!user || user.status !== 'ACTIVE') return FORGOT_REPLY;

    const last = await this.prisma.password_reset_otps.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    if (last && Date.now() - last.createdAt.getTime() < RESEND_SECONDS * 1000) {
      return FORGOT_REPLY;
    }

    const code = String(randomInt(100000, 1000000));
    const otpHash = await argon2.hash(code);

    await this.prisma.$transaction([
      this.prisma.password_reset_otps.deleteMany({ where: { userId: user.id } }),
      this.prisma.password_reset_otps.create({
        data: {
          id: randomBytes(16).toString('hex'),
          userId: user.id,
          otpHash,
          expiresAt: new Date(Date.now() + CODE_MINUTES * 60 * 1000),
        },
      }),
    ]);

    const name = user.firstName || 'there';

    await this.email.send({
      to: user.email,
      subject: 'Your BRX EduNexa password reset code',
      text:
        `Hello ${name},\n\nYour password reset code is ${code}.\n` +
        `It works for ${CODE_MINUTES} minutes.\n\n` +
        'If you did not ask for this, ignore this email. Your password has not changed.',
      html:
        `<p>Hello ${escapeHtml(name)},</p>` +
        `<p>Your password reset code is</p>` +
        `<p style="font-size:28px;font-weight:700;letter-spacing:6px">${code}</p>` +
        `<p>It works for ${CODE_MINUTES} minutes.</p>` +
        '<p>If you did not ask for this, ignore this email. Your password has not changed.</p>',
    });

    return FORGOT_REPLY;
  }

  async confirm(identifier: string, code: string, newPassword: string) {
    const invalid = new BadRequestException(
      'Code galat hai ya expire ho gaya. Naya code mangwao.',
    );

    const user = await this.findUser(identifier);

    if (!user || user.status !== 'ACTIVE') throw invalid;

    const otp = await this.prisma.password_reset_otps.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp || otp.expiresAt.getTime() < Date.now() || otp.attempts >= MAX_WRONG_CODES) {
      throw invalid;
    }

    const match = await argon2.verify(otp.otpHash, code).catch(() => false);

    if (!match) {
      await this.prisma.password_reset_otps.update({
        where: { id: otp.id },
        data: { attempts: { increment: 1 } },
      });
      throw invalid;
    }

    const passwordHash = await argon2.hash(newPassword);

    await this.prisma.$transaction([
      this.prisma.users.update({
        where: { id: user.id },
        data: { passwordHash, mustChangePassword: false, updatedAt: new Date() },
      }),
      // Sign out every device, the old password may have been stolen.
      this.prisma.login_sessions.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
      this.prisma.password_reset_otps.deleteMany({ where: { userId: user.id } }),
    ]);

    await this.email.send({
      to: user.email,
      subject: 'Your BRX EduNexa password was changed',
      text:
        'Your password was just changed using a reset code. ' +
        'If this was not you, contact your institution head right away.',
      html:
        '<p>Your password was just changed using a reset code.</p>' +
        '<p>If this was not you, contact your institution head right away.</p>',
    });

    return { success: true };
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
