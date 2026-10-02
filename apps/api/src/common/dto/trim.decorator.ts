import { Transform } from 'class-transformer';

export const Trim = () =>
  Transform(({ value }) => {
    return typeof value === 'string'
      ? value.trim()
      : value;
  });

export const TrimLower = () =>
  Transform(({ value }) => {
    return typeof value === 'string'
      ? value.trim().toLowerCase()
      : value;
  });
