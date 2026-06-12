"use client";

import { FormEvent, useEffect, useState } from "react";
import { useLanguage } from "../components/language-provider";
import { Sidebar } from "../components/sidebar";
import { apiFetch, apiFetchPage } from "../lib/api";
import { getStatusClass } from "../lib/status";

type ApiEngineer = {
  id: number;
  name: string;
  role: "engineer" | "staff";
  is_available: boolean;
};

type ApiEquipment = {
  id: number;
  name: string;
  status: "ready" | "maintenance" | "busy";
};

function equipmentStatusLabel(status: ApiEquipment["status"]): "Ready" | "Maintenance" | "Busy" {
  if (status === "ready") return "Ready";
  if (status === "maintenance") return "Maintenance";
  return "Busy";
}

function readableError(error: unknown, fallback: string): string {
  if (!(error instanceof Error)) return fallback;
  const raw = error.message ?? "";
  if (raw.includes("<!DOCTYPE html>") || raw.includes("<html")) {
    return `${fallback} Server returned HTML error page. Please run backend migration and restart backend server.`;
  }
  return `${fallback} ${raw}`;
}

export default function StaffEquipmentPage() {
  const { t } = useLanguage();
  const [engineers, setEngineers] = useState<ApiEngineer[]>([]);
  const [equipments, setEquipments] = useState<ApiEquipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("No new notification");
  const [engineerPage, setEngineerPage] = useState(1);
  const [equipmentPage, setEquipmentPage] = useState(1);
  const [engineerPageSize, setEngineerPageSize] = useState(10);
  const [equipmentPageSize, setEquipmentPageSize] = useState(10);
  const [engineerTotalPages, setEngineerTotalPages] = useState(1);
  const [equipmentTotalPages, setEquipmentTotalPages] = useState(1);
  const [staffForm, setStaffForm] = useState({ name: "", role: "engineer" as "engineer" | "staff", isAvailable: true });
  const [equipmentForm, setEquipmentForm] = useState({ name: "", status: "ready" as ApiEquipment["status"] });

  useEffect(() => {
    async function loadEngineers() {
      try {
        const data = await apiFetchPage<ApiEngineer>(`/api/v1/engineers/?page=${engineerPage}&page_size=${engineerPageSize}`);
        setEngineers(data.results);
        setEngineerTotalPages(Math.max(1, Math.ceil(data.count / engineerPageSize)));
      } catch {
        setNotice("Failed to load staff/equipment data from API.");
      } finally {
        setLoading(false);
      }
    }
    void loadEngineers();
  }, [engineerPage, engineerPageSize]);

  useEffect(() => {
    async function loadEquipment() {
      try {
        const data = await apiFetchPage<ApiEquipment>(`/api/v1/equipment/?page=${equipmentPage}&page_size=${equipmentPageSize}`);
        setEquipments(data.results);
        setEquipmentTotalPages(Math.max(1, Math.ceil(data.count / equipmentPageSize)));
      } catch {
        setNotice("Failed to load staff/equipment data from API.");
      } finally {
        setLoading(false);
      }
    }
    void loadEquipment();
  }, [equipmentPage, equipmentPageSize]);

  useEffect(() => {
    setEngineerPage(1);
  }, [engineerPageSize]);

  useEffect(() => {
    setEquipmentPage(1);
  }, [equipmentPageSize]);

  async function submitStaff(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!staffForm.name.trim()) {
      setNotice("Staff name is required.");
      return;
    }
    try {
      const created = await apiFetch<ApiEngineer>("/api/v1/engineers/", {
        method: "POST",
        body: JSON.stringify({
          name: staffForm.name.trim(),
          role: staffForm.role,
          is_available: staffForm.isAvailable,
        }),
      });
      setEngineers((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setStaffForm({ name: "", role: "engineer", isAvailable: true });
      setNotice(`${created.role === "staff" ? "Staff" : "Engineer"} ${created.name} created.`);
    } catch (error) {
      setNotice(readableError(error, "Failed to create staff."));
    }
  }

  async function submitEquipment(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!equipmentForm.name.trim()) {
      setNotice("Equipment name is required.");
      return;
    }
    try {
      const created = await apiFetch<ApiEquipment>("/api/v1/equipment/", {
        method: "POST",
        body: JSON.stringify({
          name: equipmentForm.name.trim(),
          status: equipmentForm.status,
        }),
      });
      setEquipments((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setEquipmentForm({ name: "", status: "ready" });
      setNotice(`Equipment ${created.name} created.`);
    } catch (error) {
      setNotice(readableError(error, "Failed to create equipment."));
    }
  }

  async function deleteStaff(staff: ApiEngineer): Promise<void> {
    const confirmed = window.confirm(`Delete ${staff.name}?`);
    if (!confirmed) return;
    try {
      await apiFetch<unknown>(`/api/v1/engineers/${staff.id}/`, {
        method: "DELETE",
      });
      setEngineers((prev) => prev.filter((item) => item.id !== staff.id));
      setNotice(`${staff.name} deleted.`);
    } catch (error) {
      setNotice(readableError(error, `Failed to delete ${staff.name}.`));
    }
  }

  async function editStaffStatus(staff: ApiEngineer): Promise<void> {
    const input = window.prompt(`Set status for ${staff.name} (available/busy):`, staff.is_available ? "available" : "busy");
    if (!input) return;
    const normalized = input.trim().toLowerCase();
    if (normalized !== "available" && normalized !== "busy") {
      setNotice("Invalid staff status. Use available or busy.");
      return;
    }

    try {
      const updated = await apiFetch<ApiEngineer>(`/api/v1/engineers/${staff.id}/`, {
        method: "PATCH",
        body: JSON.stringify({
          is_available: normalized === "available",
        }),
      });
      setEngineers((prev) => prev.map((item) => (item.id === staff.id ? updated : item)));
      setNotice(`${staff.name} status updated to ${updated.is_available ? "Available" : "Busy"}.`);
    } catch (error) {
      setNotice(readableError(error, `Failed to update status for ${staff.name}.`));
    }
  }

  async function deleteEquipment(equipment: ApiEquipment): Promise<void> {
    const confirmed = window.confirm(`Delete equipment ${equipment.name}?`);
    if (!confirmed) return;
    try {
      await apiFetch<unknown>(`/api/v1/equipment/${equipment.id}/`, {
        method: "DELETE"
      });
      setEquipments((prev) => prev.filter((item) => item.id !== equipment.id));
      setNotice(`Equipment ${equipment.name} deleted.`);
    } catch (error) {
      setNotice(readableError(error, `Failed to delete equipment ${equipment.name}.`));
    }
  }

  async function editEquipmentStatus(equipment: ApiEquipment): Promise<void> {
    const input = window.prompt(`Set status for ${equipment.name} (ready/maintenance/busy):`, equipment.status);
    if (!input) return;
    const normalized = input.trim().toLowerCase();
    if (normalized !== "ready" && normalized !== "maintenance" && normalized !== "busy") {
      setNotice("Invalid equipment status. Use ready, maintenance, or busy.");
      return;
    }

    try {
      const updated = await apiFetch<ApiEquipment>(`/api/v1/equipment/${equipment.id}/`, {
        method: "PATCH",
        body: JSON.stringify({
          status: normalized,
        }),
      });
      setEquipments((prev) => prev.map((item) => (item.id === equipment.id ? updated : item)));
      setNotice(`Equipment ${equipment.name} status updated to ${equipmentStatusLabel(updated.status)}.`);
    } catch (error) {
      setNotice(readableError(error, `Failed to update status for equipment ${equipment.name}.`));
    }
  }

  return (
    <div className="shell">
      <Sidebar />
      <main className="main">
        <section className="topbar" style={{ marginTop: 20 }}>
          <div>
            <h1>Staff &amp; Equipment</h1>
            <p className="small">Resource and equipment tracking</p>
          </div>
        </section>

        <section className="grid">
          <article className="card">
            <h3>Add Staff / Engineer</h3>
            <p className="small">Create staff so they can be selected in booking form</p>
            <form className="form-grid" onSubmit={(event) => void submitStaff(event)} style={{ marginBottom: 16 }}>
              <div>
                <label className="small" htmlFor="staff-name">
                  Name
                </label>
                <input id="staff-name" className="input" value={staffForm.name} onChange={(e) => setStaffForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="Staff/Engineer name" />
              </div>
              <div>
                <label className="small" htmlFor="staff-role">
                  Role
                </label>
                <select id="staff-role" className="select" value={staffForm.role} onChange={(e) => setStaffForm((prev) => ({ ...prev, role: e.target.value as "engineer" | "staff" }))}>
                  <option value="engineer">Engineer</option>
                  <option value="staff">Staff</option>
                </select>
              </div>
              <div>
                <label className="small" htmlFor="staff-availability">
                  Availability
                </label>
                <select id="staff-availability" className="select" value={staffForm.isAvailable ? "Available" : "Busy"} onChange={(e) => setStaffForm((prev) => ({ ...prev, isAvailable: e.target.value === "Available" }))}>
                  <option value="Available">Available</option>
                  <option value="Busy">Busy</option>
                </select>
              </div>
              <button className="button" type="submit" disabled={loading}>
                Save
              </button>
            </form>
            <p className="small" style={{ marginTop: 4 }}>
              {notice}
            </p>
          </article>

          <article className="card">
            <h3>Staff / Engineer</h3>
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Availability</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {engineers.map((staff) => (
                  <tr key={staff.id}>
                    <td>{staff.name}</td>
                    <td>{staff.role === "staff" ? "Staff" : "Engineer"}</td>
                    <td>
                      <span className={getStatusClass(staff.is_available ? "Available" : "Busy")}>{staff.is_available ? "Available" : "Busy"}</span>
                    </td>
                    <td>
                      <button className="button button-small" type="button" onClick={() => void editStaffStatus(staff)}>
                        Edit
                      </button>{" "}
                      <button className="button button-small button-danger" type="button" onClick={() => void deleteStaff(staff)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ display: "flex", gap: 8, marginTop: 12, alignItems: "center", flexWrap: "wrap" }}>
              <label className="small" htmlFor="engineer-page-size">
                {t("common.rows")}
              </label>
              <select
                id="engineer-page-size"
                className="select"
                style={{ width: "auto" }}
                value={String(engineerPageSize)}
                onChange={(e) => setEngineerPageSize(Number(e.target.value))}
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="20">20</option>
              </select>
              <button
                className="button button-small"
                type="button"
                onClick={() => setEngineerPage((p) => Math.max(1, p - 1))}
                disabled={engineerPage === 1}
              >
                {t("common.previous")}
              </button>
              <span className="small">
                {t("common.page")} {engineerPage} / {engineerTotalPages}
              </span>
              <button className="button button-small" type="button" onClick={() => setEngineerPage((p) => Math.min(engineerTotalPages, p + 1))} disabled={engineerPage >= engineerTotalPages}>
                {t("common.next")}
              </button>
            </div>
          </article>

          <article className="card">
            <h3>Add Equipment</h3>
            <p className="small">Create equipment for tracking and booking usage</p>
            <form className="form-grid" onSubmit={(event) => void submitEquipment(event)} style={{ marginBottom: 16 }}>
              <div>
                <label className="small" htmlFor="equipment-name">
                  Name
                </label>
                <input id="equipment-name" className="input" value={equipmentForm.name} onChange={(e) => setEquipmentForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="Equipment name" />
              </div>
              <div>
                <label className="small" htmlFor="equipment-status">
                  Status
                </label>
                <select id="equipment-status" className="select" value={equipmentForm.status} onChange={(e) => setEquipmentForm((prev) => ({ ...prev, status: e.target.value as ApiEquipment["status"] }))}>
                  <option value="ready">Ready</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="busy">Busy</option>
                </select>
              </div>
              <button className="button" type="submit" disabled={loading}>
                Save Equipment
              </button>
            </form>
          </article>

          <article className="card">
            <h3>Equipment Tracking</h3>
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {equipments.map((equipment) => (
                  <tr key={equipment.id}>
                    <td>{equipment.name}</td>
                    <td>
                      <span className={getStatusClass(equipmentStatusLabel(equipment.status))}>{equipmentStatusLabel(equipment.status)}</span>
                    </td>
                    <td>
                      <button className="button button-small" type="button" onClick={() => void editEquipmentStatus(equipment)}>
                        Edit
                      </button>{" "}
                      <button className="button button-small button-danger" type="button" onClick={() => void deleteEquipment(equipment)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ display: "flex", gap: 8, marginTop: 12, alignItems: "center", flexWrap: "wrap" }}>
              <label className="small" htmlFor="equipment-page-size">
                {t("common.rows")}
              </label>
              <select
                id="equipment-page-size"
                className="select"
                style={{ width: "auto" }}
                value={String(equipmentPageSize)}
                onChange={(e) => setEquipmentPageSize(Number(e.target.value))}
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="20">20</option>
              </select>
              <button
                className="button button-small"
                type="button"
                onClick={() => setEquipmentPage((p) => Math.max(1, p - 1))}
                disabled={equipmentPage === 1}
              >
                {t("common.previous")}
              </button>
              <span className="small">
                {t("common.page")} {equipmentPage} / {equipmentTotalPages}
              </span>
              <button className="button button-small" type="button" onClick={() => setEquipmentPage((p) => Math.min(equipmentTotalPages, p + 1))} disabled={equipmentPage >= equipmentTotalPages}>
                {t("common.next")}
              </button>
            </div>
          </article>
        </section>
      </main>
    </div>
  );
}
