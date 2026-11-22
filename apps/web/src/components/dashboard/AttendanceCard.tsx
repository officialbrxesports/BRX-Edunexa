"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "../../lib/api";
import { localDate } from "./AttendanceManagement";

type Summary = {
  day: { present: number; absent: number; late: number; expected: number };
  month: { records: number; percent: number | null };
};

export default function AttendanceCard() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    apiRequest<Summary>(`/attendance/summary?date=${localDate()}`)
      .then((data) => {
        if (!cancelled) setSummary(data);
      })
      .catch((err) => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Could not load attendance.");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const marked = summary
    ? summary.day.present + summary.day.absent + summary.day.late
    : 0;

  return (
    <section className="mt-6 border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-4 py-3">
        <h2 className="text-sm font-bold text-slate-900">Attendance today</h2>
      </div>
      {error ? (
        <p className="p-4 text-sm text-red-700">{error}</p>
      ) : !summary ? (
        <p className="p-4 text-sm text-slate-500">Loading...</p>
      ) : marked === 0 ? (
        <p className="p-4 text-sm text-slate-500">
          Not marked yet today. Open the Attendance section to mark it.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-px bg-slate-100 sm:grid-cols-4">
          {[
            ["Present", summary.day.present],
            ["Absent", summary.day.absent],
            ["Late", summary.day.late],
            [
              "This month",
              summary.month.percent === null ? "-" : `${summary.month.percent}%`,
            ],
          ].map(([label, value]) => (
            <div key={label} className="bg-white p-4">
              <p className="text-xs font-semibold text-slate-500">{label}</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
