"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const API = "/api";

type Student = {
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
};

type Attendance = {
  id: string;
  date: string;
  status: "PRESENT" | "ABSENT" | "LATE";
};

export default function StudentDashboardPage() {
  const [student, setStudent] = useState<Student | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const token = localStorage.getItem("brx_access_token");

      if (!token) {
        throw new Error("Login required");
      }

      // Student profile
      const profileResponse = await fetch(`${API}/users/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const profileData = await profileResponse.json();

      if (!profileResponse.ok) {
        throw new Error(
          profileData?.message || "Profile load nahi hua",
        );
      }

      setStudent(profileData);

      // Student enrollments
      const enrollmentResponse = await fetch(
        `${API}/academics/students/${profileData.id}/enrollments`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const enrollmentData = await enrollmentResponse.json();

      if (enrollmentResponse.ok) {
        setEnrollments(
          Array.isArray(enrollmentData)
            ? enrollmentData
            : [],
        );
      }

      // Student attendance
      const attendanceResponse = await fetch(
        `${API}/academics/students/${profileData.id}/attendance`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const attendanceData = await attendanceResponse.json();

      if (attendanceResponse.ok) {
        setAttendance(
          Array.isArray(attendanceData)
            ? attendanceData
            : [],
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Dashboard load nahi hua",
      );
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem("brx_access_token");
    window.location.href = "/login";
  }

  const present = attendance.filter(
    (item) => item.status === "PRESENT",
  ).length;

  const absent = attendance.filter(
    (item) => item.status === "ABSENT",
  ).length;

  const late = attendance.filter(
    (item) => item.status === "LATE",
  ).length;

  const attendancePercentage =
    attendance.length > 0
      ? Math.round((present / attendance.length) * 100)
      : 0;

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="rounded-2xl bg-white px-8 py-6 shadow-sm">
          <p className="font-semibold text-slate-700">
            Loading Student Dashboard...
          </p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-100 p-6">
        <div className="mx-auto max-w-4xl rounded-2xl bg-white p-8 shadow-sm">
          <h1 className="text-xl font-bold text-red-600">
            Dashboard Error
          </h1>

          <p className="mt-2 text-slate-600">{error}</p>

          <Link
            href="/login"
            className="mt-5 inline-block rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white"
          >
            Go to Login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-sm font-semibold text-blue-600">
              BRX EduNexa
            </p>

            <h1 className="text-xl font-bold text-slate-900">
              Student Dashboard
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-bold text-slate-900">
                {student?.firstName}{" "}
                {student?.lastName || ""}
              </p>

              <p className="text-xs text-slate-500">
                Student
              </p>
            </div>

            <button
              onClick={logout}
              className="rounded-xl bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-6 p-6">
        {/* Welcome */}
        <section className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-2xl font-bold text-blue-600">
              {student?.firstName?.charAt(0)}
              {student?.lastName?.charAt(0) || ""}
            </div>

            <div>
              <p className="text-sm text-blue-100">
                Welcome back 👋
              </p>

              <h2 className="text-3xl font-bold">
                {student?.firstName}{" "}
                {student?.lastName || ""}
              </h2>

              <p className="mt-1 text-blue-100">
                {student?.email}
              </p>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Attendance"
            value={`${attendancePercentage}%`}
            icon="📊"
          />

          <StatCard
            title="Present"
            value={present}
            icon="✅"
          />

          <StatCard
            title="Absent"
            value={absent}
            icon="❌"
          />

          <StatCard
            title="Late"
            value={late}
            icon="⏰"
          />
        </section>

        {/* Academic Information */}
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">
            My Academic Information
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Aapki current class aur section.
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {enrollments.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center md:col-span-2">
                <p className="font-semibold text-slate-600">
                  No enrollment found
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  Aap abhi kisi class me enrolled nahi hain.
                </p>
              </div>
            ) : (
              enrollments.map((enrollment) => (
                <div
                  key={enrollment.id}
                  className="rounded-xl border border-slate-200 p-5"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900">
                      {enrollment.class?.name || "Class"}
                    </h3>

                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                      Active
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-slate-50 p-4">
                      <p className="text-xs text-slate-500">
                        Class Code
                      </p>

                      <p className="mt-1 font-bold text-slate-800">
                        {enrollment.class?.code || "-"}
                      </p>
                    </div>

                    <div className="rounded-lg bg-slate-50 p-4">
                      <p className="text-xs text-slate-500">
                        Section
                      </p>

                      <p className="mt-1 font-bold text-slate-800">
                        {enrollment.section?.name || "-"}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Attendance */}
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                My Attendance
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Aapki attendance history.
              </p>
            </div>

            <Link
              href="/attendance/history"
              className="rounded-xl bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-100"
            >
              View All
            </Link>
          </div>

          <div className="mt-5 overflow-hidden rounded-xl border border-slate-200">
            {attendance.length === 0 ? (
              <div className="p-10 text-center text-slate-500">
                No attendance records found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-5 py-4 text-sm font-semibold text-slate-600">
                        Date
                      </th>

                      <th className="px-5 py-4 text-sm font-semibold text-slate-600">
                        Status
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {attendance
                      .slice()
                      .sort(
                        (a, b) =>
                          new Date(b.date).getTime() -
                          new Date(a.date).getTime(),
                      )
                      .slice(0, 10)
                      .map((item) => (
                        <tr
                          key={item.id}
                          className="border-t border-slate-200"
                        >
                          <td className="px-5 py-4 text-sm font-medium text-slate-700">
                            {new Date(
                              item.date,
                            ).toLocaleDateString("en-IN")}
                          </td>

                          <td className="px-5 py-4">
                            <StatusBadge
                              status={item.status}
                            />
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* Profile */}
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">
            My Profile
          </h2>

          <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <InfoCard
              label="Name"
              value={`${student?.firstName || ""} ${
                student?.lastName || ""
              }`}
            />

            <InfoCard
              label="Email"
              value={student?.email || "-"}
            />

            <InfoCard
              label="Phone"
              value={student?.phone || "Not provided"}
            />

            <InfoCard
              label="Role"
              value={student?.role || "STUDENT"}
            />

            <InfoCard
              label="Status"
              value={student?.status || "-"}
            />
          </div>
        </section>
      </div>
    </main>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
  icon: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-900">
            {value}
          </p>
        </div>

        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-2xl">
          {icon}
        </div>
      </div>
    </div>
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

function StatusBadge({
  status,
}: {
  status: Attendance["status"];
}) {
  const styles = {
    PRESENT: "bg-green-100 text-green-700",
    ABSENT: "bg-red-100 text-red-700",
    LATE: "bg-yellow-100 text-yellow-700",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-bold ${styles[status]}`}
    >
      {status}
    </span>
  );
}