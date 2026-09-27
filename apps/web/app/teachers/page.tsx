"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Teacher = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  role?: string;
  isActive?: boolean;
};

type AssignedStudent = {
  id: string;
  student?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    phone?: string | null;
  } | null;
};

type TeacherRow = Teacher & {
  assignedStudents: AssignedStudent[];
};

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<TeacherRow[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function loadTeachers(refresh = false) {
    const token = localStorage.getItem("brx_access_token");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    refresh ? setRefreshing(true) : setLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:3000/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json().catch(() => []);

      if (!response.ok) {
        throw new Error(data?.message || "Teachers load nahi ho paye.");
      }

      const teacherUsers: Teacher[] = Array.isArray(data)
        ? data.filter((user) => user.role === "TEACHER")
        : [];

      const rows = await Promise.all(
        teacherUsers.map(async (teacher) => {
          try {
            const response = await fetch(
              `http://localhost:3000/users/${teacher.id}/students`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            const assigned = await response.json().catch(() => []);

            return {
              ...teacher,
              assignedStudents: Array.isArray(assigned) ? assigned : [],
            };
          } catch {
            return {
              ...teacher,
              assignedStudents: [],
            };
          }
        })
      );

      setTeachers(rows);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Teachers load nahi ho paye."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadTeachers();
  }, []);

  const filteredTeachers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return teachers.filter((teacher) => {
      const name =
        `${teacher.firstName ?? ""} ${teacher.lastName ?? ""}`.trim();

      const matchesSearch =
        !query ||
        name.toLowerCase().includes(query) ||
        (teacher.email ?? "").toLowerCase().includes(query) ||
        (teacher.phone ?? "").toLowerCase().includes(query);

      const active = teacher.isActive !== false;

      const matchesStatus =
        status === "ALL" ||
        (status === "ACTIVE" && active) ||
        (status === "INACTIVE" && !active);

      return matchesSearch && matchesStatus;
    });
  }, [teachers, search, status]);

  const activeCount = teachers.filter(
    (teacher) => teacher.isActive !== false
  ).length;

  const totalAssigned = teachers.reduce(
    (sum, teacher) => sum + teacher.assignedStudents.length,
    0
  );

  return (
    <main className="min-h-screen bg-[#070b18] text-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link
              href="/dashboard"
              className="mb-3 inline-flex text-sm text-slate-500 hover:text-white"
            >
              ← Dashboard
            </Link>

            <h1 className="text-3xl font-bold tracking-tight">
              Teachers
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Manage teachers and their student assignments.
            </p>
          </div>

          <Link
            href="/teachers/create"
            className="rounded-2xl bg-blue-600 px-6 py-3 text-center text-sm font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-500"
          >
            ＋ Add Teacher
          </Link>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <Stat icon="👨‍🏫" label="Total Teachers" value={teachers.length} />
          <Stat icon="🟢" label="Active Teachers" value={activeCount} />
          <Stat icon="👨‍🎓" label="Assigned Students" value={totalAssigned} />
        </div>

        <section className="mb-6 rounded-3xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl">
          <div className="grid gap-3 md:grid-cols-[1fr_180px_auto]">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search teacher, email or mobile..."
              className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500/40"
            />

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-2xl border border-white/10 bg-[#0b1020] px-4 py-3 text-sm text-white outline-none"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>

            <button
              onClick={() => loadTeachers(true)}
              disabled={refreshing}
              className="rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-semibold text-slate-300 hover:bg-white/[0.09] hover:text-white disabled:opacity-50"
            >
              {refreshing ? "Refreshing..." : "↻ Refresh"}
            </button>
          </div>
        </section>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl">
          {loading ? (
            <div className="p-14 text-center">
              <Spinner />
              <p className="mt-4 text-sm text-slate-500">
                Teachers loading...
              </p>
            </div>
          ) : filteredTeachers.length === 0 ? (
            <div className="p-14 text-center">
              <div className="text-5xl">👨‍🏫</div>
              <h2 className="mt-5 text-lg font-semibold">
                No teachers found
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Teacher add karo ya search filter change karo.
              </p>

              <Link
                href="/teachers/create"
                className="mt-6 inline-flex rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold hover:bg-blue-500"
              >
                ＋ Add Teacher
              </Link>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[850px]">
                  <thead>
                    <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-slate-500">
                      <th className="px-6 py-4">Teacher</th>
                      <th className="px-6 py-4">Contact</th>
                      <th className="px-6 py-4">Students</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredTeachers.map((teacher) => {
                      const name =
                        `${teacher.firstName ?? ""} ${teacher.lastName ?? ""}`.trim() ||
                        "Unnamed Teacher";

                      const active = teacher.isActive !== false;

                      return (
                        <tr
                          key={teacher.id}
                          className="border-b border-white/[0.06] hover:bg-white/[0.025]"
                        >
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <Avatar name={name} />

                              <div>
                                <p className="font-semibold">{name}</p>
                                <p className="mt-1 text-xs text-slate-600">
                                  ID: {teacher.id.slice(0, 8)}...
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-5">
                            <p className="text-sm text-slate-300">
                              {teacher.email || "—"}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {teacher.phone || "No mobile"}
                            </p>
                          </td>

                          <td className="px-6 py-5">
                            <span className="rounded-xl bg-blue-500/10 px-3 py-2 text-sm font-bold text-blue-300">
                              {teacher.assignedStudents.length}
                            </span>
                          </td>

                          <td className="px-6 py-5">
                            <Status active={active} />
                          </td>

                          <td className="px-6 py-5">
                            <div className="flex justify-end gap-2">
                              <Link
                                href={`/teachers/${teacher.id}`}
                                className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-white/[0.08] hover:text-white"
                              >
                                View
                              </Link>

                              <Link
                                href={`/teachers/${teacher.id}/edit`}
                                className="rounded-xl bg-blue-500/10 px-3 py-2 text-xs font-semibold text-blue-300 hover:bg-blue-500/20"
                              >
                                Edit
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-white/[0.06] md:hidden">
                {filteredTeachers.map((teacher) => {
                  const name =
                    `${teacher.firstName ?? ""} ${teacher.lastName ?? ""}`.trim() ||
                    "Unnamed Teacher";

                  return (
                    <div key={teacher.id} className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={name} />
                          <div>
                            <p className="font-semibold">{name}</p>
                            <p className="mt-1 text-xs text-slate-500">
                              {teacher.email || "No email"}
                            </p>
                          </div>
                        </div>

                        <Status active={teacher.isActive !== false} />
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <Info
                          label="Mobile"
                          value={teacher.phone || "—"}
                        />
                        <Info
                          label="Students"
                          value={String(teacher.assignedStudents.length)}
                        />
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <Link
                          href={`/teachers/${teacher.id}`}
                          className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-center text-xs font-semibold"
                        >
                          View
                        </Link>

                        <Link
                          href={`/teachers/${teacher.id}/edit`}
                          className="rounded-xl bg-blue-600 px-4 py-2.5 text-center text-xs font-bold"
                        >
                          Edit
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
      <div className="flex items-center justify-between">
        <span className="text-2xl">{icon}</span>
        <span className="text-2xl font-bold">{value}</span>
      </div>
      <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </p>
    </div>
  );
}

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((x) => x[0]?.toUpperCase())
    .join("");

  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-500/15 text-sm font-bold text-blue-300 ring-1 ring-white/10">
      {initials || "T"}
    </div>
  );
}

function Status({ active }: { active: boolean }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
        active
          ? "bg-emerald-500/10 text-emerald-300"
          : "bg-red-500/10 text-red-300"
      }`}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-black/10 p-3">
      <p className="text-[10px] uppercase tracking-wider text-slate-600">
        {label}
      </p>
      <p className="mt-1 truncate text-xs text-slate-300">{value}</p>
    </div>
  );
}

function Spinner() {
  return (
    <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-white/20 border-t-blue-400" />
  );
}