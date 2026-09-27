"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type RegistrationResult = {
  institution?: {
    id?: string;
    code?: string;
    name?: string;
    type?: string;
    status?: string;
  };
  head?: {
    id?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    role?: string;
  };
};

export default function RegistrationSuccessPage() {
  const router = useRouter();

  const [result, setResult] =
    useState<RegistrationResult | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(
      "brx_registration_result",
    );

    if (!raw) {
      router.replace("/login");
      return;
    }

    try {
      setResult(JSON.parse(raw));
    } catch {
      router.replace("/login");
    }
  }, [router]);

  function goToLogin() {
    const cleanupKeys = [
      "brx_registration_type",
      "brx_institution_details",
      "brx_owner_details",
      "brx_registration_session_id",
      "brx_registration_session",
      "brx_registration_verified",
      "brx_setup",
    ];

    cleanupKeys.forEach((key) =>
      localStorage.removeItem(key),
    );

    router.push("/login");
  }

  return (
    <main className="min-h-screen bg-[#070b18] text-white">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-180px] h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-blue-600/20 blur-[130px]" />
        <div className="absolute bottom-[-140px] left-[-100px] h-[360px] w-[360px] rounded-full bg-violet-600/20 blur-[130px]" />
      </div>

      <div className="relative flex min-h-screen items-center justify-center px-5 py-10">
        <div className="w-full max-w-2xl text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-emerald-400/20 bg-emerald-500/10 text-4xl shadow-2xl shadow-emerald-900/20">
            ✓
          </div>

          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-400">
            Registration complete
          </p>

          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            Welcome to BRX EduNexa
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-slate-400">
            Your institution and Head account have been
            successfully created.
          </p>

          <div className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.06] p-6 text-left shadow-2xl shadow-black/30 backdrop-blur-2xl sm:p-8">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <p className="text-xs uppercase tracking-wider text-slate-500">
                  Institution
                </p>

                <p className="mt-2 text-lg font-semibold">
                  {result?.institution?.name ||
                    "Your Institution"}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Type:{" "}
                  {result?.institution?.type ||
                    "Institution"}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <p className="text-xs uppercase tracking-wider text-slate-500">
                  Institution Code
                </p>

                <p className="mt-2 text-2xl font-bold tracking-wider text-blue-400">
                  {result?.institution?.code ||
                    "BRX----"}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Keep this code safe.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-5 sm:col-span-2">
                <p className="text-xs uppercase tracking-wider text-slate-500">
                  Head Account
                </p>

                <p className="mt-2 font-semibold">
                  {result?.head?.firstName}{" "}
                  {result?.head?.lastName || ""}
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  {result?.head?.email}
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-blue-500/10 bg-blue-500/5 p-5">
              <p className="font-semibold text-blue-300">
                🎯 Your next step
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Login using your Head account and start
                configuring teachers, students, classes,
                fees, attendance and other modules.
              </p>
            </div>

            <button
              type="button"
              onClick={goToLogin}
              className="mt-7 w-full rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-4 font-semibold shadow-xl shadow-blue-900/20 transition hover:scale-[1.01]"
            >
              Go to Head Login →
            </button>
          </div>

          <p className="mt-6 text-xs text-slate-600">
            BRX EduNexa • Education Management Platform
          </p>
        </div>
      </div>
    </main>
  );
}