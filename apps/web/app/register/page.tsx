"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type InstitutionType =
  | "SCHOOL"
  | "COLLEGE"
  | "UNIVERSITY"
  | "COACHING"
  | "INSTITUTE"
  | "OTHER";

const INSTITUTION_TYPE_KEY = "brx_institution_type";
const REGISTRATION_TYPE_KEY = "brx_registration_type";

const institutionTypes: {
  value: InstitutionType;
  title: string;
  description: string;
  icon: string;
}[] = [
  {
    value: "SCHOOL",
    title: "School",
    description: "School, private school, public school or similar",
    icon: "🏫",
  },
  {
    value: "COLLEGE",
    title: "College",
    description: "Degree college or higher education college",
    icon: "🎓",
  },
  {
    value: "UNIVERSITY",
    title: "University",
    description: "University or university-level institution",
    icon: "🏛️",
  },
  {
    value: "COACHING",
    title: "Coaching",
    description: "Coaching centre, academy or preparation centre",
    icon: "📚",
  },
  {
    value: "INSTITUTE",
    title: "Institute",
    description: "Training, skill, professional or other institute",
    icon: "💼",
  },
  {
    value: "OTHER",
    title: "Other",
    description: "Other education-related organization",
    icon: "🏢",
  },
];

export default function RegisterPage() {
  const router = useRouter();

  const [selectedType, setSelectedType] =
    useState<InstitutionType | "">("");

  const [googleMode, setGoogleMode] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    const googleCredential =
      sessionStorage.getItem(
        "brx_google_credential",
      );

    const googleProfile =
      sessionStorage.getItem(
        "brx_google_profile",
      );

    const isGoogleOnboarding =
      Boolean(
        googleCredential &&
          googleProfile,
      );

    setGoogleMode(
      isGoogleOnboarding,
    );

    if (isGoogleOnboarding) {
      const existingGoogleType =
        sessionStorage.getItem(
          INSTITUTION_TYPE_KEY,
        );

      if (
        existingGoogleType &&
        institutionTypes.some(
          (item) =>
            item.value ===
            existingGoogleType,
        )
      ) {
        setSelectedType(
          existingGoogleType as InstitutionType,
        );
      }
    } else {
      const existingType =
        localStorage.getItem(
          REGISTRATION_TYPE_KEY,
        );

      if (
        existingType &&
        institutionTypes.some(
          (item) =>
            item.value === existingType,
        )
      ) {
        setSelectedType(
          existingType as InstitutionType,
        );
      }
    }

    setLoading(false);
  }, []);

  const continueRegistration = () => {
    if (!selectedType) {
      return;
    }

    if (googleMode) {
      sessionStorage.setItem(
        INSTITUTION_TYPE_KEY,
        selectedType,
      );

      sessionStorage.setItem(
        "brx_google_registration_started",
        "true",
      );
    } else {
      localStorage.setItem(
        REGISTRATION_TYPE_KEY,
        selectedType,
      );

      localStorage.setItem(
        INSTITUTION_TYPE_KEY,
        selectedType,
      );
    }

    router.push("/register/owner");
  };

  const goToLogin = () => {
    router.push("/login");
  };

  if (loading) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#07112f] px-4">
        <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-blue-500/20 blur-[100px]" />

        <div className="absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-indigo-500/20 blur-[100px]" />

        <div className="relative rounded-2xl border border-white/10 bg-white/[0.06] px-6 py-5 text-sm text-slate-300 backdrop-blur-xl">
          Loading registration...
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#07112f] px-4 py-8 sm:px-6 sm:py-12">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 -top-40 h-[420px] w-[420px] rounded-full bg-blue-500/20 blur-[120px]" />

        <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-indigo-500/20 blur-[130px]" />

        <div className="absolute left-1/2 top-1/2 h-[320px] w-[320px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-500/10 blur-[100px]" />
      </div>

      {/* Grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.8) 1px, transparent 1px)",
          backgroundSize: "45px 45px",
        }}
      />

      <div className="relative mx-auto w-full max-w-5xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() =>
              router.push("/")
            }
            className="flex items-center gap-3"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10 shadow-lg backdrop-blur-xl">
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 text-xs font-black text-white">
                B
              </div>
            </div>

            <div className="text-left">
              <p className="text-base font-bold text-white">
                BRX EduNexa
              </p>

              <p className="text-xs text-blue-200/60">
                Education Management
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={goToLogin}
            className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            Already have an account?
            <span className="ml-1 text-blue-300">
              Sign in
            </span>
          </button>
        </div>

        {/* Main Card */}
        <div className="overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.06] shadow-[0_30px_100px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
          <div className="p-6 sm:p-10 lg:p-12">
            {/* Progress */}
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500 text-sm font-bold text-white shadow-lg shadow-blue-500/20">
                1
              </div>

              <div className="h-px flex-1 bg-white/10" />

              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-sm font-bold text-slate-500">
                2
              </div>

              <div className="h-px flex-1 bg-white/10" />

              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-sm font-bold text-slate-500">
                3
              </div>
            </div>

            {/* Heading */}
            <div className="mb-8">
              <p className="text-xs font-bold tracking-[0.2em] text-blue-300">
                CREATE YOUR ACCOUNT
              </p>

              <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                {googleMode
                  ? "Complete your BRX EduNexa setup"
                  : "Create your institution"}
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
                {googleMode
                  ? "Your Google account is verified. First choose what type of institution you are creating."
                  : "Tell us what type of institution or education organization you want to manage with BRX EduNexa."}
              </p>
            </div>

            {/* Google verified banner */}
            {googleMode && (
              <div className="mb-7 flex items-start gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300">
                  ✓
                </div>

                <div>
                  <p className="text-sm font-semibold text-emerald-200">
                    Google account verified
                  </p>

                  <p className="mt-1 text-xs leading-5 text-emerald-200/60">
                    Continue with your institution
                    details below. Your Google
                    verification will be used later
                    in the account creation process.
                  </p>
                </div>
              </div>
            )}

            {/* Institution Types */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {institutionTypes.map(
                (item) => {
                  const active =
                    selectedType ===
                    item.value;

                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() =>
                        setSelectedType(
                          item.value,
                        )
                      }
                      className={`group relative min-h-[170px] rounded-3xl border p-5 text-left transition ${
                        active
                          ? "border-blue-400/60 bg-blue-500/10 shadow-[0_0_35px_rgba(59,130,246,0.12)]"
                          : "border-white/10 bg-white/[0.035] hover:border-white/20 hover:bg-white/[0.06]"
                      }`}
                    >
                      {/* Selected */}
                      {active && (
                        <span className="absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">
                          ✓
                        </span>
                      )}

                      {/* Icon */}
                      <div
                        className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl text-2xl transition ${
                          active
                            ? "bg-blue-500/15"
                            : "bg-white/[0.06] group-hover:bg-white/[0.09]"
                        }`}
                      >
                        {item.icon}
                      </div>

                      <h2
                        className={`text-lg font-bold ${
                          active
                            ? "text-white"
                            : "text-slate-200"
                        }`}
                      >
                        {item.title}
                      </h2>

                      <p className="mt-2 text-xs leading-5 text-slate-500">
                        {item.description}
                      </p>
                    </button>
                  );
                },
              )}
            </div>

            {/* Selected type */}
            {selectedType && (
              <div className="mt-6 rounded-2xl border border-blue-400/15 bg-blue-500/[0.06] px-4 py-3">
                <p className="text-xs text-slate-500">
                  Selected organization type
                </p>

                <p className="mt-1 text-sm font-semibold text-blue-200">
                  {
                    institutionTypes.find(
                      (item) =>
                        item.value ===
                        selectedType,
                    )?.title
                  }
                </p>
              </div>
            )}

            {/* Continue */}
            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={goToLogin}
                className="rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-3.5 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={continueRegistration}
                disabled={!selectedType}
                className="rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 px-7 py-3.5 text-sm font-bold text-white shadow-xl shadow-blue-600/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Continue
                <span className="ml-2">
                  →
                </span>
              </button>
            </div>

            {/* Footer note */}
            <div className="mt-8 border-t border-white/10 pt-6">
              <p className="text-center text-xs leading-5 text-slate-500">
                Teachers, staff and students are
                <span className="font-semibold text-slate-400">
                  {" "}not created during registration.
                </span>
                {" "}
                They will be managed later from
                your institution dashboard.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}