"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Building2,
  GraduationCap,
  KeyRound,
  LogOut,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import { API_URL } from "../../lib/api";

type Me = {
  role: string;
  institution: { name: string; type: string };
  profile: { name: string; email: string; phone: string | null; eduNexaId: string };
  student?: {
    className: string | null;
    sectionName: string | null;
    guardians: { name: string; relation: string }[];
  };
  teacher?: {
    assignments: {
      id: string;
      subject: string;
      subjectCode: string;
      className: string;
      sectionName: string | null;
      weeklyPeriods: number;
    }[];
  };
  parent?: {
    children: {
      id: string;
      name: string;
      eduNexaId: string;
      relation: string;
      className: string | null;
      sectionName: string | null;
    }[];
  };
};

const ROLE_LABEL: Record<string, string> = {
  STUDENT: "Student",
  TEACHER: "Teacher",
  PARENT: "Parent / Guardian",
  STAFF: "Staff",
  GUARD: "Security Guard",
  PLATFORM_ADMIN: "Platform Admin",
};

const ROLE_ICON: Record<string, LucideIcon> = {
  STUDENT: GraduationCap,
  TEACHER: BookOpen,
  PARENT: Users,
  GUARD: ShieldCheck,
};

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-4 py-3">
        <h2 className="text-sm font-bold text-slate-900">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="p-5 text-sm text-slate-500">{text}</p>;
}

function classLabel(className: string | null, sectionName: string | null) {
  if (!className) return "Not assigned to a class yet";
  return sectionName ? `${className} · Section ${sectionName}` : className;
}

export default function RoleHome() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await fetch(`${API_URL}/dashboard/me`, {
          credentials: "include",
          cache: "no-store",
        });

        if (!response.ok) throw new Error("Could not load your dashboard.");

        const data = (await response.json()) as Me;
        if (active) setMe(data);
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Could not load.");
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

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

  const Icon = (me && ROLE_ICON[me.role]) || Building2;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="sticky top-0 z-30 border-b border-blue-900 bg-[#193f88] text-white">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <span className="flex h-8 w-8 items-center justify-center bg-white text-blue-800">
              <Building2 size={18} />
            </span>
            BRX EduNexa
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/change-password"
              className="flex h-8 items-center gap-1.5 bg-white/10 px-2.5 text-xs font-semibold hover:bg-white/20"
            >
              <KeyRound size={14} />
              <span className="hidden sm:inline">Change password</span>
            </Link>
            <button
              type="button"
              onClick={logout}
              disabled={loggingOut}
              title="Logout"
              className="flex h-8 w-8 items-center justify-center hover:bg-white/10 disabled:opacity-50"
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-5 px-4 py-6">
        {error && (
          <p className="border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {error}
          </p>
        )}

        {!me && !error && <p className="text-sm text-slate-500">Loading...</p>}

        {me && (
          <>
            <div className="flex items-center gap-4 border border-slate-200 bg-white p-5 shadow-sm">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center bg-blue-50 text-blue-800">
                <Icon size={24} />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-blue-800">
                  {ROLE_LABEL[me.role] ?? me.role} · {me.institution.name}
                </p>
                <h1 className="truncate text-xl font-bold text-slate-900">
                  Welcome, {me.profile.name}
                </h1>
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  {me.profile.eduNexaId} · {me.profile.email}
                  {me.profile.phone ? ` · ${me.profile.phone}` : ""}
                </p>
              </div>
            </div>

            {me.role === "STUDENT" && me.student && (
              <div className="grid gap-5 md:grid-cols-2">
                <Card title="My class">
                  <p className="p-5 text-sm font-semibold text-slate-800">
                    {classLabel(me.student.className, me.student.sectionName)}
                  </p>
                </Card>
                <Card title="My parents / guardians">
                  {me.student.guardians.length === 0 ? (
                    <Empty text="No parent or guardian linked yet." />
                  ) : (
                    <ul className="divide-y divide-slate-100">
                      {me.student.guardians.map((guardian) => (
                        <li
                          key={`${guardian.name}-${guardian.relation}`}
                          className="flex justify-between px-4 py-3 text-sm"
                        >
                          <span className="font-semibold text-slate-800">
                            {guardian.name}
                          </span>
                          <span className="text-xs text-slate-500">
                            {guardian.relation.toLowerCase()}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              </div>
            )}

            {me.role === "TEACHER" && me.teacher && (
              <Card title={`My subjects (${me.teacher.assignments.length})`}>
                {me.teacher.assignments.length === 0 ? (
                  <Empty text="No subjects assigned to you yet. Your school head can assign them." />
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {me.teacher.assignments.map((item) => (
                      <li
                        key={item.id}
                        className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
                      >
                        <div>
                          <p className="font-semibold text-slate-900">
                            {item.subject}{" "}
                            <span className="text-xs font-normal text-slate-500">
                              {item.subjectCode}
                            </span>
                          </p>
                          <p className="text-xs text-slate-500">
                            {classLabel(item.className, item.sectionName)}
                          </p>
                        </div>
                        <span className="bg-slate-100 px-2 py-1 text-xs text-slate-700">
                          {item.weeklyPeriods} periods / week
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            )}

            {me.role === "PARENT" && me.parent && (
              <Card title={`My children (${me.parent.children.length})`}>
                {me.parent.children.length === 0 ? (
                  <Empty text="No student is linked to your account yet. Please contact the school." />
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {me.parent.children.map((child) => (
                      <li
                        key={child.id}
                        className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
                      >
                        <div>
                          <p className="font-semibold text-slate-900">{child.name}</p>
                          <p className="text-xs text-slate-500">
                            {child.eduNexaId} ·{" "}
                            {classLabel(child.className, child.sectionName)}
                          </p>
                        </div>
                        <span className="bg-slate-100 px-2 py-1 text-xs text-slate-700">
                          {child.relation.toLowerCase()}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            )}

            {!["STUDENT", "TEACHER", "PARENT"].includes(me.role) && (
              <Card title="Your workspace">
                <Empty text="Your tools for this role are being built. Nothing to show yet." />
              </Card>
            )}

            <Card title="Coming soon">
              <p className="px-4 pb-1 pt-3 text-xs text-slate-500">
                These are not built yet, so no numbers are shown.
              </p>
              <div className="flex flex-wrap gap-2 p-4">
                {["Attendance", "Exams & results", "Fees", "Notices"].map((name) => (
                  <span
                    key={name}
                    className="border border-dashed border-slate-300 px-3 py-1.5 text-xs text-slate-500"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
