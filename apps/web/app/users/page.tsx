"use client";

import { useEffect, useMemo, useState } from "react";

type UserItem = {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string;
  phone?: string | null;
  role: "PLATFORM_ADMIN" | "HEAD" | "TEACHER" | "STAFF" | "STUDENT";
  status?: "ACTIVE" | "SUSPENDED" | "INVITED" | "DELETED";
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const token =
          localStorage.getItem("brx_access_token");

        if (!token) {
          window.location.href = "/login";
          return;
        }

        const response = await fetch(
          "http://localhost:3000/users",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to load users",
          );
        }

        setUsers(Array.isArray(data) ? data : []);
      } catch (error) {
        console.warn(error);
        setError("Failed to load users");
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const query = search.toLowerCase().trim();

    return users.filter((user) => {
      const name =
        `${user.firstName} ${user.lastName || ""}`
          .toLowerCase();

      const matchesSearch =
        !query ||
        name.includes(query) ||
        user.email.toLowerCase().includes(query);

      const matchesRole =
        roleFilter === "ALL" ||
        user.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  const students = users.filter(
    (user) => user.role === "STUDENT",
  ).length;

  const teachers = users.filter(
    (user) => user.role === "TEACHER",
  ).length;

  const staff = users.filter(
    (user) => user.role === "STAFF",
  ).length;

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              User Management
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              BRX EduNexa • Institution users
            </p>
          </div>

          <a
            href="/dashboard"
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Dashboard
          </a>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Stats */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Users"
            value={users.length}
            icon="👥"
          />

          <StatCard
            title="Students"
            value={students}
            icon="👨‍🎓"
          />

          <StatCard
            title="Teachers"
            value={teachers}
            icon="👨‍🏫"
          />

          <StatCard
            title="Staff"
            value={staff}
            icon="🧑‍💼"
          />
        </div>

        {/* Search / filter */}
        <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="flex-1">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Search user
              </label>

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search by name or email..."
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
              />
            </div>

            <div className="md:w-56">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Role
              </label>

              <select
                value={roleFilter}
                onChange={(event) =>
                  setRoleFilter(event.target.value)
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
              >
                <option value="ALL">All Roles</option>
                <option value="HEAD">Head</option>
                <option value="TEACHER">Teacher</option>
                <option value="STAFF">Staff</option>
                <option value="STUDENT">Student</option>
              </select>
            </div>
          </div>
        </section>

        {error && (
          <div className="mt-6 rounded-2xl bg-red-50 p-4 text-red-600">
            {error}
          </div>
        )}

        {/* Users table */}
        <section className="mt-6 overflow-hidden rounded-3xl bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 p-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Users
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {filteredUsers.length} user
                {filteredUsers.length !== 1 ? "s" : ""} found
              </p>
            </div>
          </div>

          {loading ? (
            <div className="p-10 text-center text-slate-500">
              Loading users...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-10 text-center">
              <div className="text-4xl">🔎</div>

              <p className="mt-3 font-semibold text-slate-700">
                No users found
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Try changing your search or role filter.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-sm font-semibold text-slate-700">
                      User
                    </th>

                    <th className="px-6 py-4 text-sm font-semibold text-slate-700">
                      Email
                    </th>

                    <th className="px-6 py-4 text-sm font-semibold text-slate-700">
                      Role
                    </th>

                    <th className="px-6 py-4 text-sm font-semibold text-slate-700">
                      Phone
                    </th>

                    <th className="px-6 py-4 text-sm font-semibold text-slate-700">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="border-t border-slate-100 hover:bg-slate-50"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 font-bold text-white">
                            {user.firstName
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>
                            <p className="font-semibold text-slate-900">
                              {user.firstName}{" "}
                              {user.lastName || ""}
                            </p>

                            <p className="text-xs text-slate-400">
                              {user.id.slice(0, 8)}...
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-600">
                        {user.email}
                      </td>

                      <td className="px-6 py-4">
                        <RoleBadge role={user.role} />
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-600">
                        {user.phone || "—"}
                      </td>

                      <td className="px-6 py-4">
                        <StatusBadge
                          status={user.status || "ACTIVE"}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
  value: number;
  icon: string;
}) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
        {icon}
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

function RoleBadge({
  role,
}: {
  role: UserItem["role"];
}) {
  const label = role.replace("_", " ");

  return (
    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
      {label}
    </span>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  return (
    <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">
      {status}
    </span>
  );
}