"use client";

import { useEffect, useState } from "react";

type Profile = {
  id: string;
  firstName: string;
  lastName?: string | null;
  email: string;
  phone?: string | null;
  role: string;
  status: string;
};

export default function StaffProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadProfile() {
      const token = localStorage.getItem("brx_access_token");

      if (!token) {
        window.location.href = "/login";
        return;
      }

      try {
        const response = await fetch(
          "http://localhost:3000/users/me",
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

        setProfile(data);

        setForm({
          firstName: data.firstName ?? "",
          lastName: data.lastName ?? "",
          email: data.email ?? "",
          phone: data.phone ?? "",
        });
      } catch {
        setMessage("❌ Profile load nahi hua.");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  function updateField(
    field: keyof typeof form,
    value: string,
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  async function saveProfile() {
    const token = localStorage.getItem("brx_access_token");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const response = await fetch(
        "http://localhost:3000/users/me",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            firstName: form.firstName,
            lastName: form.lastName,
            email: form.email,
            phone: form.phone,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          Array.isArray(data?.message)
            ? data.message.join(", ")
            : data?.message || "Profile update failed",
        );
      }

      setProfile(data);

      setForm({
        firstName: data.firstName ?? "",
        lastName: data.lastName ?? "",
        email: data.email ?? "",
        phone: data.phone ?? "",
      });

      setMessage("✅ Profile successfully updated.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? `❌ ${error.message}`
          : "❌ Profile update failed.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 p-6">
        <div className="mx-auto max-w-3xl rounded-2xl bg-white p-8 shadow-sm">
          Loading profile...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <button
            onClick={() => {
              window.location.href = "/staff-dashboard";
            }}
            className="mb-4 text-sm font-semibold text-blue-600 hover:underline"
          >
            ← Back to Dashboard
          </button>

          <h1 className="text-3xl font-bold text-slate-900">
            Staff Profile
          </h1>

          <p className="mt-1 text-slate-500">
            Apni profile information update karein.
          </p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Personal Information
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Role:{" "}
                <span className="font-semibold text-blue-600">
                  {profile?.role}
                </span>
              </p>
            </div>

            <span className="rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-700">
              {profile?.status}
            </span>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <Input
              label="First Name"
              value={form.firstName}
              onChange={(value) =>
                updateField("firstName", value)
              }
            />

            <Input
              label="Last Name"
              value={form.lastName}
              onChange={(value) =>
                updateField("lastName", value)
              }
            />

            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(value) =>
                updateField("email", value)
              }
            />

            <Input
              label="Phone"
              value={form.phone}
              onChange={(value) =>
                updateField("phone", value)
              }
            />
          </div>

          {message && (
            <div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm">
              {message}
            </div>
          )}

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={() => {
                window.location.href = "/staff-dashboard";
              }}
              className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              onClick={saveProfile}
              disabled={saving}
              className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    </div>
  );
}