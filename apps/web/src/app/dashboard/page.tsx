
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

type User = {
  id: string;
  name: string;
  email: string;
  eduNexaId: string | null;
  role: string;
};

type SessionStatus = "loading" | "authenticated" | "error";

const quickLinks = [
  {
    icon: "01",
    title: "My courses",
    description: "Your enrolled courses will appear here.",
    status: "Coming soon",
  },
  {
    icon: "02",
    title: "Assignments",
    description: "Access assignments and track submissions.",
    status: "Coming soon",
  },
  {
    icon: "03",
    title: "Timetable",
    description: "Keep your classes and schedule organized.",
    status: "Coming soon",
  },
  {
    icon: "04",
    title: "Learning resources",
    description: "Find study materials in one place.",
    status: "Coming soon",
  },
];

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<SessionStatus>("loading");
  const [error, setError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let active = true;

    async function verifySession() {
      try {
        const response = await fetch(`${API_URL}/auth/me`, {
          credentials: "include",
          cache: "no-store",
        });

        if (!active) return;

        if (response.status === 401) {
          router.replace("/login");
          return;
        }

        if (!response.ok) {
          throw new Error("Session verify nahi ho saka.");
        }

        const result: { user: User } = await response.json();

        if (active) {
          setUser(result.user);
          setStatus("authenticated");
          setError("");
        }
      } catch {
        if (active) {
          setError(
            "API connection nahi ho pa raha. API check karke retry karo.",
          );
          setStatus("error");
        }
      }
    }

    void verifySession();

    return () => {
      active = false;
    };
  }, [router]);

  async function retrySession() {
    setError("");
    setUser(null);
    setStatus("loading");

    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        credentials: "include",
        cache: "no-store",
      });

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        throw new Error("Session verify nahi ho saka.");
      }

      const result: { user: User } = await response.json();
      setUser(result.user);
      setStatus("authenticated");
    } catch {
      setError("Session verify nahi hua. Connection check karke retry karo.");
      setStatus("error");
    }
  }

  async function handleLogout() {
    setLoggingOut(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Logout complete nahi ho saka.");
      }

      router.replace("/login");
    } catch {
      setError("Logout nahi ho saka. Connection check karke retry karo.");
      setLoggingOut(false);
    }
  }

  if (status === "loading") {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-950 p-6 text-white">
        <div className="text-center">
          <div
            className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-4 border-white/20 border-t-blue-500"
            aria-hidden="true"
          />
          <p role="status">EduNexa session verify ho raha hai...</p>
        </div>
      </main>
    );
  }

  if (status === "error" || !user) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-950 p-6 text-white">
        <section className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-400">
            BRX EduNexa
          </p>
          <h1 className="mt-4 text-2xl font-bold">
            Dashboard unavailable
          </h1>
          <p className="mt-3 text-slate-300">
            {error || "Account session verify nahi ho saka."}
          </p>
          <button
            type="button"
            onClick={retrySession}
            className="mt-6 rounded-xl bg-blue-600 px-5 py-3 font-semibold hover:bg-blue-500"
          >
            Retry connection
          </button>
          <button
            type="button"
            onClick={() => router.replace("/login")}
            className="ml-4 text-slate-300 underline"
          >
            Go to login
          </button>
        </section>
      </main>
    );
  }

  const details = [
    { label: "Full name", value: user.name },
    { label: "Email address", value: user.email },
    { label: "EduNexa ID", value: user.eduNexaId || "Not assigned" },
    { label: "Account role", value: user.role },
  ];

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 bg-slate-950/95">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <Link href="/" className="text-xl font-extrabold tracking-tight">
            BRX <span className="text-blue-400">EduNexa</span>
          </Link>

          <nav className="flex items-center gap-3">
            <Link
              href="/"
              className="rounded-xl px-4 py-2 text-sm text-slate-300 hover:bg-white/10 hover:text-white"
            >
              Home
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold hover:bg-white/10 disabled:opacity-50"
            >
              {loggingOut ? "Logging out..." : "Log out"}
            </button>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-12">
        <section className="relative overflow-hidden rounded-3xl border border-blue-400/20 bg-linear-to-br from-blue-950 via-slate-900 to-slate-900 p-7 sm:p-10">
          <div
            className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-300">
              Your learning space
            </p>
            <h1 className="mt-4 text-3xl font-extrabold leading-tight sm:text-5xl">
              Welcome back,
              <span className="mt-1 block wrap-break-word text-blue-300">
                {user.name}!
              </span>
            </h1>
            <p className="mt-5 max-w-2xl leading-7 text-slate-300">
              Your EduNexa journey starts here. Access your account details
              and explore the learning tools being prepared for your portal.
            </p>
            <a
              href="#account"
              className="mt-7 inline-flex rounded-xl bg-blue-500 px-5 py-3 font-bold text-white transition hover:bg-blue-400"
            >
              View my account
            </a>
          </div>
        </section>

        {error && (
          <p
            role="alert"
            className="mt-5 rounded-xl bg-red-950 p-4 text-red-200"
          >
            {error}
          </p>
        )}

        <section className="mt-10" aria-labelledby="tools-heading">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-blue-400">
                Learning workspace
              </p>
              <h2 id="tools-heading" className="mt-2 text-2xl font-bold">
                Your learning tools
              </h2>
            </div>
            <p className="text-sm text-slate-400">
              More features coming soon
            </p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {quickLinks.map((item) => (
              <article
                key={item.title}
                className="rounded-2xl border border-white/10 bg-white/4 p-6 transition hover:border-blue-400/30 hover:bg-white/[0.07]"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-blue-500/10 text-sm font-bold text-blue-300">
                    {item.icon}
                  </span>
                  <span className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-slate-400">
                    {item.status}
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-bold">{item.title}</h3>
                <p className="mt-2 min-h-12 text-sm leading-6 text-slate-400">
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section id="account" className="mt-12 scroll-mt-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-400">
              Account settings
            </p>
            <h2 className="mt-2 text-2xl font-bold">Your account</h2>
            <p className="mt-2 text-slate-400">
              Details returned by your verified EduNexa session.
            </p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {details.map((item) => (
              <article
                key={item.label}
                className="rounded-2xl border border-white/10 bg-white/4 p-6"
              >
                <p className="text-sm text-slate-400">{item.label}</p>
                <p className="mt-3 wrap-break-word text-lg font-semibold">
                  {item.value}
                </p>
              </article>
            ))}
          </div>
        </section>

        <footer className="mt-12 border-t border-white/10 py-6 text-sm text-slate-500">
          BRX EduNexa Â· Your learning journey, connected.
        </footer>
      </div>
    </main>
  );
}
