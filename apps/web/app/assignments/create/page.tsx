"use client";

import Link from "next/link";
import AssignmentForm from "@/components/assignments/AssignmentForm";

export default function CreateAssignmentPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* TOP BAR */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link
              href="/assignments"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-lg font-bold text-slate-600 transition hover:bg-slate-50"
            >
              ←
            </Link>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">
                BRX EduNexa
              </p>

              <h1 className="text-lg font-black text-slate-900">
                Assignment Management
              </h1>
            </div>
          </div>

          <Link
            href="/assignments"
            className="hidden rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50 sm:block"
          >
            View Assignments
          </Link>
        </div>
      </header>

      {/* MAIN */}
      <main className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <AssignmentForm />
      </main>
    </div>
  );
}