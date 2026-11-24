"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Printer, RefreshCw, Plus, Upload, Download, Copy } from "lucide-react";

import { API_URL } from "../../lib/api";
import AdmissionClassFields from "./AdmissionClassFields";
import { buildFormHtml, loadPrintImages, printHtml } from "../../lib/admissionPrint";
import {
  documentLabel,
  firstProfileProblem,
  initialDetails,
  isFieldVisible,
  collegeFormName,
  isCollegeClassProfile,
  programsForProfile,
  type AdmissionProfile,
  type Details,
  type MarkRow,
} from "../../lib/admissionProfiles";
import { PhotoSignaturePicker, EMPTY_PS, uploadPhotoSign, type PhotoSignValue } from "../forms/PhotoSignature";

type Program = { id: string; name: string; code: string };

type Row = {
  id: string;
  applicationNumber: string;
  status: string;
  formProfile: string;
  name: string;
  phone: string;
  submittedAt?: string | null;
  programId: string;
  programName: string;
  documentCount: number;
};

type Doc = {
  id: string;
  type: string;
  originalName: string;
  sizeBytes: number;
  verified: boolean;
};

type Detail = {
  application: Record<string, unknown> & {
    id: string;
    applicationNumber: string;
    status: string;
    formProfile: string;
    firstName: string;
    lastName?: string | null;
    phone: string;
    reviewNote?: string | null;
    rejectionReason?: string | null;
    details?: Details | null;
    submittedAt?: string | null;
    program: { id: string; name: string; semesters: number };
    documents: Doc[];
  };
  missingRequired: string[];
};

type Meta = { profiles: AdmissionProfile[]; programs: Program[] };

const STATUSES = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "CHANGES_REQUESTED",
  "APPROVED",
  "REJECTED",
  "ENROLLED",
];

const EMPTY = {
  firstName: "", middleName: "", lastName: "", dateOfBirth: "", gender: "",
  category: "", fatherName: "", motherName: "", studentEmail: "", phone: "",
  identityLast4: "", address: "", city: "", state: "", pinCode: "",
};

const field =
  "mt-1 h-10 w-full rounded border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-600";

const badge: Record<string, string> = {
  SUBMITTED: "bg-blue-50 text-blue-700",
  UNDER_REVIEW: "bg-amber-50 text-amber-700",
  CHANGES_REQUESTED: "bg-orange-50 text-orange-700",
  APPROVED: "bg-emerald-50 text-emerald-700",
  REJECTED: "bg-red-50 text-red-700",
  ENROLLED: "bg-violet-50 text-violet-700",
};

async function call(path: string, init?: RequestInit) {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    cache: "no-store",
    ...init,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(
      Array.isArray(data.message) ? data.message.join(", ") : data.message || "Request failed.",
    );
  }

  return data;
}

const json = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

export default function CollegeAdmissionManagement() {
  const [meta, setMeta] = useState<Meta>({ profiles: [], programs: [] });
  const [rows, setRows] = useState<Row[]>([]);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [mode, setMode] = useState<"list" | "new">("list");
  const [detail, setDetail] = useState<Detail | null>(null);

  const [institutionName, setInstitutionName] = useState("");
  const [institutionCode, setInstitutionCode] = useState("");

  // new application
  const [profileId, setProfileId] = useState("");
  const [programId, setProgramId] = useState("");
  const [values, setValues] = useState({ ...EMPTY });
  const [details, setDetails] = useState<Details>({});
  const [declarationName, setDeclarationName] = useState("");
  const [photoSign, setPhotoSign] = useState<PhotoSignValue>(EMPTY_PS);
  const [accepted, setAccepted] = useState(false);
  const [working, setWorking] = useState(false);

  // detail actions
  const [note, setNote] = useState("");
  const [rollNo, setRollNo] = useState("");
  const [semester, setSemester] = useState("1");
  const [uploadType, setUploadType] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [credentials, setCredentials] = useState<{
    eduNexaId: string;
    email: string;
    temporaryPassword: string;
  } | null>(null);

  const profile = useMemo(
    () => meta.profiles.find((p) => p.id === profileId) || null,
    [meta.profiles, profileId],
  );

  useEffect(() => {
    setDetails(profile ? initialDetails(profile) : {});
    setDeclarationName("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId]);

  const loadList = useCallback(async () => {
    setLoading(true);

    try {
      const query = new URLSearchParams();

      if (status) query.set("status", status);
      if (search.trim()) query.set("search", search.trim());

      setRows(await call(`/college/admissions?${query.toString()}`));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load applications.");
    } finally {
      setLoading(false);
    }
  }, [status, search]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  useEffect(() => {
    call("/college/admissions/meta")
      .then((data) => {
        setMeta(data);
        if (data.profiles[0]) setProfileId(data.profiles[0].id);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load forms."));

    call("/dashboard/me")
      .then((me) => {
        setInstitutionName(me?.institution?.name || "");
        setInstitutionCode(me?.institution?.code || "");
      })
      .catch(() => undefined);
  }, []);

  async function open(id: string) {
    setError("");
    setMessage("");
    setCredentials(null);

    try {
      const data = (await call(`/college/admissions/${id}`)) as Detail;

      setDetail(data);
      setNote("");
      setUploadType("");
      setUploadFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open the application.");
    }
  }

  async function submitNew() {
    setError("");
    setMessage("");

    if (!programId) return setError("Select a program.");
    if (!values.firstName.trim()) return setError("First name is required.");
    if (!values.phone.trim()) return setError("Mobile number is required.");
    if (!values.studentEmail.trim()) return setError("Email is required.");

    const problem = firstProfileProblem(profile, details);

    if (problem) return setError(problem);
    if (profile?.requiresDeclarationName && !declarationName.trim()) {
      return setError("Type the full name of the person signing the declaration.");
    }
    if (!accepted) return setError("Please accept the declaration.");

    setWorking(true);

    try {
      const body: Record<string, unknown> = { programId, formProfile: profileId };

      for (const [key, value] of Object.entries(values)) {
        if (value.trim()) body[key] = value.trim();
      }

      body.nationality = typeof details.nationality === "string" ? details.nationality : undefined;
      body.details = {
        ...details,
        marks: Array.isArray(details.marks)
          ? (details.marks as MarkRow[]).filter((r) => String(r.obtained).trim() !== "")
          : undefined,
        declarationName: declarationName.trim() || undefined,
      };
      body.declarationAccepted = true;

      const created = await call("/college/admissions", json("POST", body));

      const psProblem = await uploadPhotoSign({
        url: `${API_URL}/college/admissions/${created.application.id}/documents`,
        photoType: "STUDENT_PHOTO",
        value: photoSign,
        credentials: true,
      });

      setPhotoSign(EMPTY_PS);

      setMessage(psProblem || "Application saved. Upload the documents next.");
      setValues({ ...EMPTY });
      setDetails(profile ? initialDetails(profile) : {});
      setDeclarationName("");
      setAccepted(false);
      setMode("list");
      await loadList();
      await open(created.application.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the application.");
    } finally {
      setWorking(false);
    }
  }

  async function review(action: string, extra: Record<string, unknown> = {}) {
    if (!detail) return;

    setError("");
    setMessage("");
    setWorking(true);

    try {
      const data = await call(
        `/college/admissions/${detail.application.id}/review`,
        json("POST", { action, note: note.trim() || undefined, ...extra }),
      );

      if (data.credentials) setCredentials(data.credentials);

      setMessage(data.message || "Updated.");
      await loadList();
      await open(detail.application.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update.");
    } finally {
      setWorking(false);
    }
  }

  async function upload() {
    if (!detail || !uploadFile || !uploadType) {
      return setError("Choose a document type and a file.");
    }

    setError("");
    setWorking(true);

    try {
      const form = new FormData();

      form.append("type", uploadType);
      form.append("file", uploadFile);

      await call(`/college/admissions/${detail.application.id}/documents`, {
        method: "POST",
        body: form,
      });

      setMessage("Document uploaded.");
      await open(detail.application.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setWorking(false);
    }
  }

  async function verify(doc: Doc) {
    if (!detail) return;

    try {
      await call(
        `/college/admissions/${detail.application.id}/documents/${doc.id}/verify`,
        json("PATCH", { verified: !doc.verified }),
      );
      await open(detail.application.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not verify.");
    }
  }

  async function download(doc: Doc) {
    if (!detail) return;

    try {
      const res = await fetch(
        `${API_URL}/college/admissions/${detail.application.id}/documents/${doc.id}/file`,
        { credentials: "include" },
      );

      if (!res.ok) throw new Error("Could not download the file.");

      const url = URL.createObjectURL(await res.blob());

      window.open(url, "_blank", "noopener");
      window.setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not download the file.");
    }
  }

  async function printFilled() {
    if (!detail) return;

    const app = detail.application;
    const p = meta.profiles.find((item) => item.id === app.formProfile);

    if (!p) return setError("Form layout is not loaded yet.");

    const images = await loadPrintImages(
      app.documents,
      (id) => `${API_URL}/college/admissions/${app.id}/documents/${id}/file`,
    );

    printHtml(
      buildFormHtml(
        p,
        institutionName,
        {
          ...images,
          applicationNumber: app.applicationNumber,
          className: app.program.name,
          submittedAt: app.submittedAt || undefined,
          status: app.status,
          base: { ...app, parentPhone: app.phone },
          details: app.details || {},
          uploadedTypes: app.documents.map((d) => d.type),
        },
        isCollegeClassProfile(app.formProfile) ? undefined : { variant: "college" },
      ),
    );
  }

  const link =
    institutionCode && typeof window !== "undefined"
      ? `${window.location.origin}/apply/${institutionCode}`
      : "";

  const detailProfile = detail
    ? meta.profiles.find((p) => p.id === detail.application.formProfile) || null
    : null;

  const set = (key: keyof typeof EMPTY, value: string) =>
    setValues((current) => ({ ...current, [key]: value }));

  const text = (key: keyof typeof EMPTY, label: string, type = "text") => (
    <label key={key} className="block text-xs font-semibold text-slate-600">
      {label}
      <input
        type={type}
        value={values[key]}
        onChange={(e) => set(key, e.target.value)}
        className={field}
      />
    </label>
  );

  return (
    <div className="space-y-4">
      {error && (
        <div role="alert" className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {message && (
        <div role="status" className="rounded border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          {message}
        </div>
      )}

      {link && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded border border-blue-100 bg-blue-50 p-3 text-xs text-blue-900">
          <div className="min-w-0">
            <p className="font-semibold">Public apply link for students</p>
            <p className="mt-1 break-all">{link}</p>
          </div>
          <button
            type="button"
            onClick={() =>
              navigator.clipboard
                .writeText(link)
                .then(() => setMessage("Link copied."))
                .catch(() => setError("Could not copy. Select the link and copy it."))
            }
            className="flex h-9 items-center gap-2 rounded bg-blue-800 px-3 font-semibold text-white"
          >
            <Copy size={14} />
            Copy link
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 rounded border border-slate-200 bg-white p-3">
        <div className="flex flex-wrap gap-2">
          {meta.profiles.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => printHtml(buildFormHtml(p, institutionName, undefined, isCollegeClassProfile(p.id) ? undefined : { variant: "college" }))}
              className="flex h-9 items-center gap-2 rounded border border-slate-300 px-3 text-xs font-semibold hover:bg-slate-50"
            >
              <Printer size={14} />
              Blank {collegeFormName(p.id)} form
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void loadList()}
            className="flex h-9 items-center gap-2 rounded border border-slate-300 px-3 text-xs font-semibold"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => { setMode(mode === "new" ? "list" : "new"); setDetail(null); }}
            className="flex h-9 items-center gap-2 rounded bg-blue-800 px-3 text-xs font-semibold text-white"
          >
            <Plus size={14} />
            {mode === "new" ? "Back to list" : "New application"}
          </button>
        </div>
      </div>

      {mode === "new" && (
        <form
          onSubmit={(e) => { e.preventDefault(); void submitNew(); }}
          className="space-y-5 rounded border border-slate-200 bg-white p-4"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-semibold text-slate-600">
              Form type
              <select value={profileId} onChange={(e) => { setProfileId(e.target.value); setProgramId(""); }} className={field}>
                {meta.profiles.map((p) => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </label>

            <label className="block text-xs font-semibold text-slate-600">
              {isCollegeClassProfile(profileId) ? "Class" : "Program"} <span className="text-red-600">*</span>
              <select value={programId} onChange={(e) => setProgramId(e.target.value)} className={field}>
                <option value="">{isCollegeClassProfile(profileId) ? "Select class" : "Select program"}</option>
                {programsForProfile(profileId, meta.programs).map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                ))}
              </select>
            </label>
          </div>

          {programsForProfile(profileId, meta.programs).length === 0 && (
            <p className="text-xs text-amber-700">
              {isCollegeClassProfile(profileId)
                ? "No class created yet. Open Quick Setup and create the Class 9 to 12 set first."
                : "No active program yet. Create a program first, then admissions can use it."}
            </p>
          )}

          <div className="rounded border border-slate-200 p-3">
            <h5 className="mb-3 text-sm font-bold text-slate-800">Applicant</h5>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {text("firstName", "First name *")}
              {text("middleName", "Middle name")}
              {text("lastName", "Last name")}
              {text("dateOfBirth", "Date of birth", "date")}
              <label className="block text-xs font-semibold text-slate-600">
                Gender
                <select value={values.gender} onChange={(e) => set("gender", e.target.value)} className={field}>
                  <option value="">Select</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </label>
              {text("category", "Category (General / OBC / SC / ST / EWS)")}
              {text("fatherName", "Father's name")}
              {text("motherName", "Mother's name")}
              {text("identityLast4", "Aadhaar last 4 digits only")}
              {text("phone", "Mobile number *")}
              {text("studentEmail", "Email *", "email")}
            </div>
          </div>

          <div className="rounded border border-slate-200 p-3">
            <h5 className="mb-3 text-sm font-bold text-slate-800">Address</h5>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {text("address", "Address")}
              {text("city", "City / district")}
              {text("state", "State")}
              {text("pinCode", "PIN code")}
            </div>
          </div>

          {profile && <AdmissionClassFields profile={profile} details={details} onChange={setDetails} />}

          {profile && (
            <div className="rounded border border-blue-100 bg-blue-50 p-3 text-xs text-blue-900">
              <p className="font-semibold">Documents to upload after saving:</p>
              <ul className="mt-1 list-disc pl-5">
                {profile.documents.map((d) => (
                  <li key={d.type}>{d.label}{d.required ? " (required)" : " (optional)"}</li>
                ))}
              </ul>
            </div>
          )}

          <PhotoSignaturePicker value={photoSign} onChange={setPhotoSign} />

          {profile?.requiresDeclarationName && (
            <label className="block text-xs font-semibold text-slate-600">
              Type full name as signature
              <input value={declarationName} onChange={(e) => setDeclarationName(e.target.value)} maxLength={100} className={field} />
            </label>
          )}

          <label className="flex items-start gap-2 rounded border border-slate-200 p-3 text-xs text-slate-700">
            <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="mt-0.5" />
            The applicant confirms the information is true and complete.
          </label>

          <button
            type="submit"
            disabled={working}
            className="h-10 rounded bg-blue-800 px-5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {working ? "Saving..." : "Save application"}
          </button>
        </form>
      )}

      {mode === "list" && (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <section className="space-y-3 rounded border border-slate-200 bg-white p-3">
            <div className="flex gap-2">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, number, mobile"
                className="h-9 min-w-0 flex-1 rounded border border-slate-300 px-3 text-sm"
              />
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-9 rounded border border-slate-300 px-2 text-xs">
                <option value="">All</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s.replaceAll("_", " ")}</option>
                ))}
              </select>
            </div>

            {loading ? (
              <p className="text-sm text-slate-500">Loading...</p>
            ) : rows.length === 0 ? (
              <p className="text-sm text-slate-500">No applications yet.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {rows.map((row) => (
                  <li key={row.id}>
                    <button
                      type="button"
                      onClick={() => void open(row.id)}
                      className={`w-full px-2 py-2 text-left hover:bg-slate-50 ${
                        detail?.application.id === row.id ? "bg-blue-50" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="min-w-0 truncate text-sm font-semibold text-slate-800">{row.name}</span>
                        <span className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-semibold ${badge[row.status] || ""}`}>
                          {row.status.replaceAll("_", " ")}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        {row.programName} · {row.applicationNumber} · {row.documentCount} docs
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="min-w-0 space-y-4 rounded border border-slate-200 bg-white p-4">
            {!detail ? (
              <p className="text-sm text-slate-500">Select an application to review it.</p>
            ) : (
              (() => {
                const app = detail.application;
                const open_ = ["SUBMITTED", "UNDER_REVIEW", "CHANGES_REQUESTED"].includes(app.status);
                const have = app.documents.map((d) => d.type);

                return (
                  <>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="text-lg font-bold text-slate-900">
                          {[app.firstName, app.lastName].filter(Boolean).join(" ")}
                        </h3>
                        <p className="text-xs text-slate-500">
                          {app.applicationNumber} · {app.program.name} · {app.phone}
                        </p>
                      </div>
                      <span className={`rounded px-2 py-1 text-xs font-semibold ${badge[app.status] || ""}`}>
                        {app.status.replaceAll("_", " ")}
                      </span>
                    </div>

                    {app.reviewNote && <p className="rounded bg-amber-50 p-2 text-xs text-amber-900">Note: {app.reviewNote}</p>}
                    {app.rejectionReason && <p className="rounded bg-red-50 p-2 text-xs text-red-800">Rejected: {app.rejectionReason}</p>}

                    <button
                      type="button"
                      onClick={printFilled}
                      className="flex h-9 items-center gap-2 rounded bg-blue-800 px-3 text-xs font-semibold text-white"
                    >
                      <Printer size={14} />
                      Print filled form
                    </button>

                    {detailProfile && (
                      <div className="grid gap-3 sm:grid-cols-2">
                        {detailProfile.sections.flatMap((section) =>
                          section.fields
                            .filter((f) => isFieldVisible(f, app.details || {}))
                            .map((f) => {
                              const value = (app.details || {})[f.key];
                              const textValue = Array.isArray(value) ? (value as string[]).join(", ") : String(value ?? "");

                              return textValue ? (
                                <div key={f.key} className="min-w-0">
                                  <p className="text-[10px] text-slate-500">{f.label}</p>
                                  <p className="mt-0.5 wrap-break-word text-xs font-semibold text-slate-800">{textValue}</p>
                                </div>
                              ) : null;
                            }),
                        )}
                      </div>
                    )}

                    {typeof app.details?.percentage === "number" && (
                      <p className="text-xs font-semibold text-emerald-700">Result: {app.details.percentage}%</p>
                    )}

                    <div className="rounded border border-slate-200 p-3">
                      <p className="text-xs font-bold text-slate-700">Documents</p>

                      <ul className="mt-2 space-y-2">
                        {(detailProfile?.documents || []).map((doc) => {
                          const files = app.documents.filter((d) => d.type === doc.type);

                          return (
                            <li key={doc.type} className="text-xs">
                              <div className="flex items-center justify-between gap-2">
                                <span className="min-w-0">{doc.label}</span>
                                <span className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-semibold ${
                                  files.length ? "bg-emerald-50 text-emerald-700" : doc.required ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-600"
                                }`}>
                                  {files.length ? "Uploaded" : doc.required ? "Missing" : "Optional"}
                                </span>
                              </div>
                              {files.map((f) => (
                                <div key={f.id} className="mt-1 flex items-center justify-between gap-2 pl-3 text-slate-600">
                                  <span className="min-w-0 truncate">{f.originalName}</span>
                                  <span className="flex shrink-0 gap-2">
                                    <button type="button" onClick={() => void download(f)} className="flex items-center gap-1 text-blue-800">
                                      <Download size={12} />
                                      View
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => void verify(f)}
                                      className={f.verified ? "font-semibold text-emerald-700" : "text-slate-600 underline"}
                                    >
                                      {f.verified ? "Verified" : "Verify"}
                                    </button>
                                  </span>
                                </div>
                              ))}
                            </li>
                          );
                        })}
                      </ul>

                      {open_ && (
                        <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
                          <select value={uploadType} onChange={(e) => setUploadType(e.target.value)} className="h-9 w-full rounded border border-slate-300 px-2 text-xs">
                            <option value="">Document type</option>
                            {(detailProfile?.documents || []).map((d) => (
                              <option key={d.type} value={d.type}>{d.label}</option>
                            ))}
                            <option value="OTHER">{documentLabel("OTHER")}</option>
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

                    {detail.missingRequired.length > 0 && open_ && (
                      <p className="text-xs text-red-700">Missing: {detail.missingRequired.join(", ")}</p>
                    )}

                    {(open_ || app.status === "APPROVED") && (
                      <div className="space-y-2 rounded border border-slate-200 p-3">
                        <p className="text-xs font-bold text-slate-700">Decision</p>

                        {open_ && (
                          <>
                            <textarea
                              value={note}
                              onChange={(e) => setNote(e.target.value)}
                              rows={2}
                              maxLength={500}
                              placeholder="Note for the student (needed for Request changes and Reject)"
                              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                            />
                            <div className="flex flex-wrap gap-2 text-xs font-semibold">
                              {app.status === "SUBMITTED" && (
                                <button type="button" disabled={working} onClick={() => void review("start_review")} className="h-9 rounded border border-slate-300 px-3">Start review</button>
                              )}
                              <button type="button" disabled={working} onClick={() => void review("request_changes")} className="h-9 rounded border border-orange-300 px-3 text-orange-700">Request changes</button>
                              <button type="button" disabled={working} onClick={() => void review("approve")} className="h-9 rounded bg-emerald-700 px-3 text-white">Approve</button>
                              <button type="button" disabled={working} onClick={() => void review("reject")} className="h-9 rounded bg-red-700 px-3 text-white">Reject</button>
                            </div>
                          </>
                        )}

                        {app.status === "APPROVED" && (
                          <div className="space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <label className="block text-xs font-semibold text-slate-600">
                                Semester
                                <select value={semester} onChange={(e) => setSemester(e.target.value)} className={field}>
                                  {Array.from({ length: app.program.semesters }, (_, i) => (
                                    <option key={i + 1} value={String(i + 1)}>{i + 1}</option>
                                  ))}
                                </select>
                              </label>
                              <label className="block text-xs font-semibold text-slate-600">
                                Roll number
                                <input value={rollNo} onChange={(e) => setRollNo(e.target.value)} maxLength={40} className={field} />
                              </label>
                            </div>
                            <button
                              type="button"
                              disabled={working}
                              onClick={() => void review("enroll", { rollNo: rollNo.trim() || undefined, semester: Number(semester) })}
                              className="h-9 rounded bg-violet-700 px-3 text-xs font-semibold text-white disabled:opacity-50"
                            >
                              Enroll student
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {credentials && (
                      <div className="rounded border border-violet-200 bg-violet-50 p-3 text-xs text-violet-900">
                        <p className="font-semibold">Student login (shown once)</p>
                        <p className="mt-1 break-all">ID: {credentials.eduNexaId}</p>
                        <p className="break-all">Email: {credentials.email}</p>
                        <p className="break-all">Temporary password: {credentials.temporaryPassword}</p>
                      </div>
                    )}

                    {have.length === 0 && open_ && (
                      <p className="text-xs text-slate-500">No documents uploaded yet.</p>
                    )}
                  </>
                );
              })()
            )}
          </section>
        </div>
      )}
    </div>
  );
}
