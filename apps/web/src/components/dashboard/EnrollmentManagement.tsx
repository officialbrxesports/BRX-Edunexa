"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiRequest } from "../../lib/api";

type Row = {
  id: string;
  name: string;
  brxUid: string;
  programId: string | null;
  programName: string | null;
  semester: number | null;
  rollNo: string | null;
};

type ProgramOption = { id: string; name: string; code: string; semesters: number };

const inputClass =
  "h-8 w-full border border-slate-300 px-2 text-xs outline-none focus:border-blue-600";

function StudentRow({
  row,
  programs,
  onChanged,
  onError,
}: {
  row: Row;
  programs: ProgramOption[];
  onChanged: (message: string) => void;
  onError: (message: string) => void;
}) {
  const [programId, setProgramId] = useState(row.programId ?? "");
  const [semester, setSemester] = useState(String(row.semester ?? 1));
  const [rollNo, setRollNo] = useState(row.rollNo ?? "");
  const [busy, setBusy] = useState(false);

  const program = programs.find((item) => item.id === programId);

  async function save() {
    setBusy(true);

    try {
      await apiRequest(`/college/enrollments/${row.id}`, {
        method: "PUT",
        body: JSON.stringify({ programId, semester: Number(semester), rollNo }),
      });
      onChanged(`${row.name} saved.`);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);

    try {
      await apiRequest(`/college/enrollments/${row.id}`, { method: "DELETE" });
      onChanged(`${row.name} removed from the program.`);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Could not remove.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="grid gap-2 px-4 py-2.5 text-sm md:grid-cols-[1.2fr_1.6fr_5rem_7rem_auto] md:items-center">
      <p>
        <span className="font-semibold text-slate-800">{row.name}</span>{" "}
        <span className="text-xs text-slate-500">{row.brxUid}</span>
      </p>
      <select
        value={programId}
        onChange={(event) => setProgramId(event.target.value)}
        className={inputClass}
      >
        <option value="">No program</option>
        {programs.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </select>
      <input
        type="number"
        min={1}
        max={program?.semesters ?? 12}
        value={semester}
        onChange={(event) => setSemester(event.target.value)}
        title="Semester"
        className={inputClass}
      />
      <input
        value={rollNo}
        onChange={(event) => setRollNo(event.target.value)}
        placeholder="Roll no."
        maxLength={40}
        className={inputClass}
      />
      <div className="flex gap-1.5">
        <button
          type="button"
          disabled={busy || !programId}
          onClick={() => void save()}
          className="h-8 bg-blue-800 px-3 text-xs font-semibold text-white hover:bg-blue-900 disabled:opacity-50"
        >
          Save
        </button>
        {row.programId && (
          <button
            type="button"
            disabled={busy}
            onClick={() => void remove()}
            className="h-8 border border-slate-300 px-2.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            Remove
          </button>
        )}
      </div>
    </li>
  );
}

export default function EnrollmentManagement() {
  const [rows, setRows] = useState<Row[]>([]);
  const [programs, setPrograms] = useState<ProgramOption[]>([]);
  const [search, setSearch] = useState("");
  const [onlyUnassigned, setOnlyUnassigned] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const [students, programList] = await Promise.all([
        apiRequest<Row[]>("/college/enrollments"),
        apiRequest<ProgramOption[]>("/college/programs"),
      ]);
      setRows(students);
      setPrograms(programList);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load students.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();

    return rows
      .filter((row) => !onlyUnassigned || !row.programId)
      .filter((row) => !query || `${row.name} ${row.brxUid}`.toLowerCase().includes(query))
      .slice(0, 80);
  }, [rows, search, onlyUnassigned]);

  return (
    <section className="border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 p-3">
        <h3 className="text-sm font-bold text-slate-900">
          Program &amp; semester ({rows.length} students)
        </h3>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={onlyUnassigned}
              onChange={(event) => setOnlyUnassigned(event.target.checked)}
            />
            Only without program
          </label>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search students..."
            className="h-8 w-44 border border-slate-300 px-2 text-xs outline-none focus:border-blue-600"
          />
        </div>
      </div>

      {(error || success) && (
        <p
          className={`m-3 border p-2.5 text-xs ${
            error
              ? "border-red-200 bg-red-50 text-red-800"
              : "border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}
        >
          {error || success}
        </p>
      )}

      {visible.length === 0 ? (
        <p className="p-4 text-sm text-slate-500">
          {loading ? "Loading..." : "No students to show. Create students first."}
        </p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {visible.map((row) => (
            <StudentRow
              key={`${row.id}-${row.programId}-${row.semester}-${row.rollNo}`}
              row={row}
              programs={programs}
              onChanged={(message) => {
                setError("");
                setSuccess(message);
                void load();
              }}
              onError={(message) => {
                setSuccess("");
                setError(message);
              }}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
