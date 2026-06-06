"use client";

import { createClient, type Session, type SupabaseClient } from "@supabase/supabase-js";

const AUTH_NAME_KEY = "studio_name";
const AUTH_EXPIRY_KEY = "auth_expires_at";

let browserClient: SupabaseClient | null = null;
let authSubscriptionBound = false;

function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing ${name}.`);
  }
  return value;
}

export function getSupabaseBrowserClient(): SupabaseClient {
  if (browserClient) return browserClient;

  browserClient = createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL),
    requireEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
  );
  return browserClient;
}

export function syncLegacySessionStorage(session: Session | null): void {
  if (typeof window === "undefined") return;

  if (!session) {
    localStorage.removeItem(AUTH_NAME_KEY);
    localStorage.removeItem(AUTH_EXPIRY_KEY);
    localStorage.removeItem("user_name");
    localStorage.removeItem("username");
    localStorage.removeItem("name");
    localStorage.removeItem("access");
    localStorage.removeItem("user");
    return;
  }

  const displayName =
    session.user.user_metadata?.name ||
    [session.user.user_metadata?.first_name, session.user.user_metadata?.last_name].filter(Boolean).join(" ").trim() ||
    session.user.email ||
    "Signed in user";

  localStorage.setItem("access", session.access_token);
  localStorage.setItem(AUTH_NAME_KEY, displayName);
  localStorage.setItem("user_name", displayName);
  localStorage.setItem("name", displayName);
  localStorage.setItem(AUTH_EXPIRY_KEY, String(new Date(session.expires_at ? session.expires_at * 1000 : Date.now()).getTime()));
}

export async function bootstrapSupabaseSession(): Promise<Session | null> {
  const supabase = getSupabaseBrowserClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  syncLegacySessionStorage(session);
  return session;
}

export function bindSupabaseAuthListener(): void {
  if (authSubscriptionBound) return;
  authSubscriptionBound = true;
  const supabase = getSupabaseBrowserClient();
  supabase.auth.onAuthStateChange((_event, session) => {
    syncLegacySessionStorage(session);
  });
}

export async function signInWithSupabase(email: string, password: string): Promise<Session> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    throw error ?? new Error("Supabase sign-in failed.");
  }
  syncLegacySessionStorage(data.session);
  return data.session;
}

export async function signOutFromSupabase(): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  await supabase.auth.signOut();
  syncLegacySessionStorage(null);
}

export async function updateSupabasePassword(password: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    throw error;
  }
}
