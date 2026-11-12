
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  BookOpen,
  Plus,
  Search,
  Pencil,
  RefreshCw,
  UserPlus,
  X,
  Save,
  Users,
  Sparkles,
  Trash2,
  Power,
  GraduationCap,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

type Section = {
  id: string;
  name: string;
  code?: string;
};

type ClassItem = {
  id: string;
  name: string;
  code: string;
  sections?: Section[];
};

type Teacher = {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email: string;
};

type SubjectClass = {
  classId?: string;
  classes?: ClassItem;
};

type SubjectTeacher = {
  id: string;
  classId: string;
  sectionId?: string | null;
  teacherId: string;
  weeklyPeriods: number;
  theoryPeriods: number;
  practicalPeriods: number;
  classes?: ClassItem;
  sections?: Section;
  users?: Teacher;
};

type Subject = {
  id: string;
  name: string;
  code: string;
  type: "CORE" | "OPTIONAL" | "ADDITIONAL";
  category: "THEORY" | "PRACTICAL" | "BOTH";
  description?: string | null;
  isActive: boolean;
  class_subjects?: SubjectClass[];
  subject_teachers?: SubjectTeacher[];
};

type SubjectForm = {
  name: string;
  type: Subject["type"];
  category: Subject["category"];
  description: string;
  classIds: string[];
};

type TeacherForm = {
  classId: string;
  sectionId: string;
  teacherId: string;
  weeklyPeriods: number;
  theoryPeriods: number;
  practicalPeriods: number;
};

const emptySubjectForm: SubjectForm = {
  name: "",
  type: "CORE",
  category: "THEORY",
  description: "",
  classIds: [],
};

const emptyTeacherForm: TeacherForm = {
  classId: "",
  sectionId: "",
  teacherId: "",
  weeklyPeriods: 6,
  theoryPeriods: 6,
  practicalPeriods: 0,
};

async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const text = await response.text();
  let result: unknown = null;

  try {
    result = text ? JSON.parse(text) : null;
  } catch {
    result = text;
  }

  if (!response.ok) {
    throw new Error(getErrorMessage(result, `Request failed (${response.status})`));
  }

  return result as T;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getErrorMessage(value: unknown, fallback: string): string {
  if (!isRecord(value)) return fallback;

  const message = value.message ?? value.error;

  if (Array.isArray(message)) {
    return message.map(String).join(", ");
  }

  return typeof message === "string" ? message : fallback;
}

function getArray<T>(result: unknown): T[] {
  if (Array.isArray(result)) return result as T[];

  if (isRecord(result)) {
    if (Array.isArray(result.data)) return result.data as T[];
    if (Array.isArray(result.items)) return result.items as T[];
  }

  return [];
}

function teacherName(teacher?: Teacher) {
  if (!teacher) return "Teacher";

  return (
    teacher.name ||
    `${teacher.firstName || ""} ${teacher.lastName || ""}`.trim() ||
    teacher.email
  );
}

function getClassIds(subject: Subject) {
  return (subject.class_subjects || [])
    .map((item) => item.classes?.id || item.classId)
    .filter((id): id is string => Boolean(id));
}

function getCodePrefix(name: string) {
  const words = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .match(/[a-zA-Z]+/g);

  if (!words?.length) return "SUBJ";

  return words[0].slice(0, 4).toUpperCase();
}

function previewSubjectCode(name: string, subjects: Subject[]) {
  const prefix = getCodePrefix(name);

  const existing = new Set(
    subjects.map((subject) => subject.code.trim().toUpperCase()),
  );

  let number = 1;
  let code = `${prefix}${String(number).padStart(3, "0")}`;

  while (existing.has(code)) {
    number += 1;
    code = `${prefix}${String(number).padStart(3, "0")}`;
  }

  return code;
}

export default function SubjectManagement() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [subjectModal, setSubjectModal] = useState(false);
  const [teacherModal, setTeacherModal] = useState(false);

  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [assigningSubject, setAssigningSubject] = useState<Subject | null>(null);

  const [editingAssignment, setEditingAssignment] =
    useState<SubjectTeacher | null>(null);

  const [form, setForm] = useState<SubjectForm>(emptySubjectForm);
  const [teacherForm, setTeacherForm] =
    useState<TeacherForm>(emptyTeacherForm);

  const generatedCode = useMemo(() => {
    if (editingSubject) return editingSubject.code;
    if (!form.name.trim()) return "";
    return previewSubjectCode(form.name, subjects);
  }, [form.name, subjects, editingSubject]);

  const loadData = useCallback(async () => {
  try {
    const [subjectResult, classResult, teacherResult] = await Promise.all([
      apiRequest<unknown>("/academics/subjects"),
      apiRequest<unknown>("/academics/subjects/classes"),
      apiRequest<unknown>("/academics/subjects/teachers"),
    ]);

    setSubjects(getArray<Subject>(subjectResult));
    setClasses(getArray<ClassItem>(classResult));
    setTeachers(getArray<Teacher>(teacherResult));
    setError("");
  } catch (err) {
    setError(
      err instanceof Error ? err.message : "Unable to load subject data.",
    );
  } finally {
    setLoading(false);
  }
}, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filteredSubjects = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return subjects;

    return subjects.filter((subject) =>
      [
        subject.name,
        subject.code,
        subject.type,
        subject.category,
      ].some((value) => value.toLowerCase().includes(query)),
    );
  }, [subjects, search]);

  const activeCount = subjects.filter((item) => item.isActive).length;

  function openCreate() {
    setEditingSubject(null);
    setForm(emptySubjectForm);
    setError("");
    setMessage("");
    setSubjectModal(true);
  }

  function openEdit(subject: Subject) {
    setEditingSubject(subject);

    setForm({
      name: subject.name,
      type: subject.type,
      category: subject.category,
      description: subject.description || "",
      classIds: getClassIds(subject),
    });

    setError("");
    setMessage("");
    setSubjectModal(true);
  }

  function toggleClass(classId: string) {
    setForm((current) => ({
      ...current,
      classIds: current.classIds.includes(classId)
        ? current.classIds.filter((id) => id !== classId)
        : [...current.classIds, classId],
    }));
  }

  async function saveSubject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const name = form.name.trim();

      if (!name) throw new Error("Subject name is required.");

      if (editingSubject) {
        await apiRequest(
          `/academics/subjects/${editingSubject.id}`,
          {
            method: "PATCH",
            body: JSON.stringify({
              name,
              type: form.type,
              category: form.category,
              description: form.description.trim() || null,
            }),
          },
        );

        const previousClassIds = getClassIds(editingSubject);
        const newClassIds = form.classIds.filter(
          (id) => !previousClassIds.includes(id),
        );

        for (const classId of newClassIds) {
          await apiRequest(
            `/academics/subjects/${editingSubject.id}/classes`,
            {
              method: "POST",
              body: JSON.stringify({ classId }),
            },
          );
        }

        setMessage("Subject updated successfully.");
      } else {
        // Backend generates the final unique code.
        const result = await apiRequest<unknown>("/academics/subjects", {
          method: "POST",
          body: JSON.stringify({
            name,
            type: form.type,
            category: form.category,
            description: form.description.trim() || undefined,
            classIds: form.classIds,
          }),
        });

        let actualCode = generatedCode;

        if (isRecord(result)) {
          if (
            isRecord(result.subject) &&
            typeof result.subject.code === "string"
          ) {
            actualCode = result.subject.code;
          } else if (typeof result.code === "string") {
            actualCode = result.code;
          }
        }

        setMessage(`Subject created successfully. Code: ${actualCode}`);
      }

      setSubjectModal(false);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save subject.");
    } finally {
      setSaving(false);
    }
  }

  async function removeClass(subject: Subject, classId: string) {
    const confirmed = window.confirm(
      "Remove this subject from the selected class?",
    );

    if (!confirmed) return;

    setSaving(true);
    setError("");
    setMessage("");

    try {
      await apiRequest(
        `/academics/subjects/${subject.id}/classes/${classId}`,
        { method: "DELETE" },
      );

      setMessage("Subject removed from class.");
      await loadData();

      const updated = await apiRequest<Subject>(
        `/academics/subjects/${subject.id}`,
      );

      setEditingSubject(updated);
      setForm((current) => ({
        ...current,
        classIds: getClassIds(updated),
      }));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to remove class mapping.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleSubjectStatus(subject: Subject) {
    const nextStatus = !subject.isActive;

    const confirmed = window.confirm(
      `${nextStatus ? "Activate" : "Deactivate"} ${subject.name}?`,
    );

    if (!confirmed) return;

    setSaving(true);
    setError("");
    setMessage("");

    try {
      await apiRequest(`/academics/subjects/${subject.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: nextStatus }),
      });

      setMessage(
        nextStatus ? "Subject activated." : "Subject deactivated.",
      );

      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to update subject status.",
      );
    } finally {
      setSaving(false);
    }
  }

  function openTeacherAssignment(subject: Subject) {
    setAssigningSubject(subject);
    setEditingAssignment(null);
    setTeacherForm(emptyTeacherForm);
    setError("");
    setMessage("");
    setTeacherModal(true);
  }

  function openEditTeacher(
    subject: Subject,
    assignment: SubjectTeacher,
  ) {
    setAssigningSubject(subject);
    setEditingAssignment(assignment);

    setTeacherForm({
      classId: assignment.classId,
      sectionId: assignment.sectionId || "",
      teacherId: assignment.teacherId,
      weeklyPeriods: assignment.weeklyPeriods,
      theoryPeriods: assignment.theoryPeriods,
      practicalPeriods: assignment.practicalPeriods,
    });

    setError("");
    setMessage("");
    setTeacherModal(true);
  }

  const selectedClass = classes.find(
    (item) => item.id === teacherForm.classId,
  );

  async function saveTeacherAssignment(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!assigningSubject) return;

    setSaving(true);
    setError("");
    setMessage("");

    try {
      if (
        teacherForm.theoryPeriods + teacherForm.practicalPeriods !==
        teacherForm.weeklyPeriods
      ) {
        throw new Error(
          "Theory + Practical periods must equal Weekly Periods.",
        );
      }

      const payload = {
        classId: teacherForm.classId,
        sectionId: teacherForm.sectionId || undefined,
        teacherId: teacherForm.teacherId,
        weeklyPeriods: Number(teacherForm.weeklyPeriods),
        theoryPeriods: Number(teacherForm.theoryPeriods),
        practicalPeriods: Number(teacherForm.practicalPeriods),
      };

      if (editingAssignment) {
        await apiRequest(
          `/academics/subjects/${assigningSubject.id}/teachers/${editingAssignment.id}`,
          {
            method: "PATCH",
            body: JSON.stringify(payload),
          },
        );

        setMessage("Teacher assignment updated successfully.");
      } else {
        await apiRequest(
          `/academics/subjects/${assigningSubject.id}/teachers`,
          {
            method: "POST",
            body: JSON.stringify(payload),
          },
        );

        setMessage("Teacher assigned successfully.");
      }

      setTeacherModal(false);
      setEditingAssignment(null);
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to save teacher assignment.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function removeTeacherAssignment(
    subject: Subject,
    assignment: SubjectTeacher,
  ) {
    const confirmed = window.confirm(
      `Remove ${teacherName(assignment.users)} from ${subject.name}?`,
    );

    if (!confirmed) return;

    setSaving(true);
    setError("");
    setMessage("");

    try {
      await apiRequest(
        `/academics/subjects/${subject.id}/teachers/${assignment.id}`,
        { method: "DELETE" },
      );

      setMessage("Teacher assignment removed successfully.");
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to remove teacher.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* SUMMARY */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-500">
              Total Subjects
            </p>
            <BookOpen className="text-blue-700" size={22} />
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900">
            {subjects.length}
          </p>
        </div>

        <div className="border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-500">
              Active Subjects
            </p>
            <BookOpen className="text-emerald-700" size={22} />
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900">
            {activeCount}
          </p>
        </div>

        <div className="border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-500">
              Available Teachers
            </p>
            <Users className="text-violet-700" size={22} />
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900">
            {teachers.length}
          </p>
        </div>
      </div>

      {/* DIRECTORY */}
      <section className="border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-5">
          <div>
            <h3 className="font-bold text-slate-900">Subject Directory</h3>
            <p className="mt-1 text-xs text-slate-500">
              Manage subjects, classes and teacher assignments.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void loadData()}
              disabled={loading || saving}
              className="flex items-center gap-2 border border-slate-300 px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              <RefreshCw size={16} />
              Refresh
            </button>

            <button
              type="button"
              onClick={openCreate}
              className="flex items-center gap-2 bg-blue-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-900"
            >
              <Plus size={16} />
              Add Subject
            </button>
          </div>
        </div>

        <div className="border-b border-slate-100 p-4">
          <div className="relative max-w-md">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search subject name or code..."
              className="w-full border border-slate-300 py-3 pl-10 pr-3 text-sm outline-none focus:border-blue-600"
            />
          </div>
        </div>

        {error && !subjectModal && !teacherModal && (
          <div className="m-4 border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {message && !subjectModal && !teacherModal && (
          <div className="m-4 border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
            {message}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-max text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-4">Subject</th>
                <th className="px-5 py-4">Code</th>
                <th className="px-5 py-4">Type</th>
                <th className="px-5 py-4">Category</th>
                <th className="px-5 py-4">Classes</th>
                <th className="px-5 py-4">Teachers</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-500">
                    Loading subjects...
                  </td>
                </tr>
              ) : filteredSubjects.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-500">
                    No subjects found. Click Add Subject to create one.
                  </td>
                </tr>
              ) : (
                filteredSubjects.map((subject) => (
                  <tr key={subject.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4 font-semibold text-slate-900">
                      {subject.name}
                    </td>
                    <td className="px-5 py-4 font-medium text-slate-600">
                      {subject.code}
                    </td>
                    <td className="px-5 py-4">{subject.type}</td>
                    <td className="px-5 py-4">{subject.category}</td>
                    <td className="px-5 py-4">
                      {subject.class_subjects?.length || 0}
                    </td>
                    <td className="px-5 py-4">
                      {subject.subject_teachers?.length || 0}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`px-2.5 py-1 text-xs font-semibold ${
                          subject.isActive
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {subject.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          title="Manage teachers"
                          onClick={() => openTeacherAssignment(subject)}
                          className="border border-slate-200 p-2 text-emerald-700 hover:bg-emerald-50"
                        >
                          <UserPlus size={16} />
                        </button>

                        <button
                          type="button"
                          title="Edit subject and classes"
                          onClick={() => openEdit(subject)}
                          className="border border-slate-200 p-2 text-blue-700 hover:bg-blue-50"
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          type="button"
                          title={subject.isActive ? "Deactivate" : "Activate"}
                          disabled={saving}
                          onClick={() => void toggleSubjectStatus(subject)}
                          className="border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                        >
                          <Power size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* SUBJECT CREATE / EDIT MODAL */}
      {subjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="flex max-h-[92dvh] w-full max-w-2xl flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-5">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingSubject ? "Edit Subject" : "Create Subject"}
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Configure subject details and class mappings.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSubjectModal(false)}
                className="p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={saveSubject} className="flex min-h-0 flex-1 flex-col">
              <div className="flex-1 space-y-5 overflow-y-auto p-5">
                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Subject Name *
                  </label>
                  <input
                    required
                    maxLength={100}
                    value={form.name}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    placeholder="Example: Mathematics"
                    className="w-full border border-slate-300 px-3 py-3 text-sm outline-none focus:border-blue-600"
                  />
                </div>

                <div className="border border-blue-200 bg-blue-50 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-blue-900">
                    <Sparkles size={17} />
                    {editingSubject ? "Existing Subject Code" : "Automatic Subject Code"}
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <span className="font-mono text-xl font-bold tracking-wider text-blue-800">
                      {generatedCode || "CODE GENERATED AUTOMATICALLY"}
                    </span>
                    <span className="text-xs font-semibold text-blue-700">
                      {editingSubject ? "Unchanged" : "Preview"}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-blue-700">
                    The backend generates and verifies the final unique code when saving.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold">
                      Subject Type *
                    </label>
                    <select
                      value={form.type}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          type: event.target.value as Subject["type"],
                        }))
                      }
                      className="w-full border border-slate-300 bg-white px-3 py-3 text-sm"
                    >
                      <option value="CORE">Core</option>
                      <option value="OPTIONAL">Optional</option>
                      <option value="ADDITIONAL">Additional</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold">
                      Subject Category *
                    </label>
                    <select
                      value={form.category}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          category: event.target.value as Subject["category"],
                        }))
                      }
                      className="w-full border border-slate-300 bg-white px-3 py-3 text-sm"
                    >
                      <option value="THEORY">Theory</option>
                      <option value="PRACTICAL">Practical</option>
                      <option value="BOTH">Theory + Practical</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                    placeholder="Short subject description..."
                    className="w-full border border-slate-300 px-3 py-3 text-sm outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <label className="text-sm font-semibold">
                      Assign to Classes
                    </label>
                    <span className="text-xs text-slate-500">
                      {form.classIds.length} selected
                    </span>
                  </div>

                  {classes.length === 0 ? (
                    <p className="border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                      No classes found. Create a class first.
                    </p>
                  ) : (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {classes.map((item) => {
                        const alreadyAssigned =
                          editingSubject
                            ? getClassIds(editingSubject).includes(item.id)
                            : false;

                        return (
                          <label
                            key={item.id}
                            className="flex cursor-pointer items-center gap-3 border border-slate-200 p-3 hover:bg-slate-50"
                          >
                            <input
                              type="checkbox"
                              checked={form.classIds.includes(item.id)}
                              disabled={alreadyAssigned}
                              onChange={() => toggleClass(item.id)}
                              className="h-4 w-4 accent-blue-800"
                            />
                            <span>
                              <span className="block text-sm font-semibold text-slate-800">
                                {item.name}
                              </span>
                              <span className="text-xs text-slate-500">
                                {item.code}
                                {alreadyAssigned ? " · Already assigned" : ""}
                              </span>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                {editingSubject && (
                  <div className="border-t border-slate-200 pt-4">
                    <h4 className="mb-3 text-sm font-bold text-slate-900">
                      Current Class Assignments
                    </h4>

                    {getClassIds(editingSubject).length === 0 ? (
                      <p className="text-sm text-slate-500">
                        No classes assigned.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {editingSubject.class_subjects?.map((link) => {
                          const linkedClass = link.classes;
                          const classId = linkedClass?.id || link.classId;

                          if (!classId) return null;

                          return (
                            <div
                              key={classId}
                              className="flex items-center justify-between gap-3 border border-slate-200 p-3"
                            >
                              <span className="text-sm font-medium text-slate-800">
                                {linkedClass?.name || "Assigned class"}
                              </span>
                              <button
                                type="button"
                                disabled={saving}
                                onClick={() =>
                                  void removeClass(editingSubject, classId)
                                }
                                className="flex items-center gap-1 text-xs font-semibold text-red-700 hover:text-red-900 disabled:opacity-50"
                              >
                                <Trash2 size={14} />
                                Remove
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <p className="mt-2 text-xs text-slate-500">
                      If a class has teacher assignments, remove those assignments first.
                    </p>
                  </div>
                )}

                {error && (
                  <div className="border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {error}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-200 p-5">
                <button
                  type="button"
                  onClick={() => setSubjectModal(false)}
                  className="border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || (!editingSubject && !generatedCode)}
                  className="flex items-center gap-2 bg-blue-800 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-900 disabled:opacity-60"
                >
                  <Save size={16} />
                  {saving ? "Saving..." : editingSubject ? "Update Subject" : "Create Subject"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TEACHER MANAGEMENT MODAL */}
      {teacherModal && assigningSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="flex max-h-[92dvh] w-full max-w-2xl flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-5">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Manage Teacher Assignments
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  {assigningSubject.name} ({assigningSubject.code})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTeacherModal(false)}
                className="p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto p-5">
              <div>
                <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
                  <GraduationCap size={17} />
                  Current Teacher Assignments
                </h4>

                {(!assigningSubject.subject_teachers ||
                  assigningSubject.subject_teachers.length === 0) ? (
                  <p className="border border-slate-200 p-4 text-sm text-slate-500">
                    No teachers assigned yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {assigningSubject.subject_teachers.map((assignment) => (
                      <div
                        key={assignment.id}
                        className="flex flex-wrap items-center justify-between gap-3 border border-slate-200 p-3"
                      >
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {teacherName(assignment.users)}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {assignment.classes?.name || "Class"}
                            {assignment.sections?.name
                              ? ` · Section ${assignment.sections.name}`
                              : " · All sections"}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Weekly: {assignment.weeklyPeriods} · Theory:{" "}
                            {assignment.theoryPeriods} · Practical:{" "}
                            {assignment.practicalPeriods}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() =>
                              openEditTeacher(assigningSubject, assignment)
                            }
                            className="border border-slate-200 p-2 text-blue-700 hover:bg-blue-50 disabled:opacity-50"
                            title="Edit assignment"
                          >
                            <Pencil size={15} />
                          </button>

                          <button
                            type="button"
                            disabled={saving}
                            onClick={() =>
                              void removeTeacherAssignment(
                                assigningSubject,
                                assignment,
                              )
                            }
                            className="border border-slate-200 p-2 text-red-700 hover:bg-red-50 disabled:opacity-50"
                            title="Remove assignment"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-slate-200 pt-5">
                <h4 className="mb-4 text-sm font-bold text-slate-900">
                  {editingAssignment ? "Edit Teacher Assignment" : "Add Teacher Assignment"}
                </h4>

                <form id="teacher-assignment-form" onSubmit={saveTeacherAssignment}>
                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-semibold">
                        Class *
                      </label>
                      <select
                        required
                        value={teacherForm.classId}
                        onChange={(event) =>
                          setTeacherForm((current) => ({
                            ...current,
                            classId: event.target.value,
                            sectionId: "",
                          }))
                        }
                        className="w-full border border-slate-300 bg-white px-3 py-3 text-sm"
                      >
                        <option value="">Select Class</option>
                        {classes
                          .filter((item) =>
                            assigningSubject.class_subjects?.some(
                              (link) =>
                                (link.classes?.id || link.classId) === item.id,
                            ),
                          )
                          .map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name} ({item.code})
                            </option>
                          ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold">
                        Section (Optional)
                      </label>
                      <select
                        value={teacherForm.sectionId}
                        onChange={(event) =>
                          setTeacherForm((current) => ({
                            ...current,
                            sectionId: event.target.value,
                          }))
                        }
                        disabled={!teacherForm.classId}
                        className="w-full border border-slate-300 bg-white px-3 py-3 text-sm disabled:bg-slate-100"
                      >
                        <option value="">All Sections</option>
                        {(selectedClass?.sections || []).map((section) => (
                          <option key={section.id} value={section.id}>
                            {section.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold">
                        Teacher *
                      </label>
                      <select
                        required
                        value={teacherForm.teacherId}
                        onChange={(event) =>
                          setTeacherForm((current) => ({
                            ...current,
                            teacherId: event.target.value,
                          }))
                        }
                        className="w-full border border-slate-300 bg-white px-3 py-3 text-sm"
                      >
                        <option value="">Select Teacher</option>
                        {teachers.map((teacher) => (
                          <option key={teacher.id} value={teacher.id}>
                            {teacherName(teacher)} — {teacher.email}
                          </option>
                        ))}
                      </select>

                      {teachers.length === 0 && (
                        <p className="mt-2 text-xs text-amber-700">
                          No active teachers found in this institution.
                        </p>
                      )}
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      <div>
                        <label className="mb-2 block text-xs font-semibold">
                          Weekly Periods
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          required
                          value={teacherForm.weeklyPeriods}
                          onChange={(event) =>
                            setTeacherForm((current) => ({
                              ...current,
                              weeklyPeriods: Number(event.target.value),
                            }))
                          }
                          className="w-full border border-slate-300 px-3 py-3 text-sm"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-xs font-semibold">
                          Theory Periods
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          required
                          value={teacherForm.theoryPeriods}
                          onChange={(event) =>
                            setTeacherForm((current) => ({
                              ...current,
                              theoryPeriods: Number(event.target.value),
                            }))
                          }
                          className="w-full border border-slate-300 px-3 py-3 text-sm"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-xs font-semibold">
                          Practical Periods
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          required
                          value={teacherForm.practicalPeriods}
                          onChange={(event) =>
                            setTeacherForm((current) => ({
                              ...current,
                              practicalPeriods: Number(event.target.value),
                            }))
                          }
                          className="w-full border border-slate-300 px-3 py-3 text-sm"
                        />
                      </div>
                    </div>

                    {teacherForm.theoryPeriods + teacherForm.practicalPeriods !==
                      teacherForm.weeklyPeriods && (
                      <p className="text-xs text-amber-700">
                        Theory + Practical periods should equal Weekly Periods.
                      </p>
                    )}

                    {error && (
                      <div className="border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                        {error}
                      </div>
                    )}
                  </div>
                </form>
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 p-5">
              {editingAssignment && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingAssignment(null);
                    setTeacherForm(emptyTeacherForm);
                    setError("");
                  }}
                  className="border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700"
                >
                  Cancel Edit
                </button>
              )}

              <button
                type="button"
                onClick={() => setTeacherModal(false)}
                className="border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700"
              >
                Close
              </button>

              <button
                type="submit"
                form="teacher-assignment-form"
                disabled={saving || teachers.length === 0}
                className="flex items-center gap-2 bg-blue-800 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-900 disabled:opacity-60"
              >
                {editingAssignment ? <Save size={16} /> : <UserPlus size={16} />}
                {saving
                  ? "Saving..."
                  : editingAssignment
                    ? "Update Assignment"
                    : "Assign Teacher"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
