"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useLanguage } from "../components/language-provider";
import { Sidebar } from "../components/sidebar";
import { apiFetch, apiFetchPage } from "../lib/api";

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
  const { t } = useLanguage();
  const [clients, setClients] = useState<ApiClient[]>([]);
  const [notice, setNotice] = useState("No new client input.");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [clientForm, setClientForm] = useState({
    name: "",
    email: "",
    phone: ""
  });

  useEffect(() => {
    async function loadClients() {
      try {
        const data = await apiFetchPage<ApiClient>(`/api/v1/clients/?page=${page}&page_size=${pageSize}`);
        setClients(data.results);
        setTotalPages(Math.max(1, Math.ceil(data.count / pageSize)));
      } catch {
        setNotice("Failed to load clients from API.");
      }
    }
    void loadClients();
  }, [page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [pageSize]);

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

  async function editClient(client: ApiClient): Promise<void> {
    const currentName = `${client.first_name} ${client.last_name}`.trim();
    const nextName = window.prompt("Edit client name", currentName || client.user_email);
    if (nextName === null) return;
    const nextEmail = window.prompt("Edit client email", client.user_email);
    if (nextEmail === null) return;
    const nextPhone = window.prompt("Edit client phone", client.phone);
    if (nextPhone === null) return;

    const name = nextName.trim();
    const email = nextEmail.trim();
    const phone = nextPhone.trim();
    if (!name || !email || !phone) {
      setNotice("Client update rejected: name, email, and phone are required.");
      return;
    }

    const [first_name, ...rest] = name.split(" ");
    const last_name = rest.join(" ");

    try {
      const updated = await apiFetch<ApiClient>(`/api/v1/clients/${client.id}/`, {
        method: "PATCH",
        body: JSON.stringify({
          first_name,
          last_name,
          email,
          phone
        })
      });
      setClients((prev) => prev.map((item) => (item.id === client.id ? updated : item)));
      setNotice(`Client ${clientCode(client.id)} updated.`);
    } catch (error) {
      setNotice(`Failed to update client ${clientCode(client.id)}: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async function deleteClient(client: ApiClient): Promise<void> {
    const proceed = window.confirm(`Delete client ${clientCode(client.id)}?`);
    if (!proceed) return;
    try {
      await apiFetch<unknown>(`/api/v1/clients/${client.id}/`, { method: "DELETE" });
      setClients((prev) => prev.filter((item) => item.id !== client.id));
      setNotice(`Client ${clientCode(client.id)} deleted.`);
    } catch (error) {
      setNotice(`Failed to delete client ${clientCode(client.id)}: ${error instanceof Error ? error.message : "Unknown error"}`);
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
                  <th>Action</th>
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
                    <td>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button className="button button-small" type="button" onClick={() => void editClient(client)}>
                          Edit
                        </button>
                        <button className="button button-small button-danger" type="button" onClick={() => void deleteClient(client)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ display: "flex", gap: 8, marginTop: 12, alignItems: "center", flexWrap: "wrap" }}>
              <label className="small" htmlFor="client-page-size">
                {t("common.rows")}
              </label>
              <select
                id="client-page-size"
                className="select"
                style={{ width: "auto" }}
                value={String(pageSize)}
                onChange={(e) => setPageSize(Number(e.target.value))}
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="20">20</option>
              </select>
              <button className="button button-small" type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                {t("common.previous")}
              </button>
              <span className="small">
                {t("common.page")} {page} / {totalPages}
              </span>
              <button className="button button-small" type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                {t("common.next")}
              </button>
            </div>
          </article>
        </section>
      </main>
    </div>
  );
}
