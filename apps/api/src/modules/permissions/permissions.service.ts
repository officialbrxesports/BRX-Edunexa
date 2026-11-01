
import { Injectable } from "@nestjs/common";

export type BrxRole =
  | "PLATFORM_ADMIN"
  | "HEAD"
  | "TEACHER"
  | "STAFF"
  | "STUDENT";

export type BrxPermission =
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

const PERMISSIONS: Record<BrxRole, BrxPermission[]> = {
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
  STUDENT: ["institution:read"],
};

@Injectable()
export class PermissionsService {
  getPermissions(role: string): BrxPermission[] {
    if (!(role in PERMISSIONS)) return [];
    return [...PERMISSIONS[role as BrxRole]];
  }

  hasPermission(role: string, permission: BrxPermission): boolean {
    return this.getPermissions(role).includes(permission);
  }

  assertPermission(role: string, permission: BrxPermission): void {
    if (!this.hasPermission(role, permission)) {
      const { ForbiddenException } = require("@nestjs/common");
      throw new ForbiddenException("Permission denied");
    }
  }
}
