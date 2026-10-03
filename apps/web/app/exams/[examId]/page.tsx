"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type Exam = {
  id: string;
  title: string;
  description?: string | null;
  examDate: string;
  totalMarks: number;
  passingMarks: number;
  status: string;
  class?: {
    id?: string;
    name: string;
  } | null;
  section?: {
    id?: string;
    name: string;
    code: string;
  } | null;
};

export default function ExamDetailsPage() {
  const params = useParams();
  const examId = params.examId as string;

  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!examId) {
      return;
    }

    async function loadExam() {
      try {
        const token = localStorage.getItem("accessToken");

        if (!token) {
          throw new Error("Please login first.");
        }

        const response = await fetch(
          `/api/exams/${examId}`,
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
              "Failed to load examination.",
          );
        }

        setExam(data?.data ?? data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load examination.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadExam();
  }, [examId]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 p-8 text-white">
        <div className="mx-auto max-w-6xl">
          <p className="text-slate-400">
            Loading examination...
          </p>
        </div>
      </main>
    );
  }

  if (error || !exam) {
    return (
      <main className="min-h-screen bg-slate-950 p-8 text-white">
        <div className="mx-auto max-w-6xl">
          <Link
            href="/exams"
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            ← Back to Exams
          </Link>

          <div className="mt-6 rounded-3xl border border-red-400/20 bg-red-400/10 p-6">
            <h1 className="text-xl font-bold">
              Unable to load examination
            </h1>

            <p className="mt-2 text-sm text-red-300">
              {error || "Examination not found."}
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/exams"
          className="text-sm text-blue-400 hover:text-blue-300"
        >
          ← Back to Exams
        </Link>

        <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">
                Exam Details
              </p>

              <h1 className="mt-2 text-3xl font-black">
                {exam.title}
              </h1>

              {exam.description && (
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
                  {exam.description}
                </p>
              )}
            </div>

            <span className="w-fit rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-bold">
              {exam.status}
            </span>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <InfoCard
              label="Exam Date"
              value={new Date(
                exam.examDate,
              ).toLocaleDateString()}
            />

            <InfoCard
              label="Total Marks"
              value={String(exam.totalMarks)}
            />

            <InfoCard
              label="Passing Marks"
              value={String(exam.passingMarks)}
            />

            <InfoCard
              label="Class"
              value={exam.class?.name || "All Classes"}
            />
          </div>

          {exam.section && (
            <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5">
              <p className="text-xs uppercase tracking-wider text-slate-500">
                Section
              </p>

              <p className="mt-1 text-lg font-bold">
                {exam.section.name}
              </p>

              <p className="mt-1 text-sm text-slate-400">
                Code: {exam.section.code}
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
      <p className="text-xs uppercase tracking-wider text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-lg font-bold text-white">
        {value}
      </p>
    </div>
  );
}