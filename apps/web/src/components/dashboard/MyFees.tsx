"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "../../lib/api";

type Data = {
  students: {
    id: string;
    name: string;
    totalDue: number;
    fees: {
      id: string;
      total: number;
      paid: number;
      due: number;
      dueDate: string;
      status: string;
    }[];
  }[];
};

const inr = (value: number) =>
  `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

export default function MyFees({ showName }: { showName?: boolean }) {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiRequest<Data>("/my-fees")
      .then(setData)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Could not load fees."),
      );
  }, []);

  if (error) return <p className="p-5 text-sm text-red-600">{error}</p>;
  if (!data) return <p className="p-5 text-sm text-slate-500">Loading…</p>;

  const shown = data.students.filter((item) => item.fees.length > 0);

  if (shown.length === 0) {
    return <p className="p-5 text-sm text-slate-500">No fee has been added yet.</p>;
  }

  return (
    <div className="divide-y divide-slate-100">
      {shown.map((student) => (
        <div key={student.id} className="p-4">
          <p className="text-xs font-bold text-slate-700">
            {showName ? `${student.name} · ` : ""}
            {student.totalDue > 0 ? `${inr(student.totalDue)} pending` : "All paid"}
          </p>
          <ul className="mt-2 divide-y divide-slate-100 text-sm">
            {student.fees.map((fee) => (
              <li key={fee.id} className="flex flex-wrap justify-between gap-2 py-2">
                <span>
                  {inr(fee.total)} · due {new Date(fee.dueDate).toLocaleDateString()}
                </span>
                <span
                  className={
                    fee.status === "PAID"
                      ? "text-emerald-700"
                      : fee.status === "OVERDUE"
                        ? "font-semibold text-red-600"
                        : "text-slate-600"
                  }
                >
                  {fee.status === "PAID"
                    ? "Paid"
                    : `${inr(fee.due)} left · ${fee.status.toLowerCase()}`}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
