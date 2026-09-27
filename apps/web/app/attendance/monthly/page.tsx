"use client";

import { useEffect, useState } from "react";

type ClassItem = {
  id: string;
  name: string;
  code: string;
};

type SectionItem = {
  id: string;
  name: string;
  code: string;
};

type StudentReport = {
  student: {
    id: string;
    email: string;
    firstName: string;
    lastName: string | null;
  };
  present: number;
  absent: number;
  late: number;
  total: number;
  attendancePercentage: number;
};

type MonthlyReport = {
  month: string;
  classId: string;
  sectionId: string;
  summary: {
    totalMarked: number;
    present: number;
    absent: number;
    late: number;
    attendancePercentage: number;
  };
  students: StudentReport[];
};

export default function MonthlyAttendancePage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [sections, setSections] = useState<SectionItem[]>([]);

  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");

  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(
      now.getMonth() + 1,
    ).padStart(2, "0")}`;
  });

  const [report, setReport] =
    useState<MonthlyReport | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const getToken = () =>
    localStorage.getItem("brx_access_token");

  useEffect(() => {
    const loadClasses = async () => {
      try {
        const token = getToken();

        if (!token) {
          window.location.href = "/login";
          return;
        }

        const response = await fetch(
          "http://localhost:3000/academics/classes",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to load classes",
          );
        }

        setClasses(data);
      } catch (error) {
        console.warn(error);
        setError("Failed to load classes");
      }
    };

    loadClasses();
  }, []);

  useEffect(() => {
    if (!classId) {
      setSections([]);
      setSectionId("");
      setReport(null);
      return;
    }

    const loadSections = async () => {
      try {
        const token = getToken();

        const response = await fetch(
          `http://localhost:3000/academics/classes/${classId}/sections`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to load sections",
          );
        }

        setSections(data);
        setSectionId("");
        setReport(null);
      } catch (error) {
        console.warn(error);
        setError("Failed to load sections");
      }
    };

    loadSections();
  }, [classId]);

  const loadReport = async () => {
    if (!classId || !sectionId || !month) {
      setError(
        "Please select class, section and month.",
      );
      return;
    }

    try {
      setLoading(true);
      setError("");

      const token = getToken();

      if (!token) {
        window.location.href = "/login";
        return;
      }

      const response = await fetch(
        `http://localhost:3000/academics/classes/${classId}/sections/${sectionId}/attendance/monthly?month=${month}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load report",
        );
      }

      setReport(data);
    } catch (error) {
      console.warn(error);
      setReport(null);
      setError("Failed to load monthly report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">
            Monthly Attendance Report
          </h1>

          <p className="mt-1 text-slate-600">
            BRX EduNexa • Student attendance analytics
          </p>
        </div>

        {/* Filters */}
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Class
              </label>

              <select
                value={classId}
                onChange={(event) =>
                  setClassId(event.target.value)
                }
                className="w-full rounded-xl border border-slate-300 px-3 py-2"
              >
                <option value="">
                  Select class
                </option>

                {classes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Section
              </label>

              <select
                value={sectionId}
                onChange={(event) =>
                  setSectionId(event.target.value)
                }
                disabled={!classId}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 disabled:bg-slate-100"
              >
                <option value="">
                  Select section
                </option>

                {sections.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Month
              </label>

              <input
                type="month"
                value={month}
                onChange={(event) =>
                  setMonth(event.target.value)
                }
                className="w-full rounded-xl border border-slate-300 px-3 py-2"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={loadReport}
                disabled={loading}
                className="w-full rounded-xl bg-slate-900 px-4 py-2 font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {loading
                  ? "Loading..."
                  : "Generate Report"}
              </button>
            </div>
          </div>

          {error && (
            <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">
              {error}
            </p>
          )}
        </div>

        {/* Summary */}
        {report && (
          <>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <SummaryCard
                title="Total Marked"
                value={report.summary.totalMarked}
              />

              <SummaryCard
                title="Present"
                value={report.summary.present}
              />

              <SummaryCard
                title="Absent"
                value={report.summary.absent}
              />

              <SummaryCard
                title="Late"
                value={report.summary.late}
              />

              <SummaryCard
                title="Attendance %"
                value={`${report.summary.attendancePercentage}%`}
              />
            </div>

            {/* Student table */}
            <div className="mt-6 overflow-hidden rounded-2xl bg-white shadow-sm">
              <div className="border-b border-slate-200 p-5">
                <h2 className="text-xl font-bold text-slate-900">
                  Student-wise Report
                </h2>

                <p className="text-sm text-slate-500">
                  Month: {report.month}
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] text-left">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-5 py-3 text-sm font-semibold">
                        Student
                      </th>

                      <th className="px-5 py-3 text-sm font-semibold">
                        Present
                      </th>

                      <th className="px-5 py-3 text-sm font-semibold">
                        Absent
                      </th>

                      <th className="px-5 py-3 text-sm font-semibold">
                        Late
                      </th>

                      <th className="px-5 py-3 text-sm font-semibold">
                        Total
                      </th>

                      <th className="px-5 py-3 text-sm font-semibold">
                        Attendance %
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {report.students.map((item) => (
                      <tr
                        key={item.student.id}
                        className="border-t border-slate-100"
                      >
                        <td className="px-5 py-4">
                          <div className="font-semibold text-slate-900">
                            {item.student.firstName}{" "}
                            {item.student.lastName || ""}
                          </div>

                          <div className="text-xs text-slate-500">
                            {item.student.email}
                          </div>
                        </td>

                        <td className="px-5 py-4 text-green-600">
                          {item.present}
                        </td>

                        <td className="px-5 py-4 text-red-600">
                          {item.absent}
                        </td>

                        <td className="px-5 py-4 text-yellow-600">
                          {item.late}
                        </td>

                        <td className="px-5 py-4">
                          {item.total}
                        </td>

                        <td className="px-5 py-4 font-bold">
                          {item.attendancePercentage}%
                        </td>
                      </tr>
                    ))}

                    {report.students.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-5 py-10 text-center text-slate-500"
                        >
                          No attendance data found for
                          this month.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function SummaryCard({
  title,
  value,
}: {
  title: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">
        {title}
      </p>

      <p className="mt-2 text-2xl font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}