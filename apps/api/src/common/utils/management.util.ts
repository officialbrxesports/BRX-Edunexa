import {
  ConflictException,
  ForbiddenException,
  HttpException,
} from '@nestjs/common';

export function requireInstitutionId(
  req: {
    user?: {
      institutionId?: string | null;
    };
  },
): string {
  const institutionId = req.user?.institutionId;

  if (!institutionId) {
    throw new ForbiddenException(
      'Institution context is missing',
    );
  }

  return institutionId;
}

export function ci(term: string) {
  return {
    contains: term,
    mode: 'insensitive' as const,
  };
}

export function paging(
  page?: number,
  limit?: number,
) {
  const currentPage = Math.max(
    1,
    Number(page) || 1,
  );

  const currentLimit = Math.min(
    100,
    Math.max(1, Number(limit) || 20),
  );

  return {
    page: currentPage,
    limit: currentLimit,
    skip:
      (currentPage - 1) * currentLimit,
    take: currentLimit,
  };
}

export function pageResult<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
) {
  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.max(
        1,
        Math.ceil(total / limit),
      ),
    },
  };
}

export function pickDefined<
  T extends object,
  K extends keyof T,
>(
  source: T,
  keys: readonly K[],
): Pick<T, K> {
  const output = {} as Pick<T, K>;

  for (const key of keys) {
    if (source[key] !== undefined) {
      output[key] = source[key];
    }
  }

  return output;
}

export function dateOrUndefined(
  value?: string,
): Date | undefined {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date;
}

export function rethrowPrismaError(
  error: unknown,
  conflictMessage: string,
): never {
  if (error instanceof HttpException) {
    throw error;
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'P2002'
  ) {
    throw new ConflictException(
      conflictMessage,
    );
  }

  throw error;
}
