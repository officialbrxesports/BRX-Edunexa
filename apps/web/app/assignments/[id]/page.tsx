"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Assignment = {
  id: string;
  title: string;
  description?: string | null;
  status?: string;
  dueDate?: string | null;
  publishedAt?: string | null;
  createdAt?: string;
  teacher?: {
    id: string;
    firstName: string;
    lastName?: string | null;
  } | null;
  class?: {
    id: string;
    name: string;
    code?: string;
  } | null;
  section?: {
    id: string;
    name: string;
    code?: string;
  } | null;
  student?: {
    id: string;
    firstName: string;
    lastName?: string | null;
  } | null;
};

export default function AssignmentDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const id = params.id;

  useEffect(() => {
    async function loadAssignment() {
      const token = localStorage.getItem("brx_access_token");

      try {
        const response = await fetch(
          `http://localhost:3000/assignments/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!response.ok) {
          throw new Error("Assignment not found.");
        }

        const data = await response.json();
        setAssignment(data?.data ?? data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unable to load assignment.",
        );
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadAssignment();
    }
  }, [id]);

  async function publishAssignment() {
    const token = localStorage.getItem("brx_access_token");

    setPublishing(true);
    setError("");

    try {
      const response = await fetch(
        `http://localhost:3000/assignments/${id}/publish`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Unable to publish assignment.");
      }

      const data = await response.json();

      setAssignment(data?.data ?? data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to publish assignment.",
      );
    } finally {
      setPublishing(false);
    }
  }

  async function deleteAssignment() {
    const confirmed = window.confirm(
      "Are you sure you want to delete this assignment?",
    );

    if (!confirmed) return;

    const token = localStorage.getItem("brx_access_token");

    setDeleting(true);
    setError("");

    try {
      const response = await fetch(
        `http://localhost:3000/assignments/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Unable to delete assignment.");
      }

      router.push("/assignments");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to delete assignment.",
      );
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#070b18] p-6 text-white">
        <div className="mx-auto max-w-5xl animate-pulse">
          <div className="h-10 w-72 rounded bg-white/10" />
          <div className="mt-6 h-64 rounded-3xl bg-white/[0.05]" />
        </div>
      </main>
    );
  }

  if (error || !assignment) {
    return (
      <main className="min-h-screen bg-[#070b18] p-6 text-white">
        <div className="mx-auto max-w-3xl rounded-3xl border border-red-400/20 bg-red-500/10 p-8">
          <h1 className="text-2xl font-black">Assignment unavailable</h1>
          <p className="mt-3 text-sm text-red-300">
            {error || "Assignment could not be found."}
          </p>

          <button
            onClick={() => router.push("/assignments")}
            className="mt-6 rounded-xl bg-white/10 px-5 py-3 text-sm font-bold hover:bg-white/15"
          >
            Back to Assignments
          </button>
        </div>
      </main>
    );
  }

  const status = assignment.status || "DRAFT";

  return (
    <main className="min-h-screen bg-[#070b18] text-white">
      <div className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">
        <button
          onClick={() => router.push("/assignments")}
          className="mb-5 text-sm font-semibold text-slate-400 hover:text-white"
        >
          ← Assignments
        </button>

        {error && (
          <div className="mb-5 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/30 backdrop-blur-xl">
          <div className="border-b border-white/10 p-6 sm:p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="mb-3 flex flex-wrap gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      status === "PUBLISHED"
                        ? "bg-emerald-500/10 text-emerald-300"
                        : "bg-amber-500/10 text-amber-300"
                    }`}
                  >
                    {status}
                  </span>

                  {assignment.publishedAt && (
                    <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-300">
                      Published
                    </span>
                  )}
                </div>

                <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                  {assignment.title}
                </h1>

                <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">
                  {assignment.description || "No description provided."}
                </p>
              </div>

              <div className="flex gap-2">
                {status !== "PUBLISHED" && (
                  <button
                    onClick={publishAssignment}
                    disabled={publishing}
                    className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold hover:bg-emerald-500 disabled:opacity-50"
                  >
                    {publishing ? "Publishing..." : "Publish"}
                  </button>
                )}

                <button
                  onClick={() =>
                    router.push(`/assignments/${assignment.id}?edit=1`)
                  }
                  className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm font-bold hover:bg-white/[0.09]"
                >
                  Edit
                </button>

                <button
                  onClick={deleteAssignment}
                  disabled={deleting}
                  className="rounded-xl bg-red-500/10 px-4 py-2.5 text-sm font-bold text-red-300 hover:bg-red-500/20 disabled:opacity-50"
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>

          <div className="grid gap-px bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
            <InfoCard
              label="Teacher"
              value={
                assignment.teacher
                  ? `${assignment.teacher.firstName} ${assignment.teacher.lastName || ""}`
                  : "Not assigned"
              }
            />

            <InfoCard
              label="Class"
              value={
                assignment.class
                  ? `${assignment.class.name}${
                      assignment.section
                        ? ` • ${assignment.section.name}`
                        : ""
                    }`
                  : "All classes"
              }
            />

            <InfoCard
              label="Student"
              value={
                assignment.student
                  ? `${assignment.student.firstName} ${assignment.student.lastName || ""}`
                  : "Entire group"
              }
            />

            <InfoCard
              label="Due Date"
              value={
                assignment.dueDate
                  ? new Date(assignment.dueDate).toLocaleString()
                  : "No deadline"
              }
            />
          </div>

          <div className="border-t border-white/10 p-6 sm:p-8">
            <h2 className="text-lg font-bold">Assignment Timeline</h2>

            <div className="mt-6 space-y-4">
              <TimelineRow
                title="Created"
                value={
                  assignment.createdAt
                    ? new Date(assignment.createdAt).toLocaleString()
                    : "—"
                }
              />

              <TimelineRow
                title="Published"
                value={
                  assignment.publishedAt
                    ? new Date(assignment.publishedAt).toLocaleString()
                    : "Not published"
                }
              />

              <TimelineRow
                title="Deadline"
                value={
                  assignment.dueDate
                    ? new Date(assignment.dueDate).toLocaleString()
                    : "No deadline"
                }
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#0a0f20] p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <p className="mt-2 truncate text-sm font-bold text-white">{value}</p>
    </div>
  );
}

function TimelineRow({ title, value }: { title: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm font-semibold text-slate-300">{title}</span>
      <span className="text-sm text-slate-500">{value}</span>
    </div>
  );
}