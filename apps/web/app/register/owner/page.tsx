"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const types = [
  {
    id: "SCHOOL",
    icon: "🏫",
    title: "School",
    text: "Manage school students, teachers and academics.",
  },
  {
    id: "COLLEGE",
    icon: "🎓",
    title: "College",
    text: "Manage college departments, students and faculty.",
  },
  {
    id: "UNIVERSITY",
    icon: "🏛️",
    title: "University",
    text: "Manage university programs, departments and students.",
  },
  {
    id: "COACHING",
    icon: "📚",
    title: "Coaching",
    text: "Manage batches, students, teachers and fees.",
  },
  {
    id: "INSTITUTE",
    icon: "🏢",
    title: "Institute",
    text: "Manage institute courses and learners.",
  },
  {
    id: "OTHER",
    icon: "📋",
    title: "Other",
    text: "Use BRX EduNexa for another education organization.",
  },
];

export default function RegisterPage() {
  const router = useRouter();

  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleOnboarding, setGoogleOnboarding] =
    useState(false);

  // ============================================
  // Detect Google onboarding flow
  // ============================================

  useEffect(() => {
    try {
      const googleCredential =
        sessionStorage.getItem(
          "brx_google_credential",
        );

      setGoogleOnboarding(
        Boolean(googleCredential),
      );
    } catch {
      setGoogleOnboarding(false);
    }
  }, []);

  // ============================================
  // Continue
  // ============================================

  const continueNext = () => {
    if (!selected || loading) {
      return;
    }

    setLoading(true);

    try {
      // Normal registration flow
      localStorage.setItem(
        "brx_registration_type",
        selected,
      );

      // Google onboarding flow also needs
      // the selected institution type.
      if (googleOnboarding) {
        sessionStorage.setItem(
          "brx_institution_type",
          selected,
        );
      }
    } catch {
      setLoading(false);
      return;
    }

    router.push("/register/owner");
  };

  // ============================================
  // Back to login
  // ============================================

  const goToLogin = () => {
    router.push("/login");
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#07112f] text-white">
      {/* ========================================
          Background Glow
      ======================================== */}

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 -top-40 h-[450px] w-[450px] rounded-full bg-blue-500/25 blur-[120px]" />

        <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-indigo-500/25 blur-[120px]" />

        <div className="absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/10 blur-[120px]" />
      </div>

      {/* ========================================
          Main Container
      ======================================== */}

      <div className="relative mx-auto flex min-h-screen max-w-6xl items-center justify-center p-5 sm:p-8">
        <div className="w-full rounded-[32px] border border-white/15 bg-white/[0.07] p-6 shadow-2xl backdrop-blur-2xl sm:p-10">

          {/* ======================================
              Header
          ====================================== */}

          <div className="mb-10 text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-xl font-black shadow-xl shadow-blue-500/20">
              B
            </div>

            <p className="text-xs font-bold tracking-[0.2em] text-blue-300">
              BRX EDUNEXA
            </p>

            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
              Create New Account
            </h1>

            <p className="mx-auto mt-3 max-w-xl text-sm text-slate-400">
              First, tell us what type of institution
              you manage.
            </p>

            {/* Google onboarding indicator */}
            {googleOnboarding && (
              <div className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-4 py-2 text-xs font-semibold text-blue-300">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-bold text-slate-700">
                  G
                </span>

                Google account setup
              </div>
            )}
          </div>

          {/* ======================================
              Institution Types
          ====================================== */}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {types.map((item) => {
              const active =
                selected === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={loading}
                  onClick={() =>
                    setSelected(item.id)
                  }
                  className={`group rounded-3xl border p-6 text-left transition ${
                    active
                      ? "border-blue-400/60 bg-blue-500/15 shadow-xl shadow-blue-500/10"
                      : "border-white/10 bg-white/[0.05] hover:border-white/25 hover:bg-white/[0.09]"
                  } ${
                    loading
                      ? "cursor-not-allowed opacity-70"
                      : ""
                  }`}
                >
                  {/* Card top */}
                  <div className="mb-5 flex items-center justify-between">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl text-2xl backdrop-blur ${
                        active
                          ? "bg-blue-500/20"
                          : "bg-white/10"
                      }`}
                    >
                      {item.icon}
                    </div>

                    {active && (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-xs font-bold shadow-lg shadow-blue-500/30">
                        ✓
                      </div>
                    )}
                  </div>

                  {/* Title */}
                  <h2 className="text-lg font-bold">
                    {item.title}
                  </h2>

                  {/* Description */}
                  <p className="mt-2 text-sm leading-5 text-slate-400">
                    {item.text}
                  </p>
                </button>
              );
            })}
          </div>

          {/* ======================================
              Selected Type
          ====================================== */}

          {selected && (
            <div className="mt-6 rounded-2xl border border-blue-400/15 bg-blue-500/[0.07] px-4 py-3 text-center text-sm text-blue-200">
              Selected institution type:{" "}
              <span className="font-bold text-white">
                {
                  types.find(
                    (item) =>
                      item.id === selected,
                  )?.title
                }
              </span>
            </div>
          )}

          {/* ======================================
              Buttons
          ====================================== */}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              disabled={loading}
              onClick={goToLogin}
              className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm font-semibold text-slate-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              ← Back to Login
            </button>

            <button
              type="button"
              disabled={!selected || loading}
              onClick={continueNext}
              className="flex-1 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 text-sm font-bold shadow-xl shadow-blue-600/20 transition hover:-translate-y-0.5 hover:shadow-blue-600/30 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading
                ? "Opening..."
                : "Continue →"}
            </button>
          </div>

          {/* ======================================
              Footer
          ====================================== */}

          <div className="mt-7 text-center">
            <p className="text-xs text-slate-500">
              Already have a BRX EduNexa account?
            </p>

            <button
              type="button"
              onClick={goToLogin}
              disabled={loading}
              className="mt-2 text-sm font-semibold text-blue-400 transition hover:text-blue-300 disabled:opacity-50"
            >
              Login to your account
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}