"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Download, Trophy } from "lucide-react";
import { apiRequest } from "../../lib/api";

type ClassOption = {
  id: string;
  name: string;
  sections: { id: string; name: string }[];
};

type ExamRow = {
  id: string;
  title: string;
  description: string | null;
  examDate: string;
  totalMarks: number;
  passingMarks: number;
  status: string;
  classId: string | null;
  sectionId: string | null;
  className: string | null;
  sectionName: string | null;
  appeared: number;
  passed: number;
  average: number | null;
  topper: { name: string; marks: number } | null;
};

type ExamInfo = {
  id: string;
  title: string;
  examDate: string;
  totalMarks: number;
  passingMarks: number;
  status: string;
  className: string | null;
  sectionName: string | null;
};

type SheetData = {
  exam: ExamInfo;
  students: {
    id: string;
    name: string;
    brxUid: string;
    section: string;
    marks: number | null;
  }[];
};

type RankData = {
  exam: ExamInfo;
  summary: {
    appeared: number;
    passed: number;
    failed: number;
    passPercent: number | null;
    average: number | null;
    highest: number | null;
    lowest: number | null;
  };
  rows: {
    rank: number;
    studentId: string;
    name: string;
    brxUid: string;
    section: string | null;
    marks: number;
    percent: number;
    grade: string;
    pass: boolean;
  }[];
};

type ClassRankData = {
  rows: {
    rank: number;
    studentId: string;
    name: string;
    brxUid: string;
    section: string | null;
    exams: number;
    marks: number;
    maxMarks: number;
    percent: number;
    grade: string;
  }[];
};

type View =
  | { kind: "list" }
  | { kind: "sheet"; id: string }
  | { kind: "rank"; id: string }
  | { kind: "class" };

const STATUS_STYLE: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  PUBLISHED: "bg-emerald-50 text-emerald-700",
  COMPLETED: "bg-blue-50 text-blue-700",
  CANCELLED: "bg-red-50 text-red-700",
};

const field =
  "mt-1 h-9 w-full border border-slate-300 bg-white px-3 text-sm font-normal outline-none focus:border-blue-600";

const dateText = (value: string) =>
  new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

function gradeOf(marks: number, total: number, passing: number) {
  if (marks < passing) return "F";

  const percent = (marks / total) * 100;

  if (percent >= 90) return "A+";
  if (percent >= 80) return "A";
  if (percent >= 70) return "B+";
  if (percent >= 60) return "B";
  if (percent >= 50) return "C";
  if (percent >= 40) return "D";

  return "F";
}

function RankBadge({ rank }: { rank: number }) {
  const color =
    rank === 1
      ? "bg-amber-400 text-white"
      : rank === 2
        ? "bg-slate-400 text-white"
        : rank === 3
          ? "bg-orange-400 text-white"
          : "bg-slate-100 text-slate-700";

  return (
    <span
      className={`inline-flex h-7 min-w-7 items-center justify-center px-1.5 text-xs font-bold ${color}`}
    >
      {rank}
    </span>
  );
}

function downloadCsv(name: string, rows: (string | number)[][]) {
  const text = rows
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
    )
    .join("\n");
  const url = URL.createObjectURL(new Blob([text], { type: "text/csv" }));
  const link = document.createElement("a");

  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

export default function SchoolExams() {
  const [view, setView] = useState<View>({ kind: "list" });
  const [classes, setClasses] = useState<ClassOption[]>([]);

  useEffect(() => {
    apiRequest<ClassOption[]>("/students/classes")
      .then(setClasses)
      .catch(() => setClasses([]));
  }, []);

  const tab = view.kind === "class" ? "class" : "exams";

  return (
    <div>
      <div className="mb-4 flex gap-1 border-b border-slate-200">
        {[
          ["exams", "Exams"],
          ["class", "Class ranking"],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setView({ kind: key === "class" ? "class" : "list" })}
            className={`border-b-2 px-4 py-2 text-sm font-semibold ${
              tab === key
                ? "border-blue-700 text-blue-800"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {view.kind === "list" && (
        <ExamList
          classes={classes}
          onSheet={(id) => setView({ kind: "sheet", id })}
          onRank={(id) => setView({ kind: "rank", id })}
        />
      )}
      {view.kind === "sheet" && (
        <MarksSheet
          id={view.id}
          onBack={() => setView({ kind: "list" })}
          onRank={() => setView({ kind: "rank", id: view.id })}
        />
      )}
      {view.kind === "rank" && (
        <RankList
          id={view.id}
          onBack={() => setView({ kind: "list" })}
          onSheet={() => setView({ kind: "sheet", id: view.id })}
        />
      )}
      {view.kind === "class" && <ClassRanking classes={classes} />}
    </div>
  );
}

/* ------------------------------- exam list ------------------------------- */

type FormState = {
  title: string;
  description: string;
  examDate: string;
  classId: string;
  sectionId: string;
  totalMarks: string;
  passingMarks: string;
};

const EMPTY: FormState = {
  title: "",
  description: "",
  examDate: "",
  classId: "",
  sectionId: "",
  totalMarks: "100",
  passingMarks: "33",
};

function ExamList({
  classes,
  onSheet,
  onRank,
}: {
  classes: ClassOption[];
  onSheet: (id: string) => void;
  onRank: (id: string) => void;
}) {
  const [exams, setExams] = useState<ExamRow[]>([]);
  const [filterClass, setFilterClass] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      setExams(
        await apiRequest<ExamRow[]>(
          `/exams${filterClass ? `?classId=${filterClass}` : ""}`,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load exams.");
    } finally {
      setLoading(false);
    }
  }, [filterClass]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);

    return () => window.clearTimeout(timer);
  }, [load]);

  const sections = useMemo(
    () => classes.find((item) => item.id === form.classId)?.sections ?? [],
    [classes, form.classId],
  );

  function startNew() {
    setEditingId(null);
    setForm(EMPTY);
    setError("");
    setMessage("");
    setShowForm(true);
  }

  function startEdit(exam: ExamRow) {
    setEditingId(exam.id);
    setForm({
      title: exam.title,
      description: exam.description ?? "",
      examDate: exam.examDate.slice(0, 10),
      classId: exam.classId ?? "",
      sectionId: exam.sectionId ?? "",
      totalMarks: String(exam.totalMarks),
      passingMarks: String(exam.passingMarks),
    });
    setError("");
    setMessage("");
    setShowForm(true);
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const body = {
        title: form.title,
        description: form.description,
        examDate: form.examDate,
        totalMarks: form.totalMarks,
        passingMarks: form.passingMarks,
        ...(editingId ? {} : { classId: form.classId, sectionId: form.sectionId || null }),
      };

      await apiRequest(editingId ? `/exams/${editingId}` : "/exams", {
        method: editingId ? "PATCH" : "POST",
        body: JSON.stringify(body),
      });
      setMessage(editingId ? "Exam updated." : "Exam created. Open Marks to enter results.");
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the exam.");
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(exam: ExamRow, status: string) {
    setError("");
    setMessage("");

    try {
      await apiRequest(`/exams/${exam.id}/status`, {
        method: "POST",
        body: JSON.stringify({ status }),
      });
      setMessage(
        status === "PUBLISHED"
          ? "Results published."
          : status === "DRAFT"
            ? "Results moved back to draft."
            : "Status updated.",
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not change the status.");
    }
  }

  async function remove(exam: ExamRow) {
    if (!window.confirm(`Delete "${exam.title}" and all its marks? This cannot be undone.`)) {
      return;
    }

    try {
      await apiRequest(`/exams/${exam.id}`, { method: "DELETE" });
      setMessage("Exam deleted.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the exam.");
    }
  }

  return (
    <section className="border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-100 p-4">
        <label className="text-xs font-semibold text-slate-500">
          Class
          <select
            value={filterClass}
            onChange={(event) => setFilterClass(event.target.value)}
            className={`${field} w-48`}
          >
            <option value="">All classes</option>
            {classes.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={startNew}
          className="h-9 bg-blue-700 px-4 text-sm font-semibold text-white hover:bg-blue-800"
        >
          + New exam
        </button>
      </div>

      {message && <p className="bg-emerald-50 px-4 py-2 text-sm text-emerald-800">{message}</p>}
      {error && <p className="bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

      {showForm && (
        <form onSubmit={save} className="grid gap-3 border-b border-slate-100 bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="text-xs font-semibold text-slate-600 sm:col-span-2">
            Exam name
            <input
              required
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              placeholder="e.g. Half-yearly exam"
              className={field}
            />
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Date
            <input
              required
              type="date"
              value={form.examDate}
              onChange={(event) => setForm({ ...form, examDate: event.target.value })}
              className={field}
            />
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Class
            <select
              required
              disabled={Boolean(editingId)}
              value={form.classId}
              onChange={(event) =>
                setForm({ ...form, classId: event.target.value, sectionId: "" })
              }
              className={field}
            >
              <option value="">Choose class</option>
              {classes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Section
            <select
              disabled={Boolean(editingId) || !form.classId}
              value={form.sectionId}
              onChange={(event) => setForm({ ...form, sectionId: event.target.value })}
              className={field}
            >
              <option value="">Whole class</option>
              {sections.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Total marks
            <input
              required
              type="number"
              min={1}
              max={1000}
              value={form.totalMarks}
              onChange={(event) => setForm({ ...form, totalMarks: event.target.value })}
              className={field}
            />
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Passing marks
            <input
              required
              type="number"
              min={0}
              value={form.passingMarks}
              onChange={(event) => setForm({ ...form, passingMarks: event.target.value })}
              className={field}
            />
          </label>
          <label className="text-xs font-semibold text-slate-600 sm:col-span-2 lg:col-span-3">
            Note (optional)
            <input
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              className={field}
            />
          </label>
          <div className="flex gap-2 sm:col-span-2 lg:col-span-3">
            <button
              type="submit"
              disabled={saving}
              className="h-9 bg-blue-700 px-5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
            >
              {saving ? "Saving..." : editingId ? "Save changes" : "Create exam"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="h-9 border border-slate-300 bg-white px-4 text-sm hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {!loading && exams.length === 0 ? (
        <p className="p-6 text-sm text-slate-500">
          No exams yet. Click &quot;New exam&quot; to create one, then enter marks to get ranks.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-200 text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2.5">Exam</th>
                <th className="px-4 py-2.5">Class</th>
                <th className="px-4 py-2.5">Results</th>
                <th className="px-4 py-2.5">Topper</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {exams.map((exam) => (
                <tr key={exam.id} className="align-top">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900">{exam.title}</p>
                    <p className="text-xs text-slate-500">
                      {dateText(exam.examDate)} · out of {exam.totalMarks} (pass {exam.passingMarks})
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    {exam.className ?? "-"}
                    {exam.sectionName ? ` - ${exam.sectionName}` : ""}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    {exam.appeared === 0 ? (
                      "No marks yet"
                    ) : (
                      <>
                        {exam.appeared} marked · {exam.passed} passed
                        <br />
                        Average {exam.average}
                      </>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {exam.topper ? (
                      <span className="inline-flex items-center gap-1 text-amber-700">
                        <Trophy size={13} /> {exam.topper.name} ({exam.topper.marks})
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-medium ${STATUS_STYLE[exam.status] ?? ""}`}>
                      {exam.status === "PUBLISHED" ? "Published" : exam.status === "DRAFT" ? "Draft" : exam.status === "COMPLETED" ? "Completed" : "Cancelled"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5 text-xs">
                      <button type="button" onClick={() => onSheet(exam.id)} className="bg-blue-50 px-2 py-1 font-semibold text-blue-800 hover:bg-blue-100">
                        Marks
                      </button>
                      <button type="button" onClick={() => onRank(exam.id)} className="bg-amber-50 px-2 py-1 font-semibold text-amber-800 hover:bg-amber-100">
                        Rank list
                      </button>
                      {exam.status === "DRAFT" ? (
                        <button type="button" onClick={() => void changeStatus(exam, "PUBLISHED")} className="bg-emerald-50 px-2 py-1 font-semibold text-emerald-800 hover:bg-emerald-100">
                          Publish
                        </button>
                      ) : (
                        <button type="button" onClick={() => void changeStatus(exam, "DRAFT")} className="bg-slate-100 px-2 py-1 font-semibold text-slate-700 hover:bg-slate-200">
                          Unpublish
                        </button>
                      )}
                      <button type="button" onClick={() => startEdit(exam)} className="bg-slate-100 px-2 py-1 text-slate-700 hover:bg-slate-200">
                        Edit
                      </button>
                      <button type="button" onClick={() => void remove(exam)} className="bg-red-50 px-2 py-1 text-red-700 hover:bg-red-100">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

/* ------------------------------- marks sheet ------------------------------- */

function MarksSheet({
  id,
  onBack,
  onRank,
}: {
  id: string;
  onBack: () => void;
  onRank: () => void;
}) {
  const [data, setData] = useState<SheetData | null>(null);
  const [marks, setMarks] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiRequest<SheetData>(`/exams/${id}/sheet`)
      .then((sheet) => {
        setData(sheet);
        setMarks(
          Object.fromEntries(
            sheet.students.map((student) => [
              student.id,
              student.marks === null ? "" : String(student.marks),
            ]),
          ),
        );
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Could not load the marks sheet."),
      );
  }, [id]);

  async function save() {
    if (!data) return;

    setError("");
    setMessage("");

    for (const student of data.students) {
      const value = marks[student.id];

      if (value !== "" && (Number(value) < 0 || Number(value) > data.exam.totalMarks)) {
        setError(`${student.name}: marks must be between 0 and ${data.exam.totalMarks}.`);
        return;
      }
    }

    setSaving(true);

    try {
      await apiRequest(`/exams/${id}/results`, {
        method: "PUT",
        body: JSON.stringify({
          results: data.students.map((student) => ({
            studentId: student.id,
            marks: marks[student.id] === "" ? null : Number(marks[student.id]),
          })),
        }),
      });
      setMessage("Marks saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the marks.");
    } finally {
      setSaving(false);
    }
  }

  const filled = Object.values(marks).filter((value) => value !== "").length;

  return (
    <section className="border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
        <div>
          <button type="button" onClick={onBack} className="mb-1 inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:underline">
            <ArrowLeft size={13} /> All exams
          </button>
          <h2 className="text-base font-bold text-slate-900">
            {data ? data.exam.title : "Marks"}
          </h2>
          {data && (
            <p className="text-xs text-slate-500">
              {data.exam.className}
              {data.exam.sectionName ? ` - ${data.exam.sectionName}` : ""} · out of{" "}
              {data.exam.totalMarks}, pass {data.exam.passingMarks} · {filled}/{data.students.length} filled
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onRank} className="h-9 border border-slate-300 px-4 text-sm hover:bg-slate-50">
            Rank list
          </button>
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving || !data}
            className="h-9 bg-blue-700 px-5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save marks"}
          </button>
        </div>
      </div>

      {message && <p className="bg-emerald-50 px-4 py-2 text-sm text-emerald-800">{message}</p>}
      {error && <p className="bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

      {data && data.students.length === 0 ? (
        <p className="p-6 text-sm text-slate-500">
          No students are enrolled in this class yet.
        </p>
      ) : (
        data && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-130 text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2.5">#</th>
                  <th className="px-4 py-2.5">Student</th>
                  <th className="px-4 py-2.5">Section</th>
                  <th className="px-4 py-2.5">Marks</th>
                  <th className="px-4 py-2.5">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.students.map((student, index) => {
                  const value = marks[student.id] ?? "";
                  const number = Number(value);

                  return (
                    <tr key={student.id}>
                      <td className="px-4 py-2 text-slate-500">{index + 1}</td>
                      <td className="px-4 py-2">
                        <p className="font-semibold text-slate-900">{student.name}</p>
                        <p className="text-xs text-slate-500">{student.brxUid}</p>
                      </td>
                      <td className="px-4 py-2">{student.section}</td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          min={0}
                          max={data.exam.totalMarks}
                          step="0.5"
                          value={value}
                          onChange={(event) =>
                            setMarks({ ...marks, [student.id]: event.target.value })
                          }
                          className="h-8 w-24 border border-slate-300 px-2 text-sm outline-none focus:border-blue-600"
                        />
                      </td>
                      <td className="px-4 py-2 font-semibold">
                        {value === "" || Number.isNaN(number)
                          ? "-"
                          : gradeOf(number, data.exam.totalMarks, data.exam.passingMarks)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      )}
    </section>
  );
}

/* -------------------------------- rank list -------------------------------- */

function RankList({
  id,
  onBack,
  onSheet,
}: {
  id: string;
  onBack: () => void;
  onSheet: () => void;
}) {
  const [data, setData] = useState<RankData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiRequest<RankData>(`/exams/${id}/ranklist`)
      .then(setData)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Could not load the rank list."),
      );
  }, [id]);

  const summary = data?.summary;

  return (
    <section className="border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
        <div>
          <button type="button" onClick={onBack} className="mb-1 inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:underline">
            <ArrowLeft size={13} /> All exams
          </button>
          <h2 className="text-base font-bold text-slate-900">
            {data ? `${data.exam.title} - rank list` : "Rank list"}
          </h2>
          {data && (
            <p className="text-xs text-slate-500">
              {data.exam.className}
              {data.exam.sectionName ? ` - ${data.exam.sectionName}` : ""} · out of {data.exam.totalMarks}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onSheet} className="h-9 border border-slate-300 px-4 text-sm hover:bg-slate-50">
            Edit marks
          </button>
          {data && data.rows.length > 0 && (
            <button
              type="button"
              onClick={() =>
                downloadCsv(`${data.exam.title}-ranks.csv`, [
                  ["Rank", "Name", "BRX ID", "Section", "Marks", "Percent", "Grade", "Result"],
                  ...data.rows.map((row) => [
                    row.rank,
                    row.name,
                    row.brxUid,
                    row.section ?? "",
                    row.marks,
                    row.percent,
                    row.grade,
                    row.pass ? "Pass" : "Fail",
                  ]),
                ])
              }
              className="inline-flex h-9 items-center gap-1.5 border border-slate-300 px-4 text-sm hover:bg-slate-50"
            >
              <Download size={14} /> CSV
            </button>
          )}
        </div>
      </div>

      {error && <p className="p-4 text-sm text-red-700">{error}</p>}

      {summary && data && data.rows.length === 0 && (
        <p className="p-6 text-sm text-slate-500">
          No marks entered yet. Open &quot;Edit marks&quot; to add them.
        </p>
      )}

      {summary && data && data.rows.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-px bg-slate-100 sm:grid-cols-4 lg:grid-cols-7">
            {[
              ["Marked", summary.appeared],
              ["Passed", summary.passed],
              ["Failed", summary.failed],
              ["Pass %", summary.passPercent === null ? "-" : `${summary.passPercent}%`],
              ["Average", summary.average ?? "-"],
              ["Highest", summary.highest ?? "-"],
              ["Lowest", summary.lowest ?? "-"],
            ].map(([label, value]) => (
              <div key={label} className="bg-white p-3">
                <p className="text-[11px] font-semibold text-slate-500">{label}</p>
                <p className="mt-0.5 text-xl font-bold text-slate-900">{value}</p>
              </div>
            ))}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-150 text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2.5">Rank</th>
                  <th className="px-4 py-2.5">Student</th>
                  <th className="px-4 py-2.5">Section</th>
                  <th className="px-4 py-2.5">Marks</th>
                  <th className="px-4 py-2.5">%</th>
                  <th className="px-4 py-2.5">Grade</th>
                  <th className="px-4 py-2.5">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.rows.map((row) => (
                  <tr key={row.studentId}>
                    <td className="px-4 py-2"><RankBadge rank={row.rank} /></td>
                    <td className="px-4 py-2">
                      <p className="font-semibold text-slate-900">{row.name}</p>
                      <p className="text-xs text-slate-500">{row.brxUid}</p>
                    </td>
                    <td className="px-4 py-2">{row.section ?? "-"}</td>
                    <td className="px-4 py-2 font-semibold">{row.marks} / {data.exam.totalMarks}</td>
                    <td className="px-4 py-2">{row.percent}%</td>
                    <td className="px-4 py-2 font-semibold">{row.grade}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 text-xs font-medium ${row.pass ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                        {row.pass ? "Pass" : "Fail"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}

/* ------------------------------ class ranking ------------------------------ */

function ClassRanking({ classes }: { classes: ClassOption[] }) {
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [data, setData] = useState<ClassRankData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const sections = useMemo(
    () => classes.find((item) => item.id === classId)?.sections ?? [],
    [classes, classId],
  );

  useEffect(() => {
    if (!classId) return;

    let cancelled = false;

    const timer = window.setTimeout(() => {
      setLoading(true);
      setError("");
      apiRequest<ClassRankData>(
        `/exams/class-ranking/${classId}${sectionId ? `?sectionId=${sectionId}` : ""}`,
      )
        .then((result) => {
          if (!cancelled) setData(result);
        })
        .catch((err) => {
          if (!cancelled)
            setError(err instanceof Error ? err.message : "Could not load the ranking.");
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [classId, sectionId]);

  return (
    <section className="border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-end gap-3 border-b border-slate-100 p-4">
        <label className="text-xs font-semibold text-slate-500">
          Class
          <select
            value={classId}
            onChange={(event) => {
              setClassId(event.target.value);
              setSectionId("");
              setData(null);
            }}
            className={`${field} w-48`}
          >
            <option value="">Choose class</option>
            {classes.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold text-slate-500">
          Section
          <select
            value={sectionId}
            disabled={!classId}
            onChange={(event) => setSectionId(event.target.value)}
            className={`${field} w-40`}
          >
            <option value="">All sections</option>
            {sections.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        {data && data.rows.length > 0 && (
          <button
            type="button"
            onClick={() =>
              downloadCsv("class-ranking.csv", [
                ["Rank", "Name", "BRX ID", "Section", "Exams", "Marks", "Out of", "Percent", "Grade"],
                ...data.rows.map((row) => [
                  row.rank,
                  row.name,
                  row.brxUid,
                  row.section ?? "",
                  row.exams,
                  row.marks,
                  row.maxMarks,
                  row.percent,
                  row.grade,
                ]),
              ])
            }
            className="inline-flex h-9 items-center gap-1.5 border border-slate-300 px-4 text-sm hover:bg-slate-50"
          >
            <Download size={14} /> CSV
          </button>
        )}
      </div>

      {error && <p className="p-4 text-sm text-red-700">{error}</p>}
      {!classId && (
        <p className="p-6 text-sm text-slate-500">
          Choose a class to see the overall ranking across all its exams.
        </p>
      )}
      {classId && loading && <p className="p-6 text-sm text-slate-500">Loading...</p>}
      {classId && !loading && data && data.rows.length === 0 && (
        <p className="p-6 text-sm text-slate-500">
          No marks have been entered for this class yet.
        </p>
      )}

      {data && data.rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-150 text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2.5">Rank</th>
                <th className="px-4 py-2.5">Student</th>
                <th className="px-4 py-2.5">Section</th>
                <th className="px-4 py-2.5">Exams</th>
                <th className="px-4 py-2.5">Total</th>
                <th className="px-4 py-2.5">%</th>
                <th className="px-4 py-2.5">Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.rows.map((row) => (
                <tr key={row.studentId}>
                  <td className="px-4 py-2"><RankBadge rank={row.rank} /></td>
                  <td className="px-4 py-2">
                    <p className="font-semibold text-slate-900">{row.name}</p>
                    <p className="text-xs text-slate-500">{row.brxUid}</p>
                  </td>
                  <td className="px-4 py-2">{row.section ?? "-"}</td>
                  <td className="px-4 py-2">{row.exams}</td>
                  <td className="px-4 py-2 font-semibold">{row.marks} / {row.maxMarks}</td>
                  <td className="px-4 py-2">{row.percent}%</td>
                  <td className="px-4 py-2 font-semibold">{row.grade}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
