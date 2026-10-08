"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type RegistrationResult = {
  accessToken?: string;

  institution?: {
    id?: string;
    code?: string;
    name?: string;
    type?: string;
    status?: string;
  };

  head?: {
    id?: string;
    brxUid?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    role?: string;
  };

  user?: {
    id?: string;
    brxUid?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    role?: string;
  };

  data?: {
    institution?: RegistrationResult["institution"];
    head?: RegistrationResult["head"];
  };
};

export default function RegistrationSuccessPage() {
  const router = useRouter();

  const [result, setResult] =
    useState<RegistrationResult | null>(null);

  const [isGoogleOnboarding, setIsGoogleOnboarding] =
    useState(false);

  useEffect(() => {
    let foundResult = false;

    // ============================================
    // GOOGLE ONBOARDING RESULT
    // ============================================

    const googleRaw = sessionStorage.getItem(
      "brx_google_onboarding_result",
    );

    if (googleRaw) {
      try {
        const parsed =
          JSON.parse(googleRaw) as RegistrationResult;

        setResult(parsed);
        setIsGoogleOnboarding(true);
        foundResult = true;
      } catch {
        sessionStorage.removeItem(
          "brx_google_onboarding_result",
        );
      }
    }

    // ============================================
    // NORMAL / CURRENT REGISTRATION RESULT
    // ============================================

    if (!foundResult) {
      const normalRaw = localStorage.getItem(
        "brx_registration_result",
      );

      if (normalRaw) {
        try {
          const parsed =
            JSON.parse(normalRaw) as RegistrationResult;

          setResult(parsed);

          if (parsed.accessToken) {
            setIsGoogleOnboarding(true);
          }

          foundResult = true;
        } catch {
          localStorage.removeItem(
            "brx_registration_result",
          );
        }
      }
    }

    // ============================================
    // NO RESULT
    // ============================================

    if (!foundResult) {
      router.replace("/login");
    }
  }, [router]);

  const institution =
    result?.institution ??
    result?.data?.institution;

  const head =
    result?.head ??
    result?.data?.head ??
    result?.user;

  function goToLogin() {
    const localStorageKeys = [
      "brx_registration_type",
      "brx_institution_details",
      "brx_owner_details",
      "brx_registration_session_id",
      "brx_registration_session",
      "brx_registration_verified",
      "brx_registration_result",
      "brx_setup",
    ];

    localStorageKeys.forEach((key) => {
      localStorage.removeItem(key);
    });

    const sessionStorageKeys = [
      "brx_google_onboarding_result",
      "brx_google_credential",
      "brx_google_profile",
      "brx_institution_type",
    ];

    sessionStorageKeys.forEach((key) => {
      sessionStorage.removeItem(key);
    });

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
          {/* Success icon */}
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-emerald-400/20 bg-emerald-500/10 text-4xl text-emerald-400 shadow-2xl shadow-emerald-900/20">
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
            {/* Google account badge */}
            {isGoogleOnboarding && (
              <div className="mb-6 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4">
                <p className="text-sm font-semibold text-emerald-300">
                  ✓ Google account connected
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-400">
                  Your verified Google account is connected
                  with your BRX Head account.
                </p>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Institution */}
              <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <p className="text-xs uppercase tracking-wider text-slate-500">
                  Institution
                </p>

                <p className="mt-2 text-lg font-semibold">
                  {institution?.name ||
                    "Your Institution"}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Type:{" "}
                  {institution?.type ||
                    "Institution"}
                </p>
              </div>

              {/* Institution Code */}
              <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <p className="text-xs uppercase tracking-wider text-slate-500">
                  Institution Code
                </p>

                <p className="mt-2 break-all text-2xl font-bold tracking-wider text-blue-400">
                  {institution?.code ||
                    "BRX----"}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Keep this code safe.
                </p>
              </div>

              {/* BRX UID */}
              <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-5 sm:col-span-2">
                <p className="text-xs uppercase tracking-wider text-slate-500">
                  Your BRX UID
                </p>

                <p className="mt-2 break-all text-2xl font-bold tracking-wider text-blue-400">
                  {head?.brxUid ||
                    "BRX-UID-PENDING"}
                </p>

                <p className="mt-2 text-xs leading-5 text-slate-500">
                  This permanent unique ID identifies
                  your BRX EduNexa Head account.
                </p>
              </div>

              {/* Head Account */}
              <div className="rounded-2xl border border-white/10 bg-black/20 p-5 sm:col-span-2">
                <p className="text-xs uppercase tracking-wider text-slate-500">
                  Head Account
                </p>

                <p className="mt-2 font-semibold">
                  {head?.firstName || ""}{" "}
                  {head?.lastName || ""}
                </p>

                <p className="mt-1 break-all text-sm text-slate-400">
                  {head?.email ||
                    "Email not available"}
                </p>

                <p className="mt-2 text-xs text-blue-400">
                  Role:{" "}
                  {head?.role || "HEAD"}
                </p>
              </div>
            </div>

            {/* Important BRX UID note */}
            <div className="mt-6 rounded-2xl border border-amber-400/10 bg-amber-400/[0.04] p-5">
              <p className="font-semibold text-amber-300">
                🔐 Save your BRX UID
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Your BRX UID is permanent and can be
                used to identify your Head account.
                Keep it safe for future login and
                account-related activities.
              </p>
            </div>

            {/* Next step */}
            <div className="mt-4 rounded-2xl border border-blue-500/10 bg-blue-500/5 p-5">
              <p className="font-semibold text-blue-300">
                🎯 Your next step
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Your BRX Head account is ready. Continue
                to login and start configuring teachers,
                students, classes, fees, attendance and
                other institution modules.
              </p>
            </div>

            {/* Login */}
            <button
              type="button"
              onClick={goToLogin}
              className="mt-7 w-full rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-4 font-semibold shadow-xl shadow-blue-900/20 transition hover:scale-[1.01] hover:shadow-blue-900/30"
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