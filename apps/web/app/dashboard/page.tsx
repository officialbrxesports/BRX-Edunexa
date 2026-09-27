"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import DashboardShell from "@/components/dashboard/DashboardShell";
import {
  normalizeInstitutionType,
  type InstitutionSession,
} from "@/lib/institution/institution-session";

type ClassItem = {
  id: string;
  name: string;
  code: string;
};

type UserItem = {
  id: string;
  firstName: string;
  lastName?: string | null;
  email: string;
  role: string;
};

export default function DashboardPage() {
  const [session, setSession] = useState<InstitutionSession | null>(null);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const token = localStorage.getItem("brx_access_token");

        if (!token) {
          window.location.href = "/login";
          return;
        }

        const headers = {
          Authorization: `Bearer ${token}`,
        };

        const [meResponse, classesResponse, usersResponse] =
          await Promise.all([
            fetch("http://localhost:3000/users/me", { headers }),
            fetch("http://localhost:3000/academics/classes", { headers }),
            fetch("http://localhost:3000/users", { headers }),
          ]);

        const meData = await meResponse.json();
        const classesData = await classesResponse.json();
        const usersData = await usersResponse.json();

        if (!meResponse.ok) {
          throw new Error(
            meData.message || "Failed to load account information",
          );
        }

        if (!classesResponse.ok) {
          throw new Error(
            classesData.message || "Failed to load classes",
          );
        }

        if (!usersResponse.ok) {
          throw new Error(
            usersData.message || "Failed to load users",
          );
        }

        setSession(meData);

        setClasses(
          Array.isArray(classesData) ? classesData : [],
        );

        setUsers(
          Array.isArray(usersData) ? usersData : [],
        );
      } catch (error) {
        console.warn(error);
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const teachers = users.filter(
    (user) => user.role === "TEACHER",
  );

  const students = users.filter(
    (user) => user.role === "STUDENT",
  );

  const staff = users.filter(
    (user) => user.role === "STAFF",
  );

  const institutionType = normalizeInstitutionType(
    session?.institution?.type,
  );

  const userName =
    [session?.firstName, session?.lastName]
      .filter(Boolean)
      .join(" ") || "Head";

  const institutionName =
    session?.institution?.name || "BRX EduNexa";

  const institutionCode =
    session?.institution?.code || "";

  return (
    <DashboardShell
      institutionType={institutionType}
      institutionName={institutionName}
      institutionCode={institutionCode}
      userName={userName}
      userRole={session?.role || "HEAD"}
    >
      <div className="mx-auto max-w-[1600px]">

        {/* Hero */}
        <section className="relative overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-blue-600/20 via-[#111936] to-violet-600/15 p-7 shadow-2xl shadow-black/20 sm:p-9">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="absolute -bottom-20 left-1/3 h-64 w-64 rounded-full bg-violet-500/10 blur-3xl" />

          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-300">
              <span className="h-2 w-2 rounded-full bg-blue-400" />
              {institutionType.replaceAll("_", " ")}
            </div>

            <p className="mt-5 text-sm text-slate-400">
              Welcome back 👋
            </p>

            <h2 className="mt-1 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {userName}
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Manage your institution, students, teachers,
              classes and academic activities from one place.
            </p>

            {institutionCode && (
              <div className="mt-5 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                <span className="text-xs text-slate-500">
                  Institution ID
                </span>

                <span className="text-xs font-bold tracking-wider text-blue-300">
                  {institutionCode}
                </span>
              </div>
            )}
          </div>
        </section>

        {/* Error */}
        {error && (
          <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Statistics */}
        <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Students"
            value={loading ? "..." : students.length}
            icon="👨‍🎓"
            description="Registered students"
          />

          <StatCard
            title="Teachers"
            value={loading ? "..." : teachers.length}
            icon="👨‍🏫"
            description="Teaching members"
          />

          <StatCard
            title="Classes"
            value={loading ? "..." : classes.length}
            icon="🏫"
            description="Active classes"
          />

          <StatCard
            title="Staff"
            value={loading ? "..." : staff.length}
            icon="👥"
            description="Institution staff"
          />
        </section>

        {/* Quick Actions */}
        <section className="mt-9">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">
              Quick Access
            </p>

            <h2 className="mt-1 text-xl font-bold text-white">
              Frequently Used
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <ActionCard
              title="Take Attendance"
              description="Mark today's student attendance"
              href="/attendance"
              icon="📝"
            />

            <ActionCard
              title="Attendance History"
              description="View previous attendance records"
              href="/attendance/history"
              icon="📋"
            />

            <ActionCard
              title="Monthly Report"
              description="View attendance analytics"
              href="/attendance/monthly"
              icon="📊"
            />

            <ActionCard
              title="Manage Users"
              description="Manage teachers, staff and students"
              href="/users"
              icon="👤"
            />
          </div>
        </section>

        {/* Institution Management */}
        <section className="mt-9">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-400">
              Management
            </p>

            <h2 className="mt-1 text-xl font-bold text-white">
              Institution Controls
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <ManagementCard
              title="Institution Settings"
              description="Manage institution details and configuration."
              href="/institution"
              icon="🏫"
            />

            <ManagementCard
              title="Fees"
              description="Manage fee plans, payments and receipts."
              href="/fees"
              icon="₹"
            />

            <ManagementCard
              title="Classes"
              description="Manage classes and academic structure."
              href="/classes"
              icon="📚"
            />
          </div>
        </section>

        {/* Classes */}
        <section className="mt-9 overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.035]">
          <div className="flex flex-col justify-between gap-3 border-b border-white/10 p-6 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">
                Academic Structure
              </p>

              <h2 className="mt-1 text-xl font-bold text-white">
                Classes
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Classes available in your institution
              </p>
            </div>

            <Link
              href="/classes"
              className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
            >
              Manage Classes →
            </Link>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="h-36 animate-pulse rounded-2xl bg-white/[0.04]"
                  />
                ))}
              </div>
            ) : classes.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center">
                <div className="text-3xl">🏫</div>

                <p className="mt-3 font-semibold text-slate-300">
                  No classes found
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Create a class to get started.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {classes.map((item) => (
                  <div
                    key={item.id}
                    className="group rounded-2xl border border-white/10 bg-white/[0.025] p-5 transition hover:-translate-y-1 hover:border-blue-400/20 hover:bg-white/[0.05]"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-xl">
                        🏫
                      </div>

                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-bold tracking-wider text-slate-400">
                        {item.code}
                      </span>
                    </div>

                    <h3 className="mt-4 text-lg font-bold text-white">
                      {item.name}
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      Class ID: {item.id.slice(0, 8)}...
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

      </div>
    </DashboardShell>
  );
}

function StatCard({
  title,
  value,
  icon,
  description,
}: {
  title: string;
  value: string | number;
  icon: string;
  description: string;
}) {
  return (
    <div className="group rounded-[24px] border border-white/10 bg-white/[0.035] p-5 transition hover:-translate-y-1 hover:border-white/15 hover:bg-white/[0.05]">
      <div className="flex items-start justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.06] text-2xl">
          {icon}
        </div>

        <span className="h-2 w-2 rounded-full bg-blue-400 shadow-lg shadow-blue-500/50" />
      </div>

      <p className="mt-5 text-sm font-medium text-slate-500">
        {title}
      </p>

      <p className="mt-1 text-3xl font-bold text-white">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-600">
        {description}
      </p>
    </div>
  );
}

function ActionCard({
  title,
  description,
  href,
  icon,
}: {
  title: string;
  description: string;
  href: string;
  icon: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-[22px] border border-white/10 bg-white/[0.035] p-5 transition hover:-translate-y-1 hover:border-blue-400/20 hover:bg-white/[0.055]"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-xl transition group-hover:bg-blue-500/20">
        {icon}
      </div>

      <h3 className="mt-4 font-bold text-white">
        {title}
      </h3>

      <p className="mt-1 text-sm leading-5 text-slate-500">
        {description}
      </p>

      <div className="mt-4 text-xs font-semibold text-blue-400">
        Open module →
      </div>
    </Link>
  );
}

function ManagementCard({
  title,
  description,
  href,
  icon,
}: {
  title: string;
  description: string;
  href: string;
  icon: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-[22px] border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-5 transition hover:-translate-y-1 hover:border-violet-400/20"
    >
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 text-xl">
          {icon}
        </div>

        <div>
          <h3 className="font-bold text-white">
            {title}
          </h3>

          <p className="mt-1 text-xs text-slate-500">
            Open module →
          </p>
        </div>
      </div>

      <p className="mt-4 text-sm leading-5 text-slate-500">
        {description}
      </p>
    </Link>
  );
}