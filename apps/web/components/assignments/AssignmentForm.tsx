"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

type User = {
  id: string;
  firstName: string;
  lastName?: string | null;
  email: string;
  role: string;
  status?: string;
};

type AcademicClass = {
  id: string;
  name: string;
  code: string;
};

type Section = {
  id: string;
  name: string;
  code: string;
};

type Assignment = {
  id: string;
  title: string;
  description?: string | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  dueDate?: string | null;
  teacher?: User | null;
  class?: AcademicClass | null;
  section?: Section | null;
  student?: User | null;
};

type Props = {
  mode?: "create" | "edit";
  assignment?: Assignment | null;
  onSuccess?: (assignment: Assignment) => void;
};

function getToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("brx_access_token") || "";
}

async function api<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const text = await response.text();

  let data: any = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    throw new Error(
      data?.message ||
        data?.error ||
        `Request failed with status ${response.status}`,
    );
  }

  return data as T;
}

export default function AssignmentForm({
  mode = "create",
  assignment,
  onSuccess,
}: Props) {
  const router = useRouter();

  const [title, setTitle] = useState(assignment?.title || "");
  const [description, setDescription] = useState(
    assignment?.description || "",
  );

  const [teacherId, setTeacherId] = useState(
    assignment?.teacher?.id || "",
  );

  const [classId, setClassId] = useState(
    assignment?.class?.id || "",
  );

  const [sectionId, setSectionId] = useState(
    assignment?.section?.id || "",
  );

  const [studentId, setStudentId] = useState(
    assignment?.student?.id || "",
  );

  const [dueDate, setDueDate] = useState(
    assignment?.dueDate
      ? new Date(assignment.dueDate).toISOString().slice(0, 16)
      : "",
  );

  const [status, setStatus] = useState<
    "DRAFT" | "PUBLISHED"
  >(assignment?.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT");

  const [teachers, setTeachers] = useState<User[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [classes, setClasses] = useState<AcademicClass[]>([]);
  const [sections, setSections] = useState<Section[]>([]);

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingSections, setLoadingSections] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const selectedClass = useMemo(
    () => classes.find((item) => item.id === classId),
    [classes, classId],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadInitialData() {
      setLoadingInitial(true);
      setError("");

      try {
        const [usersResponse, classesResponse] = await Promise.all([
          api<User[]>("/users"),
          api<AcademicClass[]>("/academics/classes"),
        ]);

        if (cancelled) return;

        const institutionUsers = Array.isArray(usersResponse)
          ? usersResponse
          : [];

        setTeachers(
          institutionUsers.filter(
            (user) =>
              user.role === "TEACHER" &&
              user.status !== "DELETED",
          ),
        );

        setStudents(
          institutionUsers.filter(
            (user) =>
              user.role === "STUDENT" &&
              user.status !== "DELETED",
          ),
        );

        setClasses(
          Array.isArray(classesResponse)
            ? classesResponse
            : [],
        );
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load assignment data.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingInitial(false);
        }
      }
    }

    loadInitialData();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!classId) {
      setSections([]);
      setSectionId("");
      return;
    }

    let cancelled = false;

    async function loadSections() {
      setLoadingSections(true);

      try {
        const data = await api<Section[]>(
          `/academics/classes/${classId}/sections`,
        );

        if (!cancelled) {
          setSections(Array.isArray(data) ? data : []);

          if (
            assignment?.section?.id &&
            assignment.section.id === sectionId
          ) {
            return;
          }

          if (
            sectionId &&
            !data.some((section) => section.id === sectionId)
          ) {
            setSectionId("");
          }
        }
      } catch (err) {
        if (!cancelled) {
          setSections([]);
          setSectionId("");
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load sections.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingSections(false);
        }
      }
    }

    loadSections();

    return () => {
      cancelled = true;
    };
  }, [classId]);

  function resetMessages() {
    setError("");
    setSuccess("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    resetMessages();

    if (!title.trim()) {
      setError("Assignment title is required.");
      return;
    }

    if (!teacherId) {
      setError("Please select a teacher.");
      return;
    }

    if (sectionId && !classId) {
      setError("Please select a class before selecting a section.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        teacherId,
        classId: classId || undefined,
        sectionId: sectionId || undefined,
        studentId: studentId || undefined,
        dueDate: dueDate
          ? new Date(dueDate).toISOString()
          : undefined,
        status,
      };

      const result =
        mode === "edit" && assignment?.id
          ? await api<Assignment>(
              `/assignments/${assignment.id}`,
              {
                method: "PATCH",
                body: JSON.stringify(payload),
              },
            )
          : await api<Assignment>("/assignments", {
              method: "POST",
              body: JSON.stringify(payload),
            });

      setSuccess(
        mode === "edit"
          ? "Assignment updated successfully."
          : "Assignment created successfully.",
      );

      onSuccess?.(result);

      setTimeout(() => {
        router.push(`/assignments/${result.id}`);
        router.refresh();
      }, 500);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save assignment.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loadingInitial) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="animate-pulse space-y-5">
          <div className="h-7 w-56 rounded-xl bg-slate-200" />
          <div className="h-12 rounded-2xl bg-slate-100" />
          <div className="h-32 rounded-2xl bg-slate-100" />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="h-12 rounded-2xl bg-slate-100" />
            <div className="h-12 rounded-2xl bg-slate-100" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* HEADER */}
      <div className="overflow-hidden rounded-[28px] bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 p-6 text-white shadow-xl shadow-blue-200/50 sm:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold backdrop-blur">
              <span>📝</span>
              {mode === "edit"
                ? "EDIT ASSIGNMENT"
                : "NEW ASSIGNMENT"}
            </div>

            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
              {mode === "edit"
                ? "Update Assignment"
                : "Create Assignment"}
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">
              Create and manage academic assignments for
              teachers, classes, sections and individual students.
            </p>
          </div>

          <div className="hidden h-20 w-20 items-center justify-center rounded-3xl border border-white/20 bg-white/10 text-4xl backdrop-blur md:flex">
            📚
          </div>
        </div>
      </div>

      {/* ERROR / SUCCESS */}
      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm font-semibold text-red-700">
          <span className="text-lg">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm font-semibold text-emerald-700">
          <span className="text-lg">✓</span>
          <span>{success}</span>
        </div>
      )}

      {/* BASIC INFORMATION */}
      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="mb-6">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">
            Step 01
          </p>
          <h2 className="mt-1 text-xl font-black text-slate-900">
            Assignment details
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Add the main information students and teachers will see.
          </p>
        </div>

        <div className="space-y-5">
          <Field label="Assignment title" required>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Mathematics Chapter 5"
              maxLength={200}
              className="input"
            />
          </Field>

          <Field label="Description">
            <textarea
              value={description}
              onChange={(event) =>
                setDescription(event.target.value)
              }
              placeholder="Write instructions, topics, submission details..."
              maxLength={5000}
              rows={6}
              className="input resize-none"
            />

            <div className="mt-2 flex justify-end text-xs text-slate-400">
              {description.length}/5000
            </div>
          </Field>
        </div>
      </section>

      {/* TARGET */}
      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="mb-6">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">
            Step 02
          </p>
          <h2 className="mt-1 text-xl font-black text-slate-900">
            Assignment target
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Decide who should receive this assignment.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Teacher" required>
            <select
              value={teacherId}
              onChange={(event) =>
                setTeacherId(event.target.value)
              }
              className="input"
            >
              <option value="">Select teacher</option>

              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.firstName} {teacher.lastName || ""}
                  {" — "}
                  {teacher.email}
                </option>
              ))}
            </select>

            {teachers.length === 0 && (
              <p className="mt-2 text-xs font-semibold text-amber-600">
                No teacher accounts found.
              </p>
            )}
          </Field>

          <Field label="Class">
            <select
              value={classId}
              onChange={(event) => {
                setClassId(event.target.value);
                setSectionId("");
              }}
              className="input"
            >
              <option value="">All classes / no class</option>

              {classes.map((academicClass) => (
                <option
                  key={academicClass.id}
                  value={academicClass.id}
                >
                  {academicClass.name} ({academicClass.code})
                </option>
              ))}
            </select>

            {selectedClass && (
              <p className="mt-2 text-xs font-semibold text-blue-600">
                Selected: {selectedClass.name}
              </p>
            )}
          </Field>

          <Field label="Section">
            <select
              value={sectionId}
              disabled={!classId || loadingSections}
              onChange={(event) =>
                setSectionId(event.target.value)
              }
              className="input disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
            >
              <option value="">
                {!classId
                  ? "Select class first"
                  : loadingSections
                    ? "Loading sections..."
                    : "All sections"}
              </option>

              {sections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.name} ({section.code})
                </option>
              ))}
            </select>
          </Field>

          <Field label="Specific student">
            <select
              value={studentId}
              onChange={(event) =>
                setStudentId(event.target.value)
              }
              className="input"
            >
              <option value="">
                All selected students / class
              </option>

              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.firstName} {student.lastName || ""}
                  {" — "}
                  {student.email}
                </option>
              ))}
            </select>

            <p className="mt-2 text-xs text-slate-400">
              Leave empty to make it available to the selected
              class/section.
            </p>
          </Field>
        </div>
      </section>

      {/* SCHEDULE */}
      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="mb-6">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">
            Step 03
          </p>
          <h2 className="mt-1 text-xl font-black text-slate-900">
            Schedule & publishing
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Set the deadline and decide whether it should be
            visible immediately.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Due date & time">
            <input
              type="datetime-local"
              value={dueDate}
              onChange={(event) =>
                setDueDate(event.target.value)
              }
              className="input"
            />
          </Field>

          <Field label="Status">
            <select
              value={status}
              onChange={(event) =>
                setStatus(
                  event.target.value as
                    | "DRAFT"
                    | "PUBLISHED",
                )
              }
              className="input"
            >
              <option value="DRAFT">
                Draft — save privately
              </option>
              <option value="PUBLISHED">
                Published — visible now
              </option>
            </select>
          </Field>
        </div>

        <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-4">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
              💡
            </div>

            <div>
              <p className="text-sm font-black text-blue-900">
                Publishing tip
              </p>
              <p className="mt-1 text-xs leading-5 text-blue-700">
                Draft assignments remain private. Published
                assignments can appear in student assignment
                lists according to their access rules.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PREVIEW */}
      <section className="rounded-[28px] border border-slate-200 bg-slate-50 p-5 sm:p-7">
        <div className="mb-5">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">
            Live preview
          </p>
          <h2 className="mt-1 text-xl font-black text-slate-900">
            Student-facing summary
          </h2>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="h-2 bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400" />

          <div className="p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="mb-2 inline-flex rounded-full bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-blue-700">
                  {status}
                </div>

                <h3 className="text-xl font-black text-slate-900">
                  {title || "Your assignment title"}
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {description ||
                    "Assignment instructions will appear here."}
                </p>
              </div>

              <div className="shrink-0 rounded-2xl bg-slate-50 px-4 py-3 text-center">
                <p className="text-[10px] font-bold uppercase text-slate-400">
                  Due
                </p>
                <p className="mt-1 text-sm font-black text-slate-800">
                  {dueDate
                    ? new Date(dueDate).toLocaleString(
                        "en-IN",
                        {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                      )
                    : "No deadline"}
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {selectedClass && (
                <Badge>
                  🏫 {selectedClass.name}
                </Badge>
              )}

              {sections.find(
                (section) => section.id === sectionId,
              ) && (
                <Badge>
                  ▦{" "}
                  {
                    sections.find(
                      (section) => section.id === sectionId,
                    )?.name
                  }
                </Badge>
              )}

              {teacherId && (
                <Badge>
                  👨‍🏫{" "}
                  {teachers.find(
                    (teacher) => teacher.id === teacherId,
                  )?.firstName || "Teacher"}
                </Badge>
              )}

              {studentId && (
                <Badge>
                  👨‍🎓 Specific student
                </Badge>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ACTIONS */}
      <div className="sticky bottom-3 z-20 flex flex-col-reverse gap-3 rounded-3xl border border-slate-200 bg-white/95 p-3 shadow-2xl backdrop-blur md:flex-row md:items-center md:justify-between">
        <button
          type="button"
          onClick={() => router.back()}
          disabled={saving}
          className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
        >
          ← Cancel
        </button>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="submit"
            disabled={saving}
            className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-7 py-3 text-sm font-black text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving
              ? "Saving..."
              : mode === "edit"
                ? "✓ Update Assignment"
                : "＋ Create Assignment"}
          </button>
        </div>
      </div>

      <style jsx>{`
        .input {
          width: 100%;
          border: 1px solid rgb(226 232 240);
          border-radius: 16px;
          background: white;
          padding: 13px 15px;
          font-size: 14px;
          font-weight: 600;
          color: rgb(15 23 42);
          outline: none;
          transition:
            border-color 150ms ease,
            box-shadow 150ms ease;
        }

        .input::placeholder {
          color: rgb(148 163 184);
          font-weight: 500;
        }

        .input:focus {
          border-color: rgb(37 99 235);
          box-shadow:
            0 0 0 4px rgb(37 99 235 / 0.1);
        }
      `}</style>
    </form>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-black text-slate-700">
        {label}
        {required && (
          <span className="ml-1 text-red-500">*</span>
        )}
      </label>

      {children}
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600">
      {children}
    </span>
  );
}