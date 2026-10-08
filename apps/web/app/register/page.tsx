'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? '/api';

const SESSION_KEY =
  'brx_registration_session_id';

const INSTITUTION_KEY =
  'brx_institution_details';

const OWNER_KEY =
  'brx_owner_details';

const VERIFIED_KEY =
  'brx_registration_verified';

type VerificationResponse = {
  success?: boolean;
  message?: string;
  verification?: {
    mobileVerified?: boolean;
    emailVerified?: boolean;
    completed?: boolean;
  };
};

export default function RegistrationVerifyPage() {
  const router = useRouter();

  const [sessionId, setSessionId] =
    useState('');

  const [email, setEmail] =
    useState('');

  const [otp, setOtp] =
    useState('');

  const [loading, setLoading] =
    useState(false);

  const [sending, setSending] =
    useState(false);

  const [message, setMessage] =
    useState('');

  const [error, setError] =
    useState('');

  const [resendSeconds, setResendSeconds] =
    useState(0);

  const [expiresSeconds, setExpiresSeconds] =
    useState(0);

  useEffect(() => {
    const storedSessionId =
      localStorage.getItem(SESSION_KEY);

    if (!storedSessionId) {
      router.replace('/register/owner');
      return;
    }

    setSessionId(storedSessionId);

    try {
      const institutionRaw =
        localStorage.getItem(INSTITUTION_KEY);

      const ownerRaw =
        localStorage.getItem(OWNER_KEY);

      const institution =
        institutionRaw
          ? JSON.parse(institutionRaw)
          : {};

      const owner =
        ownerRaw
          ? JSON.parse(ownerRaw)
          : {};

      const resolvedEmail =
        institution?.institutionEmail ||
        owner?.ownerEmail ||
        '';

      setEmail(resolvedEmail);
    } catch {
      setEmail('');
    }
  }, [router]);

  useEffect(() => {
    if (resendSeconds <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setResendSeconds((current) =>
        current > 0 ? current - 1 : 0,
      );
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [resendSeconds]);

  useEffect(() => {
    if (expiresSeconds <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setExpiresSeconds((current) =>
        current > 0 ? current - 1 : 0,
      );
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [expiresSeconds]);

  const getErrorMessage = (
    data: any,
  ) => {
    return (
      data?.message ||
      data?.error ||
      'Something went wrong. Please try again.'
    );
  };

  const sendOtp = async () => {
    if (!sessionId) {
      setError(
        'Registration session not found.',
      );
      return;
    }

    if (resendSeconds > 0) {
      return;
    }

    setSending(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch(
        `${API_URL}/otp/send`,
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            sessionId,
            type: 'EMAIL',
          }),
        },
      );

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data),
        );
      }

      setMessage(
        data?.message ||
          'Verification OTP sent to your email.',
      );

      setResendSeconds(
        Number(
          data?.resendAfterSeconds ?? 60,
        ),
      );

      setExpiresSeconds(
        Number(
          data?.expiresInSeconds ?? 300,
        ),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to send OTP.',
      );
    } finally {
      setSending(false);
    }
  };

  const verifyOtp = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!sessionId) {
      setError(
        'Registration session not found.',
      );
      return;
    }

    const cleanOtp =
      otp.trim();

    if (!/^\d{6}$/.test(cleanOtp)) {
      setError(
        'Please enter the 6-digit OTP.',
      );
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch(
        `${API_URL}/otp/verify`,
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            sessionId,
            type: 'EMAIL',
            otp: cleanOtp,
          }),
        },
      );

      const data =
        (await response
          .json()
          .catch(() => null)) as VerificationResponse | null;

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data),
        );
      }

      const verification =
        data?.verification;

      localStorage.setItem(
        VERIFIED_KEY,
        JSON.stringify(
          verification ?? {
            emailVerified: true,
            mobileVerified: false,
            completed: true,
          },
        ),
      );

      setMessage(
        data?.message ||
          'Email verified successfully.',
      );

      setExpiresSeconds(0);

      if (
        verification?.completed
      ) {
        window.setTimeout(() => {
          router.push(
            '/register/setup',
          );
        }, 500);

        return;
      }

      router.push(
        '/register/setup',
      );
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

  if (!sessionId) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500">
          Loading verification...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white px-4 py-10">
      <div className="mx-auto w-full max-w-md">

        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/15 text-2xl">
            ✉️
          </div>

          <h1 className="text-2xl font-bold">
            Verify your email
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            We sent a 6-digit verification
            code to your email address.
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl">

          <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs text-slate-500">
              Verification email
            </p>

            <p className="mt-1 break-all font-medium text-white">
              {email || 'Your registration email'}
            </p>
          </div>

          {message && (
            <div
              className="mb-4 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300"
              role="status"
            >
              {message}
            </div>
          )}

          {error && (
            <div
              className="mb-4 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300"
              role="alert"
            >
              {error}
            </div>
          )}

          <form
            onSubmit={verifyOtp}
            className="space-y-5"
          >
            <div>
              <label
                htmlFor="otp"
                className="mb-2 block text-sm font-medium text-slate-200"
              >
                Email OTP
              </label>

              <input
                id="otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={otp}
                onChange={(event) =>
                  setOtp(
                    event.target.value
                      .replace(/\D/g, '')
                      .slice(0, 6),
                  )
                }
                placeholder="Enter 6-digit OTP"
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-center text-xl tracking-[0.4em] text-white outline-none transition focus:border-indigo-400"
              />
            </div>

            {expiresSeconds > 0 && (
              <p className="text-center text-xs text-slate-400">
                OTP expires in{' '}
                <span className="font-semibold text-slate-200">
                  {Math.floor(
                    expiresSeconds / 60,
                  )}
                  :
                  {String(
                    expiresSeconds % 60,
                  ).padStart(2, '0')}
                </span>
              </p>
            )}

            <button
              type="submit"
              disabled={
                loading ||
                otp.length !== 6
              }
              className="w-full rounded-xl bg-indigo-500 px-4 py-3 font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? 'Verifying...'
                : 'Verify Email'}
            </button>
          </form>

          <div className="mt-5 text-center">
            <button
              type="button"
              disabled={
                sending ||
                resendSeconds > 0
              }
              onClick={sendOtp}
              className="text-sm font-medium text-indigo-300 transition hover:text-indigo-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {sending
                ? 'Sending...'
                : resendSeconds > 0
                  ? `Resend OTP in ${resendSeconds}s`
                  : 'Send OTP again'}
            </button>
          </div>

          <button
            type="button"
            onClick={() =>
              router.push(
                '/register/owner',
              )
            }
            className="mt-6 w-full text-sm text-slate-500 transition hover:text-slate-300"
          >
            ← Back to registration
          </button>
        </div>
      </div>
    </main>
  );
} 