"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = "http://localhost:3000";

type InstitutionDetails = {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  website: string;
  establishedYear: string;
  registrationNumber: string;
  gstin: string;
};

type OwnerDetails = {
  firstName: string;
  lastName: string;
  designation: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export default function OwnerRegistrationPage() {
  const router = useRouter();

  const [institutionType, setInstitutionType] =
    useState("");

  const [institution, setInstitution] =
    useState<InstitutionDetails>({
      name: "",
      phone: "",
      email: "",
      address: "",
      city: "",
      state: "",
      pincode: "",
      website: "",
      establishedYear: "",
      registrationNumber: "",
      gstin: "",
    });

  const [form, setForm] = useState<OwnerDetails>({
    firstName: "",
    lastName: "",
    designation: "Head / Owner",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const type = localStorage.getItem(
      "brx_registration_type",
    );

    const institutionRaw = localStorage.getItem(
      "brx_institution_details",
    );

    if (!type || !institutionRaw) {
      router.replace("/register");
      return;
    }

    setInstitutionType(type);

    try {
      const parsed = JSON.parse(institutionRaw);

      setInstitution(parsed);

      setForm((previous) => ({
        ...previous,
        phone: parsed.phone || "",
        email: parsed.email || "",
      }));
    } catch {
      router.replace("/register/institution");
    }
  }, [router]);

  function updateField(
    field: keyof OwnerDetails,
    value: string,
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");

    if (!form.firstName.trim()) {
      setError("Please enter your first name.");
      return;
    }

    if (!form.phone.trim()) {
      setError("Please enter your phone number.");
      return;
    }

    if (!form.email.trim()) {
      setError("Please enter your email.");
      return;
    }

    if (form.password.length < 8) {
      setError(
        "Password must contain at least 8 characters.",
      );
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!institutionType) {
      setError("Institution type is missing.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/registration/session`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            institutionType,
            institutionName: institution.name,
            phone: institution.phone,
            email: institution.email,
            country: "India",
            state: institution.state,
            city: institution.city,
            address: institution.address,
            website: institution.website || undefined,
            firstName: form.firstName,
            lastName: form.lastName || undefined,
            ownerPhone: form.phone,
            ownerEmail: form.email,
            password: form.password,
            establishedYear:
              institution.establishedYear
                ? Number(
                    institution.establishedYear,
                  )
                : undefined,
            registrationNumber:
              institution.registrationNumber ||
              undefined,
            gstin:
              institution.gstin || undefined,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Unable to create registration session.",
        );
      }

      if (!data?.session?.id) {
        throw new Error(
          "Registration session ID was not returned.",
        );
      }

      localStorage.setItem(
        "brx_owner_details",
        JSON.stringify(form),
      );

      localStorage.setItem(
        "brx_registration_session_id",
        data.session.id,
      );

      localStorage.setItem(
        "brx_registration_session",
        JSON.stringify(data.session),
      );

      router.push("/register/verify");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to continue registration.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#070b18] text-white">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-[-100px] top-[-100px] h-[360px] w-[360px] rounded-full bg-blue-600/20 blur-[120px]" />
        <div className="absolute bottom-[-120px] right-[-100px] h-[420px] w-[420px] rounded-full bg-violet-600/20 blur-[130px]" />
      </div>

      <div className="relative flex min-h-screen items-center justify-center px-5 py-10">
        <div className="w-full max-w-2xl">
          <div className="mb-7">
            <button
              type="button"
              onClick={() =>
                router.push("/register/institution")
              }
              className="mb-6 text-sm text-slate-500 hover:text-white"
            >
              ← Back
            </button>

            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 font-bold">
                BRX
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-blue-400">
                  EduNexa
                </p>
                <p className="text-sm text-slate-400">
                  Owner / Head setup
                </p>
              </div>
            </div>

            <h1 className="text-3xl font-bold">
              Create your Head account
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              This account will become the main
              administrator of your institution.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="rounded-[28px] border border-white/10 bg-white/[0.06] p-6 shadow-2xl shadow-black/30 backdrop-blur-2xl sm:p-8"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="text-sm text-slate-300">
                  First name *
                </label>

                <input
                  value={form.firstName}
                  onChange={(event) =>
                    updateField(
                      "firstName",
                      event.target.value,
                    )
                  }
                  placeholder="Your first name"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3.5 outline-none focus:border-blue-500/60"
                />
              </div>

              <div>
                <label className="text-sm text-slate-300">
                  Last name
                </label>

                <input
                  value={form.lastName}
                  onChange={(event) =>
                    updateField(
                      "lastName",
                      event.target.value,
                    )
                  }
                  placeholder="Your last name"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3.5 outline-none focus:border-blue-500/60"
                />
              </div>

              <div>
                <label className="text-sm text-slate-300">
                  Designation
                </label>

                <select
                  value={form.designation}
                  onChange={(event) =>
                    updateField(
                      "designation",
                      event.target.value,
                    )
                  }
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-[#0d1325] px-4 py-3.5 outline-none focus:border-blue-500/60"
                >
                  <option>Head / Owner</option>
                  <option>Director</option>
                  <option>Principal</option>
                  <option>Founder</option>
                  <option>Administrator</option>
                </select>
              </div>

              <div>
                <label className="text-sm text-slate-300">
                  Phone *
                </label>

                <input
                  value={form.phone}
                  onChange={(event) =>
                    updateField(
                      "phone",
                      event.target.value,
                    )
                  }
                  placeholder="+91"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3.5 outline-none focus:border-blue-500/60"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-sm text-slate-300">
                  Account email *
                </label>

                <input
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    updateField(
                      "email",
                      event.target.value,
                    )
                  }
                  placeholder="admin@example.com"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3.5 outline-none focus:border-blue-500/60"
                />
              </div>

              <div>
                <label className="text-sm text-slate-300">
                  Password *
                </label>

                <input
                  type="password"
                  value={form.password}
                  onChange={(event) =>
                    updateField(
                      "password",
                      event.target.value,
                    )
                  }
                  placeholder="Minimum 8 characters"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3.5 outline-none focus:border-blue-500/60"
                />
              </div>

              <div>
                <label className="text-sm text-slate-300">
                  Confirm password *
                </label>

                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(event) =>
                    updateField(
                      "confirmPassword",
                      event.target.value,
                    )
                  }
                  placeholder="Repeat password"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3.5 outline-none focus:border-blue-500/60"
                />
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-blue-500/10 bg-blue-500/5 p-4">
              <p className="text-sm font-semibold text-blue-300">
                🔐 Important
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-400">
                This account will be created as the
                institution HEAD. From this account,
                you will manage teachers, staff,
                students, classes, fees and other
                institution data.
              </p>
            </div>

            {error && (
              <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-7 w-full rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-4 font-semibold shadow-xl shadow-blue-900/20 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Creating secure session..."
                : "Continue to Verification →"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}