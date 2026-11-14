"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { API_URL, apiRequest } from "../../lib/api";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [forced, setForced] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    async function check() {
      try {
        const response = await fetch(`${API_URL}/auth/me`, {
          credentials: "include",
          cache: "no-store",
        });

        if (!response.ok) {
          router.replace("/login");
          return;
        }

        const result = await response.json();

        if (!result.user) {
          router.replace("/login");
          return;
        }

        if (active) {
          setForced(Boolean(result.user.mustChangePassword));
          setReady(true);
        }
      } catch {
        router.replace("/login");
      }
    }

    void check();

    return () => {
      active = false;
    };
  }, [router]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    setSaving(true);

    try {
      await apiRequest("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      router.replace("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not change password.");
    } finally {
      setSaving(false);
    }
  }

  if (!ready) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm font-medium text-slate-600">Loading...</p>
      </main>
    );
  }

  const inputClass =
    "mt-1 h-10 w-full border border-slate-300 px-3 text-sm outline-none focus:border-blue-600";

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h1 className="text-lg font-bold text-slate-900">
          {forced ? "Set a new password" : "Change password"}
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          {forced
            ? "You signed in with a temporary password. Choose your own password to continue."
            : "Enter your current password and choose a new one."}
        </p>

        <label className="mt-5 block text-xs font-semibold text-slate-600">
          {forced ? "Temporary password" : "Current password"}
          <input
            required
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className={inputClass}
          />
        </label>

        <label className="mt-3 block text-xs font-semibold text-slate-600">
          New password
          <input
            required
            type="password"
            minLength={8}
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className={inputClass}
          />
        </label>

        <label className="mt-3 block text-xs font-semibold text-slate-600">
          Confirm new password
          <input
            required
            type="password"
            minLength={8}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={inputClass}
          />
        </label>

        <p className="mt-2 text-[11px] text-slate-500">
          At least 8 characters, with a letter and a number.
        </p>

        {error && (
          <p className="mt-3 border border-red-200 bg-red-50 p-2.5 text-xs text-red-800">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="mt-4 h-10 w-full bg-blue-800 text-sm font-semibold text-white hover:bg-blue-900 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save password"}
        </button>
      </form>
    </main>
  );
}
