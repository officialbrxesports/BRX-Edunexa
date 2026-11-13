"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "../../lib/api";
import ClassesView from "./ClassesView";
import {
  BookOpen,
  Building2,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  RefreshCw,
  School,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Users,
  type LucideIcon,
} from "lucide-react";

type Summary = {
  institution: { name: string; type: string; status: string };
  counts: {
    classes: number;
    sections: number;
    subjects: number;
    enrolledStudents: number;
    teachers: number;
    staff: number;
  };
  admissions: Record<string, number>;
  recentAdmissions: {
    id: string;
    applicationNumber: string;
    firstName: string;
    lastName: string | null;
    status: string;
    createdAt: string;
  }[];
};

type NavItem = { label: string; icon: LucideIcon; href?: string };

const NAV: NavItem[] = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Classes & Sections", icon: BookOpen },
];

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under review",
  CHANGES_REQUESTED: "Changes requested",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  ENROLLED: "Enrolled",
};

const COMING_SOON = ["Attendance", "Exams & results", "Fees", "Notices"];

function StatCard({
  title,
  value,
  icon: Icon,
  tint,
}: {
  title: string;
  value: number | string;
  icon: LucideIcon;
  tint: string;
}) {
  return (
    <div className="border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
        </div>
        <span className={`flex h-10 w-10 items-center justify-center ${tint}`}>
          <Icon size={20} />
        </span>
      </div>
    </div>
  );
}

export default function DashboardOverview({ type }: { type: string }) {
  const router = useRouter();
  const isSchool = type === "school";

  const [active, setActive] = useState("Overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(isSchool);
  const [error, setError] = useState("");
  const [refreshSignal, setRefreshSignal] = useState(0);

  const loadSummary = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/dashboard/summary`, {
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Could not load the dashboard summary.");
      }

      setSummary((await response.json()) as Summary);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load the summary.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isSchool) return;
    void loadSummary();
  }, [isSchool, loadSummary]);

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);

    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      });
    } catch (err) {
      console.error("Logout request failed:", err);
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

  const schoolName = summary?.institution.name ?? "Your school";
  const counts = summary?.counts;
  const admissions = summary?.admissions ?? {};
  const pendingAdmissions =
    (admissions.SUBMITTED ?? 0) +
    (admissions.UNDER_REVIEW ?? 0) +
    (admissions.CHANGES_REQUESTED ?? 0);

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
              School Administration
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-blue-100 md:block">{today}</span>

            {isSchool && (
              <>
                <button
                  type="button"
                  title="Refresh"
                  onClick={() => {
                    void loadSummary();
                    setRefreshSignal((n) => n + 1);
                  }}
                  disabled={loading}
                  className="flex h-8 items-center gap-1.5 bg-white/10 px-2.5 text-xs font-semibold text-white hover:bg-white/20 disabled:opacity-50"
                >
                  <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                  <span className="hidden sm:inline">Refresh</span>
                </button>

                <Link
                  href="/dashboard/add"
                  title="Create or edit"
                  className="flex h-8 items-center gap-1.5 bg-amber-400 px-2.5 text-xs font-bold text-white hover:bg-amber-500"
                >
                  <Plus size={14} />
                  Add
                </Link>
              </>
            )}

            <Link
              href="/editor"
              title="BRX AI Editor"
              className="flex h-9 items-center gap-2 bg-white/10 px-3 text-xs font-semibold text-white hover:bg-white/20"
            >
              <Sparkles size={17} />
              <span className="hidden sm:inline">AI Editor</span>
            </Link>

            <button
              type="button"
              title="Logout"
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex h-9 w-9 items-center justify-center hover:bg-white/10 disabled:opacity-50"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-64px)]">
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
          } w-65 shrink-0 flex-col border-r border-slate-200 bg-white lg:sticky lg:top-16 lg:flex lg:h-[calc(100vh-64px)]`}
        >
          <div className="border-b border-slate-100 px-5 py-5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center bg-blue-50 text-blue-800">
                <School size={21} />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-900">
                  {isSchool ? schoolName : "Dashboard"}
                </p>
                <p className="text-xs text-slate-500">Administration panel</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
            <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[.16em] text-slate-400">
              Workspace
            </p>

            {NAV.map(({ label, icon: Icon, href }) => (
              <button
                key={label}
                type="button"
                onClick={() => {
                  setSidebarOpen(false);
                  if (href) {
                    router.push(href);
                    return;
                  }
                  setActive(label);
                }}
                className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition ${
                  active === label
                    ? "bg-blue-50 font-semibold text-blue-800"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon size={17} />
                <span className="flex-1">{label}</span>
              </button>
            ))}
          </nav>

          <div className="border-t border-slate-100 p-4">
            <div className="flex items-center gap-2 bg-slate-50 p-3">
              <ShieldCheck size={18} className="text-emerald-600" />
              <div>
                <p className="text-xs font-semibold text-slate-700">
                  Secure workspace
                </p>
                <p className="text-[10px] text-slate-500">Role-protected area</p>
              </div>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-375">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-blue-800">
                  BRX EduNexa <span className="px-1 text-slate-400">/</span>{" "}
                  {active}
                </p>
                <h1 className="mt-1 text-2xl font-bold text-slate-900">
                  {active === "Overview" ? "School Dashboard" : active}
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  {isSchool && summary
                    ? `Workspace for ${schoolName}.`
                    : "Your institution workspace."}
                </p>
              </div>

            </div>

            {!isSchool ? (
              <div className="border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                The dedicated dashboard for this institution type is coming
                soon.
              </div>
            ) : active === "Classes & Sections" ? (
              <ClassesView refreshSignal={refreshSignal} />
            ) : (
              <>
                {error && (
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                    <span>{error}</span>
                    <button
                      type="button"
                      onClick={() => void loadSummary()}
                      className="font-semibold underline"
                    >
                      Try again
                    </button>
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <StatCard
                    title="Enrolled students"
                    value={counts ? counts.enrolledStudents : "-"}
                    icon={GraduationCap}
                    tint="bg-blue-50 text-blue-700"
                  />
                  <StatCard
                    title="Teachers"
                    value={counts ? counts.teachers : "-"}
                    icon={Users}
                    tint="bg-violet-50 text-violet-700"
                  />
                  <StatCard
                    title="Classes / sections"
                    value={counts ? `${counts.classes} / ${counts.sections}` : "-"}
                    icon={BookOpen}
                    tint="bg-emerald-50 text-emerald-700"
                  />
                  <StatCard
                    title="Admissions to review"
                    value={summary ? pendingAdmissions : "-"}
                    icon={UserCheck}
                    tint="bg-amber-50 text-amber-700"
                  />
                </div>

                <div className="mt-6 grid gap-6 xl:grid-cols-[2fr_1fr]">
                  <section className="border border-slate-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                      <h2 className="text-sm font-bold text-slate-900">
                        Recent admission applications
                      </h2>
                      <Link
                        href="/dashboard/add"
                        className="text-xs font-semibold text-blue-800 hover:underline"
                      >
                        Manage in Add
                      </Link>
                    </div>

                    {loading && !summary ? (
                      <p className="p-6 text-sm text-slate-500">Loading...</p>
                    ) : summary && summary.recentAdmissions.length > 0 ? (
                      <ul className="divide-y divide-slate-100">
                        {summary.recentAdmissions.map((item) => (
                          <li
                            key={item.id}
                            className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
                          >
                            <div>
                              <p className="font-semibold text-slate-900">
                                {item.firstName} {item.lastName ?? ""}
                              </p>
                              <p className="text-xs text-slate-500">
                                {item.applicationNumber} ·{" "}
                                {new Date(item.createdAt).toLocaleDateString(
                                  "en-IN",
                                )}
                              </p>
                            </div>
                            <span className="bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                              {STATUS_LABELS[item.status] ?? item.status}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="p-6 text-sm text-slate-500">
                        No admission applications yet.
                      </p>
                    )}
                  </section>

                  <section className="border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 px-4 py-3">
                      <h2 className="text-sm font-bold text-slate-900">
                        Admissions by status
                      </h2>
                    </div>
                    <ul className="divide-y divide-slate-100">
                      {Object.entries(STATUS_LABELS).map(([key, label]) => (
                        <li
                          key={key}
                          className="flex items-center justify-between px-4 py-2.5 text-sm"
                        >
                          <span className="text-slate-600">{label}</span>
                          <span className="font-semibold text-slate-900">
                            {summary ? (admissions[key] ?? 0) : "-"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </section>
                </div>

                <section className="mt-6 border border-slate-200 bg-white p-4 shadow-sm">
                  <h2 className="text-sm font-bold text-slate-900">
                    Coming soon
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    These modules are not built yet, so no numbers are shown.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {COMING_SOON.map((name) => (
                      <span
                        key={name}
                        className="border border-dashed border-slate-300 px-3 py-1.5 text-xs text-slate-500"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                </section>
              </>
            )}

            <footer className="mt-8 border-t border-slate-200 py-4 text-[11px] text-slate-400">
              BRX EduNexa · School management workspace
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}
