"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Student = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  role?: string;
  isActive?: boolean;
};

type Enrollment = {
  id: string;
  class?: {
    id: string;
    name: string;
  } | null;
  section?: {
    id: string;
    name: string;
  } | null;
};

type StudentRow = Student & {
  enrollment?: Enrollment | null;
};

export default function StudentsPage() {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [classFilter, setClassFilter] = useState("ALL");

  async function loadStudents(showRefresh = false) {
    const token = localStorage.getItem("brx_access_token");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const response = await fetch("http://localhost:3000/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json().catch(() => []);

      if (!response.ok) {
        throw new Error(
          data?.message || "Students load nahi ho paaye."
        );
      }

      const users: Student[] = Array.isArray(data)
        ? data.filter((user) => user.role === "STUDENT")
        : [];

      const rows = await Promise.all(
        users.map(async (student) => {
          try {
            const enrollmentResponse = await fetch(
              `http://localhost:3000/academics/students/${student.id}/enrollments`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            const enrollmentData =
              await enrollmentResponse.json().catch(() => []);

            const enrollments: Enrollment[] = Array.isArray(
              enrollmentData
            )
              ? enrollmentData
              : [];

            return {
              ...student,
              enrollment: enrollments[0] ?? null,
            };
          } catch {
            return {
              ...student,
              enrollment: null,
            };
          }
        })
      );

      setStudents(rows);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Students load nahi ho paaye."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadStudents();
  }, []);

  const classOptions = useMemo(() => {
    const names = students
      .map((student) => student.enrollment?.class?.name)
      .filter(Boolean) as string[];

    return Array.from(new Set(names)).sort();
  }, [students]);

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return students.filter((student) => {
      const fullName =
        `${student.firstName ?? ""} ${student.lastName ?? ""}`.trim();

      const matchesSearch =
        !query ||
        fullName.toLowerCase().includes(query) ||
        (student.email ?? "").toLowerCase().includes(query) ||
        (student.phone ?? "").toLowerCase().includes(query);

      const active = student.isActive !== false;

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && active) ||
        (statusFilter === "INACTIVE" && !active);

      const studentClass =
        student.enrollment?.class?.name ?? "";

      const matchesClass =
        classFilter === "ALL" ||
        studentClass === classFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesClass
      );
    });
  }, [students, search, statusFilter, classFilter]);

  const activeCount = students.filter(
    (student) => student.isActive !== false
  ).length;

  const inactiveCount = students.length - activeCount;

  const assignedCount = students.filter(
    (student) => student.enrollment
  ).length;

  return (
    <main className="min-h-screen bg-[#070b18] text-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link
              href="/dashboard"
              className="mb-3 inline-flex text-sm text-slate-500 hover:text-white"
            >
              ← Dashboard
            </Link>

            <h1 className="text-3xl font-bold tracking-tight">
              Students
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Manage students, profiles and academic enrollment.
            </p>
          </div>

          <Link
            href="/students/create"
            className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500"
          >
            ＋ Add Student
          </Link>
        </div>

        {/* Stats */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon="👨‍🎓"
            label="Total Students"
            value={students.length}
          />

          <StatCard
            icon="🟢"
            label="Active"
            value={activeCount}
          />

          <StatCard
            icon="🔴"
            label="Inactive"
            value={inactiveCount}
          />

          <StatCard
            icon="🎓"
            label="Class Assigned"
            value={assignedCount}
          />
        </div>

        {/* Filters */}
        <section className="mb-6 rounded-3xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl sm:p-5">
          <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px_auto]">
            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search name, email or mobile..."
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500/40"
            />

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
              className="rounded-2xl border border-white/10 bg-[#0b1020] px-4 py-3 text-sm text-white outline-none"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>

            <select
              value={classFilter}
              onChange={(event) =>
                setClassFilter(event.target.value)
              }
              className="rounded-2xl border border-white/10 bg-[#0b1020] px-4 py-3 text-sm text-white outline-none"
            >
              <option value="ALL">All Classes</option>

              {classOptions.map((className) => (
                <option key={className} value={className}>
                  {className}
                </option>
              ))}
            </select>

            <button
              onClick={() => loadStudents(true)}
              disabled={refreshing}
              className="rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.09] hover:text-white disabled:opacity-50"
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

        {/* Table */}
        <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20 backdrop-blur-xl">
          {loading ? (
            <div className="p-14 text-center">
              <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-white/20 border-t-blue-400" />

              <p className="mt-4 text-sm text-slate-500">
                Students loading...
              </p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="p-14 text-center">
              <div className="text-5xl">👨‍🎓</div>

              <h2 className="mt-5 text-lg font-semibold">
                No students found
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Search filter change karo ya first student add karo.
              </p>

              <Link
                href="/students/create"
                className="mt-6 inline-flex rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold hover:bg-blue-500"
              >
                ＋ Add Student
              </Link>
            </div>
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[850px]">
                  <thead>
                    <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-slate-500">
                      <th className="px-6 py-4">
                        Student
                      </th>

                      <th className="px-6 py-4">
                        Contact
                      </th>

                      <th className="px-6 py-4">
                        Class
                      </th>

                      <th className="px-6 py-4">
                        Status
                      </th>

                      <th className="px-6 py-4 text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredStudents.map((student) => {
                      const name =
                        `${student.firstName ?? ""} ${student.lastName ?? ""}`.trim() ||
                        "Unnamed Student";

                      const active =
                        student.isActive !== false;

                      return (
                        <tr
                          key={student.id}
                          className="border-b border-white/[0.06] transition hover:bg-white/[0.025]"
                        >
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <Avatar name={name} />

                              <div>
                                <p className="font-semibold text-white">
                                  {name}
                                </p>

                                <p className="mt-1 text-xs text-slate-600">
                                  ID: {student.id.slice(0, 8)}...
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-5">
                            <p className="text-sm text-slate-300">
                              {student.email || "—"}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {student.phone || "No mobile"}
                            </p>
                          </td>

                          <td className="px-6 py-5">
                            {student.enrollment ? (
                              <div>
                                <p className="text-sm font-semibold text-white">
                                  {student.enrollment.class?.name ??
                                    "Class"}
                                </p>

                                <p className="mt-1 text-xs text-slate-500">
                                  Section{" "}
                                  {student.enrollment.section?.name ??
                                    "—"}
                                </p>
                              </div>
                            ) : (
                              <span className="text-xs text-amber-300">
                                Not assigned
                              </span>
                            )}
                          </td>

                          <td className="px-6 py-5">
                            <Status active={active} />
                          </td>

                          <td className="px-6 py-5">
                            <div className="flex justify-end gap-2">
                              <Link
                                href={`/students/${student.id}`}
                                className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-white/[0.08] hover:text-white"
                              >
                                View
                              </Link>

                              <Link
                                href={`/students/${student.id}/edit`}
                                className="rounded-xl border border-blue-400/10 bg-blue-500/10 px-3 py-2 text-xs font-semibold text-blue-300 hover:bg-blue-500/20"
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

              {/* Mobile */}
              <div className="divide-y divide-white/[0.06] md:hidden">
                {filteredStudents.map((student) => {
                  const name =
                    `${student.firstName ?? ""} ${student.lastName ?? ""}`.trim() ||
                    "Unnamed Student";

                  const active =
                    student.isActive !== false;

                  return (
                    <div
                      key={student.id}
                      className="p-5"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={name} />

                          <div>
                            <p className="font-semibold">
                              {name}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {student.email || "No email"}
                            </p>
                          </div>
                        </div>

                        <Status active={active} />
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <Info
                          label="Mobile"
                          value={student.phone || "—"}
                        />

                        <Info
                          label="Class"
                          value={
                            student.enrollment?.class?.name ||
                            "Not assigned"
                          }
                        />
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <Link
                          href={`/students/${student.id}`}
                          className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-center text-xs font-semibold"
                        >
                          View Profile
                        </Link>

                        <Link
                          href={`/students/${student.id}/edit`}
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

        <p className="mt-5 text-center text-xs text-slate-700">
          Showing {filteredStudents.length} of {students.length} students
        </p>
      </div>
    </main>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <span className="text-2xl">{icon}</span>

        <span className="text-2xl font-bold">
          {value}
        </span>
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
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/30 to-purple-500/30 text-sm font-bold text-blue-200 ring-1 ring-white/10">
      {initials || "S"}
    </div>
  );
}

function Status({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
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

      <p className="mt-1 truncate text-xs text-slate-300">
        {value}
      </p>
    </div>
  );
}