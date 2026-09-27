"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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

export default function TeacherDashboardPage() {
  const [profile, setProfile] = useState<User | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("brx_access_token");

      if (!token) {
        throw new Error("Login required");
      }

      // Teacher profile
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

      setProfile(profileData);

      // Teacher's assigned students
      const studentsResponse = await fetch(
        `${API}/users/${profileData.id}/students`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const studentsData = await studentsResponse.json();

      if (!studentsResponse.ok) {
        throw new Error(
          studentsData?.message ||
            "Assigned students load nahi hue",
        );
      }

      setStudents(
        Array.isArray(studentsData) ? studentsData : [],
      );

      // Classes available to the teacher
      const classesResponse = await fetch(
        `${API}/academics/classes`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const classesData = await classesResponse.json();

      if (classesResponse.ok) {
        setClasses(
          Array.isArray(classesData) ? classesData : [],
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

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="rounded-2xl bg-white px-8 py-6 shadow-sm">
          <p className="font-semibold text-slate-700">
            Loading Teacher Dashboard...
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
              Teacher Dashboard
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-bold text-slate-900">
                {profile?.firstName} {profile?.lastName || ""}
              </p>

              <p className="text-xs text-slate-500">
                Teacher
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
          <p className="text-sm text-blue-100">
            Welcome back 👋
          </p>

          <h2 className="mt-1 text-3xl font-bold">
            {profile?.firstName} {profile?.lastName || ""}
          </h2>

          <p className="mt-2 text-blue-100">
            Apne students aur academic activities manage karein.
          </p>
        </section>

        {/* Stats */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="My Students"
            value={students.length}
            icon="👨‍🎓"
          />

          <StatCard
            title="My Classes"
            value={classes.length}
            icon="🏫"
          />

          <StatCard
            title="Attendance"
            value="—"
            icon="📅"
          />

          <StatCard
            title="Performance"
            value="—"
            icon="📊"
          />
        </section>

        {/* Quick Actions */}
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">
            Quick Actions
          </h2>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <QuickAction
              href="/attendance"
              icon="📅"
              title="Mark Attendance"
              description="Student attendance mark karein"
            />

            <QuickAction
              href="/attendance/history"
              icon="📋"
              title="Attendance History"
              description="Previous attendance dekhein"
            />

            <QuickAction
              href="/attendance/monthly"
              icon="📊"
              title="Monthly Report"
              description="Monthly attendance report"
            />

            <QuickAction
              href="/teacher-assignments"
              icon="👨‍🎓"
              title="My Students"
              description="Assigned students dekhein"
            />
          </div>
        </section>

        {/* My Students */}
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                My Students
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Sirf aapko assigned students.
              </p>
            </div>

            <span className="rounded-full bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700">
              {students.length} Students
            </span>
          </div>

          <div className="mt-5 overflow-hidden rounded-xl border border-slate-200">
            {students.length === 0 ? (
              <div className="p-10 text-center">
                <p className="font-semibold text-slate-600">
                  No students assigned
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  Abhi aapko koi student assign nahi kiya gaya hai.
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
                    {students.map((student, index) => (
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
                          <Link
                            href={`/students/${student.id}`}
                            className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-100"
                          >
                            View Profile
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* My Classes */}
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">
            Available Classes
          </h2>

          <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {classes.length === 0 ? (
              <p className="text-sm text-slate-500">
                No classes found.
              </p>
            ) : (
              classes.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-200 p-5"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900">
                      {item.name}
                    </h3>

                    <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                      {item.code}
                    </span>
                  </div>

                  <p className="mt-3 text-sm text-slate-500">
                    Academic class
                  </p>
                </div>
              ))
            )}
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

function QuickAction({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-slate-200 p-5 transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-sm"
    >
      <div className="text-2xl">{icon}</div>

      <h3 className="mt-3 font-bold text-slate-900">
        {title}
      </h3>

      <p className="mt-1 text-sm text-slate-500">
        {description}
      </p>
    </Link>
  );
}