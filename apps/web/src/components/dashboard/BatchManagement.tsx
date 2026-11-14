"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Layers, Pencil, RefreshCw, X } from "lucide-react";
import { apiRequest } from "../../lib/api";

type Batch = {
  id: string;
  name: string;
  code: string;
  schedule: string | null;
  description: string | null;
  capacity: number;
  startDate: string | null;
  endDate: string | null;
  status: string;
  studentCount: number;
  studentIds: string[];
  teacherIds: string[];
  teacherNames: string[];
};

type Person = { id: string; name: string; brxUid: string };

type Form = {
  name: string;
  code: string;
  schedule: string;
  description: string;
  capacity: string;
  startDate: string;
  endDate: string;
  status: string;
};

const EMPTY: Form = {
  name: "",
  code: "",
  schedule: "",
  description: "",
  capacity: "30",
  startDate: "",
  endDate: "",
  status: "ACTIVE",
};

const inputClass =
  "mt-1 h-9 w-full border border-slate-300 px-3 text-sm font-normal outline-none focus:border-blue-600";

const toDateInput = (value: string | null) => (value ? value.slice(0, 10) : "");

export default function BatchManagement() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [students, setStudents] = useState<Person[]>([]);
  const [teachers, setTeachers] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Form>(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [studentIds, setStudentIds] = useState<string[]>([]);
  const [teacherIds, setTeacherIds] = useState<string[]>([]);
  const [studentSearch, setStudentSearch] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const [batchList, options] = await Promise.all([
        apiRequest<Batch[]>("/coaching/batches"),
        apiRequest<{ students: Person[]; teachers: Person[] }>(
          "/coaching/people-options",
        ),
      ]);
      setBatches(batchList);
      setStudents(options.students);
      setTeachers(options.teachers);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load batches.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const visibleStudents = useMemo(() => {
    const query = studentSearch.trim().toLowerCase();
    const list = query
      ? students.filter((s) => `${s.name} ${s.brxUid}`.toLowerCase().includes(query))
      : students;
    return list.slice(0, 60);
  }, [students, studentSearch]);

  function reset() {
    setEditingId(null);
    setForm(EMPTY);
    setStudentIds([]);
    setTeacherIds([]);
    setStudentSearch("");
  }

  function startEdit(batch: Batch) {
    setEditingId(batch.id);
    setError("");
    setSuccess("");
    setForm({
      name: batch.name,
      code: batch.code,
      schedule: batch.schedule ?? "",
      description: batch.description ?? "",
      capacity: String(batch.capacity),
      startDate: toDateInput(batch.startDate),
      endDate: toDateInput(batch.endDate),
      status: batch.status,
    });
    setStudentIds(batch.studentIds);
    setTeacherIds(batch.teacherIds);
  }

  function toggle(list: string[], setList: (v: string[]) => void, id: string) {
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    setSaving(true);
    setError("");
    setSuccess("");

    const body = {
      name: form.name,
      schedule: form.schedule,
      description: form.description,
      capacity: form.capacity,
      startDate: form.startDate || null,
      endDate: form.endDate || null,
    };

    try {
      let batchId = editingId;

      if (editingId) {
        await apiRequest(`/coaching/batches/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify({ ...body, status: form.status }),
        });
      } else {
        const created = await apiRequest<{ batch: Batch }>("/coaching/batches", {
          method: "POST",
          body: JSON.stringify({ ...body, code: form.code }),
        });
        batchId = created.batch.id;
      }

      await apiRequest(`/coaching/batches/${batchId}/members`, {
        method: "PUT",
        body: JSON.stringify({ studentIds, teacherIds }),
      });

      setSuccess(editingId ? "Batch updated." : "Batch created.");
      reset();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save batch.");
      await load();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <form onSubmit={submit} className="border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Layers size={16} />
            {editingId ? "Edit batch" : "New batch"}
          </h3>
          {editingId && (
            <button
              type="button"
              onClick={reset}
              className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              <X size={14} />
              Cancel
            </button>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-semibold text-slate-600">
            Batch name *
            <input
              required
              maxLength={120}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. NEET 2027 Morning"
              className={inputClass}
            />
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Batch code {editingId ? "" : "(auto if empty)"}
            <input
              maxLength={30}
              disabled={Boolean(editingId)}
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              className={`${inputClass} disabled:bg-slate-100 disabled:text-slate-500`}
            />
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Schedule
            <input
              maxLength={160}
              value={form.schedule}
              onChange={(e) => setForm({ ...form, schedule: e.target.value })}
              placeholder="Mon-Sat, 6-8 AM"
              className={inputClass}
            />
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Capacity (students)
            <input
              type="number"
              min={1}
              max={5000}
              value={form.capacity}
              onChange={(e) => setForm({ ...form, capacity: e.target.value })}
              className={inputClass}
            />
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Start date
            <input
              type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              className={inputClass}
            />
          </label>
          <label className="text-xs font-semibold text-slate-600">
            End date
            <input
              type="date"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              className={inputClass}
            />
          </label>
          {editingId && (
            <label className="text-xs font-semibold text-slate-600">
              Status
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className={inputClass}
              >
                <option value="ACTIVE">Active</option>
                <option value="COMPLETED">Completed</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </label>
          )}
          <label className="text-xs font-semibold text-slate-600 sm:col-span-2">
            Description
            <input
              maxLength={500}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className={inputClass}
            />
          </label>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="border border-slate-200">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 bg-slate-50 px-3 py-2">
              <p className="text-xs font-bold text-slate-700">
                Students ({studentIds.length}/{form.capacity || "-"})
              </p>
              <input
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="Search..."
                className="h-7 w-32 border border-slate-300 px-2 text-xs outline-none focus:border-blue-600"
              />
            </div>
            <div className="max-h-44 overflow-y-auto">
              {visibleStudents.length === 0 ? (
                <p className="p-3 text-xs text-slate-500">
                  {students.length === 0
                    ? "No students yet. Create them from Add → Student."
                    : "No match."}
                </p>
              ) : (
                visibleStudents.map((student) => (
                  <label
                    key={student.id}
                    className="flex items-center gap-2 border-b border-slate-100 px-3 py-1.5 text-xs last:border-b-0"
                  >
                    <input
                      type="checkbox"
                      checked={studentIds.includes(student.id)}
                      onChange={() => toggle(studentIds, setStudentIds, student.id)}
                    />
                    <span className="font-semibold text-slate-800">{student.name}</span>
                    <span className="text-slate-500">{student.brxUid}</span>
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="border border-slate-200">
            <div className="border-b border-slate-100 bg-slate-50 px-3 py-2">
              <p className="text-xs font-bold text-slate-700">
                Teachers ({teacherIds.length})
              </p>
            </div>
            <div className="max-h-44 overflow-y-auto">
              {teachers.length === 0 ? (
                <p className="p-3 text-xs text-slate-500">
                  No teachers yet. Create them from Add → Teacher.
                </p>
              ) : (
                teachers.map((teacher) => (
                  <label
                    key={teacher.id}
                    className="flex items-center gap-2 border-b border-slate-100 px-3 py-1.5 text-xs last:border-b-0"
                  >
                    <input
                      type="checkbox"
                      checked={teacherIds.includes(teacher.id)}
                      onChange={() => toggle(teacherIds, setTeacherIds, teacher.id)}
                    />
                    <span className="font-semibold text-slate-800">{teacher.name}</span>
                    <span className="text-slate-500">{teacher.brxUid}</span>
                  </label>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="mt-4">
          <button
            type="submit"
            disabled={saving}
            className="h-9 bg-blue-800 px-4 text-xs font-semibold text-white hover:bg-blue-900 disabled:opacity-50"
          >
            {saving ? "Saving..." : editingId ? "Save changes" : "Create batch"}
          </button>
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
        <div className="flex items-center justify-between border-b border-slate-100 p-3">
          <h3 className="text-sm font-bold text-slate-900">
            Batches ({batches.length})
          </h3>
          <button
            type="button"
            onClick={() => void load()}
            title="Reload"
            className="flex h-8 w-8 items-center justify-center border border-slate-300 hover:bg-slate-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        {loading && batches.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">Loading...</p>
        ) : batches.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">
            No batches yet. Create the first one above.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {batches.map((batch) => (
              <li
                key={batch.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {batch.name}{" "}
                    <span className="text-xs font-normal text-slate-500">
                      {batch.code}
                    </span>
                    {batch.status !== "ACTIVE" && (
                      <span className="ml-2 bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                        {batch.status}
                      </span>
                    )}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {batch.schedule ?? "No schedule"} · {batch.studentCount}/
                    {batch.capacity} students ·{" "}
                    {batch.teacherNames.length > 0
                      ? batch.teacherNames.join(", ")
                      : "No teacher"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => startEdit(batch)}
                  className="flex h-8 items-center gap-1 border border-slate-300 px-2.5 text-xs font-semibold hover:bg-slate-50"
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
