"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import GoogleLoginButton from "@/components/auth/GoogleLoginButton";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "/api";

type LoginMode = "email" | "brxUid";

type UserRole =
  | "HEAD"
  | "TEACHER"
  | "STUDENT"
  | "STAFF"
  | "PLATFORM_ADMIN";

interface LoginResponse {
  accessToken?: string;

  tokenType?: string;

  user?: {
    id: string;
    brxUid?: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    phone?: string | null;
    role: UserRole;
    status: string;
    institutionId?: string | null;
  };

  message?: string | string[];
}

function getErrorMessage(
  data: LoginResponse | { message?: string | string[] },
  fallback: string,
) {
  if (Array.isArray(data?.message)) {
    return data.message.join(", ");
  }

  if (typeof data?.message === "string") {
    return data.message;
  }

  return fallback;
}

function saveAuthToken(token: string) {
  localStorage.setItem(
    "brx_access_token",
    token,
  );

  document.cookie =
    `brx_access_token=${encodeURIComponent(token)}; path=/; SameSite=Lax; Max-Age=3600`;
}

function clearGoogleOnboardingStorage() {
  sessionStorage.removeItem(
    "brx_google_credential",
  );

  sessionStorage.removeItem(
    "brx_google_profile",
  );

  sessionStorage.removeItem(
    "brx_institution_type",
  );
}

function redirectByRole(
  router: ReturnType<typeof useRouter>,
  role?: UserRole,
) {
  switch (role) {
    case "HEAD":
      router.push("/dashboard");
      break;

    case "TEACHER":
      router.push("/teacher-dashboard");
      break;

    case "STUDENT":
      router.push("/student-dashboard");
      break;

    case "STAFF":
      router.push("/staff-dashboard");
      break;

    case "PLATFORM_ADMIN":
      router.push("/dashboard");
      break;

    default:
      router.push("/dashboard");
      break;
  }
}

export default function LoginPage() {
  const router = useRouter();

  const [loginMode, setLoginMode] =
    useState<LoginMode>("email");

  const [identifier, setIdentifier] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

      // ============================================
      // PASSWORD RESET
      // ============================================

      type ResetStep =
        | "email"
        | "otp"
        | "password"
        | "success";

      const [showForgotPassword, setShowForgotPassword] =
        useState(false);

      const [resetStep, setResetStep] =
        useState<ResetStep>("email");

      const [resetEmail, setResetEmail] =
        useState("");

      const [resetOtp, setResetOtp] =
        useState("");

      const [newPassword, setNewPassword] =
        useState("");

      const [confirmPassword, setConfirmPassword] =
        useState("");

      const [showNewPassword, setShowNewPassword] =
        useState(false);

      const [showConfirmPassword, setShowConfirmPassword] =
        useState(false);

      const [resetLoading, setResetLoading] =
        useState(false);

      const [resetError, setResetError] =
        useState("");

      const [resetMessage, setResetMessage] =
        useState("");

      const [resendCountdown, setResendCountdown] =
        useState(0);

          useEffect(() => {
            if (resendCountdown <= 0) {
              return;
            }

            const timer = window.setInterval(() => {
              setResendCountdown((current) =>
                current > 0 ? current - 1 : 0,
              );
            }, 1000);

            return () => {
              window.clearInterval(timer);
            };
          }, [resendCountdown]);


          // ============================================
          // GOOGLE LOGIN
          // ============================================

            const handleGoogleLogin = async (
            credential: string,
          ) => {
            if (loading) {
              return;
            }

            setLoading(true);
            setError("");

            try {
              const response = await fetch(
                `${API_URL}/auth/google`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    credential,
                  }),
                },
              );

              const data = await response.json();

              if (!response.ok) {
                throw new Error(
                  getErrorMessage(
                    data,
                    "Google login failed.",
                  ),
                );
              }

              /*
              * ==========================================
              * NEW GOOGLE USER
              * ==========================================
              */

              if (data?.requiresOnboarding) {
                sessionStorage.setItem(
                  "brx_google_credential",
                  credential,
                );

                sessionStorage.setItem(
                  "brx_google_profile",
                  JSON.stringify(
                    data.googleProfile ?? {},
                  ),
                );

                /*
                * New Google users must complete
                * institution/owner registration.
                */
                router.push("/register");

                return;
              }

              /*
              * ==========================================
              * EXISTING GOOGLE USER
              * ==========================================
              */

              const token =
                data?.accessToken;

              if (!token) {
                throw new Error(
                  "BRX did not receive an access token.",
                );
              }

              const user =
                data?.user;

              if (!user?.role) {
                throw new Error(
                  "BRX could not determine your account role.",
                );
              }

              /*
              * Save authenticated session.
              */
              saveAuthToken(token);

              /*
              * Remove any unfinished Google
              * onboarding state.
              */
              clearGoogleOnboardingStorage();

              /*
              * Make sure the account is active.
              */
              if (user.status !== "ACTIVE") {
                localStorage.removeItem(
                  "brx_access_token",
                );

                document.cookie =
                  "brx_access_token=; path=/; Max-Age=0; SameSite=Lax";

                throw new Error(
                  "Your BRX EduNexa account is not active.",
                );
              }

              /*
              * Role-based dashboard redirect.
              */
              redirectByRole(
                router,
                user.role,
              );
            } catch (error) {
              setError(
                error instanceof Error
                  ? error.message
                  : "Google login failed.",
              );
            } finally {
              setLoading(false);
            }
          };

  // ============================================
  // EMAIL / BRX UID LOGIN
  // ============================================

  const handleLogin = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    const cleanIdentifier =
      identifier.trim();

    if (!cleanIdentifier) {
      setError(
        loginMode === "email"
          ? "Please enter your email address."
          : "Please enter your BRX UID.",
      );

      return;
    }

    if (!password) {
      setError(
        "Please enter your password.",
      );

      return;
    }

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
              identifier:
                cleanIdentifier,
              password,
            }),
          },
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            data,
            "Login failed",
          ),
        );
      }

      const token =
        data.accessToken;

      if (!token) {
        throw new Error(
          "BRX did not receive an access token.",
        );
      }

      saveAuthToken(token);

      const role =
        data?.user?.role;

      // ========================================
      // If backend already returned user role,
      // use it directly.
      // ========================================

      if (role) {
        redirectByRole(
          router,
          role,
        );

        return;
      }

      // ========================================
      // Fallback: load profile
      // ========================================

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
          getErrorMessage(
            profileData,
            "Unable to load user profile",
          ),
        );
      }

      redirectByRole(
        router,
        profileData?.role,
      );
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

    // ============================================
  // PASSWORD RESET FLOW
  // ============================================

  const openForgotPassword = () => {
    setShowForgotPassword(true);

    setResetStep("email");
    setResetEmail(
      loginMode === "email"
        ? identifier.trim()
        : "",
    );

    setResetOtp("");
    setNewPassword("");
    setConfirmPassword("");

    setResetError("");
    setResetMessage("");
    setResendCountdown(0);
  };

  const closeForgotPassword = () => {
    if (resetLoading) {
      return;
    }

    setShowForgotPassword(false);
    setResetStep("email");

    setResetEmail("");
    setResetOtp("");
    setNewPassword("");
    setConfirmPassword("");

    setResetError("");
    setResetMessage("");
    setResendCountdown(0);
  };

  const sendResetOtp = async () => {
    const email =
      resetEmail.trim().toLowerCase();

    if (!email) {
      setResetError(
        "Please enter your email address.",
      );
      return;
    }

    setResetLoading(true);
    setResetError("");
    setResetMessage("");

    try {
      const response = await fetch(
        `${API_URL}/auth/forgot-password`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            email,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            data,
            "Unable to send reset OTP.",
          ),
        );
      }

      setResetStep("otp");

      setResendCountdown(
        data?.resendAfterSeconds ?? 60,
      );

      setResetMessage(
        "If an account exists with this email, a reset OTP has been sent.",
      );
    } catch (error) {
      setResetError(
        error instanceof Error
          ? error.message
          : "Unable to send reset OTP.",
      );
    } finally {
      setResetLoading(false);
    }
  };

  const verifyResetOtp = async () => {
    const otp = resetOtp.trim();

    if (!/^\d{6}$/.test(otp)) {
      setResetError(
        "Please enter the 6-digit OTP.",
      );
      return;
    }

    setResetLoading(true);
    setResetError("");
    setResetMessage("");

    try {
      const response = await fetch(
        `${API_URL}/auth/verify-reset-otp`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            email:
              resetEmail.trim().toLowerCase(),
            otp,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            data,
            "Invalid or expired OTP.",
          ),
        );
      }

      setResetStep("password");

      setResetMessage(
        "OTP verified successfully.",
      );
    } catch (error) {
      setResetError(
        error instanceof Error
          ? error.message
          : "Invalid or expired OTP.",
      );
    } finally {
      setResetLoading(false);
    }
  };

  const resendResetOtp = async () => {
    if (resendCountdown > 0) {
      return;
    }

    await sendResetOtp();
  };

  const resetPassword = async () => {
    if (newPassword.length < 8) {
      setResetError(
        "Password must be at least 8 characters.",
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setResetError(
        "Passwords do not match.",
      );
      return;
    }

    if (!/^\d{6}$/.test(resetOtp.trim())) {
      setResetError(
        "Invalid OTP. Please verify again.",
      );
      return;
    }

    setResetLoading(true);
    setResetError("");
    setResetMessage("");

    try {
      const response = await fetch(
        `${API_URL}/auth/reset-password`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            email:
              resetEmail.trim().toLowerCase(),
            otp: resetOtp.trim(),
            password: newPassword,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            data,
            "Unable to reset password.",
          ),
        );
      }

      setResetStep("success");

      setResetMessage(
        "Your password has been reset successfully.",
      );
    } catch (error) {
      setResetError(
        error instanceof Error
          ? error.message
          : "Unable to reset password.",
      );
    } finally {
      setResetLoading(false);
    }
  };

  const finishPasswordReset = () => {
    setShowForgotPassword(false);

    setResetStep("email");
    setResetEmail("");
    setResetOtp("");
    setNewPassword("");
    setConfirmPassword("");

    setResetError("");
    setResetMessage("");
    setResendCountdown(0);

    setPassword("");
    setError("");
  };

  // ============================================
  // CHANGE LOGIN MODE
  // ============================================

  const changeLoginMode = (
    mode: LoginMode,
  ) => {
    setLoginMode(mode);

    setIdentifier("");

    setError("");
  };

  const isEmailMode =
    loginMode === "email";

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#07112f]">

      {/* ========================================
          BACKGROUND
      ======================================== */}

      <div className="pointer-events-none absolute inset-0">

        <div className="absolute -left-32 -top-32 h-[420px] w-[420px] rounded-full bg-blue-500/30 blur-[110px]" />

        <div className="absolute -bottom-40 -right-32 h-[500px] w-[500px] rounded-full bg-indigo-500/30 blur-[120px]" />

        <div className="absolute left-1/2 top-1/2 h-[350px] w-[350px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-500/20 blur-[100px]" />

      </div>

      {/* ========================================
          GRID
      ======================================== */}

      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.8) 1px, transparent 1px)",
          backgroundSize:
            "45px 45px",
        }}
      />

      {/* ========================================
          MAIN
      ======================================== */}

      <div className="relative flex min-h-screen items-center justify-center p-4 sm:p-8">

        <div className="relative w-full max-w-5xl overflow-hidden rounded-[32px] border border-white/15 bg-white/[0.08] shadow-[0_30px_100px_rgba(0,0,0,0.35)] backdrop-blur-2xl">

          <div className="grid lg:grid-cols-2">

            {/* ==================================
                LEFT PANEL
            ================================== */}

            <section className="relative hidden min-h-[650px] overflow-hidden border-r border-white/10 p-10 lg:flex lg:flex-col lg:justify-between xl:p-14">

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
                  ©{" "}
                  {new Date().getFullYear()}{" "}
                  BRX
                </span>

                <span className="flex items-center gap-2">

                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />

                  Secure

                </span>

              </div>

            </section>

            {/* ==================================
                RIGHT PANEL
            ================================== */}

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

                <div className="mb-7">

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

                  <p className="mt-2 text-sm text-slate-400">
                    Access your BRX EduNexa account.
                  </p>

                </div>

                {/* ==================================
                    LOGIN MODE
                ================================== */}

                <div className="mb-5 grid grid-cols-2 rounded-2xl border border-white/10 bg-white/[0.05] p-1">

                  <button
                    type="button"
                    onClick={() =>
                      changeLoginMode(
                        "email",
                      )
                    }
                    disabled={loading}
                    className={`rounded-xl px-3 py-2.5 text-xs font-bold transition ${
                      isEmailMode
                        ? "bg-white/10 text-white shadow-lg"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Email
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      changeLoginMode(
                        "brxUid",
                      )
                    }
                    disabled={loading}
                    className={`rounded-xl px-3 py-2.5 text-xs font-bold transition ${
                      !isEmailMode
                        ? "bg-white/10 text-white shadow-lg"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    BRX UID
                  </button>

                </div>

                {/* ==================================
                    PASSWORD LOGIN FORM
                ================================== */}

                <form
                  onSubmit={handleLogin}
                  className="space-y-5"
                >

                  {/* Identifier */}

                  <div>

                    <label className="mb-2 block text-sm font-medium text-slate-300">

                      {isEmailMode
                        ? "Email address"
                        : "BRX UID"}

                    </label>

                    <div className="group relative">

                      <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition group-focus-within:text-blue-400">

                        {isEmailMode ? (
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
                        ) : (
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

                            <path d="M7 9H17" />

                            <path d="M7 13H13" />

                            <path d="M7 17H11" />
                          </svg>
                        )}

                      </div>

                      <input
                        type={
                          isEmailMode
                            ? "email"
                            : "text"
                        }
                        value={identifier}
                        onChange={(event) =>
                          setIdentifier(
                            isEmailMode
                              ? event.target.value
                              : event.target.value.toUpperCase(),
                          )
                        }
                        placeholder={
                          isEmailMode
                            ? "Enter your email"
                            : "BRX-XXXX-XXXX-XXXX"
                        }
                        autoComplete={
                          isEmailMode
                            ? "email"
                            : "username"
                        }
                        className="w-full rounded-2xl border border-white/15 bg-white/[0.07] py-3.5 pl-12 pr-4 text-sm font-medium text-white outline-none backdrop-blur-xl transition placeholder:text-slate-500 hover:border-white/25 hover:bg-white/10 focus:border-blue-400/60 focus:bg-white/10 focus:ring-4 focus:ring-blue-500/10"
                        required
                      />

                    </div>

                    {!isEmailMode && (
                      <p className="mt-2 text-xs text-slate-500">
                        Example: BRX-X7KD-92PM-Q4ZT
                      </p>
                    )}

                  </div>

                  {/* Password */}

                  <div>

                    <div className="mb-2 flex items-center justify-between">

                      <label className="block text-sm font-medium text-slate-300">
                        Password
                      </label>

                      <button
                        type="button"
                        disabled={loading}
                        className="text-xs font-semibold text-blue-300 transition hover:text-blue-200 disabled:opacity-50"
                        onClick={openForgotPassword}
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
                        autoComplete="current-password"
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
                        disabled={loading}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-white disabled:opacity-50"
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

                  {/* ==================================
                      ERROR
                  ================================== */}

                  {error && (
                    <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-3.5 text-sm leading-5 text-red-200 backdrop-blur-xl">
                      {error}
                    </div>
                  )}

                  {/* ==================================
                      SIGN IN
                  ================================== */}

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

                {/* ==================================
                    GOOGLE LOGIN
                ================================== */}

                <div className="mt-6">

                  <div className="mb-5 flex items-center gap-4">

                    <div className="h-px flex-1 bg-white/10" />

                    <span className="text-xs font-medium text-slate-500">
                      OR
                    </span>

                    <div className="h-px flex-1 bg-white/10" />

                  </div>

                  <GoogleLoginButton
                    onSuccess={
                      handleGoogleLogin
                    }
                    onError={setError}
                    disabled={loading}
                  />

                </div>

                {/* ==================================
                    CREATE ACCOUNT
                ================================== */}

                <div className="mt-6 text-center">

                  <p className="text-sm text-slate-400">
                    New to BRX EduNexa?
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      router.push(
                        "/register",
                      )
                    }
                    disabled={loading}
                    className="mt-2 inline-flex items-center gap-2 text-sm font-bold text-blue-300 transition hover:text-blue-200 disabled:opacity-50"
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

                {/* ==================================
                    SECURE
                ================================== */}

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

        {/* ========================================
            FORGOT PASSWORD MODAL
        ======================================== */}

        {showForgotPassword && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">

            <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-[28px] border border-white/15 bg-[#0b1635] p-6 shadow-[0_30px_100px_rgba(0,0,0,0.55)] sm:p-8">

              {/* Close */}

              {resetStep !== "success" && (
                <button
                  type="button"
                  onClick={closeForgotPassword}
                  disabled={resetLoading}
                  className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
                  aria-label="Close"
                >
                  ×
                </button>
              )}

              {/* Header */}

              <div className="pr-10">

                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/15 bg-gradient-to-br from-blue-500/80 to-indigo-600/80 text-white shadow-xl shadow-blue-600/20">

                  {resetStep === "success" ? (
                    <svg
                      width="25"
                      height="25"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <path d="M20 6L9 17L4 12" />
                    </svg>
                  ) : (
                    <svg
                      width="25"
                      height="25"
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
                  )}

                </div>

                {resetStep === "email" && (
                  <>
                    <p className="text-xs font-bold tracking-[0.2em] text-blue-300">
                      ACCOUNT RECOVERY
                    </p>

                    <h3 className="mt-2 text-2xl font-bold text-white">
                      Forgot password?
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      Enter your registered email address
                      and we'll send you a verification OTP.
                    </p>
                  </>
                )}

                {resetStep === "otp" && (
                  <>
                    <p className="text-xs font-bold tracking-[0.2em] text-blue-300">
                      VERIFICATION
                    </p>

                    <h3 className="mt-2 text-2xl font-bold text-white">
                      Enter OTP
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      Enter the 6-digit code sent to{" "}
                      <span className="font-semibold text-slate-200">
                        {resetEmail}
                      </span>
                    </p>
                  </>
                )}

                {resetStep === "password" && (
                  <>
                    <p className="text-xs font-bold tracking-[0.2em] text-blue-300">
                      NEW PASSWORD
                    </p>

                    <h3 className="mt-2 text-2xl font-bold text-white">
                      Create new password
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      Choose a strong password for your
                      BRX EduNexa account.
                    </p>
                  </>
                )}

                {resetStep === "success" && (
                  <>
                    <p className="text-xs font-bold tracking-[0.2em] text-emerald-300">
                      SUCCESS
                    </p>

                    <h3 className="mt-2 text-2xl font-bold text-white">
                      Password reset complete
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      Your password has been changed.
                      All previous login sessions have
                      been signed out for security.
                    </p>
                  </>
                )}

              </div>

              {/* ==================================
                  ERROR
              ================================== */}

              {resetError && (
                <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-500/10 p-3.5 text-sm leading-5 text-red-200">
                  {resetError}
                </div>
              )}

              {/* ==================================
                  MESSAGE
              ================================== */}

              {resetMessage && !resetError && (
                <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-3.5 text-sm leading-5 text-emerald-200">
                  {resetMessage}
                </div>
              )}

              {/* ==================================
                  STEP 1 — EMAIL
              ================================== */}

              {resetStep === "email" && (
                <div className="mt-6 space-y-5">

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      Email address
                    </label>

                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(event) => {
                        setResetEmail(
                          event.target.value,
                        );
                        setResetError("");
                      }}
                      placeholder="Enter your registered email"
                      autoComplete="email"
                      disabled={resetLoading}
                      className="w-full rounded-2xl border border-white/15 bg-white/[0.07] px-4 py-3.5 text-sm font-medium text-white outline-none transition placeholder:text-slate-500 hover:border-white/25 focus:border-blue-400/60 focus:bg-white/10 focus:ring-4 focus:ring-blue-500/10 disabled:opacity-50"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={sendResetOtp}
                    disabled={resetLoading}
                    className="group relative w-full overflow-hidden rounded-2xl border border-blue-400/30 bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 px-5 py-4 text-sm font-bold text-white shadow-xl shadow-blue-600/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span className="relative flex items-center justify-center gap-2">

                      {resetLoading ? (
                        <>
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                          Sending OTP...
                        </>
                      ) : (
                        <>
                          Send OTP

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

                  <button
                    type="button"
                    onClick={closeForgotPassword}
                    disabled={resetLoading}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-3.5 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
                  >
                    Back to Sign In
                  </button>

                </div>
              )}

              {/* ==================================
                  STEP 2 — OTP
              ================================== */}

              {resetStep === "otp" && (
                <div className="mt-6 space-y-5">

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      6-digit OTP
                    </label>

                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={resetOtp}
                      onChange={(event) => {
                        const value =
                          event.target.value
                            .replace(/\D/g, "")
                            .slice(0, 6);

                        setResetOtp(value);
                        setResetError("");
                      }}
                      placeholder="000000"
                      autoComplete="one-time-code"
                      disabled={resetLoading}
                      className="w-full rounded-2xl border border-white/15 bg-white/[0.07] px-4 py-4 text-center text-2xl font-bold tracking-[0.5em] text-white outline-none transition placeholder:text-slate-600 focus:border-blue-400/60 focus:ring-4 focus:ring-blue-500/10 disabled:opacity-50"
                    />

                    <p className="mt-2 text-xs text-slate-500">
                      The OTP is valid for 5 minutes.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={verifyResetOtp}
                    disabled={
                      resetLoading ||
                      resetOtp.length !== 6
                    }
                    className="w-full rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 px-5 py-4 text-sm font-bold text-white shadow-xl shadow-blue-600/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {resetLoading
                      ? "Verifying..."
                      : "Verify OTP"}
                  </button>

                  <div className="flex items-center justify-between gap-3">

                    <button
                      type="button"
                      onClick={() => {
                        setResetStep("email");
                        setResetError("");
                        setResetMessage("");
                      }}
                      disabled={resetLoading}
                      className="text-sm font-semibold text-slate-400 transition hover:text-white disabled:opacity-50"
                    >
                      Change email
                    </button>

                    <button
                      type="button"
                      onClick={resendResetOtp}
                      disabled={
                        resetLoading ||
                        resendCountdown > 0
                      }
                      className="text-sm font-semibold text-blue-300 transition hover:text-blue-200 disabled:cursor-not-allowed disabled:text-slate-600"
                    >
                      {resendCountdown > 0
                        ? `Resend in ${resendCountdown}s`
                        : "Resend OTP"}
                    </button>

                  </div>

                </div>
              )}

              {/* ==================================
                  STEP 3 — NEW PASSWORD
              ================================== */}

              {resetStep === "password" && (
                <div className="mt-6 space-y-5">

                  {/* New password */}

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      New password
                    </label>

                    <div className="relative">

                      <input
                        type={
                          showNewPassword
                            ? "text"
                            : "password"
                        }
                        value={newPassword}
                        onChange={(event) => {
                          setNewPassword(
                            event.target.value,
                          );
                          setResetError("");
                        }}
                        placeholder="Minimum 8 characters"
                        autoComplete="new-password"
                        disabled={resetLoading}
                        className="w-full rounded-2xl border border-white/15 bg-white/[0.07] px-4 py-3.5 pr-12 text-sm font-medium text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400/60 focus:ring-4 focus:ring-blue-500/10 disabled:opacity-50"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowNewPassword(
                            !showNewPassword,
                          )
                        }
                        disabled={resetLoading}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white disabled:opacity-50"
                      >
                        {showNewPassword
                          ? "🙈"
                          : "👁️"}
                      </button>

                    </div>
                  </div>

                  {/* Confirm password */}

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      Confirm password
                    </label>

                    <div className="relative">

                      <input
                        type={
                          showConfirmPassword
                            ? "text"
                            : "password"
                        }
                        value={confirmPassword}
                        onChange={(event) => {
                          setConfirmPassword(
                            event.target.value,
                          );
                          setResetError("");
                        }}
                        placeholder="Re-enter your password"
                        autoComplete="new-password"
                        disabled={resetLoading}
                        className="w-full rounded-2xl border border-white/15 bg-white/[0.07] px-4 py-3.5 pr-12 text-sm font-medium text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400/60 focus:ring-4 focus:ring-blue-500/10 disabled:opacity-50"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(
                            !showConfirmPassword,
                          )
                        }
                        disabled={resetLoading}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white disabled:opacity-50"
                      >
                        {showConfirmPassword
                          ? "🙈"
                          : "👁️"}
                      </button>

                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <p className="text-xs font-semibold text-slate-300">
                      Password requirements
                    </p>

                    <ul className="mt-2 space-y-1 text-xs text-slate-500">
                      <li>• At least 8 characters</li>
                      <li>• Use a password you don't use elsewhere</li>
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={resetPassword}
                    disabled={resetLoading}
                    className="w-full rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 px-5 py-4 text-sm font-bold text-white shadow-xl shadow-blue-600/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {resetLoading
                      ? "Resetting password..."
                      : "Reset Password"}
                  </button>

                </div>
              )}

              {/* ==================================
                  STEP 4 — SUCCESS
              ================================== */}

              {resetStep === "success" && (
                <div className="mt-7">

                  <div className="flex flex-col items-center rounded-3xl border border-emerald-400/20 bg-emerald-500/5 p-6 text-center">

                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-400/20">

                      <svg
                        width="30"
                        height="30"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M20 6L9 17L4 12" />
                      </svg>

                    </div>

                    <p className="mt-4 text-sm font-semibold text-emerald-300">
                      Password updated securely
                    </p>

                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      All previous login sessions were
                      revoked. Sign in again using your
                      new password.
                    </p>

                  </div>

                  <button
                    type="button"
                    onClick={finishPasswordReset}
                    className="mt-6 w-full rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 px-5 py-4 text-sm font-bold text-white shadow-xl shadow-blue-600/20 transition hover:-translate-y-0.5"
                  >
                    Back to Sign In
                  </button>

                </div>
              )}

            </div>
          </div>
        )}
    </main>
  );
}