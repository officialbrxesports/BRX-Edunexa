"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Pencil, RefreshCw, Search, UserPlus, X } from "lucide-react";
import { API_URL } from "../../lib/api";

type Teacher = {
  id: string;
  brxUid: string;
  firstName: string;
  lastName: string | null;
  email: string;
  phone: string | null;
  status: string;
  assignments: number;
};

type Credentials = {
  eduNexaId: string;
  email: string;
  temporaryPassword: string;
};

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};

const EMPTY_FORM: FormState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = result?.message || `Request failed (${response.status})`;
    throw new Error(Array.isArray(message) ? message.join(", ") : message);
  }

  return result as T;
}

const inputClass =
  "mt-1 h-9 w-full border border-slate-300 px-3 text-sm font-normal outline-none focus:border-blue-600";

export default function TeacherManagement() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [credentials, setCredentials] = useState<Credentials | null>(null);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      setTeachers(await request<Teacher[]>("/teachers"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load teachers.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return teachers;

    return teachers.filter((teacher) =>
      [teacher.firstName, teacher.lastName, teacher.email, teacher.brxUid]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [teachers, search]);

  function startEdit(teacher: Teacher) {
    setEditingId(teacher.id);
    setCredentials(null);
    setError("");
    setSuccess("");
    setForm({
      firstName: teacher.firstName,
      lastName: teacher.lastName ?? "",
      email: teacher.email,
      phone: teacher.phone ?? "",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    setSaving(true);
    setError("");
    setSuccess("");
    setCredentials(null);

    try {
      if (editingId) {
        await request(`/teachers/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify({
            firstName: form.firstName,
            lastName: form.lastName,
            phone: form.phone,
          }),
        });
        setSuccess("Teacher updated.");
        cancelEdit();
      } else {
        const result = await request<{ credentials: Credentials }>(
          "/teachers",
          { method: "POST", body: JSON.stringify(form) },
        );
        setCredentials(result.credentials);
        setSuccess("Teacher account created.");
        setForm(EMPTY_FORM);
      }

      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save teacher.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(teacher: Teacher) {
    const next = teacher.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";

    if (
      next === "SUSPENDED" &&
      !window.confirm(
        `Suspend ${teacher.firstName}? They will be signed out and cannot log in.`,
      )
    ) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      await request(`/teachers/${teacher.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: next }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update status.");
    }
  }

  return (
    <div className="space-y-5">
      <form
        onSubmit={submit}
        className="border border-slate-200 bg-white p-4"
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <UserPlus size={16} />
            {editingId ? "Edit teacher" : "New teacher"}
          </h3>

          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              <X size={14} />
              Cancel
            </button>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-semibold text-slate-600">
            First name *
            <input
              required
              maxLength={80}
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              className={inputClass}
            />
          </label>

          <label className="text-xs font-semibold text-slate-600">
            Last name
            <input
              maxLength={80}
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              className={inputClass}
            />
          </label>

          <label className="text-xs font-semibold text-slate-600">
            Email *
            <input
              required
              type="email"
              disabled={Boolean(editingId)}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={`${inputClass} disabled:bg-slate-100 disabled:text-slate-500`}
            />
          </label>

          <label className="text-xs font-semibold text-slate-600">
            Phone
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className={inputClass}
            />
          </label>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="h-9 bg-blue-800 px-4 text-xs font-semibold text-white hover:bg-blue-900 disabled:opacity-50"
          >
            {saving ? "Saving..." : editingId ? "Save changes" : "Create teacher"}
          </button>
          {editingId && (
            <span className="text-xs text-slate-500">
              Email cannot be changed.
            </span>
          )}
        </div>

        {error && (
          <p className="mt-3 border border-red-200 bg-red-50 p-2.5 text-xs text-red-800">
            {error}
          </p>
        )}
        {success && !credentials && (
          <p className="mt-3 border border-emerald-200 bg-emerald-50 p-2.5 text-xs text-emerald-800">
            {success}
          </p>
        )}
      </form>

      {credentials && (
        <div className="border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-bold">Teacher account created. Save these now.</p>
          <p className="mt-1 text-xs">
            The temporary password is shown only once and cannot be viewed
            again.
          </p>
          <dl className="mt-3 grid gap-1 text-xs sm:grid-cols-[110px_1fr]">
            <dt className="font-semibold">EduNexa ID</dt>
            <dd className="font-mono">{credentials.eduNexaId}</dd>
            <dt className="font-semibold">Email</dt>
            <dd className="font-mono">{credentials.email}</dd>
            <dt className="font-semibold">Temp password</dt>
            <dd className="break-all font-mono">
              {credentials.temporaryPassword}
            </dd>
          </dl>
          <button
            type="button"
            onClick={() => setCredentials(null)}
            className="mt-3 text-xs font-semibold underline"
          >
            I have saved it
          </button>
        </div>
      )}

      <section className="border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-3">
          <h3 className="text-sm font-bold text-slate-900">
            Teachers ({teachers.length})
          </h3>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search teachers..."
                className="h-8 w-52 border border-slate-300 pl-8 pr-2 text-xs outline-none focus:border-blue-600"
              />
            </div>
            <button
              type="button"
              onClick={() => void load()}
              title="Reload list"
              className="flex h-8 w-8 items-center justify-center border border-slate-300 hover:bg-slate-50"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {loading && teachers.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">Loading...</p>
        ) : visible.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">
            {teachers.length === 0
              ? "No teachers yet. Create the first one above."
              : "No teachers match your search."}
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {visible.map((teacher) => (
              <li
                key={teacher.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {teacher.firstName} {teacher.lastName ?? ""}
                    {teacher.status !== "ACTIVE" && (
                      <span className="ml-2 bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-700">
                        {teacher.status}
                      </span>
                    )}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {teacher.email}
                    {teacher.phone ? ` · ${teacher.phone}` : ""} ·{" "}
                    {teacher.brxUid} · {teacher.assignments} subject
                    assignment(s)
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(teacher)}
                    className="flex h-8 items-center gap-1 border border-slate-300 px-2.5 text-xs font-semibold hover:bg-slate-50"
                  >
                    <Pencil size={13} />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => void toggleStatus(teacher)}
                    className="h-8 border border-slate-300 px-2.5 text-xs font-semibold hover:bg-slate-50"
                  >
                    {teacher.status === "ACTIVE" ? "Suspend" : "Activate"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
