"use client";

import Link from "next/link";

export type ExamCardData = {
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

function getStatusClass(status: string) {
  switch (status) {
    case "PUBLISHED":
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";

    case "COMPLETED":
      return "border-blue-400/20 bg-blue-400/10 text-blue-300";

    case "CANCELLED":
      return "border-red-400/20 bg-red-400/10 text-red-300";

    default:
      return "border-amber-400/20 bg-amber-400/10 text-amber-300";
  }
}

export default function ExamCard({
  exam,
}: {
  exam: ExamCardData;
}) {
  return (
    <article className="group rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-xl backdrop-blur-xl transition hover:-translate-y-1 hover:border-blue-400/30 hover:bg-white/[0.06]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">
            Examination
          </p>

          <h2 className="mt-2 truncate text-xl font-bold text-white">
            {exam.title}
          </h2>
        </div>

        <span
          className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-bold ${getStatusClass(
            exam.status,
          )}`}
        >
          {exam.status}
        </span>
      </div>

      {exam.description && (
        <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-400">
          {exam.description}
        </p>
      )}

      <div className="mt-5 grid grid-cols-2 gap-3">
        <Info
          label="Exam Date"
          value={new Date(
            exam.examDate,
          ).toLocaleDateString()}
        />

        <Info
          label="Total Marks"
          value={String(exam.totalMarks)}
        />

        <Info
          label="Passing"
          value={String(exam.passingMarks)}
        />

        <Info
          label="Class"
          value={exam.class?.name || "All"}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {exam.class?.name && (
          <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs text-blue-300">
            {exam.class.name}
          </span>
        )}

        {exam.section?.name && (
          <span className="rounded-full bg-purple-500/10 px-3 py-1 text-xs text-purple-300">
            Section {exam.section.name}
          </span>
        )}
      </div>

      <Link
        href={`/exams/${exam.id}`}
        className="mt-5 block rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center text-sm font-bold text-white transition hover:bg-white/10"
      >
        View Examination →
      </Link>
    </article>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-sm font-bold text-white">
        {value}
      </p>
    </div>
  );
}