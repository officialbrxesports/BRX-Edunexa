"use client";

import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "../../lib/api";

type Status = "PRESENT" | "ABSENT" | "LATE";

type Person = {
  id: string;
  name: string;
  brxUid: string;
  role: string;
  status: Status | null;
};

type Report = {
  month: string;
  today: { total: number; present: number; late: number; absent: number; unmarked: number };
  rows: {
    id: string;
    name: string;
    brxUid: string;
    role: string;
    present: number;
    late: number;
    absent: number;
    marked: number;
    percent: number | null;
  }[];
};

const ROLE_LABEL: Record<string, string> = {
  TEACHER: "Teacher",
  STAFF: "Staff",
  GUARD: "Security",
};

const today = () => {
  const now = new Date();

  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};

const field = "border border-slate-300 px-3 py-2 text-sm";
const card = "border border-slate-200 bg-white shadow-sm";

function Stat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className={`${card} p-4`}>
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${tone}`}>{value}</p>
    </div>
  );
}

/** Mark attendance of teachers, staff and security for one day. */
function Mark() {
  const [date, setDate] = useState(today());
  const [people, setPeople] = useState<Person[] | null>(null);
  const [marks, setMarks] = useState<Record<string, Status>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  const load = useCallback(async () => {
    setPeople(null);
    setDone("");

    try {
      const data = await apiRequest<{ people: Person[] }>(`/staff-attendance?date=${date}`);
      const next: Record<string, Status> = {};

      for (const person of data.people) if (person.status) next[person.id] = person.status;

      setPeople(data.people);
      setMarks(next);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load staff.");
    }
  }, [date]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);

    return () => clearTimeout(timer);
  }, [load]);

  async function save() {
    const entries = Object.entries(marks).map(([userId, status]) => ({ userId, status }));

    if (entries.length === 0) {
      setError("Mark at least one person first.");
      return;
    }

    setBusy(true);
    setError("");
    setDone("");

    try {
      await apiRequest("/staff-attendance", {
        method: "PUT",
        body: JSON.stringify({ date, entries }),
      });
      setDone(`Saved attendance of ${entries.length} people.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setBusy(false);
    }
  }

  const options: [Status, string, string][] = [
    ["PRESENT", "Present", "bg-emerald-600"],
    ["LATE", "Late", "bg-amber-500"],
    ["ABSENT", "Absent", "bg-red-600"],
  ];

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="date"
          value={date}
          max={today()}
          onChange={(e) => setDate(e.target.value)}
          className={field}
        />
        <button
          type="button"
          disabled={!people}
          onClick={() =>
            setMarks(Object.fromEntries((people ?? []).map((item) => [item.id, "PRESENT" as Status])))
          }
          className="h-9 border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          Mark everyone present
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {done && <p className="text-sm text-emerald-700">{done}</p>}

      <section className={card}>
        {!people ? (
          <p className="p-5 text-sm text-slate-500">Loading…</p>
        ) : people.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">
            No teacher, staff or security member found. Add them from Add → People first.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {people.map((person) => (
              <li key={person.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">{person.name}</p>
                  <p className="text-xs text-slate-500">
                    {person.brxUid} · {ROLE_LABEL[person.role] ?? person.role}
                  </p>
                </div>
                <div className="flex gap-1">
                  {options.map(([value, label, color]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setMarks((prev) => ({ ...prev, [person.id]: value }))}
                      className={`h-8 px-3 text-xs font-semibold ${
                        marks[person.id] === value
                          ? `${color} text-white`
                          : "border border-slate-300 bg-white text-slate-700"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <button
        type="button"
        onClick={save}
        disabled={busy || !people}
        className="h-9 w-fit bg-blue-800 px-4 text-xs font-semibold text-white hover:bg-blue-900 disabled:opacity-60"
      >
        {busy ? "Saving…" : "Save attendance"}
      </button>
    </div>
  );
}

/** Month report for the dashboard (view only). */
function MonthReport() {
  const [month, setMonth] = useState(today().slice(0, 7));
  const [data, setData] = useState<Report | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    apiRequest<Report>(`/staff-attendance/report?month=${month}`)
      .then((result) => {
        if (!cancelled) {
          setData(result);
          setError("");
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load the report.");
      });

    return () => {
      cancelled = true;
    };
  }, [month]);

  return (
    <div className="grid gap-4">
      {error && <p className="text-sm text-red-600">{error}</p>}

      {data && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Staff today" value={data.today.total} tone="text-slate-900" />
          <Stat label="Present today" value={data.today.present + data.today.late} tone="text-emerald-700" />
          <Stat label="Absent today" value={data.today.absent} tone="text-red-600" />
          <Stat label="Not marked yet" value={data.today.unmarked} tone="text-amber-600" />
        </div>
      )}

      <div className="flex items-center gap-3">
        <label className="text-xs font-semibold text-slate-600">Month</label>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className={field}
        />
      </div>

      <section className={`${card} overflow-x-auto`}>
        {!data ? (
          <p className="p-5 text-sm text-slate-500">Loading…</p>
        ) : data.rows.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">No staff member found.</p>
        ) : (
          <table className="w-full min-w-150 text-left text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500">
              <tr>
                <th className="px-4 py-2 font-semibold">Name</th>
                <th className="px-4 py-2 font-semibold">Role</th>
                <th className="px-4 py-2 font-semibold">Present</th>
                <th className="px-4 py-2 font-semibold">Late</th>
                <th className="px-4 py-2 font-semibold">Absent</th>
                <th className="px-4 py-2 font-semibold">Attendance</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row) => (
                <tr key={row.id} className="border-t border-slate-100">
                  <td className="px-4 py-2">
                    <p className="font-semibold text-slate-900">{row.name}</p>
                    <p className="text-xs text-slate-500">{row.brxUid}</p>
                  </td>
                  <td className="px-4 py-2">{ROLE_LABEL[row.role] ?? row.role}</td>
                  <td className="px-4 py-2">{row.present}</td>
                  <td className="px-4 py-2">{row.late}</td>
                  <td className="px-4 py-2">{row.absent}</td>
                  <td className={`px-4 py-2 font-semibold ${row.percent !== null && row.percent < 75 ? "text-red-600" : "text-slate-900"}`}>
                    {row.percent === null ? "—" : `${row.percent}%`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

export default function StaffAttendance({ viewOnly = false }: { viewOnly?: boolean }) {
  return viewOnly ? <MonthReport /> : <Mark />;
}
