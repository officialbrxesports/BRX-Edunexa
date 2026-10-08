'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';

type Step = 'email' | 'otp' | 'password' | 'success';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:3001';

export default function ForgotPasswordPage() {
  const [step, setStep] =
    useState<Step>('email');

  const [email, setEmail] =
    useState('');

  const [otp, setOtp] =
    useState('');

  const [password, setPassword] =
    useState('');

  const [confirmPassword, setConfirmPassword] =
    useState('');

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState('');

  const [message, setMessage] =
    useState('');

  const [resendIn, setResendIn] =
    useState(0);

  const startResendTimer = (
    seconds: number,
  ) => {
    setResendIn(seconds);

    const timer = setInterval(() => {
      setResendIn((current) => {
        if (current <= 1) {
          clearInterval(timer);
          return 0;
        }

        return current - 1;
      });
    }, 1000);
  };

  const getErrorMessage = async (
    response: Response,
  ) => {
    try {
      const data = await response.json();

      if (Array.isArray(data.message)) {
        return data.message.join(', ');
      }

      return (
        data.message ||
        'Something went wrong. Please try again.'
      );
    } catch {
      return 'Something went wrong. Please try again.';
    }
  };

  const requestOtp = async (
    event: FormEvent,
  ) => {
    event.preventDefault();

    setError('');
    setMessage('');

    if (!email.trim()) {
      setError(
        'Please enter your email address.',
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/auth/forgot-password`,
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            email: email.trim(),
          }),
        },
      );

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(response),
        );
      }

      const data = await response.json();

      setMessage(
        data.message ||
          'If an account exists with this email, a reset OTP has been sent.',
      );

      setStep('otp');

      startResendTimer(
        data.resendAfterSeconds || 60,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to send OTP.',
      );
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (
    event: FormEvent,
  ) => {
    event.preventDefault();

    setError('');
    setMessage('');

    if (!/^\d{6}$/.test(otp)) {
      setError(
        'Please enter the 6-digit OTP.',
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/auth/verify-reset-otp`,
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            email: email.trim(),
            otp,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(response),
        );
      }

      setMessage(
        'OTP verified successfully.',
      );

      setStep('password');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to verify OTP.',
      );
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (
    event: FormEvent,
  ) => {
    event.preventDefault();

    setError('');
    setMessage('');

    if (password.length < 8) {
      setError(
        'Password must be at least 8 characters.',
      );
      return;
    }

    if (password !== confirmPassword) {
      setError(
        'Passwords do not match.',
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/auth/reset-password`,
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            email: email.trim(),
            otp,
            password,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(response),
        );
      }

      setStep('success');
      setMessage(
        'Your password has been reset successfully.',
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to reset password.',
      );
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    if (resendIn > 0 || loading) {
      return;
    }

    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/auth/forgot-password`,
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            email: email.trim(),
          }),
        },
      );

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(response),
        );
      }

      const data = await response.json();

      setMessage(
        data.message ||
          'A new OTP has been sent.',
      );

      setOtp('');

      startResendTimer(
        data.resendAfterSeconds || 60,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to resend OTP.',
      );
    } finally {
      setLoading(false);
    }
  };

  const stepNumber =
    step === 'email'
      ? 1
      : step === 'otp'
        ? 2
        : step === 'password'
          ? 3
          : 4;

  return (
    <main className="min-h-screen bg-[#060b18] text-white">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-violet-600/20 blur-3xl" />
      </div>

      <div className="relative flex min-h-screen items-center justify-center px-5 py-10">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/10 shadow-xl shadow-blue-950/30 backdrop-blur-xl">
              <span className="text-2xl font-black text-blue-400">
                B
              </span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight">
              BRX EduNexa
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Secure account recovery
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-2xl shadow-black/30 backdrop-blur-2xl sm:p-8">
            {step !== 'success' && (
              <>
                <div className="mb-7">
                  <div className="mb-3 flex items-center justify-between text-xs text-slate-500">
                    <span>
                      Step {stepNumber} of 3
                    </span>

                    <span>
                      {step === 'email'
                        ? 'Email'
                        : step === 'otp'
                          ? 'Verification'
                          : 'New Password'}
                    </span>
                  </div>

                  <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all duration-300"
                      style={{
                        width: `${(stepNumber / 3) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </>
            )}

            {step === 'email' && (
              <>
                <div className="mb-7">
                  <h2 className="text-2xl font-bold">
                    Forgot password?
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    Enter your registered email and
                    we&apos;ll send you a secure
                    verification OTP.
                  </p>
                </div>

                <form
                  onSubmit={requestOtp}
                  className="space-y-5"
                >
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      Email address
                    </label>

                    <input
                      type="email"
                      value={email}
                      onChange={(event) =>
                        setEmail(
                          event.target.value,
                        )
                      }
                      placeholder="you@example.com"
                      autoComplete="email"
                      className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/10"
                    />
                  </div>

                  <ActionButton
                    loading={loading}
                    text="Send OTP"
                    loadingText="Sending OTP..."
                  />
                </form>
              </>
            )}

            {step === 'otp' && (
              <>
                <div className="mb-7">
                  <h2 className="text-2xl font-bold">
                    Verify your email
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    Enter the 6-digit OTP sent to
                    <br />

                    <span className="font-medium text-slate-200">
                      {email}
                    </span>
                  </p>
                </div>

                <form
                  onSubmit={verifyOtp}
                  className="space-y-5"
                >
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      Verification OTP
                    </label>

                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={otp}
                      onChange={(event) =>
                        setOtp(
                          event.target.value.replace(
                            /\D/g,
                            '',
                          ),
                        )
                      }
                      placeholder="000000"
                      autoComplete="one-time-code"
                      className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-4 text-center text-xl font-bold tracking-[0.5em] text-white outline-none transition placeholder:tracking-normal placeholder:text-slate-600 focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/10"
                    />
                  </div>

                  <ActionButton
                    loading={loading}
                    text="Verify OTP"
                    loadingText="Verifying..."
                  />

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={resendOtp}
                      disabled={
                        resendIn > 0 ||
                        loading
                      }
                      className="text-sm font-medium text-blue-400 transition hover:text-blue-300 disabled:cursor-not-allowed disabled:text-slate-600"
                    >
                      {resendIn > 0
                        ? `Resend OTP in ${resendIn}s`
                        : 'Resend OTP'}
                    </button>
                  </div>
                </form>
              </>
            )}

            {step === 'password' && (
              <>
                <div className="mb-7">
                  <h2 className="text-2xl font-bold">
                    Create new password
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    Choose a new password with at
                    least 8 characters.
                  </p>
                </div>

                <form
                  onSubmit={resetPassword}
                  className="space-y-5"
                >
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      New password
                    </label>

                    <input
                      type="password"
                      value={password}
                      onChange={(event) =>
                        setPassword(
                          event.target.value,
                        )
                      }
                      placeholder="Enter new password"
                      autoComplete="new-password"
                      className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/10"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      Confirm password
                    </label>

                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(event) =>
                        setConfirmPassword(
                          event.target.value,
                        )
                      }
                      placeholder="Confirm new password"
                      autoComplete="new-password"
                      className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/10"
                    />
                  </div>

                  <ActionButton
                    loading={loading}
                    text="Reset Password"
                    loadingText="Resetting..."
                  />
                </form>
              </>
            )}

            {step === 'success' && (
              <div className="py-5 text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 ring-1 ring-emerald-400/20">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-8 w-8 text-emerald-400"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      d="M5 12.5 9.5 17 19 7.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                <h2 className="text-2xl font-bold">
                  Password reset successful
                </h2>

                <p className="mt-3 text-sm leading-6 text-slate-400">
                  Your password has been changed
                  successfully. You can now log in
                  with your new password.
                </p>

                <Link
                  href="/login"
                  className="mt-7 block w-full rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-3.5 text-center text-sm font-semibold text-white shadow-lg shadow-blue-950/30 transition hover:from-blue-500 hover:to-violet-500"
                >
                  Back to Login
                </Link>
              </div>
            )}

            {error && (
              <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm leading-5 text-red-300">
                {error}
              </div>
            )}

            {message &&
              step !== 'success' && (
                <div className="mt-5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm leading-5 text-emerald-300">
                  {message}
                </div>
              )}

            {step !== 'success' && (
              <div className="mt-7 border-t border-white/10 pt-6 text-center">
                <Link
                  href="/login"
                  className="text-sm font-medium text-slate-400 transition hover:text-white"
                >
                  ← Back to Login
                </Link>
              </div>
            )}
          </div>

          <p className="mt-6 text-center text-xs text-slate-600">
            © {new Date().getFullYear()} BRX
            EduNexa. Secure account recovery.
          </p>
        </div>
      </div>
    </main>
  );
}

function ActionButton({
  loading,
  text,
  loadingText,
}: {
  loading: boolean;
  text: string;
  loadingText: string;
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-950/30 transition hover:from-blue-500 hover:to-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? loadingText : text}
    </button>
  );
}