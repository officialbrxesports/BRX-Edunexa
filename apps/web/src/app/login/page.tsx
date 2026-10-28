"use client";
import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="login-page">
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
        <form
          className="login-form"
          onSubmit={(event) => event.preventDefault()}
        >
          <h2>Welcome back</h2>
          <p>Sign in to continue to your EduNexa account.</p>

          <label htmlFor="login-id">Email or EduNexa ID</label>
          <input
            id="login-id"
            name="loginId"
            type="text"
            placeholder="Enter your email or ID"
            autoComplete="username"
            required
          />

          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            name="password"
            type="password"
            placeholder="Enter your password"
            autoComplete="current-password"
            required
          />

          <div style={{ textAlign: "right", marginTop: 12 }}>
            <Link href="/forgot-password">Forgot password?</Link>
          </div>

          <button className="button" type="submit">
            Sign in
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
