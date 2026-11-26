"use client";

import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "../../lib/api";
import { printHtml } from "../../lib/admissionPrint";

type ClassOption = {
  id: string;
  name: string;
  sections: { id: string; name: string }[];
};

type Summary = {
  totals: {
    billed: number;
    collected: number;
    due: number;
    overdueCount: number;
    studentsWithDues: number;
  };
  classes: { className: string; billed: number; collected: number; due: number }[];
};

type FeeRow = {
  id: string;
  name: string;
  brxUid: string;
  className: string;
  sectionName: string;
  total: number;
  paid: number;
  due: number;
  dueDate: string;
  status: "PAID" | "PARTIAL" | "OVERDUE" | "PENDING";
};

const STATUS_STYLE: Record<FeeRow["status"], string> = {
  PAID: "bg-emerald-50 text-emerald-700",
  PARTIAL: "bg-amber-50 text-amber-700",
  OVERDUE: "bg-red-50 text-red-700",
  PENDING: "bg-slate-100 text-slate-700",
};

const inr = (value: number) =>
  `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

type PaymentList = {
  institution: string;
  fee: FeeRow;
  payments: {
    id: string;
    amount: number;
    method: string;
    date: string;
    transactionId: string | null;
    note: string | null;
  }[];
};

const esc = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function printReceipt(
  data: PaymentList,
  payment: PaymentList["payments"][number],
) {
  const fee = data.fee;

  printHtml(`<!doctype html><html><head><meta charset="utf-8"><title>Fee receipt</title>
<style>body{font-family:Arial,sans-serif;margin:32px;color:#0f172a}h1{font-size:20px;margin:0}
.box{border:1px solid #334155;padding:20px;max-width:520px}table{width:100%;border-collapse:collapse;margin-top:14px;font-size:14px}
td{padding:6px 0;border-bottom:1px solid #e2e8f0}td:first-child{color:#475569;width:40%}
.amt{font-size:22px;font-weight:bold;margin-top:14px}</style></head><body><div class="box">
<h1>${esc(data.institution)}</h1><p style="margin:4px 0 0;color:#475569">Fee receipt</p>
<table>
<tr><td>Student</td><td>${esc(fee.name)} (${esc(fee.brxUid)})</td></tr>
<tr><td>Class</td><td>${esc(fee.className)} ${esc(fee.sectionName)}</td></tr>
<tr><td>Date</td><td>${new Date(payment.date).toLocaleDateString()}</td></tr>
<tr><td>Method</td><td>${esc(payment.method.replace("_", " "))}</td></tr>
${payment.transactionId ? `<tr><td>Transaction ID</td><td>${esc(payment.transactionId)}</td></tr>` : ""}
<tr><td>Fee total</td><td>${inr(fee.total)}</td></tr>
<tr><td>Total paid so far</td><td>${inr(fee.paid)}</td></tr>
<tr><td>Balance due</td><td>${inr(fee.due)}</td></tr>
</table>
<p class="amt">Received: ${inr(payment.amount)}</p>
<p style="margin-top:28px;font-size:12px;color:#64748b">Receipt no. ${esc(payment.id.slice(0, 8).toUpperCase())}</p>
</div></body></html>`);
}

function History({ id }: { id: string }) {
  const [data, setData] = useState<PaymentList | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiRequest<PaymentList>(`/fees/${id}/payments`)
      .then(setData)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Could not load payments."),
      );
  }, [id]);

  if (error) return <p className="text-xs text-red-600">{error}</p>;
  if (!data) return <p className="text-xs text-slate-500">Loading…</p>;
  if (data.payments.length === 0) {
    return <p className="text-xs text-slate-500">No payment received yet.</p>;
  }

  return (
    <ul className="divide-y divide-slate-100 text-xs">
      {data.payments.map((item) => (
        <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 py-1.5">
          <span>
            {new Date(item.date).toLocaleDateString()} · {inr(item.amount)} ·{" "}
            {item.method.replace("_", " ").toLowerCase()}
            {item.transactionId ? ` · ${item.transactionId}` : ""}
          </span>
          <button
            type="button"
            onClick={() => printReceipt(data, item)}
            className="font-semibold text-blue-800"
          >
            Print receipt
          </button>
        </li>
      ))}
    </ul>
  );
}

const field = "border border-slate-300 px-3 py-2 text-sm";

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-red-600">{hint}</p>}
    </div>
  );
}

function AssignForm({
  classes,
  onDone,
}: {
  classes: ClassOption[];
  onDone: () => void;
}) {
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  const sections = classes.find((item) => item.id === classId)?.sections ?? [];

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setDone("");

    try {
      const result = await apiRequest<{ created: number }>("/fees/assign", {
        method: "POST",
        body: JSON.stringify({
          classId,
          sectionId: sectionId || null,
          amount: Number(amount),
          dueDate,
        }),
      });

      setDone(`Fee added for ${result.created} students.`);
      setAmount("");
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add the fee.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-bold text-slate-900">Add a fee for a class</h3>
      <p className="mt-1 text-xs text-slate-500">
        Every active student of the class (or section) gets this amount as a due.
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <select
          value={classId}
          onChange={(e) => {
            setClassId(e.target.value);
            setSectionId("");
          }}
          required
          className={field}
        >
          <option value="">Choose class</option>
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
        <input
          type="number"
          min="1"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount (₹)"
          required
          className={field}
        />
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          required
          className={field}
        />
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {done && <p className="mt-2 text-sm text-emerald-700">{done}</p>}
      <button
        type="submit"
        disabled={busy}
        className="mt-3 h-9 bg-blue-800 px-4 text-xs font-semibold text-white hover:bg-blue-900 disabled:opacity-60"
      >
        {busy ? "Saving…" : "Add fee"}
      </button>
    </form>
  );
}

function PayRow({ row, onDone }: { row: FeeRow; onDone: () => void }) {
  const [amount, setAmount] = useState(String(row.due));
  const [method, setMethod] = useState("CASH");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      await apiRequest(`/fees/${row.id}/pay`, {
        method: "POST",
        body: JSON.stringify({ amount: Number(amount), method }),
      });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the payment.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-center gap-2">
      <input
        type="number"
        min="0.01"
        step="0.01"
        max={row.due}
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className={`${field} w-24 py-1`}
      />
      <select value={method} onChange={(e) => setMethod(e.target.value)} className={`${field} py-1`}>
        <option value="CASH">Cash</option>
        <option value="UPI">UPI</option>
        <option value="CARD">Card</option>
        <option value="BANK_TRANSFER">Bank</option>
        <option value="OTHER">Other</option>
      </select>
      <button
        type="submit"
        disabled={busy}
        className="h-8 bg-emerald-700 px-3 text-xs font-semibold text-white disabled:opacity-60"
      >
        {busy ? "…" : "Received"}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </form>
  );
}

export default function SchoolFees({ viewOnly = false }: { viewOnly?: boolean }) {
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [rows, setRows] = useState<FeeRow[] | null>(null);
  const [classId, setClassId] = useState("");
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [history, setHistory] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const query = new URLSearchParams();

    if (classId) query.set("classId", classId);
    if (status) query.set("status", status);
    if (q.trim()) query.set("q", q.trim());

    try {
      const [s, list] = await Promise.all([
        apiRequest<Summary>("/fees/summary"),
        apiRequest<FeeRow[]>(`/fees?${query.toString()}`),
      ]);

      setSummary(s);
      setRows(list);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load fees.");
    }
  }, [classId, status, q]);

  useEffect(() => {
    apiRequest<ClassOption[]>("/students/classes")
      .then(setClasses)
      .catch(() => setClasses([]));
  }, []);

  useEffect(() => {
    const timer = setTimeout(load, 250);

    return () => clearTimeout(timer);
  }, [load]);

  async function remove(id: string) {
    try {
      await apiRequest(`/fees/${id}/delete`, { method: "POST" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete.");
    }
  }

  return (
    <div className="grid gap-5">
      {error && (
        <p className="border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>
      )}

      {!viewOnly && <AssignForm classes={classes} onDone={load} />}

      {summary && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Total billed" value={inr(summary.totals.billed)} />
            <Stat label="Collected" value={inr(summary.totals.collected)} />
            <Stat
              label="Pending"
              value={inr(summary.totals.due)}
              hint={
                summary.totals.overdueCount > 0
                  ? `${summary.totals.overdueCount} overdue`
                  : undefined
              }
            />
            <Stat
              label="Students with dues"
              value={String(summary.totals.studentsWithDues)}
            />
          </div>

          {summary.classes.length > 0 && (
            <section className="overflow-x-auto border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs text-slate-500">
                  <tr>
                    <th className="px-4 py-2 font-semibold">Class</th>
                    <th className="px-4 py-2 font-semibold">Billed</th>
                    <th className="px-4 py-2 font-semibold">Collected</th>
                    <th className="px-4 py-2 font-semibold">Pending</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.classes.map((item) => (
                    <tr key={item.className} className="border-t border-slate-100">
                      <td className="px-4 py-2 font-semibold text-slate-900">{item.className}</td>
                      <td className="px-4 py-2">{inr(item.billed)}</td>
                      <td className="px-4 py-2">{inr(item.collected)}</td>
                      <td className="px-4 py-2">{inr(item.due)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}
        </>
      )}

      <section className="border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap gap-2 border-b border-slate-100 p-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name or ID"
            className={`${field} min-w-0 flex-1`}
          />
          <select value={classId} onChange={(e) => setClassId(e.target.value)} className={field}>
            <option value="">All classes</option>
            {classes.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={field}>
            <option value="">All status</option>
            <option value="PENDING">Pending</option>
            <option value="PARTIAL">Partial</option>
            <option value="OVERDUE">Overdue</option>
            <option value="PAID">Paid</option>
          </select>
        </div>

        {!rows ? (
          <p className="p-5 text-sm text-slate-500">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">
            {viewOnly
              ? "No fee has been added yet. Use Add → Fees to add one."
              : "No fee found."}
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {rows.map((row) => (
              <li key={row.id} className="px-4 py-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">{row.name}</p>
                    <p className="text-xs text-slate-500">
                      {row.brxUid} · {row.className} {row.sectionName} · due{" "}
                      {new Date(row.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-right text-xs text-slate-600">
                      {inr(row.paid)} / {inr(row.total)}
                    </p>
                    <span className={`px-2 py-1 text-xs font-semibold ${STATUS_STYLE[row.status]}`}>
                      {row.status.toLowerCase()}
                    </span>
                    {row.paid > 0 && (
                      <button
                        type="button"
                        onClick={() => setHistory(history === row.id ? null : row.id)}
                        className="text-xs font-semibold text-slate-700"
                      >
                        History
                      </button>
                    )}
                    {!viewOnly && (
                      <>
                        {row.due > 0 && (
                          <button
                            type="button"
                            onClick={() => setOpen(open === row.id ? null : row.id)}
                            className="text-xs font-semibold text-blue-800"
                          >
                            Payment
                          </button>
                        )}
                        {row.paid === 0 && (
                          <button
                            type="button"
                            onClick={() => remove(row.id)}
                            className="text-xs font-semibold text-red-600"
                          >
                            Delete
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
                {history === row.id && (
                  <div className="mt-3 border-t border-slate-100 pt-3">
                    <History id={row.id} />
                  </div>
                )}
                {!viewOnly && open === row.id && (
                  <div className="mt-3 border-t border-slate-100 pt-3">
                    <PayRow
                      row={row}
                      onDone={() => {
                        setOpen(null);
                        load();
                      }}
                    />
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
