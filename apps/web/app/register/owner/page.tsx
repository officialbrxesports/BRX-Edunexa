"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "/api";

type GoogleProfile = {
  email?: string;
  given_name?: string;
  family_name?: string;
  name?: string;
};

const institutionLabels: Record<string, string> = {
  SCHOOL: "School",
  COLLEGE: "College",
  UNIVERSITY: "University",
  COACHING: "Coaching",
  INSTITUTE: "Institute",
  OTHER: "Other",
};

export default function OwnerRegistrationPage() {
  const router = useRouter();

  const [institutionType, setInstitutionType] =
    useState("");

  const [isGoogleOnboarding, setIsGoogleOnboarding] =
    useState(false);

  const [googleCredential, setGoogleCredential] =
    useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Institution
  const [institutionName, setInstitutionName] =
    useState("");
  const [institutionPhone, setInstitutionPhone] =
    useState("");
  const [institutionEmail, setInstitutionEmail] =
    useState("");
  const [country, setCountry] =
    useState("India");
  const [state, setState] =
    useState("");
  const [city, setCity] =
    useState("");
  const [address, setAddress] =
    useState("");
  const [website, setWebsite] =
    useState("");

  // Optional institution setup
  const [establishedYear, setEstablishedYear] =
    useState("");
  const [registrationNumber, setRegistrationNumber] =
    useState("");
  const [gstin, setGstin] =
    useState("");

  // HEAD / Owner
  const [firstName, setFirstName] =
    useState("");
  const [lastName, setLastName] =
    useState("");
  const [ownerPhone, setOwnerPhone] =
    useState("");
  const [ownerEmail, setOwnerEmail] =
    useState("");
  const [password, setPassword] =
    useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  useEffect(() => {
    try {
      const storedType =
        sessionStorage.getItem(
          "brx_institution_type",
        ) ||
        localStorage.getItem(
          "brx_registration_type",
        );

      if (!storedType) {
        router.replace("/register");
        return;
      }

      setInstitutionType(
        storedType.trim().toUpperCase(),
      );

      const credential =
        sessionStorage.getItem(
          "brx_google_credential",
        );

      const profileRaw =
        sessionStorage.getItem(
          "brx_google_profile",
        );

      const googleMode =
        Boolean(credential && profileRaw);

      setIsGoogleOnboarding(googleMode);

      if (credential) {
        setGoogleCredential(credential);
      }

      if (profileRaw) {
        try {
          const profile: GoogleProfile =
            JSON.parse(profileRaw);

          if (profile.given_name) {
            setFirstName(profile.given_name);
          }

          if (profile.family_name) {
            setLastName(profile.family_name);
          }

          if (
            profile.email &&
            !ownerEmail
          ) {
            setOwnerEmail(profile.email);
          }
        } catch {
          // Ignore invalid Google profile.
        }
      }

      const storedInstitution =
        localStorage.getItem(
          "brx_institution_details",
        );

      if (storedInstitution) {
        try {
          const data =
            JSON.parse(storedInstitution);

          setInstitutionName(
            data.institutionName ?? "",
          );
          setInstitutionPhone(
            data.phone ?? "",
          );
          setInstitutionEmail(
            data.email ?? "",
          );
          setCountry(
            data.country ?? "India",
          );
          setState(data.state ?? "");
          setCity(data.city ?? "");
          setAddress(data.address ?? "");
          setWebsite(data.website ?? "");
          setEstablishedYear(
            data.establishedYear
              ? String(data.establishedYear)
              : "",
          );
          setRegistrationNumber(
            data.registrationNumber ?? "",
          );
          setGstin(data.gstin ?? "");
        } catch {
          // Ignore invalid saved data.
        }
      }

      const storedOwner =
        localStorage.getItem(
          "brx_owner_details",
        );

      if (storedOwner) {
        try {
          const data =
            JSON.parse(storedOwner);

          setFirstName(
            data.firstName ?? "",
          );
          setLastName(
            data.lastName ?? "",
          );
          setOwnerPhone(
            data.phone ?? "",
          );
          setOwnerEmail(
            data.email ?? "",
          );
        } catch {
          // Ignore invalid saved data.
        }
      }
    } catch {
      router.replace("/register");
    }
  }, [router]);

  const validateCommon = () => {
    if (!institutionType) {
      return "Please select an institution type.";
    }

    if (institutionName.trim().length < 2) {
      return "Please enter your institution name.";
    }

    if (
      institutionPhone.trim().length < 10
    ) {
      return "Please enter a valid institution phone number.";
    }

    if (!institutionEmail.trim()) {
      return "Please enter your institution email.";
    }

    if (state.trim().length < 2) {
      return "Please enter your state.";
    }

    if (firstName.trim().length < 2) {
      return "Please enter the HEAD first name.";
    }

    if (
      ownerPhone.trim().length < 10
    ) {
      return "Please enter the HEAD mobile number.";
    }

    return "";
  };

  const validateNormal = () => {
    const commonError = validateCommon();

    if (commonError) {
      return commonError;
    }

    if (!ownerEmail.trim()) {
      return "Please enter the HEAD email.";
    }

    if (password.length < 8) {
      return "Password must be at least 8 characters.";
    }

    if (password !== confirmPassword) {
      return "Passwords do not match.";
    }

    return "";
  };

  const saveDetails = () => {
    localStorage.setItem(
      "brx_institution_details",
      JSON.stringify({
        institutionType,
        institutionName:
          institutionName.trim(),
        phone:
          institutionPhone.trim(),
        email:
          institutionEmail.trim().toLowerCase(),
        country:
          country.trim(),
        state:
          state.trim(),
        city:
          city.trim(),
        address:
          address.trim(),
        website:
          website.trim(),
        establishedYear:
          establishedYear
            ? Number(establishedYear)
            : undefined,
        registrationNumber:
          registrationNumber.trim(),
        gstin:
          gstin.trim(),
      }),
    );

    localStorage.setItem(
      "brx_owner_details",
      JSON.stringify({
        firstName:
          firstName.trim(),
        lastName:
          lastName.trim(),
        phone:
          ownerPhone.trim(),
        email:
          ownerEmail.trim().toLowerCase(),
      }),
    );
  };

  const submitNormalRegistration =
    async () => {
      const validationError =
        validateNormal();

      if (validationError) {
        setError(validationError);
        return;
      }

      setLoading(true);
      setError("");

      try {
        saveDetails();

        const response = await fetch(
          `${API_URL}/registration/session`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              institutionType,
              institutionName:
                institutionName.trim(),
              phone:
                institutionPhone.trim(),
              email:
                institutionEmail
                  .trim()
                  .toLowerCase(),
              country:
                country.trim(),
              state:
                state.trim(),
              city:
                city.trim() || undefined,
              address:
                address.trim() || undefined,
              website:
                website.trim() || undefined,

              firstName:
                firstName.trim(),
              lastName:
                lastName.trim() || undefined,
              ownerPhone:
                ownerPhone.trim(),
              ownerEmail:
                ownerEmail
                  .trim()
                  .toLowerCase(),
              password,

              establishedYear:
                establishedYear
                  ? Number(establishedYear)
                  : undefined,
              registrationNumber:
                registrationNumber.trim() ||
                undefined,
              gstin:
                gstin.trim() || undefined,
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

        const sessionId =
          data?.session?.id;

        if (!sessionId) {
          throw new Error(
            "Registration session ID was not returned.",
          );
        }

        localStorage.setItem(
          "brx_registration_session_id",
          sessionId,
        );

        localStorage.removeItem(
          "brx_registration_verified",
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
    };

  const submitGoogleOnboarding =
    async () => {
      const validationError =
        validateCommon();

      if (validationError) {
        setError(validationError);
        return;
      }

      if (!googleCredential) {
        setError(
          "Google session expired. Please login with Google again.",
        );
        return;
      }

      setLoading(true);
      setError("");

      try {
        saveDetails();

        const response = await fetch(
          `${API_URL}/registration/google`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              credential:
                googleCredential,

              institutionType,

              institutionName:
                institutionName.trim(),

              institutionPhone:
                institutionPhone.trim(),

              institutionEmail:
                institutionEmail
                  .trim()
                  .toLowerCase(),

              country:
                country.trim(),

              state:
                state.trim(),

              city:
                city.trim() || undefined,

              address:
                address.trim() || undefined,

              website:
                website.trim() || undefined,

              firstName:
                firstName.trim(),

              lastName:
                lastName.trim() || undefined,

              ownerPhone:
                ownerPhone.trim(),
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

        if (data?.accessToken) {
          localStorage.setItem(
            "brx_access_token",
            data.accessToken,
          );

          document.cookie = `brx_access_token=${encodeURIComponent(
            data.accessToken,
          )}; path=/; max-age=604800; samesite=lax`;
        }

        localStorage.setItem(
          "brx_registration_result",
          JSON.stringify(data),
        );

        sessionStorage.removeItem(
          "brx_google_credential",
        );

        sessionStorage.removeItem(
          "brx_google_profile",
        );

        sessionStorage.removeItem(
          "brx_institution_type",
        );

        localStorage.removeItem(
          "brx_registration_type",
        );

        router.push("/register/success");
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to complete Google onboarding.",
        );
      } finally {
        setLoading(false);
      }
    };

  const handleSubmit = async (
    event: React.FormEvent,
  ) => {
    event.preventDefault();

    if (loading) {
      return;
    }

    if (isGoogleOnboarding) {
      await submitGoogleOnboarding();
      return;
    }

    await submitNormalRegistration();
  };

  const backToInstitution =
    () => {
      if (loading) {
        return;
      }

      router.push("/register");
    };

  const institutionLabel =
    institutionLabels[
      institutionType
    ] ?? "Institution";

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#07112f] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 -top-40 h-[450px] w-[450px] rounded-full bg-blue-500/25 blur-[120px]" />

        <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-indigo-500/25 blur-[120px]" />

        <div className="absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/10 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-12">
        {/* Header */}
        <div className="mb-8">
          <button
            type="button"
            onClick={backToInstitution}
            disabled={loading}
            className="mb-6 text-sm font-semibold text-slate-400 transition hover:text-white disabled:opacity-50"
          >
            ← Change institution type
          </button>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold tracking-[0.2em] text-blue-300">
                BRX EDUNEXA
              </p>

              <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
                Institution & HEAD Details
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
                Enter the details of your institution
                and the person who will manage it as
                HEAD.
              </p>
            </div>

            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-4 py-2 text-xs font-semibold text-blue-300">
              <span className="text-base">
                {institutionType === "SCHOOL"
                  ? "🏫"
                  : institutionType === "COLLEGE"
                    ? "🎓"
                    : institutionType ===
                        "UNIVERSITY"
                      ? "🏛️"
                      : institutionType ===
                          "COACHING"
                        ? "📚"
                        : institutionType ===
                            "INSTITUTE"
                          ? "🏢"
                          : "📋"}
              </span>

              {institutionLabel}
            </div>
          </div>
        </div>

        {isGoogleOnboarding && (
          <div className="mb-6 rounded-2xl border border-blue-400/20 bg-blue-500/[0.08] p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold text-slate-700">
                G
              </div>

              <div>
                <p className="text-sm font-semibold text-blue-200">
                  Google account setup
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-400">
                  Your verified Google account will
                  become the HEAD account. No separate
                  password is required.
                </p>
              </div>
            </div>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          {/* Institution Details */}
          <section className="rounded-[28px] border border-white/10 bg-white/[0.07] p-6 shadow-2xl backdrop-blur-2xl sm:p-8">
            <div className="mb-7">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-300">
                Step 2A
              </p>

              <h2 className="mt-2 text-xl font-bold">
                Institution Details
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Basic information about your
                institution.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-slate-300">
                  Institution Name *
                </label>

                <input
                  value={institutionName}
                  onChange={(event) =>
                    setInstitutionName(
                      event.target.value,
                    )
                  }
                  placeholder="e.g. BRX Public School"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3.5 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500/60 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-300">
                  Institution Phone *
                </label>

                <input
                  value={institutionPhone}
                  onChange={(event) =>
                    setInstitutionPhone(
                      event.target.value
                        .replace(/\D/g, "")
                        .slice(0, 15),
                    )
                  }
                  inputMode="tel"
                  placeholder="Institution phone"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3.5 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500/60 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-300">
                  Institution Email *
                </label>

                <input
                  type="email"
                  value={institutionEmail}
                  onChange={(event) =>
                    setInstitutionEmail(
                      event.target.value,
                    )
                  }
                  placeholder="institution@example.com"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3.5 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500/60 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-300">
                  Country
                </label>

                <input
                  value={country}
                  onChange={(event) =>
                    setCountry(
                      event.target.value,
                    )
                  }
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3.5 text-white outline-none transition focus:border-blue-500/60 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-300">
                  State *
                </label>

                <input
                  value={state}
                  onChange={(event) =>
                    setState(
                      event.target.value,
                    )
                  }
                  placeholder="e.g. Bihar"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3.5 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500/60 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-300">
                  City
                </label>

                <input
                  value={city}
                  onChange={(event) =>
                    setCity(
                      event.target.value,
                    )
                  }
                  placeholder="e.g. Patna"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3.5 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500/60 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-slate-300">
                  Address
                </label>

                <textarea
                  value={address}
                  onChange={(event) =>
                    setAddress(
                      event.target.value,
                    )
                  }
                  rows={3}
                  placeholder="Complete institution address"
                  className="mt-2 w-full resize-none rounded-2xl border border-white/10 bg-black/20 px-4 py-3.5 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500/60 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-slate-300">
                  Website
                </label>

                <input
                  type="url"
                  value={website}
                  onChange={(event) =>
                    setWebsite(
                      event.target.value,
                    )
                  }
                  placeholder="https://example.com"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3.5 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500/60 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>
            </div>
          </section>

          {/* Optional Institution Information */}
          {!isGoogleOnboarding && (
            <section className="rounded-[28px] border border-white/10 bg-white/[0.07] p-6 shadow-2xl backdrop-blur-2xl sm:p-8">
              <div className="mb-7">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-300">
                  Optional
                </p>

                <h2 className="mt-2 text-xl font-bold">
                  Registration Information
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  You can provide these details now
                  or later.
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-3">
                <div>
                  <label className="text-sm font-medium text-slate-300">
                    Established Year
                  </label>

                  <input
                    type="number"
                    min={2000}
                    max={2100}
                    value={establishedYear}
                    onChange={(event) =>
                      setEstablishedYear(
                        event.target.value,
                      )
                    }
                    placeholder="2020"
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3.5 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500/60 focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-300">
                    Registration Number
                  </label>

                  <input
                    value={registrationNumber}
                    onChange={(event) =>
                      setRegistrationNumber(
                        event.target.value,
                      )
                    }
                    placeholder="Registration no."
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3.5 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500/60 focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-300">
                    GSTIN
                  </label>

                  <input
                    value={gstin}
                    onChange={(event) =>
                      setGstin(
                        event.target.value
                          .toUpperCase(),
                      )
                    }
                    placeholder="GSTIN"
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3.5 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500/60 focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>
              </div>
            </section>
          )}

          {/* HEAD Details */}
          <section className="rounded-[28px] border border-white/10 bg-white/[0.07] p-6 shadow-2xl backdrop-blur-2xl sm:p-8">
            <div className="mb-7">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-300">
                Step 2B
              </p>

              <h2 className="mt-2 text-xl font-bold">
                HEAD / Owner Details
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                This person will manage the institution
                on BRX EduNexa.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-300">
                  First Name *
                </label>

                <input
                  value={firstName}
                  onChange={(event) =>
                    setFirstName(
                      event.target.value,
                    )
                  }
                  placeholder="First name"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3.5 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500/60 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-300">
                  Last Name
                </label>

                <input
                  value={lastName}
                  onChange={(event) =>
                    setLastName(
                      event.target.value,
                    )
                  }
                  placeholder="Last name"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3.5 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500/60 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-300">
                  HEAD Mobile *
                </label>

                <input
                  value={ownerPhone}
                  onChange={(event) =>
                    setOwnerPhone(
                      event.target.value
                        .replace(/\D/g, "")
                        .slice(0, 15),
                    )
                  }
                  inputMode="tel"
                  placeholder="HEAD mobile number"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3.5 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500/60 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-300">
                  HEAD Email *
                </label>

                <input
                  type="email"
                  value={ownerEmail}
                  onChange={(event) =>
                    setOwnerEmail(
                      event.target.value,
                    )
                  }
                  disabled={isGoogleOnboarding}
                  placeholder="head@example.com"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3.5 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500/60 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60 focus:border-blue-500/60 focus:ring-4 focus:ring-blue-500/10"
                />

                {isGoogleOnboarding && (
                  <p className="mt-2 text-xs text-slate-500">
                    Google verified email
                  </p>
                )}
              </div>

              {!isGoogleOnboarding && (
                <>
                  <div>
                    <label className="text-sm font-medium text-slate-300">
                      Password *
                    </label>

                    <input
                      type="password"
                      value={password}
                      onChange={(event) =>
                        setPassword(
                          event.target.value,
                        )
                      }
                      autoComplete="new-password"
                      placeholder="Minimum 8 characters"
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3.5 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500/60 focus:ring-4 focus:ring-blue-500/10"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-300">
                      Confirm Password *
                    </label>

                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(event) =>
                        setConfirmPassword(
                          event.target.value,
                        )
                      }
                      autoComplete="new-password"
                      placeholder="Repeat password"
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3.5 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500/60 focus:ring-4 focus:ring-blue-500/10"
                    />
                  </div>
                </>
              )}
            </div>
          </section>

          {/* Error */}
          {error && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-300">
              {error}
            </div>
          )}

          {/* Submit */}
          <div className="rounded-[28px] border border-white/10 bg-white/[0.05] p-5 backdrop-blur-xl sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold">
                  Ready to continue?
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {isGoogleOnboarding
                    ? "Your verified Google account will be created as the HEAD account."
                    : "Your registration will be saved as a temporary session before verification."}
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-7 py-4 text-sm font-bold shadow-xl shadow-blue-600/20 transition hover:-translate-y-0.5 hover:shadow-blue-600/30 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? isGoogleOnboarding
                    ? "Creating Account..."
                    : "Creating Session..."
                  : isGoogleOnboarding
                    ? "Create BRX Account →"
                    : "Continue to Verification →"}
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