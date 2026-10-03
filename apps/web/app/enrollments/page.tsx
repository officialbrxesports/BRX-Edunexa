"use client";

import { useEffect, useState } from "react";

const API = "/api";

type Student = {
  id: string;
  firstName: string;
  lastName?: string | null;
  email: string;
  role: string;
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

type Enrollment = {
  id: string;
  student: Student;
};

export default function EnrollmentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);

  const [studentId, setStudentId] = useState("");
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("brx_access_token")
      : null;

  useEffect(() => {
    loadStudents();
    loadClasses();
  }, []);

  async function loadStudents() {
    try {
      const response = await fetch(`${API}/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Students load nahi hue");
      }

      const data = await response.json();

      const studentList = Array.isArray(data)
        ? data.filter((user: Student) => user.role === "STUDENT")
        : [];

      setStudents(studentList);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Students load nahi hue",
      );
    }
  }

  async function loadClasses() {
    try {
      const response = await fetch(`${API}/academics/classes`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Classes load nahi hui");
      }

      const data = await response.json();
      setClasses(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Classes load nahi hui",
      );
    }
  }

  async function loadSections(selectedClassId: string) {
    setSections([]);
    setSectionId("");
    setEnrollments([]);

    if (!selectedClassId) return;

    try {
      const response = await fetch(
        `${API}/academics/classes/${selectedClassId}/sections`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Sections load nahi hui");
      }

      const data = await response.json();
      setSections(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Sections load nahi hui",
      );
    }
  }

  async function loadEnrolledStudents(
    selectedClassId: string,
    selectedSectionId: string,
  ) {
    if (!selectedClassId || !selectedSectionId) {
      setEnrollments([]);
      return;
    }

    try {
      const response = await fetch(
        `${API}/academics/classes/${selectedClassId}/sections/${selectedSectionId}/students`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Enrolled students load nahi hue");
      }

      const data = await response.json();

      setEnrollments(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Enrolled students load nahi hue",
      );
    }
  }

  async function handleEnroll() {
    setMessage("");
    setError("");

    if (!studentId || !classId || !sectionId) {
      setError("Student, Class aur Section select karo.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API}/academics/enrollments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          studentId,
          classId,
          sectionId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || "Student enrollment failed",
        );
      }

      setMessage("✅ Student successfully enrolled!");

      setStudentId("");

      await loadEnrolledStudents(classId, sectionId);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Student enrollment failed",
      );
    } finally {
      setLoading(false);
    }
  }

  function handleClassChange(value: string) {
    setClassId(value);
    loadSections(value);
  }

  function handleSectionChange(value: string) {
    setSectionId(value);
    loadEnrolledStudents(classId, value);
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div>
          <p className="text-sm font-semibold text-blue-600">
            BRX EduNexa
          </p>

          <h1 className="mt-1 text-3xl font-bold text-slate-900">
            Student Enrollment
          </h1>

          <p className="mt-1 text-slate-500">
            Student ko Class aur Section me enroll karein.
          </p>
        </div>

        {/* Enrollment Form */}
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">
            Enroll New Student
          </h2>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {/* Student */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Student
              </label>

              <select
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500"
              >
                <option value="">Select Student</option>

                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.firstName} {student.lastName || ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Class */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Class
              </label>

              <select
                value={classId}
                onChange={(e) => handleClassChange(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500"
              >
                <option value="">Select Class</option>

                {classes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Section */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Section
              </label>

              <select
                value={sectionId}
                onChange={(e) =>
                  handleSectionChange(e.target.value)
                }
                disabled={!classId}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none disabled:bg-slate-100 focus:border-blue-500"
              >
                <option value="">Select Section</option>

                {sections.map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.name} ({section.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleEnroll}
            disabled={loading}
            className="mt-5 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Enrolling..." : "Enroll Student"}
          </button>

          {message && (
            <p className="mt-4 rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
              {message}
            </p>
          )}

          {error && (
            <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              ❌ {error}
            </p>
          )}
        </section>

        {/* Enrolled Students */}
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Enrolled Students
              </h2>

              <p className="text-sm text-slate-500">
                Selected class aur section ke students.
              </p>
            </div>

            <div className="rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
              Total: {enrollments.length}
            </div>
          </div>

          <div className="mt-5 overflow-hidden rounded-xl border border-slate-200">
            {enrollments.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                Class aur Section select karo.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-5 py-4 text-sm font-semibold text-slate-600">
                        #
                      </th>

                      <th className="px-5 py-4 text-sm font-semibold text-slate-600">
                        Student
                      </th>

                      <th className="px-5 py-4 text-sm font-semibold text-slate-600">
                        Email
                      </th>

                      <th className="px-5 py-4 text-sm font-semibold text-slate-600">
                        Status
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {enrollments.map((enrollment, index) => (
                      <tr
                        key={enrollment.id}
                        className="border-t border-slate-200"
                      >
                        <td className="px-5 py-4 text-sm text-slate-500">
                          {index + 1}
                        </td>

                        <td className="px-5 py-4 font-semibold text-slate-900">
                          {enrollment.student.firstName}{" "}
                          {enrollment.student.lastName || ""}
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-500">
                          {enrollment.student.email}
                        </td>

                        <td className="px-5 py-4">
                          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                            Enrolled
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}