"use client";

import { FormEvent, useState } from "react";

type Props = {
  onCreated?: () => void;
};

export default function CreateExamForm({
  onCreated,
}: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [examDate, setExamDate] = useState("");
  const [totalMarks, setTotalMarks] = useState("100");
  const [passingMarks, setPassingMarks] = useState("33");
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function submit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const token =
        localStorage.getItem("accessToken");

      if (!token) {
        throw new Error("Please login first.");
      }

      if (!title.trim()) {
        throw new Error("Exam title is required.");
      }

      if (!examDate) {
        throw new Error("Exam date is required.");
      }

      const total = Number(totalMarks);
      const passing = Number(passingMarks);

      if (!Number.isFinite(total) || total <= 0) {
        throw new Error("Total marks must be greater than 0.");
      }

      if (
        !Number.isFinite(passing) ||
        passing < 0 ||
        passing > total
      ) {
        throw new Error(
          "Passing marks must be between 0 and total marks.",
        );
      }

      const response = await fetch(
        "/api/exams",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: title.trim(),
            description:
              description.trim() || undefined,
            examDate: new Date(
              examDate,
            ).toISOString(),
            totalMarks: total,
            passingMarks: passing,
            classId: classId.trim() || undefined,
            sectionId: sectionId.trim() || undefined,
          }),
        },
      );

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            "Failed to create examination.",
        );
      }

      setSuccess(
        "Examination created successfully.",
      );

      setTitle("");
      setDescription("");
      setExamDate("");
      setTotalMarks("100");
      setPassingMarks("33");
      setClassId("");
      setSectionId("");

      onCreated?.();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur-xl"
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">
          Examination Management
        </p>

        <h2 className="mt-2 text-2xl font-black text-white">
          Create Examination
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          Add the basic examination details.
        </p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Field
          label="Exam Title"
          value={title}
          onChange={setTitle}
          placeholder="Class 10 Mid Term"
        />

        <Field
          label="Exam Date"
          value={examDate}
          onChange={setExamDate}
          type="datetime-local"
        />

        <Field
          label="Total Marks"
          value={totalMarks}
          onChange={setTotalMarks}
          type="number"
          placeholder="100"
        />

        <Field
          label="Passing Marks"
          value={passingMarks}
          onChange={setPassingMarks}
          type="number"
          placeholder="33"
        />

        <Field
          label="Class ID"
          value={classId}
          onChange={setClassId}
          placeholder="Optional class UUID"
        />

        <Field
          label="Section ID"
          value={sectionId}
          onChange={setSectionId}
          placeholder="Optional section UUID"
        />
      </div>

      <div className="mt-4">
        <label className="text-sm font-semibold text-slate-300">
          Description
        </label>

        <textarea
          value={description}
          onChange={(event) =>
            setDescription(event.target.value)
          }
          rows={4}
          placeholder="Exam description..."
          className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-400/50"
        />
      </div>

      {error && (
        <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-300">
          {success}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="mt-5 w-full rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading
          ? "Creating Examination..."
          : "Create Examination"}
      </button>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="text-sm font-semibold text-slate-300">
        {label}
      </label>

      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-400/50"
      />
    </div>
  );
}