"use client";

import { useState } from "react";
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
    icon: "📖",
    title: "Other",
    text: "Use BRX EduNexa for another education organization.",
  },
];

export default function RegisterPage() {
  const router = useRouter();

  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(false);

  const continueNext = () => {
    if (!selected) return;

    setLoading(true);

    localStorage.setItem(
      "brx_registration_type",
      selected,
    );

    router.push("/register/owner");
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#07112f] text-white">

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 -top-40 h-[450px] w-[450px] rounded-full bg-blue-500/25 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-indigo-500/25 blur-[120px]" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-6xl items-center justify-center p-5 sm:p-8">

        <div className="w-full rounded-[32px] border border-white/15 bg-white/[0.07] p-6 shadow-2xl backdrop-blur-2xl sm:p-10">

          <div className="mb-10 text-center">

            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-xl font-black shadow-xl">
              B
            </div>

            <p className="text-xs font-bold tracking-[0.2em] text-blue-300">
              BRX EDUNEXA
            </p>

            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
              Create New Account
            </h1>

            <p className="mt-3 text-sm text-slate-400">
              First, tell us what type of institution
              you manage.
            </p>

          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

            {types.map((item) => {
              const active = selected === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelected(item.id)}
                  className={`group rounded-3xl border p-6 text-left transition ${
                    active
                      ? "border-blue-400/60 bg-blue-500/15 shadow-xl shadow-blue-500/10"
                      : "border-white/10 bg-white/[0.05] hover:border-white/25 hover:bg-white/[0.09]"
                  }`}
                >

                  <div className="mb-5 flex items-center justify-between">

                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-2xl backdrop-blur">
                      {item.icon}
                    </div>

                    {active && (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-xs">
                        ✓
                      </div>
                    )}

                  </div>

                  <h2 className="text-lg font-bold">
                    {item.title}
                  </h2>

                  <p className="mt-2 text-sm leading-5 text-slate-400">
                    {item.text}
                  </p>

                </button>
              );
            })}

          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">

            <button
              type="button"
              onClick={() => router.push("/login")}
              className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm font-semibold text-slate-300 transition hover:bg-white/10"
            >
              ← Back to Login
            </button>

            <button
              type="button"
              disabled={!selected || loading}
              onClick={continueNext}
              className="flex-1 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 text-sm font-bold shadow-xl shadow-blue-600/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading
                ? "Opening..."
                : "Continue →"}
            </button>

          </div>

        </div>
      </div>
    </main>
  );
}