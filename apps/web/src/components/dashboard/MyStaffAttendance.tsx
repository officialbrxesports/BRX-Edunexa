"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "../../lib/api";

type Data = {
  month: string;
  present: number;
  late: number;
  absent: number;
  percent: number | null;
  recent: { date: string; status: string }[];
};

export default function MyStaffAttendance() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiRequest<Data>("/my-staff-attendance")
      .then(setData)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Could not load attendance."),
      );
  }, []);

  if (error) return <p className="p-5 text-sm text-red-600">{error}</p>;
  if (!data) return <p className="p-5 text-sm text-slate-500">Loading…</p>;

  if (data.percent === null) {
    return <p className="p-5 text-sm text-slate-500">No attendance marked for you this month yet.</p>;
  }

  return (
    <div className="p-4">
      <p className="text-3xl font-bold text-slate-900">{data.percent}%</p>
      <p className="text-xs text-slate-500">
        Present {data.present} · Late {data.late} · Absent {data.absent} (this month)
      </p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {data.recent.map((item) => (
          <span
            key={item.date}
            title={item.status}
            className={`px-2 py-1 text-[11px] font-semibold text-white ${
              item.status === "PRESENT"
                ? "bg-emerald-600"
                : item.status === "LATE"
                  ? "bg-amber-500"
                  : "bg-red-600"
            }`}
          >
            {new Date(item.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
          </span>
        ))}
      </div>
    </div>
  );
}
