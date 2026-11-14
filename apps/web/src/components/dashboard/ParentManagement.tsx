"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Pencil, RefreshCw, Search, UserPlus, X } from "lucide-react";
import { API_URL } from "../../lib/api";

type Child = { id: string; name: string; brxUid: string; relation: string };

type Parent = {
  id: string;
  brxUid: string;
  firstName: string;
  lastName: string | null;
  email: string;
  phone: string | null;
  status: string;
  children: Child[];
};

type StudentOption = {
  id: string;
  name: string;
  brxUid: string;
  className: string | null;
  sectionName: string | null;
};

type Credentials = {
  eduNexaId: string;
  email: string;
  temporaryPassword: string;
};

const RELATIONS = ["FATHER", "MOTHER", "GUARDIAN", "OTHER"];

const inputClass =
  "mt-1 h-9 w-full border border-slate-300 px-3 text-sm font-normal outline-none focus:border-blue-600";

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

export default function ParentManagement() {
  const [parents, setParents] = useState<Parent[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  // studentId -> relation for every linked child
  const [links, setLinks] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [credentials, setCredentials] = useState<Credentials | null>(null);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const [parentList, studentList] = await Promise.all([
        request<Parent[]>("/parents"),
        request<StudentOption[]>("/parents/student-options"),
      ]);
      setParents(parentList);
      setStudents(studentList);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load parents.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const visibleParents = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return parents;

    return parents.filter((parent) =>
      [
        parent.firstName,
        parent.lastName,
        parent.email,
        parent.brxUid,
        ...parent.children.map((child) => child.name),
      ]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [parents, search]);

  const visibleStudents = useMemo(() => {
    const query = studentSearch.trim().toLowerCase();
    const list = query
      ? students.filter((student) =>
          `${student.name} ${student.brxUid} ${student.className ?? ""}`
            .toLowerCase()
            .includes(query),
        )
      : students;

    return list.slice(0, 50);
  }, [students, studentSearch]);

  function resetForm() {
    setEditingId(null);
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setLinks({});
    setStudentSearch("");
  }

  function startEdit(parent: Parent) {
    setEditingId(parent.id);
    setCredentials(null);
    setError("");
    setSuccess("");
    setFirstName(parent.firstName);
    setLastName(parent.lastName ?? "");
    setEmail(parent.email);
    setPhone(parent.phone ?? "");
    setLinks(
      Object.fromEntries(parent.children.map((c) => [c.id, c.relation])),
    );
  }

  function toggleStudent(id: string) {
    setLinks((current) => {
      const next = { ...current };
      if (id in next) delete next[id];
      else next[id] = "GUARDIAN";
      return next;
    });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    setSaving(true);
    setError("");
    setSuccess("");
    setCredentials(null);

    const children = Object.entries(links).map(([studentId, relation]) => ({
      studentId,
      relation,
    }));

    try {
      if (editingId) {
        await request(`/parents/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify({ firstName, lastName, phone }),
        });
        await request(`/parents/${editingId}/children`, {
          method: "PUT",
          body: JSON.stringify({ children }),
        });
        setSuccess("Parent updated.");
        resetForm();
      } else {
        const result = await request<{ credentials: Credentials }>(
          "/parents",
          {
            method: "POST",
            body: JSON.stringify({ firstName, lastName, email, phone, children }),
          },
        );
        setCredentials(result.credentials);
        setSuccess("Parent account created.");
        resetForm();
      }

      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save parent.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(parent: Parent) {
    const next = parent.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";

    if (
      next === "SUSPENDED" &&
      !window.confirm(`Suspend ${parent.firstName}? They will be signed out.`)
    ) {
      return;
    }

    setError("");

    try {
      await request(`/parents/${parent.id}`, {
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
      <form onSubmit={submit} className="border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <UserPlus size={16} />
            {editingId ? "Edit parent / guardian" : "New parent / guardian"}
          </h3>

          {editingId && (
            <button
              type="button"
              onClick={resetForm}
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
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Last name
            <input
              maxLength={80}
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Email *
            <input
              required
              type="email"
              disabled={Boolean(editingId)}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`${inputClass} disabled:bg-slate-100 disabled:text-slate-500`}
            />
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Phone
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={inputClass}
            />
          </label>
        </div>

        <div className="mt-4 border border-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50 px-3 py-2">
            <p className="text-xs font-bold text-slate-700">
              Linked students ({Object.keys(links).length})
            </p>
            <input
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              placeholder="Search student..."
              className="h-8 w-44 border border-slate-300 px-2 text-xs outline-none focus:border-blue-600"
            />
          </div>

          <div className="max-h-52 overflow-y-auto">
            {visibleStudents.length === 0 ? (
              <p className="p-4 text-xs text-slate-500">
                {students.length === 0
                  ? "No enrolled students yet. Approve an admission first."
                  : "No students match."}
              </p>
            ) : (
              visibleStudents.map((student) => {
                const checked = student.id in links;

                return (
                  <div
                    key={student.id}
                    className="flex items-center justify-between gap-3 border-b border-slate-100 px-3 py-2 text-xs last:border-b-0"
                  >
                    <label className="flex min-w-0 flex-1 items-center gap-2">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleStudent(student.id)}
                      />
                      <span className="truncate font-semibold text-slate-800">
                        {student.name}
                      </span>
                      <span className="truncate text-slate-500">
                        {student.brxUid}
                        {student.className
                          ? ` · ${student.className}${student.sectionName ? ` ${student.sectionName}` : ""}`
                          : ""}
                      </span>
                    </label>

                    {checked && (
                      <select
                        value={links[student.id]}
                        onChange={(e) =>
                          setLinks({ ...links, [student.id]: e.target.value })
                        }
                        className="h-7 border border-slate-300 bg-white px-1 text-xs"
                      >
                        {RELATIONS.map((relation) => (
                          <option key={relation} value={relation}>
                            {relation.charAt(0) + relation.slice(1).toLowerCase()}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="h-9 bg-blue-800 px-4 text-xs font-semibold text-white hover:bg-blue-900 disabled:opacity-50"
          >
            {saving ? "Saving..." : editingId ? "Save changes" : "Create parent"}
          </button>
          {editingId && (
            <span className="text-xs text-slate-500">Email cannot be changed.</span>
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
          <p className="font-bold">Parent account created. Save these now.</p>
          <p className="mt-1 text-xs">
            The temporary password is shown only once. The parent must change
            it on first login.
          </p>
          <dl className="mt-3 grid gap-1 text-xs sm:grid-cols-[110px_1fr]">
            <dt className="font-semibold">EduNexa ID</dt>
            <dd className="font-mono">{credentials.eduNexaId}</dd>
            <dt className="font-semibold">Email</dt>
            <dd className="font-mono">{credentials.email}</dd>
            <dt className="font-semibold">Temp password</dt>
            <dd className="break-all font-mono">{credentials.temporaryPassword}</dd>
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
            Parents / guardians ({parents.length})
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
                placeholder="Search parents or children..."
                className="h-8 w-56 border border-slate-300 pl-8 pr-2 text-xs outline-none focus:border-blue-600"
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

        {loading && parents.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">Loading...</p>
        ) : visibleParents.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">
            {parents.length === 0
              ? "No parents yet. Create the first one above."
              : "No results match your search."}
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {visibleParents.map((parent) => (
              <li
                key={parent.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {parent.firstName} {parent.lastName ?? ""}
                    {parent.status !== "ACTIVE" && (
                      <span className="ml-2 bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-700">
                        {parent.status}
                      </span>
                    )}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {parent.email}
                    {parent.phone ? ` · ${parent.phone}` : ""} · {parent.brxUid}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-slate-600">
                    {parent.children.length === 0
                      ? "No students linked"
                      : parent.children
                          .map(
                            (child) =>
                              `${child.name} (${child.relation.toLowerCase()})`,
                          )
                          .join(", ")}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(parent)}
                    className="flex h-8 items-center gap-1 border border-slate-300 px-2.5 text-xs font-semibold hover:bg-slate-50"
                  >
                    <Pencil size={13} />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => void toggleStatus(parent)}
                    className="h-8 border border-slate-300 px-2.5 text-xs font-semibold hover:bg-slate-50"
                  >
                    {parent.status === "ACTIVE" ? "Suspend" : "Activate"}
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
