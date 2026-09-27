"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

const API_URL = "http://localhost:3000";

type Student = {
  id: string;
  firstName: string;
  lastName?: string | null;
  email: string;
  phone?: string | null;
  isActive?: boolean;
};

type Teacher = {
  id: string;
  firstName: string;
  lastName?: string | null;
  email: string;
  phone?: string | null;
  role: string;
  isActive?: boolean;
};

type Assignment = {
  id: string;
  student: Student;
};

function getToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("brx_access_token") ?? "";
}

function getInitials(firstName = "", lastName = "") {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "ST";
}

export default function TeacherStudentsPage() {
  const params = useParams();
  const router = useRouter();

  const teacherId = String(params.id);

  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [studentSearch, setStudentSearch] = useState("");

  const [showAssign, setShowAssign] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const assignedStudentIds = useMemo(
    () => new Set(assignments.map((item) => item.student?.id)),
    [assignments],
  );

  const filteredAssignments = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return assignments;

    return assignments.filter((assignment) => {
      const student = assignment.student;

      const name =
        `${student.firstName} ${student.lastName ?? ""}`.toLowerCase();

      return (
        name.includes(query) ||
        student.email.toLowerCase().includes(query) ||
        (student.phone ?? "").toLowerCase().includes(query)
      );
    });
  }, [assignments, search]);

  const availableStudents = useMemo(() => {
    const query = studentSearch.trim().toLowerCase();

    return allStudents
      .filter((student) => !assignedStudentIds.has(student.id))
      .filter((student) => {
        if (!query) return true;

        const name =
          `${student.firstName} ${student.lastName ?? ""}`.toLowerCase();

        return (
          name.includes(query) ||
          student.email.toLowerCase().includes(query) ||
          (student.phone ?? "").toLowerCase().includes(query)
        );
      });
  }, [allStudents, assignedStudentIds, studentSearch]);

  const loadTeacherData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const token = getToken();

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [teacherResponse, assignmentResponse] = await Promise.all([
        fetch(`${API_URL}/users/${teacherId}`, { headers }),
        fetch(`${API_URL}/users/${teacherId}/students`, { headers }),
      ]);

      if (teacherResponse.status === 401 || assignmentResponse.status === 401) {
        router.replace("/login");
        return;
      }

      if (!teacherResponse.ok) {
        throw new Error("Teacher details load nahi ho paaye.");
      }

      if (!assignmentResponse.ok) {
        throw new Error("Assigned students load nahi ho paaye.");
      }

      const teacherData = await teacherResponse.json();
      const assignmentData = await assignmentResponse.json();

      setTeacher(teacherData);
      setAssignments(Array.isArray(assignmentData) ? assignmentData : []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Data load karne me problem hui.",
      );
    } finally {
      setLoading(false);
    }
  }, [router, teacherId]);

  const loadAllStudents = useCallback(async () => {
    setLoadingStudents(true);

    try {
      const token = getToken();

      const response = await fetch(`${API_URL}/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        throw new Error("Students list load nahi ho paayi.");
      }

      const data = await response.json();

      const students = Array.isArray(data)
        ? data.filter((user) => user.role === "STUDENT")
        : [];

      setAllStudents(students);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Students load karne me problem hui.",
      );
    } finally {
      setLoadingStudents(false);
    }
  }, [router]);

  useEffect(() => {
    loadTeacherData();
  }, [loadTeacherData]);

  async function openAssignModal() {
    setShowAssign(true);
    setStudentSearch("");
    setError("");
    setSuccess("");

    await loadAllStudents();
  }

  async function assignStudent(studentId: string) {
    setAssigningId(studentId);
    setError("");
    setSuccess("");

    try {
      const token = getToken();

      const response = await fetch(
        `${API_URL}/users/${teacherId}/students`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            studentId,
          }),
        },
      );

      const data = await response.json().catch(() => null);

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(data?.message ?? "Student assign nahi ho paaya.");
      }

      setSuccess("Student successfully assign ho gaya.");

      await loadTeacherData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Student assign karne me problem hui.",
      );
    } finally {
      setAssigningId(null);
    }
  }

  async function removeStudent(studentId: string) {
    const student = assignments.find(
      (assignment) => assignment.student?.id === studentId,
    )?.student;

    const studentName = student
      ? `${student.firstName} ${student.lastName ?? ""}`.trim()
      : "this student";

    const confirmed = window.confirm(
      `Remove "${studentName}" from this teacher?`,
    );

    if (!confirmed) return;

    setRemovingId(studentId);
    setError("");
    setSuccess("");

    try {
      const token = getToken();

      const response = await fetch(
        `${API_URL}/users/${teacherId}/students/${studentId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json().catch(() => null);

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(data?.message ?? "Student remove nahi ho paaya.");
      }

      setSuccess("Student successfully remove ho gaya.");

      await loadTeacherData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Student remove karne me problem hui.",
      );
    } finally {
      setRemovingId(null);
    }
  }

  function closeModal() {
    setShowAssign(false);
    setStudentSearch("");
    setError("");
    setSuccess("");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#070b18] p-6 text-white">
        <div className="mx-auto max-w-7xl">
          <div className="flex min-h-[70vh] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-blue-400/20 border-t-blue-400" />
              <p className="mt-4 text-sm text-slate-500">
                Teacher data load ho raha hai...
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!teacher) {
    return (
      <main className="min-h-screen bg-[#070b18] p-6 text-white">
        <div className="mx-auto max-w-3xl rounded-3xl border border-red-400/10 bg-red-500/5 p-8 text-center">
          <div className="text-4xl">⚠️</div>

          <h1 className="mt-4 text-2xl font-bold">
            Teacher not found
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Teacher profile available nahi hai.
          </p>

          <Link
            href="/teachers"
            className="mt-6 inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-500"
          >
            Back to Teachers
          </Link>
        </div>
      </main>
    );
  }

  const teacherName =
    `${teacher.firstName} ${teacher.lastName ?? ""}`.trim();

  return (
    <main className="min-h-screen bg-[#070b18] text-white">
      <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">

        {/* Header */}
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-blue-600/10 via-indigo-500/5 to-purple-600/10 p-6 shadow-2xl shadow-black/20">
          <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-blue-600/10 blur-3xl" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <Link
                href={`/teachers/${teacherId}`}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white"
              >
                ←
              </Link>

              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/30 to-purple-500/20 text-xl font-black text-blue-200 ring-1 ring-white/10">
                {getInitials(teacher.firstName, teacher.lastName ?? "")}
              </div>

              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-300">
                  Teacher Management
                </p>

                <h1 className="mt-1 truncate text-2xl font-black sm:text-3xl">
                  {teacherName}
                </h1>

                <p className="mt-1 truncate text-sm text-slate-500">
                  {teacher.email}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={openAssignModal}
              className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3.5 text-sm font-black text-white shadow-xl shadow-blue-900/30 transition hover:scale-[1.02] hover:from-blue-500 hover:to-indigo-500"
            >
              + Assign Student
            </button>
          </div>
        </section>

        {/* Alerts */}
        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-start gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            <span>✓</span>
            <span>{success}</span>
          </div>
        )}

        {/* Stats */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Assigned Students"
            value={assignments.length}
            icon="👨‍🎓"
          />

          <StatCard
            label="Available Students"
            value={Math.max(allStudents.length - assignments.length, 0)}
            icon="🎓"
          />

          <StatCard
            label="Teacher Status"
            value={teacher.isActive === false ? "Inactive" : "Active"}
            icon="●"
          />

          <StatCard
            label="Role"
            value="Teacher"
            icon="👨‍🏫"
          />
        </section>

        {/* Search + Table */}
        <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] shadow-2xl shadow-black/20 backdrop-blur-xl">
          <div className="border-b border-white/10 p-5 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-300">
                  Assignment List
                </p>

                <h2 className="mt-1 text-xl font-black">
                  Assigned Students
                </h2>
              </div>

              <div className="flex w-full gap-2 lg:max-w-md">
                <div className="relative flex-1">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                    🔎
                  </span>

                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search assigned students..."
                    className="w-full rounded-xl border border-white/10 bg-black/20 py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500/40"
                  />
                </div>

                <button
                  type="button"
                  onClick={loadTeacherData}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-bold text-slate-300 transition hover:bg-white/10 hover:text-white"
                >
                  ↻
                </button>
              </div>
            </div>
          </div>

          {filteredAssignments.length === 0 ? (
            <div className="p-12 text-center sm:p-16">
              <div className="text-5xl">👨‍🎓</div>

              <h3 className="mt-4 text-lg font-bold">
                {search ? "No matching students" : "No students assigned"}
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                {search
                  ? "Search query change karke dobara try karein."
                  : "Is teacher ke liye students assign karne ke liye Assign Student button use karein."}
              </p>

              {!search && (
                <button
                  type="button"
                  onClick={openAssignModal}
                  className="mt-6 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold hover:bg-blue-500"
                >
                  + Assign First Student
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10 bg-black/10 text-left text-xs uppercase tracking-wider text-slate-500">
                      <th className="px-6 py-4">Student</th>
                      <th className="px-6 py-4">Email</th>
                      <th className="px-6 py-4">Mobile</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredAssignments.map((assignment) => {
                      const student = assignment.student;
                      const isRemoving = removingId === student.id;

                      return (
                        <tr
                          key={assignment.id}
                          className="border-b border-white/[0.06] transition hover:bg-white/[0.025]"
                        >
                          <td className="px-6 py-4">
                            <Link
                              href={`/students/${student.id}`}
                              className="flex items-center gap-3"
                            >
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-xs font-black text-blue-300">
                                {getInitials(
                                  student.firstName,
                                  student.lastName ?? "",
                                )}
                              </div>

                              <div>
                                <p className="font-semibold text-white hover:text-blue-300">
                                  {student.firstName}{" "}
                                  {student.lastName ?? ""}
                                </p>

                                <p className="text-xs text-slate-600">
                                  Student
                                </p>
                              </div>
                            </Link>
                          </td>

                          <td className="px-6 py-4 text-sm text-slate-400">
                            {student.email}
                          </td>

                          <td className="px-6 py-4 text-sm text-slate-400">
                            {student.phone || "—"}
                          </td>

                          <td className="px-6 py-4 text-right">
                            <button
                              type="button"
                              disabled={isRemoving}
                              onClick={() => removeStudent(student.id)}
                              className="rounded-xl border border-red-400/10 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-300 transition hover:bg-red-500/20 disabled:opacity-50"
                            >
                              {isRemoving ? "Removing..." : "Remove"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile */}
              <div className="space-y-3 p-4 md:hidden">
                {filteredAssignments.map((assignment) => {
                  const student = assignment.student;
                  const isRemoving = removingId === student.id;

                  return (
                    <div
                      key={assignment.id}
                      className="rounded-2xl border border-white/10 bg-black/15 p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <Link
                          href={`/students/${student.id}`}
                          className="flex min-w-0 items-center gap-3"
                        >
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-xs font-black text-blue-300">
                            {getInitials(
                              student.firstName,
                              student.lastName ?? "",
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate font-bold">
                              {student.firstName}{" "}
                              {student.lastName ?? ""}
                            </p>

                            <p className="truncate text-xs text-slate-500">
                              {student.email}
                            </p>
                          </div>
                        </Link>

                        <button
                          type="button"
                          disabled={isRemoving}
                          onClick={() => removeStudent(student.id)}
                          className="shrink-0 rounded-xl bg-red-500/10 px-3 py-2 text-xs font-bold text-red-300 disabled:opacity-50"
                        >
                          {isRemoving ? "..." : "Remove"}
                        </button>
                      </div>

                      <div className="mt-3 border-t border-white/5 pt-3 text-xs text-slate-500">
                        📱 {student.phone || "Mobile not available"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>
      </div>

      {/* Assign Modal */}
      {showAssign && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0b1124] shadow-2xl shadow-black/70">

            <div className="flex items-center justify-between border-b border-white/10 p-5 sm:p-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-300">
                  Student Assignment
                </p>

                <h2 className="mt-1 text-xl font-black">
                  Select Student
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  {teacherName} ko student assign karein.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-xl text-slate-400 hover:bg-white/10 hover:text-white"
              >
                ×
              </button>
            </div>

            <div className="border-b border-white/10 p-5">
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                  🔎
                </span>

                <input
                  autoFocus
                  value={studentSearch}
                  onChange={(event) =>
                    setStudentSearch(event.target.value)
                  }
                  placeholder="Search student..."
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] py-3.5 pl-11 pr-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500/50"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {loadingStudents ? (
                <div className="py-14 text-center">
                  <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-blue-400/20 border-t-blue-400" />

                  <p className="mt-4 text-sm text-slate-500">
                    Students load ho rahe hain...
                  </p>
                </div>
              ) : availableStudents.length === 0 ? (
                <div className="py-14 text-center">
                  <div className="text-4xl">🎓</div>

                  <h3 className="mt-4 font-bold">
                    No available students
                  </h3>

                  <p className="mt-2 text-sm text-slate-500">
                    {allStudents.length === 0
                      ? "Institution me abhi students nahi hain."
                      : "Sab students already assigned hain ya search match nahi mila."}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {availableStudents.map((student) => {
                    const isAssigning = assigningId === student.id;

                    return (
                      <div
                        key={student.id}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-blue-400/20 hover:bg-white/[0.05]"
                      >
                        <Link
                          href={`/students/${student.id}`}
                          onClick={closeModal}
                          className="flex min-w-0 items-center gap-3"
                        >
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 text-xs font-black text-blue-300">
                            {getInitials(
                              student.firstName,
                              student.lastName ?? "",
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate font-semibold text-white">
                              {student.firstName}{" "}
                              {student.lastName ?? ""}
                            </p>

                            <p className="truncate text-xs text-slate-500">
                              {student.email}
                            </p>
                          </div>
                        </Link>

                        <button
                          type="button"
                          disabled={isAssigning}
                          onClick={() => assignStudent(student.id)}
                          className="shrink-0 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isAssigning ? "Adding..." : "Assign"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-white/10 bg-black/10 px-5 py-4">
              <span className="text-xs text-slate-500">
                Available:{" "}
                <strong className="text-slate-300">
                  {availableStudents.length}
                </strong>
              </span>

              <button
                type="button"
                onClick={closeModal}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-slate-300 hover:bg-white/10 hover:text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 shadow-xl shadow-black/10 backdrop-blur-xl">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {label}
          </p>

          <p className="mt-2 text-2xl font-black text-white">
            {value}
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-lg">
          {icon}
        </div>
      </div>
    </div>
  );
}