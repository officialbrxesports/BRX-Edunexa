export const ROLES = {
  HEAD: "HEAD",
  TEACHER: "TEACHER",
  STUDENT: "STUDENT",
  STAFF: "STAFF",
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];