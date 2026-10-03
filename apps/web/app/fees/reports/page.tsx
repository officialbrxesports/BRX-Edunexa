"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Payment = {
  id: string;
  amount: number | string;
  paymentMethod: string;
  paymentDate?: string;
};

type Fee = {
  id: string;
  totalAmount: number | string;
  paidAmount: number | string;
  dueAmount: number | string;
  dueDate: string;
  status: "PENDING" | "PARTIAL" | "PAID" | "OVERDUE";

  student?: {
    firstName: string;
    lastName?: string | null;
  };

  class?: {
    id: string;
    name: string;
    code: string;
  };

  section?: {
    id: string;
    name: string;
    code: string;
  };

  payments?: Payment[];
};

const API_URL = "/api";

function getToken() {
  if (typeof window === "undefined") {
    return "";
  }

  return localStorage.getItem("accessToken") ?? "";
}

function money(value: number | string) {
  return `₹${Number(value).toLocaleString("en-IN")}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function statusClass(status: Fee["status"]) {
  switch (status) {
    case "PAID":
      return "bg-green-100 text-green-700";

    case "PARTIAL":
      return "bg-yellow-100 text-yellow-700";

    case "OVERDUE":
      return "bg-red-100 text-red-700";

    default:
      return "bg-blue-100 text-blue-700";
  }
}

export default function FeeReportsPage() {
  const [fees, setFees] = useState<Fee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [statusFilter, setStatusFilter] =
    useState("ALL");

  const [search, setSearch] = useState("");

  async function fetchFees() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/academics/fees`,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error(
          "Failed to load fee reports",
        );
      }

      const data = await response.json();

      setFees(
        Array.isArray(data)
          ? data
          : data.fees ?? [],
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchFees();
  }, []);

  const filteredFees = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    return fees.filter((fee) => {
      const studentName = fee.student
        ? `${fee.student.firstName} ${
            fee.student.lastName ?? ""
          }`.trim()
        : "";

      const matchesSearch =
        !query ||
        studentName
          .toLowerCase()
          .includes(query) ||
        fee.class?.name
          ?.toLowerCase()
          .includes(query) ||
        fee.id
          .toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === "ALL" ||
        fee.status === statusFilter;

      return (
        matchesSearch &&
        matchesStatus
      );
    });
  }, [
    fees,
    search,
    statusFilter,
  ]);

  const summary = useMemo(() => {
    return filteredFees.reduce(
      (result, fee) => {
        result.total += Number(
          fee.totalAmount,
        );

        result.paid += Number(
          fee.paidAmount,
        );

        result.due += Number(
          fee.dueAmount,
        );

        if (fee.status === "PAID") {
          result.paidCount++;
        }

        if (fee.status === "PARTIAL") {
          result.partialCount++;
        }

        if (fee.status === "PENDING") {
          result.pendingCount++;
        }

        if (fee.status === "OVERDUE") {
          result.overdueCount++;
        }

        return result;
      },
      {
        total: 0,
        paid: 0,
        due: 0,
        paidCount: 0,
        partialCount: 0,
        pendingCount: 0,
        overdueCount: 0,
      },
    );
  }, [filteredFees]);

  const collectionPercentage =
    summary.total > 0
      ? Math.round(
          (summary.paid /
            summary.total) *
            100,
        )
      : 0;

  const classReport = useMemo(() => {
    const map = new Map<
      string,
      {
        name: string;
        total: number;
        paid: number;
        due: number;
        count: number;
      }
    >();

    for (const fee of filteredFees) {
      const key =
        fee.class?.id ??
        "unknown";

      const existing =
        map.get(key) ?? {
          name:
            fee.class?.name ??
            "Unknown Class",
          total: 0,
          paid: 0,
          due: 0,
          count: 0,
        };

      existing.total += Number(
        fee.totalAmount,
      );

      existing.paid += Number(
        fee.paidAmount,
      );

      existing.due += Number(
        fee.dueAmount,
      );

      existing.count++;

      map.set(key, existing);
    }

    return Array.from(
      map.values(),
    ).sort(
      (a, b) =>
        b.total - a.total,
    );
  }, [filteredFees]);

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Header */}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Fee Reports
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Collection, outstanding and fee status
              analytics
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/fees"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              ← Fees
            </Link>

            <Link
              href="/fees/payments"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Payments
            </Link>

            <button
              onClick={() => window.print()}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 print:hidden"
            >
              🖨️ Print Report
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Main summary */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Total Fee
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-900">
              {money(summary.total)}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Collected
            </p>

            <p className="mt-2 text-2xl font-bold text-green-600">
              {money(summary.paid)}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Outstanding
            </p>

            <p className="mt-2 text-2xl font-bold text-red-600">
              {money(summary.due)}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Collection Rate
            </p>

            <p className="mt-2 text-2xl font-bold text-blue-600">
              {collectionPercentage}%
            </p>
          </div>
        </div>

        {/* Status cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Paid
            </p>

            <p className="mt-2 text-2xl font-bold text-green-600">
              {summary.paidCount}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Partial
            </p>

            <p className="mt-2 text-2xl font-bold text-yellow-600">
              {summary.partialCount}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Pending
            </p>

            <p className="mt-2 text-2xl font-bold text-blue-600">
              {summary.pendingCount}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Overdue
            </p>

            <p className="mt-2 text-2xl font-bold text-red-600">
              {summary.overdueCount}
            </p>
          </div>
        </div>

        {/* Collection progress */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-900">
              Collection Progress
            </h2>

            <span className="font-bold text-blue-600">
              {collectionPercentage}%
            </span>
          </div>

          <div className="mt-4 h-4 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-blue-600 transition-all"
              style={{
                width: `${collectionPercentage}%`,
              }}
            />
          </div>

          <div className="mt-3 flex justify-between text-xs text-slate-500">
            <span>
              Collected {money(summary.paid)}
            </span>

            <span>
              Due {money(summary.due)}
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="grid gap-3 md:grid-cols-2">

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
              placeholder="Search student, class or fee ID..."
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm outline-none focus:border-slate-500"
            />

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value,
                )
              }
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
            >
              <option value="ALL">
                All Status
              </option>

              <option value="PAID">
                Paid
              </option>

              <option value="PARTIAL">
                Partial
              </option>

              <option value="PENDING">
                Pending
              </option>

              <option value="OVERDUE">
                Overdue
              </option>
            </select>
          </div>
        </div>

        {/* Class report */}
        <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
          <div className="border-b px-5 py-4">
            <h2 className="font-bold text-slate-900">
              Class-wise Fee Report
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px] text-left text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-5 py-4">
                    Class
                  </th>

                  <th className="px-5 py-4">
                    Records
                  </th>

                  <th className="px-5 py-4">
                    Total
                  </th>

                  <th className="px-5 py-4">
                    Collected
                  </th>

                  <th className="px-5 py-4">
                    Due
                  </th>

                  <th className="px-5 py-4">
                    Collection
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {loading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-12 text-center text-slate-500"
                    >
                      Loading report...
                    </td>
                  </tr>
                ) : classReport.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-12 text-center text-slate-500"
                    >
                      No report data found.
                    </td>
                  </tr>
                ) : (
                  classReport.map(
                    (item) => {
                      const rate =
                        item.total > 0
                          ? Math.round(
                              (item.paid /
                                item.total) *
                                100,
                            )
                          : 0;

                      return (
                        <tr
                          key={item.name}
                          className="hover:bg-slate-50"
                        >
                          <td className="px-5 py-4 font-semibold">
                            {item.name}
                          </td>

                          <td className="px-5 py-4">
                            {item.count}
                          </td>

                          <td className="px-5 py-4 font-medium">
                            {money(item.total)}
                          </td>

                          <td className="px-5 py-4 font-semibold text-green-600">
                            {money(item.paid)}
                          </td>

                          <td className="px-5 py-4 font-semibold text-red-600">
                            {money(item.due)}
                          </td>

                          <td className="px-5 py-4">
                            <span className="font-bold text-blue-600">
                              {rate}%
                            </span>
                          </td>
                        </tr>
                      );
                    },
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Fee records */}
        <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
          <div className="border-b px-5 py-4">
            <h2 className="font-bold text-slate-900">
              Fee Records
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-5 py-4">
                    Student
                  </th>

                  <th className="px-5 py-4">
                    Class
                  </th>

                  <th className="px-5 py-4">
                    Total
                  </th>

                  <th className="px-5 py-4">
                    Paid
                  </th>

                  <th className="px-5 py-4">
                    Due
                  </th>

                  <th className="px-5 py-4">
                    Due Date
                  </th>

                  <th className="px-5 py-4">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {filteredFees.map((fee) => (
                  <tr
                    key={fee.id}
                    className="hover:bg-slate-50"
                  >
                    <td className="px-5 py-4">
                      {fee.student
                        ? `${fee.student.firstName} ${
                            fee.student.lastName ??
                            ""
                          }`.trim()
                        : "Unknown Student"}
                    </td>

                    <td className="px-5 py-4">
                      {fee.class?.name ??
                        "Unknown"}
                    </td>

                    <td className="px-5 py-4">
                      {money(
                        fee.totalAmount,
                      )}
                    </td>

                    <td className="px-5 py-4 font-semibold text-green-600">
                      {money(
                        fee.paidAmount,
                      )}
                    </td>

                    <td className="px-5 py-4 font-semibold text-red-600">
                      {money(
                        fee.dueAmount,
                      )}
                    </td>

                    <td className="px-5 py-4">
                      {formatDate(
                        fee.dueDate,
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(
                          fee.status,
                        )}`}
                      >
                        {fee.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </main>
  );
}