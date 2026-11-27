"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "../../lib/api";

type ClassOption = {
  id: string;
  name: string;
  sections: { id: string; name: string }[];
};

type Target = { classId: string; sectionId: string | null; label: string };

type Result = {
  portal: number;
  emailed: number;
  optedIn: number;
  emailConfigured: boolean;
  limited: boolean;
};

type Sent = {
  id: string;
  title: string;
  audience: string;
  recipients: number;
  emailed: number;
  createdAt: string;
};

const HEAD_AUDIENCES = [
  ["EVERYONE", "Everyone"],
  ["TEACHERS", "All teachers"],
  ["STAFF", "All staff"],
  ["STUDENTS", "Students"],
  ["PARENTS", "Parents"],
  ["CLASS", "Students and parents of a class"],
];

const TEACHER_AUDIENCES = [
  ["CLASS", "Students and parents"],
  ["STUDENTS", "Students only"],
  ["PARENTS", "Parents only"],
];

const field = "w-full border border-slate-300 px-3 py-2 text-sm text-slate-900";

export default function SendNoteModal({
  documentId,
  title,
  onClose,
}: {
  documentId: string;
  title: string;
  onClose: () => void;
}) {
  const [role, setRole] = useState<string | null>(null);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [targets, setTargets] = useState<Target[]>([]);
  const [audience, setAudience] = useState("");
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [pick, setPick] = useState("0");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [history, setHistory] = useState<Sent[]>([]);

  useEffect(() => {
    apiRequest<{ role: string }>("/dashboard/me")
      .then(async (me) => {
        setRole(me.role);

        if (me.role === "TEACHER") {
          setAudience("CLASS");
          const data = await apiRequest<{ targets: Target[] }>("/teacher/notices/targets");
          setTargets(data.targets);
        } else {
          setAudience("EVERYONE");
          setClasses(await apiRequest<ClassOption[]>("/students/classes").catch(() => []));
        }
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Could not load your account."),
      );

    apiRequest<Sent[]>("/notes/sends")
      .then(setHistory)
      .catch(() => setHistory([]));
  }, []);

  const isTeacher = role === "TEACHER";
  const needsClass = !isTeacher && ["STUDENTS", "PARENTS", "CLASS"].includes(audience);
  const sections = classes.find((item) => item.id === classId)?.sections ?? [];

  async function send() {
    setBusy(true);
    setError("");
    setResult(null);

    try {
      const target = isTeacher ? targets[Number(pick)] : null;
      const data = await apiRequest<Result>("/notes/send", {
        method: "POST",
        body: JSON.stringify({
          documentId,
          audience,
          classId: isTeacher ? target?.classId : classId || null,
          sectionId: isTeacher ? target?.sectionId : sectionId || null,
        }),
      });

      setResult(data);
      apiRequest<Sent[]>("/notes/sends").then(setHistory).catch(() => undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the note.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto bg-white p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-slate-900">Send this note</h2>
            <p className="truncate text-xs text-slate-500">{title}</p>
          </div>
          <button type="button" onClick={onClose} className="text-sm text-slate-500 hover:text-slate-900">
            Close
          </button>
        </div>

        {!role && !error && <p className="mt-4 text-sm text-slate-500">Loading…</p>}

        {role && role !== "HEAD" && role !== "TEACHER" && (
          <p className="mt-4 text-sm text-slate-600">Only heads and teachers can send notes.</p>
        )}

        {(role === "HEAD" || role === "TEACHER") && (
          <div className="mt-4 grid gap-3">
            {isTeacher ? (
              targets.length === 0 ? (
                <p className="text-sm text-slate-600">
                  No class is assigned to you yet, so you cannot send a note.
                </p>
              ) : (
                <select value={pick} onChange={(e) => setPick(e.target.value)} className={field}>
                  {targets.map((item, index) => (
                    <option key={`${item.classId}-${item.sectionId}`} value={index}>
                      {item.label}
                    </option>
                  ))}
                </select>
              )
            ) : null}

            <select value={audience} onChange={(e) => setAudience(e.target.value)} className={field}>
              {(isTeacher ? TEACHER_AUDIENCES : HEAD_AUDIENCES).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>

            {needsClass && (
              <div className="grid gap-3 sm:grid-cols-2">
                <select
                  value={classId}
                  onChange={(e) => {
                    setClassId(e.target.value);
                    setSectionId("");
                  }}
                  className={field}
                >
                  <option value="">{audience === "CLASS" ? "Choose class" : "All classes"}</option>
                  {classes.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
                <select
                  value={sectionId}
                  onChange={(e) => setSectionId(e.target.value)}
                  disabled={!classId}
                  className={field}
                >
                  <option value="">All sections</option>
                  {sections.map((item) => (
                    <option key={item.id} value={item.id}>
                      Section {item.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <p className="text-xs text-slate-500">
              Everyone gets it in their portal inbox. Email goes only to people who turned on
              email on their dashboard (up to 50 per note, 150 a day for the institution).
            </p>

            {error && <p className="text-sm text-red-600">{error}</p>}

            {result && (
              <div className="border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
                <p>Sent to {result.portal} people in the portal.</p>
                <p>
                  {result.emailConfigured
                    ? `Email sent to ${result.emailed} of ${result.optedIn} who chose email.`
                    : "Email is not set up on the server, so only the portal got it."}
                </p>
                {result.limited && (
                  <p className="text-amber-700">
                    The email limit was reached, so some email was skipped. The portal got everyone.
                  </p>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={send}
              disabled={busy || (isTeacher && targets.length === 0) || (audience === "CLASS" && !isTeacher && !classId)}
              className="h-9 w-fit bg-blue-800 px-4 text-xs font-semibold text-white hover:bg-blue-900 disabled:opacity-60"
            >
              {busy ? "Sending…" : "Send note"}
            </button>
          </div>
        )}

        {history.length > 0 && (
          <div className="mt-5 border-t border-slate-100 pt-3">
            <p className="text-xs font-bold text-slate-700">Sent before</p>
            <ul className="mt-1 divide-y divide-slate-100 text-xs text-slate-600">
              {history.slice(0, 5).map((item) => (
                <li key={item.id} className="py-1.5">
                  {item.title} · {new Date(item.createdAt).toLocaleDateString("en-IN")} ·{" "}
                  {item.recipients} portal, {item.emailed} email
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
