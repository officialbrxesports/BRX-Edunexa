"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

const API = "http://localhost:3000";

type User = {
  id: string;
  firstName: string;
  lastName?: string | null;
  email: string;
  phone?: string | null;
  role: string;
  status: string;
};

type Enrollment = {
  id: string;
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
  createdAt: string;
};

export default function StudentProfilePage() {
  const params = useParams();
  const studentId = params.id as string;

  const [student, setStudent] = useState<User | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (studentId) {
      loadStudent();
      loadEnrollments();
    }
  }, [studentId]);

  async function loadStudent() {
    try {
      const token = localStorage.getItem("brx_access_token");

      const response = await fetch(`${API}/users/${studentId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Student load nahi hua");
      }

      setStudent(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Student load nahi hua",
      );
    }
  }

  async function loadEnrollments() {
    try {
      const token = localStorage.getItem("brx_access_token");

      const response = await fetch(
        `${API}/academics/students/${studentId}/enrollments`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || "Enrollment data load nahi hua",
        );
      }

      setEnrollments(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Enrollment data load nahi hua",
      );
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="rounded-2xl bg-white px-8 py-6 shadow-sm">
          <p className="font-semibold text-slate-700">
            Loading student profile...
          </p>
        </div>
      </main>
    );
  }

  if (error || !student) {
    return (
      <main className="min-h-screen bg-slate-100 p-6">
        <div className="mx-auto max-w-4xl rounded-2xl bg-white p-8 shadow-sm">
          <h1 className="text-xl font-bold text-red-600">
            Student Profile Error
          </h1>

          <p className="mt-2 text-slate-600">
            {error || "Student nahi mila."}
          </p>
        </div>
      </main>
    );
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
            Student Profile
          </h1>

          <p className="mt-1 text-slate-500">
            Student ki complete basic information.
          </p>
        </div>

        {/* Profile Card */}
        <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-2xl font-bold text-blue-600">
                {student.firstName.charAt(0)}
                {student.lastName?.charAt(0) || ""}
              </div>

              <div>
                <h2 className="text-2xl font-bold">
                  {student.firstName}{" "}
                  {student.lastName || ""}
                </h2>

                <p className="mt-1 text-blue-100">
                  {student.email}
                </p>

                <span className="mt-3 inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
                  {student.role}
                </span>
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <div className="p-6">
            <h3 className="text-lg font-bold text-slate-900">
              Basic Information
            </h3>

            <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <InfoCard
                label="First Name"
                value={student.firstName}
              />

              <InfoCard
                label="Last Name"
                value={student.lastName || "Not provided"}
              />

              <InfoCard
                label="Email"
                value={student.email}
              />

              <InfoCard
                label="Phone"
                value={student.phone || "Not provided"}
              />

              <InfoCard
                label="Role"
                value={student.role}
              />

              <InfoCard
                label="Account Status"
                value={student.status}
              />
            </div>
          </div>
        </section>

        {/* Enrollment */}
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Academic Enrollment
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Student ke classes aur sections.
              </p>
            </div>

            <div className="rounded-full bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700">
              {enrollments.length} Enrollment
            </div>
          </div>

          <div className="mt-5">
            {enrollments.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center">
                <p className="font-semibold text-slate-600">
                  No enrollment found
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  Is student ko abhi kisi class me enroll nahi kiya gaya hai.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {enrollments.map((enrollment) => (
                  <div
                    key={enrollment.id}
                    className="rounded-xl border border-slate-200 p-5"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-slate-900">
                        {enrollment.class?.name || "Class"}
                      </h3>

                      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                        Active
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-lg bg-slate-50 p-3">
                        <p className="text-xs text-slate-500">
                          Class Code
                        </p>

                        <p className="mt-1 font-semibold text-slate-800">
                          {enrollment.class?.code || "-"}
                        </p>
                      </div>

                      <div className="rounded-lg bg-slate-50 p-3">
                        <p className="text-xs text-slate-500">
                          Section
                        </p>

                        <p className="mt-1 font-semibold text-slate-800">
                          {enrollment.section?.name || "-"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-2 break-words font-semibold text-slate-900">
        {value}
      </p>
    </div>
  );
}