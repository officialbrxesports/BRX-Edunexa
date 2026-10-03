"use client";

import { useEffect, useMemo, useState } from "react";
import ExamCard, {
  ExamCardData,
} from "@/components/exams/ExamCard";
import CreateExamForm from "@/components/exams/CreateExamForm";

export default function ExamsPage() {
  const [exams, setExams] = useState<ExamCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  async function loadExams() {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("accessToken");

      if (!token) {
        throw new Error("Please login first.");
      }

      const response = await fetch("/api/exams", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            "Failed to load examinations.",
        );
      }

      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data?.data)
            ? data.data
            : [];

      setExams(list);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load examinations.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadExams();
  }, []);

  const filteredExams = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return exams;
    }

    return exams.filter((exam) =>
      [
        exam.title,
        exam.description,
        exam.status,
        exam.class?.name,
        exam.section?.name,
        exam.section?.code,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [exams, search]);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-400">
              BRX EduNexa
            </p>

            <h1 className="mt-2 text-4xl font-black tracking-tight">
              Examinations
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Create, manage and monitor examinations for your institution.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowCreate((value) => !value)}
            className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-950/30 transition hover:bg-blue-500"
          >
            {showCreate ? "Close Form" : "+ Create Exam"}
          </button>
        </header>

        {showCreate && (
          <div className="mt-8">
            <CreateExamForm
              onCreated={() => {
                setShowCreate(false);
                loadExams();
              }}
            />
          </div>
        )}

        <section className="mt-8 flex flex-col gap-3 sm:flex-row">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search examination..."
            className="flex-1 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-400/40"
          />

          <div className="flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm text-slate-300">
            {filteredExams.length}{" "}
            {filteredExams.length === 1 ? "Exam" : "Exams"}
          </div>
        </section>

        {error && (
          <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-400/10 p-5 text-sm text-red-300">
            {error}
          </div>
        )}

        {loading ? (
          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-72 animate-pulse rounded-3xl border border-white/10 bg-white/[0.04]"
              />
            ))}
          </div>
        ) : filteredExams.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-dashed border-white/10 bg-white/[0.03] p-14 text-center">
            <div className="text-5xl">📚</div>

            <h2 className="mt-4 text-xl font-bold">
              No examinations found
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              Create your first examination or change your search.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredExams.map((exam) => (
              <ExamCard key={exam.id} exam={exam} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}