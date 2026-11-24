"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  School,
  Layers3,
  BookOpen,
  CalendarCheck,
  GraduationCap,
  UserRound,
  BriefcaseBusiness,
  Users,
  Trophy,
  Plus,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";

import DashboardAuth from "../../../components/dashboard/DashboardAuth";
import SubjectManagement from "../../../components/dashboard/SubjectManagement";
import AdmissionManagement from "../../../components/dashboard/AdmissionManagement";
import TeacherManagement from "../../../components/dashboard/TeacherManagement";
import StaffJoiningManagement from "../../../components/dashboard/StaffJoiningManagement";
import ParentManagement from "../../../components/dashboard/ParentManagement";
import AttendanceManagement from "../../../components/dashboard/AttendanceManagement";
import PeopleHub from "../../../components/dashboard/PeopleHub";
import SchoolExams from "../../../components/dashboard/SchoolExams";
import { CreateClassPanel, SectionsPanel } from "../../../components/dashboard/ClassSetup";

/* The Add hub is for creating and entering things.
   Viewing (counts, lists, reports, rank lists) lives on the dashboard. */

const categories = [
  {
    title: "ACADEMIC",
    items: [
      { name: "Class", icon: School },
      { name: "Section", icon: Layers3 },
      { name: "Subject", icon: BookOpen },
      { name: "Attendance", icon: CalendarCheck },
      { name: "Exam", icon: Trophy },
    ],
  },
  {
    title: "PEOPLE",
    items: [{ name: "Admission Form", icon: GraduationCap }],
  },
];

const TITLES: Record<string, string> = {
  Class: "Create Class",
  Section: "Section Management",
  Subject: "Subject Management",
  Attendance: "Mark Attendance",
  Exam: "Exams & Marks",
  "Admission Form": "Admissions & People",
};

function AddHubContent() {
  const [selected, setSelected] = useState("Class");
  const [refreshKey, setRefreshKey] = useState(0);

  const selectedItem = categories
    .flatMap((category) => category.items)
    .find((item) => item.name === selected);

  const SelectedIcon = selectedItem?.icon ?? Plus;

  return (
    <div className="flex h-[calc(100dvh-58px)] min-h-0 flex-col overflow-hidden bg-slate-50">
      <header className="flex h-14 shrink-0 items-center border-b border-slate-200 bg-white px-5">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-sm font-semibold text-blue-800"
        >
          <ArrowLeft size={18} />
          Dashboard
        </Link>
        <span className="mx-3 text-slate-300">/</span>
        <h1 className="text-sm font-bold text-slate-900">Add</h1>
      </header>

      <div className="flex min-h-0 flex-1 gap-4 overflow-hidden p-4 sm:gap-5 sm:p-5">
        <aside className="flex h-full w-64 shrink-0 flex-col overflow-hidden border border-slate-200 bg-white sm:w-72">
          <div className="shrink-0 border-b border-slate-100 p-4">
            <h2 className="text-lg font-bold text-slate-900">Create New</h2>
            <p className="mt-1 text-xs text-slate-500">Select what you want to add.</p>
          </div>

          <nav className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain p-4">
            {categories.map((category) => (
              <div key={category.title}>
                <h3 className="mb-2 px-2 text-[10px] font-bold tracking-wider text-slate-400">
                  {category.title}
                </h3>
                <div className="space-y-1">
                  {category.items.map((item) => {
                    const Icon = item.icon;
                    const active = selected === item.name;

                    return (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => setSelected(item.name)}
                        className={`flex w-full items-center justify-between px-3 py-3 text-left text-sm transition ${
                          active
                            ? "bg-blue-50 font-semibold text-blue-800"
                            : "text-slate-600 hover:bg-slate-50 hover:text-blue-800"
                        }`}
                      >
                        <span className="flex items-center gap-3">
                          <Icon size={18} />
                          {item.name}
                        </span>
                        {active && <ChevronRight size={16} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        <section className="flex h-full min-w-0 flex-1 flex-col overflow-hidden border border-slate-200 bg-white">
          <div className="flex shrink-0 items-center gap-3 border-b border-slate-100 p-5 sm:p-6">
            <div className="bg-blue-50 p-3 text-blue-800">
              <SelectedIcon size={25} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {TITLES[selected] ?? `Create ${selected}`}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                BRX EduNexa · see the results on the dashboard
              </p>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5 sm:p-8">
            {selected === "Admission Form" ? (
              <PeopleHub student={<AdmissionManagement />} />
            ) : selected === "Class" ? (
              <CreateClassPanel
                key={`class-${refreshKey}`}
                onCreated={() => setRefreshKey((n) => n + 1)}
              />
            ) : selected === "Section" ? (
              <SectionsPanel key={`sections-${refreshKey}`} />
            ) : selected === "Subject" ? (
              <SubjectManagement />
            ) : selected === "Attendance" ? (
              <AttendanceManagement />
            ) : selected === "Exam" ? (
              <SchoolExams />
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}

export default function AddPage() {
  return (
    <DashboardAuth>
      <AddHubContent />
    </DashboardAuth>
  );
}
