"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type VerifyMethod = "phone" | "email";

const API_URL = "http://localhost:3000";

export default function VerifyPage() {
  const router = useRouter();

  const [method, setMethod] = useState<VerifyMethod>("phone");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [expiresIn, setExpiresIn] = useState(300);
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    const storedSessionId = localStorage.getItem(
      "brx_registration_session_id",
    );

    const institutionRaw = localStorage.getItem(
      "brx_institution_details",
    );

    const ownerRaw = localStorage.getItem(
      "brx_owner_details",
    );

    if (!storedSessionId) {
      router.replace("/register");
      return;
    }

    setSessionId(storedSessionId);

    try {
      if (institutionRaw) {
        const institution = JSON.parse(institutionRaw);

        if (institution.phone) {
          setPhone(institution.phone);
        }

        if (institution.email) {
          setEmail(institution.email);
        }
      }

      if (ownerRaw) {
        const owner = JSON.parse(ownerRaw);

        if (owner.phone && !phone) {
          setPhone(owner.phone);
        }

        if (owner.email && !email) {
          setEmail(owner.email);
        }
      }
    } catch {
      // Ignore invalid localStorage data.
    }
  }, [router]);

  useEffect(() => {
    if (resendTimer <= 0) return;

    const timer = window.setInterval(() => {
      setResendTimer((value) => {
        if (value <= 1) {
          window.clearInterval(timer);
          return 0;
        }

        return value - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [resendTimer]);

  useEffect(() => {
    if (expiresIn <= 0) return;

    const timer = window.setInterval(() => {
      setExpiresIn((value) => {
        if (value <= 1) {
          window.clearInterval(timer);
          return 0;
        }

        return value - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [expiresIn]);

  function getVerificationType() {
    return method === "phone" ? "MOBILE" : "EMAIL";
  }

  function maskPhone(value: string) {
    if (!value) return "your mobile number";

    const clean = value.replace(/\s+/g, "");

    if (clean.length <= 4) {
      return clean;
    }

    return `${clean.slice(0, 3)}******${clean.slice(-2)}`;
  }

  function maskEmail(value: string) {
    if (!value) return "your email";

    const [name, domain] = value.split("@");

    if (!domain) return value;

    if (name.length <= 2) {
      return `${name[0] ?? "*"}***@${domain}`;
    }

    return `${name.slice(0, 2)}***@${domain}`;
  }

  async function sendOtp() {
    if (!sessionId) {
      setError("Registration session not found.");
      return;
    }

    if (resendTimer > 0) {
      return;
    }

    setSending(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/otp/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          type: getVerificationType(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Unable to send OTP. Please try again.",
        );
      }

      setExpiresIn(data?.expiresInSeconds ?? 300);
      setResendTimer(data?.resendAfterSeconds ?? 60);

      setMessage(
        method === "phone"
          ? "Mobile OTP sent successfully."
          : "Email OTP sent successfully.",
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to send OTP.",
      );
    } finally {
      setSending(false);
    }
  }

  async function verifyOtp(event: React.FormEvent) {
    event.preventDefault();

    if (!sessionId) {
      setError("Registration session not found.");
      return;
    }

    if (!/^\d{6}$/.test(otp)) {
      setError("Please enter the 6-digit OTP.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/otp/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          type: getVerificationType(),
          otp,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "OTP verification failed.",
        );
      }

      const verification = data?.verification;

      localStorage.setItem(
        "brx_registration_verified",
        JSON.stringify(verification ?? {}),
      );

      setMessage(
        data?.message ||
          "OTP verified successfully.",
      );

      setOtp("");

      if (verification?.completed) {
        router.push("/register/setup");
      } else if (
        method === "phone" &&
        verification?.mobileVerified
      ) {
        setMethod("email");
        setExpiresIn(0);
        setResendTimer(0);
        setMessage(
          "Mobile verified. Now verify your email.",
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "OTP verification failed.",
      );
    } finally {
      setLoading(false);
    }
  }

  function switchMethod(nextMethod: VerifyMethod) {
    setMethod(nextMethod);
    setOtp("");
    setError("");
    setMessage("");
    setExpiresIn(0);
    setResendTimer(0);
  }

  const target =
    method === "phone"
      ? maskPhone(phone)
      : maskEmail(email);

  const timerText =
    expiresIn > 0
      ? `${Math.floor(expiresIn / 60)
          .toString()
          .padStart(2, "0")}:${(expiresIn % 60)
          .toString()
          .padStart(2, "0")}`
      : "Expired";

  return (
    <main className="min-h-screen bg-[#070b18] text-white">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-[-120px] top-[-100px] h-[360px] w-[360px] rounded-full bg-blue-600/20 blur-[120px]" />
        <div className="absolute bottom-[-120px] right-[-100px] h-[420px] w-[420px] rounded-full bg-violet-600/20 blur-[130px]" />
      </div>

      <div className="relative flex min-h-screen items-center justify-center px-5 py-10">
        <div className="w-full max-w-xl">
          <div className="mb-7 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-xl font-bold shadow-2xl shadow-blue-900/30 backdrop-blur-xl">
              BRX
            </div>

            <h1 className="text-3xl font-bold tracking-tight">
              Verify your account
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Verify your contact details to continue
              setting up BRX EduNexa.
            </p>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/[0.06] p-6 shadow-2xl shadow-black/30 backdrop-blur-2xl sm:p-8">
            <div className="grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-black/20 p-1">
              <button
                type="button"
                onClick={() => switchMethod("phone")}
                className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  method === "phone"
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                📱 Mobile OTP
              </button>

              <button
                type="button"
                onClick={() => switchMethod("email")}
                className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  method === "email"
                    ? "bg-violet-600 text-white shadow-lg shadow-violet-600/20"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                ✉️ Email OTP
              </button>
            </div>

            <div className="mt-7 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <p className="text-sm text-slate-400">
                OTP will be verified for
              </p>

              <p className="mt-1 break-all text-lg font-semibold">
                {target}
              </p>

              <button
                type="button"
                onClick={sendOtp}
                disabled={sending || resendTimer > 0}
                className="mt-4 text-sm font-semibold text-blue-400 transition hover:text-blue-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sending
                  ? "Sending..."
                  : resendTimer > 0
                    ? `Resend in ${resendTimer}s`
                    : "Send OTP"}
              </button>
            </div>

            <form
              onSubmit={verifyOtp}
              className="mt-6"
            >
              <label
                htmlFor="otp"
                className="text-sm font-medium text-slate-300"
              >
                Enter 6-digit OTP
              </label>

              <input
                id="otp"
                value={otp}
                onChange={(event) =>
                  setOtp(
                    event.target.value
                      .replace(/\D/g, "")
                      .slice(0, 6),
                  )
                }
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="••••••"
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-5 py-4 text-center text-2xl tracking-[0.65em] text-white outline-none transition placeholder:text-slate-700 focus:border-blue-500/60 focus:ring-4 focus:ring-blue-500/10"
              />

              <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                <span>
                  {expiresIn > 0
                    ? `OTP expires in ${timerText}`
                    : "Request a new OTP if expired"}
                </span>

                <span>6 digits</span>
              </div>

              {error && (
                <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {error}
                </div>
              )}

              {message && (
                <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={
                  loading ||
                  otp.length !== 6
                }
                className="mt-6 w-full rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-4 font-semibold text-white shadow-xl shadow-blue-900/20 transition hover:scale-[1.01] hover:shadow-blue-900/30 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "Verifying..."
                  : "Verify & Continue"}
              </button>
            </form>

            <div className="mt-7 text-center text-xs text-slate-500">
              Registration session is temporary and
              expires automatically for security.
            </div>
          </div>

          <div className="mt-5 text-center">
            <button
              type="button"
              onClick={() =>
                router.push("/register/owner")
              }
              className="text-sm text-slate-500 transition hover:text-white"
            >
              ← Back
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}