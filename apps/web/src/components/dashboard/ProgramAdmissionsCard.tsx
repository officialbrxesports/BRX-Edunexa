"use client";

import Link from "next/link";

export type AdmissionsSummary = {
  byStatus: Record<string, number>;
  total: number;
  recent: {
    id: string;
    applicationNumber: string;
    name: string;
    status: string;
    submittedAt: string | null;
  }[];
};

const STATUSES = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "CHANGES_REQUESTED",
  "APPROVED",
  "REJECTED",
  "ENROLLED",
];

export default function ProgramAdmissionsCard({
  admissions,
  href,
}: {
  admissions?: AdmissionsSummary;
  href: string;
}) {
  return (
    <section className="mt-6 border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <h2 className="text-sm font-bold text-slate-900">
          Admissions
          {admissions ? (
            <span className="ml-2 text-xs font-normal text-slate-500">
              {admissions.total} in total
            </span>
          ) : null}
        </h2>
        <Link href={href} className="text-xs font-semibold text-blue-800">
          Open admissions
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-6">
        {STATUSES.map((key) => (
          <div key={key} className="border border-slate-200 p-3">
            <p className="text-[10px] font-semibold text-slate-500">
              {key.replaceAll("_", " ")}
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {admissions?.byStatus[key] ?? 0}
            </p>
          </div>
        ))}
      </div>

      {admissions && admissions.recent.length > 0 && (
        <ul className="divide-y divide-slate-100 border-t border-slate-100">
          {admissions.recent.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
              <div className="min-w-0">
                <p className="truncate font-semibold text-slate-900">{item.name}</p>
                <p className="truncate text-xs text-slate-500">{item.applicationNumber}</p>
              </div>
              <span className="shrink-0 bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                {item.status.replaceAll("_", " ")}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
