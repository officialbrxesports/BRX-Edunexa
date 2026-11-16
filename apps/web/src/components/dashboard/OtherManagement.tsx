"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { apiRequest } from "../../lib/api";

export type OtherGroup = {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  members: { id: string; name: string; brxUid: string; role: string }[];
};

export type OtherNotice = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  groupName: string | null;
};

type PersonOption = { id: string; name: string; brxUid: string; role: string };

const ROLE_LABEL: Record<string, string> = {
  STUDENT: "Member",
  TEACHER: "Teacher",
  STAFF: "Staff",
  PARENT: "Parent / Guardian",
  GUARD: "Security Guard",
};

const inputClass =
  "mt-1 h-9 w-full border border-slate-300 px-3 text-sm font-normal outline-none focus:border-blue-600";
const buttonClass =
  "h-9 bg-blue-800 px-4 text-xs font-semibold text-white hover:bg-blue-900 disabled:opacity-50";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="text-xs font-semibold text-slate-600">
      {label}
      {children}
    </label>
  );
}

function Messages({ error, success }: { error: string; success: string }) {
  return (
    <>
      {error && (
        <p role="alert" className="border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </p>
      )}
      {success && (
        <p role="status" className="border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          {success}
        </p>
      )}
    </>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
}

/* -------------------------------- groups -------------------------------- */

export function OtherGroups() {
  const [groups, setGroups] = useState<OtherGroup[]>([]);
  const [people, setPeople] = useState<PersonOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [pick, setPick] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const [groupData, options] = await Promise.all([
        apiRequest<OtherGroup[]>("/other/groups"),
        apiRequest<{ people: PersonOption[] }>("/other/people-options"),
      ]);
      setGroups(groupData);
      setPeople(options.people);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load groups.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function run(action: () => Promise<unknown>, message: string) {
    setError("");
    setSuccess("");

    try {
      await action();
      setSuccess(message);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  async function createGroup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    await run(
      () =>
        apiRequest("/other/groups", {
          method: "POST",
          body: JSON.stringify({ name, description }),
        }),
      "Group created.",
    );
    setName("");
    setDescription("");
    setSaving(false);
  }

  return (
    <div className="space-y-4">
      <form onSubmit={createGroup} className="grid gap-3 border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2">
        <Field label="Group name">
          <input
            className={inputClass}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Morning Batch, Library Team"
            maxLength={120}
            required
          />
        </Field>
        <Field label="Description (optional)">
          <input
            className={inputClass}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={500}
          />
        </Field>
        <div className="sm:col-span-2">
          <button type="submit" disabled={saving} className={buttonClass}>
            {saving ? "Saving..." : "Create group"}
          </button>
        </div>
      </form>

      <Messages error={error} success={success} />

      {loading ? (
        <p className="text-sm text-slate-500">Loading...</p>
      ) : groups.length === 0 ? (
        <p className="border border-slate-200 bg-white p-5 text-sm text-slate-500">
          No group yet. Create the first one above.
        </p>
      ) : (
        groups.map((group) => {
          const inGroup = new Set(group.members.map((member) => member.id));
          const options = people.filter((person) => !inGroup.has(person.id));

          return (
            <section key={group.id} className="border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    {group.name}{" "}
                    {!group.isActive && (
                      <span className="ml-1 bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                        INACTIVE
                      </span>
                    )}
                  </h2>
                  {group.description && (
                    <p className="text-xs text-slate-500">{group.description}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    run(
                      () =>
                        apiRequest(`/other/groups/${group.id}`, {
                          method: "PATCH",
                          body: JSON.stringify({ isActive: !group.isActive }),
                        }),
                      group.isActive ? "Group deactivated." : "Group activated.",
                    )
                  }
                  className="text-xs font-semibold text-blue-800 underline"
                >
                  {group.isActive ? "Deactivate" : "Activate"}
                </button>
              </div>

              <div className="flex flex-wrap items-end gap-2 border-b border-slate-100 px-4 py-3">
                <label className="min-w-0 flex-1 text-xs font-semibold text-slate-600">
                  Add a person
                  <select
                    className={inputClass}
                    value={pick[group.id] ?? ""}
                    onChange={(event) =>
                      setPick({ ...pick, [group.id]: event.target.value })
                    }
                  >
                    <option value="">Choose...</option>
                    {options.map((person) => (
                      <option key={person.id} value={person.id}>
                        {person.name} · {ROLE_LABEL[person.role] ?? person.role} · {person.brxUid}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  disabled={!pick[group.id]}
                  onClick={() =>
                    run(async () => {
                      await apiRequest(`/other/groups/${group.id}/members`, {
                        method: "POST",
                        body: JSON.stringify({ userId: pick[group.id] }),
                      });
                      setPick({ ...pick, [group.id]: "" });
                    }, "Person added.")
                  }
                  className={buttonClass}
                >
                  Add
                </button>
              </div>

              {group.members.length === 0 ? (
                <p className="p-4 text-sm text-slate-500">No members yet.</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {group.members.map((member) => (
                    <li
                      key={member.id}
                      className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm"
                    >
                      <span>
                        <span className="font-semibold text-slate-900">{member.name}</span>{" "}
                        <span className="text-xs text-slate-500">
                          {ROLE_LABEL[member.role] ?? member.role} · {member.brxUid}
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          run(
                            () =>
                              apiRequest(
                                `/other/groups/${group.id}/members/${member.id}`,
                                { method: "DELETE" },
                              ),
                            "Person removed.",
                          )
                        }
                        className="text-xs font-semibold text-red-700 underline"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })
      )}
    </div>
  );
}

/* -------------------------------- notices -------------------------------- */

export function OtherNotices() {
  const [notices, setNotices] = useState<OtherNotice[]>([]);
  const [groups, setGroups] = useState<OtherGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [groupId, setGroupId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const [noticeData, groupData] = await Promise.all([
        apiRequest<OtherNotice[]>("/other/notices"),
        apiRequest<OtherGroup[]>("/other/groups"),
      ]);
      setNotices(noticeData);
      setGroups(groupData.filter((group) => group.isActive));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load notices.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function post(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await apiRequest("/other/notices", {
        method: "POST",
        body: JSON.stringify({ title, body, groupId: groupId || null }),
      });
      setSuccess("Notice posted.");
      setTitle("");
      setBody("");
      setGroupId("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not post the notice.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this notice?")) return;
    setError("");
    setSuccess("");

    try {
      await apiRequest(`/other/notices/${id}`, { method: "DELETE" });
      setSuccess("Notice deleted.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the notice.");
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={post} className="grid gap-3 border border-slate-200 bg-white p-4 shadow-sm">
        <Field label="Title">
          <input
            className={inputClass}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={160}
            required
          />
        </Field>
        <label className="text-xs font-semibold text-slate-600">
          Message
          <textarea
            className="mt-1 min-h-24 w-full border border-slate-300 p-3 text-sm font-normal outline-none focus:border-blue-600"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            maxLength={2000}
            required
          />
        </label>
        <Field label="Send to">
          <select
            className={inputClass}
            value={groupId}
            onChange={(event) => setGroupId(event.target.value)}
          >
            <option value="">Everyone in the organisation</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                Only group: {group.name}
              </option>
            ))}
          </select>
        </Field>
        <div>
          <button type="submit" disabled={saving} className={buttonClass}>
            {saving ? "Posting..." : "Post notice"}
          </button>
        </div>
      </form>

      <Messages error={error} success={success} />

      {loading ? (
        <p className="text-sm text-slate-500">Loading...</p>
      ) : notices.length === 0 ? (
        <p className="border border-slate-200 bg-white p-5 text-sm text-slate-500">
          No notice posted yet.
        </p>
      ) : (
        <ul className="divide-y divide-slate-100 border border-slate-200 bg-white shadow-sm">
          {notices.map((notice) => (
            <li key={notice.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-900">{notice.title}</p>
                  <p className="text-xs text-slate-500">
                    {formatDate(notice.createdAt)} ·{" "}
                    {notice.groupName ? `Group: ${notice.groupName}` : "Everyone"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void remove(notice.id)}
                  className="text-xs font-semibold text-red-700 underline"
                >
                  Delete
                </button>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{notice.body}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
