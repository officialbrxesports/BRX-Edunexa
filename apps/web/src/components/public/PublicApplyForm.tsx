"use client";

import { useEffect, useMemo, useState } from "react";
import { Printer, Upload, CheckCircle2 } from "lucide-react";

import { API_URL } from "../../lib/api";
import AdmissionClassFields from "../dashboard/AdmissionClassFields";
import { buildFormHtml, printHtml } from "../../lib/admissionPrint";
import {
  documentLabel,
  initialDetails,
  isFieldVisible,
  marksSkipped,
  type AdmissionProfile,
  type Details,
  type MarkRow,
} from "../../lib/admissionProfiles";

type ClassItem = { id: string; name: string; formProfile: string };

type Program = { id: string; name: string; code: string };

type Info = {
  institution: { name: string; city?: string | null; state?: string | null };
  classes: ClassItem[];
  programs?: Program[];
  profiles: AdmissionProfile[];
};

type Application = Record<string, unknown> & {
  applicationNumber: string;
  status: string;
  className: string;
  formProfile?: string | null;
  details?: Details | null;
  reviewNote?: string | null;
  submittedAt?: string | null;
};

type StatusData = {
  application: Application;
  uploadedTypes: string[];
  missingRequired: string[];
};

type Values = Record<string, string>;

const EMPTY: Values = {
  firstName: "", middleName: "", lastName: "", studentEmail: "", dateOfBirth: "",
  gender: "", bloodGroup: "", category: "", religion: "", motherTongue: "",
  identityLast4: "", classId: "",
  fatherName: "", fatherOccupation: "", motherName: "", motherOccupation: "",
  guardianName: "", guardianPhone: "", parentPhone: "", whatsappPhone: "",
  parentEmail: "", address: "", city: "", state: "", pinCode: "", country: "India",
  previousSchool: "", previousClass: "", previousBoard: "", previousMarks: "",
  previousTCNumber: "",
  programId: "", profileId: "",
};

type F = [string, string, { required?: boolean; type?: string; max?: number }?];

const STUDENT: F[] = [
  ["firstName", "First name", { required: true, max: 100 }],
  ["middleName", "Middle name", { max: 100 }],
  ["lastName", "Last name", { max: 100 }],
  ["studentEmail", "Student email", { required: true, type: "email" }],
  ["dateOfBirth", "Date of birth", { type: "date" }],
  ["category", "Category (General / OBC / SC / ST / EWS)"],
  ["religion", "Religion"],
  ["motherTongue", "Mother tongue"],
  ["identityLast4", "Aadhaar last 4 digits only", { max: 4 }],
];

const PARENT: F[] = [
  ["fatherName", "Father's name"],
  ["fatherOccupation", "Father's occupation"],
  ["motherName", "Mother's name"],
  ["motherOccupation", "Mother's occupation"],
  ["guardianName", "Guardian's name"],
  ["guardianPhone", "Guardian's phone"],
  ["parentPhone", "Parent mobile", { required: true }],
  ["whatsappPhone", "WhatsApp number"],
  ["parentEmail", "Parent email", { type: "email" }],
  ["address", "Present address"],
  ["city", "City / district"],
  ["state", "State"],
  ["pinCode", "PIN code", { max: 10 }],
  ["country", "Country"],
];

const COLLEGE_PARENT: F[] = [
  ["fatherName", "Father's name"],
  ["motherName", "Mother's name"],
  ["parentPhone", "Mobile number", { required: true }],
  ["address", "Present address"],
  ["city", "City / district"],
  ["state", "State"],
  ["pinCode", "PIN code", { max: 10 }],
];

const PREVIOUS: F[] = [
  ["previousSchool", "Previous school name"],
  ["previousClass", "Last class attended"],
  ["previousBoard", "Board"],
  ["previousMarks", "Marks / percentage"],
  ["previousTCNumber", "Transfer certificate number"],
];

const input =
  "mt-1 h-11 w-full rounded border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-700 focus:ring-1 focus:ring-blue-100";

export default function PublicApplyForm({ code }: { code: string }) {
  const [info, setInfo] = useState<Info | null>(null);
  const [kind, setKind] = useState<"school" | "college">("school");
  const [loadError, setLoadError] = useState("");

  const [mode, setMode] = useState<"form" | "done" | "track">("form");
  const [step, setStep] = useState(1);
  const [values, setValues] = useState<Values>({ ...EMPTY });
  const [details, setDetails] = useState<Details>({});
  const [declarationName, setDeclarationName] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [honeypot, setHoneypot] = useState("");

  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [status, setStatus] = useState<StatusData | null>(null);
  const [trackNumber, setTrackNumber] = useState("");
  const [trackPhone, setTrackPhone] = useState("");
  const [uploadType, setUploadType] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  const college = kind === "college";

  const base = `${API_URL}/public/apply${college ? "-college" : ""}/${encodeURIComponent(code)}`;

  useEffect(() => {
    let active = true;

    async function load() {
      // Schools first; colleges and universities use their own endpoint.
      const first = `${API_URL}/public/apply/${encodeURIComponent(code)}`;
      const second = `${API_URL}/public/apply-college/${encodeURIComponent(code)}`;

      try {
        let res = await fetch(first, { cache: "no-store" });
        let asCollege = false;

        if (res.status === 404) {
          res = await fetch(second, { cache: "no-store" });
          asCollege = true;
        }

        const data = await res.json().catch(() => ({}));

        if (!res.ok) throw new Error(data.message || "Admissions are not open for this link.");

        if (!active) return;

        setKind(asCollege ? "college" : "school");
        setInfo({ classes: [], ...(data as Info) });

        if (asCollege && data.profiles?.[0]) {
          setValues((current) => ({ ...current, profileId: data.profiles[0].id }));
        }
      } catch (err) {
        if (active) setLoadError(err instanceof Error ? err.message : "Could not load the form.");
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [code]);

  const selectedClass = info?.classes.find((c) => c.id === values.classId);
  const selectedProgram = info?.programs?.find((p) => p.id === values.programId);

  const profile = useMemo(
    () =>
      info?.profiles.find((p) =>
        college ? p.id === values.profileId : p.id === selectedClass?.formProfile,
      ) || null,
    [info, college, values.profileId, selectedClass?.formProfile],
  );

  const profileId = profile?.id;

  useEffect(() => {
    setDetails(profile ? initialDetails(profile) : {});
    setDeclarationName("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId]);

  function set(key: string, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function renderField([key, label, opts]: F) {
    return (
      <label key={key} className="block text-xs font-semibold text-slate-600">
        {label}
        {opts?.required && <span className="text-red-600"> *</span>}
        <input
          type={opts?.type || "text"}
          maxLength={opts?.max}
          value={values[key]}
          onChange={(event) => set(key, event.target.value)}
          className={input}
        />
      </label>
    );
  }

  function missingClassField(): string {
    if (!profile) return "";

    for (const section of profile.sections) {
      for (const field of section.fields) {
        if (!field.required || !isFieldVisible(field, details)) continue;

        const value = details[field.key];
        const empty = Array.isArray(value)
          ? value.length === 0
          : value === undefined || String(value).trim() === "";

        if (empty) return `${field.label} is required.`;

        if (field.type === "multi" && field.pick && Array.isArray(value) && value.length !== field.pick) {
          return `${field.label}: choose exactly ${field.pick}.`;
        }
      }

      if (section.marks && !marksSkipped(section.marks, details)) {
        const rows = Array.isArray(details.marks) ? (details.marks as MarkRow[]) : [];

        if (rows.filter((r) => String(r.obtained).trim() !== "").length < 5) {
          return `${section.marks.title}: enter marks for at least 5 subjects.`;
        }
      }
    }

    return "";
  }

  function next() {
    setError("");

    if (step === 1) {
      if (!values.firstName.trim()) return setError("Student first name is required.");
      if (!values.studentEmail.trim()) return setError("Student email is required.");
      if (college) {
        if (!values.programId) return setError("Please select the program.");
      } else if (!values.classId) {
        return setError("Please select the class.");
      }
      if (values.identityLast4 && !/^\d{4}$/.test(values.identityLast4)) {
        return setError("Aadhaar last 4 digits must be exactly 4 numbers.");
      }
    }

    if (step === 2 && !values.parentPhone.trim()) {
      return setError("Parent mobile number is required.");
    }

    if (step === 3 && profile) {
      const early = /nursery|lkg|ukg|kg|play|pre/i.test(selectedClass?.name || "");

      if (profile.requiresPreviousSchool && !early && !values.previousSchool.trim()) {
        return setError("Previous school name is required for this class.");
      }

      const problem = missingClassField();

      if (problem) return setError(problem);
    }

    setStep(step + 1);
  }

  async function submit() {
    setError("");

    if (profile?.requiresDeclarationName && !declarationName.trim()) {
      return setError("Type the full name of the person signing the declaration.");
    }

    if (!accepted) return setError("Please accept the declaration.");

    setWorking(true);

    try {
      const body: Record<string, unknown> = { website: honeypot };

      for (const [key, value] of Object.entries(values)) {
        if (value.trim()) body[key] = value.trim();
      }

      if (college) {
        body.formProfile = values.profileId;
        body.phone = values.parentPhone.trim();
        body.nationality =
          typeof details.nationality === "string" ? details.nationality : undefined;
      }

      body.details = {
        ...details,
        marks: Array.isArray(details.marks)
          ? (details.marks as MarkRow[]).filter((r) => String(r.obtained).trim() !== "")
          : undefined,
        declarationName: declarationName.trim() || undefined,
      };
      body.declarationAccepted = true;

      const res = await fetch(base, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          Array.isArray(data.message) ? data.message.join(", ") : data.message || "Could not submit.",
        );
      }

      await loadStatus(data.applicationNumber, values.parentPhone.trim());
      setNotice("Application submitted. Save your application number.");
      setMode("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit.");
    } finally {
      setWorking(false);
    }
  }

  async function loadStatus(number: string, phone: string) {
    const res = await fetch(`${base}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applicationNumber: number, parentPhone: phone }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) throw new Error(data.message || "Application not found.");

    setStatus(data as StatusData);
    setTrackNumber(number);
    setTrackPhone(phone);
  }

  async function track() {
    setError("");
    setNotice("");
    setWorking(true);

    try {
      await loadStatus(trackNumber.trim(), trackPhone.trim());
      setMode("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Application not found.");
    } finally {
      setWorking(false);
    }
  }

  async function upload() {
    if (!uploadFile || !uploadType) return setError("Choose a document type and a file.");

    setWorking(true);
    setError("");
    setNotice("");

    try {
      const form = new FormData();

      form.append("applicationNumber", trackNumber);
      form.append("parentPhone", trackPhone);
      form.append("type", uploadType);
      form.append("file", uploadFile);

      const res = await fetch(`${base}/documents`, { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          Array.isArray(data.message) ? data.message.join(", ") : data.message || "Upload failed.",
        );
      }

      setNotice(`${documentLabel(uploadType)} uploaded.`);
      setUploadFile(null);
      await loadStatus(trackNumber, trackPhone);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setWorking(false);
    }
  }

  function printMyForm() {
    if (!status || !info) return;

    const app = status.application;
    const p =
      info.profiles.find((item) => item.id === app.formProfile) ||
      info.profiles.find((item) => item.id === "GENERAL");

    if (!p) return;

    printHtml(
      buildFormHtml(p, info.institution.name, {
        applicationNumber: app.applicationNumber,
        className: app.className,
        submittedAt: app.submittedAt || undefined,
        status: app.status,
        base: app,
        details: app.details || {},
        uploadedTypes: status.uploadedTypes,
      }, college ? { variant: "college" } : undefined),
    );
  }

  /* ---------------- render ---------------- */

  if (loadError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded border border-slate-200 bg-white p-6 text-center shadow-sm">
          <h1 className="text-lg font-bold text-slate-900">Admission link not available</h1>
          <p className="mt-2 text-sm text-slate-600">{loadError}</p>
          <p className="mt-2 text-xs text-slate-500">Check the link with the school.</p>
        </div>
      </main>
    );
  }

  if (!info) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">Loading admission form...</p>
      </main>
    );
  }

  const alerts = (
    <>
      {error && (
        <div role="alert" className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {notice && (
        <div role="status" className="rounded border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          {notice}
        </div>
      )}
    </>
  );

  const steps = college
    ? ["Applicant", "Family & address", "Academic details", "Review"]
    : ["Student", "Parents", "Class details", "Review"];

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6">
      <div className="mx-auto w-full max-w-3xl space-y-4">
        <header className="rounded border border-slate-200 bg-white p-4 shadow-sm">
          <h1 className="text-xl font-bold text-slate-900">{info.institution.name}</h1>
          <p className="mt-1 text-sm text-slate-500">
            Admission application
            {info.institution.city ? ` · ${info.institution.city}` : ""}
          </p>

          <div className="mt-3 flex gap-2 text-xs font-semibold">
            <button
              type="button"
              onClick={() => { setMode("form"); setError(""); setNotice(""); }}
              className={`rounded px-3 py-2 ${mode === "form" ? "bg-blue-800 text-white" : "border border-slate-300"}`}
            >
              New application
            </button>
            <button
              type="button"
              onClick={() => { setMode(status ? "done" : "track"); setError(""); setNotice(""); }}
              className={`rounded px-3 py-2 ${mode !== "form" ? "bg-blue-800 text-white" : "border border-slate-300"}`}
            >
              Check status / upload documents
            </button>
          </div>
        </header>

        {alerts}

        {mode === "track" && (
          <section className="space-y-3 rounded border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="font-bold text-slate-800">Find your application</h2>
            <label className="block text-xs font-semibold text-slate-600">
              Application number
              <input value={trackNumber} onChange={(e) => setTrackNumber(e.target.value)} className={input} placeholder="ADM-2026-XXXXXXXXXX" />
            </label>
            <label className="block text-xs font-semibold text-slate-600">
              {college ? "Mobile number used in the form" : "Parent mobile used in the form"}
              <input value={trackPhone} onChange={(e) => setTrackPhone(e.target.value)} className={input} />
            </label>
            <button
              type="button"
              disabled={working}
              onClick={() => void track()}
              className="h-11 rounded bg-blue-800 px-5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {working ? "Checking..." : "Open application"}
            </button>
          </section>
        )}

        {mode === "done" && status && (() => {
          const app = status.application;
          const p = info.profiles.find((item) => item.id === app.formProfile);
          const closed = ["APPROVED", "ENROLLED", "REJECTED"].includes(app.status);

          return (
            <section className="space-y-4 rounded border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-1 shrink-0 text-emerald-600" size={22} />
                <div className="min-w-0">
                  <p className="text-xs text-slate-500">Application number</p>
                  <p className="break-all text-xl font-bold text-slate-900">{app.applicationNumber}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {app.className} · Status: <b>{app.status.replaceAll("_", " ")}</b>
                  </p>
                </div>
              </div>

              {app.reviewNote && (
                <p className="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  School note: {app.reviewNote}
                </p>
              )}

              <p className="text-xs text-slate-500">
                Keep this number and your parent mobile. You need both to check status or upload documents later.
              </p>

              <button
                type="button"
                onClick={printMyForm}
                className="flex h-10 items-center gap-2 rounded bg-blue-800 px-4 text-sm font-semibold text-white"
              >
                <Printer size={15} />
                Print filled form
              </button>

              <div className="rounded border border-slate-200 p-3">
                <p className="text-sm font-bold text-slate-800">Documents</p>
                <ul className="mt-2 space-y-1">
                  {(p?.documents || []).map((doc) => {
                    const done = status.uploadedTypes.includes(doc.type);

                    return (
                      <li key={doc.type} className="flex items-center justify-between gap-2 text-sm">
                        <span className="min-w-0">{doc.label}</span>
                        <span
                          className={`shrink-0 rounded px-2 py-0.5 text-xs font-semibold ${
                            done
                              ? "bg-emerald-50 text-emerald-700"
                              : doc.required
                                ? "bg-red-50 text-red-700"
                                : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {done ? "Uploaded" : doc.required ? "Required" : "Optional"}
                        </span>
                      </li>
                    );
                  })}
                </ul>

                {!closed && (
                  <div className="mt-4 space-y-2 border-t border-slate-100 pt-3">
                    <label className="block text-xs font-semibold text-slate-600">
                      Document type
                      <select value={uploadType} onChange={(e) => setUploadType(e.target.value)} className={input}>
                        <option value="">Select</option>
                        {(p?.documents || []).map((doc) => (
                          <option key={doc.type} value={doc.type}>{doc.label}</option>
                        ))}
                        <option value="OTHER">Other document</option>
                      </select>
                    </label>
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                      className="block w-full text-sm"
                    />
                    <button
                      type="button"
                      disabled={working || !uploadFile || !uploadType}
                      onClick={() => void upload()}
                      className="flex h-10 items-center gap-2 rounded bg-blue-800 px-4 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      <Upload size={15} />
                      {working ? "Uploading..." : "Upload"}
                    </button>
                    <p className="text-xs text-slate-500">JPG, PNG or PDF, maximum 2 MB each.</p>
                  </div>
                )}
              </div>
            </section>
          );
        })()}

        {mode === "form" && (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (step === 4) void submit();
              else next();
            }}
            className="space-y-5 rounded border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="grid grid-cols-4 gap-2">
              {steps.map((label, index) => (
                <div
                  key={label}
                  className={`rounded border p-2 text-center text-[10px] font-semibold sm:text-xs ${
                    step === index + 1
                      ? "border-blue-800 bg-blue-800 text-white"
                      : step > index + 1
                        ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-slate-50 text-slate-500"
                  }`}
                >
                  <span className="block text-sm">{index + 1}</span>
                  {label}
                </div>
              ))}
            </div>

            {/* hidden trap for bots */}
            <div aria-hidden="true" style={{ position: "absolute", left: "-9999px" }}>
              <label>
                Website
                <input tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
              </label>
            </div>

            {step === 1 && (
              <div className="grid gap-3 sm:grid-cols-2">
                {STUDENT.map(renderField)}

                <label className="block text-xs font-semibold text-slate-600">
                  Gender
                  <select value={values.gender} onChange={(e) => set("gender", e.target.value)} className={input}>
                    <option value="">Select</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </label>

                {!college && (
                  <label className="block text-xs font-semibold text-slate-600">
                    Blood group
                    <select value={values.bloodGroup} onChange={(e) => set("bloodGroup", e.target.value)} className={input}>
                      <option value="">Select</option>
                      {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </label>
                )}

                {college ? (
                  <>
                    <label className="block text-xs font-semibold text-slate-600">
                      Form type <span className="text-red-600">*</span>
                      <select value={values.profileId} onChange={(e) => set("profileId", e.target.value)} className={input}>
                        {info.profiles.map((p) => (
                          <option key={p.id} value={p.id}>{p.title}</option>
                        ))}
                      </select>
                    </label>

                    <label className="block text-xs font-semibold text-slate-600">
                      Program <span className="text-red-600">*</span>
                      <select value={values.programId} onChange={(e) => set("programId", e.target.value)} className={input}>
                        <option value="">Select program</option>
                        {(info.programs || []).map((p) => (
                          <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                        ))}
                      </select>
                    </label>
                  </>
                ) : (
                  <label className="block text-xs font-semibold text-slate-600 sm:col-span-2">
                    Class applying for <span className="text-red-600">*</span>
                    <select value={values.classId} onChange={(e) => set("classId", e.target.value)} className={input}>
                      <option value="">Select class</option>
                      {info.classes.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </label>
                )}

                <p className="text-xs text-slate-500 sm:col-span-2">
                  Enter only the last 4 digits of Aadhaar. Never type the full number.
                </p>
              </div>
            )}

            {step === 2 && (
              <div className="grid gap-3 sm:grid-cols-2">
                {(college ? COLLEGE_PARENT : PARENT).map(renderField)}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <p className="text-xs text-slate-500">{profile?.description}</p>

                {(!profile || profile.requiresPreviousSchool) && (
                  <div className="rounded border border-slate-200 p-3">
                    <h3 className="mb-3 text-sm font-bold text-slate-800">Previous school</h3>
                    <div className="grid gap-3 sm:grid-cols-2">{PREVIOUS.map(renderField)}</div>
                  </div>
                )}

                {profile && <AdmissionClassFields profile={profile} details={details} onChange={setDetails} />}
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <div className="rounded border border-slate-200 p-3 text-sm">
                  <p><b>Student:</b> {[values.firstName, values.middleName, values.lastName].filter(Boolean).join(" ")}</p>
                  <p><b>{college ? "Program" : "Class"}:</b> {college ? selectedProgram?.name : selectedClass?.name}</p>
                  <p><b>{college ? "Mobile" : "Parent mobile"}:</b> {values.parentPhone}</p>
                  <p><b>Student email:</b> {values.studentEmail}</p>
                </div>

                {profile && (
                  <div className="rounded border border-blue-100 bg-blue-50 p-3 text-sm text-blue-900">
                    <p className="font-semibold">After submitting, upload these documents:</p>
                    <ul className="mt-1 list-disc pl-5">
                      {profile.documents.map((doc) => (
                        <li key={doc.type}>{doc.label}{doc.required ? " (required)" : " (optional)"}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {profile?.requiresDeclarationName && (
                  <label className="block text-xs font-semibold text-slate-600">
                    Type full name as signature
                    <input value={declarationName} onChange={(e) => setDeclarationName(e.target.value)} maxLength={100} className={input} />
                  </label>
                )}

                <label className="flex items-start gap-2 rounded border border-slate-200 p-3 text-sm text-slate-700">
                  <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="mt-1" />
                  I confirm that the information given is true and complete.
                </label>
              </div>
            )}

            <div className="flex justify-between gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                disabled={step === 1}
                onClick={() => { setError(""); setStep(step - 1); }}
                className="h-11 rounded border border-slate-300 px-5 text-sm font-semibold disabled:opacity-40"
              >
                Back
              </button>

              <button
                type="submit"
                disabled={working}
                className="h-11 rounded bg-blue-800 px-6 text-sm font-semibold text-white disabled:opacity-50"
              >
                {step === 4 ? (working ? "Submitting..." : "Submit application") : "Continue"}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
