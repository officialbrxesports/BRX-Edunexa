"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Pencil } from "lucide-react";
import { apiRequest } from "../../lib/api";

export type Department = {
  id: string;
  name: string;
  code: string;
  hodId: string | null;
  hodName: string | null;
  facultyId: string | null;
  facultyName: string | null;
  programCount: number;
};

export type Program = {
  id: string;
  name: string;
  code: string;
  semesters: number;
  isActive: boolean;
  departmentId: string;
  departmentName: string;
  studentCount: number;
  courseCount: number;
  totalCredits: number;
};

type Course = {
  id: string;
  programId: string;
  semester: number;
  code: string;
  title: string;
  credits: number;
  program: { name: string };
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

function useLoader<T>(path: string) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);

    try {
      setData(await apiRequest<T[]>(path));
      setLoadError("");
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Could not load the list.");
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  return { data, loading, loadError, load };
}

/* ------------------------------- departments ------------------------------- */

export function DepartmentManagement({ withFaculty = false }: { withFaculty?: boolean }) {
  const { data, loading, loadError, load } = useLoader<Department>("/college/departments");
  const [faculties, setFaculties] = useState<{ id: string; name: string }[]>([]);
  const [facultyId, setFacultyId] = useState("");
  const [teachers, setTeachers] = useState<{ id: string; name: string; brxUid: string }[]>([]);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [hodId, setHodId] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    apiRequest<{ teachers: { id: string; name: string; brxUid: string }[] }>(
      "/college/people-options",
    )
      .then((options) => setTeachers(options.teachers))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!withFaculty) return;

    apiRequest<{ id: string; name: string }[]>("/college/faculties")
      .then(setFaculties)
      .catch(() => undefined);
  }, [withFaculty]);

  function reset() {
    setEditingId(null);
    setName("");
    setCode("");
    setHodId("");
    setFacultyId("");
  }

  function startEdit(department: Department) {
    setEditingId(department.id);
    setName(department.name);
    setCode(department.code);
    setHodId(department.hodId ?? "");
    setFacultyId(department.facultyId ?? "");
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
        await apiRequest(`/college/departments/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify({
            name,
            hodId: hodId || null,
            ...(withFaculty ? { facultyId: facultyId || null } : {}),
          }),
        });
        setSuccess("Department updated.");
      } else {
        await apiRequest("/college/departments", {
          method: "POST",
          body: JSON.stringify({
            name,
            code,
            hodId: hodId || null,
            ...(withFaculty ? { facultyId: facultyId || null } : {}),
          }),
        });
        setSuccess("Department created.");
      }

      reset();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the department.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <form onSubmit={submit} className="border border-slate-200 bg-white p-4">
        <h3 className="mb-3 text-sm font-bold text-slate-900">
          {editingId ? "Edit department" : "New department"}
        </h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Name *">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              maxLength={120}
              placeholder="Computer Science"
              className={inputClass}
            />
          </Field>
          <Field label="Code">
            <input
              value={code}
              onChange={(event) => setCode(event.target.value)}
              disabled={Boolean(editingId)}
              maxLength={30}
              placeholder="CSE"
              className={`${inputClass} disabled:bg-slate-100`}
            />
          </Field>
          <Field label="Head of department">
            <select
              value={hodId}
              onChange={(event) => setHodId(event.target.value)}
              className={inputClass}
            >
              <option value="">Not assigned</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.name} ({teacher.brxUid})
                </option>
              ))}
            </select>
          </Field>
          {withFaculty && (
            <Field label="Faculty">
              <select
                value={facultyId}
                onChange={(event) => setFacultyId(event.target.value)}
                className={inputClass}
              >
                <option value="">No faculty</option>
                {faculties.map((faculty) => (
                  <option key={faculty.id} value={faculty.id}>
                    {faculty.name}
                  </option>
                ))}
              </select>
            </Field>
          )}
        </div>
        <div className="mt-4 flex gap-2">
          <button type="submit" disabled={saving} className={buttonClass}>
            {saving ? "Saving..." : editingId ? "Save changes" : "Create department"}
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
        <Messages error={error || loadError} success={success} />
      </form>

      <section className="border border-slate-200 bg-white">
        <div className="border-b border-slate-100 p-3 text-sm font-bold text-slate-900">
          Departments ({data.length})
        </div>
        {data.length === 0 ? (
          <p className="p-4 text-sm text-slate-500">
            {loading ? "Loading..." : "No departments yet."}
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {data.map((department) => (
              <li
                key={department.id}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-semibold text-slate-900">
                    {department.name}{" "}
                    <span className="text-xs font-normal text-slate-500">
                      {department.code}
                    </span>
                  </p>
                  <p className="text-xs text-slate-500">
                    {department.facultyName ? `${department.facultyName} · ` : ""}HOD:{" "}
                    {department.hodName ?? "not assigned"} · {department.programCount}{" "}
                    program(s)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => startEdit(department)}
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

/* --------------------------------- programs --------------------------------- */

export function ProgramManagement() {
  const { data, loading, loadError, load } = useLoader<Program>("/college/programs");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [departmentId, setDepartmentId] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [semesters, setSemesters] = useState("8");
  const [isActive, setIsActive] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    apiRequest<Department[]>("/college/departments")
      .then(setDepartments)
      .catch(() => undefined);
  }, []);

  function reset() {
    setEditingId(null);
    setName("");
    setCode("");
    setSemesters("8");
    setIsActive(true);
  }

  function startEdit(program: Program) {
    setEditingId(program.id);
    setName(program.name);
    setCode(program.code);
    setSemesters(String(program.semesters));
    setIsActive(program.isActive);
    setDepartmentId(program.departmentId);
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
        await apiRequest(`/college/programs/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify({ name, semesters: Number(semesters), isActive }),
        });
        setSuccess("Program updated.");
      } else {
        await apiRequest("/college/programs", {
          method: "POST",
          body: JSON.stringify({
            departmentId,
            name,
            code,
            semesters: Number(semesters),
          }),
        });
        setSuccess("Program created.");
      }

      reset();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the program.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <form onSubmit={submit} className="border border-slate-200 bg-white p-4">
        <h3 className="mb-3 text-sm font-bold text-slate-900">
          {editingId ? "Edit program" : "New program"}
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Department *">
            <select
              value={departmentId}
              onChange={(event) => setDepartmentId(event.target.value)}
              disabled={Boolean(editingId)}
              required
              className={`${inputClass} disabled:bg-slate-100`}
            >
              <option value="">Choose a department</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Program name *">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              maxLength={120}
              placeholder="B.Tech Computer Science"
              className={inputClass}
            />
          </Field>
          <Field label="Code">
            <input
              value={code}
              onChange={(event) => setCode(event.target.value)}
              disabled={Boolean(editingId)}
              maxLength={30}
              placeholder="BTECH-CSE"
              className={`${inputClass} disabled:bg-slate-100`}
            />
          </Field>
          <Field label="Number of semesters *">
            <input
              type="number"
              min={1}
              max={12}
              value={semesters}
              onChange={(event) => setSemesters(event.target.value)}
              required
              className={inputClass}
            />
          </Field>
          {editingId && (
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(event) => setIsActive(event.target.checked)}
              />
              Program is active
            </label>
          )}
        </div>
        <div className="mt-4 flex gap-2">
          <button type="submit" disabled={saving} className={buttonClass}>
            {saving ? "Saving..." : editingId ? "Save changes" : "Create program"}
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
        <Messages error={error || loadError} success={success} />
      </form>

      <section className="border border-slate-200 bg-white">
        <div className="border-b border-slate-100 p-3 text-sm font-bold text-slate-900">
          Programs ({data.length})
        </div>
        {data.length === 0 ? (
          <p className="p-4 text-sm text-slate-500">
            {loading ? "Loading..." : "No programs yet. Create a department first."}
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {data.map((program) => (
              <li
                key={program.id}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-semibold text-slate-900">
                    {program.name}{" "}
                    <span className="text-xs font-normal text-slate-500">
                      {program.code}
                      {program.isActive ? "" : " · inactive"}
                    </span>
                  </p>
                  <p className="text-xs text-slate-500">
                    {program.departmentName} · {program.semesters} semesters ·{" "}
                    {program.studentCount} students · {program.courseCount} courses
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => startEdit(program)}
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

/* ---------------------------------- courses ---------------------------------- */

export function CourseManagement() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [programId, setProgramId] = useState("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [semester, setSemester] = useState("1");
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [credits, setCredits] = useState("3");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const selected = programs.find((program) => program.id === programId);

  useEffect(() => {
    apiRequest<Program[]>("/college/programs")
      .then(setPrograms)
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load programs."));
  }, []);

  const loadCourses = useCallback(async (id: string) => {
    if (!id) {
      setCourses([]);
      return;
    }

    try {
      setCourses(await apiRequest<Course[]>(`/college/courses?programId=${id}`));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load courses.");
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadCourses(programId), 0);
    return () => window.clearTimeout(timer);
  }, [programId, loadCourses]);

  function reset() {
    setEditingId(null);
    setCode("");
    setTitle("");
    setCredits("3");
  }

  function startEdit(course: Course) {
    setEditingId(course.id);
    setSemester(String(course.semester));
    setCode(course.code);
    setTitle(course.title);
    setCredits(String(course.credits));
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
        await apiRequest(`/college/courses/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify({
            title,
            semester: Number(semester),
            credits: Number(credits),
          }),
        });
        setSuccess("Course updated.");
      } else {
        await apiRequest("/college/courses", {
          method: "POST",
          body: JSON.stringify({
            programId,
            semester: Number(semester),
            code,
            title,
            credits: Number(credits),
          }),
        });
        setSuccess("Course added.");
      }

      reset();
      await loadCourses(programId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the course.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(course: Course) {
    if (!window.confirm(`Delete course "${course.title}"?`)) return;
    setError("");
    setSuccess("");

    try {
      await apiRequest(`/college/courses/${course.id}`, { method: "DELETE" });
      setSuccess("Course deleted.");
      await loadCourses(programId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the course.");
    }
  }

  const grouped = courses.reduce<Record<number, Course[]>>((acc, course) => {
    (acc[course.semester] ??= []).push(course);
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      <form onSubmit={submit} className="border border-slate-200 bg-white p-4">
        <h3 className="mb-3 text-sm font-bold text-slate-900">
          {editingId ? "Edit course" : "Add course to a program"}
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Program *">
            <select
              value={programId}
              onChange={(event) => {
                setProgramId(event.target.value);
                reset();
              }}
              required
              className={inputClass}
            >
              <option value="">Choose a program</option>
              {programs.map((program) => (
                <option key={program.id} value={program.id}>
                  {program.name} ({program.code})
                </option>
              ))}
            </select>
          </Field>
          <Field label="Semester *">
            <input
              type="number"
              min={1}
              max={selected?.semesters ?? 12}
              value={semester}
              onChange={(event) => setSemester(event.target.value)}
              required
              className={inputClass}
            />
          </Field>
          <Field label="Course title *">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              maxLength={160}
              placeholder="Data Structures"
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
                placeholder="CS201"
                className={`${inputClass} disabled:bg-slate-100`}
              />
            </Field>
            <Field label="Credits *">
              <input
                type="number"
                min={1}
                max={12}
                value={credits}
                onChange={(event) => setCredits(event.target.value)}
                required
                className={inputClass}
              />
            </Field>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <button type="submit" disabled={saving} className={buttonClass}>
            {saving ? "Saving..." : editingId ? "Save changes" : "Add course"}
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

      {programId && (
        <section className="border border-slate-200 bg-white">
          <div className="border-b border-slate-100 p-3 text-sm font-bold text-slate-900">
            Courses ({courses.length})
          </div>
          {courses.length === 0 ? (
            <p className="p-4 text-sm text-slate-500">No courses in this program yet.</p>
          ) : (
            Object.entries(grouped).map(([sem, list]) => (
              <div key={sem}>
                <p className="bg-slate-50 px-4 py-1.5 text-xs font-bold text-slate-600">
                  Semester {sem} · {list.reduce((sum, c) => sum + c.credits, 0)} credits
                </p>
                <ul className="divide-y divide-slate-100">
                  {list.map((course) => (
                    <li
                      key={course.id}
                      className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 text-sm"
                    >
                      <p>
                        <span className="font-semibold text-slate-900">{course.title}</span>{" "}
                        <span className="text-xs text-slate-500">
                          {course.code} · {course.credits} cr
                        </span>
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(course)}
                          className="h-8 border border-slate-300 px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => void remove(course)}
                          className="h-8 border border-slate-300 px-2.5 text-xs font-semibold text-red-700 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </section>
      )}
    </div>
  );
}
