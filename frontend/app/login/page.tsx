"use client";

import { FormEvent, useState } from "react";
import { apiFetch, ensureCsrfToken } from "../lib/api";
import { useRouter } from "../lib/router";

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
      await ensureCsrfToken();
      await apiFetch("/api/v1/auth/login/", {
        method: "POST",
        body: JSON.stringify({ email: trimmedEmail, password }),
      });
      setError("");
      router.replace("/");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Login failed. Check email/password.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <section className="card" style={{ width: "100%", maxWidth: 420 }}>
        <h1 style={{ marginBottom: 8 }}>Login</h1>
        <p className="small" style={{ marginTop: 0 }}>
          Sign in with your Stem Studio account.
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
