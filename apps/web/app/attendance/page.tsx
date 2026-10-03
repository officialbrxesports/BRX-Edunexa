"use client";

import { useEffect, useState } from "react";

type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE";

type Student = {
  id: string;
  firstName: string;
  lastName?: string | null;
  email: string;
};

type Section = {
  id: string;
  name: string;
  code: string;
  classId: string;
};

type ClassItem = {
  id: string;
  name: string;
  code: string;
  sections: Section[];
};

export default function AttendancePage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);

  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [selectedDate, setSelectedDate] = useState("2026-09-19");

  const [statuses, setStatuses] = useState<
    Record<string, AttendanceStatus>
  >({});

  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // ---------------------------------------
  // Load Classes
  // ---------------------------------------
  useEffect(() => {
    const loadClasses = async () => {
      try {
        setError("");

        const token = localStorage.getItem("brx_access_token");

        if (!token) {
          window.location.href = "/login";
          return;
        }

        const response = await fetch(
          "/api/academics/classes",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);

          throw new Error(
            errorData?.message || "Failed to load classes",
          );
        }

        const data = await response.json();

        const classList: ClassItem[] = Array.isArray(data)
          ? data
          : [];

        setClasses(classList);

        if (classList.length > 0) {
          const firstClass = classList[0];

          setSelectedClassId(firstClass.id);

          if (firstClass.sections?.length > 0) {
            setSelectedSectionId(firstClass.sections[0].id);
          } else {
            setSelectedSectionId("");
          }
        }
      } catch (err) {
        console.warn("Load classes error:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Classes load nahi ho pa rahi hain.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadClasses();
  }, []);

  // ---------------------------------------
  // Load Students
  // ---------------------------------------
  useEffect(() => {
    const loadStudents = async () => {
      try {
        setLoading(true);
        setError("");
        setMessage("");

        const token = localStorage.getItem("brx_access_token");

        if (!token) {
          window.location.href = "/login";
          return;
        }

        if (!selectedClassId || !selectedSectionId) {
          setStudents([]);
          setStatuses({});
          setLoading(false);
          return;
        }

        const response = await fetch(
          `/api/academics/classes/${selectedClassId}/sections/${selectedSectionId}/students`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);

          throw new Error(
            errorData?.message || "Failed to load students",
          );
        }

        const data = await response.json();

        const studentList: Student[] = Array.isArray(data)
          ? data
              .map(
                (enrollment) => enrollment.student,
              )
              .filter(Boolean)
          : [];

        setStudents(studentList);

        const defaultStatuses: Record<
          string,
          AttendanceStatus
        > = {};

        studentList.forEach((student) => {
          defaultStatuses[student.id] = "PRESENT";
        });

        setStatuses(defaultStatuses);
      } catch (err) {
        console.warn("Load students error:", err);

        setStudents([]);
        setStatuses({});

        setError(
          err instanceof Error
            ? err.message
            : "Students load nahi ho pa rahe hain.",
        );
      } finally {
        setLoading(false);
      }
    };

    if (selectedClassId && selectedSectionId) {
      loadStudents();
    }
  }, [selectedClassId, selectedSectionId]);

  // ---------------------------------------
  // Update Attendance Status
  // ---------------------------------------
  const updateStatus = (
    studentId: string,
    status: AttendanceStatus,
  ) => {
    setStatuses((current) => ({
      ...current,
      [studentId]: status,
    }));

    setMessage("");
    setError("");
  };

  // ---------------------------------------
  // Save Attendance
  // ---------------------------------------
  const saveAttendance = async (
    student: Student,
  ) => {
    try {
      setSavingId(student.id);
      setMessage("");
      setError("");

      const token = localStorage.getItem("brx_access_token");

      if (!token) {
        window.location.href = "/login";
        return;
      }

      if (
        !selectedClassId ||
        !selectedSectionId ||
        !selectedDate
      ) {
        setError(
          "Please select class, section and date.",
        );
        return;
      }

      const response = await fetch(
        "/api/academics/attendance",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            studentId: student.id,
            classId: selectedClassId,
            sectionId: selectedSectionId,
            date: selectedDate,
            status:
              statuses[student.id] ?? "PRESENT",
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Attendance save failed",
        );
      }

      setMessage(
        `${student.firstName} ${
          student.lastName ?? ""
        } attendance saved as ${data.status}.`,
      );
    } catch (err) {
      console.warn("Save attendance error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Attendance save failed",
      );
    } finally {
      setSavingId(null);
    }
  };

  // ---------------------------------------
  // Current Selected Class
  // ---------------------------------------
  const currentClass = classes.find(
    (item) => item.id === selectedClassId,
  );

  const currentSections =
    currentClass?.sections ?? [];

  // ---------------------------------------
  // UI
  // ---------------------------------------
  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-5xl">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">
            Attendance
          </h1>

          <p className="mt-1 text-slate-600">
            Student attendance management
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

                  setSelectedClassId(classId);

                  const selectedClass =
                    classes.find(
                      (item) =>
                        item.id === classId,
                    );

                  setSelectedSectionId(
                    selectedClass
                      ?.sections?.[0]?.id ?? "",
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

        {/* Success */}
        {message && (
          <div className="mb-4 rounded-lg bg-green-50 p-3 text-green-700">
            {message}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-slate-600">
              Loading students...
            </p>
          </div>
        )}

        {/* No Students */}
        {!loading &&
          !error &&
          students.length === 0 && (
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <p className="text-slate-600">
                No students found.
              </p>
            </div>
          )}

        {/* Students */}
        {!loading && students.length > 0 && (
          <div className="space-y-4">
            {students.map((student) => {
              const currentStatus =
                statuses[student.id] ??
                "PRESENT";

              return (
                <div
                  key={student.id}
                  className="rounded-2xl bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                    {/* Student Info */}
                    <div>
                      <h2 className="font-semibold text-slate-900">
                        {student.firstName}{" "}
                        {student.lastName ?? ""}
                      </h2>

                      <p className="text-sm text-slate-500">
                        {student.email}
                      </p>
                    </div>

                    {/* Buttons */}
                    <div className="flex flex-wrap gap-2">

                      {/* Present */}
                      <button
                        onClick={() =>
                          updateStatus(
                            student.id,
                            "PRESENT",
                          )
                        }
                        className={`rounded-lg px-4 py-2 text-sm font-medium ${
                          currentStatus === "PRESENT"
                            ? "bg-green-600 text-white"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        Present
                      </button>

                      {/* Absent */}
                      <button
                        onClick={() =>
                          updateStatus(
                            student.id,
                            "ABSENT",
                          )
                        }
                        className={`rounded-lg px-4 py-2 text-sm font-medium ${
                          currentStatus === "ABSENT"
                            ? "bg-red-600 text-white"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        Absent
                      </button>

                      {/* Late */}
                      <button
                        onClick={() =>
                          updateStatus(
                            student.id,
                            "LATE",
                          )
                        }
                        className={`rounded-lg px-4 py-2 text-sm font-medium ${
                          currentStatus === "LATE"
                            ? "bg-yellow-500 text-white"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        Late
                      </button>

                      {/* Save */}
                      <button
                        onClick={() =>
                          saveAttendance(student)
                        }
                        disabled={
                          savingId === student.id
                        }
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        {savingId === student.id
                          ? "Saving..."
                          : "Save"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}