"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Check,
  KeyRound,
  LogOut,
  ShieldCheck,
  X,
} from "lucide-react";
import { API_URL, apiRequest } from "../../lib/api";

type InstitutionRow = {
  id: string;
  name: string;
  code: string;
  type: string;
  status: "ACTIVE" | "PENDING" | "SUSPENDED";
  state: string;
  country: string;
  email: string | null;
  phone: string | null;
  createdAt: string;
  userCount: number;
  head: { name: string; email: string } | null;
};

const STATUS_STYLE: Record<string, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-800",
  PENDING: "bg-amber-50 text-amber-800",
  SUSPENDED: "bg-red-50 text-red-800",
};

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
}

export default function PlatformAdminHome() {
  const router = useRouter();
  const [rows, setRows] = useState<InstitutionRow[] | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyId, setBusyId] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await apiRequest<InstitutionRow[]>("/admin/institutions", {
        cache: "no-store",
      });
      setRows(data);
      setError("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load institutions.",
      );
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function decide(row: InstitutionRow, action: "approve" | "reject") {
    if (busyId) return;

    if (
      action === "reject" &&
      !window.confirm(`Reject "${row.name}"? It will be suspended.`)
    ) {
      return;
    }

    setBusyId(row.id);
    setNotice("");
    setError("");

    try {
      await apiRequest(`/admin/institutions/${row.id}/${action}`, {
        method: "PATCH",
      });
      setNotice(
        action === "approve"
          ? `${row.name} approved. Its head can now sign in.`
          : `${row.name} rejected.`,
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setBusyId("");
    }
  }

  async function logout() {
    if (loggingOut) return;
    setLoggingOut(true);

    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      });
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  const pending = (rows ?? []).filter((row) => row.status === "PENDING");
  const active = (rows ?? []).filter((row) => row.status === "ACTIVE").length;
  const suspended = (rows ?? []).filter(
    (row) => row.status === "SUSPENDED",
  ).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="sticky top-0 z-30 border-b border-blue-900 bg-[#193f88] text-white">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <span className="flex h-8 w-8 items-center justify-center bg-white text-blue-800">
              <Building2 size={18} />
            </span>
            BRX EduNexa
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/change-password"
              className="flex h-8 items-center gap-1.5 bg-white/10 px-2.5 text-xs font-semibold hover:bg-white/20"
            >
              <KeyRound size={14} />
              <span className="hidden sm:inline">Change password</span>
            </Link>
            <button
              type="button"
              onClick={logout}
              disabled={loggingOut}
              title="Logout"
              className="flex h-8 w-8 items-center justify-center hover:bg-white/10 disabled:opacity-50"
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-5 px-4 py-6">
        <div className="flex items-center gap-4 border border-slate-200 bg-white p-5 shadow-sm">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center bg-blue-50 text-blue-800">
            <ShieldCheck size={24} />
          </span>
          <div>
            <h1 className="text-lg font-bold text-slate-900">
              Platform Admin
            </h1>
            <p className="text-sm text-slate-500">
              Approve new institutions and see everyone on the platform.
            </p>
          </div>
        </div>

        {error && (
          <p
            role="alert"
            className="border border-red-200 bg-red-50 p-3 text-sm text-red-800"
          >
            {error}
          </p>
        )}
        {notice && (
          <p
            role="status"
            className="border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"
          >
            {notice}
          </p>
        )}

        {!rows && !error && (
          <p className="text-sm text-slate-500">Loading...</p>
        )}

        {rows && (
          <>
            <div className="grid grid-cols-3 gap-3">
              {[
                ["Waiting for approval", pending.length],
                ["Active institutions", active],
                ["Rejected / suspended", suspended],
              ].map(([label, value]) => (
                <div
                  key={String(label)}
                  className="border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <p className="text-2xl font-bold text-slate-900">{value}</p>
                  <p className="text-xs text-slate-500">{label}</p>
                </div>
              ))}
            </div>

            <section className="border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-4 py-3">
                <h2 className="text-sm font-bold text-slate-900">
                  Waiting for approval
                </h2>
              </div>

              {pending.length === 0 ? (
                <p className="p-5 text-sm text-slate-500">
                  No institution is waiting for approval.
                </p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {pending.map((row) => (
                    <li
                      key={row.id}
                      className="flex flex-wrap items-center justify-between gap-3 p-4"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900">
                          {row.name}{" "}
                          <span className="text-xs font-medium text-slate-500">
                            {row.type} · {row.code}
                          </span>
                        </p>
                        <p className="text-sm text-slate-500">
                          {[row.state, row.country].filter(Boolean).join(", ")}
                          {row.head
                            ? ` · Head: ${row.head.name} (${row.head.email})`
                            : ""}
                        </p>
                        <p className="text-xs text-slate-400">
                          Applied {formatDate(row.createdAt)}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={busyId === row.id}
                          onClick={() => decide(row, "approve")}
                          className="flex h-9 items-center gap-1.5 bg-emerald-600 px-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                          <Check size={15} /> Approve
                        </button>
                        <button
                          type="button"
                          disabled={busyId === row.id}
                          onClick={() => decide(row, "reject")}
                          className="flex h-9 items-center gap-1.5 border border-red-300 px-3 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                        >
                          <X size={15} /> Reject
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-4 py-3">
                <h2 className="text-sm font-bold text-slate-900">
                  All institutions
                </h2>
              </div>

              {rows.length === 0 ? (
                <p className="p-5 text-sm text-slate-500">
                  No institution has registered yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px] text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                      <tr>
                        <th className="px-4 py-2">Name</th>
                        <th className="px-4 py-2">Type</th>
                        <th className="px-4 py-2">Status</th>
                        <th className="px-4 py-2">Users</th>
                        <th className="px-4 py-2">Applied</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rows.map((row) => (
                        <tr key={row.id}>
                          <td className="px-4 py-2.5 font-medium text-slate-900">
                            {row.name}
                            <span className="block text-xs font-normal text-slate-400">
                              {row.code}
                            </span>
                          </td>
                          <td className="px-4 py-2.5">{row.type}</td>
                          <td className="px-4 py-2.5">
                            <span
                              className={`px-2 py-0.5 text-xs font-semibold ${STATUS_STYLE[row.status] ?? ""}`}
                            >
                              {row.status}
                            </span>
                          </td>
                          <td className="px-4 py-2.5">{row.userCount}</td>
                          <td className="px-4 py-2.5">
                            {formatDate(row.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
