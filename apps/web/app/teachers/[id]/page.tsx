"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Teacher = {
  id: string;
  firstName: string;
  lastName?: string | null;
  email: string;
  phone?: string | null;
  status?: string;
  role?: string;
};

type AssignedStudent = {
  id: string;
  firstName: string;
  lastName?: string | null;
  email?: string;
  phone?: string | null;
  status?: string;
};

export default function TeacherProfilePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [students, setStudents] = useState<AssignedStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState("");
  const [error, setError] = useState("");

  const teacherId = params.id;

  async function loadTeacher() {
    const token = localStorage.getItem("brx_access_token");

    try {
      setLoading(true);

      const [teacherResponse, studentsResponse] = await Promise.all([
        fetch(`http://localhost:3000/users/${teacherId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        fetch(`http://localhost:3000/users/${teacherId}/students`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);

      if (!teacherResponse.ok) {
        throw new Error("Teacher not found.");
      }

      const teacherData = await teacherResponse.json();
      const studentsData = studentsResponse.ok
        ? await studentsResponse.json()
        : [];

      setTeacher(teacherData?.data ?? teacherData);

      const rawStudents = Array.isArray(studentsData)
        ? studentsData
        : Array.isArray(studentsData?.data)
          ? studentsData.data
          : [];

      setStudents(
        rawStudents.map((item: any) => {
          if (item?.student) {
            return item.student;
          }

          return item;
        }),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load teacher.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (teacherId) {
      loadTeacher();
    }
  }, [teacherId]);

  async function removeStudent(studentId: string) {
    const confirmed = window.confirm(
      "Remove this student from the teacher?",
    );

    if (!confirmed) return;

    const token = localStorage.getItem("brx_access_token");

    setRemovingId(studentId);
    setError("");

    try {
      const response = await fetch(
        `http://localhost:3000/users/${teacherId}/students/${studentId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.message || "Unable to remove student.");
      }

      setStudents((current) =>
        current.filter((student) => student.id !== studentId),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to remove student.",
      );
    } finally {
      setRemovingId("");
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#070b18] p-6 text-white">
        <div className="mx-auto max-w-6xl animate-pulse">
          <div className="h-10 w-80 rounded bg-white/10" />
          <div className="mt-6 h-56 rounded-3xl bg-white/[0.05]" />
        </div>
      </main>
    );
  }

  if (!teacher) {
    return (
      <main className="min-h-screen bg-[#070b18] p-6 text-white">
        <div className="mx-auto max-w-3xl rounded-3xl border border-red-400/20 bg-red-500/10 p-8">
          <h1 className="text-2xl font-black">Teacher not found</h1>
          <p className="mt-2 text-sm text-red-300">
            {error || "The requested teacher could not be loaded."}
          </p>
          <button
            onClick={() => router.push("/teachers")}
            className="mt-6 rounded-xl bg-white/10 px-5 py-3 text-sm font-bold"
          >
            Back to Teachers
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#070b18] text-white">
      <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <button
            onClick={() => router.push("/teachers")}
            className="text-sm font-semibold text-slate-400 hover:text-white"
          >
            ← Teachers
          </button>

          <Link
            href={`/teachers/${teacher.id}/edit`}
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-500"
          >
            Edit Teacher
          </Link>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-500/30 to-purple-500/20 text-3xl font-black text-blue-300 ring-1 ring-blue-400/20">
              {teacher.firstName?.charAt(0)?.toUpperCase() || "T"}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-black tracking-tight">
                  {teacher.firstName} {teacher.lastName || ""}
                </h1>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    teacher.status === "ACTIVE"
                      ? "bg-emerald-500/10 text-emerald-300"
                      : "bg-amber-500/10 text-amber-300"
                  }`}
                >
                  {teacher.status || "ACTIVE"}
                </span>
              </div>

              <p className="mt-2 text-sm text-slate-400">{teacher.email}</p>

              {teacher.phone && (
                <p className="mt-1 text-sm text-slate-500">{teacher.phone}</p>
              )}
            </div>

            <div className="rounded-2xl border border-blue-400/10 bg-blue-500/10 px-5 py-4 text-center">
              <p className="text-2xl font-black text-blue-300">
                {students.length}
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-400">
                Assigned Students
              </p>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-black">Assigned Students</h2>
              <p className="mt-1 text-sm text-slate-500">
                Students currently assigned to this teacher.
              </p>
            </div>

            <Link
              href={`/teachers/${teacher.id}/edit`}
              className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm font-bold text-slate-300 hover:bg-white/[0.09] hover:text-white"
            >
              Manage Assignment
            </Link>
          </div>

          {students.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center">
              <div className="text-4xl">👨‍🎓</div>
              <h3 className="mt-4 font-bold">No students assigned</h3>
              <p className="mt-2 text-sm text-slate-500">
                Assign students to this teacher from the teacher management
                section.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {students.map((student) => (
                <div
                  key={student.id}
                  className="rounded-2xl border border-white/10 bg-[#0b1020] p-5 transition hover:border-blue-400/20"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 font-bold text-blue-300">
                        {student.firstName?.charAt(0)?.toUpperCase() || "S"}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate font-bold">
                          {student.firstName} {student.lastName || ""}
                        </p>

                        <p className="mt-1 truncate text-xs text-slate-500">
                          {student.email || student.phone || "Student"}
                        </p>
                      </div>
                    </div>

                    <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] font-bold text-emerald-300">
                      {student.status || "ACTIVE"}
                    </span>
                  </div>

                  <div className="mt-5 flex gap-2">
                    <Link
                      href={`/students/${student.id}`}
                      className="flex-1 rounded-xl bg-blue-600/10 px-3 py-2 text-center text-xs font-bold text-blue-300 hover:bg-blue-600/20"
                    >
                      View
                    </Link>

                    <button
                      onClick={() => removeStudent(student.id)}
                      disabled={removingId === student.id}
                      className="rounded-xl bg-red-500/10 px-3 py-2 text-xs font-bold text-red-300 hover:bg-red-500/20 disabled:opacity-50"
                    >
                      {removingId === student.id ? "..." : "Remove"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}