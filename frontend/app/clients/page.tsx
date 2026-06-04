"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Sidebar } from "../components/sidebar";
import { apiFetch, apiFetchList } from "../lib/api";

type ApiClient = {
  id: number;
  user: number;
  user_email: string;
  first_name: string;
  last_name: string;
  phone: string;
  notes: string;
  created_at: string;
};

function clientCode(id: number): string {
  return `CL-${String(id).padStart(2, "0")}`;
}

function formatDateTime(iso: string): string {
  const dt = new Date(iso);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const d = String(dt.getDate()).padStart(2, "0");
  const hh = String(dt.getHours()).padStart(2, "0");
  const mm = String(dt.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${d} ${hh}:${mm}`;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<ApiClient[]>([]);
  const [notice, setNotice] = useState("No new client input.");
  const [clientForm, setClientForm] = useState({
    name: "",
    email: "",
    phone: ""
  });

  useEffect(() => {
    async function loadClients() {
      try {
        const data = await apiFetchList<ApiClient>("/api/v1/clients/");
        setClients(data);
      } catch {
        setNotice("Failed to load clients from API.");
      }
    }
    void loadClients();
  }, []);

  const sortedClients = useMemo(() => [...clients].sort((a, b) => a.id - b.id), [clients]);

  async function submitClient(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const name = clientForm.name.trim();
    const email = clientForm.email.trim();
    const phone = clientForm.phone.trim();

    if (!name || !email || !phone) {
      setNotice("Client rejected: name, email, and phone are required.");
      return;
    }

    const [first_name, ...rest] = name.split(" ");
    const last_name = rest.join(" ");

    try {
      const created = await apiFetch<ApiClient>("/api/v1/clients/", {
        method: "POST",
        body: JSON.stringify({
          email,
          first_name,
          last_name,
          phone,
          notes: ""
        })
      });
      setClients((prev) => [created, ...prev]);
      setClientForm({ name: "", email: "", phone: "" });
      setNotice(`Client ${clientCode(created.id)} created successfully.`);
    } catch (error) {
      setNotice(`Client rejected: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  return (
    <div className="shell">
      <Sidebar />
      <main className="main">
        <section className="topbar" style={{ marginTop: 20 }}>
          <div>
            <h1>Clients</h1>
            <p className="small">Client data and activity log</p>
          </div>
        </section>

        <section className="grid">
          <article className="card">
            <h3>Create Client</h3>
            <form className="form-grid" onSubmit={(event) => void submitClient(event)}>
              <div>
                <label className="small" htmlFor="client-form-name">
                  Client Name
                </label>
                <input
                  id="client-form-name"
                  className="input"
                  type="text"
                  value={clientForm.name}
                  onChange={(e) => setClientForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Input client name"
                />
              </div>
              <div>
                <label className="small" htmlFor="client-form-email">
                  Email
                </label>
                <input
                  id="client-form-email"
                  className="input"
                  type="email"
                  value={clientForm.email}
                  onChange={(e) => setClientForm((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="Input email"
                />
              </div>
              <div>
                <label className="small" htmlFor="client-form-phone">
                  Phone
                </label>
                <input
                  id="client-form-phone"
                  className="input"
                  type="text"
                  value={clientForm.phone}
                  onChange={(e) => setClientForm((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="Input phone number"
                />
              </div>
              <button className="button" type="submit">
                Save Client
              </button>
            </form>
            <p className="small" style={{ marginTop: 10 }}>
              {notice}
            </p>
          </article>

          <article className="card">
            <h3>Client Management</h3>
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Client</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Last Activity</th>
                </tr>
              </thead>
              <tbody>
                {sortedClients.map((client) => (
                  <tr key={client.id}>
                    <td>{clientCode(client.id)}</td>
                    <td>{`${client.first_name} ${client.last_name}`.trim() || client.user_email}</td>
                    <td>{client.user_email}</td>
                    <td>{client.phone}</td>
                    <td>{formatDateTime(client.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </article>
        </section>
      </main>
    </div>
  );
}
