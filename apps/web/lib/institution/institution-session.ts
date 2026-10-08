import type {
  InstitutionType,
} from "./modules";

export type InstitutionSession = {
  userId: string;
  email: string;
  firstName: string;
  lastName?: string | null;
  role: string;

  institution?: {
    id: string;
    name: string;
    code: string;
    type: InstitutionType | string;
    status?: string;
  } | null;
};

export function normalizeInstitutionType(
  value?: string,
): InstitutionType {
  const normalized =
    value?.trim().toUpperCase();

  switch (normalized) {
    case "SCHOOL":
      return "SCHOOL";

    case "COLLEGE":
      return "COLLEGE";

    case "UNIVERSITY":
      return "UNIVERSITY";

    case "COACHING":
      return "COACHING";

    case "INSTITUTE":
      return "INSTITUTE";

    case "OTHER":
      return "OTHER";

    default:
      return "OTHER";
  }
}