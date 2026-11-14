"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  CalendarClock,
  GraduationCap,
  Layers,
  LayoutDashboard,
  LogOut,
  Menu,
  PhoneCall,
  Plus,
  RefreshCw,
  Users,
  type LucideIcon,
} from "lucide-react";
import { API_URL, apiRequest } from "../../lib/api";
import { ENQUIRY_LABELS, type Enquiry } from "./EnquiryManagement";

type Summary = {
  counts: {
    activeBatches: number;
    studentsInBatches: number;
    teachers: number;
    openEnquiries: number;
    followUpsDue: number;
  };
  batches: Record<string, number>;
  enquiries: Record<string, number>;
  recentEnquiries: {
    id: string;
    name: string;
    phone: string;
    interest: string | null;
    status: string;
    createdAt: string;
  }[];
};

type Batch = {
  id: string;
  name: string;
  code: string;
  schedule: string | null;
  capacity: number;
  status: string;
  studentCount: number;
  teacherNames: string[];
};

const NAV: { label: string; icon: LucideIcon }[] = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Batches", icon: Layers },
  { label: "Enquiries", icon: PhoneCall },
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

export default function CoachingDashboard() {
  const router = useRouter();
  const [active, setActive] = useState("Overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [batches, setBatches] = useState<Batch[] | null>(null);
  const [enquiries, setEnquiries] = useState<Enquiry[] | null>(null);
  const [instituteName, setInstituteName] = useState("Your institute");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [summaryData, batchData, enquiryData, me] = await Promise.all([
        apiRequest<Summary>("/coaching/summary"),
        apiRequest<Batch[]>("/coaching/batches"),
        apiRequest<Enquiry[]>("/coaching/enquiries"),
        apiRequest<{ institution: { name: string } }>("/dashboard/me"),
      ]);
      setSummary(summaryData);
      setBatches(batchData);
      setEnquiries(enquiryData);
      setInstituteName(me.institution.name);
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
              Coaching Administration
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
              href="/dashboard/coaching/add"
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
            <p className="truncate text-sm font-bold text-slate-900">{instituteName}</p>
            <p className="text-xs text-slate-500">Coaching panel</p>
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
              {active === "Overview" ? "Coaching Dashboard" : active}
            </h1>
            <p className="mb-6 mt-1 text-sm text-slate-500">
              View only. Create or edit batches, enquiries and people from Add.
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
                    title="Active batches"
                    value={counts ? counts.activeBatches : "-"}
                    icon={Layers}
                    tint="bg-blue-50 text-blue-700"
                  />
                  <StatCard
                    title="Students in batches"
                    value={counts ? counts.studentsInBatches : "-"}
                    icon={GraduationCap}
                    tint="bg-emerald-50 text-emerald-700"
                  />
                  <StatCard
                    title="Teachers"
                    value={counts ? counts.teachers : "-"}
                    icon={Users}
                    tint="bg-violet-50 text-violet-700"
                  />
                  <StatCard
                    title="Open enquiries"
                    value={counts ? counts.openEnquiries : "-"}
                    note={
                      counts && counts.followUpsDue > 0
                        ? `${counts.followUpsDue} follow-up(s) due`
                        : undefined
                    }
                    icon={CalendarClock}
                    tint="bg-amber-50 text-amber-700"
                  />
                </div>

                <div className="mt-6 grid gap-6 xl:grid-cols-[2fr_1fr]">
                  <section className="border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 px-4 py-3">
                      <h2 className="text-sm font-bold text-slate-900">
                        Recent enquiries
                      </h2>
                    </div>
                    {!summary ? (
                      <p className="p-6 text-sm text-slate-500">Loading...</p>
                    ) : summary.recentEnquiries.length === 0 ? (
                      <p className="p-6 text-sm text-slate-500">No enquiries yet.</p>
                    ) : (
                      <ul className="divide-y divide-slate-100">
                        {summary.recentEnquiries.map((item) => (
                          <li
                            key={item.id}
                            className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
                          >
                            <div>
                              <p className="font-semibold text-slate-900">{item.name}</p>
                              <p className="text-xs text-slate-500">
                                {item.phone} · {item.interest ?? "No course noted"}
                              </p>
                            </div>
                            <span className="bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                              {ENQUIRY_LABELS[item.status] ?? item.status}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>

                  <section className="border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 px-4 py-3">
                      <h2 className="text-sm font-bold text-slate-900">Enquiry funnel</h2>
                    </div>
                    <ul className="divide-y divide-slate-100">
                      {Object.entries(ENQUIRY_LABELS).map(([key, label]) => (
                        <li
                          key={key}
                          className="flex items-center justify-between px-4 py-2.5 text-sm"
                        >
                          <span className="text-slate-600">{label}</span>
                          <span className="font-semibold text-slate-900">
                            {summary ? (summary.enquiries[key] ?? 0) : "-"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </section>
                </div>

                <section className="mt-6 border border-slate-200 bg-white p-4 shadow-sm">
                  <h2 className="text-sm font-bold text-slate-900">Coming soon</h2>
                  <p className="mt-1 text-xs text-slate-500">
                    These are not built yet, so no numbers are shown.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {["Test series & ranking", "Fee installments", "Attendance"].map(
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

            {active === "Batches" && (
              <section className="border border-slate-200 bg-white shadow-sm">
                {!batches ? (
                  <p className="p-6 text-sm text-slate-500">Loading...</p>
                ) : batches.length === 0 ? (
                  <p className="p-6 text-sm text-slate-500">
                    No batches yet. Use Add to create your first batch.
                  </p>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {batches.map((batch) => {
                      const percent = Math.min(
                        100,
                        Math.round((batch.studentCount / batch.capacity) * 100),
                      );

                      return (
                        <li key={batch.id} className="px-4 py-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-slate-900">
                              {batch.name}{" "}
                              <span className="text-xs font-normal text-slate-500">
                                {batch.code}
                              </span>
                            </p>
                            <span className="bg-slate-100 px-2 py-1 text-xs text-slate-700">
                              {batch.status}
                            </span>
                          </div>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {batch.schedule ?? "No schedule"} ·{" "}
                            {batch.teacherNames.length > 0
                              ? batch.teacherNames.join(", ")
                              : "No teacher"}
                          </p>
                          <div className="mt-2 flex items-center gap-3">
                            <div className="h-1.5 flex-1 bg-slate-100">
                              <div
                                className="h-1.5 bg-blue-600"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                            <span className="text-xs text-slate-600">
                              {batch.studentCount}/{batch.capacity}
                            </span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            )}

            {active === "Enquiries" && (
              <section className="border border-slate-200 bg-white shadow-sm">
                {!enquiries ? (
                  <p className="p-6 text-sm text-slate-500">Loading...</p>
                ) : enquiries.length === 0 ? (
                  <p className="p-6 text-sm text-slate-500">
                    No enquiries yet. Use Add to record one.
                  </p>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {enquiries.map((item) => (
                      <li
                        key={item.id}
                        className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
                      >
                        <div>
                          <p className="font-semibold text-slate-900">
                            {item.name}{" "}
                            <span className="text-xs font-normal text-slate-500">
                              {item.phone}
                            </span>
                          </p>
                          <p className="text-xs text-slate-500">
                            {item.interest ?? "No course noted"}
                            {item.followUpOn
                              ? ` · follow-up ${new Date(item.followUpOn).toLocaleDateString("en-IN")}`
                              : ""}
                          </p>
                        </div>
                        <span className="bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                          {ENQUIRY_LABELS[item.status] ?? item.status}
                        </span>
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
