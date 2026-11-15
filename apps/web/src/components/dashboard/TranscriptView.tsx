"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Printer } from "lucide-react";
import { apiRequest } from "../../lib/api";

type Me = {
  role: string;
  institution: { name: string };
  profile: { name: string; eduNexaId: string };
  student?: {
    program?: { name: string; department: string; rollNo: string | null } | null;
    transcript?: {
      cgpa: number | null;
      totalCredits: number;
      semesters: {
        semester: number;
        sgpa: number | null;
        credits: number;
        courses: {
          code: string;
          title: string;
          credits: number;
          marks: number;
          grade: string;
          gradePoint: number;
        }[];
      }[];
    } | null;
  };
};

export default function TranscriptView() {
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiRequest<Me>("/dashboard/me")
      .then(setMe)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Could not load the transcript."),
      );
  }, []);

  const transcript = me?.student?.transcript;

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-800 print:bg-white print:py-0">
      <div className="mx-auto max-w-3xl">
        <div className="mb-3 flex items-center justify-between print:hidden">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-xs font-semibold text-blue-800"
          >
            <ArrowLeft size={14} /> Back
          </Link>
          {transcript && (
            <button
              type="button"
              onClick={() => window.print()}
              className="flex h-8 items-center gap-1.5 bg-blue-800 px-3 text-xs font-semibold text-white hover:bg-blue-900"
            >
              <Printer size={14} /> Print / save as PDF
            </button>
          )}
        </div>

        {error && (
          <p className="border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>
        )}

        {me && !transcript && (
          <p className="border border-slate-200 bg-white p-6 text-sm text-slate-500">
            No results have been published for you yet.
          </p>
        )}

        {me && transcript && (
          <section className="border border-slate-300 bg-white p-6 sm:p-8">
            <p className="text-center text-xs font-bold uppercase tracking-[.25em] text-blue-900">
              Academic Transcript
            </p>
            <h1 className="mt-2 text-center text-xl font-bold text-slate-900">
              {me.institution.name}
            </h1>
            <div className="mt-5 grid gap-1 text-sm sm:grid-cols-2">
              <p>
                <span className="text-slate-500">Name: </span>
                <span className="font-semibold">{me.profile.name}</span>
              </p>
              <p>
                <span className="text-slate-500">EduNexa ID: </span>
                {me.profile.eduNexaId}
              </p>
              {me.student?.program && (
                <>
                  <p>
                    <span className="text-slate-500">Program: </span>
                    {me.student.program.name}
                  </p>
                  <p>
                    <span className="text-slate-500">Department: </span>
                    {me.student.program.department}
                  </p>
                </>
              )}
            </div>

            {transcript.semesters.map((semester) => (
              <div key={semester.semester} className="mt-6">
                <p className="flex justify-between bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700">
                  <span>Semester {semester.semester}</span>
                  <span>
                    SGPA {semester.sgpa ?? "-"} · {semester.credits} credits
                  </span>
                </p>
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-slate-100">
                    {semester.courses.map((course) => (
                      <tr key={course.code}>
                        <td className="w-24 px-3 py-1.5 text-xs text-slate-500">{course.code}</td>
                        <td className="px-3 py-1.5">{course.title}</td>
                        <td className="w-14 px-3 py-1.5 text-right text-xs">{course.credits} cr</td>
                        <td className="w-14 px-3 py-1.5 text-right">{course.marks}</td>
                        <td className="w-12 px-3 py-1.5 text-right font-semibold">{course.grade}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}

            <p className="mt-6 border-t border-slate-200 pt-3 text-right text-sm font-bold text-slate-900">
              CGPA {transcript.cgpa ?? "-"} · {transcript.totalCredits} credits
            </p>
            <p className="mt-1 text-right text-[11px] text-slate-400">
              10-point scale. SGPA and CGPA are weighted by course credits.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
