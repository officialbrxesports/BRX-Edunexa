"use client";

import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "../../lib/api";

type Inbox = {
  unread: number;
  items: {
    id: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
    from: string | null;
  }[];
};

export default function NoticeInbox() {
  const [data, setData] = useState<Inbox | null>(null);
  const [error, setError] = useState("");
  const [emailOn, setEmailOn] = useState<boolean | null>(null);

  const load = useCallback(async () => {
    try {
      setData(await apiRequest<Inbox>("/inbox"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load notices.");
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);

    return () => window.clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    apiRequest<{ enabled: boolean }>("/inbox/email-pref")
      .then((pref) => setEmailOn(pref.enabled))
      .catch(() => setEmailOn(null));
  }, []);

  async function toggleEmail(enabled: boolean) {
    setEmailOn(enabled);

    try {
      await apiRequest("/inbox/email-pref", {
        method: "POST",
        body: JSON.stringify({ enabled }),
      });
    } catch {
      setEmailOn(!enabled);
    }
  }

  async function markAllRead() {
    try {
      await apiRequest("/inbox/read", { method: "POST", body: JSON.stringify({}) });
      await load();
    } catch {
      /* ignore */
    }
  }

  return (
    <section className="border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <h3 className="text-sm font-bold text-slate-900">
          Notices{data && data.unread > 0 ? ` (${data.unread} new)` : ""}
        </h3>
        {data && data.unread > 0 && (
          <button
            type="button"
            onClick={() => void markAllRead()}
            className="text-xs font-semibold text-blue-700 hover:underline"
          >
            Mark all as read
          </button>
        )}
      </div>
      {emailOn !== null && (
        <label className="flex items-center gap-2 border-b border-slate-100 px-4 py-2 text-xs text-slate-600">
          <input
            type="checkbox"
            checked={emailOn}
            onChange={(e) => void toggleEmail(e.target.checked)}
          />
          Also send me notes and notices by email
        </label>
      )}
      {error && <p className="p-4 text-sm text-red-700">{error}</p>}
      {data && data.items.length === 0 && (
        <p className="p-4 text-sm text-slate-500">No notice for you yet.</p>
      )}
      {data && data.items.length > 0 && (
        <ul className="max-h-96 divide-y divide-slate-100 overflow-y-auto">
          {data.items.map((item) => (
            <li key={item.id} className={`px-4 py-3 text-sm ${item.isRead ? "" : "bg-blue-50/60"}`}>
              <p className="font-semibold text-slate-900">{item.title}</p>
              <p className="text-xs text-slate-500">
                {new Date(item.createdAt).toLocaleDateString("en-IN")}
                {item.from ? ` · ${item.from}` : ""}
              </p>
              <p className="mt-1 whitespace-pre-wrap text-slate-700">{item.message}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
