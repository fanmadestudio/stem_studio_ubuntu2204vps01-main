"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "../lib/api";

const AUTH_NAME_KEY = "studio_name";
const AUTH_EXPIRY_KEY = "auth_expires_at";
const THIRTY_MINUTES_MS = 30 * 60 * 1000;

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password.trim()) {
      setError("Please enter email and password.");
      return;
    }

    try {
      setSubmitting(true);
      const payload = await apiFetch<{ access: string; refresh: string; user: { name: string; email: string } }>("/api/v1/auth/token/", {
        method: "POST",
        body: JSON.stringify({ email: trimmedEmail, password })
      });
      const expiresAt = Date.now() + THIRTY_MINUTES_MS;
      localStorage.setItem("access", payload.access);
      localStorage.setItem("refresh", payload.refresh);
      localStorage.setItem(AUTH_NAME_KEY, payload.user.name || payload.user.email);
      localStorage.setItem(AUTH_EXPIRY_KEY, String(expiresAt));
      localStorage.setItem("user_name", payload.user.name || payload.user.email);
      localStorage.setItem("name", payload.user.name || payload.user.email);
      setError("");
      router.replace("/");
    } catch {
      setError("Login failed. Check email/password.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <section className="card" style={{ width: "100%", maxWidth: 420 }}>
        <h1 style={{ marginBottom: 8 }}>Login</h1>
        <p className="small" style={{ marginTop: 0 }}>
          Sign in to access Stem Studio dashboard.
        </p>
        <form onSubmit={onSubmit} style={{ marginTop: 14, display: "grid", gap: 10 }}>
          <input
            className="input"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <input
            className="input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          {error ? (
            <p className="small" style={{ color: "var(--danger)", margin: 0 }}>
              {error}
            </p>
          ) : null}
          <button className="button" type="submit" disabled={submitting}>
            {submitting ? "Signing In..." : "Sign In"}
          </button>
        </form>
      </section>
    </main>
  );
}

