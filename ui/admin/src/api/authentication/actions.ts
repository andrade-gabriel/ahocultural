import { httpPublic } from "../http-public";
import type { LoginRequest, LoginResponse, StoredToken } from "./types";

const STORAGE_KEY =
  import.meta.env.VITE_STORAGE_KEY?.replace(/\/+$/, "") || "auth.token.v1";

function getStorage(remember?: boolean) {
  return remember ? localStorage : sessionStorage;
}

export function saveToken(res: LoginResponse, remember?: boolean) {
  const stored: StoredToken = {
    tokenType: res.token_type,
    accessToken: res.access_token,
    expiresAt: Date.now() + res.expires_in * 1000,
  };

  // Avoids duplication between storages
  localStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(STORAGE_KEY);

  getStorage(remember)
    .setItem(STORAGE_KEY, JSON.stringify(stored));
}

export function clearToken() {
  localStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(STORAGE_KEY);
}

// packages/app/src/api/authentication/actions.ts

export async function signIn(input: LoginRequest): Promise<LoginResponse> {
  const body = new URLSearchParams();
  body.set("email", input.email);
  body.set("password", input.password);

  const { data } = await httpPublic.post<LoginResponse>(
    "/access/authenticate",
    body,
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );

  saveToken(data, input.remember);
  return data;
}


export async function signOut() {
  clearToken();
}