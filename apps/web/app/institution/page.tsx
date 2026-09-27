"use client";

import { useEffect, useState } from "react";

type Institution = {
  id: string;
  name: string;
  code: string;
  type: string;
  status: string;
  country: string;
  state: string;
  city?: string | null;
  address?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
};

export default function InstitutionPage() {
  const [institution, setInstitution] =
    useState<Institution | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    name: "",
    code: "",
    type: "",
    country: "",
    state: "",
    city: "",
    address: "",
    email: "",
    phone: "",
    website: "",
  });

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("brx_access_token")
      : null;

  useEffect(() => {
    async function loadInstitution() {
      try {
        const response = await fetch(
          "http://localhost:3000/institutions",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!response.ok) {
          throw new Error("Institution load failed");
        }

        const data = await response.json();
        const current = data?.[0];

        if (current) {
          setInstitution(current);

          setForm({
            name: current.name ?? "",
            code: current.code ?? "",
            type: current.type ?? "",
            country: current.country ?? "",
            state: current.state ?? "",
            city: current.city ?? "",
            address: current.address ?? "",
            email: current.email ?? "",
            phone: current.phone ?? "",
            website: current.website ?? "",
          });
        }
      } catch {
        setMessage("Institution data load nahi hua.");
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      loadInstitution();
    } else {
      setLoading(false);
    }
  }, [token]);

  function updateField(
    field: keyof typeof form,
    value: string,
  ) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  async function saveChanges() {
    if (!institution) return;

    setSaving(true);
    setMessage("");

    try {
      const response = await fetch(
        `http://localhost:3000/institutions/${institution.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(form),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || "Update failed",
        );
      }

      setInstitution(data);
      setMessage("✅ Institution details successfully updated.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? `❌ ${error.message}`
          : "❌ Update failed",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 p-6">
        <div className="mx-auto max-w-5xl rounded-2xl bg-white p-8 shadow">
          Loading institution...
        </div>
      </main>
    );
  }

  if (!institution) {
    return (
      <main className="min-h-screen bg-slate-100 p-6">
        <div className="mx-auto max-w-5xl rounded-2xl bg-white p-8 shadow">
          <h1 className="text-2xl font-bold">
            Institution Settings
          </h1>

          <p className="mt-3 text-red-600">
            Institution data available nahi hai.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">
            Institution Settings
          </h1>

          <p className="mt-1 text-slate-600">
            Apni institution ki basic information manage karein.
          </p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">
                Institution Information
              </h2>

              <p className="text-sm text-slate-500">
                Status:{" "}
                <span className="font-semibold text-green-600">
                  {institution.status}
                </span>
              </p>
            </div>

            <span className="rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700">
              {institution.code}
            </span>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <Input
              label="Institution Name"
              value={form.name}
              onChange={(value) =>
                updateField("name", value)
              }
            />

            <Input
              label="Institution Code"
              value={form.code}
              onChange={(value) =>
                updateField("code", value)
              }
            />

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Institution Type
              </label>

              <select
                value={form.type}
                onChange={(e) =>
                  updateField("type", e.target.value)
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
              >
                <option value="">Select type</option>
                <option value="SCHOOL">School</option>
                <option value="COLLEGE">College</option>
                <option value="UNIVERSITY">
                  University
                </option>
                <option value="COACHING">Coaching</option>
                <option value="PRIVATE_SCHOOL">
                  Private School
                </option>
                <option value="INSTITUTE">Institute</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <Input
              label="Country"
              value={form.country}
              onChange={(value) =>
                updateField("country", value)
              }
            />

            <Input
              label="State"
              value={form.state}
              onChange={(value) =>
                updateField("state", value)
              }
            />

            <Input
              label="City"
              value={form.city}
              onChange={(value) =>
                updateField("city", value)
              }
            />

            <Input
              label="Email"
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

            <Input
              label="Website"
              value={form.website}
              onChange={(value) =>
                updateField("website", value)
              }
            />
          </div>

          <div className="mt-5">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Address
            </label>

            <textarea
              value={form.address}
              onChange={(e) =>
                updateField("address", e.target.value)
              }
              rows={4}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
              placeholder="Institution address"
            />
          </div>

          {message && (
            <div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm">
              {message}
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <button
              onClick={saveChanges}
              disabled={saving}
              className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
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
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>

      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
      />
    </div>
  );
}