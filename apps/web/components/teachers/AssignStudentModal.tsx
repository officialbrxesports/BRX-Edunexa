"use client";

import { useEffect, useMemo, useState } from "react";

type Student = {
  id: string;
  firstName: string;
  lastName?: string | null;
  email: string;
  phone?: string | null;
};

type AssignedStudent = {
  id: string;
  student: Student;
};

type Props = {
  teacherId: string;
  assignedStudents: AssignedStudent[];
  onChanged: () => void;
};

const API_URL = "http://localhost:3000";

function getToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("brx_access_token") ?? "";
}

export default function AssignStudentModal({
  teacherId,
  assignedStudents,
  onChanged,
}: Props) {
  const [open, setOpen] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const assignedIds = useMemo(
    () => new Set(assignedStudents.map((item) => item.student?.id)),
    [assignedStudents],
  );

  const availableStudents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return students
      .filter((student) => !assignedIds.has(student.id))
      .filter((student) => {
        if (!query) return true;

        const fullName =
          `${student.firstName} ${student.lastName ?? ""}`.toLowerCase();

        return (
          fullName.includes(query) ||
          student.email.toLowerCase().includes(query) ||
          (student.phone ?? "").includes(query)
        );
      });
  }, [students, assignedIds, search]);

  async function loadStudents() {
    setLoadingStudents(true);
    setError("");

    try {
      const token = getToken();

      const response = await fetch(`${API_URL}/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Students load nahi ho paaye.");
      }

      const data = await response.json();

      const studentUsers = Array.isArray(data)
        ? data.filter((user) => user.role === "STUDENT")
        : [];

      setStudents(studentUsers);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Students load karne me problem hui.",
      );
    } finally {
      setLoadingStudents(false);
    }
  }

  function openModal() {
    setOpen(true);
    setSearch("");
    setError("");
    loadStudents();
  }

  async function assignStudent(studentId: string) {
    setSavingId(studentId);
    setError("");

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

      if (!response.ok) {
        throw new Error(data?.message ?? "Student assign nahi ho paaya.");
      }

      onChanged();
      await loadStudents();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Student assign karne me problem hui.",
      );
    } finally {
      setSavingId(null);
    }
  }

  async function removeStudent(studentId: string) {
    const confirmed = window.confirm(
      "Kya aap is student ko teacher se remove karna chahte hain?",
    );

    if (!confirmed) return;

    setSavingId(studentId);
    setError("");

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

      if (!response.ok) {
        throw new Error(data?.message ?? "Student remove nahi ho paaya.");
      }

      onChanged();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Student remove karne me problem hui.",
      );
    } finally {
      setSavingId(null);
    }
  }

  return (
    <>
      {/* Assignment Card */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20 backdrop-blur-xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-300">
              Student Assignment
            </p>

            <h3 className="mt-1 text-xl font-bold text-white">
              Assigned Students
            </h3>

            <p className="mt-1 text-sm text-slate-400">
              Teacher ke students manage karein.
            </p>
          </div>

          <button
            type="button"
            onClick={openModal}
            className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-900/30 transition hover:scale-[1.02] hover:from-blue-500 hover:to-indigo-500"
          >
            + Assign Student
          </button>
        </div>

        {assignedStudents.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-black/10 p-8 text-center">
            <div className="text-3xl">👨‍🎓</div>

            <p className="mt-3 font-semibold text-white">
              No students assigned
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Assign Student button se student add karein.
            </p>
          </div>
        ) : (
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {assignedStudents.map((assignment) => {
              const student = assignment.student;

              return (
                <div
                  key={assignment.id}
                  className="group flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-blue-400/20 hover:bg-white/[0.06]"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/15 text-lg font-black text-blue-300">
                      {student.firstName?.charAt(0)?.toUpperCase() ?? "S"}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate font-semibold text-white">
                        {student.firstName} {student.lastName ?? ""}
                      </p>

                      <p className="truncate text-xs text-slate-500">
                        {student.email}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={savingId === student.id}
                    onClick={() => removeStudent(student.id)}
                    className="ml-3 rounded-xl border border-red-400/10 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {savingId === student.id ? "..." : "Remove"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
          <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-[#0b1124] shadow-2xl shadow-black/60">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 p-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-300">
                  Teacher Assignment
                </p>

                <h2 className="mt-1 text-xl font-bold text-white">
                  Assign Student
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-xl text-slate-400 transition hover:bg-white/10 hover:text-white"
              >
                ×
              </button>
            </div>

            {/* Search */}
            <div className="border-b border-white/10 p-5">
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                  🔎
                </span>

                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search student by name, email or mobile..."
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] py-3.5 pl-11 pr-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10"
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="mx-5 mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            {/* Students */}
            <div className="max-h-[55vh] overflow-y-auto p-5">
              {loadingStudents ? (
                <div className="py-12 text-center">
                  <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-blue-400/20 border-t-blue-400" />
                  <p className="mt-4 text-sm text-slate-500">
                    Students load ho rahe hain...
                  </p>
                </div>
              ) : availableStudents.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center">
                  <div className="text-3xl">🎓</div>

                  <p className="mt-3 font-semibold text-white">
                    {students.length === 0
                      ? "No students found"
                      : "No available students"}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    {students.length === 0
                      ? "Pehle student account create karein."
                      : "Search change karein ya already assigned students check karein."}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {availableStudents.map((student) => {
                    const fullName =
                      `${student.firstName} ${student.lastName ?? ""}`.trim();

                    const isSaving = savingId === student.id;

                    return (
                      <div
                        key={student.id}
                        className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-blue-400/20 hover:bg-white/[0.05]"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 text-sm font-black text-blue-300">
                            {student.firstName?.charAt(0)?.toUpperCase() ??
                              "S"}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate font-semibold text-white">
                              {fullName}
                            </p>

                            <p className="truncate text-xs text-slate-500">
                              {student.email}
                              {student.phone ? ` • ${student.phone}` : ""}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={isSaving}
                          onClick={() => assignStudent(student.id)}
                          className="ml-3 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isSaving ? "Adding..." : "Assign"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-white/10 bg-black/10 px-5 py-4">
              <p className="text-xs text-slate-500">
                Assigned:{" "}
                <span className="font-bold text-slate-300">
                  {assignedStudents.length}
                </span>
              </p>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}