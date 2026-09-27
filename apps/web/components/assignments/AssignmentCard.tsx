"use client";

import Link from "next/link";

type Assignment = {
  id: string;
  title: string;
  description?: string | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  dueDate?: string | null;
  publishedAt?: string | null;

  teacher?: {
    id: string;
    firstName: string;
    lastName?: string | null;
    email: string;
  } | null;

  class?: {
    id: string;
    name: string;
    code: string;
  } | null;

  section?: {
    id: string;
    name: string;
    code: string;
  } | null;

  student?: {
    id: string;
    firstName: string;
    lastName?: string | null;
    email: string;
  } | null;
};

type Props = {
  assignment: Assignment;
  onDelete?: (id: string) => void;
  onPublish?: (id: string) => void;
  deleting?: boolean;
  publishing?: boolean;
};

function getStatusStyle(status: Assignment["status"]) {
  switch (status) {
    case "PUBLISHED":
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";

    case "ARCHIVED":
      return "border-slate-400/20 bg-slate-400/10 text-slate-300";

    default:
      return "border-amber-400/20 bg-amber-400/10 text-amber-300";
  }
}

function formatDate(value?: string | null) {
  if (!value) return "No due date";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function isOverdue(
  dueDate?: string | null,
  status?: Assignment["status"],
) {
  if (!dueDate || status === "ARCHIVED") {
    return false;
  }

  return new Date(dueDate).getTime() < Date.now();
}

export default function AssignmentCard({
  assignment,
  onDelete,
  onPublish,
  deleting = false,
  publishing = false,
}: Props) {
  const overdue = isOverdue(
    assignment.dueDate,
    assignment.status,
  );

  const teacherName = assignment.teacher
    ? `${assignment.teacher.firstName} ${
        assignment.teacher.lastName ?? ""
      }`.trim()
    : "Unknown teacher";

  const studentName = assignment.student
    ? `${assignment.student.firstName} ${
        assignment.student.lastName ?? ""
      }`.trim()
    : null;

  return (
    <article className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] p-5 shadow-[0_20px_70px_rgba(0,0,0,0.18)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-blue-400/20 hover:bg-white/[0.055]">
      {/* Glow */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-32 w-32 rounded-full bg-blue-500/10 blur-3xl transition group-hover:bg-blue-500/20" />

      <div className="relative">
        {/* Top */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full border px-2.5 py-1 text-[10px] font-bold tracking-wide ${getStatusStyle(
                  assignment.status,
                )}`}
              >
                {assignment.status}
              </span>

              {overdue && (
                <span className="rounded-full border border-red-400/20 bg-red-400/10 px-2.5 py-1 text-[10px] font-bold text-red-300">
                  OVERDUE
                </span>
              )}
            </div>

            <h3 className="line-clamp-2 text-lg font-bold tracking-tight text-white">
              {assignment.title}
            </h3>
          </div>

          <div className="rounded-2xl border border-blue-400/10 bg-blue-400/10 p-3 text-blue-300">
            📚
          </div>
        </div>

        {/* Description */}
        {assignment.description && (
          <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-400">
            {assignment.description}
          </p>
        )}

        {/* Target */}
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/5 bg-black/10 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Target
            </p>

            <p className="mt-1 text-sm font-semibold text-slate-200">
              {studentName
                ? studentName
                : assignment.section
                  ? `${assignment.class?.name ?? "Class"} • ${assignment.section.name}`
                  : assignment.class
                    ? assignment.class.name
                    : "General"}
            </p>
          </div>

          <div className="rounded-2xl border border-white/5 bg-black/10 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Due date
            </p>

            <p
              className={`mt-1 text-sm font-semibold ${
                overdue
                  ? "text-red-300"
                  : "text-slate-200"
              }`}
            >
              {formatDate(assignment.dueDate)}
            </p>
          </div>
        </div>

        {/* Teacher */}
        <div className="mt-4 flex items-center gap-3 border-t border-white/5 pt-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-violet-500/20 text-sm">
            👨‍🏫
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-wider text-slate-500">
              Created by
            </p>

            <p className="truncate text-sm font-semibold text-slate-200">
              {teacherName}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            href={`/assignments/${assignment.id}`}
            className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-slate-200 transition hover:bg-white/[0.08]"
          >
            View
          </Link>

          <Link
            href={`/assignments/${assignment.id}?edit=1`}
            className="rounded-xl border border-blue-400/10 bg-blue-500/10 px-3 py-2 text-xs font-bold text-blue-300 transition hover:bg-blue-500/20"
          >
            Edit
          </Link>

          {assignment.status === "DRAFT" &&
            onPublish && (
              <button
                type="button"
                disabled={publishing}
                onClick={() =>
                  onPublish(assignment.id)
                }
                className="rounded-xl border border-emerald-400/10 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-300 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {publishing
                  ? "Publishing..."
                  : "Publish"}
              </button>
            )}

          {onDelete && (
            <button
              type="button"
              disabled={deleting}
              onClick={() =>
                onDelete(assignment.id)
              }
              className="rounded-xl border border-red-400/10 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {deleting
                ? "Deleting..."
                : "Delete"}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}