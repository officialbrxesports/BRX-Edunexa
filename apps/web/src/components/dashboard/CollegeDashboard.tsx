"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  GraduationCap,
  Landmark,
  Library,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  RefreshCw,
  Users,
  type LucideIcon,
} from "lucide-react";
import { API_URL, apiRequest } from "../../lib/api";
import type { Department, Program } from "./CollegeManagement";

type Summary = {
  counts: {
    departments: number;
    programs: number;
    studentsEnrolled: number;
    studentsWithoutProgram: number;
    teachers: number;
  };
  departments: {
    id: string;
    name: string;
    code: string;
    programs: number;
    students: number;
  }[];
};

const NAV: { label: string; icon: LucideIcon }[] = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Departments", icon: Landmark },
  { label: "Programs", icon: Library },
];

function StatCard({
  title,
  value,
  note,
  icon: Icon,
  tint,
}: {
  title: string;
  value: number | string;
  note?: string;
  icon: LucideIcon;
  tint: string;
}) {
  return (
    <div className="border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
          {note && <p className="mt-1 text-[11px] text-slate-500">{note}</p>}
        </div>
        <span className={`flex h-10 w-10 items-center justify-center ${tint}`}>
          <Icon size={20} />
        </span>
      </div>
    </div>
  );
}

export default function CollegeDashboard() {
  const router = useRouter();
  const [active, setActive] = useState("Overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [departments, setDepartments] = useState<Department[] | null>(null);
  const [programs, setPrograms] = useState<Program[] | null>(null);
  const [collegeName, setCollegeName] = useState("Your college");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [summaryData, departmentData, programData, me] = await Promise.all([
        apiRequest<Summary>("/college/summary"),
        apiRequest<Department[]>("/college/departments"),
        apiRequest<Program[]>("/college/programs"),
        apiRequest<{ institution: { name: string } }>("/dashboard/me"),
      ]);
      setSummary(summaryData);
      setDepartments(departmentData);
      setPrograms(programData);
      setCollegeName(me.institution.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function logout() {
    if (loggingOut) return;
    setLoggingOut(true);

    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      });
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const counts = summary?.counts;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="sticky top-0 z-30 border-b border-blue-900 bg-[#193f88] text-white shadow-sm">
        <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="inline-flex h-9 w-9 items-center justify-center hover:bg-white/10 lg:hidden"
              aria-label="Toggle menu"
            >
              <Menu size={20} />
            </button>
            <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
              <span className="flex h-9 w-9 items-center justify-center bg-white text-blue-800">
                <Building2 size={21} />
              </span>
              <span>BRX EduNexa</span>
            </Link>
            <span className="hidden border-l border-white/30 pl-3 text-sm text-blue-100 sm:block">
              College Administration
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-blue-100 md:block">{today}</span>
            <button
              type="button"
              onClick={() => void load()}
              disabled={loading}
              className="flex h-8 items-center gap-1.5 bg-white/10 px-2.5 text-xs font-semibold hover:bg-white/20 disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <Link
              href="/dashboard/college/add"
              className="flex h-8 items-center gap-1.5 bg-amber-400 px-2.5 text-xs font-bold text-white hover:bg-amber-500"
            >
              <Plus size={14} />
              Add
            </Link>
            <button
              type="button"
              onClick={logout}
              disabled={loggingOut}
              title="Logout"
              className="flex h-8 w-8 items-center justify-center hover:bg-white/10 disabled:opacity-50"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-4rem)]">
        {sidebarOpen && (
          <button
            aria-label="Close menu overlay"
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-20 bg-slate-900/40 lg:hidden"
          />
        )}

        <aside
          className={`${
            sidebarOpen ? "fixed inset-y-16 left-0 z-30 flex" : "hidden"
          } w-60 shrink-0 flex-col border-r border-slate-200 bg-white lg:sticky lg:top-16 lg:flex lg:h-[calc(100vh-4rem)]`}
        >
          <div className="border-b border-slate-100 px-5 py-5">
            <p className="truncate text-sm font-bold text-slate-900">{collegeName}</p>
            <p className="text-xs text-slate-500">College panel</p>
          </div>
          <nav className="flex-1 space-y-1 px-3 py-4">
            {NAV.map(({ label, icon: Icon }) => (
              <button
                key={label}
                type="button"
                onClick={() => {
                  setActive(label);
                  setSidebarOpen(false);
                }}
                className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition ${
                  active === label
                    ? "bg-blue-50 font-semibold text-blue-800"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon size={17} />
                {label}
              </button>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-375">
            <h1 className="text-2xl font-bold text-slate-900">
              {active === "Overview" ? "College Dashboard" : active}
            </h1>
            <p className="mb-6 mt-1 text-sm text-slate-500">
              View only. Create or edit departments, programs, courses and people from Add.
            </p>

            {error && (
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                <span>{error}</span>
                <button onClick={() => void load()} className="font-semibold underline">
                  Try again
                </button>
              </div>
            )}

            {active === "Overview" && (
              <>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <StatCard
                    title="Departments"
                    value={counts ? counts.departments : "-"}
                    icon={Landmark}
                    tint="bg-blue-50 text-blue-700"
                  />
                  <StatCard
                    title="Active programs"
                    value={counts ? counts.programs : "-"}
                    icon={Library}
                    tint="bg-violet-50 text-violet-700"
                  />
                  <StatCard
                    title="Students in programs"
                    value={counts ? counts.studentsEnrolled : "-"}
                    note={
                      counts && counts.studentsWithoutProgram > 0
                        ? `${counts.studentsWithoutProgram} not assigned to a program`
                        : undefined
                    }
                    icon={GraduationCap}
                    tint="bg-emerald-50 text-emerald-700"
                  />
                  <StatCard
                    title="Teachers"
                    value={counts ? counts.teachers : "-"}
                    icon={Users}
                    tint="bg-amber-50 text-amber-700"
                  />
                </div>

                <section className="mt-6 border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-100 px-4 py-3">
                    <h2 className="text-sm font-bold text-slate-900">
                      Students by department
                    </h2>
                  </div>
                  {!summary ? (
                    <p className="p-6 text-sm text-slate-500">Loading...</p>
                  ) : summary.departments.length === 0 ? (
                    <p className="p-6 text-sm text-slate-500">
                      No departments yet. Use Add &gt; Department to create one.
                    </p>
                  ) : (
                    <ul className="divide-y divide-slate-100">
                      {summary.departments.map((department) => (
                        <li
                          key={department.id}
                          className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
                        >
                          <p className="font-semibold text-slate-900">
                            {department.name}{" "}
                            <span className="text-xs font-normal text-slate-500">
                              {department.code}
                            </span>
                          </p>
                          <p className="text-xs text-slate-600">
                            {department.programs} program(s) · {department.students} students
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <section className="mt-6 border border-slate-200 bg-white p-4 shadow-sm">
                  <h2 className="text-sm font-bold text-slate-900">Coming soon</h2>
                  <p className="mt-1 text-xs text-slate-500">
                    These are not built yet, so no numbers are shown.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {["Semester exams & CGPA", "Course attendance", "Timetable", "Fees"].map(
                      (name) => (
                        <span
                          key={name}
                          className="border border-dashed border-slate-300 px-3 py-1.5 text-xs text-slate-500"
                        >
                          {name}
                        </span>
                      ),
                    )}
                  </div>
                </section>
              </>
            )}

            {active === "Departments" && (
              <section className="border border-slate-200 bg-white shadow-sm">
                {!departments ? (
                  <p className="p-6 text-sm text-slate-500">Loading...</p>
                ) : departments.length === 0 ? (
                  <p className="p-6 text-sm text-slate-500">
                    No departments yet. Use Add to create one.
                  </p>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {departments.map((department) => (
                      <li key={department.id} className="px-4 py-3 text-sm">
                        <p className="font-semibold text-slate-900">
                          {department.name}{" "}
                          <span className="text-xs font-normal text-slate-500">
                            {department.code}
                          </span>
                        </p>
                        <p className="text-xs text-slate-500">
                          HOD: {department.hodName ?? "not assigned"} ·{" "}
                          {department.programCount} program(s)
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}

            {active === "Programs" && (
              <section className="border border-slate-200 bg-white shadow-sm">
                {!programs ? (
                  <p className="p-6 text-sm text-slate-500">Loading...</p>
                ) : programs.length === 0 ? (
                  <p className="p-6 text-sm text-slate-500">
                    No programs yet. Use Add to create one.
                  </p>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {programs.map((program) => (
                      <li
                        key={program.id}
                        className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
                      >
                        <div>
                          <p className="font-semibold text-slate-900">
                            {program.name}{" "}
                            <span className="text-xs font-normal text-slate-500">
                              {program.code}
                              {program.isActive ? "" : " · inactive"}
                            </span>
                          </p>
                          <p className="text-xs text-slate-500">
                            {program.departmentName} · {program.semesters} semesters
                          </p>
                        </div>
                        <p className="text-xs text-slate-600">
                          {program.studentCount} students · {program.courseCount} courses ·{" "}
                          {program.totalCredits} credits
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
