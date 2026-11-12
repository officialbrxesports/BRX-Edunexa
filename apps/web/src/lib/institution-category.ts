export const INSTITUTION_CATEGORIES = [
  "COACHING",
  "SCHOOL",
  "COLLEGE",
  "UNIVERSITY",
  "INSTITUTE",
  "OTHER",
] as const;

export type InstitutionCategory = (typeof INSTITUTION_CATEGORIES)[number];

export function parseInstitutionCategory(
  value: string | undefined,
): InstitutionCategory | undefined {
  if (!value) {
    return undefined;
  }

  const normalized = value.trim().toUpperCase();

  return INSTITUTION_CATEGORIES.find((category) => category === normalized);
}
