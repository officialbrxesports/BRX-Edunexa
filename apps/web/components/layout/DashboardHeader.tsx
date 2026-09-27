"use client";

import { useRouter } from "next/navigation";

type Props = {
  institutionName?: string;
  userName?: string;
  userRole?: string;
};

export default function DashboardHeader({
  institutionName = "BRX EduNexa",
  userName = "User",
  userRole = "HEAD",
}: Props) {
  const router = useRouter();

  function logout() {
    localStorage.removeItem(
      "brx_access_token",
    );

    document.cookie =
      "brx_access_token=; path=/; max-age=0";

    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#070b18]/80 backdrop-blur-2xl">
      <div className="flex h-[76px] items-center justify-between gap-4 px-5 sm:px-7">
        {/* Left */}
        <div className="min-w-0 lg:pl-[270px]">
          <p className="truncate text-xs text-slate-500">
            {institutionName}
          </p>

          <h1 className="truncate text-lg font-bold">
            Welcome back, {userName}
          </h1>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-400 transition hover:bg-white/[0.08] hover:text-white"
            title="Notifications"
          >
            🔔
          </button>

          <div className="hidden h-8 w-px bg-white/10 sm:block" />

          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold">
              {userName}
            </p>

            <p className="text-[10px] uppercase tracking-wider text-slate-500">
              {userRole}
            </p>
          </div>

          <button
            type="button"
            onClick={logout}
            className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-slate-400 transition hover:border-red-500/20 hover:bg-red-500/10 hover:text-red-300"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}