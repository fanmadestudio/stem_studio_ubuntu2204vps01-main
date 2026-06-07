"use client";

import { getApiBase } from "./api";

const AUTH_NAME_KEY = "studio_name";
const AUTH_EXPIRY_KEY = "auth_expires_at";
const ACCESS_TOKEN_KEY = "access";

type LocalSession = {
  access_token: string;
};

function clearStoredAuth(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_NAME_KEY);
  localStorage.removeItem(AUTH_EXPIRY_KEY);
  localStorage.removeItem("user_name");
  localStorage.removeItem("username");
  localStorage.removeItem("name");
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem("user");
}

function storeSession(token: string, email: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
  localStorage.setItem(AUTH_NAME_KEY, email);
  localStorage.setItem("user_name", email);
  localStorage.setItem("name", email);
  localStorage.setItem(AUTH_EXPIRY_KEY, String(Date.now() + 30 * 60 * 1000));
}

export async function bootstrapSession(): Promise<LocalSession | null> {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  return token ? { access_token: token } : null;
}

export function bindAuthListener(): void {
  // Local token auth does not require an external auth-state subscription.
}

export async function signIn(email: string, password: string): Promise<LocalSession> {
  const response = await fetch(`${getApiBase()}/api/v1/auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const text = await response.text();
    try {
      const payload = JSON.parse(text) as { detail?: string };
      throw new Error(payload.detail || "Sign-in failed.");
    } catch {
      throw new Error(text || "Sign-in failed.");
    }
  }

  const data = (await response.json()) as { token?: string; user?: { email?: string } };
  if (!data.token) {
    throw new Error("Sign-in failed.");
  }

  storeSession(data.token, data.user?.email || email);
  return { access_token: data.token };
}

export async function signOut(): Promise<void> {
  clearStoredAuth();
}
