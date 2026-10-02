"use client";

import { FormEvent, useState } from "react";

type Props = {
  examId: string;
  studentId?: string;
  onSaved?: () => void;
};

export default function ResultForm({
  examId,
  studentId: initialStudentId = "",
  onSaved,
}: Props) {
  const [studentId, setStudentId] =
    useState(initialStudentId);

  const [marks, setMarks] = useState("");
  const [maxMarks, setMaxMarks] = useState("100");
  const [grade, setGrade] = useState("");
  const [remarks, setRemarks] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  function calculateGrade(
    value: number,
    maximum: number,
  ) {
    if (
      !Number.isFinite(value) ||
      !Number.isFinite(maximum) ||
      maximum <= 0
    ) {
      return "";
    }

    const percentage =
      (value / maximum) * 100;

    if (percentage >= 90) return "A+";
    if (percentage >= 80) return "A";
    if (percentage >= 70) return "B+";
    if (percentage >= 60) return "B";
    if (percentage >= 50) return "C";
    if (percentage >= 40) return "D";

    return "F";
  }

  function handleMarksChange(value: string) {
    setMarks(value);

    const numericMarks = Number(value);
    const numericMax = Number(maxMarks);

    if (
      Number.isFinite(numericMarks) &&
      Number.isFinite(numericMax) &&
      numericMax > 0
    ) {
      setGrade(
        calculateGrade(
          numericMarks,
          numericMax,
        ),
      );
    }
  }

  async function submit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      const token =
        localStorage.getItem("accessToken");

      if (!token) {
        throw new Error("Please login first.");
      }

      if (!examId) {
        throw new Error("Exam ID is missing.");
      }

      if (!studentId.trim()) {
        throw new Error("Student ID is required.");
      }

      const numericMarks = Number(marks);
      const numericMaxMarks = Number(maxMarks);

      if (
        !Number.isFinite(numericMarks) ||
        numericMarks < 0
      ) {
        throw new Error("Enter valid marks.");
      }

      if (
        !Number.isFinite(numericMaxMarks) ||
        numericMaxMarks <= 0
      ) {
        throw new Error(
          "Maximum marks must be greater than 0.",
        );
      }

      if (numericMarks > numericMaxMarks) {
        throw new Error(
          "Marks cannot exceed maximum marks.",
        );
      }

      const response = await fetch(
        "http://localhost:3000/exams/results",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            examId,
            studentId: studentId.trim(),
            marks: numericMarks,
            maxMarks: numericMaxMarks,
            grade:
              grade.trim() || undefined,
            remarks:
              remarks.trim() || undefined,
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
            "Failed to save result.",
        );
      }

      setMessage(
        "Student result saved successfully.",
      );

      setMarks("");
      setRemarks("");

      onSaved?.();
    } catch (err) {
      setMessage(
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
      className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-xl backdrop-blur-xl"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-purple-400">
        Result Entry
      </p>

      <h2 className="mt-2 text-2xl font-black text-white">
        Add Student Result
      </h2>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Input
          label="Student ID"
          value={studentId}
          onChange={setStudentId}
          placeholder="Student UUID"
        />

        <Input
          label="Marks"
          value={marks}
          onChange={handleMarksChange}
          type="number"
          placeholder="88"
        />

        <Input
          label="Maximum Marks"
          value={maxMarks}
          onChange={setMaxMarks}
          type="number"
          placeholder="100"
        />

        <Input
          label="Grade"
          value={grade}
          onChange={setGrade}
          placeholder="A"
        />
      </div>

      <div className="mt-4">
        <label className="text-sm font-semibold text-slate-300">
          Remarks
        </label>

        <textarea
          value={remarks}
          onChange={(event) =>
            setRemarks(event.target.value)
          }
          rows={3}
          placeholder="Excellent performance..."
          className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-purple-400/50"
        />
      </div>

      {message && (
        <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-300">
          {message}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="mt-5 w-full rounded-2xl bg-purple-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Saving Result..." : "Save Result"}
      </button>
    </form>
  );
}

function Input({
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
        className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-purple-400/50"
      />
    </div>
  );
}