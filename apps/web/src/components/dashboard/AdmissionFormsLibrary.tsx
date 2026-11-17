"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Printer, FileText, ChevronLeft } from "lucide-react";

import { API_URL } from "../../lib/api";
import { buildFormHtml, printHtml } from "../../lib/admissionPrint";
import type { AdmissionProfile } from "../../lib/admissionProfiles";

/* List of every admission form with its blank printout
   and document checklist. */
export default function AdmissionFormsLibrary() {
  const [profiles, setProfiles] = useState<AdmissionProfile[]>([]);
  const [institutionName, setInstitutionName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [profileRes, meRes] = await Promise.all([
          fetch(`${API_URL}/students/admissions/form-profiles`, {
            credentials: "include",
            cache: "no-store",
          }),
          fetch(`${API_URL}/dashboard/me`, {
            credentials: "include",
            cache: "no-store",
          }),
        ]);

        const profileData = await profileRes.json().catch(() => ({}));

        if (!profileRes.ok) {
          throw new Error(profileData.message || "Could not load the forms.");
        }

        const me = await meRes.json().catch(() => ({}));

        if (!active) return;

        setProfiles(profileData.profiles || []);
        setInstitutionName(me?.institution?.name || "");
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Could not load the forms.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <Link
          href="/dashboard/add"
          className="mb-2 flex items-center gap-1 text-xs font-semibold text-blue-800"
        >
          <ChevronLeft size={14} />
          Back to admissions
        </Link>

        <h2 className="text-xl font-bold text-slate-900">Admission Forms</h2>

        <p className="mt-1 text-sm text-slate-500">
          Print a blank form for the parent to fill at home. Then enter it here from the paper
          form. In the print window choose Save as PDF if you want a file.
        </p>
      </div>

      {error && (
        <div role="alert" className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-slate-500">Loading forms...</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {profiles.map((profile) => (
            <section
              key={profile.id}
              className="space-y-3 rounded border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="flex items-center gap-2 font-bold text-slate-900">
                    <FileText size={17} className="shrink-0 text-blue-800" />
                    {profile.title}
                  </h3>
                  <p className="mt-1 text-xs font-semibold text-blue-800">{profile.classLabel}</p>
                  <p className="mt-1 text-xs text-slate-500">{profile.description}</p>
                </div>

                <button
                  type="button"
                  onClick={() => printHtml(buildFormHtml(profile, institutionName))}
                  className="flex h-9 shrink-0 items-center gap-2 rounded bg-blue-800 px-3 text-xs font-semibold text-white hover:bg-blue-900"
                >
                  <Printer size={14} />
                  Print blank
                </button>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-700">Documents to attach</p>
                <ul className="mt-1 space-y-1">
                  {profile.documents.map((doc) => (
                    <li key={doc.type} className="flex items-start justify-between gap-2 text-xs">
                      <span className="min-w-0 text-slate-700">{doc.label}</span>
                      <span
                        className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-semibold ${
                          doc.required
                            ? "bg-red-50 text-red-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {doc.required ? "Required" : "Optional"}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-[10px] text-slate-500">JPG, PNG or PDF, maximum 2 MB each.</p>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
