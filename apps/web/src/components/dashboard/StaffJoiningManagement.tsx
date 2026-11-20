"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, Plus, Printer, RefreshCw, Upload } from "lucide-react";

import { API_URL } from "../../lib/api";
import AdmissionClassFields from "./AdmissionClassFields";
import { buildFormHtml, printHtml } from "../../lib/admissionPrint";
import {
  firstProfileProblem,
  initialDetails,
  isFieldVisible,
  type AdmissionProfile,
  type Details,
} from "../../lib/admissionProfiles";

type Role = "TEACHER" | "STAFF" | "GUARD";

const ROLES: { id: Role; label: string }[] = [
  { id: "TEACHER", label: "Teacher" },
  { id: "STAFF", label: "Staff" },
  { id: "GUARD", label: "Security Guard" },
];

type Row = {
  id: string;
  applicationNumber: string;
  status: string;
  role: Role;
  name: string;
  phone: string;
  documentCount: number;
};

type Doc = { id: string; type: string; originalName: string; verified: boolean };

type Detail = {
  application: Record<string, unknown> & {
    id: string;
    applicationNumber: string;
    status: string;
    role: Role;
    firstName: string;
    lastName?: string | null;
    phone: string;
    email: string;
    reviewNote?: string | null;
    rejectionReason?: string | null;
    details?: Details | null;
    submittedAt?: string | null;
    documents: Doc[];
  };
  missingRequired: string[];
};

const STATUSES = ["SUBMITTED", "UNDER_REVIEW", "CHANGES_REQUESTED", "APPROVED", "REJECTED", "ENROLLED"];

const STATUS_LABEL: Record<string, string> = {
  ENROLLED: "JOINED",
};

const statusText = (s: string) => (STATUS_LABEL[s] || s).replaceAll("_", " ");

const badge: Record<string, string> = {
  SUBMITTED: "bg-blue-50 text-blue-700",
  UNDER_REVIEW: "bg-amber-50 text-amber-700",
  CHANGES_REQUESTED: "bg-orange-50 text-orange-700",
  APPROVED: "bg-emerald-50 text-emerald-700",
  REJECTED: "bg-red-50 text-red-700",
  ENROLLED: "bg-violet-50 text-violet-700",
};

const EMPTY = {
  firstName: "", middleName: "", lastName: "", dateOfBirth: "", gender: "",
  fatherName: "", email: "", phone: "", identityLast4: "",
  address: "", city: "", state: "", pinCode: "",
};

const field =
  "mt-1 h-10 w-full rounded border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-600";

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

export default function StaffJoiningManagement() {
  const [profiles, setProfiles] = useState<AdmissionProfile[]>([]);
  const [role, setRole] = useState<Role>("TEACHER");
  const [rows, setRows] = useState<Row[]>([]);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [mode, setMode] = useState<"list" | "new">("list");
  const [detail, setDetail] = useState<Detail | null>(null);
  const [institutionName, setInstitutionName] = useState("");

  const [values, setValues] = useState({ ...EMPTY });
  const [details, setDetails] = useState<Details>({});
  const [declarationName, setDeclarationName] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [working, setWorking] = useState(false);

  const [note, setNote] = useState("");
  const [uploadType, setUploadType] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [credentials, setCredentials] = useState<{
    eduNexaId: string;
    email: string;
    temporaryPassword: string;
  } | null>(null);

  const profileOf = useCallback(
    (r: string) => profiles.find((p) => p.id === `JOIN_${r}`) || null,
    [profiles],
  );

  const profile = useMemo(() => profileOf(role), [profileOf, role]);

  useEffect(() => {
    setDetails(profile ? initialDetails(profile) : {});
    setDeclarationName("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, profiles]);

  const loadList = useCallback(async () => {
    setLoading(true);

    try {
      const query = new URLSearchParams({ role });

      if (status) query.set("status", status);
      if (search.trim()) query.set("search", search.trim());

      setRows(await call(`/staff-joining?${query.toString()}`));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load applications.");
    } finally {
      setLoading(false);
    }
  }, [role, status, search]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  useEffect(() => {
    call("/staff-joining/meta")
      .then((data) => setProfiles(data.profiles || []))
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load forms."));

    call("/dashboard/me")
      .then((me) => setInstitutionName(me?.institution?.name || ""))
      .catch(() => undefined);
  }, []);

  async function open(id: string) {
    setError("");
    setMessage("");
    setCredentials(null);

    try {
      setDetail((await call(`/staff-joining/${id}`)) as Detail);
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

    if (!values.firstName.trim()) return setError("First name is required.");
    if (!values.phone.trim()) return setError("Mobile number is required.");
    if (!values.email.trim()) return setError("Email is required.");

    const problem = firstProfileProblem(profile, details);

    if (problem) return setError(problem);
    if (!declarationName.trim()) {
      return setError("Type the full name of the applicant as signature.");
    }
    if (!accepted) return setError("Please accept the declaration.");

    setWorking(true);

    try {
      const body: Record<string, unknown> = { role };

      for (const [key, value] of Object.entries(values)) {
        if (value.trim()) body[key] = value.trim();
      }

      body.details = { ...details, declarationName: declarationName.trim() };
      body.declarationAccepted = true;

      const created = await call("/staff-joining", json("POST", body));

      setMessage("Application saved. Upload the documents next.");
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

  async function review(action: string) {
    if (!detail) return;

    setError("");
    setMessage("");
    setWorking(true);

    try {
      const data = await call(
        `/staff-joining/${detail.application.id}/review`,
        json("POST", { action, note: note.trim() || undefined }),
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

      await call(`/staff-joining/${detail.application.id}/documents`, {
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
        `/staff-joining/${detail.application.id}/documents/${doc.id}/verify`,
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
        `${API_URL}/staff-joining/${detail.application.id}/documents/${doc.id}/file`,
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

  function printFilled() {
    if (!detail) return;

    const app = detail.application;
    const p = profileOf(app.role);

    if (!p) return setError("Form layout is not loaded yet.");

    printHtml(
      buildFormHtml(
        p,
        institutionName,
        {
          applicationNumber: app.applicationNumber,
          className: p.classLabel,
          submittedAt: app.submittedAt || undefined,
          status: app.status,
          base: app,
          details: app.details || {},
          uploadedTypes: app.documents.map((d) => d.type),
        },
        { variant: "staff" },
      ),
    );
  }

  const set = (key: keyof typeof EMPTY, value: string) =>
    setValues((current) => ({ ...current, [key]: value }));

  const text = (key: keyof typeof EMPTY, label: string, type = "text") => (
    <label key={key} className="block text-xs font-semibold text-slate-600">
      {label}
      <input type={type} value={values[key]} onChange={(e) => set(key, e.target.value)} className={field} />
    </label>
  );

  const detailProfile = detail ? profileOf(detail.application.role) : null;

  return (
    <div className="space-y-4">
      {error && (
        <div role="alert" className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}
      {message && (
        <div role="status" className="rounded border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{message}</div>
      )}

      <div className="flex flex-wrap gap-2">
        {ROLES.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => { setRole(r.id); setDetail(null); setMode("list"); setCredentials(null); }}
            className={`h-9 rounded px-4 text-xs font-semibold ${
              role === r.id ? "bg-blue-800 text-white" : "border border-slate-300 bg-white text-slate-700"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 rounded border border-slate-200 bg-white p-3">
        <button
          type="button"
          disabled={!profile}
          onClick={() => profile && printHtml(buildFormHtml(profile, institutionName, undefined, { variant: "staff" }))}
          className="flex h-9 items-center gap-2 rounded border border-slate-300 px-3 text-xs font-semibold hover:bg-slate-50 disabled:opacity-50"
        >
          <Printer size={14} />
          Blank {ROLES.find((r) => r.id === role)?.label} form
        </button>

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
            {mode === "new" ? "Back to list" : "New joining"}
          </button>
        </div>
      </div>

      {mode === "new" && (
        <form
          onSubmit={(e) => { e.preventDefault(); void submitNew(); }}
          className="space-y-4 rounded border border-slate-200 bg-white p-4"
        >
          <h4 className="text-sm font-bold text-slate-900">{profile?.title}</h4>

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
              {text("fatherName", "Father's / husband's name")}
              {text("identityLast4", "Aadhaar last 4 digits only")}
              {text("phone", "Mobile number *")}
              {text("email", "Email *", "email")}
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

          <label className="block text-xs font-semibold text-slate-600">
            Type applicant&apos;s full name as signature
            <input value={declarationName} onChange={(e) => setDeclarationName(e.target.value)} maxLength={100} className={field} />
          </label>

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
                  <option key={s} value={s}>{statusText(s)}</option>
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
                      className={`w-full px-2 py-2 text-left hover:bg-slate-50 ${detail?.application.id === row.id ? "bg-blue-50" : ""}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="min-w-0 truncate text-sm font-semibold text-slate-800">{row.name}</span>
                        <span className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-semibold ${badge[row.status] || ""}`}>
                          {statusText(row.status)}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        {row.applicationNumber} · {row.documentCount} docs
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
                const isOpen = ["SUBMITTED", "UNDER_REVIEW", "CHANGES_REQUESTED"].includes(app.status);

                return (
                  <>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="text-lg font-bold text-slate-900">
                          {[app.firstName, app.lastName].filter(Boolean).join(" ")}
                        </h3>
                        <p className="text-xs text-slate-500">
                          {app.applicationNumber} · {app.phone} · {app.email}
                        </p>
                      </div>
                      <span className={`rounded px-2 py-1 text-xs font-semibold ${badge[app.status] || ""}`}>
                        {statusText(app.status)}
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

                      {isOpen && (
                        <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
                          <select value={uploadType} onChange={(e) => setUploadType(e.target.value)} className="h-9 w-full rounded border border-slate-300 px-2 text-xs">
                            <option value="">Document type</option>
                            {(detailProfile?.documents || []).map((d) => (
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

                    {detail.missingRequired.length > 0 && isOpen && (
                      <p className="text-xs text-red-700">Missing: {detail.missingRequired.join(", ")}</p>
                    )}

                    {(isOpen || app.status === "APPROVED") && (
                      <div className="space-y-2 border-t border-slate-100 pt-3">
                        {isOpen && (
                          <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            maxLength={500}
                            placeholder="Note (needed for Request changes and Reject)"
                            className="min-h-16 w-full rounded border border-slate-300 p-2 text-xs"
                          />
                        )}
                        <div className="flex flex-wrap gap-2">
                          {app.status === "SUBMITTED" && (
                            <button type="button" disabled={working} onClick={() => void review("start_review")} className="h-9 rounded border border-slate-300 px-3 text-xs font-semibold">
                              Start review
                            </button>
                          )}
                          {isOpen && (
                            <>
                              <button type="button" disabled={working} onClick={() => void review("approve")} className="h-9 rounded bg-emerald-700 px-3 text-xs font-semibold text-white">
                                Approve
                              </button>
                              <button type="button" disabled={working} onClick={() => void review("request_changes")} className="h-9 rounded border border-orange-300 px-3 text-xs font-semibold text-orange-700">
                                Request changes
                              </button>
                              <button type="button" disabled={working} onClick={() => void review("reject")} className="h-9 rounded border border-red-300 px-3 text-xs font-semibold text-red-700">
                                Reject
                              </button>
                            </>
                          )}
                          {app.status === "APPROVED" && (
                            <button type="button" disabled={working} onClick={() => void review("create_account")} className="h-9 rounded bg-violet-700 px-3 text-xs font-semibold text-white">
                              Create login
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {credentials && (
                      <div className="rounded border border-violet-200 bg-violet-50 p-3 text-xs text-violet-900">
                        <p className="font-bold">Login created. Share this once.</p>
                        <p className="mt-1">ID: <b>{credentials.eduNexaId}</b></p>
                        <p>Email: <b>{credentials.email}</b></p>
                        <p>Temporary password: <b>{credentials.temporaryPassword}</b></p>
                        <p className="mt-1 text-[10px]">They must change the password on first login.</p>
                      </div>
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
