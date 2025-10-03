import axios from "axios";
import type { StoredToken } from "./authentication/types";
import { clearToken } from "./authentication";

const baseURL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "") || "/";
const STORAGE_KEY =
  import.meta.env.VITE_STORAGE_KEY?.replace(/\/+$/, "") || "auth.token.v1";

export const httpAuth = axios.create({
  baseURL,
  withCredentials: false,
});

export function loadToken(): StoredToken | null {
  const raw =
    localStorage.getItem(STORAGE_KEY) ?? sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as StoredToken;
    if (parsed?.accessToken && parsed?.tokenType && parsed?.expiresAt > Date.now()) {
      return parsed;
    }
  } catch {
    // ignore
  }
  clearToken();
  return null;
}

httpAuth.interceptors.request.use((config) => {
  // não sobrescreve se já veio explicitamente
  if (!config.headers?.Authorization) {
    const t : StoredToken | null = loadToken();
    if (t?.accessToken && t?.tokenType) {
      config.headers = config.headers ?? {};
      (config.headers as any).Authorization = `${t.tokenType} ${t.accessToken}`;
    }
  }
  return config;
});

// Response interceptor: when receiving 401, clear the header (and optionally redirect)
httpAuth.interceptors.response.use(
  (resp) => resp,
  (error) => {
    if (error?.response?.status === 401) {
      clearAuthToken();
      window.location.href = "/access";
    }
    return Promise.reject(error);
  }
);
