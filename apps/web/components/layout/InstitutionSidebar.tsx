"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getAvailableFeatures } from "@/lib/access/access-engine";
import type { InstitutionType } from "@/lib/institution/modules";
import { MODULES } from "@/lib/institution/modules";

type Props = {
  institutionType: InstitutionType;
  institutionName?: string;
  institutionCode?: string;
  userName?: string;
  userRole?: string;
};

export default function InstitutionSidebar({
  institutionType,
  institutionName = "BRX EduNexa",
  institutionCode,
  userName = "Head",
  userRole = "HEAD",
}: Props) {
  const pathname = usePathname();

  const featureKeys = getAvailableFeatures(
    institutionType,
    userRole,
  );

  const modules = featureKeys
    .map((key) => MODULES[key])
    .filter(Boolean);

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[270px] border-r border-white/10 bg-[#080d1c]/95 backdrop-blur-2xl lg:flex lg:flex-col">
      {/* Brand */}
      <div className="border-b border-white/10 px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 font-bold shadow-lg shadow-blue-900/30">
            BRX
          </div>

          <div className="min-w-0">
            <p className="font-bold tracking-tight">
              EduNexa
            </p>

            <p className="truncate text-xs text-slate-500">
              Education Platform
            </p>
          </div>
        </div>
      </div>

      {/* Institution */}
      <div className="border-b border-white/10 px-4 py-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
          <p className="truncate text-sm font-semibold">
            {institutionName}
          </p>

          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="rounded-lg bg-blue-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-blue-400">
              {institutionType}
            </span>

            {institutionCode && (
              <span className="truncate text-[10px] text-slate-500">
                {institutionCode}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-600">
          Main Menu
        </p>

        <div className="space-y-1">
          {modules.map((module) => {
            const active =
              pathname === module.path ||
              pathname.startsWith(`${module.path}/`);

            return (
              <Link
                key={module.key}
                href={module.path}
                className={`group flex items-center gap-3 rounded-xl px-3 py-3 transition ${
                  active
                    ? "bg-blue-600/15 text-blue-300 shadow-lg shadow-blue-950/10"
                    : "text-slate-400 hover:bg-white/[0.05] hover:text-white"
                }`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm ${
                    active
                      ? "bg-blue-600/20"
                      : "bg-white/[0.04] group-hover:bg-white/[0.08]"
                  }`}
                >
                  {module.icon}
                </span>

                <span className="truncate text-sm font-medium">
                  {module.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User */}
      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-500 text-sm font-bold">
            {userName.slice(0, 1).toUpperCase()}
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">
              {userName}
            </p>

            <p className="text-[10px] uppercase tracking-wider text-slate-500">
              {userRole}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
