"use client";

import { useState, type ReactNode } from "react";
import {
  BriefcaseBusiness,
  GraduationCap,
  ShieldCheck,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import StaffJoiningManagement from "./StaffJoiningManagement";

type TabKey = "student" | "teacher" | "staff" | "guard" | "parent";

/**
 * The "Admission Form" area of every Add page: one bar to admit or create each
 * kind of person. `student` is the institution's own admission/member screen.
 */
export default function PeopleHub({
  student,
  studentLabel = "Student",
}: {
  student: ReactNode;
  studentLabel?: string;
}) {
  const [tab, setTab] = useState<TabKey>("student");

  const tabs: { key: TabKey; label: string; icon: LucideIcon }[] = [
    { key: "student", label: studentLabel, icon: GraduationCap },
    { key: "teacher", label: "Teacher", icon: UserRound },
    { key: "staff", label: "Staff", icon: BriefcaseBusiness },
    { key: "guard", label: "Security", icon: ShieldCheck },
    { key: "parent", label: "Parents", icon: Users },
  ];

  return (
    <div>
      <div className="-mt-1 mb-5 flex flex-wrap gap-1 border-b border-slate-200">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold ${
              tab === key
                ? "border-blue-700 text-blue-800"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {tab === "student" ? (
        student
      ) : tab === "teacher" ? (
        <StaffJoiningManagement key="teacher" fixedRole="TEACHER" />
      ) : tab === "staff" ? (
        <StaffJoiningManagement key="staff" fixedRole="STAFF" />
      ) : tab === "guard" ? (
        <StaffJoiningManagement key="guard" fixedRole="GUARD" />
      ) : (
        <StaffJoiningManagement key="parent" fixedRole="PARENT" />
      )}
    </div>
  );
}
