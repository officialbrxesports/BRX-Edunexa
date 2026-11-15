"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { apiRequest } from "../../lib/api";

export type ShortCourse = {
  id: string;
  title: string;
  code: string;
  durationWeeks: number;
  description: string | null;
  isActive: boolean;
  enrolled: number;
  completed: number;
};

export type Enrollment = {
  id: string;
  courseId: string;
  courseTitle: string;
  studentName: string;
  brxUid: string;
  status: "ENROLLED" | "COMPLETED" | "DROPPED";
  startedOn: string;
  completedOn: string | null;
  grade: string | null;
  certificateNo: string | null;
};

export type CertificateRow = {
  certificateNo: string;
  issuedOn: string;
  grade: string | null;
  course: string;
  student: string;
};

export const STATUS_LABEL: Record<string, string> = {
  ENROLLED: "Enrolled",
  COMPLETED: "Completed",
  DROPPED: "Dropped",
};

const inputClass =
  "mt-1 h-9 w-full border border-slate-300 px-3 text-sm font-normal outline-none focus:border-blue-600";
const buttonClass =
  "h-9 bg-blue-800 px-4 text-xs font-semibold text-white hover:bg-blue-900 disabled:opacity-50";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="text-xs font-semibold text-slate-600">
      {label}
      {children}
    </label>
  );
}

function Messages({ error, success }: { error: string; success: string }) {
  return (
    <>
      {error && (
        <p className="mt-3 border border-red-200 bg-red-50 p-2.5 text-xs text-red-800">
          {error}
        </p>
      )}
      {success && (
        <p className="mt-3 border border-emerald-200 bg-emerald-50 p-2.5 text-xs text-emerald-800">
          {success}
        </p>
      )}
    </>
  );
}

/* --------------------------------- courses --------------------------------- */

export function InstituteCourses() {
  const [courses, setCourses] = useState<ShortCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [weeks, setWeeks] = useState("8");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    setLoading(true);

    try {
      setCourses(await apiRequest<ShortCourse[]>("/institute/courses"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load courses.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  function reset() {
    setEditingId(null);
    setTitle("");
    setCode("");
    setWeeks("8");
    setDescription("");
    setIsActive(true);
  }

  function startEdit(course: ShortCourse) {
    setEditingId(course.id);
    setTitle(course.title);
    setCode(course.code);
    setWeeks(String(course.durationWeeks));
    setDescription(course.description ?? "");
    setIsActive(course.isActive);
    setError("");
    setSuccess("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      if (editingId) {
        await apiRequest(`/institute/courses/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify({
            title,
            durationWeeks: Number(weeks),
            description,
            isActive,
          }),
        });
        setSuccess("Course updated.");
      } else {
        await apiRequest("/institute/courses", {
          method: "POST",
          body: JSON.stringify({
            title,
            code,
            durationWeeks: Number(weeks),
            description,
          }),
        });
        setSuccess("Course created.");
      }

      reset();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the course.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <form onSubmit={submit} className="border border-slate-200 bg-white p-4">
        <h3 className="mb-3 text-sm font-bold text-slate-900">
          {editingId ? "Edit course" : "New short course"}
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Course title *">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              maxLength={160}
              placeholder="Full-Stack Web Development"
              className={inputClass}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Code">
              <input
                value={code}
                onChange={(event) => setCode(event.target.value)}
                disabled={Boolean(editingId)}
                maxLength={30}
                placeholder="FSWD"
                className={`${inputClass} disabled:bg-slate-100`}
              />
            </Field>
            <Field label="Weeks *">
              <input
                type="number"
                min={1}
                max={208}
                value={weeks}
                onChange={(event) => setWeeks(event.target.value)}
                required
                className={inputClass}
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Description">
              <input
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                maxLength={500}
                className={inputClass}
              />
            </Field>
          </div>
          {editingId && (
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(event) => setIsActive(event.target.checked)}
              />
              Course is active (open for new students)
            </label>
          )}
        </div>
        <div className="mt-4 flex gap-2">
          <button type="submit" disabled={saving} className={buttonClass}>
            {saving ? "Saving..." : editingId ? "Save changes" : "Create course"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={reset}
              className="h-9 border border-slate-300 px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
          )}
        </div>
        <Messages error={error} success={success} />
      </form>

      <section className="border border-slate-200 bg-white">
        <div className="border-b border-slate-100 p-3 text-sm font-bold text-slate-900">
          Courses ({courses.length})
        </div>
        {courses.length === 0 ? (
          <p className="p-4 text-sm text-slate-500">
            {loading ? "Loading..." : "No courses yet."}
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {courses.map((course) => (
              <li
                key={course.id}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-semibold text-slate-900">
                    {course.title}{" "}
                    <span className="text-xs font-normal text-slate-500">
                      {course.code}
                      {course.isActive ? "" : " · inactive"}
                    </span>
                  </p>
                  <p className="text-xs text-slate-500">
                    {course.durationWeeks} weeks · {course.enrolled} learning ·{" "}
                    {course.completed} completed
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => startEdit(course)}
                  className="h-8 border border-slate-300 px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Edit
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

/* ------------------------------- enrollments ------------------------------- */

export function InstituteEnrollments() {
  const [courses, setCourses] = useState<ShortCourse[]>([]);
  const [students, setStudents] = useState<{ id: string; name: string; brxUid: string }[]>([]);
  const [courseId, setCourseId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [rows, setRows] = useState<Enrollment[]>([]);
  const [grades, setGrades] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    Promise.all([
      apiRequest<ShortCourse[]>("/institute/courses"),
      apiRequest<{ students: { id: string; name: string; brxUid: string }[] }>(
        "/institute/people-options",
      ),
    ])
      .then(([courseList, people]) => {
        setCourses(courseList);
        setStudents(people.students);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Could not load the lists."),
      );
  }, []);

  const loadRows = useCallback(async (id: string) => {
    if (!id) {
      setRows([]);
      return;
    }

    try {
      setRows(await apiRequest<Enrollment[]>(`/institute/enrollments?courseId=${id}`));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load students.");
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadRows(courseId), 0);
    return () => window.clearTimeout(timer);
  }, [courseId, loadRows]);

  async function run(action: () => Promise<unknown>, message: string) {
    setBusy(true);
    setError("");
    setSuccess("");

    try {
      await action();
      setSuccess(message);
      await loadRows(courseId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  function enroll(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void run(
      () =>
        apiRequest("/institute/enrollments", {
          method: "POST",
          body: JSON.stringify({ courseId, studentId }),
        }),
      "Student added to the course.",
    ).then(() => setStudentId(""));
  }

  function setStatus(row: Enrollment, status: string) {
    void run(
      () =>
        apiRequest(`/institute/enrollments/${row.id}`, {
          method: "PATCH",
          body: JSON.stringify({ status, grade: grades[row.id] ?? row.grade ?? "" }),
        }),
      `${row.studentName}: ${STATUS_LABEL[status].toLowerCase()}.`,
    );
  }

  const enrolledIds = new Set(rows.map((row) => row.brxUid));

  return (
    <div className="space-y-5">
      <form onSubmit={enroll} className="border border-slate-200 bg-white p-4">
        <h3 className="mb-3 text-sm font-bold text-slate-900">Add a student to a course</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Course *">
            <select
              value={courseId}
              onChange={(event) => setCourseId(event.target.value)}
              required
              className={inputClass}
            >
              <option value="">Choose a course</option>
              {courses
                .filter((course) => course.isActive)
                .map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
            </select>
          </Field>
          <Field label="Student *">
            <select
              value={studentId}
              onChange={(event) => setStudentId(event.target.value)}
              required
              className={inputClass}
            >
              <option value="">Choose a student</option>
              {students
                .filter((student) => !enrolledIds.has(student.brxUid))
                .map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name} ({student.brxUid})
                  </option>
                ))}
            </select>
          </Field>
        </div>
        <button type="submit" disabled={busy} className={`mt-4 ${buttonClass}`}>
          Add student
        </button>
        <Messages error={error} success={success} />
      </form>

      {courseId && (
        <section className="border border-slate-200 bg-white">
          <div className="border-b border-slate-100 p-3 text-sm font-bold text-slate-900">
            Students in this course ({rows.length})
          </div>
          {rows.length === 0 ? (
            <p className="p-4 text-sm text-slate-500">No students yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {rows.map((row) => (
                <li
                  key={row.id}
                  className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm"
                >
                  <p>
                    <span className="font-semibold text-slate-800">{row.studentName}</span>{" "}
                    <span className="text-xs text-slate-500">
                      {row.brxUid} · {STATUS_LABEL[row.status]}
                      {row.grade ? ` · grade ${row.grade}` : ""}
                    </span>
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {row.status !== "COMPLETED" && (
                      <>
                        <input
                          value={grades[row.id] ?? ""}
                          onChange={(event) =>
                            setGrades({ ...grades, [row.id]: event.target.value })
                          }
                          placeholder="Grade"
                          maxLength={20}
                          className="h-8 w-20 border border-slate-300 px-2 text-xs outline-none focus:border-blue-600"
                        />
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => setStatus(row, "COMPLETED")}
                          className="h-8 bg-emerald-700 px-2.5 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
                        >
                          Mark completed
                        </button>
                      </>
                    )}
                    {row.status === "ENROLLED" && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setStatus(row, "DROPPED")}
                        className="h-8 border border-slate-300 px-2.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                      >
                        Drop
                      </button>
                    )}
                    {row.status === "DROPPED" && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setStatus(row, "ENROLLED")}
                        className="h-8 border border-slate-300 px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                      >
                        Re-enroll
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}

/* ------------------------------- certificates ------------------------------- */

export function InstituteCertificates() {
  const [ready, setReady] = useState<Enrollment[]>([]);
  const [issued, setIssued] = useState<CertificateRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    try {
      const [enrollments, certificates] = await Promise.all([
        apiRequest<Enrollment[]>("/institute/enrollments"),
        apiRequest<CertificateRow[]>("/institute/certificates"),
      ]);
      setReady(
        enrollments.filter((row) => row.status === "COMPLETED" && !row.certificateNo),
      );
      setIssued(certificates);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load certificates.");
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function issue(row: Enrollment) {
    setBusy(true);
    setError("");
    setSuccess("");

    try {
      const result = await apiRequest<{ certificateNo: string }>(
        `/institute/enrollments/${row.id}/certificate`,
        { method: "POST" },
      );
      setSuccess(`Certificate ${result.certificateNo} issued to ${row.studentName}.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not issue the certificate.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <Messages error={error} success={success} />

      <section className="border border-slate-200 bg-white">
        <div className="border-b border-slate-100 p-3 text-sm font-bold text-slate-900">
          Ready to issue ({ready.length})
        </div>
        {ready.length === 0 ? (
          <p className="p-4 text-sm text-slate-500">
            No completed course is waiting. Mark a student completed first.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {ready.map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm"
              >
                <p>
                  <span className="font-semibold text-slate-800">{row.studentName}</span>{" "}
                  <span className="text-xs text-slate-500">{row.courseTitle}</span>
                </p>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void issue(row)}
                  className="h-8 bg-blue-800 px-3 text-xs font-semibold text-white hover:bg-blue-900 disabled:opacity-50"
                >
                  Issue certificate
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="border border-slate-200 bg-white">
        <div className="border-b border-slate-100 p-3 text-sm font-bold text-slate-900">
          Issued ({issued.length})
        </div>
        {issued.length === 0 ? (
          <p className="p-4 text-sm text-slate-500">No certificates issued yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {issued.map((item) => (
              <li
                key={item.certificateNo}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm"
              >
                <p>
                  <span className="font-semibold text-slate-800">{item.student}</span>{" "}
                  <span className="text-xs text-slate-500">
                    {item.course} · {item.certificateNo}
                  </span>
                </p>
                <Link
                  href={`/verify/${item.certificateNo}`}
                  target="_blank"
                  className="text-xs font-semibold text-blue-800 underline"
                >
                  View / print
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
