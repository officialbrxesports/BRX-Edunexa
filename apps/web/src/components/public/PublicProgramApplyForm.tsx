"use client";

import { useEffect, useState } from "react";
import { Printer, Upload } from "lucide-react";

import { API_URL } from "../../lib/api";
import AdmissionClassFields from "../dashboard/AdmissionClassFields";
import { buildFormHtml, printHtml } from "../../lib/admissionPrint";
import {
  firstProfileProblem,
  initialDetails,
  type AdmissionProfile,
  type Details,
} from "../../lib/admissionProfiles";
import { PhotoSignaturePicker, EMPTY_PS, uploadPhotoSign, type PhotoSignValue } from "../forms/PhotoSignature";

type Target = { id: string; name: string; code: string; detail?: string | null };

type Status = {
  application: Record<string, unknown> & {
    applicationNumber: string;
    status: string;
    kind: string;
    targetName: string;
    reviewNote?: string | null;
    submittedAt?: string | null;
    details?: Details | null;
  };
  uploadedTypes: string[];
  missingRequired: string[];
};

const EMPTY = {
  firstName: "", middleName: "", lastName: "", dateOfBirth: "", gender: "",
  fatherName: "", motherName: "", studentEmail: "", phone: "", identityLast4: "",
  address: "", city: "", state: "", pinCode: "",
};

const input =
  "mt-1 h-11 w-full rounded border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-700 focus:ring-1 focus:ring-blue-100";

const STATUS_TEXT: Record<string, string> = {
  SUBMITTED: "Submitted. Waiting for review.",
  UNDER_REVIEW: "Under review.",
  CHANGES_REQUESTED: "Changes requested. Please read the note and upload again.",
  APPROVED: "Approved. The institution will confirm your seat and share your login.",
  REJECTED: "Not accepted.",
  ENROLLED: "Enrolled. Your login has been created. Ask the institution for it.",
};

async function call(url: string, init?: RequestInit) {
  const res = await fetch(url, { cache: "no-store", ...init });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(
      Array.isArray(data.message) ? data.message.join(", ") : data.message || "Request failed.",
    );
  }

  return data;
}

export default function PublicProgramApplyForm({ code }: { code: string }) {
  const base = `${API_URL}/public/apply-program/${encodeURIComponent(code)}`;

  const [name, setName] = useState("");
  const [profile, setProfile] = useState<AdmissionProfile | null>(null);
  const [kind, setKind] = useState("");
  const [targets, setTargets] = useState<Target[]>([]);
  const [targetId, setTargetId] = useState("");
  const [loadError, setLoadError] = useState("");

  const [values, setValues] = useState({ ...EMPTY });
  const [details, setDetails] = useState<Details>({});
  const [declarationName, setDeclarationName] = useState("");
  const [photoSign, setPhotoSign] = useState<PhotoSignValue>(EMPTY_PS);
  const [accepted, setAccepted] = useState(false);
  const [website, setWebsite] = useState(""); // honeypot
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [lookup, setLookup] = useState({ applicationNumber: "", phone: "" });
  const [status, setStatus] = useState<Status | null>(null);
  const [uploadType, setUploadType] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  const noun = kind === "COACHING" ? "batch" : "course";

  useEffect(() => {
    let active = true;

    call(base)
      .then((data) => {
        if (!active) return;
        setName(data.institution?.name || "");
        setProfile(data.profile || null);
        setKind(data.kind || "");
        setTargets(data.targets || []);
      })
      .catch((err) => active && setLoadError(err instanceof Error ? err.message : "Could not load the form."));

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  useEffect(() => {
    setDetails(profile ? initialDetails(profile) : {});
    setDeclarationName("");
  }, [profile]);

  const set = (key: keyof typeof EMPTY, value: string) =>
    setValues((current) => ({ ...current, [key]: value }));

  const text = (key: keyof typeof EMPTY, label: string, type = "text") => (
    <label key={key} className="block text-xs font-semibold text-slate-600">
      {label}
      <input type={type} value={values[key]} onChange={(e) => set(key, e.target.value)} className={input} />
    </label>
  );

  async function loadStatus(number: string, phone: string) {
    const data = (await call(`${base}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applicationNumber: number, phone }),
    })) as Status;

    setStatus(data);
    setUploadType("");
    setUploadFile(null);
  }

  async function submit() {
    setError("");
    setMessage("");

    if (!values.firstName.trim()) return setError("First name is required.");
    if (!values.phone.trim()) return setError("Mobile number is required.");
    if (!values.studentEmail.trim()) return setError("Email is required.");
    if (!targetId) return setError(`Please select the ${noun}.`);

    const problem = firstProfileProblem(profile, details);

    if (problem) return setError(problem);
    if (!declarationName.trim()) return setError("Type the full name of the person signing.");
    if (!accepted) return setError("Please accept the declaration.");

    setWorking(true);

    try {
      const body: Record<string, unknown> = { targetId, website };

      for (const [key, value] of Object.entries(values)) {
        if (value.trim()) body[key] = value.trim();
      }

      body.details = { ...details, declarationName: declarationName.trim() };
      body.declarationAccepted = true;

      const data = await call(base, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const phone = values.phone.trim();

      setLookup({ applicationNumber: data.applicationNumber, phone });
      setMessage(`Application submitted. Your application number is ${data.applicationNumber}. Save it.`);
      setValues({ ...EMPTY });
      const psProblem = await uploadPhotoSign({
        url: `${base}/documents`,
        fields: { applicationNumber: data.applicationNumber, phone },
        photoType: "PHOTO",
        value: photoSign,
      });

      setPhotoSign(EMPTY_PS);
      if (psProblem) setError(psProblem);
      await loadStatus(data.applicationNumber, phone);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit the form.");
    } finally {
      setWorking(false);
    }
  }

  async function check() {
    setError("");
    setMessage("");

    try {
      await loadStatus(lookup.applicationNumber, lookup.phone);
    } catch (err) {
      setStatus(null);
      setError(err instanceof Error ? err.message : "Could not find the application.");
    }
  }

  async function upload() {
    if (!status || !uploadFile || !uploadType) return setError("Choose a document type and a file.");

    setError("");
    setWorking(true);

    try {
      const form = new FormData();

      form.append("applicationNumber", status.application.applicationNumber);
      form.append("phone", lookup.phone);
      form.append("type", uploadType);
      form.append("file", uploadFile);

      await call(`${base}/documents`, { method: "POST", body: form });

      setMessage("Document uploaded.");
      await loadStatus(status.application.applicationNumber, lookup.phone);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setWorking(false);
    }
  }

  const statusProfile = status ? profile : null;

  function printMine() {
    if (!status || !statusProfile) return;

    const app = status.application;

    printHtml(
      buildFormHtml(
        statusProfile,
        name,
        {
          applicationNumber: app.applicationNumber,
          className: String(app.targetName || ""),
          submittedAt: app.submittedAt || undefined,
          status: app.status,
          base: { ...app, parentPhone: app.phone },
          details: app.details || {},
          uploadedTypes: status.uploadedTypes,
        },
        { variant: "program" },
      ),
    );
  }

  if (loadError) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-xl font-bold text-slate-900">Link not available</h1>
        <p className="mt-2 text-sm text-slate-600">{loadError}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-800">BRX EduNexa</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">{name || "Loading..."}</h1>
        <p className="mt-1 text-sm text-slate-600">
          Fill this form to apply for admission. Your login is created only after the
          institution approves your form.
        </p>
      </header>

      {error && <div role="alert" className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {message && <div role="status" className="mb-4 rounded border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{message}</div>}

      <section className="mb-6 rounded border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-bold text-slate-900">Already applied? Check status</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <input
            value={lookup.applicationNumber}
            onChange={(e) => setLookup((c) => ({ ...c, applicationNumber: e.target.value }))}
            placeholder="Application number"
            className="h-10 rounded border border-slate-300 px-3 text-sm"
          />
          <input
            value={lookup.phone}
            onChange={(e) => setLookup((c) => ({ ...c, phone: e.target.value }))}
            placeholder="Mobile used in the form"
            className="h-10 rounded border border-slate-300 px-3 text-sm"
          />
          <button type="button" onClick={() => void check()} className="h-10 rounded bg-blue-800 px-4 text-sm font-semibold text-white">
            Check
          </button>
        </div>
      </section>

      {status ? (
        <section className="space-y-4 rounded border border-slate-200 bg-white p-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{status.application.applicationNumber}</h2>
            <p className="mt-1 text-sm text-slate-700">{STATUS_TEXT[status.application.status] || status.application.status}</p>
            {status.application.reviewNote && (
              <p className="mt-2 rounded bg-amber-50 p-2 text-xs text-amber-900">Note: {status.application.reviewNote}</p>
            )}
          </div>

          <button type="button" onClick={printMine} className="flex h-9 items-center gap-2 rounded bg-blue-800 px-3 text-xs font-semibold text-white">
            <Printer size={14} />
            Print my form
          </button>

          <div className="rounded border border-slate-200 p-3">
            <p className="text-xs font-bold text-slate-700">Documents</p>
            <ul className="mt-2 space-y-1">
              {(statusProfile?.documents || []).map((doc) => {
                const has = status.uploadedTypes.includes(doc.type);

                return (
                  <li key={doc.type} className="flex items-center justify-between gap-2 text-xs">
                    <span className="min-w-0">{doc.label}</span>
                    <span className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-semibold ${
                      has ? "bg-emerald-50 text-emerald-700" : doc.required ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-600"
                    }`}>
                      {has ? "Uploaded" : doc.required ? "Missing" : "Optional"}
                    </span>
                  </li>
                );
              })}
            </ul>

            {["SUBMITTED", "UNDER_REVIEW", "CHANGES_REQUESTED"].includes(status.application.status) && (
              <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
                <select value={uploadType} onChange={(e) => setUploadType(e.target.value)} className="h-10 w-full rounded border border-slate-300 px-2 text-sm">
                  <option value="">Document type</option>
                  {(statusProfile?.documents || []).map((d) => (
                    <option key={d.type} value={d.type}>{d.label}</option>
                  ))}
                  <option value="OTHER">Other document</option>
                </select>
                <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={(e) => setUploadFile(e.target.files?.[0] || null)} className="block w-full text-xs" />
                <button
                  type="button"
                  disabled={working || !uploadFile || !uploadType}
                  onClick={() => void upload()}
                  className="flex h-9 items-center gap-2 rounded bg-blue-800 px-3 text-xs font-semibold text-white disabled:opacity-50"
                >
                  <Upload size={14} />
                  Upload
                </button>
                <p className="text-[10px] text-slate-500">JPG, PNG or PDF, maximum 2 MB each.</p>
              </div>
            )}
          </div>

          <button type="button" onClick={() => { setStatus(null); setMessage(""); }} className="text-xs font-semibold text-blue-800 underline">
            Fill a new form
          </button>
        </section>
      ) : (
        <form
          onSubmit={(e) => { e.preventDefault(); void submit(); }}
          className="space-y-4 rounded border border-slate-200 bg-white p-4"
        >
          <label className="block text-xs font-semibold text-slate-600">
            {kind === "COACHING" ? "Batch" : "Course"} <span className="text-red-600">*</span>
            <select value={targetId} onChange={(e) => setTargetId(e.target.value)} className={input}>
              <option value="">Select {noun}</option>
              {targets.map((t) => (
                <option key={t.id} value={t.id}>{t.name}{t.detail ? ` · ${t.detail}` : ""}</option>
              ))}
            </select>
          </label>

          <p className="text-xs text-slate-500">{profile?.description}</p>

          <div className="rounded border border-slate-200 p-3">
            <h3 className="mb-3 text-sm font-bold text-slate-800">Applicant</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {text("firstName", "First name *")}
              {text("middleName", "Middle name")}
              {text("lastName", "Last name")}
              {text("dateOfBirth", "Date of birth", "date")}
              <label className="block text-xs font-semibold text-slate-600">
                Gender
                <select value={values.gender} onChange={(e) => set("gender", e.target.value)} className={input}>
                  <option value="">Select</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </label>
              {text("fatherName", "Father's name")}
              {text("motherName", "Mother's name")}
              {text("identityLast4", "Aadhaar last 4 digits only")}
              {text("phone", "Mobile number *")}
              {text("studentEmail", "Email *", "email")}
            </div>
          </div>

          <div className="rounded border border-slate-200 p-3">
            <h3 className="mb-3 text-sm font-bold text-slate-800">Address</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {text("address", "Address")}
              {text("city", "City / district")}
              {text("state", "State")}
              {text("pinCode", "PIN code")}
            </div>
          </div>

          {profile && <AdmissionClassFields profile={profile} details={details} onChange={setDetails} />}

          {profile && (
            <div className="rounded border border-blue-100 bg-blue-50 p-3 text-xs text-blue-900">
              <p className="font-semibold">Keep these ready. You upload them after submitting:</p>
              <ul className="mt-1 list-disc pl-5">
                {profile.documents.map((d) => (
                  <li key={d.type}>{d.label}{d.required ? " (required)" : " (optional)"}</li>
                ))}
              </ul>
            </div>
          )}

          <PhotoSignaturePicker value={photoSign} onChange={setPhotoSign} />

          <label className="block text-xs font-semibold text-slate-600">
            Type full name as signature (student or parent)
            <input value={declarationName} onChange={(e) => setDeclarationName(e.target.value)} maxLength={100} className={input} />
          </label>

          {/* hidden honeypot field for bots */}
          <input
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            aria-hidden="true"
            className="absolute left-[-9999px] h-0 w-0 opacity-0"
          />

          <label className="flex items-start gap-2 rounded border border-slate-200 p-3 text-xs text-slate-700">
            <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="mt-0.5" />
            The student (or parent) confirms the information is true and complete.
          </label>

          <button type="submit" disabled={working} className="h-11 rounded bg-blue-800 px-6 text-sm font-semibold text-white disabled:opacity-50">
            {working ? "Submitting..." : "Submit application"}
          </button>
        </form>
      )}
    </main>
  );
}
