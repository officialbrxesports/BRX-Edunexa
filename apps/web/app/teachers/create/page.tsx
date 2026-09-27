"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateTeacherPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function update(field: keyof typeof form, value: string) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const token = localStorage.getItem("brx_access_token");

    if (!token) {
      router.replace("/login");
      return;
    }

    if (!form.firstName.trim()) {
      setError("First name required hai.");
      return;
    }

    if (form.password.length < 8) {
      setError("Password minimum 8 characters ka hona chahiye.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("http://localhost:3000/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim() || undefined,
          email: form.email.trim() || undefined,
          phone: form.phone.trim() || undefined,
          password: form.password,
          role: "TEACHER",
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message || "Teacher create nahi ho paya."
        );
      }

      router.push(
        data?.id ? `/teachers/${data.id}` : "/teachers"
      );
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Teacher create nahi ho paya."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#070b18] px-4 py-6 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/teachers"
          className="mb-4 inline-flex text-sm text-slate-400 hover:text-white"
        >
          ← Back to Teachers
        </Link>

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              Add New Teacher
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Create a teacher account for your institution.
            </p>
          </div>

          <div className="hidden h-14 w-14 items-center justify-center rounded-2xl border border-blue-400/20 bg-blue-500/10 text-2xl sm:flex">
            👨‍🏫
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={submit}>
          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl sm:p-8">
            <h2 className="text-lg font-semibold">
              Teacher Information
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Teacher ka basic profile aur login credentials.
            </p>

            <div className="mt-7 grid gap-5 sm:grid-cols-2">
              <Input
                label="First Name"
                required
                value={form.firstName}
                onChange={(v) => update("firstName", v)}
                placeholder="Nikhil"
              />

              <Input
                label="Last Name"
                value={form.lastName}
                onChange={(v) => update("lastName", v)}
                placeholder="Kumar"
              />

              <Input
                label="Email"
                type="email"
                value={form.email}
                onChange={(v) => update("email", v)}
                placeholder="teacher@example.com"
              />

              <Input
                label="Mobile Number"
                value={form.phone}
                onChange={(v) => update("phone", v)}
                placeholder="9876543210"
              />

              <div className="sm:col-span-2">
                <Input
                  label="Login Password"
                  type="password"
                  required
                  value={form.password}
                  onChange={(v) => update("password", v)}
                  placeholder="Minimum 8 characters"
                />
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-blue-400/10 bg-blue-500/[0.05] p-4 text-sm text-blue-200">
              🔐 Teacher is account se login karke apne assigned
              students ko manage kar sakega.
            </div>
          </section>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link
              href="/teachers"
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-3 text-center text-sm font-semibold text-slate-300 hover:bg-white/[0.08] hover:text-white"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={saving}
              className="rounded-2xl bg-blue-600 px-7 py-3 text-sm font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-500 disabled:opacity-50"
            >
              {saving ? "Creating..." : "Create Teacher →"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label>
      <span className="mb-2 block text-sm font-medium text-slate-300">
        {label}
        {required && <span className="ml-1 text-blue-400">*</span>}
      </span>

      <input
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/10"
      />
    </label>
  );
}