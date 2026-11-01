"use client";

import type { ChangeEvent } from "react";

export type InstitutionCategory =
  | "SCHOOL"
  | "COLLEGE"
  | "UNIVERSITY"
  | "COACHING"
  | "INSTITUTE"
  | "OTHER";

type Props = {
  category: InstitutionCategory;
  details: Record<string, string>;
  onChange: (details: Record<string, string>) => void;
};

const fields: Record<
  InstitutionCategory,
  { key: string; label: string; placeholder: string }[]
> = {
  COACHING: [
    { key: "subjects", label: "Subjects taught", placeholder: "Maths, Science..." },
    { key: "batchCount", label: "Number of batches", placeholder: "e.g. 5" },
    { key: "teacherCount", label: "Number of teachers", placeholder: "e.g. 4" },
  ],
  SCHOOL: [
    { key: "board", label: "Education board", placeholder: "CBSE, ICSE, State Board..." },
    { key: "establishedYear", label: "Established year", placeholder: "e.g. 2010" },
    { key: "classRange", label: "Classes offered", placeholder: "Nursery to Class 12" },
  ],
  COLLEGE: [
    { key: "affiliation", label: "Affiliating university", placeholder: "University name" },
    { key: "departments", label: "Departments", placeholder: "Science, Commerce..." },
    { key: "courseTypes", label: "Courses offered", placeholder: "BA, BSc, BCom..." },
  ],
  UNIVERSITY: [
    { key: "recognition", label: "Recognition / accreditation", placeholder: "Recognition details" },
    { key: "faculties", label: "Faculties", placeholder: "Arts, Science, Engineering..." },
    { key: "departments", label: "Departments", placeholder: "List main departments" },
    { key: "registrationNumber", label: "University registration number", placeholder: "Registration number" },
  ],
  INSTITUTE: [
    { key: "programmeTypes", label: "Programmes offered", placeholder: "Training programmes" },
    { key: "trainerCount", label: "Number of trainers", placeholder: "e.g. 8" },
  ],
  OTHER: [
    { key: "organisationType", label: "Organisation type", placeholder: "Describe your organisation" },
    { key: "services", label: "Main services", placeholder: "Services offered" },
  ],
};

export default function InstitutionTypeSelectorFields({
  category,
  details,
  onChange,
}: Props) {
  function update(event: ChangeEvent<HTMLInputElement>) {
    onChange({ ...details, [event.target.name]: event.target.value });
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {fields[category].map((field) => (
        <label key={field.key} className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">
            {field.label}
          </span>
          <input
            name={field.key}
            value={details[field.key] || ""}
            onChange={update}
            placeholder={field.placeholder}
            maxLength={250}
            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
          />
        </label>
      ))}
    </div>
  );
}
