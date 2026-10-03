"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "/api";

type SetupState = {
  academicSession: string;
  classes: boolean;
  sections: boolean;
  fees: boolean;
  attendance: boolean;
  exams: boolean;
};

export default function SetupPage() {
  const router = useRouter();

  const [sessionId, setSessionId] = useState("");

  const [setup, setSetup] = useState<SetupState>({
    academicSession: "2026-27",
    classes: true,
    sections: true,
    fees: true,
    attendance: true,
    exams: true,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const storedSessionId = localStorage.getItem(
      "brx_registration_session_id",
    );

    if (!storedSessionId) {
      router.replace("/register");
      return;
    }

    setSessionId(storedSessionId);

    const storedSetup = localStorage.getItem(
      "brx_setup",
    );

    if (storedSetup) {
      try {
        setSetup(JSON.parse(storedSetup));
      } catch {
        // Ignore invalid data.
      }
    }
  }, [router]);

  function toggle(
    key: keyof Omit<SetupState, "academicSession">,
  ) {
    setSetup((previous) => ({
      ...previous,
      [key]: !previous[key],
    }));
  }

  async function completeRegistration() {
    if (!sessionId) {
      setError("Registration session not found.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      localStorage.setItem(
        "brx_setup",
        JSON.stringify(setup),
      );

      const response = await fetch(
        `${API_URL}/registration/complete`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sessionId,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Unable to complete registration.",
        );
      }

      localStorage.setItem(
        "brx_registration_result",
        JSON.stringify(data),
      );

      router.push("/register/success");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to complete registration.",
      );
    } finally {
      setLoading(false);
    }
  }

  const options = [
    {
      key: "classes" as const,
      title: "Classes / Courses",
      description:
        "Manage academic classes or courses.",
      icon: "🎓",
    },
    {
      key: "sections" as const,
      title: "Sections / Batches",
      description:
        "Organize students into sections or batches.",
      icon: "👥",
    },
    {
      key: "fees" as const,
      title: "Fees",
      description:
        "Manage fee plans, payments and receipts.",
      icon: "💳",
    },
    {
      key: "attendance" as const,
      title: "Attendance",
      description:
        "Track daily student attendance.",
      icon: "📋",
    },
    {
      key: "exams" as const,
      title: "Exams & Results",
      description:
        "Manage tests, exams and academic results.",
      icon: "📝",
    },
  ];

  return (
    <main className="min-h-screen bg-[#070b18] text-white">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-[-100px] top-[-100px] h-[360px] w-[360px] rounded-full bg-blue-600/20 blur-[120px]" />
        <div className="absolute bottom-[-120px] right-[-100px] h-[420px] w-[420px] rounded-full bg-violet-600/20 blur-[130px]" />
      </div>

      <div className="relative mx-auto max-w-4xl px-5 py-12">
        <div className="mb-8">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 font-bold">
            BRX
          </div>

          <p className="text-xs uppercase tracking-[0.2em] text-blue-400">
            Final setup
          </p>

          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
            Configure your EduNexa workspace
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
            Choose the core modules you want to start
            with. You can change advanced settings later
            from the Head dashboard.
          </p>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-white/[0.06] p-6 shadow-2xl shadow-black/30 backdrop-blur-2xl sm:p-8">
          <div>
            <label className="text-sm font-medium text-slate-300">
              Academic session
            </label>

            <select
              value={setup.academicSession}
              onChange={(event) =>
                setSetup((previous) => ({
                  ...previous,
                  academicSession:
                    event.target.value,
                }))
              }
              className="mt-2 w-full rounded-2xl border border-white/10 bg-[#0d1325] px-4 py-3.5 outline-none focus:border-blue-500/60 sm:max-w-xs"
            >
              <option value="2026-27">
                2026 - 2027
              </option>
              <option value="2027-28">
                2027 - 2028
              </option>
              <option value="2028-29">
                2028 - 2029
              </option>
            </select>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {options.map((item) => {
              const enabled = setup[item.key];

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => toggle(item.key)}
                  className={`group rounded-2xl border p-5 text-left transition ${
                    enabled
                      ? "border-blue-500/30 bg-blue-500/[0.08]"
                      : "border-white/10 bg-white/[0.025]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-xl">
                        {item.icon}
                      </div>

                      <div>
                        <p className="font-semibold">
                          {item.title}
                        </p>

                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    <div
                      className={`mt-1 h-6 w-11 rounded-full p-1 transition ${
                        enabled
                          ? "bg-blue-600"
                          : "bg-white/10"
                      }`}
                    >
                      <div
                        className={`h-4 w-4 rounded-full bg-white transition ${
                          enabled
                            ? "translate-x-5"
                            : "translate-x-0"
                        }`}
                      />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-8 rounded-2xl border border-white/10 bg-black/20 p-5">
            <p className="text-sm font-semibold">
              🚀 What's next?
            </p>

            <ul className="mt-3 space-y-2 text-xs leading-5 text-slate-400">
              <li>• Your institution will be created.</li>
              <li>• Your account will become HEAD.</li>
              <li>
                • You can create teachers, staff and
                students.
              </li>
              <li>
                • Institution-specific modules will
                appear in your dashboard.
              </li>
            </ul>
          </div>

          {error && (
            <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={completeRegistration}
            disabled={loading}
            className="mt-7 w-full rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-4 font-semibold shadow-xl shadow-blue-900/20 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Creating your institution..."
              : "Complete Registration →"}
          </button>
        </div>
      </div>
    </main>
  );
}