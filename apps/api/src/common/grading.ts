/** 10-point grading used for university and college results. */
const SCALE: { min: number; grade: string; point: number }[] = [
  { min: 90, grade: 'O', point: 10 },
  { min: 80, grade: 'A+', point: 9 },
  { min: 70, grade: 'A', point: 8 },
  { min: 60, grade: 'B+', point: 7 },
  { min: 50, grade: 'B', point: 6 },
  { min: 45, grade: 'C', point: 5 },
  { min: 40, grade: 'P', point: 4 },
];

export function gradeFor(marks: number) {
  const row = SCALE.find((item) => marks >= item.min);

  return row
    ? { grade: row.grade, gradePoint: row.point }
    : { grade: 'F', gradePoint: 0 };
}

export type TranscriptRow = {
  semester: number;
  code: string;
  title: string;
  credits: number;
  marks: number;
  grade: string;
  gradePoint: number;
};

const round2 = (value: number) => Math.round(value * 100) / 100;

const average = (rows: TranscriptRow[]) => {
  const credits = rows.reduce((sum, row) => sum + row.credits, 0);

  if (credits === 0) return null;

  return round2(
    rows.reduce((sum, row) => sum + row.credits * row.gradePoint, 0) / credits,
  );
};

/** SGPA per semester and CGPA overall, weighted by course credits. */
export function buildTranscript(rows: TranscriptRow[]) {
  const bySemester = new Map<number, TranscriptRow[]>();

  for (const row of rows) {
    bySemester.set(row.semester, [...(bySemester.get(row.semester) ?? []), row]);
  }

  return {
    cgpa: average(rows),
    totalCredits: rows.reduce((sum, row) => sum + row.credits, 0),
    semesters: [...bySemester.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([semester, list]) => ({
        semester,
        sgpa: average(list),
        credits: list.reduce((sum, row) => sum + row.credits, 0),
        courses: list.sort((a, b) => a.code.localeCompare(b.code)),
      })),
  };
}
