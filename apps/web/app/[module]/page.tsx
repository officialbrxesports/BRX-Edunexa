"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import {
  MODULES,
  type ModuleKey,
} from "@/lib/institution/modules";

const MODULE_ACTIONS: Partial<
  Record<
    ModuleKey,
    {
      title: string;
      description: string;
      href: string;
      icon: string;
    }[]
  >
> = {
  students: [
    {
      title: "All Students",
      description: "View and manage all students.",
      href: "/students",
      icon: "👨‍🎓",
    },
    {
      title: "Add Student",
      description: "Create a new student account.",
      href: "/users/create",
      icon: "➕",
    },
  ],

  teachers: [
    {
      title: "All Teachers",
      description: "View institution teachers.",
      href: "/users",
      icon: "👨‍🏫",
    },
  ],

  staff: [
    {
      title: "All Staff",
      description: "View and manage institution staff.",
      href: "/users",
      icon: "👥",
    },
  ],

  classes: [
    {
      title: "All Classes",
      description: "Manage academic classes.",
      href: "/classes",
      icon: "🏫",
    },
  ],

  attendance: [
    {
      title: "Take Attendance",
      description: "Mark today's attendance.",
      href: "/attendance",
      icon: "📝",
    },
    {
      title: "Attendance History",
      description: "View attendance records.",
      href: "/attendance/history",
      icon: "📋",
    },
    {
      title: "Monthly Report",
      description: "View monthly attendance analytics.",
      href: "/attendance/monthly",
      icon: "📊",
    },
  ],

  fees: [
    {
      title: "Fee Dashboard",
      description: "Manage fees and payments.",
      href: "/fees",
      icon: "₹",
    },
    {
      title: "Fee Plans",
      description: "Create and manage fee plans.",
      href: "/fees/plans",
      icon: "💳",
    },
    {
      title: "Payment History",
      description: "View fee payment records.",
      href: "/fees/payments",
      icon: "🧾",
    },
    {
      title: "Fee Reports",
      description: "View fee reports and analytics.",
      href: "/fees/reports",
      icon: "📈",
    },
  ],

  notifications: [
    {
      title: "Announcements",
      description: "Manage institution announcements.",
      href: "/notifications",
      icon: "📢",
    },
  ],

  reports: [
    {
      title: "Dashboard Reports",
      description: "View institution analytics.",
      href: "/dashboard",
      icon: "📊",
    },
  ],

  documents: [
    {
      title: "Institution Documents",
      description: "Manage important documents.",
      href: "/documents",
      icon: "📁",
    },
  ],

  settings: [
    {
      title: "Institution Settings",
      description: "Manage institution configuration.",
      href: "/institution",
      icon: "⚙️",
    },
  ],
};

function formatModuleName(value: string) {
  return value
    .replaceAll("-", " ")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function DynamicModulePage() {
  const params = useParams();

  const rawModule = Array.isArray(params.module)
    ? params.module[0]
    : params.module;

  const moduleKey = rawModule as ModuleKey;

  const module = MODULES[moduleKey];

  if (!module) {
    return (
      <main className="min-h-screen bg-[#070b18] p-6 text-white">
        <div className="mx-auto max-w-3xl rounded-3xl border border-red-500/20 bg-red-500/10 p-8">
          <p className="text-sm font-semibold text-red-300">
            Module Not Found
          </p>

          <h1 className="mt-2 text-2xl font-bold">
            {formatModuleName(rawModule || "Unknown")}
          </h1>

          <p className="mt-3 text-sm text-slate-400">
            This module is not registered in the BRX EduNexa
            module configuration.
          </p>

          <Link
            href="/dashboard"
            className="mt-6 inline-flex rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </main>
    );
  }

  const actions = MODULE_ACTIONS[module.key] ?? [];

  return (
    <main className="min-h-screen bg-[#070b18] p-5 text-white sm:p-7">
      <div className="mx-auto max-w-[1400px]">

        {/* Header */}
        <section className="relative overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-blue-600/15 via-[#111936] to-violet-600/10 p-7">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-500/15 blur-3xl" />

          <div className="relative">
            <Link
              href="/dashboard"
              className="text-xs font-semibold text-slate-500 transition hover:text-blue-300"
            >
              ← Dashboard
            </Link>

            <div className="mt-5 flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-2xl">
                {module.icon}
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">
                  BRX EduNexa Module
                </p>

                <h1 className="mt-1 text-3xl font-bold tracking-tight">
                  {module.label}
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                  {module.description}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Status */}
        <section className="mt-6 rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.06] p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
              ✓
            </span>

            <div>
              <p className="text-sm font-semibold text-emerald-300">
                Module Ready
              </p>

              <p className="text-xs text-slate-500">
                {module.label} module is registered in the
                institution module system.
              </p>
            </div>
          </div>
        </section>

        {/* Actions */}
        {actions.length > 0 ? (
          <section className="mt-8">
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-400">
                Quick Actions
              </p>

              <h2 className="mt-1 text-xl font-bold">
                {module.label} Management
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {actions.map((action) => (
                <Link
                  key={`${action.title}-${action.href}`}
                  href={action.href}
                  className="group rounded-[22px] border border-white/10 bg-white/[0.035] p-5 transition hover:-translate-y-1 hover:border-blue-400/20 hover:bg-white/[0.055]"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-xl transition group-hover:bg-blue-500/20">
                    {action.icon}
                  </div>

                  <h3 className="mt-4 font-bold text-white">
                    {action.title}
                  </h3>

                  <p className="mt-1 text-sm leading-5 text-slate-500">
                    {action.description}
                  </p>

                  <div className="mt-4 text-xs font-semibold text-blue-400">
                    Open →
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : (
          <section className="mt-8 rounded-[26px] border border-white/10 bg-white/[0.035] p-8">
            <div className="mx-auto max-w-xl text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10 text-3xl">
                {module.icon}
              </div>

              <h2 className="mt-5 text-xl font-bold">
                {module.label} Workspace
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                The module foundation is ready. Database
                operations and advanced features will be added
                here in the next implementation phase.
              </p>

              <div className="mt-6 inline-flex rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-slate-400">
                Module Key: {module.key}
              </div>
            </div>
          </section>
        )}

        {/* Future architecture */}
        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <InfoCard
            title="Database"
            text="Module-specific database operations will be connected here."
            icon="🗄️"
          />

          <InfoCard
            title="Permissions"
            text="Role-based access will control who can use this module."
            icon="🔐"
          />

          <InfoCard
            title="Analytics"
            text="Reports and performance analytics can be connected later."
            icon="📈"
          />
        </section>
      </div>
    </main>
  );
}

function InfoCard({
  title,
  text,
  icon,
}: {
  title: string;
  text: string;
  icon: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.05] text-lg">
        {icon}
      </div>

      <h3 className="mt-4 font-bold">
        {title}
      </h3>

      <p className="mt-1 text-sm leading-5 text-slate-500">
        {text}
      </p>
    </div>
  );
}