"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Phone, Pencil, RefreshCw, X } from "lucide-react";
import { apiRequest } from "../../lib/api";

export type Enquiry = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  interest: string | null;
  source: string | null;
  note: string | null;
  status: string;
  followUpOn: string | null;
  createdAt: string;
};

type Form = {
  name: string;
  phone: string;
  email: string;
  interest: string;
  source: string;
  note: string;
  status: string;
  followUpOn: string;
};

const EMPTY: Form = {
  name: "",
  phone: "",
  email: "",
  interest: "",
  source: "",
  note: "",
  status: "NEW",
  followUpOn: "",
};

export const ENQUIRY_LABELS: Record<string, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  JOINED: "Joined",
  LOST: "Lost",
};

const inputClass =
  "mt-1 h-9 w-full border border-slate-300 px-3 text-sm font-normal outline-none focus:border-blue-600";

export default function EnquiryManagement() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Form>(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState("ALL");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    setLoading(true);

    try {
      setEnquiries(await apiRequest<Enquiry[]>("/coaching/enquiries"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load enquiries.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  function reset() {
    setEditingId(null);
    setForm(EMPTY);
  }

  function startEdit(item: Enquiry) {
    setEditingId(item.id);
    setError("");
    setSuccess("");
    setForm({
      name: item.name,
      phone: item.phone,
      email: item.email ?? "",
      interest: item.interest ?? "",
      source: item.source ?? "",
      note: item.note ?? "",
      status: item.status,
      followUpOn: item.followUpOn ? item.followUpOn.slice(0, 10) : "",
    });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    setSaving(true);
    setError("");
    setSuccess("");

    const body = {
      name: form.name,
      phone: form.phone,
      email: form.email,
      interest: form.interest,
      source: form.source,
      note: form.note,
      followUpOn: form.followUpOn || null,
    };

    try {
      if (editingId) {
        await apiRequest(`/coaching/enquiries/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify({ ...body, status: form.status }),
        });
        setSuccess("Enquiry updated.");
      } else {
        await apiRequest("/coaching/enquiries", {
          method: "POST",
          body: JSON.stringify(body),
        });
        setSuccess("Enquiry added.");
      }

      reset();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save enquiry.");
    } finally {
      setSaving(false);
    }
  }

  async function setStatus(item: Enquiry, status: string) {
    setError("");

    try {
      await apiRequest(`/coaching/enquiries/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update status.");
    }
  }

  const visible =
    filter === "ALL" ? enquiries : enquiries.filter((item) => item.status === filter);

  return (
    <div className="space-y-5">
      <form onSubmit={submit} className="border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Phone size={16} />
            {editingId ? "Edit enquiry" : "New enquiry"}
          </h3>
          {editingId && (
            <button
              type="button"
              onClick={reset}
              className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              <X size={14} />
              Cancel
            </button>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-semibold text-slate-600">
            Name *
            <input
              required
              maxLength={120}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputClass}
            />
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Phone *
            <input
              required
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className={inputClass}
            />
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Email
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={inputClass}
            />
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Interested in
            <input
              maxLength={160}
              value={form.interest}
              onChange={(e) => setForm({ ...form, interest: e.target.value })}
              placeholder="Course or batch"
              className={inputClass}
            />
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Source
            <input
              maxLength={60}
              value={form.source}
              onChange={(e) => setForm({ ...form, source: e.target.value })}
              placeholder="Walk-in, call, referral..."
              className={inputClass}
            />
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Follow-up on
            <input
              type="date"
              value={form.followUpOn}
              onChange={(e) => setForm({ ...form, followUpOn: e.target.value })}
              className={inputClass}
            />
          </label>
          {editingId && (
            <label className="text-xs font-semibold text-slate-600">
              Status
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className={inputClass}
              >
                {Object.entries(ENQUIRY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="text-xs font-semibold text-slate-600 sm:col-span-2">
            Note
            <input
              maxLength={1000}
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              className={inputClass}
            />
          </label>
        </div>

        <div className="mt-4">
          <button
            type="submit"
            disabled={saving}
            className="h-9 bg-blue-800 px-4 text-xs font-semibold text-white hover:bg-blue-900 disabled:opacity-50"
          >
            {saving ? "Saving..." : editingId ? "Save changes" : "Add enquiry"}
          </button>
        </div>

        {error && (
          <p className="mt-3 border border-red-200 bg-red-50 p-2.5 text-xs text-red-800">
            {error}
          </p>
        )}
        {success && (
          <p className="mt-3 border border-emerald-200 bg-emerald-50 p-2.5 text-xs text-emerald-800">
            {success}
          </p>
        )}
      </form>

      <section className="border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-3">
          <h3 className="text-sm font-bold text-slate-900">
            Enquiries ({visible.length})
          </h3>
          <div className="flex items-center gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="h-8 border border-slate-300 bg-white px-2 text-xs"
            >
              <option value="ALL">All</option>
              {Object.entries(ENQUIRY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => void load()}
              title="Reload"
              className="flex h-8 w-8 items-center justify-center border border-slate-300 hover:bg-slate-50"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {loading && enquiries.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">Loading...</p>
        ) : visible.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">
            {enquiries.length === 0
              ? "No enquiries yet. Add the first one above."
              : "No enquiries with this status."}
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {visible.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {item.name}
                    <span className="ml-2 text-xs font-normal text-slate-500">
                      {item.phone}
                    </span>
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {item.interest ?? "No course noted"}
                    {item.followUpOn
                      ? ` · follow-up ${new Date(item.followUpOn).toLocaleDateString("en-IN")}`
                      : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={item.status}
                    onChange={(e) => void setStatus(item, e.target.value)}
                    className="h-8 border border-slate-300 bg-white px-2 text-xs font-semibold"
                  >
                    {Object.entries(ENQUIRY_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => startEdit(item)}
                    className="flex h-8 items-center gap-1 border border-slate-300 px-2.5 text-xs font-semibold hover:bg-slate-50"
                  >
                    <Pencil size={13} />
                    Edit
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
