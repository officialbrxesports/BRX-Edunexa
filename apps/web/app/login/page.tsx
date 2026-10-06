"use client";

import {
  FormEvent,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import GoogleLoginButton from "@/components/auth/GoogleLoginButton";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "/api";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  // ==============================
  // GOOGLE LOGIN
  // ==============================

  const handleGoogleLogin =
    async (
      credential: string,
    ) => {
      setLoading(true);
      setError("");

      try {
        const response =
          await fetch(
            `${API_URL}/auth/google`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                credential,
              }),
            },
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Google login failed",
          );
        }

        // ==================================
        // NEW GOOGLE USER
        // ==================================

        if (
          data.requiresOnboarding
        ) {
          sessionStorage.setItem(
            "brx_google_credential",
            credential,
          );

          sessionStorage.setItem(
            "brx_google_profile",
            JSON.stringify(
              data.googleProfile,
            ),
          );

          router.push(
            "/register/institution",
          );

          return;
        }

        // ==================================
        // EXISTING BRX USER
        // ==================================

        const token =
          data.accessToken;

        if (!token) {
          throw new Error(
            "BRX did not receive an access token.",
          );
        }

        localStorage.setItem(
          "brx_access_token",
          token,
        );

        document.cookie =
          `brx_access_token=${token}; path=/; SameSite=Lax`;

        const profileResponse =
          await fetch(
            `${API_URL}/users/me`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            },
          );

        const profileData =
          await profileResponse.json();

        if (!profileResponse.ok) {
          throw new Error(
            profileData?.message ||
              "Unable to load user profile",
          );
        }

        switch (
          profileData.role
        ) {
          case "HEAD":
            router.push(
              "/dashboard",
            );
            break;

          case "TEACHER":
            router.push(
              "/teacher-dashboard",
            );
            break;

          case "STUDENT":
            router.push(
              "/student-dashboard",
            );
            break;

          case "STAFF":
            router.push(
              "/staff-dashboard",
            );
            break;

          case "PLATFORM_ADMIN":
            router.push(
              "/dashboard",
            );
            break;

          default:
            router.push(
              "/dashboard",
            );
        }
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Google login failed",
        );
      } finally {
        setLoading(false);
      }
    };

  // ==============================
  // PASSWORD LOGIN
  // ==============================

  const handleLogin = async (
    event: FormEvent,
  ) => {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response =
        await fetch(
          `${API_URL}/auth/login`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              email,
              password,
            }),
          },
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Login failed",
        );
      }

      const token =
        data.accessToken;

      if (!token) {
        throw new Error(
          "BRX did not receive an access token.",
        );
      }

      localStorage.setItem(
        "brx_access_token",
        token,
      );

      document.cookie =
        `brx_access_token=${token}; path=/; SameSite=Lax`;

      const profileResponse =
        await fetch(
          `${API_URL}/users/me`,
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          },
        );

      const profileData =
        await profileResponse.json();

      if (!profileResponse.ok) {
        throw new Error(
          profileData?.message ||
            "Unable to load user profile",
        );
      }

      switch (
        profileData.role
      ) {
        case "HEAD":
          router.push(
            "/dashboard",
          );
          break;

        case "TEACHER":
          router.push(
            "/teacher-dashboard",
          );
          break;

        case "STUDENT":
          router.push(
            "/student-dashboard",
          );
          break;

        case "STAFF":
          router.push(
            "/staff-dashboard",
          );
          break;

        case "PLATFORM_ADMIN":
          router.push(
            "/dashboard",
          );
          break;

        default:
          router.push(
            "/dashboard",
          );
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Login failed",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#07112f]">

      {/* Background */}
      <div className="pointer-events-none absolute inset-0">

        <div className="absolute -left-32 -top-32 h-[420px] w-[420px] rounded-full bg-blue-500/30 blur-[110px]" />

        <div className="absolute -bottom-40 -right-32 h-[500px] w-[500px] rounded-full bg-indigo-500/30 blur-[120px]" />

        <div className="absolute left-1/2 top-1/2 h-[350px] w-[350px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-500/20 blur-[100px]" />

      </div>

      {/* Background Grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.8) 1px, transparent 1px)",
          backgroundSize: "45px 45px",
        }}
      />

      {/* Main */}
      <div className="relative flex min-h-screen items-center justify-center p-4 sm:p-8">

        {/* Glass Card */}
        <div className="relative w-full max-w-5xl overflow-hidden rounded-[32px] border border-white/15 bg-white/[0.08] shadow-[0_30px_100px_rgba(0,0,0,0.35)] backdrop-blur-2xl">

          <div className="grid lg:grid-cols-2">

            {/* LEFT */}
            <section className="relative hidden min-h-[650px] overflow-hidden border-r border-white/10 lg:flex lg:flex-col lg:justify-between p-10 xl:p-14">

              {/* Glow */}
              <div className="absolute -right-32 -top-32 h-80 w-80 rounded-full bg-blue-500/20 blur-[90px]" />

              <div className="absolute -bottom-40 -left-32 h-96 w-96 rounded-full bg-indigo-500/20 blur-[100px]" />

              {/* Brand */}
              <div className="relative z-10 flex items-center gap-3">

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/10 shadow-xl backdrop-blur-xl">

                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 text-sm font-black text-white">
                    B
                  </div>

                </div>

                <div>
                  <p className="text-lg font-bold tracking-tight text-white">
                    BRX EduNexa
                  </p>

                  <p className="text-xs text-blue-200/70">
                    Education Management
                  </p>
                </div>

              </div>

              {/* Center */}
              <div className="relative z-10">

                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs text-blue-100 backdrop-blur-xl">

                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,.9)]" />

                  Secure workspace

                </div>

                <h1 className="max-w-lg text-4xl font-bold leading-tight text-white xl:text-5xl">

                  Education
                  <span className="block bg-gradient-to-r from-blue-300 via-indigo-200 to-white bg-clip-text text-transparent">
                    made smarter.
                  </span>

                </h1>

                <p className="mt-5 max-w-md text-sm leading-6 text-slate-300/70">
                  One secure workspace for your
                  institution.
                </p>

              </div>

              {/* Bottom */}
              <div className="relative z-10 flex items-center justify-between text-xs text-slate-400">

                <span>
                  © {new Date().getFullYear()} BRX
                </span>

                <span className="flex items-center gap-2">

                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />

                  Secure

                </span>

              </div>

            </section>

            {/* RIGHT */}
            <section className="flex min-h-[650px] items-center justify-center p-6 sm:p-10 lg:p-14">

              <div className="w-full max-w-md">

                {/* Mobile Brand */}
                <div className="mb-8 flex items-center gap-3 lg:hidden">

                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-sm font-black text-white shadow-lg backdrop-blur-xl">
                    B
                  </div>

                  <div>
                    <p className="font-bold text-white">
                      BRX EduNexa
                    </p>

                    <p className="text-xs text-slate-400">
                      Education Management
                    </p>
                  </div>

                </div>

                {/* Heading */}
                <div className="mb-8">

                  <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/15 bg-gradient-to-br from-blue-500/80 to-indigo-600/80 text-white shadow-xl shadow-blue-600/20 backdrop-blur-xl">

                    <svg
                      width="25"
                      height="25"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <path d="M12 3L20 7.5V12.5C20 17.2 16.8 20.5 12 22C7.2 20.5 4 17.2 4 12.5V7.5L12 3Z" />

                      <path d="M9 12L11 14L15.5 9.5" />
                    </svg>

                  </div>

                  <p className="text-xs font-bold tracking-[0.2em] text-blue-300">
                    WELCOME BACK
                  </p>

                  <h2 className="mt-2 text-3xl font-bold tracking-tight text-white">
                    Sign in
                  </h2>

                </div>

                {/* Form */}
                <form
                  onSubmit={handleLogin}
                  className="space-y-5"
                >

                  {/* Email */}
                  <div>

                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      Email
                    </label>

                    <div className="group relative">

                      <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition group-focus-within:text-blue-400">

                        <svg
                          width="19"
                          height="19"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                        >
                          <rect
                            x="3"
                            y="5"
                            width="18"
                            height="14"
                            rx="2"
                          />

                          <path d="M3 7L12 13L21 7" />
                        </svg>

                      </div>

                      <input
                        type="email"
                        value={email}
                        onChange={(event) =>
                          setEmail(
                            event.target.value,
                          )
                        }
                        placeholder="Enter your email"
                        className="w-full rounded-2xl border border-white/15 bg-white/[0.07] py-3.5 pl-12 pr-4 text-sm font-medium text-white outline-none backdrop-blur-xl transition placeholder:text-slate-500 hover:border-white/25 hover:bg-white/10 focus:border-blue-400/60 focus:bg-white/10 focus:ring-4 focus:ring-blue-500/10"
                        required
                      />

                    </div>

                  </div>

                  {/* Password */}
                  <div>

                    <div className="mb-2 flex items-center justify-between">

                      <label className="block text-sm font-medium text-slate-300">
                        Password
                      </label>

                      <button
                        type="button"
                        className="text-xs font-semibold text-blue-300 transition hover:text-blue-200"
                        onClick={() => {
                          setError(
                            "Please contact your institution administrator to reset your password.",
                          );
                        }}
                      >
                        Forgot password?
                      </button>

                    </div>

                    <div className="group relative">

                      <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition group-focus-within:text-blue-400">

                        <svg
                          width="19"
                          height="19"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                        >
                          <rect
                            x="4"
                            y="10"
                            width="16"
                            height="11"
                            rx="2"
                          />

                          <path d="M8 10V7a4 4 0 018 0v3" />
                        </svg>

                      </div>

                      <input
                        type={
                          showPassword
                            ? "text"
                            : "password"
                        }
                        value={password}
                        onChange={(event) =>
                          setPassword(
                            event.target.value,
                          )
                        }
                        placeholder="Enter your password"
                        className="w-full rounded-2xl border border-white/15 bg-white/[0.07] py-3.5 pl-12 pr-12 text-sm font-medium text-white outline-none backdrop-blur-xl transition placeholder:text-slate-500 hover:border-white/25 hover:bg-white/10 focus:border-blue-400/60 focus:bg-white/10 focus:ring-4 focus:ring-blue-500/10"
                        required
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword(
                            !showPassword,
                          )
                        }
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-white"
                        aria-label={
                          showPassword
                            ? "Hide password"
                            : "Show password"
                        }
                      >
                        {showPassword ? (
                          <svg
                            width="19"
                            height="19"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                          >
                            <path d="M3 3L21 21" />

                            <path d="M10.6 10.6A2 2 0 0013.4 13.4" />

                            <path d="M9.9 4.2A10.5 10.5 0 0112 4c5.5 0 9 6 9 8s-1.2 3.3-3.1 4.8" />

                            <path d="M6.2 6.2C3.9 7.7 3 10.1 3 12c0 2 3.5 8 9 8 1.5 0 2.8-.4 4-1" />
                          </svg>
                        ) : (
                          <svg
                            width="19"
                            height="19"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                          >
                            <path d="M2.5 12S6 5 12 5s9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z" />

                            <circle
                              cx="12"
                              cy="12"
                              r="2.5"
                            />
                          </svg>
                        )}
                      </button>

                    </div>

                  </div>

                  <div className="mb-6">
                    <GoogleLoginButton
                      onSuccess={handleGoogleLogin}
                      onError={setError}
                      disabled={loading}
                    />
                  </div>

                  <div className="mb-6 flex items-center gap-4">
                    <div className="h-px flex-1 bg-white/10" />

                    <span className="text-xs font-medium text-slate-500">
                      OR
                    </span>

                    <div className="h-px flex-1 bg-white/10" />
                  </div>

                  {/* Error */}
                  {error && (
                    <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-3.5 text-sm text-red-200 backdrop-blur-xl">
                      {error}
                    </div>
                  )}

                  {/* Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="group relative w-full overflow-hidden rounded-2xl border border-blue-400/30 bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 px-5 py-4 text-sm font-bold text-white shadow-xl shadow-blue-600/20 transition duration-200 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-blue-600/30 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                  >

                    <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />

                    <span className="relative flex items-center justify-center gap-2">

                      {loading ? (
                        <>
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                          Signing in...
                        </>
                      ) : (
                        <>
                          Sign In

                          <svg
                            width="17"
                            height="17"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M5 12H19" />
                            <path d="M13 6L19 12L13 18" />
                          </svg>
                        </>
                      )}

                    </span>

                  </button>

                </form>

                {/* Create Account */}
                <div className="mt-5 text-center">
                  <p className="text-sm text-slate-400">
                    New to BRX EduNexa?
                  </p>

                  <button
                    type="button"
                    onClick={() => router.push("/register")}
                    className="mt-2 inline-flex items-center gap-2 text-sm font-bold text-blue-300 transition hover:text-blue-200"
                  >
                    Create New Account

                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M5 12H19" />
                      <path d="M13 6L19 12L13 18" />
                    </svg>
                  </button>
                </div>

                {/* Secure */}
                <div className="mt-7 flex items-center justify-center gap-2 text-xs text-slate-500">

                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <rect
                      x="5"
                      y="10"
                      width="14"
                      height="10"
                      rx="2"
                    />

                    <path d="M8 10V7a4 4 0 018 0v3" />
                  </svg>

                  Secure login

                </div>

              </div>

            </section>

          </div>

        </div>

      </div>

    </main>
  );
}