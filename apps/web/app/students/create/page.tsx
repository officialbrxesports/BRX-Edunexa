"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type AcademicClass = {
  id: string;
  name: string;
  sections?: Section[];
};

type Section = {
  id: string;
  name: string;
};

export default function CreateStudentPage() {
  const router = useRouter();

  const [classes, setClasses] = useState<AcademicClass[]>([]);
  const [sections, setSections] = useState<Section[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    classId: "",
    sectionId: "",
  });

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("brx_access_token")
      : null;

  useEffect(() => {
    async function loadClasses() {
      try {
        if (!token) {
          router.replace("/login");
          return;
        }

        const response = await fetch("/api/academics/classes", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Classes load nahi ho payi.");
        }

        const data = await response.json();
        setClasses(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Something went wrong."
        );
      } finally {
        setLoading(false);
      }
    }

    loadClasses();
  }, [router, token]);

  async function handleClassChange(classId: string) {
    setForm((prev) => ({
      ...prev,
      classId,
      sectionId: "",
    }));

    if (!classId || !token) {
      setSections([]);
      return;
    }

    try {
      const response = await fetch(
        `/api/academics/classes/${classId}/sections`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Sections load nahi ho paye.");
      }

      const data = await response.json();

      setSections(
        Array.isArray(data)
          ? data
          : Array.isArray(data?.sections)
            ? data.sections
            : []
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Sections load nahi ho paye."
      );
      setSections([]);
    }
  }

  function updateField(field: keyof typeof form, value: string) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    if (!token) {
      router.replace("/login");
      return;
    }

    if (!form.firstName.trim()) {
      setError("First name required hai.");
      return;
    }

    if (!form.password.trim()) {
      setError("Password required hai.");
      return;
    }

    if (form.password.length < 8) {
      setError("Password minimum 8 characters ka hona chahiye.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/users", {
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
          role: "STUDENT",
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            "Student create nahi ho paya."
        );
      }

      const studentId = data?.id;

      if (studentId && form.classId) {
        const enrollmentResponse = await fetch(
          "/api/academics/enrollments",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              studentId,
              classId: form.classId,
              sectionId: form.sectionId || undefined,
            }),
          }
        );

        const enrollmentData = await enrollmentResponse
          .json()
          .catch(() => null);

        if (!enrollmentResponse.ok) {
          throw new Error(
            enrollmentData?.message ||
              enrollmentData?.error ||
              "Student create ho gaya, lekin class enrollment nahi ho paya."
          );
        }
      }

      router.push(studentId ? `/students/${studentId}` : "/students");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Student create nahi ho paya."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#070b18] px-4 py-6 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/students"
              className="mb-3 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
            >
              ← Back to Students
            </Link>

            <h1 className="text-3xl font-bold tracking-tight">
              Add New Student
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Create a student account and optionally assign class & section.
            </p>
          </div>

          <div className="rounded-2xl border border-blue-400/20 bg-blue-500/10 px-4 py-3 text-sm text-blue-200">
            👨‍🎓 Student Account
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-10 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-blue-400" />
            <p className="mt-4 text-sm text-slate-400">
              Classes loading...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-7">
              <div className="mb-6">
                <h2 className="text-lg font-semibold">
                  Personal Information
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Student ka basic profile information.
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  label="First Name"
                  required
                  value={form.firstName}
                  onChange={(value) => updateField("firstName", value)}
                  placeholder="Rahul"
                />

                <Field
                  label="Last Name"
                  value={form.lastName}
                  onChange={(value) => updateField("lastName", value)}
                  placeholder="Kumar"
                />

                <Field
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={(value) => updateField("email", value)}
                  placeholder="student@example.com"
                />

                <Field
                  label="Mobile Number"
                  value={form.phone}
                  onChange={(value) => updateField("phone", value)}
                  placeholder="9876543210"
                />
              </div>
            </section>

            {/* Login Security */}
            <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-7">
              <div className="mb-6">
                <h2 className="text-lg font-semibold">
                  Login Security
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Student isi password se login karega.
                </p>
              </div>

              <div className="max-w-xl">
                <Field
                  label="Password"
                  type="password"
                  required
                  value={form.password}
                  onChange={(value) => updateField("password", value)}
                  placeholder="Minimum 8 characters"
                />

                <p className="mt-2 text-xs text-slate-500">
                  Password minimum 8 characters ka hona chahiye.
                </p>
              </div>
            </section>

            {/* Academic Assignment */}
            <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-7">
              <div className="mb-6">
                <h2 className="text-lg font-semibold">
                  Academic Assignment
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Student ko class aur section assign karo.
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <SelectField
                  label="Class"
                  value={form.classId}
                  onChange={handleClassChange}
                  options={classes.map((item) => ({
                    value: item.id,
                    label: item.name,
                  }))}
                  placeholder="Select class"
                />

                <SelectField
                  label="Section"
                  value={form.sectionId}
                  onChange={(value) => updateField("sectionId", value)}
                  disabled={!form.classId || sections.length === 0}
                  options={sections.map((item) => ({
                    value: item.id,
                    label: item.name,
                  }))}
                  placeholder={
                    !form.classId
                      ? "Select class first"
                      : sections.length === 0
                        ? "No section available"
                        : "Select section"
                  }
                />
              </div>

              <div className="mt-5 rounded-2xl border border-blue-400/10 bg-blue-500/[0.06] p-4 text-sm text-blue-200">
                💡 Class select karne ke baad available sections automatically
                load honge.
              </div>
            </section>

            {/* Actions */}
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Link
                href="/students"
                className="rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-3 text-center text-sm font-semibold text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={saving}
                className="rounded-2xl bg-blue-600 px-7 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Creating Student..." : "Create Student →"}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}

function Field({
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
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-300">
        {label}
        {required && <span className="ml-1 text-blue-400">*</span>}
      </span>

      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500/50 focus:bg-black/30 focus:ring-2 focus:ring-blue-500/10"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-300">
        {label}
      </span>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="w-full rounded-2xl border border-white/10 bg-[#0b1020] px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <option value="">{placeholder}</option>

        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}