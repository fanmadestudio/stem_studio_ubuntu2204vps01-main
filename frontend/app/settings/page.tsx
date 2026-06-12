"use client";

import { FormEvent, useEffect, useState } from "react";
import { useLanguage } from "../components/language-provider";
import { Sidebar } from "../components/sidebar";
import { apiFetch } from "../lib/api";

type Profile = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: "admin" | "staff" | "client";
};

export default function SettingsPage() {
  const { language, setLanguage, t } = useLanguage();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [notice, setNotice] = useState("No changes yet.");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  });

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await apiFetch<Profile>("/api/v1/auth/profile/");
        setProfile(data);
        const fullName = `${data.first_name} ${data.last_name}`.trim();
        setForm((prev) => ({ ...prev, name: fullName || data.email, email: data.email }));
      } catch {
        setNotice("Failed to load account profile.");
      }
    }
    void loadProfile();
  }, []);

  async function saveSettings(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!profile) return;
    const name = form.name.trim();
    const [first_name, ...rest] = name.split(" ");
    const last_name = rest.join(" ");
    try {
      const payload: { first_name: string; last_name: string; password?: string } = { first_name, last_name };
      if (form.password.trim()) payload.password = form.password.trim();
      const updated = await apiFetch<Profile>("/api/v1/auth/profile/", {
        method: "PATCH",
        body: JSON.stringify(payload)
      });
      setProfile(updated);
      localStorage.setItem("user_name", `${updated.first_name} ${updated.last_name}`.trim() || updated.email);
      setForm((prev) => ({ ...prev, password: "" }));
      setNotice("Account settings saved.");
    } catch (error) {
      setNotice(`Failed to save settings: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  return (
    <div className="shell">
      <Sidebar />
      <main className="main">
        <section className="topbar" style={{ marginTop: 20 }}>
          <div>
            <h1>Settings</h1>
            <p className="small">Manage your account information and security options</p>
          </div>
        </section>

        <section className="grid">
          <article className="card">
            <h3>Account Settings</h3>
            <p className="small">Update profile details and password for this account.</p>

            <form className="form-grid" style={{ marginTop: 12 }} onSubmit={(event) => void saveSettings(event)}>
              <label className="small" htmlFor="name" style={{ alignSelf: "center" }}>
                Name
              </label>
              <input id="name" className="input" type="text" placeholder="Your full name" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />

              <label className="small" htmlFor="email" style={{ alignSelf: "center" }}>
                Email
              </label>
              <input id="email" className="input" type="text" placeholder="Email" value={form.email} disabled />

              <label className="small" htmlFor="password" style={{ alignSelf: "center" }}>
                Change Password
              </label>
              <input
                id="password"
                className="input"
                type="password"
                placeholder="Enter new password (optional)"
                value={form.password}
                onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              />

              <div />
              <button className="button" type="submit">
                Save Account Settings
              </button>
            </form>
            <p className="small" style={{ marginTop: 10 }}>
              {notice}
            </p>
          </article>

          <article className="card">
            <h3>Role Access Preview</h3>
            <p className="small">
              Active role: <strong>{profile?.role ?? "Unknown"}</strong>
            </p>
            <table className="table">
              <thead>
                <tr>
                  <th>Module</th>
                  <th>Permission</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Dashboard Analytics</td>
                  <td>Full view</td>
                </tr>
                <tr>
                  <td>Booking Creation</td>
                  <td>Create/Edit</td>
                </tr>
                <tr>
                  <td>Invoice Handling</td>
                  <td>Generate &amp; update</td>
                </tr>
                <tr>
                  <td>Staff/Equipment CRUD</td>
                  <td>Restricted</td>
                </tr>
              </tbody>
            </table>
          </article>

          <article className="card">
            <h3>{t("settings.language")}</h3>
            <p className="small">{t("settings.languageHelp")}</p>
            <div style={{ marginTop: 10, maxWidth: 260 }}>
              <select className="select" value={language} onChange={(e) => setLanguage(e.target.value as "en" | "id")}>
                <option value="en">{t("settings.languageEnglish")}</option>
                <option value="id">{t("settings.languageIndonesian")}</option>
              </select>
            </div>
          </article>
        </section>
      </main>
    </div>
  );
}
