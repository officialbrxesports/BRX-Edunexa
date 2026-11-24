"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  Megaphone,
  ShieldCheck,
  UserRound,
  Users,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import PeopleHub from "./PeopleHub";
import { OtherGroups, OtherNotices } from "./OtherManagement";
import ParentManagement from "./ParentManagement";
import TeacherManagement from "./TeacherManagement";
import StaffJoiningManagement from "./StaffJoiningManagement";

type Item = { name: string; icon: LucideIcon };

const GROUPS: { title: string; items: Item[] }[] = [
  {
    title: "ORGANISE",
    items: [
      { name: "Group", icon: UsersRound },
      { name: "Notice", icon: Megaphone },
    ],
  },
  {
    title: "PEOPLE",
    items: [
      { name: "People", icon: Users },
    ],
  },
];

export default function OtherAdd() {
  const [selected, setSelected] = useState("Group");

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="border-b border-blue-900 bg-[#193f88] text-white">
        <div className="flex h-14 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2 font-bold">
            <span className="flex h-8 w-8 items-center justify-center bg-white text-blue-800">
              <Building2 size={18} />
            </span>
            BRX EduNexa
            <span className="hidden border-l border-white/30 pl-3 text-sm font-normal text-blue-100 sm:inline">
              Organisation · Create &amp; manage
            </span>
          </div>
          <Link
            href="/dashboard/other"
            className="flex h-8 items-center gap-1.5 bg-white/10 px-2.5 text-xs font-semibold hover:bg-white/20"
          >
            <ArrowLeft size={14} />
            Dashboard
          </Link>
        </div>
      </header>

      <div className="flex flex-col md:min-h-[calc(100vh-3.5rem)] md:flex-row">
        <aside className="shrink-0 border-b border-slate-200 bg-white md:w-60 md:border-b-0 md:border-r">
          {GROUPS.map((group) => (
            <div key={group.title} className="px-3 py-3">
              <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-[.16em] text-slate-400">
                {group.title}
              </p>
              <div className="flex flex-wrap gap-1 md:block md:space-y-1">
                {group.items.map(({ name, icon: Icon }) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setSelected(name)}
                    className={`flex items-center gap-2.5 px-3 py-2 text-left text-sm transition md:w-full ${
                      selected === name
                        ? "bg-blue-50 font-semibold text-blue-800"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Icon size={16} />
                    {name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </aside>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <h1 className="mb-4 text-xl font-bold text-slate-900">{selected}</h1>

            {selected === "Group" && <OtherGroups />}
            {selected === "Notice" && <OtherNotices />}
            {selected === "People" && (
              <PeopleHub
                studentLabel="Member"
                student={
                  <TeacherManagement key="member" kind="student" studentPath="/other/members" />
                }
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
