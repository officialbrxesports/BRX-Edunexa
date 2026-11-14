import { HttpException, HttpStatus } from '@nestjs/common';

type Entry = { count: number; firstAt: number };

/**
 * Small in-memory limiter for failed sign-in style attempts.
 * Free and dependency-free. State resets when the API restarts and is not
 * shared between several API instances, which is fine for one free server.
 */
export class AttemptLimiter {
  private readonly entries = new Map<string, Entry>();

  constructor(
    private readonly maxFailures: number,
    private readonly windowMs: number,
  ) {}

  private prune(now: number) {
    if (this.entries.size < 5000) return;

    for (const [key, entry] of this.entries) {
      if (now - entry.firstAt > this.windowMs) this.entries.delete(key);
    }
  }

  /** Throws 429 when this key already failed too many times. */
  assertAllowed(key: string) {
    const now = Date.now();
    const entry = this.entries.get(key);

    if (!entry) return;

    if (now - entry.firstAt > this.windowMs) {
      this.entries.delete(key);
      return;
    }

    if (entry.count >= this.maxFailures) {
      const minutes = Math.max(
        1,
        Math.ceil((this.windowMs - (now - entry.firstAt)) / 60000),
      );

      throw new HttpException(
        `Too many failed attempts. Please try again in ${minutes} minute(s).`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  recordFailure(key: string) {
    const now = Date.now();
    this.prune(now);

    const entry = this.entries.get(key);

    if (!entry || now - entry.firstAt > this.windowMs) {
      this.entries.set(key, { count: 1, firstAt: now });
      return;
    }

    entry.count += 1;
  }

  clear(key: string) {
    this.entries.delete(key);
  }
}
