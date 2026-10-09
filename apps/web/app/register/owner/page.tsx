"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api";

type InstitutionType =
  | "SCHOOL"
  | "COLLEGE"
  | "UNIVERSITY"
  | "COACHING"
  | "INSTITUTE"
  | "OTHER";

type GoogleProfile = {
  email?: string;
  given_name?: string;
  family_name?: string;
  name?: string;
};

type RegistrationResponse = {
  success?: boolean;
  message?: string;
  session?: {
    id?: string;
    emailVerified?: boolean;
  };
  sessionId?: string;
  requiresPassword?: boolean;
  googleVerified?: boolean;
};

const institutionLabels: Record<InstitutionType, string> = {
  SCHOOL: "School",
  COLLEGE: "College",
  UNIVERSITY: "University",
  COACHING: "Coaching",
  INSTITUTE: "Institute",
  OTHER: "Other",
};

const designations = [
  "Owner",
  "Founder",
  "Co-Founder",
  "Director",
  "Managing Director",
  "Principal",
  "Chairman",
  "Chairperson",
  "Administrator",
  "Head",
  "Dean",
  "Registrar",
  "Secretary",
  "Manager",
  "Proprietor",
  "Trustee",
  "Other",
];

const inputClass =
  "mt-2 w-full rounded-2xl border border-white/10 bg-[#0b1227] px-4 py-3.5 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500/70 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60";

const labelClass = "text-sm font-medium text-slate-300";

export default function OwnerRegistrationPage() {
  const router = useRouter();

  const [institutionType, setInstitutionType] =
    useState<InstitutionType | "">("");

  const [googleMode, setGoogleMode] = useState(false);
  const [googleCredential, setGoogleCredential] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Institution details
  const [institutionName, setInstitutionName] = useState("");
  const [institutionPhone, setInstitutionPhone] = useState("");
  const [institutionEmail, setInstitutionEmail] = useState("");

  const [country, setCountry] = useState("India");
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");
  const [city, setCity] = useState("");
  const [pinCode, setPinCode] = useState("");

  const [postOffice, setPostOffice] = useState("");
  const [policeStation, setPoliceStation] = useState("");
  const [area, setArea] = useState("");
  const [street, setStreet] = useState("");
  const [building, setBuilding] = useState("");
  const [landmark, setLandmark] = useState("");

  const [address, setAddress] = useState("");
  const [website, setWebsite] = useState("");

  const [establishedYear, setEstablishedYear] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [gstin, setGstin] = useState("");

  // HEAD details
  const [designation, setDesignation] = useState("Owner");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");

  useEffect(() => {
    const storedType =
      sessionStorage.getItem("brx_institution_type") ||
      localStorage.getItem("brx_registration_type");

    if (
      !storedType ||
      !Object.prototype.hasOwnProperty.call(
        institutionLabels,
        storedType.toUpperCase(),
      )
    ) {
      router.replace("/register");
      return;
    }

    setInstitutionType(storedType.toUpperCase() as InstitutionType);

    const credential = sessionStorage.getItem("brx_google_credential");
    const profileRaw = sessionStorage.getItem("brx_google_profile");

    setGoogleMode(Boolean(credential && profileRaw));

    if (credential) {
      setGoogleCredential(credential);
    }

    if (profileRaw) {
      try {
        const profile: GoogleProfile = JSON.parse(profileRaw);

        setFirstName((previous) => previous || profile.given_name || "");
        setLastName((previous) => previous || profile.family_name || "");
        setOwnerEmail((previous) => previous || profile.email || "");
      } catch {
        // Ignore invalid saved Google profile.
      }
    }

    try {
      const institutionRaw = localStorage.getItem(
        "brx_institution_details",
      );

      if (institutionRaw) {
        const data = JSON.parse(institutionRaw);

        setInstitutionName(data.institutionName ?? "");
        setInstitutionPhone(data.institutionPhone ?? data.phone ?? "");
        setInstitutionEmail(data.institutionEmail ?? data.email ?? "");
        setCountry(data.country ?? "India");
        setState(data.state ?? "");
        setDistrict(data.district ?? "");
        setCity(data.city ?? "");
        setPinCode(data.pinCode ?? "");
        setPostOffice(data.postOffice ?? "");
        setPoliceStation(data.policeStation ?? "");
        setArea(data.area ?? "");
        setStreet(data.street ?? "");
        setBuilding(data.building ?? "");
        setLandmark(data.landmark ?? "");
        setAddress(data.address ?? "");
        setWebsite(data.website ?? "");
        setEstablishedYear(
          data.establishedYear
            ? String(data.establishedYear)
            : "",
        );
        setRegistrationNumber(data.registrationNumber ?? "");
        setGstin(data.gstin ?? "");
      }

      const ownerRaw = localStorage.getItem("brx_owner_details");

      if (ownerRaw) {
        const data = JSON.parse(ownerRaw);

        setDesignation(data.designation ?? "Owner");
        setFirstName((previous) => previous || data.firstName || "");
        setLastName((previous) => previous || data.lastName || "");
        setOwnerPhone(data.ownerPhone ?? data.phone ?? "");
        setOwnerEmail((previous) => previous || data.ownerEmail || data.email || "");
      }
    } catch {
      // Ignore invalid saved form data.
    }
  }, [router]);

  function validateForm(): string {
    if (!institutionType) {
      return "Please select an institution type.";
    }

    if (institutionName.trim().length < 2) {
      return "Please enter the institution name.";
    }

    if (institutionPhone.replace(/\D/g, "").length < 10) {
      return "Please enter a valid institution phone number.";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(institutionEmail.trim())) {
      return "Please enter a valid institution email.";
    }

    if (country.trim().length < 2) {
      return "Please enter the country.";
    }

    if (state.trim().length < 2) {
      return "Please enter the state.";
    }

    if (!designation.trim()) {
      return "Please select the HEAD designation.";
    }

    if (firstName.trim().length < 2) {
      return "Please enter the HEAD first name.";
    }

    if (ownerPhone.replace(/\D/g, "").length < 10) {
      return "Please enter a valid HEAD mobile number.";
    }

    if (!googleMode) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerEmail.trim())) {
        return "Please enter a valid HEAD email.";
      }

      if (
        ownerEmail.trim().toLowerCase() ===
        institutionEmail.trim().toLowerCase()
      ) {
        return "Use a separate email for the institution and the HEAD account.";
      }
    }

    if (website.trim()) {
      try {
        const parsed = new URL(website.trim());

        if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
          return "Website must start with http:// or https://.";
        }
      } catch {
        return "Please enter a valid website URL.";
      }
    }

    if (establishedYear.trim()) {
      const year = Number(establishedYear);

      if (!Number.isInteger(year) || year < 2000 || year > 2100) {
        return "Established year must be between 2000 and 2100.";
      }
    }

    return "";
  }

  function saveDetails() {
    const institution = {
      institutionType,
      institutionName: institutionName.trim(),
      institutionPhone: institutionPhone.trim(),
      institutionEmail: institutionEmail.trim().toLowerCase(),
      country: country.trim(),
      state: state.trim(),
      district: district.trim(),
      city: city.trim(),
      pinCode: pinCode.trim(),
      postOffice: postOffice.trim(),
      policeStation: policeStation.trim(),
      area: area.trim(),
      street: street.trim(),
      building: building.trim(),
      landmark: landmark.trim(),
      address: address.trim(),
      website: website.trim(),
      establishedYear: establishedYear
        ? Number(establishedYear)
        : undefined,
      registrationNumber: registrationNumber.trim(),
      gstin: gstin.trim().toUpperCase(),
    };

    const owner = {
      designation,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      ownerPhone: ownerPhone.trim(),
      ownerEmail: ownerEmail.trim().toLowerCase(),
    };

    localStorage.setItem(
      "brx_institution_details",
      JSON.stringify(institution),
    );

    localStorage.setItem(
      "brx_owner_details",
      JSON.stringify(owner),
    );

    return { institution, owner };
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) return;

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    if (googleMode && !googleCredential) {
      setError("Google session expired. Please start Google registration again.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { institution, owner } = saveDetails();

      const commonPayload = {
        institutionType,
        institutionName: institution.institutionName,
        institutionPhone: institution.institutionPhone,
        institutionEmail: institution.institutionEmail,
        country: institution.country,
        state: institution.state,

        district: institution.district || undefined,
        city: institution.city || undefined,
        pinCode: institution.pinCode || undefined,
        postOffice: institution.postOffice || undefined,
        policeStation: institution.policeStation || undefined,
        area: institution.area || undefined,
        street: institution.street || undefined,
        building: institution.building || undefined,
        landmark: institution.landmark || undefined,
        address: institution.address || undefined,
        website: institution.website || undefined,

        establishedYear: institution.establishedYear,
        registrationNumber: institution.registrationNumber || undefined,
        gstin: institution.gstin || undefined,

        designation: owner.designation,
        firstName: owner.firstName,
        lastName: owner.lastName || undefined,
        ownerPhone: owner.ownerPhone,
      };

      const endpoint = googleMode
        ? `${API_URL}/registration/google`
        : `${API_URL}/registration/session`;

      const payload = googleMode
        ? {
            ...commonPayload,
            credential: googleCredential,
          }
        : {
            ...commonPayload,
            ownerEmail: owner.ownerEmail,
          };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data: RegistrationResponse = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        const message = Array.isArray(data.message)
          ? data.message.join(", ")
          : data.message;

        throw new Error(
          message || "Unable to create the registration session.",
        );
      }

      const sessionId = data.session?.id ?? data.sessionId;

      if (!sessionId) {
        throw new Error(
          "The API did not return a registration session ID.",
        );
      }

      localStorage.setItem("brx_registration_session_id", sessionId);
      localStorage.removeItem("brx_registration_verified");
      localStorage.removeItem("brx_registration_result");

      if (googleMode) {
        // Google onboarding already verifies the Google email.
        localStorage.setItem(
          "brx_registration_verified",
          JSON.stringify({
            emailVerified: true,
            mobileVerified: false,
            completed: true,
          }),
        );
      }

      router.push("/register/verify");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Registration failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  const institutionLabel = institutionType
    ? institutionLabels[institutionType]
    : "Institution";

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#07112f] text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[450px] w-[450px] rounded-full bg-blue-500/20 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-indigo-500/20 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-12">
        <button
          type="button"
          onClick={() => router.push("/register")}
          disabled={loading}
          className="mb-6 text-sm font-semibold text-slate-400 transition hover:text-white disabled:opacity-50"
        >
          ← Change institution type
        </button>

        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold tracking-[0.2em] text-blue-300">
              BRX EDUNEXA
            </p>

            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
              Institution & HEAD Details
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Register your institution and the primary authority who will
              manage it. Teacher, staff and student accounts can be managed
              later by the HEAD.
            </p>
          </div>

          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-4 py-2 text-xs font-semibold text-blue-300">
            {institutionLabel}
          </span>
        </header>

        {googleMode && (
          <div className="mb-6 rounded-2xl border border-blue-400/20 bg-blue-500/[0.08] p-4">
            <p className="text-sm font-semibold text-blue-200">
              Google account setup
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-400">
              Your Google email is verified. After this step, you will continue
              to the password/registration flow.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="rounded-[28px] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur-2xl sm:p-8">
            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-300">
                STEP 1
              </p>
              <h2 className="mt-2 text-xl font-bold">Institution details</h2>
              <p className="mt-1 text-sm text-slate-500">
                Basic information and location.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={labelClass}>Institution name *</label>
                <input
                  required
                  minLength={2}
                  value={institutionName}
                  onChange={(e) => setInstitutionName(e.target.value)}
                  placeholder="e.g. BRX Public School"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Institution phone *</label>
                <input
                  required
                  type="tel"
                  inputMode="numeric"
                  value={institutionPhone}
                  onChange={(e) =>
                    setInstitutionPhone(e.target.value.replace(/\D/g, "").slice(0, 15))
                  }
                  placeholder="Institution contact number"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Official institution email *</label>
                <input
                  required
                  type="email"
                  value={institutionEmail}
                  onChange={(e) => setInstitutionEmail(e.target.value)}
                  placeholder="institution@example.com"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Country *</label>
                <input
                  required
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>State *</label>
                <input
                  required
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="e.g. Bihar"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>District</label>
                <input
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="District"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>City / Town</label>
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="City or town"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>PIN code</label>
                <input
                  inputMode="numeric"
                  value={pinCode}
                  onChange={(e) =>
                    setPinCode(e.target.value.replace(/\D/g, "").slice(0, 10))
                  }
                  placeholder="PIN code"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Post office</label>
                <input
                  value={postOffice}
                  onChange={(e) => setPostOffice(e.target.value)}
                  placeholder="Post office"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Police station</label>
                <input
                  value={policeStation}
                  onChange={(e) => setPoliceStation(e.target.value)}
                  placeholder="Police station"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Area / Locality</label>
                <input
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="Area or locality"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Street / Road</label>
                <input
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="Street or road"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Building</label>
                <input
                  value={building}
                  onChange={(e) => setBuilding(e.target.value)}
                  placeholder="Building name or number"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Landmark</label>
                <input
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder="Nearby landmark"
                  className={inputClass}
                />
              </div>

              <div className="sm:col-span-2">
                <label className={labelClass}>Full address</label>
                <textarea
                  rows={3}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Complete address (optional if entered above)"
                  className={inputClass}
                />
              </div>

              <div className="sm:col-span-2">
                <label className={labelClass}>Website (optional)</label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://example.com"
                  className={inputClass}
                />
              </div>
            </div>
          </section>

          {!googleMode && (
            <section className="rounded-[28px] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur-2xl sm:p-8">
              <div className="mb-6">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-300">
                  OPTIONAL
                </p>
                <h2 className="mt-2 text-xl font-bold">
                  Registration information
                </h2>
              </div>

              <div className="grid gap-5 sm:grid-cols-3">
                <div>
                  <label className={labelClass}>Established year</label>
                  <input
                    type="number"
                    min={2000}
                    max={2100}
                    value={establishedYear}
                    onChange={(e) => setEstablishedYear(e.target.value)}
                    placeholder="2020"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Registration number</label>
                  <input
                    value={registrationNumber}
                    onChange={(e) => setRegistrationNumber(e.target.value)}
                    placeholder="Registration number"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>GSTIN</label>
                  <input
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value.toUpperCase())}
                    placeholder="GSTIN"
                    className={inputClass}
                  />
                </div>
              </div>
            </section>
          )}

          <section className="rounded-[28px] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur-2xl sm:p-8">
            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-300">
                STEP 2
              </p>
              <h2 className="mt-2 text-xl font-bold">Primary authority / HEAD</h2>
              <p className="mt-1 text-sm text-slate-500">
                This person will manage the institution.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Designation *</label>
                <select
                  required
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  className={inputClass}
                >
                  {designations.map((item) => (
                    <option key={item} value={item} className="bg-[#0b1227]">
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>First name *</label>
                <input
                  required
                  minLength={2}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First name"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Last name</label>
                <input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last name"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>HEAD mobile *</label>
                <input
                  required
                  type="tel"
                  inputMode="numeric"
                  value={ownerPhone}
                  onChange={(e) =>
                    setOwnerPhone(e.target.value.replace(/\D/g, "").slice(0, 15))
                  }
                  placeholder="HEAD mobile number"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>HEAD email *</label>
                <input
                  required
                  type="email"
                  value={ownerEmail}
                  onChange={(e) => setOwnerEmail(e.target.value)}
                  disabled={googleMode}
                  placeholder="head@example.com"
                  className={inputClass}
                />

                {googleMode && (
                  <p className="mt-2 text-xs text-slate-500">
                    This email comes from your Google account.
                  </p>
                )}
              </div>
            </div>
          </section>

          {error && (
            <div
              role="alert"
              className="rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-300"
            >
              {error}
            </div>
          )}

          <div className="rounded-[28px] border border-white/10 bg-white/[0.05] p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold">Ready to continue?</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {googleMode
                    ? "Your Google email is already verified."
                    : "We will create a temporary registration session. Email verification and password setup come next."}
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-7 py-4 text-sm font-bold shadow-xl shadow-blue-600/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "Please wait..."
                  : googleMode
                    ? "Continue with Google →"
                    : "Continue to Email Verification →"}
              </button>
            </div>
          </div>
        </form>

        <p className="mt-7 text-center text-xs text-slate-600">
          BRX EduNexa • Secure institution registration
        </p>
      </div>
    </main>
  );
}