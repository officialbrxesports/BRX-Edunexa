"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { ClipboardList, RefreshCw, Trash2 } from "lucide-react";
import { apiRequest } from "../../lib/api";

export type TestRow = {
  id: string;
  batchId: string;
  batchName: string;
  batchCode: string;
  title: string;
  subject: string | null;
  testDate: string;
  maxMarks: number;
  appeared: number;
  absent: number;
  average: number | null;
  topper: { name: string; marks: number | null } | null;
};

type BatchOption = { id: string; name: string; code: string };

type Sheet = {
  test: {
    id: string;
    title: string;
    subject: string | null;
    testDate: string;
    maxMarks: number;
    batchName: string;
    batchCode: string;
  };
  students: {
    id: string;
    name: string;
    brxUid: string;
    marks: number | null;
    absent: boolean;
  }[];
};

type Entry = { marks: string; absent: boolean };

const inputClass =
  "mt-1 h-9 w-full border border-slate-300 px-3 text-sm font-normal outline-none focus:border-blue-600";

const today = () => new Date().toISOString().slice(0, 10);

export default function TestManagement() {
  const [batches, setBatches] = useState<BatchOption[]>([]);
  const [tests, setTests] = useState<TestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [batchId, setBatchId] = useState("");
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [testDate, setTestDate] = useState(today());
  const [maxMarks, setMaxMarks] = useState("100");

  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [entries, setEntries] = useState<Record<string, Entry>>({});
  const [sheetSaving, setSheetSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const [batchList, testList] = await Promise.all([
        apiRequest<BatchOption[]>("/coaching/batches"),
        apiRequest<TestRow[]>("/coaching/tests"),
      ]);
      setBatches(batchList);
      setTests(testList);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load tests.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function createTest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const created = await apiRequest<{ id: string }>("/coaching/tests", {
        method: "POST",
        body: JSON.stringify({
          batchId,
          title,
          subject,
          testDate,
          maxMarks: Number(maxMarks),
        }),
      });
      setTitle("");
      setSubject("");
      setSuccess("Test created. Now enter the marks below.");
      await load();
      await openSheet(created.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the test.");
    } finally {
      setSaving(false);
    }
  }

  async function openSheet(id: string) {
    setError("");

    try {
      const data = await apiRequest<Sheet>(`/coaching/tests/${id}/sheet`);
      setSheet(data);
      setEntries(
        Object.fromEntries(
          data.students.map((student) => [
            student.id,
            {
              marks: student.marks === null ? "" : String(student.marks),
              absent: student.absent,
            },
          ]),
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open the marks sheet.");
    }
  }

  async function saveSheet() {
    if (!sheet) return;
    setError("");
    setSuccess("");
    setSheetSaving(true);

    try {
      await apiRequest(`/coaching/tests/${sheet.test.id}/results`, {
        method: "PUT",
        body: JSON.stringify({
          results: sheet.students.map((student) => ({
            studentId: student.id,
            marks: entries[student.id]?.marks ?? "",
            absent: entries[student.id]?.absent ?? false,
          })),
        }),
      });
      setSuccess("Marks saved.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save marks.");
    } finally {
      setSheetSaving(false);
    }
  }

  async function removeTest(test: TestRow) {
    if (!window.confirm(`Delete "${test.title}" and all its marks?`)) return;
    setError("");
    setSuccess("");

    try {
      await apiRequest(`/coaching/tests/${test.id}`, { method: "DELETE" });

      if (sheet?.test.id === test.id) setSheet(null);

      setSuccess("Test deleted.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the test.");
    }
  }

  return (
    <div className="space-y-5">
      <form onSubmit={createTest} className="border border-slate-200 bg-white p-4">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
          <ClipboardList size={16} />
          New test
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-semibold text-slate-600">
            Batch *
            <select
              value={batchId}
              onChange={(event) => setBatchId(event.target.value)}
              required
              className={inputClass}
            >
              <option value="">Choose a batch</option>
              {batches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.name} ({batch.code})
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Test name *
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              maxLength={120}
              placeholder="Weekly Test 1"
              className={inputClass}
            />
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Subject
            <input
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              maxLength={80}
              placeholder="Physics"
              className={inputClass}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs font-semibold text-slate-600">
              Date *
              <input
                type="date"
                value={testDate}
                onChange={(event) => setTestDate(event.target.value)}
                required
                className={inputClass}
              />
            </label>
            <label className="text-xs font-semibold text-slate-600">
              Max marks *
              <input
                type="number"
                min={1}
                max={1000}
                value={maxMarks}
                onChange={(event) => setMaxMarks(event.target.value)}
                required
                className={inputClass}
              />
            </label>
          </div>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="mt-4 h-9 bg-blue-800 px-4 text-xs font-semibold text-white hover:bg-blue-900 disabled:opacity-50"
        >
          {saving ? "Creating..." : "Create test"}
        </button>
      </form>

      {error && (
        <p className="border border-red-200 bg-red-50 p-2.5 text-xs text-red-800">
          {error}
        </p>
      )}
      {success && (
        <p className="border border-emerald-200 bg-emerald-50 p-2.5 text-xs text-emerald-800">
          {success}
        </p>
      )}

      {sheet && (
        <section className="border border-slate-200 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 p-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Marks: {sheet.test.title}
              </h3>
              <p className="text-xs text-slate-500">
                {sheet.test.batchName} · out of {sheet.test.maxMarks} ·{" "}
                {new Date(sheet.test.testDate).toLocaleDateString("en-IN")}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSheet(null)}
              className="h-8 border border-slate-300 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Close
            </button>
          </div>
          {sheet.students.length === 0 ? (
            <p className="p-4 text-sm text-slate-500">
              This batch has no active students. Add students to the batch first.
            </p>
          ) : (
            <>
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-slate-50 text-left text-xs text-slate-600">
                    <tr>
                      <th className="px-3 py-2">Student</th>
                      <th className="w-28 px-3 py-2">Marks</th>
                      <th className="w-24 px-3 py-2">Absent</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sheet.students.map((student) => {
                      const entry = entries[student.id] ?? { marks: "", absent: false };

                      return (
                        <tr key={student.id}>
                          <td className="px-3 py-1.5">
                            <span className="font-semibold text-slate-800">
                              {student.name}
                            </span>{" "}
                            <span className="text-xs text-slate-500">
                              {student.brxUid}
                            </span>
                          </td>
                          <td className="px-3 py-1.5">
                            <input
                              type="number"
                              min={0}
                              max={sheet.test.maxMarks}
                              step="0.25"
                              disabled={entry.absent}
                              value={entry.absent ? "" : entry.marks}
                              onChange={(event) =>
                                setEntries({
                                  ...entries,
                                  [student.id]: { ...entry, marks: event.target.value },
                                })
                              }
                              className="h-8 w-full border border-slate-300 px-2 text-sm outline-none focus:border-blue-600 disabled:bg-slate-100"
                            />
                          </td>
                          <td className="px-3 py-1.5">
                            <input
                              type="checkbox"
                              checked={entry.absent}
                              onChange={(event) =>
                                setEntries({
                                  ...entries,
                                  [student.id]: {
                                    marks: "",
                                    absent: event.target.checked,
                                  },
                                })
                              }
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="border-t border-slate-100 p-3">
                <button
                  type="button"
                  onClick={() => void saveSheet()}
                  disabled={sheetSaving}
                  className="h-9 bg-blue-800 px-4 text-xs font-semibold text-white hover:bg-blue-900 disabled:opacity-50"
                >
                  {sheetSaving ? "Saving..." : "Save marks"}
                </button>
                <span className="ml-3 text-xs text-slate-500">
                  Leave marks empty if not entered yet.
                </span>
              </div>
            </>
          )}
        </section>
      )}

      <section className="border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 p-3">
          <h3 className="text-sm font-bold text-slate-900">
            All tests ({tests.length})
          </h3>
          <button
            type="button"
            onClick={() => void load()}
            className="flex h-8 items-center gap-1.5 border border-slate-300 px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
        {tests.length === 0 ? (
          <p className="p-4 text-sm text-slate-500">
            {loading ? "Loading..." : "No tests yet. Create the first one above."}
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {tests.map((test) => (
              <li
                key={test.id}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-semibold text-slate-900">
                    {test.title}{" "}
                    <span className="text-xs font-normal text-slate-500">
                      {test.batchName}
                      {test.subject ? ` · ${test.subject}` : ""}
                    </span>
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(test.testDate).toLocaleDateString("en-IN")} · out of{" "}
                    {test.maxMarks} · {test.appeared} appeared
                    {test.average !== null ? ` · avg ${test.average}` : ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => void openSheet(test.id)}
                    className="h-8 bg-blue-800 px-3 text-xs font-semibold text-white hover:bg-blue-900"
                  >
                    Enter marks
                  </button>
                  <button
                    type="button"
                    onClick={() => void removeTest(test)}
                    title="Delete test"
                    className="flex h-8 w-8 items-center justify-center border border-slate-300 text-red-700 hover:bg-red-50"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
