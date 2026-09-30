import type { UserRole } from "../constants/roles";

export type AuthUser = {
  id: string;
  email: string;
  firstName: string;
  lastName?: string | null;
  role: UserRole;
  status: string;
  institutionId: string | null;
};

export type LoginResponse = {
  accessToken: string;
  tokenType: string;
  user: AuthUser;
};

export type LoginCredentials = {
  email: string;
  password: string;
};
