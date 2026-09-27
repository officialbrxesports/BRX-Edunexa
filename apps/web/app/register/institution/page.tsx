"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function InstitutionPage() {
  const router = useRouter();

  const [type, setType] = useState("");

  const [form, setForm] = useState({
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

  useEffect(() => {
    const saved =
      localStorage.getItem(
        "brx_registration_type",
      );

    if (!saved) {
      router.replace("/register");
      return;
    }

    setType(saved);
  }, [router]);

  const update = (
    key: keyof typeof form,
    value: string,
  ) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();

    localStorage.setItem(
      "brx_institution_details",
      JSON.stringify(form),
    );

    router.push("/register/owner");
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#07112f] text-white">

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 -top-40 h-[450px] w-[450px] rounded-full bg-blue-500/20 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-indigo-500/20 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-4xl p-5 sm:p-8">

        <div className="mb-6">
          <p className="text-xs font-bold tracking-[0.2em] text-blue-300">
            STEP 2 OF 5
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            Institution Details
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Tell us about your institution.
          </p>
        </div>

        <form
          onSubmit={submit}
          className="rounded-[32px] border border-white/15 bg-white/[0.07] p-6 shadow-2xl backdrop-blur-2xl sm:p-10"
        >

          <div className="grid gap-5 sm:grid-cols-2">

            <Field
              label="Institution Name"
              required
              value={form.name}
              onChange={(v) => update("name", v)}
              placeholder="BRX Excellence Coaching"
            />

            <Field
              label="Institution Phone"
              value={form.phone}
              onChange={(v) => update("phone", v)}
              placeholder="+91 XXXXX XXXXX"
            />

            <Field
              label="Institution Email"
              value={form.email}
              onChange={(v) => update("email", v)}
              placeholder="info@example.com"
              type="email"
            />

            <Field
              label="Website"
              value={form.website}
              onChange={(v) => update("website", v)}
              placeholder="https://example.com"
            />

            <div className="sm:col-span-2">
              <Field
                label="Full Address"
                required
                value={form.address}
                onChange={(v) =>
                  update("address", v)
                }
                placeholder="Full institution address"
              />
            </div>

            <Field
              label="City"
              required
              value={form.city}
              onChange={(v) => update("city", v)}
              placeholder="Patna"
            />

            <Field
              label="State"
              required
              value={form.state}
              onChange={(v) => update("state", v)}
              placeholder="Bihar"
            />

            <Field
              label="PIN Code"
              required
              value={form.pincode}
              onChange={(v) =>
                update("pincode", v)
              }
              placeholder="800001"
            />

            <Field
              label="Established Year"
              value={form.establishedYear}
              onChange={(v) =>
                update("establishedYear", v)
              }
              placeholder="2026"
            />

            <Field
              label="Registration Number"
              value={form.registrationNumber}
              onChange={(v) =>
                update(
                  "registrationNumber",
                  v,
                )
              }
              placeholder="Optional"
            />

            <Field
              label="GSTIN"
              value={form.gstin}
              onChange={(v) =>
                update("gstin", v)
              }
              placeholder="Optional"
            />

          </div>

          <div className="mt-8 flex gap-3">

            <button
              type="button"
              onClick={() =>
                router.push("/register")
              }
              className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-semibold text-slate-300"
            >
              ← Back
            </button>

            <button
              type="submit"
              className="flex-1 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-4 text-sm font-bold shadow-xl"
            >
              Continue →
            </button>

          </div>

        </form>

      </div>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  required,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-300">
        {label}
        {required && (
          <span className="ml-1 text-red-400">
            *
          </span>
        )}
      </label>

      <input
        type={type}
        value={value}
        required={required}
        onChange={(e) =>
          onChange(e.target.value)
        }
        placeholder={placeholder}
        className="w-full rounded-2xl border border-white/15 bg-white/[0.06] px-4 py-3.5 text-sm text-white outline-none backdrop-blur-xl transition placeholder:text-slate-600 focus:border-blue-400/60 focus:bg-white/10 focus:ring-4 focus:ring-blue-500/10"
      />
    </div>
  );
}