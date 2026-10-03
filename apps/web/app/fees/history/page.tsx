"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Student = {
  id: string;
  firstName: string;
  lastName?: string | null;
  email: string;
};

type ClassItem = {
  id: string;
  name: string;
  code: string;
};

type Section = {
  id: string;
  name: string;
  code: string;
};

type Fee = {
  id: string;
  studentId: string;
  classId: string;
  sectionId: string;

  totalAmount: number | string;
  paidAmount: number | string;
  dueAmount: number | string;

  dueDate: string;
  status: "PENDING" | "PARTIAL" | "PAID" | "OVERDUE";

  student?: Student;
  class?: ClassItem;
  section?: Section;
};

const API_URL = "/api";

function getToken() {
  if (typeof window === "undefined") return "";
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

export default function FeeHistoryPage() {
  const [fees, setFees] = useState<Fee[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [classId, setClassId] = useState("ALL");

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

      const [feesResponse, studentsResponse, classesResponse] =
        await Promise.all([
          fetch(`${API_URL}/academics/fees`, { headers }),
          fetch(`${API_URL}/users`, { headers }),
          fetch(`${API_URL}/academics/classes`, { headers }),
        ]);

      if (!feesResponse.ok) {
        throw new Error("Failed to load fees");
      }

      const feesData = await feesResponse.json();
      const studentsData = await studentsResponse.json();
      const classesData = await classesResponse.json();

      setFees(Array.isArray(feesData) ? feesData : feesData.fees ?? []);
      setStudents(
        Array.isArray(studentsData)
          ? studentsData
          : studentsData.users ?? [],
      );
      setClasses(
        Array.isArray(classesData)
          ? classesData
          : classesData.classes ?? [],
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
    fetchData();
  }, []);

  const filteredFees = useMemo(() => {
    const query = search.trim().toLowerCase();

    return fees.filter((fee) => {
      const student = fee.student ??
        students.find((item) => item.id === fee.studentId);

      const studentName = student
        ? `${student.firstName} ${student.lastName ?? ""}`.trim()
        : "";

      const matchesSearch =
        !query ||
        studentName.toLowerCase().includes(query) ||
        student?.email.toLowerCase().includes(query) ||
        fee.id.toLowerCase().includes(query);

      const matchesStatus =
        status === "ALL" || fee.status === status;

      const matchesClass =
        classId === "ALL" || fee.classId === classId;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesClass
      );
    });
  }, [fees, students, search, status, classId]);

  const totals = useMemo(() => {
    return filteredFees.reduce(
      (result, fee) => {
        result.total += Number(fee.totalAmount);
        result.paid += Number(fee.paidAmount);
        result.due += Number(fee.dueAmount);
        return result;
      },
      {
        total: 0,
        paid: 0,
        due: 0,
      },
    );
  }, [filteredFees]);

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Fee History
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Complete student fee collection history
            </p>
          </div>

          <div className="flex gap-3">
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
              Payment History
            </Link>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Total Fee
            </p>
            <p className="mt-2 text-2xl font-bold">
              {money(totals.total)}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Collected
            </p>
            <p className="mt-2 text-2xl font-bold text-green-600">
              {money(totals.paid)}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Outstanding
            </p>
            <p className="mt-2 text-2xl font-bold text-red-600">
              {money(totals.due)}
            </p>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="grid gap-3 md:grid-cols-3">
            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search student, email or fee ID..."
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm outline-none focus:border-slate-500"
            />

            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value)
              }
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="PARTIAL">Partial</option>
              <option value="PAID">Paid</option>
              <option value="OVERDUE">Overdue</option>
            </select>

            <select
              value={classId}
              onChange={(event) =>
                setClassId(event.target.value)
              }
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
            >
              <option value="ALL">All Classes</option>

              {classes.map((item) => (
                <option
                  key={item.id}
                  value={item.id}
                >
                  {item.name} ({item.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-5 py-4">Student</th>
                  <th className="px-5 py-4">Class</th>
                  <th className="px-5 py-4">Total</th>
                  <th className="px-5 py-4">Paid</th>
                  <th className="px-5 py-4">Due</th>
                  <th className="px-5 py-4">Due Date</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {loading ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-12 text-center text-slate-500"
                    >
                      Loading fee history...
                    </td>
                  </tr>
                ) : filteredFees.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-12 text-center text-slate-500"
                    >
                      No fee records found.
                    </td>
                  </tr>
                ) : (
                  filteredFees.map((fee) => {
                    const student =
                      fee.student ??
                      students.find(
                        (item) =>
                          item.id === fee.studentId,
                      );

                    const classItem =
                      fee.class ??
                      classes.find(
                        (item) =>
                          item.id === fee.classId,
                      );

                    return (
                      <tr
                        key={fee.id}
                        className="hover:bg-slate-50"
                      >
                        <td className="px-5 py-4">
                          <div className="font-semibold text-slate-900">
                            {student
                              ? `${student.firstName} ${student.lastName ?? ""}`.trim()
                              : "Unknown Student"}
                          </div>

                          <div className="text-xs text-slate-500">
                            {student?.email ?? fee.studentId}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          {classItem?.name ?? fee.classId}
                        </td>

                        <td className="px-5 py-4 font-medium">
                          {money(fee.totalAmount)}
                        </td>

                        <td className="px-5 py-4 font-medium text-green-600">
                          {money(fee.paidAmount)}
                        </td>

                        <td className="px-5 py-4 font-medium text-red-600">
                          {money(fee.dueAmount)}
                        </td>

                        <td className="px-5 py-4">
                          {formatDate(fee.dueDate)}
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

                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-2">
                            <Link
                              href={`/fees/payments?feeId=${fee.id}`}
                              className="font-medium text-blue-600 hover:underline"
                            >
                              Payments
                            </Link>

                            {Number(fee.paidAmount) > 0 && (
                              <Link
                                href={`/fees/payments?feeId=${fee.id}`}
                                className="font-medium text-emerald-600 hover:underline"
                              >
                                🧾 Receipt
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {!loading && (
            <div className="border-t px-5 py-4 text-sm text-slate-500">
              Showing {filteredFees.length} fee record
              {filteredFees.length === 1 ? "" : "s"}.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}