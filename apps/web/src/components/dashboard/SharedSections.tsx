"use client";

import {
  Bell,
  BriefcaseBusiness,
  GraduationCap,
  ShieldCheck,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import ParentManagement from "./ParentManagement";
import SchoolNotices from "./SchoolNotices";
import TeacherManagement from "./TeacherManagement";

type Options = {
  /** Sidebar label for the student list, or omit when the dashboard already has one. */
  students?: string;
  notices?: boolean;
};

/** Read-only people lists + notices that every institution type shows on its dashboard. */
export function sharedNav(options: Options = {}): { label: string; icon: LucideIcon }[] {
  return [
    ...(options.students ? [{ label: options.students, icon: GraduationCap }] : []),
    { label: "Teachers", icon: UserRound },
    { label: "Staff", icon: BriefcaseBusiness },
    { label: "Guards", icon: ShieldCheck },
    { label: "Parents", icon: Users },
    ...(options.notices === false ? [] : [{ label: "Notices", icon: Bell }]),
  ];
}

export default function SharedSection({
  active,
  studentLabel,
  studentPath,
  noNotices = false,
}: {
  noNotices?: boolean;
  active: string;
  studentLabel?: string;
  studentPath?: string;
}) {
  if (studentLabel && active === studentLabel) {
    return <TeacherManagement key="student" kind="student" studentPath={studentPath} readOnly />;
  }

  if (active === "Teachers") return <TeacherManagement key="teacher" kind="teacher" readOnly />;
  if (active === "Staff") return <TeacherManagement key="staff" kind="staff" readOnly />;
  if (active === "Guards") return <TeacherManagement key="guard" kind="guard" readOnly />;
  if (active === "Parents") return <ParentManagement readOnly />;
  if (active === "Notices" && !noNotices) return <SchoolNotices />;

  return null;
}
