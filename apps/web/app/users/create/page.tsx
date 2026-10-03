"use client";

import { FormEvent, useState } from "react";

type UserRole = "TEACHER" | "STAFF" | "STUDENT";

export default function CreateUserPage() {
  const [role, setRole] = useState<UserRole>("STUDENT");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setLoading(true);
    setMessage("");
    setError("");

    try {
      const token =
        localStorage.getItem("brx_access_token");

      if (!token) {
        window.location.href = "/login";
        return;
      }

      const response = await fetch(
        "/api/users",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            firstName,
            lastName: lastName || undefined,
            email,
            phone: phone || undefined,
            password,
            role,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          Array.isArray(data.message)
            ? data.message.join(", ")
            : data.message || "Failed to create user",
        );
      }

      setMessage(
        `${role.toLowerCase()} created successfully.`,
      );

      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
      setPassword("");
      setRole("STUDENT");
    } catch (error) {
      console.warn(error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to create user",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Add User
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              BRX EduNexa • Create institution account
            </p>
          </div>

          <a
            href="/users"
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Back to Users
          </a>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="rounded-3xl bg-white p-6 shadow-sm md:p-8">
          <div className="mb-8">
            <h2 className="text-xl font-bold text-slate-900">
              Account Information
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Fill in the details to create a new user.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            {/* Role */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                User Role
              </label>

              <select
                value={role}
                onChange={(event) =>
                  setRole(
                    event.target.value as UserRole,
                  )
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
              >
                <option value="STUDENT">
                  Student
                </option>

                <option value="TEACHER">
                  Teacher
                </option>

                <option value="STAFF">
                  Staff
                </option>
              </select>
            </div>

            {/* Name */}
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  First Name
                </label>

                <input
                  required
                  value={firstName}
                  onChange={(event) =>
                    setFirstName(event.target.value)
                  }
                  placeholder="Rahul"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Last Name
                </label>

                <input
                  value={lastName}
                  onChange={(event) =>
                    setLastName(event.target.value)
                  }
                  placeholder="Kumar"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
                />
              </div>
            </div>

            {/* Email / Phone */}
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Email
                </label>

                <input
                  required
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="student@example.com"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Phone
                </label>

                <input
                  value={phone}
                  onChange={(event) =>
                    setPhone(event.target.value)
                  }
                  placeholder="9876543210"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Temporary Password
              </label>

              <input
                required
                type="password"
                minLength={8}
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="Minimum 8 characters"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
              />

              <p className="mt-2 text-xs text-slate-500">
                User can use this password to sign in.
              </p>
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">
                {error}
              </div>
            )}

            {message && (
              <div className="rounded-xl bg-green-50 p-4 text-sm font-medium text-green-700">
                {message}
              </div>
            )}

            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-slate-900 px-6 py-3 font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "Creating..."
                  : "Create User"}
              </button>

              <a
                href="/users"
                className="rounded-xl border border-slate-300 px-6 py-3 text-center font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </a>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}