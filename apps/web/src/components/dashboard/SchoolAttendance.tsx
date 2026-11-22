"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "../../lib/api";
import AttendanceManagement, { localDate } from "./AttendanceManagement";

type Overview = {
  totals: {
    expected: number;
    present: number;
    absent: number;
    late: number;
    sectionsMarked: number;
    sections: number;
  };
  rows: {
    sectionId: string;
    label: string;
    expected: number;
    present: number;
    absent: number;
    late: number;
    marked: boolean;
    percent: number | null;
  }[];
};

type TrendDay = {
  date: string;
  present: number;
  absent: number;
  late: number;
  percent: number;
};

type Absentee = {
  studentId: string;
  name: string;
  brxUid: string;
  phone: string | null;
  className: string;
  sectionName: string;
  status: string;
};

type Low = {
  studentId: string;
  name: string;
  brxUid: string;
  phone: string | null;
  className: string;
  sectionName: string;
  days: number;
  absent: number;
  percent: number;
};

const card = "border border-slate-200 bg-white shadow-sm";

function Stat({ label, value, tone }: { label: string; value: string | number; tone: string }) {
  return (
    <div className={`${card} p-4`}>
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${tone}`}>{value}</p>
    </div>
  );
}

function TrendChart({ data }: { data: TrendDay[] }) {
  if (data.length === 0) {
    return <p className="p-6 text-sm text-slate-500">No attendance has been marked in the last 30 days.</p>;
  }

  const width = 720;
  const height = 180;
  const pad = 28;
  const step = (width - pad * 2) / Math.max(data.length, 1);
  const barWidth = Math.max(4, Math.min(22, step * 0.7));

  return (
    <div className="overflow-x-auto p-4">
      <svg viewBox={`0 0 ${width} ${height + 24}`} className="min-w-140 w-full" role="img" aria-label="Attendance percent for the last 30 days">
        {[0, 50, 100].map((tick) => {
          const y = height - (tick / 100) * (height - 10);

          return (
            <g key={tick}>
              <line x1={pad} x2={width - 8} y1={y} y2={y} stroke="#e2e8f0" />
              <text x={pad - 6} y={y + 3} textAnchor="end" fontSize="9" fill="#64748b">
                {tick}
              </text>
            </g>
          );
        })}
        {data.map((day, index) => {
          const barHeight = (day.percent / 100) * (height - 10);
          const x = pad + index * step + (step - barWidth) / 2;
          const color = day.percent >= 90 ? "#059669" : day.percent >= 75 ? "#d97706" : "#dc2626";

          return (
            <g key={day.date}>
              <rect x={x} y={height - barHeight} width={barWidth} height={barHeight} fill={color}>
                <title>{`${day.date}: ${day.percent}% (P ${day.present}, A ${day.absent}, L ${day.late})`}</title>
              </rect>
              {(index % Math.ceil(data.length / 8) === 0 || index === data.length - 1) && (
                <text x={x + barWidth / 2} y={height + 14} textAnchor="middle" fontSize="9" fill="#64748b">
                  {day.date.slice(8)}/{day.date.slice(5, 7)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function Report() {
  const [date, setDate] = useState(localDate());
  const [overview, setOverview] = useState<Overview | null>(null);
  const [absentees, setAbsentees] = useState<Absentee[]>([]);
  const [trend, setTrend] = useState<TrendDay[]>([]);
  const [low, setLow] = useState<Low[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const timer = window.setTimeout(() => {
      setError("");
      Promise.all([
        apiRequest<Overview>(`/attendance/overview?date=${date}`),
        apiRequest<Absentee[]>(`/attendance/absentees?date=${date}`),
        apiRequest<TrendDay[]>("/attendance/trend?days=30"),
        apiRequest<Low[]>("/attendance/low?below=75"),
      ])
        .then(([o, a, t, l]) => {
          if (cancelled) return;
          setOverview(o);
          setAbsentees(a);
          setTrend(t);
          setLow(l);
        })
        .catch((err) => {
          if (!cancelled) setError(err instanceof Error ? err.message : "Could not load the report.");
        });
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [date]);

  const totals = overview?.totals;
  const marked = totals ? totals.present + totals.absent + totals.late : 0;
  const percent = marked > 0 && totals ? Math.round(((totals.present + totals.late) / marked) * 1000) / 10 : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-xs font-semibold text-slate-500">
          Date
          <input
            type="date"
            value={date}
            max={localDate()}
            onChange={(event) => setDate(event.target.value || localDate())}
            className="mt-1 block h-9 border border-slate-300 bg-white px-3 text-sm font-normal outline-none focus:border-blue-600"
          />
        </label>
      </div>

      {error && <p className="bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {totals && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <Stat label="Present" value={totals.present} tone="text-emerald-700" />
          <Stat label="Absent" value={totals.absent} tone="text-red-700" />
          <Stat label="Late" value={totals.late} tone="text-amber-700" />
          <Stat label="Attendance %" value={percent === null ? "-" : `${percent}%`} tone="text-slate-900" />
          <Stat
            label="Classes marked"
            value={`${totals.sectionsMarked}/${totals.sections}`}
            tone={totals.sectionsMarked < totals.sections ? "text-amber-700" : "text-emerald-700"}
          />
        </div>
      )}

      <section className={card}>
        <h3 className="border-b border-slate-100 px-4 py-3 text-sm font-bold text-slate-900">Class-wise attendance</h3>
        {overview && overview.rows.filter((row) => row.expected > 0).length === 0 ? (
          <p className="p-6 text-sm text-slate-500">No students are enrolled in any class yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-150 text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2.5">Class</th>
                  <th className="px-4 py-2.5">Students</th>
                  <th className="px-4 py-2.5">Present</th>
                  <th className="px-4 py-2.5">Absent</th>
                  <th className="px-4 py-2.5">Late</th>
                  <th className="px-4 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {overview?.rows
                  .filter((row) => row.expected > 0)
                  .map((row) => (
                    <tr key={row.sectionId}>
                      <td className="px-4 py-2 font-semibold text-slate-900">{row.label}</td>
                      <td className="px-4 py-2">{row.expected}</td>
                      <td className="px-4 py-2 text-emerald-700">{row.marked ? row.present : "-"}</td>
                      <td className="px-4 py-2 text-red-700">{row.marked ? row.absent : "-"}</td>
                      <td className="px-4 py-2 text-amber-700">{row.marked ? row.late : "-"}</td>
                      <td className="px-4 py-2">
                        {row.marked ? (
                          <span className="inline-flex items-center gap-2">
                            <span className="h-1.5 w-20 bg-slate-100">
                              <span
                                className="block h-1.5 bg-emerald-600"
                                style={{ width: `${row.percent ?? 0}%` }}
                              />
                            </span>
                            <span className="text-xs font-semibold">{row.percent}%</span>
                          </span>
                        ) : (
                          <span className="bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">Not marked</span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className={card}>
        <h3 className="border-b border-slate-100 px-4 py-3 text-sm font-bold text-slate-900">Last 30 days</h3>
        <TrendChart data={trend} />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className={card}>
          <h3 className="border-b border-slate-100 px-4 py-3 text-sm font-bold text-slate-900">
            Absent / late on {date} ({absentees.length})
          </h3>
          {absentees.length === 0 ? (
            <p className="p-4 text-sm text-slate-500">Nobody is marked absent or late for this date.</p>
          ) : (
            <ul className="max-h-96 divide-y divide-slate-100 overflow-y-auto">
              {absentees.map((item) => (
                <li key={`${item.studentId}-${item.status}`} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900">{item.name}</p>
                    <p className="text-xs text-slate-500">
                      {item.className} - {item.sectionName} · {item.brxUid}
                      {item.phone ? ` · ${item.phone}` : ""}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 px-2 py-1 text-xs font-medium ${
                      item.status === "ABSENT" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {item.status === "ABSENT" ? "Absent" : "Late"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={card}>
          <h3 className="border-b border-slate-100 px-4 py-3 text-sm font-bold text-slate-900">
            Below 75% (last 30 days)
          </h3>
          {low.length === 0 ? (
            <p className="p-4 text-sm text-slate-500">No student is below 75% (needs at least 5 marked days).</p>
          ) : (
            <ul className="max-h-96 divide-y divide-slate-100 overflow-y-auto">
              {low.map((item) => (
                <li key={item.studentId} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900">{item.name}</p>
                    <p className="text-xs text-slate-500">
                      {item.className} - {item.sectionName} · absent {item.absent} of {item.days} days
                      {item.phone ? ` · ${item.phone}` : ""}
                    </p>
                  </div>
                  <span className="shrink-0 bg-red-50 px-2 py-1 text-xs font-bold text-red-700">{item.percent}%</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

export default function SchoolAttendance() {
  const [tab, setTab] = useState<"report" | "mark">("report");

  return (
    <div>
      <div className="mb-4 flex gap-1 border-b border-slate-200">
        {[
          ["report", "Report"],
          ["mark", "Mark attendance"],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key as "report" | "mark")}
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
      {tab === "report" ? <Report /> : <AttendanceManagement />}
    </div>
  );
}
