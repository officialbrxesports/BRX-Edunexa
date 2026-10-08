'use client';

import Link from 'next/link';

export default function SecurityPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-5xl px-6 py-10">

        <div className="mb-8">
          <p className="text-sm font-medium text-indigo-400">
            BRX EduNexa
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            Security
          </h1>

          <p className="mt-2 text-slate-400">
            Manage your account security and active login sessions.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">

          <Link
            href="/security/sessions"
            className="
              rounded-2xl
              border
              border-white/10
              bg-white/5
              p-6
              transition
              hover:bg-white/10
            "
          >
            <div className="text-3xl">
              🔐
            </div>

            <h2 className="mt-4 text-xl font-semibold">
              Login Sessions
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              See where your BRX EduNexa account is currently signed in.
            </p>
          </Link>

          <div
            className="
              rounded-2xl
              border
              border-white/10
              bg-white/5
              p-6
            "
          >
            <div className="text-3xl">
              📧
            </div>

            <h2 className="mt-4 text-xl font-semibold">
              Login Alerts
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              You receive an email whenever your account is successfully logged in.
            </p>
          </div>

        </div>
      </div>
    </main>
  );
}