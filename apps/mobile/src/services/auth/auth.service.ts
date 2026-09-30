import apiClient from "../../lib/api-client";
import { storage } from "../../lib/storage";
import type { LoginResponse } from "../../types/auth";

const ACCESS_TOKEN_KEY = "brx_access_token";
const USER_KEY = "brx_user";

const authService = {
  async login(
    email: string,
    password: string,
  ): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>(
      "/auth/login",
      { email, password },
    );

    const data = response.data;

    await storage.setItem(
      ACCESS_TOKEN_KEY,
      data.accessToken,
    );

    await storage.setItem(
      USER_KEY,
      JSON.stringify(data.user),
    );

    return data;
  },

  async getMe() {
    const response = await apiClient.get("/auth/me");
    return response.data;
  },

  async getToken() {
    return storage.getItem(ACCESS_TOKEN_KEY);
  },

  async getStoredUser() {
    const value = await storage.getItem(USER_KEY);

    if (!value) return null;

    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  },

  async forgotPassword(email: string) {
    const response = await apiClient.post(
      "/auth/forgot-password",
      { email },
    );

    return response.data;
  },

  async verifyResetOtp(
    email: string,
    otp: string,
  ) {
    const response = await apiClient.post(
      "/auth/verify-reset-otp",
      { email, otp },
    );

    return response.data;
  },

  async resetPassword(
    email: string,
    otp: string,
    password: string,
  ) {
    const response = await apiClient.post(
      "/auth/reset-password",
      {
        email,
        otp,
        password,
      },
    );

    return response.data;
  },

  async logout() {
    await storage.removeItem(ACCESS_TOKEN_KEY);
    await storage.removeItem(USER_KEY);
  },
};

export { authService };

export default authService;
