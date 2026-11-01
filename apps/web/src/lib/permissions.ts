
export type InstitutionType =
  | "COACHING"
  | "SCHOOL"
  | "COLLEGE"
  | "UNIVERSITY"
  | "INSTITUTE"
  | "OTHER";

export type UserRole =
  | "PLATFORM_ADMIN"
  | "HEAD"
  | "TEACHER"
  | "STAFF"
  | "STUDENT";

export type Permission =
  | "institution:read"
  | "institution:update"
  | "users:read"
  | "users:manage"
  | "roles:manage"
  | "students:manage"
  | "teachers:manage"
  | "attendance:manage"
  | "courses:manage"
  | "exams:manage"
  | "fees:manage"
  | "reports:read"
  | "settings:manage";

const permissionsByRole: Record<UserRole, Permission[]> = {
  PLATFORM_ADMIN: [
    "institution:read",
    "institution:update",
    "users:read",
    "users:manage",
    "roles:manage",
    "students:manage",
    "teachers:manage",
    "attendance:manage",
    "courses:manage",
    "exams:manage",
    "fees:manage",
    "reports:read",
    "settings:manage",
  ],
  HEAD: [
    "institution:read",
    "institution:update",
    "users:read",
    "users:manage",
    "students:manage",
    "teachers:manage",
    "attendance:manage",
    "courses:manage",
    "exams:manage",
    "fees:manage",
    "reports:read",
    "settings:manage",
  ],
  TEACHER: [
    "institution:read",
    "students:manage",
    "attendance:manage",
    "courses:manage",
    "exams:manage",
  ],
  STAFF: [
    "institution:read",
    "users:read",
    "students:manage",
    "attendance:manage",
    "fees:manage",
    "reports:read",
  ],
  STUDENT: [
    "institution:read",
  ],
};

export function hasPermission(
  role: UserRole,
  permission: Permission,
): boolean {
  return permissionsByRole[role]?.includes(permission) ?? false;
}

export function getPermissions(role: UserRole): Permission[] {
  return [...(permissionsByRole[role] ?? [])];
}

export function getDashboardPath(type: InstitutionType): string {
  const paths: Record<InstitutionType, string> = {
    COACHING: "/dashboard/coaching",
    SCHOOL: "/dashboard/school",
    COLLEGE: "/dashboard/college",
    UNIVERSITY: "/dashboard/university",
    INSTITUTE: "/dashboard/institute",
    OTHER: "/dashboard/other",
  };

  return paths[type] ?? "/dashboard";
}
