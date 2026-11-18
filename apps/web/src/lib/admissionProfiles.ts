/* Class-wise admission form definitions, as sent by
   GET /students/admissions/form-profiles. */

export type FieldType =
  | "text"
  | "number"
  | "date"
  | "select"
  | "yesno"
  | "textarea"
  | "multi";

export type ShowIf = {
  key: string;
  equals?: string;
  notEquals?: string;
};

export type ProfileField = {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[];
  pattern?: string;
  patternHint?: string;
  min?: number;
  max?: number;
  maxLength?: number;
  upper?: boolean;
  pick?: number;
  defaultValue?: string;
  hint?: string;
  showIf?: ShowIf;
};

export type ProfileMarks = {
  title: string;
  subjects: string[];
  maxMarks: number;
  skipIf?: ShowIf;
};

export type ProfileSection = {
  id: string;
  title: string;
  fields: ProfileField[];
  marks?: ProfileMarks;
};

export type ProfileDoc = {
  type: string;
  label: string;
  required: boolean;
  note?: string;
};

export type AdmissionProfile = {
  id: string;
  title: string;
  classLabel: string;
  description: string;
  sections: ProfileSection[];
  documents: ProfileDoc[];
  instructions: string[];
  requiresPreviousSchool: boolean;
  requiresDeclarationName: boolean;
};

export type MarkRow = {
  subject: string;
  max: number | string;
  obtained: number | string;
};

export type DetailsValue = string | string[] | MarkRow[] | number;
export type Details = Record<string, DetailsValue | undefined>;

export const DOCUMENT_LABELS: Record<string, string> = {
  STUDENT_PHOTO: "Passport size photo",
  SIGNATURE: "Student signature",
  BIRTH_CERTIFICATE: "Birth certificate",
  IDENTITY_DOCUMENT: "Aadhaar / photo ID",
  TRANSFER_CERTIFICATE: "Transfer certificate",
  MARKSHEET: "Marksheet",
  MIGRATION_CERTIFICATE: "Migration certificate",
  CASTE_CERTIFICATE: "Caste certificate",
  REGISTRATION_CARD: "Registration card",
  PWD_CERTIFICATE: "Disability certificate",
  INCOME_CERTIFICATE: "Income certificate",
  BANK_PASSBOOK: "Bank passbook (first page)",
  BOARD_CERTIFICATE: "Board certificate / marksheet",
  TENTH_MARKSHEET: "Class 10 marksheet",
  GRADUATION_MARKSHEET: "Graduation marksheets",
  DEGREE_CERTIFICATE: "Degree / provisional certificate",
  ENTRANCE_SCORECARD: "Entrance exam scorecard",
  CHARACTER_CERTIFICATE: "Character certificate",
  OTHER: "Other document",
};

const COLLEGE_ONLY_TYPES = [
  "TENTH_MARKSHEET",
  "GRADUATION_MARKSHEET",
  "DEGREE_CERTIFICATE",
  "ENTRANCE_SCORECARD",
  "CHARACTER_CERTIFICATE",
];

/* Document types the school admission API accepts. */
export const ALL_DOCUMENT_TYPES = Object.keys(DOCUMENT_LABELS).filter(
  (type) => !COLLEGE_ONLY_TYPES.includes(type),
);

export function documentLabel(type: string): string {
  return DOCUMENT_LABELS[type] || type.replaceAll("_", " ");
}

export function isFieldVisible(
  field: { showIf?: ShowIf },
  values: Details,
): boolean {
  const rule = field.showIf;

  if (!rule) return true;

  const current = String(values[rule.key] ?? "");

  if (rule.equals !== undefined) return current === rule.equals;
  if (rule.notEquals !== undefined) return current !== rule.notEquals;

  return true;
}

export function marksSkipped(
  marks: ProfileMarks,
  values: Details,
): boolean {
  return marks.skipIf
    ? isFieldVisible({ showIf: marks.skipIf }, values)
    : false;
}

export function emptyMarks(marks: ProfileMarks): MarkRow[] {
  return marks.subjects.map((subject) => ({
    subject,
    max: marks.maxMarks,
    obtained: "",
  }));
}

/* Start values for a profile (defaults such as Nationality). */
export function initialDetails(profile: AdmissionProfile): Details {
  const out: Details = {};

  for (const section of profile.sections) {
    for (const field of section.fields) {
      if (field.defaultValue) out[field.key] = field.defaultValue;
    }

    if (section.marks) out.marks = emptyMarks(section.marks);
  }

  return out;
}

export function percentOf(rows: MarkRow[]): string {
  let max = 0;
  let got = 0;

  for (const row of rows) {
    const m = Number(row.max);
    const o = Number(row.obtained);

    if (row.obtained === "" || !Number.isFinite(m) || !Number.isFinite(o)) {
      continue;
    }

    max += m;
    got += o;
  }

  return max > 0 ? ((got / max) * 100).toFixed(2) : "";
}

/* First problem in the class-specific part of a form, or "". */
export function firstProfileProblem(
  profile: AdmissionProfile | null,
  details: Details,
): string {
  if (!profile) return "";

  for (const section of profile.sections) {
    for (const field of section.fields) {
      if (!field.required || !isFieldVisible(field, details)) continue;

      const value = details[field.key];
      const empty = Array.isArray(value)
        ? value.length === 0
        : value === undefined || String(value).trim() === "";

      if (empty) return `${field.label} is required.`;
    }

    if (section.marks && !marksSkipped(section.marks, details)) {
      const rows = Array.isArray(details.marks) ? (details.marks as MarkRow[]) : [];

      if (rows.filter((r) => String(r.obtained).trim() !== "").length < 5) {
        return `${section.marks.title}: enter marks for at least 5 subjects.`;
      }
    }
  }

  return "";
}
