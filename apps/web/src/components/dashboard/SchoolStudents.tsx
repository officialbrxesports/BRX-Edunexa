"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { apiRequest } from "../../lib/api";

type ClassOption = {
  id: string;
  name: string;
  sections: { id: string; name: string }[];
};

type StudentRow = {
  id: string;
  brxUid: string;
  firstName: string;
  lastName: string | null;
  email: string;
  phone: string | null;
  status: string;
  joinedAt: string;
  class: { id: string; name: string } | null;
  section: { id: string; name: string } | null;
  parents: {
    relation: string;
    isPrimary: boolean;
    name: string;
    phone: string | null;
    email: string;
  }[];
};

const selectClass =
  "h-9 border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-600";

export default function SchoolStudents() {
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<StudentRow | null>(null);

  useEffect(() => {
    apiRequest<ClassOption[]>("/students/classes")
      .then(setClasses)
      .catch(() => setClasses([]));
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setQuery(search.trim()), 300);

    return () => window.clearTimeout(timer);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    const params = new URLSearchParams();

    if (classId) params.set("classId", classId);
    if (sectionId) params.set("sectionId", sectionId);
    if (query) params.set("q", query);

    try {
      setStudents(await apiRequest<StudentRow[]>(`/students/enrolled?${params}`));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load students.");
    } finally {
      setLoading(false);
    }
  }, [classId, sectionId, query]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);

    return () => window.clearTimeout(timer);
  }, [load]);

  const sections = useMemo(
    () => classes.find((item) => item.id === classId)?.sections ?? [],
    [classes, classId],
  );

  return (
    <section className="border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-end gap-3 border-b border-slate-100 p-4">
        <label className="min-w-48 flex-1 text-xs font-semibold text-slate-500">
          Search
          <span className="mt-1 flex h-9 items-center gap-2 border border-slate-300 px-3 focus-within:border-blue-600">
            <Search size={15} className="text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Name, email or BRX ID"
              className="h-full w-full text-sm font-normal text-slate-800 outline-none"
            />
          </span>
        </label>
        <label className="text-xs font-semibold text-slate-500">
          Class
          <select
            value={classId}
            onChange={(event) => {
              setClassId(event.target.value);
              setSectionId("");
            }}
            className={`${selectClass} mt-1 block`}
          >
            <option value="">All classes</option>
            {classes.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold text-slate-500">
          Section
          <select
            value={sectionId}
            onChange={(event) => setSectionId(event.target.value)}
            disabled={!classId}
            className={`${selectClass} mt-1 block disabled:bg-slate-50`}
          >
            <option value="">All sections</option>
            {sections.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <p className="pb-2 text-xs text-slate-500">
          {loading ? "Loading..." : `${students.length} student${students.length === 1 ? "" : "s"}`}
        </p>
      </div>

      {error && <p className="p-4 text-sm text-red-700">{error}</p>}

      {!error && !loading && students.length === 0 ? (
        <p className="p-6 text-sm text-slate-500">
          No students found. Students appear here after an admission is approved
          and the student is enrolled.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-170 text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2.5">Student</th>
                <th className="px-4 py-2.5">BRX ID</th>
                <th className="px-4 py-2.5">Class</th>
                <th className="px-4 py-2.5">Parent / guardian</th>
                <th className="px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map((student) => (
                <tr
                  key={student.id}
                  onClick={() => setSelected(student)}
                  className="cursor-pointer hover:bg-blue-50"
                >
                  <td className="px-4 py-2.5">
                    <p className="font-semibold text-slate-900">
                      {student.firstName} {student.lastName ?? ""}
                    </p>
                    <p className="text-xs text-slate-500">{student.email}</p>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-slate-600">{student.brxUid}</td>
                  <td className="px-4 py-2.5">
                    {student.class
                      ? `${student.class.name}${student.section ? ` - ${student.section.name}` : ""}`
                      : "-"}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-slate-600">
                    {student.parents[0]
                      ? `${student.parents[0].name}${student.parents[0].phone ? ` · ${student.parents[0].phone}` : ""}`
                      : "Not linked"}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`px-2 py-1 text-xs font-medium ${
                        student.status === "ACTIVE"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {student.status === "ACTIVE" ? "Active" : student.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-40 flex justify-end bg-slate-900/40">
          <aside className="h-full w-full max-w-md overflow-y-auto bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {selected.firstName} {selected.lastName ?? ""}
                </h2>
                <p className="text-xs text-slate-500">{selected.brxUid}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                aria-label="Close"
                className="p-1.5 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <dl className="grid grid-cols-[110px_1fr] gap-y-2 text-sm">
              <dt className="text-slate-500">Class</dt>
              <dd>
                {selected.class
                  ? `${selected.class.name}${selected.section ? ` - ${selected.section.name}` : ""}`
                  : "Not enrolled"}
              </dd>
              <dt className="text-slate-500">Email</dt>
              <dd className="break-all">{selected.email}</dd>
              <dt className="text-slate-500">Phone</dt>
              <dd>{selected.phone || "-"}</dd>
              <dt className="text-slate-500">Status</dt>
              <dd>{selected.status}</dd>
              <dt className="text-slate-500">Joined</dt>
              <dd>{new Date(selected.joinedAt).toLocaleDateString("en-IN")}</dd>
            </dl>

            <h3 className="mt-6 text-sm font-bold text-slate-900">Parents / guardians</h3>
            {selected.parents.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">
                No parent is linked yet. Link one from the Parents section.
              </p>
            ) : (
              <ul className="mt-2 divide-y divide-slate-100 border border-slate-200">
                {selected.parents.map((parent, index) => (
                  <li key={index} className="p-3 text-sm">
                    <p className="font-semibold text-slate-900">
                      {parent.name}{" "}
                      <span className="text-xs font-normal text-slate-500">
                        ({parent.relation.toLowerCase()}
                        {parent.isPrimary ? ", primary" : ""})
                      </span>
                    </p>
                    <p className="text-xs text-slate-600">
                      {parent.phone || "No phone"} · {parent.email}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </aside>
        </div>
      )}
    </section>
  );
}
