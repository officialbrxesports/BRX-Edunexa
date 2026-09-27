"use client";

import { useEffect, useState } from "react";

type User = {
  id: string;
  firstName: string;
  lastName?: string | null;
  email: string;
  phone?: string | null;
  role: string;
  status: string;
};

export default function StaffDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      const token = localStorage.getItem("brx_access_token");

      if (!token) {
        window.location.href = "/login";
        return;
      }

      try {
        const response = await fetch(
          "http://localhost:3000/users/me/role",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!response.ok) {
          throw new Error("Profile load failed");
        }

        const data = await response.json();
        setUser(data);
      } catch {
        localStorage.removeItem("brx_access_token");
        document.cookie =
          "brx_access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

        window.location.href = "/login";
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  function logout() {
    localStorage.removeItem("brx_access_token");

    document.cookie =
      "brx_access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

    window.location.href = "/login";
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 p-6">
        <div className="mx-auto max-w-6xl rounded-2xl bg-white p-8 shadow">
          Loading Staff Dashboard...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6 flex flex-col justify-between gap-4 rounded-2xl bg-white p-6 shadow-sm md:flex-row md:items-center">
          <div>
            <p className="text-sm font-medium text-blue-600">
              BRX EduNexa
            </p>

            <h1 className="mt-1 text-3xl font-bold text-slate-900">
              Staff Dashboard
            </h1>

            <p className="mt-1 text-slate-500">
              Welcome, {user?.firstName} {user?.lastName ?? ""}
            </p>
          </div>

          <button
            onClick={logout}
            className="rounded-xl bg-red-600 px-5 py-3 font-semibold text-white hover:bg-red-700"
          >
            Logout
          </button>
        </div>

        {/* Profile */}
        <section className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">
            My Profile
          </h2>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">
                Name
              </p>

              <p className="mt-1 font-semibold">
                {user?.firstName} {user?.lastName ?? ""}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">
                Email
              </p>

              <p className="mt-1 font-semibold break-all">
                {user?.email}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">
                Role
              </p>

              <p className="mt-1 font-semibold text-blue-600">
                {user?.role}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              window.location.href = "/staff-profile";
            }}
            className="mt-4 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
             >
            Edit Profile
          </button>
        </section>

        {/* Quick Actions */}
        <section className="mb-6">
          <h2 className="mb-4 text-xl font-bold text-slate-900">
            Quick Actions
          </h2>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="text-2xl">👨‍🎓</div>

              <h3 className="mt-3 font-bold">
                Student Support
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Student-related administrative work.
              </p>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="text-2xl">📚</div>

              <h3 className="mt-3 font-bold">
                Academic Support
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Academic records and daily operations.
              </p>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="text-2xl">📋</div>

              <h3 className="mt-3 font-bold">
                Administrative Tasks
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Institution support activities.
              </p>
            </div>
          </div>
        </section>

        {/* Access Notice */}
        <section className="rounded-2xl border border-blue-100 bg-blue-50 p-6">
          <h2 className="text-lg font-bold text-blue-900">
            Staff Access
          </h2>

          <p className="mt-2 text-sm text-blue-800">
            Staff members can use features that are
            specifically assigned to their role by the
            institution administrator.
          </p>
        </section>
      </div>
    </main>
  );
}