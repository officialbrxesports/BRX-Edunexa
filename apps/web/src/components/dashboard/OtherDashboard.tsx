"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  Plus,
  RefreshCw,
  UserRound,
  Users,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { API_URL, apiRequest } from "../../lib/api";
import type { OtherGroup, OtherNotice } from "./OtherManagement";

type Summary = {
  counts: { people: number; staff: number; groups: number; notices: number };
  recentNotices: OtherNotice[];
};

const NAV: { label: string; icon: LucideIcon }[] = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Groups", icon: UsersRound },
  { label: "Notices", icon: Megaphone },
];

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

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("en-IN");
}

function NoticeList({ notices }: { notices: OtherNotice[] }) {
  if (notices.length === 0) {
    return <p className="p-6 text-sm text-slate-500">No notice posted yet.</p>;
  }

  return (
    <ul className="divide-y divide-slate-100">
      {notices.map((notice) => (
        <li key={notice.id} className="px-4 py-3 text-sm">
          <p className="font-semibold text-slate-900">{notice.title}</p>
          <p className="text-xs text-slate-500">
            {formatDate(notice.createdAt)} ·{" "}
            {notice.groupName ? `Group: ${notice.groupName}` : "Everyone"}
          </p>
          <p className="mt-1 whitespace-pre-wrap text-slate-700">{notice.body}</p>
        </li>
      ))}
    </ul>
  );
}

export default function OtherDashboard() {
  const router = useRouter();
  const [active, setActive] = useState("Overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [groups, setGroups] = useState<OtherGroup[] | null>(null);
  const [notices, setNotices] = useState<OtherNotice[] | null>(null);
  const [name, setName] = useState("Your organisation");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [summaryData, groupData, noticeData, me] = await Promise.all([
        apiRequest<Summary>("/other/summary"),
        apiRequest<OtherGroup[]>("/other/groups"),
        apiRequest<OtherNotice[]>("/other/notices"),
        apiRequest<{ institution: { name: string } }>("/dashboard/me"),
      ]);
      setSummary(summaryData);
      setGroups(groupData);
      setNotices(noticeData);
      setName(me.institution.name);
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
              Organisation Administration
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
              href="/dashboard/other/add"
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
            <p className="truncate text-sm font-bold text-slate-900">{name}</p>
            <p className="text-xs text-slate-500">Organisation panel</p>
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
              {active === "Overview" ? "Organisation Dashboard" : active}
            </h1>
            <p className="mb-6 mt-1 text-sm text-slate-500">
              View only. Create groups, post notices and add people from Add.
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
                    title="People"
                    value={counts ? counts.people : "-"}
                    icon={Users}
                    tint="bg-blue-50 text-blue-700"
                  />
                  <StatCard
                    title="Staff"
                    value={counts ? counts.staff : "-"}
                    icon={UserRound}
                    tint="bg-violet-50 text-violet-700"
                  />
                  <StatCard
                    title="Active groups"
                    value={counts ? counts.groups : "-"}
                    icon={UsersRound}
                    tint="bg-emerald-50 text-emerald-700"
                  />
                  <StatCard
                    title="Notices"
                    value={counts ? counts.notices : "-"}
                    icon={Megaphone}
                    tint="bg-amber-50 text-amber-700"
                  />
                </div>

                <section className="mt-6 border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-100 px-4 py-3">
                    <h2 className="text-sm font-bold text-slate-900">Recent notices</h2>
                  </div>
                  {!summary ? (
                    <p className="p-6 text-sm text-slate-500">Loading...</p>
                  ) : (
                    <NoticeList notices={summary.recentNotices} />
                  )}
                </section>
              </>
            )}

            {active === "Groups" && (
              <section className="border border-slate-200 bg-white shadow-sm">
                {!groups ? (
                  <p className="p-6 text-sm text-slate-500">Loading...</p>
                ) : groups.length === 0 ? (
                  <p className="p-6 text-sm text-slate-500">
                    No group yet. Create one from Add.
                  </p>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {groups.map((group) => (
                      <li
                        key={group.id}
                        className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
                      >
                        <div>
                          <p className="font-semibold text-slate-900">
                            {group.name}
                            {!group.isActive && (
                              <span className="ml-2 bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                                INACTIVE
                              </span>
                            )}
                          </p>
                          {group.description && (
                            <p className="text-xs text-slate-500">{group.description}</p>
                          )}
                        </div>
                        <span className="text-xs text-slate-500">
                          {group.members.length} member
                          {group.members.length === 1 ? "" : "s"}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}

            {active === "Notices" && (
              <section className="border border-slate-200 bg-white shadow-sm">
                {!notices ? (
                  <p className="p-6 text-sm text-slate-500">Loading...</p>
                ) : (
                  <NoticeList notices={notices} />
                )}
              </section>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
