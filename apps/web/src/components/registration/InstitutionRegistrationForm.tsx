"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"
).replace(/\/+$/, "");

const categories = [
  { value: "COACHING", label: "Coaching" },
  { value: "SCHOOL", label: "School" },
  { value: "COLLEGE", label: "College" },
  { value: "UNIVERSITY", label: "University" },
  { value: "INSTITUTE", label: "Institute" },
  { value: "OTHER", label: "Other" },
] as const;

type InstitutionCategory = (typeof categories)[number]["value"];

type Gender =
  | ""
  | "Woman"
  | "Man"
  | "Non-binary"
  | "Prefer not to say"
  | "Self-describe";

type RegistrationResponse = {
  success?: boolean;
  message?: string;
  institutionId?: string;
  status?: string;
};

type RegistrationForm = {
  institutionName: string;
  category: InstitutionCategory;
  fullName: string;
  username: string;
  email: string;
  phone: string;
  birthDate: string;
  gender: Gender;
  street: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  password: string;
  confirmPassword: string;
  terms: boolean;
  marketing: boolean;
};

const initialForm: RegistrationForm = {
  institutionName: "",
  category: "COACHING",
  fullName: "",
  username: "",
  email: "",
  phone: "",
  birthDate: "",
  gender: "",
  street: "",
  city: "",
  region: "",
  postalCode: "",
  country: "India",
  password: "",
  confirmPassword: "",
  terms: false,
  marketing: false,
};

const inputClass =
  "mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-700 focus:ring-4 focus:ring-blue-100";

const labelClass = "block text-sm font-semibold text-slate-700";

function SectionHeading({
  number,
  title,
  subtitle,
}: {
  number: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-5 flex items-center gap-3 border-b border-blue-100 pb-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 font-bold text-blue-800">
        {number}
      </span>

      <div>
        <h2 className="text-base font-bold text-slate-900 sm:text-lg">
          {title}
        </h2>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </div>
    </div>
  );
}

function getPasswordStrength(password: string) {
  if (!password) {
    return {
      score: 0,
      label: "Use 8+ characters with a mix of letters and numbers.",
    };
  }

  let score = 0;

  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) {
    return { score, label: "Weak password" };
  }

  if (score <= 3) {
    return { score, label: "Moderate password" };
  }

  return { score, label: "Strong password" };
}

type InstitutionRegistrationFormProps = {
  initialCategory?: InstitutionCategory;
};

export default function InstitutionRegistrationForm({
  initialCategory = "COACHING",
}: InstitutionRegistrationFormProps) {
  const [form, setForm] = useState<RegistrationForm>(() => ({
    ...initialForm,
    category: initialCategory,
  }));
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [registeredId, setRegisteredId] = useState("");

  const passwordStrength = getPasswordStrength(form.password);

  function update(
    event: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    const { name, value, type } = event.target;

    const nextValue =
      type === "checkbox"
        ? (event.target as HTMLInputElement).checked
        : value;

    setForm((previous) => ({
      ...previous,
      [name]: nextValue,
    }));

    setError("");
  }

  function clearForm() {
    if (
      !window.confirm(
        "Are you sure you want to clear all registration details?"
      )
    ) {
      return;
    }

    setForm({ ...initialForm, category: initialCategory });
    setShowPassword(false);
    setShowConfirmPassword(false);
    setError("");
    setSuccess("");
    setRegisteredId("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");
    setRegisteredId("");

    if (!/^[A-Za-z0-9_]{3,20}$/.test(form.username)) {
      setError(
        "Username 3–20 characters ka hona chahiye. Sirf letters, numbers aur underscores use karein."
      );
      return;
    }

    if (form.password.length < 8) {
      setError("Password kam se kam 8 characters ka hona chahiye.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Password aur confirm password match nahi karte.");
      return;
    }

    if (!form.terms) {
      setError("Registration ke liye Terms of Service accept karna zaroori hai.");
      return;
    }

    setLoading(true);

    try {
      const details = {
        username: form.username.trim(),
        birthDate: form.birthDate || null,
        gender: form.gender || null,
        address: {
          street: form.street.trim(),
          city: form.city.trim(),
          region: form.region.trim(),
          postalCode: form.postalCode.trim(),
          country: form.country.trim(),
        },
        marketingConsent: form.marketing,
        termsAccepted: form.terms,
      };

      const payload = {
        category: form.category,
        institutionName: form.institutionName.trim(),
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || "Not provided",
        address:
          [
            form.street.trim(),
            form.city.trim(),
            form.region.trim(),
            form.postalCode.trim(),
            form.country.trim(),
          ]
            .filter(Boolean)
            .join(", ") || "Not provided",
        password: form.password,
        details,
      };

      const response = await fetch(`${API_URL}/institutions/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = (await response.json().catch(() => null)) as
        | RegistrationResponse
        | { message?: string | string[] }
        | null;

      if (!response.ok) {
        const message = result?.message;

        throw new Error(
          Array.isArray(message)
            ? message.join(", ")
            : message ||
                "Registration nahi ho saka. Details check karke dobara try karein."
        );
      }

      const registered = result as RegistrationResponse | null;

      setSuccess(
        registered?.message ||
          "Registration submit ho gaya. Approval ka wait karein."
      );

      setRegisteredId(registered?.institutionId || "");

      setForm({ ...initialForm, category: initialCategory });
      setShowPassword(false);
      setShowConfirmPassword(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Server se connection nahi ho saka."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="w-full overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-xl shadow-blue-950/10">
      <header className="relative isolate overflow-hidden bg-linear-to-r from-[#102d67] via-[#193f88] to-[#2871c7] px-5 py-9 text-white sm:px-9 sm:py-12 lg:px-12">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-linear-to-r from-[#0b2454]/30 via-transparent to-cyan-300/10"
        />

        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/30 bg-white/10 text-2xl font-extrabold">
          N
        </div>

        <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-200">
          Welcome aboard
        </p>

        <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
          Create your account
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100 sm:text-base">
          BRX EduNexa par apni institution register karein aur apna account
          setup karein.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold">
            Secure registration
          </span>
          <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold">
            Institution portal
          </span>
        </div>
      </header>

      <form onSubmit={submit} className="space-y-8 p-4 sm:p-7 lg:p-10">
        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          >
            <p className="font-bold">Registration error</p>
            <p className="mt-1">{error}</p>
          </div>
        )}

        {success && (
          <div
            role="status"
            aria-live="polite"
            className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"
          >
            <p className="font-bold">Registration submitted</p>
            <p className="mt-1">{success}</p>

            {registeredId && (
              <p className="mt-2 break-all text-xs">
                Registration ID: {registeredId}
              </p>
            )}

            <p className="mt-2">
              Institution status: { "Approval pending" }
            </p>
          </div>
        )}

        <section>
          <SectionHeading
            number="01"
            title="Institution information"
            subtitle="Tell us about your institution"
          />

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label htmlFor="category" className={labelClass}>
                Institution type <span className="text-red-600">*</span>
              </label>

              <select
                id="category"
                name="category"
                value={form.category}
                onChange={update}
                className={inputClass}
                required
              >
                {categories.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="institutionName" className={labelClass}>
                Institution name <span className="text-red-600">*</span>
              </label>

              <input
                id="institutionName"
                name="institutionName"
                value={form.institutionName}
                onChange={update}
                minLength={2}
                maxLength={150}
                autoComplete="organization"
                placeholder="e.g. BRX Learning Academy"
                className={inputClass}
                required
              />
            </div>
          </div>
        </section>

        <section>
          <SectionHeading
            number="02"
            title="Personal information"
            subtitle="Your primary account details"
          />

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label htmlFor="fullName" className={labelClass}>
                Full name <span className="text-red-600">*</span>
              </label>

              <input
                id="fullName"
                name="fullName"
                value={form.fullName}
                onChange={update}
                minLength={2}
                maxLength={80}
                autoComplete="name"
                placeholder="e.g. Aanya Sharma"
                className={inputClass}
                required
              />
            </div>

            <div>
              <label htmlFor="username" className={labelClass}>
                Username <span className="text-red-600">*</span>
              </label>

              <input
                id="username"
                name="username"
                value={form.username}
                onChange={update}
                minLength={3}
                maxLength={20}
                pattern="[A-Za-z0-9_]+"
                title="Use 3–20 letters, numbers, or underscores."
                autoComplete="username"
                placeholder="e.g. aanya123"
                className={inputClass}
                required
              />

              <p className="mt-1 text-xs text-slate-500">
                Letters, numbers aur underscores only.
              </p>
            </div>

            <div>
              <label htmlFor="email" className={labelClass}>
                Email address <span className="text-red-600">*</span>
              </label>

              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={update}
                maxLength={254}
                autoComplete="email"
                placeholder="you@example.com"
                className={inputClass}
                required
              />
            </div>

            <div>
              <label htmlFor="phone" className={labelClass}>
                Phone number <span className="text-slate-400">(optional)</span>
              </label>

              <input
                id="phone"
                name="phone"
                type="tel"
                value={form.phone}
                onChange={update}
                maxLength={20}
                autoComplete="tel"
                placeholder="+91 98765 43210"
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="birthDate" className={labelClass}>
                Date of birth <span className="text-slate-400">(optional)</span>
              </label>

              <input
                id="birthDate"
                name="birthDate"
                type="date"
                value={form.birthDate}
                onChange={update}
                autoComplete="bday"
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="gender" className={labelClass}>
                Gender <span className="text-slate-400">(optional)</span>
              </label>

              <select
                id="gender"
                name="gender"
                value={form.gender}
                onChange={update}
                className={inputClass}
              >
                <option value="">Select an option</option>
                <option value="Woman">Woman</option>
                <option value="Man">Man</option>
                <option value="Non-binary">Non-binary</option>
                <option value="Prefer not to say">Prefer not to say</option>
                <option value="Self-describe">Self-describe</option>
              </select>
            </div>
          </div>
        </section>

        <section>
          <SectionHeading
            number="03"
            title="Address"
            subtitle="Your contact address (optional)"
          />

          <div className="grid gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <label htmlFor="street" className={labelClass}>
                Street address
              </label>

              <input
                id="street"
                name="street"
                value={form.street}
                onChange={update}
                maxLength={120}
                autoComplete="street-address"
                placeholder="House / street / area"
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="city" className={labelClass}>
                City
              </label>

              <input
                id="city"
                name="city"
                value={form.city}
                onChange={update}
                maxLength={60}
                autoComplete="address-level2"
                placeholder="City"
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="region" className={labelClass}>
                State / region
              </label>

              <input
                id="region"
                name="region"
                value={form.region}
                onChange={update}
                maxLength={60}
                autoComplete="address-level1"
                placeholder="State"
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="postalCode" className={labelClass}>
                Postal code
              </label>

              <input
                id="postalCode"
                name="postalCode"
                value={form.postalCode}
                onChange={update}
                maxLength={16}
                autoComplete="postal-code"
                placeholder="PIN code"
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="country" className={labelClass}>
                Country
              </label>

              <input
                id="country"
                name="country"
                value={form.country}
                onChange={update}
                maxLength={60}
                autoComplete="country-name"
                placeholder="Country"
                className={inputClass}
              />
            </div>
          </div>
        </section>

        <section>
          <SectionHeading
            number="04"
            title="Account security"
            subtitle="Create a strong password"
          />

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label htmlFor="password" className={labelClass}>
                Password <span className="text-red-600">*</span>
              </label>

              <div className="relative mt-1.5">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={update}
                  minLength={8}
                  maxLength={128}
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  className={`${inputClass} mt-0 pr-16`}
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((previous) => !previous)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-3 my-auto h-8 text-sm font-semibold text-blue-800"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              <div
                className="mt-3 flex gap-1"
                aria-label={`Password strength: ${passwordStrength.label}`}
              >
                {[1, 2, 3, 4, 5].map((level) => (
                  <span
                    key={level}
                    className={`h-1.5 flex-1 rounded-full ${
                      passwordStrength.score >= level
                        ? passwordStrength.score <= 1
                          ? "bg-red-500"
                          : passwordStrength.score <= 3
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                        : "bg-slate-200"
                    }`}
                  />
                ))}
              </div>

              <p className="mt-2 text-xs text-slate-500" aria-live="polite">
                {passwordStrength.label}
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className={labelClass}>
                Confirm password <span className="text-red-600">*</span>
              </label>

              <div className="relative mt-1.5">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={form.confirmPassword}
                  onChange={update}
                  minLength={8}
                  maxLength={128}
                  autoComplete="new-password"
                  placeholder="Enter password again"
                  className={`${inputClass} mt-0 pr-16`}
                  required
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword((previous) => !previous)
                  }
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                  className="absolute inset-y-0 right-3 my-auto h-8 text-sm font-semibold text-blue-800"
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>

              {form.confirmPassword && (
                <p
                  className={`mt-2 text-xs ${
                    form.password === form.confirmPassword
                      ? "text-emerald-700"
                      : "text-red-600"
                  }`}
                >
                  {form.password === form.confirmPassword
                    ? "Passwords match."
                    : "Passwords do not match."}
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="space-y-4 border-t border-slate-200 pt-6">
          <label className="flex cursor-pointer items-start gap-3 text-sm text-slate-700">
            <input
              type="checkbox"
              name="terms"
              checked={form.terms}
              onChange={update}
              className="mt-1 h-4 w-4 shrink-0 accent-blue-800"
              required
            />

            <span>
              I agree to the{" "}
              <a
                href="/terms"
                className="font-semibold text-blue-800 underline underline-offset-2"
              >
                Terms of Service
              </a>{" "}
              and{" "}
              <a
                href="/privacy"
                className="font-semibold text-blue-800 underline underline-offset-2"
              >
                Privacy Policy
              </a>
              . <span className="text-red-600">*</span>
            </span>
          </label>

          <label className="flex cursor-pointer items-start gap-3 text-sm text-slate-600">
            <input
              type="checkbox"
              name="marketing"
              checked={form.marketing}
              onChange={update}
              className="mt-1 h-4 w-4 shrink-0 accent-blue-800"
            />

            <span>
              Send me product updates and occasional news (optional).
            </span>
          </label>
        </section>

        <div className="flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#193f88] px-6 py-3 font-bold text-white shadow-lg shadow-blue-900/20 transition hover:bg-blue-950 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Create account"}
            {!loading && <span aria-hidden="true">→</span>}
          </button>

          <button
            type="button"
            onClick={clearForm}
            disabled={loading}
            className="min-h-12 rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 sm:min-w-36"
          >
            Clear form
          </button>
        </div>
      </form>
    </section>
  );
}