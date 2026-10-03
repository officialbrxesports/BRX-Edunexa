"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Student = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  role?: string;
  isActive?: boolean;
};

export default function EditStudentPage() {
  const params = useParams();
  const router = useRouter();

  const studentId = String(params.id);

  const [student, setStudent] = useState<Student | null>(null);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function loadStudent() {
      const token = localStorage.getItem("brx_access_token");

      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        const response = await fetch(
          `/api/users/${studentId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            data?.message || "Student information load nahi ho payi."
          );
        }

        setStudent(data);

        setForm({
          firstName: data.firstName ?? "",
          lastName: data.lastName ?? "",
          email: data.email ?? "",
          phone: data.phone ?? "",
        });
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Student information load nahi ho payi."
        );
      } finally {
        setLoading(false);
      }
    }

    loadStudent();
  }, [router, studentId]);

  function updateField(
    field: keyof typeof form,
    value: string
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const token = localStorage.getItem("brx_access_token");

    if (!token) {
      router.replace("/login");
      return;
    }

    if (!form.firstName.trim()) {
      setError("First name required hai.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        `/api/users/${studentId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            firstName: form.firstName.trim(),
            lastName: form.lastName.trim() || undefined,
            email: form.email.trim() || undefined,
            phone: form.phone.trim() || undefined,
          }),
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message || "Student update nahi ho paya."
        );
      }

      setSuccess("Student profile successfully update ho gaya. ✅");

      setTimeout(() => {
        router.push(`/students/${studentId}`);
        router.refresh();
      }, 700);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Student update nahi ho paya."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#070b18] px-4 py-10 text-white">
        <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-white/[0.04] p-12 text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-white/20 border-t-blue-400" />
          <p className="mt-4 text-sm text-slate-400">
            Student profile loading...
          </p>
        </div>
      </main>
    );
  }

  if (!student) {
    return (
      <main className="min-h-screen bg-[#070b18] px-4 py-10 text-white">
        <div className="mx-auto max-w-3xl rounded-3xl border border-red-400/20 bg-red-500/10 p-8">
          <h1 className="text-xl font-bold">
            Student not found
          </h1>

          <p className="mt-2 text-sm text-red-200">
            {error || "Student profile available nahi hai."}
          </p>

          <Link
            href="/students"
            className="mt-6 inline-block rounded-xl bg-white/10 px-5 py-3 text-sm font-semibold hover:bg-white/15"
          >
            ← Back to Students
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#070b18] px-4 py-6 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/students/${studentId}`}
            className="mb-4 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
          >
            ← Back to Student Profile
          </Link>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Edit Student
              </h1>

              <p className="mt-2 text-sm text-slate-400">
                Update student profile information.
              </p>
            </div>

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-400/20 bg-blue-500/10 text-2xl">
              👨‍🎓
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-5 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-8">
            <div className="mb-7">
              <h2 className="text-lg font-semibold">
                Personal Information
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Student ka basic account information update karein.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Input
                label="First Name"
                value={form.firstName}
                required
                onChange={(value) =>
                  updateField("firstName", value)
                }
              />

              <Input
                label="Last Name"
                value={form.lastName}
                onChange={(value) =>
                  updateField("lastName", value)
                }
              />

              <Input
                label="Email"
                type="email"
                value={form.email}
                onChange={(value) =>
                  updateField("email", value)
                }
              />

              <Input
                label="Mobile Number"
                value={form.phone}
                onChange={(value) =>
                  updateField("phone", value)
                }
              />
            </div>

            <div className="mt-7 rounded-2xl border border-amber-400/10 bg-amber-500/[0.05] p-4 text-sm text-amber-200">
              🔐 Login password is page se change nahi kiya ja raha.
              Password reset/security flow hum next phase mein add karenge.
            </div>
          </section>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link
              href={`/students/${studentId}`}
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-3 text-center text-sm font-semibold text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={saving}
              className="rounded-2xl bg-blue-600 px-7 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes →"}
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
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-300">
        {label}
        {required && (
          <span className="ml-1 text-blue-400">*</span>
        )}
      </span>

      <input
        type={type}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500/50 focus:bg-black/30 focus:ring-2 focus:ring-blue-500/10"
      />
    </label>
  );
}