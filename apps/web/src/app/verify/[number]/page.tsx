"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Award, Printer } from "lucide-react";
import { API_URL } from "../../../lib/api";

type Certificate = {
  certificateNo: string;
  issuedOn: string;
  institution: string;
  student: string;
  course: string;
  durationWeeks: number;
  grade: string | null;
  startedOn: string;
  completedOn: string | null;
};

const fmt = (value: string | null) =>
  value
    ? new Date(value).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

export default function VerifyCertificatePage() {
  const params = useParams<{ number: string }>();
  const number = decodeURIComponent(params.number ?? "");
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "missing" | "error">("loading");

  useEffect(() => {
    let cancelled = false;

    fetch(`${API_URL}/public/certificates/${encodeURIComponent(number)}`, {
      cache: "no-store",
    })
      .then(async (response) => {
        if (cancelled) return;

        if (response.status === 404) {
          setState("missing");
          return;
        }

        if (!response.ok) {
          setState("error");
          return;
        }

        setCertificate((await response.json()) as Certificate);
        setState("ok");
      })
      .catch(() => {
        if (!cancelled) setState("error");
      });

    return () => {
      cancelled = true;
    };
  }, [number]);

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10 text-slate-800 print:bg-white print:py-0">
      <div className="mx-auto max-w-3xl">
        {state === "loading" && (
          <p className="text-center text-sm text-slate-500">Checking certificate...</p>
        )}

        {state === "missing" && (
          <div className="border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-lg font-bold text-red-800">Certificate not found</p>
            <p className="mt-1 text-sm text-red-700">
              No certificate matches the number {number}. Please check the number and try again.
            </p>
          </div>
        )}

        {state === "error" && (
          <div className="border border-amber-200 bg-amber-50 p-6 text-center text-sm text-amber-800">
            Could not check the certificate right now. Please try again in a minute.
          </div>
        )}

        {state === "ok" && certificate && (
          <>
            <p className="mb-3 flex items-center justify-center gap-2 text-sm font-semibold text-emerald-700 print:hidden">
              <Award size={16} /> Verified: this certificate was issued by{" "}
              {certificate.institution}
            </p>
            <section className="border-4 border-double border-blue-900 bg-white p-8 text-center shadow-sm sm:p-12 print:shadow-none">
              <p className="text-xs font-bold uppercase tracking-[.3em] text-blue-900">
                Certificate of Completion
              </p>
              <p className="mt-6 text-sm text-slate-500">This is to certify that</p>
              <h1 className="mt-2 text-3xl font-bold text-slate-900">
                {certificate.student}
              </h1>
              <p className="mt-6 text-sm text-slate-500">has successfully completed</p>
              <h2 className="mt-2 text-xl font-bold text-blue-900">{certificate.course}</h2>
              <p className="mt-1 text-sm text-slate-600">
                {certificate.durationWeeks} weeks
                {certificate.grade ? ` · Grade ${certificate.grade}` : ""}
              </p>
              <p className="mt-8 text-sm text-slate-600">
                {certificate.completedOn
                  ? `Completed on ${fmt(certificate.completedOn)}`
                  : ""}
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-800">
                {certificate.institution}
              </p>
              <p className="mt-8 border-t border-slate-200 pt-3 text-xs text-slate-500">
                Certificate No. {certificate.certificateNo} · Issued on{" "}
                {fmt(certificate.issuedOn)}
              </p>
            </section>
            <div className="mt-4 text-center print:hidden">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex h-9 items-center gap-2 bg-blue-800 px-4 text-xs font-semibold text-white hover:bg-blue-900"
              >
                <Printer size={14} />
                Print / save as PDF
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
