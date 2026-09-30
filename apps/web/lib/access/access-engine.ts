import type { InstitutionType, ModuleKey } from "../institution/modules";
import { INSTITUTION_MODULES } from "../institution/institution-config";

export type AccessRole =
  | "HEAD"
  | "TEACHER"
  | "STUDENT"
  | "STAFF";

const ROLE_FEATURES: Record<AccessRole, readonly ModuleKey[]> = {
  HEAD: [
    "dashboard",
    "students",
    "teachers",
    "staff",
    "parents",
    "classes",
    "sections",
    "subjects",
    "courses",
    "departments",
    "programs",
    "semesters",
    "batches",
    "attendance",
    "fees",
    "exams",
    "results",
    "homework",
    "assignments",
    "study-material",
    "timetable",
    "library",
    "hostel",
    "transport",
    "certificates",
    "research",
    "thesis",
    "notifications",
    "reports",
    "documents",
    "settings",
  ],

  TEACHER: [
    "dashboard",
    "students",
    "classes",
    "sections",
    "subjects",
    "courses",
    "departments",
    "programs",
    "semesters",
    "batches",
    "attendance",
    "exams",
    "results",
    "homework",
    "assignments",
    "study-material",
    "timetable",
    "notifications",
    "documents",
  ],

  STUDENT: [
    "dashboard",
    "classes",
    "sections",
    "subjects",
    "courses",
    "departments",
    "programs",
    "semesters",
    "batches",
    "attendance",
    "fees",
    "exams",
    "results",
    "homework",
    "assignments",
    "study-material",
    "timetable",
    "library",
    "notifications",
    "certificates",
    "documents",
  ],

  STAFF: [
    "dashboard",
    "students",
    "teachers",
    "classes",
    "sections",
    "attendance",
    "fees",
    "documents",
    "notifications",
    "reports",
  ],
};

export function getRoleFeatures(role: string): ModuleKey[] {
  const normalizedRole = role.toUpperCase() as AccessRole;
  return [...(ROLE_FEATURES[normalizedRole] ?? [])];
}

export function getAvailableFeatures(
  institutionType: InstitutionType,
  role: string,
): ModuleKey[] {
  const institutionFeatures = INSTITUTION_MODULES[institutionType] ?? [];
  const roleFeatures = new Set(getRoleFeatures(role));

  return institutionFeatures.filter((feature) =>
    roleFeatures.has(feature),
  );
}

export function hasAccess(
  institutionType: InstitutionType,
  role: string,
  feature: ModuleKey,
): boolean {
  return getAvailableFeatures(institutionType, role).includes(feature);
}
