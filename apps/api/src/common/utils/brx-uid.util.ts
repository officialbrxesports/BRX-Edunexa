import { randomBytes } from 'crypto';

const UID_ALPHABET =
  'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomPart(length: number): string {
  const bytes = randomBytes(length);

  let result = '';

  for (let index = 0; index < length; index += 1) {
    result +=
      UID_ALPHABET[
        bytes[index] % UID_ALPHABET.length
      ];
  }

  return result;
}

export function generateBrxUid(): string {
  return `BRX-${randomPart(4)}-${randomPart(4)}-${randomPart(4)}`;
}