"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import AssignmentCard from "@/components/assignments/AssignmentCard";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:3000";

type AssignmentStatus =
  | "DRAFT"
  | "PUBLISHED"
  | "ARCHIVED";

type Assignment = {
  id: string;
  title: string;
  description?: string | null;
  status: AssignmentStatus;
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

type AssignmentResponse = {
  data: Assignment[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
};

function getToken() {
  if (typeof window === "undefined") {
    return "";
  }

  return (
    localStorage.getItem(
      "brx_access_token",
    ) ?? ""
  );
}

async function apiRequest<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const token = getToken();

  const response = await fetch(
    `${API_URL}${path}`,
    {
      ...options,
      headers: {
        "Content-Type":
          "application/json",

        ...(token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {}),

        ...(options?.headers ?? {}),
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    let message =
      "Something went wrong";

    try {
      const body =
        await response.json();

      if (Array.isArray(body?.message)) {
        message =
          body.message.join(", ");
      } else if (
        typeof body?.message === "string"
      ) {
        message = body.message;
      }
    } catch {
      // Ignore invalid JSON.
    }

    throw new Error(message);
  }

  return response.json();
}

export default function AssignmentsPage() {
  const [assignments, setAssignments] =
    useState<Assignment[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [status, setStatus] =
    useState<"ALL" | AssignmentStatus>(
      "ALL",
    );

  const [page, setPage] =
    useState(1);

  const [total, setTotal] =
    useState(0);

  const [totalPages, setTotalPages] =
    useState(1);

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const [publishingId, setPublishingId] =
    useState<string | null>(null);

  const loadAssignments =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        const params =
          new URLSearchParams();

        params.set(
          "page",
          String(page),
        );

        params.set(
          "limit",
          "12",
        );

        if (search.trim()) {
          params.set(
            "search",
            search.trim(),
          );
        }

        if (status !== "ALL") {
          params.set(
            "status",
            status,
          );
        }

        const result =
          await apiRequest<AssignmentResponse>(
            `/assignments?${params.toString()}`,
          );

        setAssignments(
          result.data ?? [],
        );

        setTotal(
          result.meta?.total ?? 0,
        );

        setTotalPages(
          result.meta?.totalPages ?? 1,
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load assignments",
        );
      } finally {
        setLoading(false);
      }
    }, [page, search, status]);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  const stats = useMemo(() => {
    const draft =
      assignments.filter(
        (item) =>
          item.status === "DRAFT",
      ).length;

    const published =
      assignments.filter(
        (item) =>
          item.status === "PUBLISHED",
      ).length;

    const archived =
      assignments.filter(
        (item) =>
          item.status === "ARCHIVED",
      ).length;

    return {
      draft,
      published,
      archived,
    };
  }, [assignments]);

  async function handleDelete(
    id: string,
  ) {
    const confirmed =
      window.confirm(
        "Delete this assignment permanently?",
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(id);
      setError("");

      await apiRequest(
        `/assignments/${id}`,
        {
          method: "DELETE",
        },
      );

      await loadAssignments();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete assignment",
      );
    } finally {
      setDeletingId(null);
    }
  }

  async function handlePublish(
    id: string,
  ) {
    try {
      setPublishingId(id);
      setError("");

      await apiRequest(
        `/assignments/${id}/publish`,
        {
          method: "POST",
        },
      );

      await loadAssignments();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to publish assignment",
      );
    } finally {
      setPublishingId(null);
    }
  }

  function changeStatus(
    value: "ALL" | AssignmentStatus,
  ) {
    setPage(1);
    setStatus(value);
  }

  return (
    <div className="min-h-[calc(100vh-100px)]">
      {/* Header */}
      <div className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-blue-400 shadow-[0_0_18px_rgba(96,165,250,0.9)]" />

            <span className="text-xs font-bold uppercase tracking-[0.2em] text-blue-300">
              Academic Workspace
            </span>
          </div>

          <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
            Assignments
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            Create, publish and manage
            academic assignments for your
            students.
          </p>
        </div>

        <Link
          href="/assignments/create"
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-950/30 transition hover:-translate-y-0.5 hover:from-blue-500 hover:to-violet-500"
        >
          <span className="text-lg">
            +
          </span>
          Create Assignment
        </Link>
      </div>

      {/* Stats */}
      <div className="mb-7 grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 backdrop-blur-xl">
          <p className="text-xs font-semibold text-slate-500">
            Total
          </p>

          <p className="mt-2 text-2xl font-black text-white">
            {total}
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-400/10 bg-emerald-400/[0.04] p-4 backdrop-blur-xl">
          <p className="text-xs font-semibold text-slate-500">
            Published
          </p>

          <p className="mt-2 text-2xl font-black text-emerald-300">
            {stats.published}
          </p>
        </div>

        <div className="rounded-2xl border border-amber-400/10 bg-amber-400/[0.04] p-4 backdrop-blur-xl">
          <p className="text-xs font-semibold text-slate-500">
            Draft
          </p>

          <p className="mt-2 text-2xl font-black text-amber-300">
            {stats.draft}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-400/10 bg-slate-400/[0.04] p-4 backdrop-blur-xl">
          <p className="text-xs font-semibold text-slate-500">
            Archived
          </p>

          <p className="mt-2 text-2xl font-black text-slate-300">
            {stats.archived}
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="mb-6 rounded-3xl border border-white/10 bg-white/[0.035] p-4 backdrop-blur-xl">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
              🔎
            </span>

            <input
              value={search}
              onChange={(event) => {
                setSearch(
                  event.target.value,
                );
                setPage(1);
              }}
              placeholder="Search assignments..."
              className="w-full rounded-2xl border border-white/10 bg-black/10 py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-400/30 focus:ring-2 focus:ring-blue-500/10"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto">
            {(
              [
                ["ALL", "All"],
                ["PUBLISHED", "Published"],
                ["DRAFT", "Draft"],
                ["ARCHIVED", "Archived"],
              ] as const
            ).map(
              ([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() =>
                    changeStatus(value)
                  }
                  className={`whitespace-nowrap rounded-2xl px-4 py-3 text-xs font-bold transition ${
                    status === value
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-950/30"
                      : "border border-white/10 bg-white/[0.03] text-slate-400 hover:bg-white/[0.07] hover:text-white"
                  }`}
                >
                  {label}
                </button>
              ),
            )}
          </div>

          <button
            type="button"
            onClick={loadAssignments}
            className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs font-bold text-slate-300 transition hover:bg-white/[0.07] hover:text-white"
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-300">
          <div className="flex items-start justify-between gap-4">
            <span>
              {error}
            </span>

            <button
              type="button"
              onClick={() =>
                setError("")
              }
              className="text-red-300/60 hover:text-red-200"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({
            length: 6,
          }).map((_, index) => (
            <div
              key={index}
              className="h-[300px] animate-pulse rounded-3xl border border-white/5 bg-white/[0.03]"
            />
          ))}
        </div>
      ) : assignments.length ===
        0 ? (
        /* Empty */
        <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-16 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-500/10 text-3xl">
            📚
          </div>

          <h2 className="mt-5 text-xl font-bold text-white">
            No assignments found
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            Create your first assignment
            and start managing student
            work from one place.
          </p>

          <Link
            href="/assignments/create"
            className="mt-6 inline-flex rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-500"
          >
            Create Assignment
          </Link>
        </div>
      ) : (
        <>
          {/* Cards */}
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {assignments.map(
              (assignment) => (
                <AssignmentCard
                  key={assignment.id}
                  assignment={assignment}
                  onDelete={
                    handleDelete
                  }
                  onPublish={
                    handlePublish
                  }
                  deleting={
                    deletingId ===
                    assignment.id
                  }
                  publishing={
                    publishingId ===
                    assignment.id
                  }
                />
              ),
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-between rounded-3xl border border-white/10 bg-white/[0.035] p-4">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() =>
                  setPage(
                    (current) =>
                      Math.max(
                        1,
                        current - 1,
                      ),
                  )
                }
                className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-bold text-slate-300 disabled:cursor-not-allowed disabled:opacity-30"
              >
                ← Previous
              </button>

              <span className="text-xs font-semibold text-slate-500">
                Page{" "}
                <span className="text-white">
                  {page}
                </span>{" "}
                of{" "}
                <span className="text-white">
                  {totalPages}
                </span>
              </span>

              <button
                type="button"
                disabled={
                  page >= totalPages
                }
                onClick={() =>
                  setPage(
                    (current) =>
                      Math.min(
                        totalPages,
                        current + 1,
                      ),
                  )
                }
                className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-bold text-slate-300 disabled:cursor-not-allowed disabled:opacity-30"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}