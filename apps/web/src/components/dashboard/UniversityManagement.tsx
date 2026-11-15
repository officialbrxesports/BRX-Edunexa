"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Pencil } from "lucide-react";
import { apiRequest } from "../../lib/api";

type Faculty = {
  id: string;
  name: string;
  code: string;
  deanId: string | null;
  deanName: string | null;
  departmentCount: number;
};

type ProgramOption = { id: string; name: string; code: string };
type CourseOption = {
  id: string;
  title: string;
  code: string;
  semester: number;
  credits: number;
};

type Sheet = {
  course: { id: string; title: string; code: string; credits: number; semester: number };
  students: {
    id: string;
    name: string;
    brxUid: string;
    semester: number;
    marks: number | null;
    grade: string | null;
  }[];
};

const inputClass =
  "mt-1 h-9 w-full border border-slate-300 px-3 text-sm font-normal outline-none focus:border-blue-600";
const buttonClass =
  "h-9 bg-blue-800 px-4 text-xs font-semibold text-white hover:bg-blue-900 disabled:opacity-50";

/* -------------------------------- faculties -------------------------------- */

export function FacultyManagement() {
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [teachers, setTeachers] = useState<{ id: string; name: string; brxUid: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [deanId, setDeanId] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    setLoading(true);

    try {
      setFaculties(await apiRequest<Faculty[]>("/college/faculties"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load faculties.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    apiRequest<{ teachers: { id: string; name: string; brxUid: string }[] }>(
      "/college/people-options",
    )
      .then((options) => setTeachers(options.teachers))
      .catch(() => undefined);
  }, []);

  function reset() {
    setEditingId(null);
    setName("");
    setCode("");
    setDeanId("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      if (editingId) {
        await apiRequest(`/college/faculties/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify({ name, deanId: deanId || null }),
        });
        setSuccess("Faculty updated.");
      } else {
        await apiRequest("/college/faculties", {
          method: "POST",
          body: JSON.stringify({ name, code, deanId: deanId || null }),
        });
        setSuccess("Faculty created.");
      }

      reset();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the faculty.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <form onSubmit={submit} className="border border-slate-200 bg-white p-4">
        <h3 className="mb-3 text-sm font-bold text-slate-900">
          {editingId ? "Edit faculty" : "New faculty"}
        </h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-xs font-semibold text-slate-600">
            Name *
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              maxLength={120}
              placeholder="Faculty of Engineering"
              className={inputClass}
            />
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Code
            <input
              value={code}
              onChange={(event) => setCode(event.target.value)}
              disabled={Boolean(editingId)}
              maxLength={30}
              placeholder="ENG"
              className={`${inputClass} disabled:bg-slate-100`}
            />
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Dean
            <select
              value={deanId}
              onChange={(event) => setDeanId(event.target.value)}
              className={inputClass}
            >
              <option value="">Not assigned</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.name} ({teacher.brxUid})
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-4 flex gap-2">
          <button type="submit" disabled={saving} className={buttonClass}>
            {saving ? "Saving..." : editingId ? "Save changes" : "Create faculty"}
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
      </form>

      <section className="border border-slate-200 bg-white">
        <div className="border-b border-slate-100 p-3 text-sm font-bold text-slate-900">
          Faculties ({faculties.length})
        </div>
        {faculties.length === 0 ? (
          <p className="p-4 text-sm text-slate-500">
            {loading ? "Loading..." : "No faculties yet."}
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {faculties.map((faculty) => (
              <li
                key={faculty.id}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-semibold text-slate-900">
                    {faculty.name}{" "}
                    <span className="text-xs font-normal text-slate-500">{faculty.code}</span>
                  </p>
                  <p className="text-xs text-slate-500">
                    Dean: {faculty.deanName ?? "not assigned"} · {faculty.departmentCount}{" "}
                    department(s)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(faculty.id);
                    setName(faculty.name);
                    setCode(faculty.code);
                    setDeanId(faculty.deanId ?? "");
                    setError("");
                    setSuccess("");
                  }}
                  className="flex h-8 items-center gap-1.5 border border-slate-300 px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <Pencil size={13} />
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

/* --------------------------------- results --------------------------------- */

export function ResultsManagement() {
  const [programs, setPrograms] = useState<ProgramOption[]>([]);
  const [programId, setProgramId] = useState("");
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [courseId, setCourseId] = useState("");
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [marks, setMarks] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    apiRequest<ProgramOption[]>("/college/programs")
      .then(setPrograms)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Could not load programs."),
      );
  }, []);

  useEffect(() => {
    let cancelled = false;

    const timer = window.setTimeout(() => {
      setCourseId("");
      setSheet(null);

      if (!programId) {
        setCourses([]);
        return;
      }

      apiRequest<CourseOption[]>(`/college/courses?programId=${programId}`)
        .then((list) => {
          if (!cancelled) setCourses(list);
        })
        .catch(() => undefined);
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [programId]);

  const loadSheet = useCallback(async (id: string) => {
    setSheet(null);
    setSuccess("");
    setError("");

    if (!id) return;

    try {
      const data = await apiRequest<Sheet>(`/college/results/sheet?courseId=${id}`);
      setSheet(data);
      setMarks(
        Object.fromEntries(
          data.students.map((student) => [
            student.id,
            student.marks === null ? "" : String(student.marks),
          ]),
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open the marks sheet.");
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadSheet(courseId), 0);
    return () => window.clearTimeout(timer);
  }, [courseId, loadSheet]);

  async function save() {
    if (!sheet) return;
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await apiRequest("/college/results", {
        method: "PUT",
        body: JSON.stringify({
          courseId: sheet.course.id,
          results: sheet.students.map((student) => ({
            studentId: student.id,
            marks: marks[student.id] ?? "",
          })),
        }),
      });
      setSuccess("Results saved.");
      await loadSheet(sheet.course.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save results.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 border border-slate-200 bg-white p-4 sm:grid-cols-2">
        <label className="text-xs font-semibold text-slate-600">
          Program
          <select
            value={programId}
            onChange={(event) => setProgramId(event.target.value)}
            className={inputClass}
          >
            <option value="">Choose a program</option>
            {programs.map((program) => (
              <option key={program.id} value={program.id}>
                {program.name} ({program.code})
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold text-slate-600">
          Course
          <select
            value={courseId}
            onChange={(event) => setCourseId(event.target.value)}
            disabled={!programId}
            className={`${inputClass} disabled:bg-slate-100`}
          >
            <option value="">Choose a course</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                Sem {course.semester} · {course.title} ({course.code})
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && (
        <p className="border border-red-200 bg-red-50 p-2.5 text-xs text-red-800">{error}</p>
      )}
      {success && (
        <p className="border border-emerald-200 bg-emerald-50 p-2.5 text-xs text-emerald-800">
          {success}
        </p>
      )}

      {sheet && (
        <section className="border border-slate-200 bg-white">
          <div className="border-b border-slate-100 p-3">
            <h3 className="text-sm font-bold text-slate-900">
              {sheet.course.title}{" "}
              <span className="text-xs font-normal text-slate-500">
                {sheet.course.code} · Semester {sheet.course.semester} · {sheet.course.credits}{" "}
                credits · marks out of 100
              </span>
            </h3>
          </div>
          {sheet.students.length === 0 ? (
            <p className="p-4 text-sm text-slate-500">
              No student has reached this semester in this program yet.
            </p>
          ) : (
            <>
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-slate-50 text-left text-xs text-slate-600">
                    <tr>
                      <th className="px-3 py-2">Student</th>
                      <th className="w-20 px-3 py-2">Sem</th>
                      <th className="w-28 px-3 py-2">Marks</th>
                      <th className="w-16 px-3 py-2">Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sheet.students.map((student) => (
                      <tr key={student.id}>
                        <td className="px-3 py-1.5">
                          <span className="font-semibold text-slate-800">{student.name}</span>{" "}
                          <span className="text-xs text-slate-500">{student.brxUid}</span>
                        </td>
                        <td className="px-3 py-1.5 text-slate-600">{student.semester}</td>
                        <td className="px-3 py-1.5">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            step="0.25"
                            value={marks[student.id] ?? ""}
                            onChange={(event) =>
                              setMarks({ ...marks, [student.id]: event.target.value })
                            }
                            className="h-8 w-full border border-slate-300 px-2 text-sm outline-none focus:border-blue-600"
                          />
                        </td>
                        <td className="px-3 py-1.5 font-semibold text-slate-800">
                          {student.grade ?? "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="border-t border-slate-100 p-3">
                <button
                  type="button"
                  onClick={() => void save()}
                  disabled={saving}
                  className={buttonClass}
                >
                  {saving ? "Saving..." : "Save results"}
                </button>
                <span className="ml-3 text-xs text-slate-500">
                  Grade: 90+ O, 80+ A+, 70+ A, 60+ B+, 50+ B, 45+ C, 40+ P, below 40 F.
                </span>
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}
