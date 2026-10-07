"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "/api";

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

  const [isGoogleOnboarding, setIsGoogleOnboarding] =
    useState(false);

  const [googleCredential, setGoogleCredential] =
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

  const [form, setForm] =
    useState<OwnerDetails>({
      firstName: "",
      lastName: "",
      designation: "Head / Owner",
      phone: "",
      email: "",
      password: "",
      confirmPassword: "",
    });

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  // ============================================
  // Load registration / Google onboarding state
  // ============================================

  useEffect(() => {
    const googleCredentialValue =
      sessionStorage.getItem(
        "brx_google_credential",
      );

    const googleProfileRaw =
      sessionStorage.getItem(
        "brx_google_profile",
      );

    const googleMode =
      Boolean(
        googleCredentialValue &&
          googleProfileRaw,
      );

    setIsGoogleOnboarding(
      googleMode,
    );

    if (googleMode) {
      setGoogleCredential(
        googleCredentialValue || "",
      );

      try {
        const profile =
          JSON.parse(
            googleProfileRaw || "{}",
          );

        const nameParts =
          typeof profile.name === "string"
            ? profile.name
                .trim()
                .split(/\s+/)
            : [];

        const firstName =
          nameParts[0] ||
          "";

        const lastName =
          nameParts.length > 1
            ? nameParts
                .slice(1)
                .join(" ")
            : "";

        setForm(
          (previous) => ({
            ...previous,
            firstName,
            lastName,
            email:
              profile.email || "",
          }),
        );
      } catch {
        setError(
          "Unable to read Google account details.",
        );
      }

      const googleType =
        sessionStorage.getItem(
          "brx_institution_type",
        );

      if (!googleType) {
        router.replace(
          "/register/institution",
        );
        return;
      }

      setInstitutionType(
        googleType,
      );

      return;
    }

    // ==========================================
    // Normal registration flow
    // ==========================================

    const type =
      localStorage.getItem(
        "brx_registration_type",
      );

    const institutionRaw =
      localStorage.getItem(
        "brx_institution_details",
      );

    if (!type || !institutionRaw) {
      router.replace(
        "/register",
      );
      return;
    }

    setInstitutionType(type);

    try {
      const parsed =
        JSON.parse(
          institutionRaw,
        );

      setInstitution(parsed);

      setForm(
        (previous) => ({
          ...previous,
          phone:
            parsed.phone || "",
          email:
            parsed.email || "",
        }),
      );
    } catch {
      router.replace(
        "/register/institution",
      );
    }
  }, [router]);

  // ============================================
  // Update owner field
  // ============================================

  function updateField(
    field: keyof OwnerDetails,
    value: string,
  ) {
    setForm(
      (previous) => ({
        ...previous,
        [field]: value,
      }),
    );
  }

  // ============================================
  // Submit
  // ============================================

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");

    // ==========================================
    // Common validation
    // ==========================================

    if (!form.firstName.trim()) {
      setError(
        "Please enter your first name.",
      );
      return;
    }

    if (!form.phone.trim()) {
      setError(
        "Please enter your phone number.",
      );
      return;
    }

    if (!institutionType) {
      setError(
        "Institution type is missing.",
      );
      return;
    }

    // ==========================================
    // GOOGLE ONBOARDING
    // ==========================================

    if (isGoogleOnboarding) {
      if (!googleCredential) {
        setError(
          "Google verification is missing. Please login with Google again.",
        );
        return;
      }

      if (!institution.name.trim()) {
        setError(
          "Please enter your institution name.",
        );
        return;
      }

      if (!institution.phone.trim()) {
        setError(
          "Please enter your institution phone.",
        );
        return;
      }

      if (!institution.email.trim()) {
        setError(
          "Please enter your institution email.",
        );
        return;
      }

      if (!institution.state.trim()) {
        setError(
          "Please enter your institution state.",
        );
        return;
      }

      setLoading(true);

      try {
        const response =
          await fetch(
            `${API_URL}/registration/google`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                credential:
                  googleCredential,

                institutionType,

                institutionName:
                  institution.name.trim(),

                institutionPhone:
                  institution.phone.trim(),

                institutionEmail:
                  institution.email
                    .trim()
                    .toLowerCase(),

                country:
                  "India",

                state:
                  institution.state.trim(),

                city:
                  institution.city.trim() ||
                  undefined,

                address:
                  institution.address.trim() ||
                  undefined,

                website:
                  institution.website.trim() ||
                  undefined,

                firstName:
                  form.firstName.trim(),

                lastName:
                  form.lastName.trim() ||
                  undefined,

                ownerPhone:
                  form.phone.trim(),
              }),
            },
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Unable to complete Google onboarding.",
          );
        }

        if (
          !data?.head?.id ||
          !data?.head?.brxUid
        ) {
          throw new Error(
            "HEAD account or BRX UID was not returned.",
          );
        }

        // ======================================
        // Google onboarding completed
        // ======================================

        if (!data?.accessToken) {
          throw new Error(
            "Account was created, but login token was not returned.",
          );
        }

        // Save authenticated session
        localStorage.setItem(
          "brx_access_token",
          data.accessToken,
        );

        document.cookie = `brx_access_token=${encodeURIComponent(
          data.accessToken,
        )}; path=/; max-age=${60 * 60}; SameSite=Lax`;

        // Save onboarding result for success page
        sessionStorage.setItem(
          "brx_google_onboarding_result",
          JSON.stringify({
            institution:
              data.institution,
            head:
              data.head,
            user:
              data.user,
          }),
        );

        // Clear temporary Google data
        sessionStorage.removeItem(
          "brx_google_credential",
        );

        sessionStorage.removeItem(
          "brx_google_profile",
        );

        sessionStorage.removeItem(
          "brx_institution_type",
        );

        router.push(
          "/dashboard",
        );

        return;
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to complete Google onboarding.",
        );
      } finally {
        setLoading(false);
      }

      return;
    }

    // ============================================
    // NORMAL PASSWORD REGISTRATION
    // ============================================

    if (!form.email.trim()) {
      setError(
        "Please enter your email.",
      );
      return;
    }

    if (form.password.length < 8) {
      setError(
        "Password must contain at least 8 characters.",
      );
      return;
    }

    if (
      form.password !==
      form.confirmPassword
    ) {
      setError(
        "Passwords do not match.",
      );
      return;
    }

    setLoading(true);

    try {
      const response =
        await fetch(
          `${API_URL}/registration/session`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              institutionType,

              institutionName:
                institution.name,

              phone:
                institution.phone,

              email:
                institution.email,

              country:
                "India",

              state:
                institution.state,

              city:
                institution.city,

              address:
                institution.address,

              website:
                institution.website ||
                undefined,

              firstName:
                form.firstName,

              lastName:
                form.lastName ||
                undefined,

              ownerPhone:
                form.phone,

              ownerEmail:
                form.email,

              password:
                form.password,

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
                institution.gstin ||
                undefined,
            }),
          },
        );

      const data =
        await response.json();

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
        JSON.stringify(
          data.session,
        ),
      );

      router.push(
        "/register/verify",
      );
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

      {/* Background */}
      <div className="absolute inset-0 overflow-hidden">

        <div className="absolute left-[-100px] top-[-100px] h-[360px] w-[360px] rounded-full bg-blue-600/20 blur-[120px]" />

        <div className="absolute bottom-[-120px] right-[-100px] h-[420px] w-[420px] rounded-full bg-violet-600/20 blur-[130px]" />

      </div>

      <div className="relative flex min-h-screen items-center justify-center px-5 py-10">

        <div className="w-full max-w-2xl">

          {/* Header */}
          <div className="mb-7">

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/register/institution",
                )
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
              {isGoogleOnboarding
                ? "Your Google account is verified. Complete the institution details to create your BRX Head account."
                : "This account will become the main administrator of your institution."}
            </p>

          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="rounded-[28px] border border-white/10 bg-white/[0.06] p-6 shadow-2xl shadow-black/30 backdrop-blur-2xl sm:p-8"
          >

            {/* Google verified banner */}
            {isGoogleOnboarding && (
              <div className="mb-6 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4">

                <p className="text-sm font-semibold text-emerald-300">
                  ✓ Google account verified
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  {form.email}
                </p>

              </div>
            )}

            {/* Institution */}
            <div className="mb-7">

              <h2 className="mb-4 text-lg font-semibold">
                Institution details
              </h2>

              <div className="grid gap-5 sm:grid-cols-2">

                <div className="sm:col-span-2">

                  <label className="text-sm text-slate-300">
                    Institution name *
                  </label>

                  <input
                    value={institution.name}
                    onChange={(event) =>
                      setInstitution(
                        (previous) => ({
                          ...previous,
                          name:
                            event.target.value,
                        }),
                      )
                    }
                    placeholder="School / College / Institute name"
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3.5 outline-none focus:border-blue-500/60"
                  />

                </div>

                <div>

                  <label className="text-sm text-slate-300">
                    Institution phone *
                  </label>

                  <input
                    value={institution.phone}
                    onChange={(event) =>
                      setInstitution(
                        (previous) => ({
                          ...previous,
                          phone:
                            event.target.value,
                        }),
                      )
                    }
                    placeholder="+91"
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3.5 outline-none focus:border-blue-500/60"
                  />

                </div>

                <div>

                  <label className="text-sm text-slate-300">
                    Institution email *
                  </label>

                  <input
                    type="email"
                    value={institution.email}
                    onChange={(event) =>
                      setInstitution(
                        (previous) => ({
                          ...previous,
                          email:
                            event.target.value,
                        }),
                      )
                    }
                    placeholder="institution@example.com"
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3.5 outline-none focus:border-blue-500/60"
                  />

                </div>

                <div>

                  <label className="text-sm text-slate-300">
                    State *
                  </label>

                  <input
                    value={institution.state}
                    onChange={(event) =>
                      setInstitution(
                        (previous) => ({
                          ...previous,
                          state:
                            event.target.value,
                        }),
                      )
                    }
                    placeholder="Bihar"
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3.5 outline-none focus:border-blue-500/60"
                  />

                </div>

                <div>

                  <label className="text-sm text-slate-300">
                    City
                  </label>

                  <input
                    value={institution.city}
                    onChange={(event) =>
                      setInstitution(
                        (previous) => ({
                          ...previous,
                          city:
                            event.target.value,
                        }),
                      )
                    }
                    placeholder="City"
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3.5 outline-none focus:border-blue-500/60"
                  />

                </div>

                <div className="sm:col-span-2">

                  <label className="text-sm text-slate-300">
                    Address
                  </label>

                  <textarea
                    value={institution.address}
                    onChange={(event) =>
                      setInstitution(
                        (previous) => ({
                          ...previous,
                          address:
                            event.target.value,
                        }),
                      )
                    }
                    placeholder="Institution address"
                    rows={3}
                    className="mt-2 w-full resize-none rounded-2xl border border-white/10 bg-black/20 px-4 py-3.5 outline-none focus:border-blue-500/60"
                  />

                </div>

                <div>

                  <label className="text-sm text-slate-300">
                    Website
                  </label>

                  <input
                    value={institution.website}
                    onChange={(event) =>
                      setInstitution(
                        (previous) => ({
                          ...previous,
                          website:
                            event.target.value,
                        }),
                      )
                    }
                    placeholder="https://example.com"
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3.5 outline-none focus:border-blue-500/60"
                  />

                </div>

                <div>

                  <label className="text-sm text-slate-300">
                    Established year
                  </label>

                  <input
                    value={
                      institution.establishedYear
                    }
                    onChange={(event) =>
                      setInstitution(
                        (previous) => ({
                          ...previous,
                          establishedYear:
                            event.target.value,
                        }),
                      )
                    }
                    placeholder="2020"
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3.5 outline-none focus:border-blue-500/60"
                  />

                </div>

              </div>

            </div>

            {/* Owner */}
            <div>

              <h2 className="mb-4 text-lg font-semibold">
                Head / Owner details
              </h2>

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
                    <option>
                      Head / Owner
                    </option>
                    <option>
                      Director
                    </option>
                    <option>
                      Principal
                    </option>
                    <option>
                      Founder
                    </option>
                    <option>
                      Administrator
                    </option>
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
                    Account email
                  </label>

                  <input
                    type="email"
                    value={form.email}
                    readOnly={
                      isGoogleOnboarding
                    }
                    onChange={(event) =>
                      updateField(
                        "email",
                        event.target.value,
                      )
                    }
                    className={`mt-2 w-full rounded-2xl border border-white/10 px-4 py-3.5 outline-none focus:border-blue-500/60 ${
                      isGoogleOnboarding
                        ? "cursor-not-allowed bg-white/5 text-slate-400"
                        : "bg-black/20"
                    }`}
                  />

                </div>

                {/* Password only for normal registration */}
                {!isGoogleOnboarding && (
                  <>
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
                        value={
                          form.confirmPassword
                        }
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
                  </>
                )}

              </div>

            </div>

            {/* Info */}
            <div className="mt-6 rounded-2xl border border-blue-500/10 bg-blue-500/5 p-4">

              <p className="text-sm font-semibold text-blue-300">
                🔐 Important
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-400">

                {isGoogleOnboarding
                  ? "Your Google account will be connected to this BRX EduNexa HEAD account. A unique BRX UID will be generated automatically."
                  : "This account will be created as the institution HEAD. From this account, you will manage teachers, staff, students, classes, fees and other institution data."}

              </p>

            </div>

            {/* Error */}
            {error && (
              <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="mt-7 w-full rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-4 font-semibold shadow-xl shadow-blue-900/20 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? isGoogleOnboarding
                  ? "Creating your BRX account..."
                  : "Creating secure session..."
                : isGoogleOnboarding
                  ? "Create BRX Head Account →"
                  : "Continue to Verification →"}
            </button>

          </form>

        </div>

      </div>

    </main>
  );
}