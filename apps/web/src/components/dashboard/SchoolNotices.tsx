"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiRequest } from "../../lib/api";

type ClassOption = {
  id: string;
  name: string;
  sections: { id: string; name: string }[];
};

type Sent = {
  title: string;
  message: string;
  createdAt: string;
  recipients: number;
  read: number;
};

const AUDIENCES = [
  ["EVERYONE", "Everyone (teachers, staff, students, parents, guards)"],
  ["TEACHERS", "All teachers"],
  ["STAFF", "All staff"],
  ["STUDENTS", "All students"],
  ["PARENTS", "All parents"],
  ["CLASS", "A class / section (students + parents)"],
] as const;

const field =
  "mt-1 w-full border border-slate-300 bg-white px-3 py-2 text-sm font-normal outline-none focus:border-blue-600";

export default function SchoolNotices({ mode = "both" }: { mode?: "send" | "history" | "both" }) {
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [sent, setSent] = useState<Sent[]>([]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [audience, setAudience] = useState("EVERYONE");
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const load = useCallback(async () => {
    try {
      setSent(await apiRequest<Sent[]>("/notices/sent"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load notices.");
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);

    apiRequest<ClassOption[]>("/students/classes")
      .then(setClasses)
      .catch(() => setClasses([]));

    return () => window.clearTimeout(timer);
  }, [load]);

  const sections = useMemo(
    () => classes.find((item) => item.id === classId)?.sections ?? [],
    [classes, classId],
  );

  const needsClass = audience === "CLASS";
  const classOptional = audience === "STUDENTS" || audience === "PARENTS";

  async function send(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setInfo("");

    try {
      const result = await apiRequest<{ sent: number }>("/notices", {
        method: "POST",
        body: JSON.stringify({
          title,
          message,
          audience,
          classId: needsClass || classOptional ? classId || null : null,
          sectionId: needsClass || classOptional ? sectionId || null : null,
        }),
      });

      setInfo(`Notice sent to ${result.sent} ${result.sent === 1 ? "person" : "people"}.`);
      setTitle("");
      setMessage("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the notice.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(item: Sent) {
    if (!window.confirm(`Delete "${item.title}" for all ${item.recipients} recipients?`)) return;

    try {
      await apiRequest("/notices/delete", {
        method: "POST",
        body: JSON.stringify({
          title: item.title,
          message: item.message,
          createdAt: item.createdAt,
        }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the notice.");
    }
  }

  return (
    <div className={mode === "both" ? "grid gap-5 lg:grid-cols-5" : "max-w-3xl"}>
      {mode !== "history" && (
      <form onSubmit={send} className="space-y-3 border border-slate-200 bg-white p-4 shadow-sm lg:col-span-2">
        <h3 className="text-sm font-bold text-slate-900">Send a notice</h3>
        <label className="block text-xs font-semibold text-slate-600">
          To
          <select
            value={audience}
            onChange={(event) => {
              setAudience(event.target.value);
              setClassId("");
              setSectionId("");
            }}
            className={field}
          >
            {AUDIENCES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        {(needsClass || classOptional) && (
          <div className="grid grid-cols-2 gap-2">
            <label className="block text-xs font-semibold text-slate-600">
              Class{classOptional ? " (optional)" : ""}
              <select
                required={needsClass}
                value={classId}
                onChange={(event) => {
                  setClassId(event.target.value);
                  setSectionId("");
                }}
                className={field}
              >
                <option value="">{classOptional ? "All classes" : "Choose class"}</option>
                {classes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-semibold text-slate-600">
              Section
              <select
                value={sectionId}
                disabled={!classId}
                onChange={(event) => setSectionId(event.target.value)}
                className={field}
              >
                <option value="">All sections</option>
                {sections.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        <label className="block text-xs font-semibold text-slate-600">
          Title
          <input
            required
            maxLength={160}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="e.g. Holiday on Friday"
            className={field}
          />
        </label>
        <label className="block text-xs font-semibold text-slate-600">
          Message
          <textarea
            required
            rows={6}
            maxLength={2000}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            className={field}
          />
          <span className="mt-0.5 block text-right text-[11px] font-normal text-slate-400">
            {message.length}/2000
          </span>
        </label>

        {error && <p className="bg-red-50 p-2 text-sm text-red-700">{error}</p>}
        {info && <p className="bg-emerald-50 p-2 text-sm text-emerald-800">{info}</p>}

        <button
          type="submit"
          disabled={busy}
          className="h-9 w-full bg-blue-700 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
        >
          {busy ? "Sending..." : "Send notice"}
        </button>
        <p className="text-[11px] text-slate-500">
          Everyone sees it in their own dashboard under Notices. No email is sent.
        </p>
      </form>
      )}

      {mode !== "send" && (
      <section className="border border-slate-200 bg-white shadow-sm lg:col-span-3">
        <h3 className="border-b border-slate-100 px-4 py-3 text-sm font-bold text-slate-900">
          Sent notices
        </h3>
        {sent.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">
            You have not sent any notice yet. Send one from Add &gt; Notice.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {sent.map((item) => (
              <li key={`${item.createdAt}-${item.title}`} className="px-4 py-3 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">{item.title}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(item.createdAt).toLocaleString("en-IN", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      · sent to {item.recipients} · read by {item.read}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void remove(item)}
                    className="shrink-0 bg-red-50 px-2 py-1 text-xs text-red-700 hover:bg-red-100"
                  >
                    Delete
                  </button>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-slate-700">{item.message}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
      )}
    </div>
  );
}
