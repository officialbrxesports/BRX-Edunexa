"use client";

import { useEffect, useMemo, useState } from "react";

type Result = {
  id: string;
  marks: number;
  maxMarks: number;
  grade?: string | null;
  remarks?: string | null;
  status: string;
  exam?: {
    id: string;
    title: string;
    examDate: string;
  } | null;
  student?: {
    id: string;
    firstName: string;
    lastName?: string | null;
    email: string;
  } | null;
};

export default function ResultsPage() {
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  async function loadResults() {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("accessToken");

      if (!token) {
        throw new Error("Please login first.");
      }

      const response = await fetch(
        "http://localhost:3000/exams/results",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            "Failed to load results.",
        );
      }

      const payload = data?.data ?? data;

      const list = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.items)
          ? payload.items
          : [];

      setResults(list);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load results.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadResults();
  }, []);

  const filteredResults = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return results;
    }

    return results.filter((result) =>
      [
        result.exam?.title,
        result.student?.firstName,
        result.student?.lastName,
        result.student?.email,
        result.grade,
        result.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [results, search]);

  const average = useMemo(() => {
    if (!results.length) {
      return 0;
    }

    const total = results.reduce((sum, result) => {
      if (!result.maxMarks) {
        return sum;
      }

      return sum + result.marks / result.maxMarks;
    }, 0);

    return (total / results.length) * 100;
  }, [results]);

  const passed = results.filter(
    (result) =>
      result.maxMarks > 0 &&
      result.marks / result.maxMarks >= 0.4,
  ).length;

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        <header>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-purple-400">
            BRX EduNexa
          </p>

          <h1 className="mt-2 text-4xl font-black">
            Results
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            View examination results and student performance.
          </p>
        </header>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Total Results"
            value={String(results.length)}
          />

          <StatCard
            label="Average"
            value={`${average.toFixed(1)}%`}
          />

          <StatCard
            label="Passed"
            value={`${passed}/${results.length}`}
          />
        </div>

        <div className="mt-8">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search student, exam or grade..."
            className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-purple-400/40"
          />
        </div>

        {error && (
          <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-400/10 p-5 text-sm text-red-300">
            {error}
          </div>
        )}

        <section className="mt-8 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl backdrop-blur-xl">
          {loading ? (
            <div className="p-12 text-center text-slate-400">
              Loading results...
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-5xl">📊</div>

              <h2 className="mt-4 text-xl font-bold">
                No results found
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Results will appear here after marks are entered.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left">
                <thead className="border-b border-white/10 bg-white/[0.03]">
                  <tr>
                    <th className="px-6 py-4 text-xs uppercase tracking-wider text-slate-500">
                      Student
                    </th>

                    <th className="px-6 py-4 text-xs uppercase tracking-wider text-slate-500">
                      Exam
                    </th>

                    <th className="px-6 py-4 text-xs uppercase tracking-wider text-slate-500">
                      Marks
                    </th>

                    <th className="px-6 py-4 text-xs uppercase tracking-wider text-slate-500">
                      Percentage
                    </th>

                    <th className="px-6 py-4 text-xs uppercase tracking-wider text-slate-500">
                      Grade
                    </th>

                    <th className="px-6 py-4 text-xs uppercase tracking-wider text-slate-500">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredResults.map((result) => {
                    const percentage =
                      result.maxMarks > 0
                        ? (result.marks / result.maxMarks) * 100
                        : 0;

                    const studentName = result.student
                      ? `${result.student.firstName} ${
                          result.student.lastName || ""
                        }`.trim()
                      : "Unknown Student";

                    return (
                      <tr
                        key={result.id}
                        className="border-b border-white/5 transition hover:bg-white/[0.03]"
                      >
                        <td className="px-6 py-5">
                          <p className="font-semibold text-white">
                            {studentName}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {result.student?.email || "—"}
                          </p>
                        </td>

                        <td className="px-6 py-5">
                          <p className="font-medium text-slate-200">
                            {result.exam?.title || "Unknown Exam"}
                          </p>

                          {result.exam?.examDate && (
                            <p className="mt-1 text-xs text-slate-500">
                              {new Date(
                                result.exam.examDate,
                              ).toLocaleDateString()}
                            </p>
                          )}
                        </td>

                        <td className="px-6 py-5 font-bold">
                          {result.marks} / {result.maxMarks}
                        </td>

                        <td className="px-6 py-5">
                          <span
                            className={
                              percentage >= 40
                                ? "font-semibold text-emerald-300"
                                : "font-semibold text-red-300"
                            }
                          >
                            {percentage.toFixed(1)}%
                          </span>
                        </td>

                        <td className="px-6 py-5">
                          <span className="rounded-full bg-purple-500/10 px-3 py-1 text-xs font-bold text-purple-300">
                            {result.grade || "—"}
                          </span>
                        </td>

                        <td className="px-6 py-5">
                          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs">
                            {result.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
      <p className="text-xs uppercase tracking-wider text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-3xl font-black text-white">
        {value}
      </p>
    </div>
  );
}