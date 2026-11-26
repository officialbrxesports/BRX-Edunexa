"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "../../lib/api";

type Target = { classId: string; sectionId: string | null; label: string };

export default function TeacherNoticeSend() {
  const [targets, setTargets] = useState<Target[] | null>(null);
  const [pick, setPick] = useState("0");
  const [audience, setAudience] = useState("CLASS");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  useEffect(() => {
    apiRequest<{ targets: Target[] }>("/teacher/notices/targets")
      .then((data) => setTargets(data.targets))
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Could not load classes."),
      );
  }, []);

  async function send(event: React.FormEvent) {
    event.preventDefault();
    const target = targets?.[Number(pick)];

    if (!target) return;

    setBusy(true);
    setError("");
    setDone("");

    try {
      const result = await apiRequest<{ sent: number }>("/teacher/notices", {
        method: "POST",
        body: JSON.stringify({
          title,
          message,
          audience,
          classId: target.classId,
          sectionId: target.sectionId,
        }),
      });

      setDone(`Notice sent to ${result.sent} people.`);
      setTitle("");
      setMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the notice.");
    } finally {
      setBusy(false);
    }
  }

  if (targets && targets.length === 0) {
    return (
      <p className="p-5 text-sm text-slate-500">
        No class is assigned to you yet, so you cannot send a notice.
      </p>
    );
  }

  const field = "w-full border border-slate-300 px-3 py-2 text-sm";

  return (
    <form onSubmit={send} className="grid gap-3 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <select value={pick} onChange={(e) => setPick(e.target.value)} className={field}>
          {(targets ?? []).map((item, index) => (
            <option key={`${item.classId}-${item.sectionId}`} value={index}>
              {item.label}
            </option>
          ))}
        </select>
        <select value={audience} onChange={(e) => setAudience(e.target.value)} className={field}>
          <option value="CLASS">Students and parents</option>
          <option value="STUDENTS">Students only</option>
          <option value="PARENTS">Parents only</option>
        </select>
      </div>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={160}
        placeholder="Title"
        required
        className={field}
      />
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        maxLength={2000}
        rows={3}
        placeholder="Message"
        required
        className={field}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      {done && <p className="text-sm text-emerald-700">{done}</p>}
      <button
        type="submit"
        disabled={busy || !targets}
        className="h-9 w-fit bg-blue-800 px-4 text-xs font-semibold text-white hover:bg-blue-900 disabled:opacity-60"
      >
        {busy ? "Sending…" : "Send notice"}
      </button>
    </form>
  );
}
