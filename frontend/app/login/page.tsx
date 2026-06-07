"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "../lib/api";
import { signIn, signOut } from "../lib/auth";

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
      await signIn(trimmedEmail, password);
      const profile = await apiFetch<{ first_name: string; last_name: string; email: string; role: "admin" | "staff" | "client" }>("/api/v1/auth/profile/");
      const displayName = `${profile.first_name} ${profile.last_name}`.trim() || profile.email;
      localStorage.setItem("user_name", displayName);
      localStorage.setItem("name", displayName);
      localStorage.setItem("studio_name", displayName);
      setError("");
      router.replace("/");
    } catch (error) {
      await signOut();
      setError(error instanceof Error ? error.message : "Login failed. Check your account credentials.");
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
