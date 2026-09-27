"use client";

import { useEffect, useState } from "react";

type ClassItem = {
  id: string;
  name: string;
  code: string;
};

type UserItem = {
  id: string;
  firstName: string;
  lastName?: string | null;
  email: string;
  role: string;
};

export default function DashboardPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const token =
          localStorage.getItem("brx_access_token");

        if (!token) {
          window.location.href = "/login";
          return;
        }

        const headers = {
          Authorization: `Bearer ${token}`,
        };

        const [classesResponse, usersResponse] =
          await Promise.all([
            fetch(
              "http://localhost:3000/academics/classes",
              { headers },
            ),
            fetch(
              "http://localhost:3000/users",
              { headers },
            ),
          ]);

        const classesData =
          await classesResponse.json();

        const usersData =
          await usersResponse.json();

        if (!classesResponse.ok) {
          throw new Error(
            classesData.message ||
              "Failed to load classes",
          );
        }

        if (!usersResponse.ok) {
          throw new Error(
            usersData.message ||
              "Failed to load users",
          );
        }

        setClasses(
          Array.isArray(classesData)
            ? classesData
            : [],
        );

        setUsers(
          Array.isArray(usersData)
            ? usersData
            : [],
        );
      } catch (error) {
        console.warn(error);
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const teachers = users.filter(
    (user) => user.role === "TEACHER",
  );

  const students = users.filter(
    (user) => user.role === "STUDENT",
  );

  const staff = users.filter(
    (user) => user.role === "STAFF",
  );

  return (
    <main className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              BRX EduNexa
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Education Management Dashboard
            </p>
          </div>

          <button
            onClick={() => {
              localStorage.removeItem("brx_access_token");

              document.cookie =
                "brx_access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

              window.location.href = "/login";
            }}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Welcome */}
        <section className="rounded-3xl bg-slate-900 p-7 text-white shadow-sm">
          <p className="text-sm text-slate-300">
            Welcome back 👋
          </p>

          <h2 className="mt-2 text-3xl font-bold">
            Institution Dashboard
          </h2>

          <p className="mt-2 max-w-2xl text-slate-300">
            Manage your students, teachers, classes and
            attendance from one place.
          </p>
        </section>

        {error && (
          <div className="mt-6 rounded-2xl bg-red-50 p-4 text-red-600">
            {error}
          </div>
        )}

        {/* Statistics */}
        <section className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Students"
            value={loading ? "..." : students.length}
            icon="👨‍🎓"
          />

          <StatCard
            title="Teachers"
            value={loading ? "..." : teachers.length}
            icon="👨‍🏫"
          />

          <StatCard
            title="Classes"
            value={loading ? "..." : classes.length}
            icon="🏫"
          />

          <StatCard
            title="Staff"
            value={loading ? "..." : staff.length}
            icon="👥"
          />
        </section>

        {/* Quick Actions */}
        <section className="mt-8">
          <h2 className="mb-4 text-xl font-bold text-slate-900">
            Quick Actions
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <ActionCard
              title="Take Attendance"
              description="Mark today's student attendance"
              href="/attendance"
              icon="📝"
            />

            <ActionCard
              title="Attendance History"
              description="View daily attendance records"
              href="/attendance/history"
              icon="📋"
            />

            <ActionCard
              title="Monthly Report"
              description="View monthly attendance analytics"
              href="/attendance/monthly"
              icon="📊"
            />

            <ActionCard
              title="Manage Users"
              description="View institution users"
              href="/users"
              icon="👤"
            />
          </div>

          <a
            href="/institution"
            className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-blue-400 hover:shadow-sm"
          >
            <div className="text-lg font-semibold text-slate-900">
              🏫 Institution Settings
            </div>

            <div className="mt-1 text-sm text-slate-500">
              Institution details manage karein
            </div>
          </a>

          <a
            href="/attendance"
            className="rounded-2xl bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <div className="text-2xl">📝</div>

            <h3 className="mt-3 font-bold">
              Attendance
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Attendance records aur daily attendance manage karein.
            </p>
          </a>
        </section>

        {/* Classes */}
        <section className="mt-8 overflow-hidden rounded-3xl bg-white shadow-sm">
          <div className="border-b border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900">
              Classes
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Classes available in your institution
            </p>
          </div>

          <div className="p-6">
            {loading ? (
              <p className="text-slate-500">
                Loading classes...
              </p>
            ) : classes.length === 0 ? (
              <div className="rounded-2xl bg-slate-50 p-8 text-center">
                <p className="font-semibold text-slate-700">
                  No classes found
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Create a class to get started.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {classes.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-slate-200 p-5 transition hover:border-slate-400 hover:shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-xl">
                        🏫
                      </div>

                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                        {item.code}
                      </span>
                    </div>

                    <h3 className="mt-4 text-lg font-bold text-slate-900">
                      {item.name}
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      Class ID available
                    </p>
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
    <div className="rounded-3xl bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
          {icon}
        </div>
      </div>

      <p className="mt-5 text-sm font-medium text-slate-500">
        {title}
      </p>

      <p className="mt-1 text-3xl font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}

function ActionCard({
  title,
  description,
  href,
  icon,
}: {
  title: string;
  description: string;
  href: string;
  icon: string;
}) {
  return (
    <a
      href={href}
      className="group rounded-2xl bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-xl">
        {icon}
      </div>

      <h3 className="mt-4 font-bold text-slate-900 group-hover:text-slate-700">
        {title}
      </h3>

      <p className="mt-1 text-sm text-slate-500">
        {description}
      </p>
    </a>
  );
}