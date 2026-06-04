"use client";

import { FormEvent, useEffect, useState } from "react";
import { Sidebar } from "../components/sidebar";
import { apiFetch, apiFetchList } from "../lib/api";
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
  const [engineers, setEngineers] = useState<ApiEngineer[]>([]);
  const [equipments, setEquipments] = useState<ApiEquipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("No new notification");
  const [staffForm, setStaffForm] = useState({ name: "", role: "engineer" as "engineer" | "staff", isAvailable: true });
  const [equipmentForm, setEquipmentForm] = useState({ name: "", status: "ready" as ApiEquipment["status"] });

  useEffect(() => {
    async function loadData() {
      try {
        const [engineerData, equipmentData] = await Promise.all([apiFetchList<ApiEngineer>("/api/v1/engineers/"), apiFetchList<ApiEquipment>("/api/v1/equipment/")]);
        setEngineers(engineerData);
        setEquipments(equipmentData);
      } catch {
        setNotice("Failed to load staff/equipment data from API.");
      } finally {
        setLoading(false);
      }
    }
    void loadData();
  }, []);

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
                      <button className="button button-small button-danger" type="button" onClick={() => void deleteStaff(staff)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
                      <button className="button button-small button-danger" type="button" onClick={() => void deleteEquipment(equipment)}>
                        Delete
                      </button>
                    </td>
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
