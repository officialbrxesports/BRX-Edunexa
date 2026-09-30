import axios from "axios";
import { ENV } from "../config/env";
import { storage } from "./storage";

const apiClient = axios.create({
  baseURL: ENV.API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

apiClient.interceptors.request.use(async (config) => {
  const token = await storage.getItem("brx_access_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await storage.removeItem("brx_access_token");
      await storage.removeItem("brx_user");
    }

    return Promise.reject(error);
  },
);

export default apiClient;
