"use client";

import { useEffect, useState } from "react";

type AttendanceStatus =
  | "PRESENT"
  | "ABSENT"
  | "LATE";

type Section = {
  id: string;
  name: string;
  code: string;
};

type ClassItem = {
  id: string;
  name: string;
  code: string;
  sections: Section[];
};

type AttendanceRecord = {
  id: string;
  date: string;
  status: AttendanceStatus;
  student: {
    id: string;
    firstName: string;
    lastName?: string | null;
    email: string;
  };
};

export default function AttendanceHistoryPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [records, setRecords] = useState<
    AttendanceRecord[]
  >([]);

  const [selectedClassId, setSelectedClassId] =
    useState("");

  const [selectedSectionId, setSelectedSectionId] =
    useState("");

  const [selectedDate, setSelectedDate] =
    useState("2026-09-20");

  const [loading, setLoading] = useState(true);
  const [loadingHistory, setLoadingHistory] =
    useState(false);

  const [error, setError] = useState("");

  // ---------------------------------------
  // Load Classes
  // ---------------------------------------

  useEffect(() => {
    const loadClasses = async () => {
      try {
        setError("");

        const token =
          localStorage.getItem(
            "brx_access_token",
          );

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

        if (!response.ok) {
          throw new Error(
            "Failed to load classes",
          );
        }

        const data = await response.json();

        const classList: ClassItem[] =
          Array.isArray(data) ? data : [];

        setClasses(classList);

        if (classList.length > 0) {
          const firstClass = classList[0];

          setSelectedClassId(firstClass.id);

          if (
            firstClass.sections?.length > 0
          ) {
            setSelectedSectionId(
              firstClass.sections[0].id,
            );
          }
        }
      } catch (err) {
        console.error(err);

        setError(
          "Classes load nahi ho pa rahi hain.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadClasses();
  }, []);

  // ---------------------------------------
  // Load Attendance History
  // ---------------------------------------

  useEffect(() => {
    const loadHistory = async () => {
      try {
        setLoadingHistory(true);
        setError("");

        const token =
          localStorage.getItem(
            "brx_access_token",
          );

        if (!token) {
          window.location.href = "/login";
          return;
        }

        if (
          !selectedClassId ||
          !selectedSectionId ||
          !selectedDate
        ) {
          setRecords([]);
          return;
        }

        const url =
          `http://localhost:3000/academics/classes/` +
          `${selectedClassId}/sections/` +
          `${selectedSectionId}/attendance` +
          `?date=${selectedDate}`;

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(
            "Failed to load attendance history",
          );
        }

        const data = await response.json();

        setRecords(
          Array.isArray(data) ? data : [],
        );
      } catch (err) {
        console.error(err);

        setRecords([]);

        setError(
          "Attendance history load nahi ho pa rahi hai.",
        );
      } finally {
        setLoadingHistory(false);
      }
    };

    if (
      selectedClassId &&
      selectedSectionId &&
      selectedDate
    ) {
      loadHistory();
    }
  }, [
    selectedClassId,
    selectedSectionId,
    selectedDate,
  ]);

  // ---------------------------------------
  // Current Class
  // ---------------------------------------

  const currentClass = classes.find(
    (item) =>
      item.id === selectedClassId,
  );

  const currentSections =
    currentClass?.sections ?? [];

  // ---------------------------------------
  // Counts
  // ---------------------------------------

  const presentCount = records.filter(
    (item) => item.status === "PRESENT",
  ).length;

  const absentCount = records.filter(
    (item) => item.status === "ABSENT",
  ).length;

  const lateCount = records.filter(
    (item) => item.status === "LATE",
  ).length;

  // ---------------------------------------
  // UI
  // ---------------------------------------

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">
            Attendance History
          </h1>

          <p className="mt-1 text-slate-600">
            View student attendance records
          </p>
        </div>

        {/* Filters */}

        <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-3">
            {/* Class */}

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Class
              </label>

              <select
                value={selectedClassId}
                onChange={(event) => {
                  const classId =
                    event.target.value;

                  setSelectedClassId(
                    classId,
                  );

                  const selectedClass =
                    classes.find(
                      (item) =>
                        item.id === classId,
                    );

                  setSelectedSectionId(
                    selectedClass
                      ?.sections?.[0]?.id ??
                      "",
                  );
                }}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
              >
                {classes.map((item) => (
                  <option
                    key={item.id}
                    value={item.id}
                  >
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Section */}

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Section
              </label>

              <select
                value={selectedSectionId}
                onChange={(event) =>
                  setSelectedSectionId(
                    event.target.value,
                  )
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
              >
                {currentSections.map(
                  (section) => (
                    <option
                      key={section.id}
                      value={section.id}
                    >
                      {section.name}
                    </option>
                  ),
                )}
              </select>
            </div>

            {/* Date */}

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Date
              </label>

              <input
                type="date"
                value={selectedDate}
                onChange={(event) =>
                  setSelectedDate(
                    event.target.value,
                  )
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>
          </div>
        </div>

        {/* Error */}

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-red-700">
            {error}
          </div>
        )}

        {/* Summary */}

        {!loadingHistory &&
          records.length > 0 && (
            <div className="mb-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl bg-green-50 p-5">
                <p className="text-sm text-green-700">
                  Present
                </p>

                <p className="mt-1 text-3xl font-bold text-green-800">
                  {presentCount}
                </p>
              </div>

              <div className="rounded-2xl bg-red-50 p-5">
                <p className="text-sm text-red-700">
                  Absent
                </p>

                <p className="mt-1 text-3xl font-bold text-red-800">
                  {absentCount}
                </p>
              </div>

              <div className="rounded-2xl bg-yellow-50 p-5">
                <p className="text-sm text-yellow-700">
                  Late
                </p>

                <p className="mt-1 text-3xl font-bold text-yellow-800">
                  {lateCount}
                </p>
              </div>
            </div>
          )}

        {/* Loading */}

        {(loading || loadingHistory) && (
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-slate-600">
              Loading attendance history...
            </p>
          </div>
        )}

        {/* Empty */}

        {!loading &&
          !loadingHistory &&
          records.length === 0 &&
          !error && (
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <p className="text-slate-600">
                No attendance found for this
                date.
              </p>
            </div>
          )}

        {/* Attendance Table */}

        {!loadingHistory &&
          records.length > 0 && (
            <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-5 py-4 text-left text-sm font-semibold text-slate-700">
                        #
                      </th>

                      <th className="px-5 py-4 text-left text-sm font-semibold text-slate-700">
                        Student
                      </th>

                      <th className="px-5 py-4 text-left text-sm font-semibold text-slate-700">
                        Email
                      </th>

                      <th className="px-5 py-4 text-left text-sm font-semibold text-slate-700">
                        Status
                      </th>

                      <th className="px-5 py-4 text-left text-sm font-semibold text-slate-700">
                        Date
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {records.map(
                      (record, index) => (
                        <tr
                          key={record.id}
                          className="border-t border-slate-100"
                        >
                          <td className="px-5 py-4 text-sm text-slate-600">
                            {index + 1}
                          </td>

                          <td className="px-5 py-4 font-medium text-slate-900">
                            {
                              record.student
                                .firstName
                            }{" "}
                            {record.student
                              .lastName ?? ""}
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-500">
                            {
                              record.student
                                .email
                            }
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                record.status ===
                                "PRESENT"
                                  ? "bg-green-100 text-green-700"
                                  : record.status ===
                                      "ABSENT"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-yellow-100 text-yellow-700"
                              }`}
                            >
                              {record.status}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-500">
                            {selectedDate}
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
      </div>
    </main>
  );
}