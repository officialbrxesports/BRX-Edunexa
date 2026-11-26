"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "../../lib/api";

type Row = {
  examId: string;
  title: string;
  examDate: string;
  totalMarks: number;
  marks: number;
  percent: number;
  grade: string;
  pass: boolean;
  rank: number;
  appeared: number;
};

type Data = { students: { id: string; name: string; results: Row[] }[] };

export default function MyResults({ showName }: { showName?: boolean }) {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiRequest<Data>("/my-results")
      .then(setData)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Could not load results."),
      );
  }, []);

  if (error) return <p className="p-5 text-sm text-red-600">{error}</p>;
  if (!data) return <p className="p-5 text-sm text-slate-500">Loading…</p>;

  const shown = data.students.filter((s) => s.results.length > 0);

  if (shown.length === 0) {
    return (
      <p className="p-5 text-sm text-slate-500">
        No exam result has been published yet.
      </p>
    );
  }

  return (
    <div className="divide-y divide-slate-100">
      {shown.map((student) => (
        <div key={student.id} className="p-4">
          {showName && (
            <p className="mb-2 text-xs font-bold text-slate-700">{student.name}</p>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-slate-500">
                <tr>
                  <th className="py-1 pr-3 font-semibold">Exam</th>
                  <th className="py-1 pr-3 font-semibold">Marks</th>
                  <th className="py-1 pr-3 font-semibold">%</th>
                  <th className="py-1 pr-3 font-semibold">Grade</th>
                  <th className="py-1 font-semibold">Rank</th>
                </tr>
              </thead>
              <tbody>
                {student.results.map((row) => (
                  <tr key={row.examId} className="border-t border-slate-100">
                    <td className="py-2 pr-3">
                      <p className="font-semibold text-slate-900">{row.title}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(row.examDate).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="py-2 pr-3">
                      {row.marks}/{row.totalMarks}
                    </td>
                    <td className="py-2 pr-3">{row.percent}%</td>
                    <td
                      className={`py-2 pr-3 font-bold ${row.pass ? "text-emerald-700" : "text-red-600"}`}
                    >
                      {row.grade}
                    </td>
                    <td className="py-2">
                      {row.rank} / {row.appeared}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
