"use client";

import Link from "next/link";
import Script from "next/script";
import { useCallback, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type LoginResult = {
  user?: {
    id: string;
    name: string;
    email: string;
    eduNexaId: string | null;
    role: string;
  };
  message?: string | string[];
};

type GoogleCredentialResponse = {
  credential?: string;
};

type GoogleAccounts = {
  accounts: {
  id: {
    initialize: (options: {
      client_id: string;
      callback: (response: GoogleCredentialResponse) => void;
    }) => void;
    renderButton: (
      parent: HTMLElement,
      options: {
        theme: "outline";
        size: "large";
        text: "continue_with";
        shape: "rectangular";
        width: number;
      },
    ) => void;
  };
  };
};

declare global {
  interface Window {
    google?: GoogleAccounts;
  }
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [loggedInName, setLoggedInName] = useState("");
  const [googleReady, setGoogleReady] = useState(false);

  const finishGoogleLogin = useCallback(
    async (credential: string) => {
      setError("");
      setLoggedInName("");
      setGoogleLoading(true);

      try {
        const response = await fetch(`${API_URL}/auth/google`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ credential }),
        });

        const result: LoginResult = await response.json();

        if (!response.ok) {
          const message = Array.isArray(result.message)
            ? result.message.join(" ")
            : result.message;

          throw new Error(message || "Google sign-in failed.");
        }

        router.replace("/dashboard");
      } catch (err) {
        setError(
          err instanceof TypeError
            ? "API se connect nahi ho pa raha. Check karo ki API running hai."
            : err instanceof Error
              ? err.message
              : "Google sign-in failed. Please try again.",
        );
      } finally {
        setGoogleLoading(false);
      }
    },
    [router],
  );

  const initializeGoogle = useCallback(() => {
    if (!window.google || !GOOGLE_CLIENT_ID) return;

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response) => {
        if (!response.credential) {
          setError("Google credential nahi mila. Dobara try karo.");
          return;
        }

        void finishGoogleLogin(response.credential);
      },
    });

    const button = document.getElementById("google-signin-button");

    if (button) {
      button.replaceChildren();
      window.google.accounts.id.renderButton(button, {
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "rectangular",
        width: Math.max(200, Math.min(360, button.clientWidth || 320)),
      });
    }

    setGoogleReady(true);
  }, [finishGoogleLogin]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoggedInName("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          identifier: identifier.trim(),
          password,
        }),
      });

      const result: LoginResult = await response.json();

      if (!response.ok) {
        const message = Array.isArray(result.message)
          ? result.message.join(" ")
          : result.message;

        throw new Error(message || "Login failed. Please try again.");
      }

      router.replace("/dashboard");
    } catch (err) {
      setError(
        err instanceof TypeError
          ? "API se connect nahi ho pa raha. Check karo ki API running hai."
          : err instanceof Error
            ? err.message
            : "Unexpected error. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      {GOOGLE_CLIENT_ID && (
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="afterInteractive"
          onLoad={initializeGoogle}
          onError={() => setError("Google sign-in script load nahi hua.")}
        />
      )}

      <section className="login-brand-panel">
        <Link href="/" className="brand" aria-label="BRX EduNexa home">
          <span className="brand-mark">B</span>
          <span className="brand-name" style={{ color: "#ffffff" }}>
            BRX EduNexa
          </span>
        </Link>

        <div>
          <p className="eyebrow">WELCOME TO EDUNEXA</p>
          <h1>Learning starts with a connection.</h1>
          <p>
            One place for students, educators, and institutions to move
            forward together.
          </p>
        </div>

        <p>Education, connected.</p>
      </section>

      <section className="login-form-panel">
        <form className="login-form" onSubmit={handleSubmit}>
          <h2>Welcome back</h2>
          <p>Sign in to continue to your EduNexa account.</p>

          <div
            id="google-signin-button"
            style={{
              minHeight: 44,
              display: "flex",
              justifyContent: "center",
              marginTop: 20,
              marginBottom: 20,
            }}
          />

          {googleLoading && (
            <p role="status" style={{ textAlign: "center" }}>
              Google se sign in ho raha hai...
            </p>
          )}

          {!GOOGLE_CLIENT_ID && (
            <p role="alert" style={{ color: "#dc2626" }}>
              Google sign-in configure nahi hai.
            </p>
          )}

          {GOOGLE_CLIENT_ID && !googleReady && (
            <p style={{ textAlign: "center", fontSize: 12 }}>
              Google sign-in load ho raha hai...
            </p>
          )}

          <div className="login-divider">or use your EduNexa account</div>

          <label htmlFor="login-id">Email or EduNexa ID</label>
          <input
            id="login-id"
            name="loginId"
            type="text"
            placeholder="Enter your email or ID"
            autoComplete="username"
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            required
            maxLength={254}
            disabled={loading || googleLoading}
          />

          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            name="password"
            type="password"
            placeholder="Enter your password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            maxLength={128}
            disabled={loading || googleLoading}
          />

          <div style={{ textAlign: "right", marginTop: 12 }}>
            <Link href="/forgot-password">Forgot password?</Link>
          </div>

          {error && (
            <p role="alert" style={{ color: "#dc2626" }}>
              {error}
            </p>
          )}

          {loggedInName && (
            <p role="status" style={{ color: "#15803d" }}>
              Login successful. Welcome, {loggedInName}!
            </p>
          )}

          <button
            className="button"
            type="submit"
            disabled={loading || googleLoading}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>

          <div className="login-divider">Secure access</div>

          <p style={{ textAlign: "center" }}>
            New to EduNexa? <Link href="/register">Create an account</Link>
          </p>

          <p style={{ textAlign: "center", fontSize: 12 }}>
            <Link href="/">Back to homepage</Link>
          </p>
        </form>
      </section>
    </main>
  );
}

