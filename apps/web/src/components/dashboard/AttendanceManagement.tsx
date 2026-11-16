"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarCheck } from "lucide-react";
import { apiRequest } from "../../lib/api";

type Group = { id: string; label: string };

type Sheet = {
  mode: "SECTION" | "BATCH";
  students: {
    id: string;
    name: string;
    brxUid: string;
    status: string | null;
  }[];
};

const OPTIONS: { value: string; label: string; active: string }[] = [
  { value: "PRESENT", label: "Present", active: "bg-emerald-600 text-white border-emerald-600" },
  { value: "ABSENT", label: "Absent", active: "bg-red-600 text-white border-red-600" },
  { value: "LATE", label: "Late", active: "bg-amber-500 text-white border-amber-500" },
];

export function localDate(offsetDays = 0) {
  const now = new Date();
  now.setDate(now.getDate() + offsetDays);
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${now.getFullYear()}-${month}-${day}`;
}

const inputClass =
  "mt-1 h-9 w-full border border-slate-300 px-3 text-sm font-normal outline-none focus:border-blue-600";

export default function AttendanceManagement({
  base = "/attendance",
}: {
  base?: string;
}) {
  const [mode, setMode] = useState<"SECTION" | "BATCH" | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupId, setGroupId] = useState("");
  const [date, setDate] = useState(localDate());
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [marks, setMarks] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let cancelled = false;

    apiRequest<{ mode: "SECTION" | "BATCH"; groups: Group[] }>(`${base}/groups`)
      .then((data) => {
        if (cancelled) return;
        setMode(data.mode);
        setGroups(data.groups);
      })
      .catch((err) => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Could not load groups.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [base]);

  const loadSheet = useCallback(async (group: string, day: string) => {
    setSheet(null);
    setError("");
    setSuccess("");

    if (!group || !day) return;

    try {
      const data = await apiRequest<Sheet>(
        `${base}/sheet?groupId=${encodeURIComponent(group)}&date=${day}`,
      );
      setSheet(data);
      setMarks(
        Object.fromEntries(
          data.students.map((student) => [student.id, student.status ?? ""]),
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load the list.");
    }
  }, [base]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadSheet(groupId, date), 0);
    return () => window.clearTimeout(timer);
  }, [groupId, date, loadSheet]);

  function pick(studentId: string, value: string) {
    setMarks((current) => ({
      ...current,
      [studentId]: current[studentId] === value ? "" : value,
    }));
  }

  function markAll(value: string) {
    if (!sheet) return;
    setMarks(Object.fromEntries(sheet.students.map((student) => [student.id, value])));
  }

  async function save() {
    if (!sheet) return;
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await apiRequest(`${base}/sheet`, {
        method: "PUT",
        body: JSON.stringify({
          groupId,
          date,
          records: sheet.students.map((student) => ({
            studentId: student.id,
            status: marks[student.id] || null,
          })),
        }),
      });
      setSuccess("Attendance saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save attendance.");
    } finally {
      setSaving(false);
    }
  }

  const unmarked = sheet
    ? sheet.students.filter((student) => !marks[student.id]).length
    : 0;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 border border-slate-200 bg-white p-4 sm:grid-cols-2">
        <label className="text-xs font-semibold text-slate-600">
          {mode === "BATCH" ? "Batch" : "Class & section"}
          <select
            value={groupId}
            onChange={(event) => setGroupId(event.target.value)}
            className={inputClass}
          >
            <option value="">
              {loading ? "Loading..." : mode === "BATCH" ? "Choose a batch" : "Choose a section"}
            </option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold text-slate-600">
          Date
          <input
            type="date"
            value={date}
            max={localDate()}
            onChange={(event) => setDate(event.target.value)}
            className={inputClass}
          />
        </label>
      </div>

      {!loading && groups.length === 0 && !error && (
        <p className="border border-slate-200 bg-white p-4 text-sm text-slate-500">
          {mode === "BATCH"
            ? "No active batch yet. Create a batch first."
            : "No sections yet. Create a class and section first."}
        </p>
      )}

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
            <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <CalendarCheck size={16} />
              {sheet.students.length} students
              {unmarked > 0 && (
                <span className="text-xs font-normal text-slate-500">
                  ({unmarked} not marked)
                </span>
              )}
            </h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => markAll("PRESENT")}
                className="h-8 border border-slate-300 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                All present
              </button>
              <button
                type="button"
                onClick={() => markAll("")}
                className="h-8 border border-slate-300 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Clear
              </button>
            </div>
          </div>

          {sheet.students.length === 0 ? (
            <p className="p-4 text-sm text-slate-500">
              No active students here yet.
            </p>
          ) : (
            <>
              <ul className="max-h-[28rem] divide-y divide-slate-100 overflow-y-auto">
                {sheet.students.map((student) => (
                  <li
                    key={student.id}
                    className="flex flex-wrap items-center justify-between gap-2 px-4 py-2"
                  >
                    <p className="text-sm">
                      <span className="font-semibold text-slate-800">{student.name}</span>{" "}
                      <span className="text-xs text-slate-500">{student.brxUid}</span>
                    </p>
                    <div className="flex gap-1">
                      {OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => pick(student.id, option.value)}
                          className={`h-8 border px-2.5 text-xs font-semibold ${
                            marks[student.id] === option.value
                              ? option.active
                              : "border-slate-300 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
              <div className="border-t border-slate-100 p-3">
                <button
                  type="button"
                  onClick={() => void save()}
                  disabled={saving}
                  className="h-9 bg-blue-800 px-4 text-xs font-semibold text-white hover:bg-blue-900 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save attendance"}
                </button>
                <span className="ml-3 text-xs text-slate-500">
                  Tap a selected button again to un-mark it.
                </span>
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}
