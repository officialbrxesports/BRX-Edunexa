"use client";

import { useEffect, useState } from "react";
import { API_URL } from "../../lib/api";

type Template = {
  id: string;
  level: "UG" | "PG";
  programName: string;
  departmentName: string;
  facultyName: string;
  semesters: number;
  courseCount: number;
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
      (Array.isArray(data.message) ? data.message.join(", ") : data.message) ||
        "Request failed.",
    );
  }
  return data;
}

export default function CollegeQuickSetup() {
  const [items, setItems] = useState<Template[]>([]);
  const [picked, setPicked] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    call("/college/templates")
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch((e: Error) => setError(e.message));
  }, []);

  const toggle = (id: string) =>
    setPicked((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  const apply = async () => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const data = await call("/college/templates/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: picked }),
      });
      setMessage(
        `Done: ${data.programs} programs, ${data.departments} departments, ${data.courses} courses created` +
          (data.skipped ? ` (${data.skipped} programs already existed, skipped).` : "."),
      );
      setPicked([]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const group = (level: "UG" | "PG", title: string) => {
    const list = items.filter((t) => t.level === level);
    return (
      <section className="border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2.5">
          <h2 className="text-sm font-bold text-slate-800">{title}</h2>
          <button
            type="button"
            className="text-xs font-semibold text-blue-700"
            onClick={() => {
              const ids = list.map((t) => t.id);
              const all = ids.every((id) => picked.includes(id));
              setPicked((cur) =>
                all ? cur.filter((id) => !ids.includes(id)) : Array.from(new Set([...cur, ...ids])),
              );
            }}
          >
            Select all / none
          </button>
        </div>
        <ul className="divide-y divide-slate-100">
          {list.map((t) => (
            <li key={t.id}>
              <label className="flex cursor-pointer items-start gap-3 px-4 py-2.5 hover:bg-slate-50">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={picked.includes(t.id)}
                  onChange={() => toggle(t.id)}
                />
                <span className="text-sm">
                  <span className="font-semibold text-slate-800">{t.programName}</span>
                  <span className="block text-xs text-slate-500">
                    {t.semesters} semesters · {t.courseCount} courses · {t.departmentName}
                  </span>
                </span>
              </label>
            </li>
          ))}
        </ul>
      </section>
    );
  };

  return (
    <div className="space-y-4">
      <p className="border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
        Pick the degree programs your college offers. Departments, programs and
        semester-wise courses are created for you. These are typical subject
        lists, not any university&apos;s official syllabus, so edit or delete
        anything afterwards. Running it again never duplicates or overwrites.
      </p>

      {error && <p className="border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}
      {message && <p className="border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-800">{message}</p>}

      {group("UG", "Undergraduate (UG)")}
      {group("PG", "Postgraduate (PG)")}

      <button
        type="button"
        disabled={busy || picked.length === 0}
        onClick={apply}
        className="bg-[#193f88] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
      >
        {busy ? "Creating..." : `Create structure (${picked.length} selected)`}
      </button>
    </div>
  );
}
