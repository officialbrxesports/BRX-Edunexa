"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, Building2 } from "lucide-react";
import AttendanceManagement from "./AttendanceManagement";
import TestManagement from "./TestManagement";
import NotesEditor from "./NotesEditor";

function Shell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="border-b border-blue-900 bg-[#193f88] text-white">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          <div className="flex items-center gap-2 font-bold">
            <span className="flex h-8 w-8 items-center justify-center bg-white text-blue-800">
              <Building2 size={18} />
            </span>
            BRX EduNexa
          </div>
          <Link
            href="/dashboard"
            className="flex h-8 items-center gap-1.5 bg-white/10 px-2.5 text-xs font-semibold hover:bg-white/20"
          >
            <ArrowLeft size={14} />
            My dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6">
        <h1 className="mb-4 text-xl font-bold text-slate-900">{title}</h1>
        {children}
      </main>
    </div>
  );
}

export function TeacherAttendancePage() {
  return (
    <Shell title="Take attendance">
      <AttendanceManagement base="/teacher/attendance" />
    </Shell>
  );
}

export function TeacherTestsPage() {
  return (
    <Shell title="Tests & marks">
      <TestManagement
        basePath="/teacher/tests"
        batchesPath="/teacher/tests/batches"
        canDelete={false}
      />
    </Shell>
  );
}

export function TeacherNotesPage() {
  return (
    <Shell title="Notes">
      <NotesEditor />
    </Shell>
  );
}
