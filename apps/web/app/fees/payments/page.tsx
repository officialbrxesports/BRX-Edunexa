"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Payment = {
  id: string;
  feeId: string;
  amount: number | string;
  paymentMethod: string;
  transactionId?: string | null;
  remarks?: string | null;
  note?: string | null;
  paymentDate?: string;
  paidAt?: string;
  createdAt?: string;

  fee?: {
    id: string;
    totalAmount: number | string;
    paidAmount: number | string;
    dueAmount: number | string;
    status: string;

    student?: {
      id: string;
      firstName: string;
      lastName?: string | null;
      email: string;
    };
  };
};

type Fee = {
  id: string;
  studentId: string;
  totalAmount: number | string;
  paidAmount: number | string;
  dueAmount: number | string;
  status: string;

  student?: {
    id: string;
    firstName: string;
    lastName?: string | null;
    email: string;
  };
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

function formatDate(value?: string) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function methodClass(method: string) {
  switch (method) {
    case "UPI":
      return "bg-purple-100 text-purple-700";

    case "CARD":
      return "bg-blue-100 text-blue-700";

    case "BANK_TRANSFER":
      return "bg-indigo-100 text-indigo-700";

    case "CASH":
      return "bg-green-100 text-green-700";

    default:
      return "bg-slate-100 text-slate-700";
  }
}

export default function PaymentHistoryPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [fees, setFees] = useState<Fee[]>([]);

  const [search, setSearch] = useState("");
  const [method, setMethod] = useState("ALL");
  const [selectedFeeId, setSelectedFeeId] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchData() {
    try {
      setLoading(true);
      setError("");

      const token = getToken();

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const feesResponse = await fetch(
        `${API_URL}/academics/fees`,
        {
          headers,
        },
      );

      if (!feesResponse.ok) {
        throw new Error("Failed to load fees");
      }

      const feesData = await feesResponse.json();

      const feeList: Fee[] = Array.isArray(feesData)
        ? feesData
        : feesData.fees ?? [];

      setFees(feeList);

      const feeIdFromUrl =
        typeof window !== "undefined"
          ? new URLSearchParams(
              window.location.search,
            ).get("feeId")
          : null;

      if (feeIdFromUrl) {
        setSelectedFeeId(feeIdFromUrl);
      }

      const paymentResults = await Promise.all(
        feeList.map(async (fee) => {
          try {
            const response = await fetch(
              `${API_URL}/academics/fees/${fee.id}/payments`,
              {
                headers,
              },
            );

            if (!response.ok) {
              return [];
            }

            const data = await response.json();

            return Array.isArray(data)
              ? data
              : data.payments ?? [];
          } catch {
            return [];
          }
        }),
      );

      const allPayments =
        paymentResults.flat() as Payment[];

      setPayments(allPayments);
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
    fetchData();
  }, []);

  const filteredPayments = useMemo(() => {
    const query = search.trim().toLowerCase();

    return payments.filter((payment) => {
      const fee =
        payment.fee ??
        fees.find(
          (item) => item.id === payment.feeId,
        );

      const student = fee?.student;

      const studentName = student
        ? `${student.firstName} ${
            student.lastName ?? ""
          }`.trim()
        : "";

      const matchesSearch =
        !query ||
        studentName
          .toLowerCase()
          .includes(query) ||
        student?.email
          ?.toLowerCase()
          .includes(query) ||
        payment.id
          .toLowerCase()
          .includes(query) ||
        payment.transactionId
          ?.toLowerCase()
          .includes(query);

      const matchesMethod =
        method === "ALL" ||
        payment.paymentMethod === method;

      const matchesFee =
        !selectedFeeId ||
        payment.feeId === selectedFeeId;

      return (
        matchesSearch &&
        matchesMethod &&
        matchesFee
      );
    });
  }, [
    payments,
    fees,
    search,
    method,
    selectedFeeId,
  ]);

  const totalCollected = useMemo(() => {
    return filteredPayments.reduce(
      (sum, payment) =>
        sum + Number(payment.amount),
      0,
    );
  }, [filteredPayments]);

  const paymentCount = filteredPayments.length;

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Payment History
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Complete record of collected fee payments
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
              href="/fees/history"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Fee History
            </Link>

            <Link
              href="/fees/reports"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              📊 Reports
            </Link>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Summary */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Total Collected
            </p>

            <p className="mt-2 text-3xl font-bold text-green-600">
              {money(totalCollected)}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Payments
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {paymentCount}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="grid gap-3 md:grid-cols-3">
            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search student, transaction ID..."
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm outline-none focus:border-slate-500"
            />

            <select
              value={method}
              onChange={(event) =>
                setMethod(event.target.value)
              }
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
            >
              <option value="ALL">
                All Payment Methods
              </option>

              <option value="UPI">UPI</option>
              <option value="CARD">Card</option>
              <option value="CASH">Cash</option>
              <option value="BANK_TRANSFER">
                Bank Transfer
              </option>
              <option value="OTHER">Other</option>
            </select>

            <select
              value={selectedFeeId}
              onChange={(event) =>
                setSelectedFeeId(
                  event.target.value,
                )
              }
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
            >
              <option value="">
                All Fee Records
              </option>

              {fees.map((fee) => {
                const student = fee.student;

                const name = student
                  ? `${student.firstName} ${
                      student.lastName ?? ""
                    }`.trim()
                  : fee.id;

                return (
                  <option
                    key={fee.id}
                    value={fee.id}
                  >
                    {name} — {money(fee.totalAmount)}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-5 py-4">
                    Student
                  </th>

                  <th className="px-5 py-4">
                    Amount
                  </th>

                  <th className="px-5 py-4">
                    Method
                  </th>

                  <th className="px-5 py-4">
                    Transaction ID
                  </th>

                  <th className="px-5 py-4">
                    Date
                  </th>

                  <th className="px-5 py-4">
                    Fee Status
                  </th>

                  <th className="px-5 py-4">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {loading ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-12 text-center text-slate-500"
                    >
                      Loading payment history...
                    </td>
                  </tr>
                ) : filteredPayments.length ===
                  0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-12 text-center text-slate-500"
                    >
                      No payment records found.
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map(
                    (payment) => {
                      const fee =
                        payment.fee ??
                        fees.find(
                          (item) =>
                            item.id ===
                            payment.feeId,
                        );

                      const student =
                        fee?.student;

                      return (
                        <tr
                          key={payment.id}
                          className="hover:bg-slate-50"
                        >
                          {/* Student */}
                          <td className="px-5 py-4">
                            <div className="font-semibold text-slate-900">
                              {student
                                ? `${student.firstName} ${
                                    student.lastName ??
                                    ""
                                  }`.trim()
                                : "Unknown Student"}
                            </div>

                            <div className="text-xs text-slate-500">
                              {student?.email ??
                                payment.feeId}
                            </div>
                          </td>

                          {/* Amount */}
                          <td className="px-5 py-4 text-lg font-bold text-green-600">
                            {money(payment.amount)}
                          </td>

                          {/* Method */}
                          <td className="px-5 py-4">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${methodClass(
                                payment.paymentMethod,
                              )}`}
                            >
                              {
                                payment.paymentMethod
                              }
                            </span>
                          </td>

                          {/* Transaction */}
                          <td className="px-5 py-4 font-mono text-xs">
                            {payment.transactionId ??
                              "—"}
                          </td>

                          {/* Date */}
                          <td className="px-5 py-4">
                            {formatDate(
                              payment.paymentDate ??
                                payment.paidAt ??
                                payment.createdAt,
                            )}
                          </td>

                          {/* Fee Status */}
                          <td className="px-5 py-4">
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                              {fee?.status ??
                                "UNKNOWN"}
                            </span>
                          </td>

                          {/* Receipt */}
                          <td className="px-5 py-4">
                            <Link
                              href={`/fees/receipt/${payment.feeId}/${payment.id}`}
                              target="_blank"
                              className="inline-flex items-center rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                            >
                              🧾 Receipt
                            </Link>
                          </td>
                        </tr>
                      );
                    },
                  )
                )}
              </tbody>
            </table>
          </div>

          {!loading && (
            <div className="border-t px-5 py-4 text-sm text-slate-500">
              Showing {filteredPayments.length}{" "}
              payment
              {filteredPayments.length === 1
                ? ""
                : "s"}
              .
            </div>
          )}
        </div>
      </div>
    </main>
  );
}