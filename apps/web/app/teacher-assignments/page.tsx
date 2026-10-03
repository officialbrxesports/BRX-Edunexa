"use client";

import { useEffect, useState } from "react";

const API = "/api";

type User = {
  id: string;
  firstName: string;
  lastName?: string | null;
  email: string;
  role: string;
};

export default function TeacherAssignmentsPage() {
  const [teachers, setTeachers] = useState<User[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [assignedStudents, setAssignedStudents] = useState<User[]>([]);

  const [teacherId, setTeacherId] = useState("");
  const [studentId, setStudentId] = useState("");

  const [loading, setLoading] = useState(false);
  const [loadingAssigned, setLoadingAssigned] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const token = localStorage.getItem("brx_access_token");

      const response = await fetch(`${API}/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Users load nahi hue");
      }

      if (Array.isArray(data)) {
        setTeachers(
          data.filter((user: User) => user.role === "TEACHER"),
        );

        setStudents(
          data.filter((user: User) => user.role === "STUDENT"),
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Users load nahi hue",
      );
    }
  }

  async function loadAssignedStudents(selectedTeacherId: string) {
    setAssignedStudents([]);

    if (!selectedTeacherId) {
      return;
    }

    setLoadingAssigned(true);
    setError("");

    try {
      const token = localStorage.getItem("brx_access_token");

      const response = await fetch(
        `${API}/users/${selectedTeacherId}/students`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || "Assigned students load nahi hue",
        );
      }

      setAssignedStudents(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Assigned students load nahi hue",
      );
    } finally {
      setLoadingAssigned(false);
    }
  }

  async function handleAssign() {
    setMessage("");
    setError("");

    if (!teacherId || !studentId) {
      setError("Teacher aur Student dono select karo.");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("brx_access_token");

      const response = await fetch(
        `${API}/users/${teacherId}/students`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            studentId,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || "Student assign nahi hua",
        );
      }

      setMessage("✅ Student successfully assigned!");

      setStudentId("");

      await loadAssignedStudents(teacherId);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Student assign nahi hua",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove(student: User) {
    if (!teacherId) return;

    setMessage("");
    setError("");

    try {
      const token = localStorage.getItem("brx_access_token");

      const response = await fetch(
        `${API}/users/${teacherId}/students/${student.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message || "Student remove nahi hua",
        );
      }

      setMessage("Student assignment removed.");

      await loadAssignedStudents(teacherId);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Student remove nahi hua",
      );
    }
  }

  function handleTeacherChange(value: string) {
    setTeacherId(value);
    setMessage("");
    setError("");
    loadAssignedStudents(value);
  }

  const selectedTeacher = teachers.find(
    (teacher) => teacher.id === teacherId,
  );

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div>
          <p className="text-sm font-semibold text-blue-600">
            BRX EduNexa
          </p>

          <h1 className="mt-1 text-3xl font-bold text-slate-900">
            Teacher Assignments
          </h1>

          <p className="mt-1 text-slate-500">
            Teacher ko students assign aur manage karein.
          </p>
        </div>

        {/* Assignment Form */}
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">
            Assign Student
          </h2>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {/* Teacher */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Teacher
              </label>

              <select
                value={teacherId}
                onChange={(e) =>
                  handleTeacherChange(e.target.value)
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500"
              >
                <option value="">Select Teacher</option>

                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.firstName}{" "}
                    {teacher.lastName || ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Student */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Student
              </label>

              <select
                value={studentId}
                onChange={(e) =>
                  setStudentId(e.target.value)
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500"
              >
                <option value="">Select Student</option>

                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.firstName}{" "}
                    {student.lastName || ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleAssign}
            disabled={loading}
            className="mt-5 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Assigning..." : "Assign Student"}
          </button>

          {message && (
            <div className="mt-4 rounded-xl bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
              {message}
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              ❌ {error}
            </div>
          )}
        </section>

        {/* Assigned Students */}
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Assigned Students
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {selectedTeacher
                  ? `${selectedTeacher.firstName} ${
                      selectedTeacher.lastName || ""
                    } ke students`
                  : "Teacher select karne ke baad students dikhenge."}
              </p>
            </div>

            <div className="rounded-full bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700">
              Total: {assignedStudents.length}
            </div>
          </div>

          <div className="mt-5 overflow-hidden rounded-xl border border-slate-200">
            {!teacherId ? (
              <div className="p-10 text-center text-slate-500">
                👨‍🏫 Pehle teacher select karo.
              </div>
            ) : loadingAssigned ? (
              <div className="p-10 text-center text-slate-500">
                Loading assigned students...
              </div>
            ) : assignedStudents.length === 0 ? (
              <div className="p-10 text-center">
                <p className="font-semibold text-slate-600">
                  No students assigned
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  Is teacher ko abhi koi student assign nahi hai.
                </p>
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
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {assignedStudents.map((student, index) => (
                      <tr
                        key={student.id}
                        className="border-t border-slate-200"
                      >
                        <td className="px-5 py-4 text-sm text-slate-500">
                          {index + 1}
                        </td>

                        <td className="px-5 py-4 font-semibold text-slate-900">
                          {student.firstName}{" "}
                          {student.lastName || ""}
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-500">
                          {student.email}
                        </td>

                        <td className="px-5 py-4">
                          <button
                            onClick={() =>
                              handleRemove(student)
                            }
                            className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100"
                          >
                            Remove
                          </button>
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