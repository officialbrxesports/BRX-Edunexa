"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

type Step = "ask" | "code" | "done";

const inputClass =
  "mt-1 h-10 w-full border border-slate-300 px-3 text-sm text-slate-900 outline-none focus:border-blue-800";
const buttonClass =
  "inline-flex h-10 items-center justify-center bg-blue-800 px-4 text-sm font-semibold text-white hover:bg-blue-900 disabled:opacity-60";

async function post(path: string, body: unknown) {
  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const result = (await response.json().catch(() => ({}))) as {
    message?: string | string[];
  };

  if (!response.ok) {
    const message = Array.isArray(result.message)
      ? result.message.join(" ")
      : result.message;

    throw new Error(message || "Kuch gadbad ho gayi. Dobara try karo.");
  }

  return result;
}

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>("ask");
  const [identifier, setIdentifier] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [info, setInfo] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function run(action: () => Promise<void>) {
    setError("");
    setLoading(true);

    try {
      await action();
    } catch (err) {
      setError(
        err instanceof TypeError
          ? "Server se connect nahi ho pa raha. Thodi der baad try karo (server jaag raha ho sakta hai)."
          : err instanceof Error
            ? err.message
            : "Kuch gadbad ho gayi.",
      );
    } finally {
      setLoading(false);
    }
  }

  function sendCode(event?: FormEvent) {
    event?.preventDefault();

    void run(async () => {
      const result = await post("/auth/forgot-password", { identifier });
      setInfo(result.message as string);
      setStep("code");
    });
  }

  function resetPassword(event: FormEvent) {
    event.preventDefault();

    void run(async () => {
      await post("/auth/reset-password", { identifier, code, newPassword });
      setStep("done");
    });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900">Forgot your password?</h1>

        {step === "ask" && (
          <form onSubmit={sendCode} className="mt-4">
            <p className="text-sm text-slate-600">
              Apna email ya EduNexa ID daalo. Hum account ke email par 6 digit
              ka code bhejenge.
            </p>
            <label className="mt-4 block text-sm font-semibold text-slate-700" htmlFor="identifier">
              Email or EduNexa ID
            </label>
            <input
              id="identifier"
              className={inputClass}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              autoComplete="username"
              required
            />
            {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
            <button type="submit" className={`${buttonClass} mt-4`} disabled={loading}>
              {loading ? "Sending..." : "Send code"}
            </button>
          </form>
        )}

        {step === "code" && (
          <form onSubmit={resetPassword} className="mt-4">
            <p className="text-sm text-slate-600">{info}</p>
            <label className="mt-4 block text-sm font-semibold text-slate-700" htmlFor="code">
              6 digit code
            </label>
            <input
              id="code"
              className={inputClass}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              autoComplete="one-time-code"
              required
            />
            <label className="mt-4 block text-sm font-semibold text-slate-700" htmlFor="newPassword">
              New password
            </label>
            <input
              id="newPassword"
              type="password"
              className={inputClass}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
            <p className="mt-1 text-xs text-slate-500">
              Kam se kam 8 characters, ek letter aur ek number.
            </p>
            {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button type="submit" className={buttonClass} disabled={loading}>
                {loading ? "Saving..." : "Change password"}
              </button>
              <button
                type="button"
                className="text-sm font-semibold text-blue-800 hover:underline disabled:opacity-60"
                disabled={loading}
                onClick={() => sendCode()}
              >
                Send a new code
              </button>
            </div>
          </form>
        )}

        {step === "done" && (
          <div className="mt-4">
            <p className="text-sm text-green-800">
              Password badal gaya. Ab naye password se sign in karo.
            </p>
          </div>
        )}

        <div className="mt-6 border-t border-slate-200 pt-4 text-xs text-slate-600">
          Email nahi aa raha? Spam folder dekho, ya apne institution head se
          temporary password maango (institution head ke liye: EduNexa
          platform administrator).
        </div>

        <Link
          href="/login"
          className="mt-4 inline-flex h-9 items-center bg-slate-100 px-4 text-xs font-semibold text-slate-800 hover:bg-slate-200"
        >
          Back to sign in
        </Link>
      </div>
    </main>
  );
}
