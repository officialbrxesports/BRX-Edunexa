export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "/api";

export type ExamStatus =
  | "DRAFT"
  | "PUBLISHED"
  | "COMPLETED"
  | "CANCELLED";

export type ResultStatus =
  | "DRAFT"
  | "PUBLISHED";

export interface Exam {
  id: string;
  title: string;
  description?: string | null;
  examDate: string;
  totalMarks: number;
  passingMarks: number;
  status: ExamStatus;
  institutionId: string;
  classId?: string | null;
  sectionId?: string | null;
  class?: {
    id: string;
    name: string;
    code: string;
  } | null;
  section?: {
    id: string;
    name: string;
    code: string;
  } | null;
  results?: Result[];
  createdAt: string;
  updatedAt: string;
}

export interface Result {
  id: string;
  marks: number;
  maxMarks: number;
  grade?: string | null;
  remarks?: string | null;
  status: ResultStatus;
  examId: string;
  studentId: string;
  institutionId: string;
  student?: {
    id: string;
    firstName: string;
    lastName?: string | null;
    email?: string;
  };
  exam?: Exam;
  createdAt: string;
  updatedAt: string;
}

export interface AcademicClass {
  id: string;
  name: string;
  code: string;
}

export interface Section {
  id: string;
  name: string;
  code: string;
  classId: string;
}

export interface Student {
  id: string;
  firstName: string;
  lastName?: string | null;
  email?: string;
  role?: string;
  status?: string;
}

export interface CreateExamPayload {
  title: string;
  description?: string;
  examDate: string;
  totalMarks: number;
  passingMarks: number;
  classId?: string;
  sectionId?: string;
}

export interface CreateResultPayload {
  studentId: string;
  marks: number;
  maxMarks: number;
  grade?: string;
  remarks?: string;
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken");
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();

  const headers = new Headers(options.headers);

  headers.set("Content-Type", "application/json");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  const text = await response.text();

  let data: unknown = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    const message =
      typeof data === "object" &&
      data !== null &&
      "message" in data
        ? String((data as { message: unknown }).message)
        : `Request failed with status ${response.status}`;

    throw new Error(message);
  }

  return data as T;
}

export async function getExams(): Promise<Exam[]> {
  const data = await apiFetch<Exam[] | { data: Exam[] }>(
    "/exams",
  );

  return Array.isArray(data)
    ? data
    : Array.isArray(data.data)
      ? data.data
      : [];
}

export async function getExam(id: string): Promise<Exam> {
  return apiFetch<Exam>(`/exams/${id}`);
}

export async function createExam(
  payload: CreateExamPayload,
): Promise<Exam> {
  return apiFetch<Exam>("/exams", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateExam(
  id: string,
  payload: Partial<CreateExamPayload> & {
    status?: ExamStatus;
  },
): Promise<Exam> {
  return apiFetch<Exam>(`/exams/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteExam(id: string): Promise<void> {
  await apiFetch(`/exams/${id}`, {
    method: "DELETE",
  });
}

export async function getExamResults(
  examId: string,
): Promise<Result[]> {
  const data = await apiFetch<Result[] | { data: Result[] }>(
    `/exams/${examId}/results`,
  );

  return Array.isArray(data)
    ? data
    : Array.isArray(data.data)
      ? data.data
      : [];
}

export async function createResult(
  examId: string,
  payload: CreateResultPayload,
): Promise<Result> {
  return apiFetch<Result>(`/exams/${examId}/results`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateResult(
  resultId: string,
  payload: Partial<CreateResultPayload> & {
    status?: ResultStatus;
  },
): Promise<Result> {
  return apiFetch<Result>(`/exams/results/${resultId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteResult(
  resultId: string,
): Promise<void> {
  await apiFetch(`/exams/results/${resultId}`, {
    method: "DELETE",
  });
}

export async function getClasses(): Promise<AcademicClass[]> {
  const data = await apiFetch<
    AcademicClass[] | { data: AcademicClass[] }
  >("/academics/classes");

  return Array.isArray(data)
    ? data
    : Array.isArray(data.data)
      ? data.data
      : [];
}

export async function getSections(
  classId: string,
): Promise<Section[]> {
  const data = await apiFetch<
    Section[] | { data: Section[] }
  >(`/academics/classes/${classId}/sections`);

  return Array.isArray(data)
    ? data
    : Array.isArray(data.data)
      ? data.data
      : [];
}

export async function getSectionStudents(
  classId: string,
  sectionId: string,
): Promise<Student[]> {
  const data = await apiFetch<
    Student[] | { data: Student[] }
  >(
    `/academics/classes/${classId}/sections/${sectionId}/students`,
  );

  return Array.isArray(data)
    ? data
    : Array.isArray(data.data)
      ? data.data
      : [];
}
