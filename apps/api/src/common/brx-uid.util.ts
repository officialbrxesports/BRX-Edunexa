import { randomBytes } from 'crypto';

export function generateBrxUid(): string {
  return `BRX-${randomBytes(6).toString('hex').toUpperCase()}`;
}
