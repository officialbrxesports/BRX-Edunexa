"use client";

import { FormEvent, useEffect, useState } from "react";

type ClassItem = {
  id: string;
  name: string;
  code: string;
};

type SectionItem = {
  id: string;
  name: string;
  code: string;
};

export default function ClassesPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [sections, setSections] = useState<
    Record<string, SectionItem[]>
  >({});

  const [className, setClassName] = useState("");
  const [classCode, setClassCode] = useState("");

  const [selectedClassId, setSelectedClassId] =
    useState("");

  const [sectionName, setSectionName] = useState("");
  const [sectionCode, setSectionCode] = useState("");

  const [loading, setLoading] = useState(true);
  const [creatingClass, setCreatingClass] =
    useState(false);
  const [creatingSection, setCreatingSection] =
    useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const getToken = () =>
    localStorage.getItem("brx_access_token");

  const loadClasses = async () => {
    try {
      const token = getToken();

      if (!token) {
        window.location.href = "/login";
        return;
      }

      const response = await fetch(
        "/api/academics/classes",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load classes",
        );
      }

      setClasses(Array.isArray(data) ? data : []);

      for (const item of data) {
        await loadSections(item.id);
      }
    } catch (error) {
      console.warn(error);
      setError("Failed to load classes");
    } finally {
      setLoading(false);
    }
  };

  const loadSections = async (classId: string) => {
    try {
      const token = getToken();

      const response = await fetch(
        `/api/academics/classes/${classId}/sections`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load sections",
        );
      }

      setSections((current) => ({
        ...current,
        [classId]: Array.isArray(data) ? data : [],
      }));
    } catch (error) {
      console.warn(error);
    }
  };

  useEffect(() => {
    loadClasses();
  }, []);

  const createClass = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setCreatingClass(true);
    setError("");
    setMessage("");

    try {
      const token = getToken();

      if (!token) {
        window.location.href = "/login";
        return;
      }

      const response = await fetch(
        "/api/academics/classes",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: className,
            code: classCode,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          Array.isArray(data.message)
            ? data.message.join(", ")
            : data.message ||
                "Failed to create class",
        );
      }

      setMessage("Class created successfully.");
      setClassName("");
      setClassCode("");

      await loadClasses();
    } catch (error) {
      console.warn(error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to create class",
      );
    } finally {
      setCreatingClass(false);
    }
  };

  const createSection = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!selectedClassId) {
      setError("Please select a class.");
      return;
    }

    setCreatingSection(true);
    setError("");
    setMessage("");

    try {
      const token = getToken();

      if (!token) {
        window.location.href = "/login";
        return;
      }

      const response = await fetch(
        `/api/academics/classes/${selectedClassId}/sections`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: sectionName,
            code: sectionCode,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          Array.isArray(data.message)
            ? data.message.join(", ")
            : data.message ||
                "Failed to create section",
        );
      }

      setMessage("Section created successfully.");
      setSectionName("");
      setSectionCode("");

      await loadSections(selectedClassId);
    } catch (error) {
      console.warn(error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to create section",
      );
    } finally {
      setCreatingSection(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Class Management
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              BRX EduNexa • Classes & Sections
            </p>
          </div>

          <a
            href="/dashboard"
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Dashboard
          </a>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Create forms */}
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">
              Create Class
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Add a new class to your institution.
            </p>

            <form
              onSubmit={createClass}
              className="mt-6 space-y-4"
            >
              <input
                required
                value={className}
                onChange={(event) =>
                  setClassName(event.target.value)
                }
                placeholder="Class 11"
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
              />

              <input
                required
                value={classCode}
                onChange={(event) =>
                  setClassCode(event.target.value)
                }
                placeholder="11"
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
              />

              <button
                type="submit"
                disabled={creatingClass}
                className="w-full rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white disabled:opacity-50"
              >
                {creatingClass
                  ? "Creating..."
                  : "Create Class"}
              </button>
            </form>
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">
              Create Section
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Add a section inside a class.
            </p>

            <form
              onSubmit={createSection}
              className="mt-6 space-y-4"
            >
              <select
                required
                value={selectedClassId}
                onChange={(event) =>
                  setSelectedClassId(
                    event.target.value,
                  )
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
              >
                <option value="">
                  Select class
                </option>

                {classes.map((item) => (
                  <option
                    key={item.id}
                    value={item.id}
                  >
                    {item.name} ({item.code})
                  </option>
                ))}
              </select>

              <input
                required
                value={sectionName}
                onChange={(event) =>
                  setSectionName(event.target.value)
                }
                placeholder="Section A"
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
              />

              <input
                required
                value={sectionCode}
                onChange={(event) =>
                  setSectionCode(event.target.value)
                }
                placeholder="A"
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
              />

              <button
                type="submit"
                disabled={creatingSection}
                className="w-full rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white disabled:opacity-50"
              >
                {creatingSection
                  ? "Creating..."
                  : "Create Section"}
              </button>
            </form>
          </section>
        </div>

        {error && (
          <div className="mt-6 rounded-2xl bg-red-50 p-4 text-red-600">
            {error}
          </div>
        )}

        {message && (
          <div className="mt-6 rounded-2xl bg-green-50 p-4 text-green-700">
            {message}
          </div>
        )}

        {/* Class list */}
        <section className="mt-8">
          <h2 className="mb-4 text-xl font-bold text-slate-900">
            Classes
          </h2>

          {loading ? (
            <div className="rounded-3xl bg-white p-10 text-center text-slate-500">
              Loading classes...
            </div>
          ) : classes.length === 0 ? (
            <div className="rounded-3xl bg-white p-10 text-center">
              No classes found.
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {classes.map((item) => (
                <div
                  key={item.id}
                  className="rounded-3xl bg-white p-6 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
                      🏫
                    </div>

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                      {item.code}
                    </span>
                  </div>

                  <h3 className="mt-5 text-xl font-bold text-slate-900">
                    {item.name}
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Sections
                  </p>

                  <div className="mt-4 space-y-2">
                    {(sections[item.id] || []).length ===
                    0 ? (
                      <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-500">
                        No sections yet.
                      </p>
                    ) : (
                      (sections[item.id] || []).map(
                        (section) => (
                          <div
                            key={section.id}
                            className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3"
                          >
                            <span className="font-medium text-slate-700">
                              {section.name}
                            </span>

                            <span className="text-xs font-bold text-slate-400">
                              {section.code}
                            </span>
                          </div>
                        ),
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}