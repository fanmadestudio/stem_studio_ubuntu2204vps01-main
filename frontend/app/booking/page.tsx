"use client";

import { FormEvent, Fragment, useEffect, useMemo, useState } from "react";
import { Sidebar } from "../components/sidebar";
import { apiFetch, apiFetchList } from "../lib/api";
import { formatIdr } from "../lib/format";
import { getStatusClass } from "../lib/status";

type ApiClient = { id: number; first_name: string; last_name: string; user_email: string };
type ApiRoom = { id: number; name: string; price: number };
type ApiEngineer = { id: number; name: string; role: "engineer" | "staff"; is_available: boolean };
type ApiBooking = {
  id: number;
  client: number;
  room: number;
  engineer: number;
  equipment: number[];
  start_time: string;
  end_time: string;
  notes: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
};

function statusLabel(status: ApiBooking["status"]): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function bookingCode(id: number): string {
  return `BK-${String(id).padStart(3, "0")}`;
}

function parseApiError(error: unknown, fallback: string): string {
  if (!(error instanceof Error)) return fallback;
  const raw = error.message?.trim();
  if (!raw) return fallback;

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (Array.isArray(parsed.non_field_errors) && parsed.non_field_errors[0]) {
      return String(parsed.non_field_errors[0]);
    }
    for (const value of Object.values(parsed)) {
      if (Array.isArray(value) && value[0]) return String(value[0]);
      if (typeof value === "string" && value) return value;
    }
  } catch {
    // Keep raw message fallback.
  }

  return raw;
}

function toLocalDatetimeInput(iso: string): string {
  const dt = new Date(iso);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const d = String(dt.getDate()).padStart(2, "0");
  const hh = String(dt.getHours()).padStart(2, "0");
  const mm = String(dt.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${d}T${hh}:${mm}`;
}

export default function BookingPage() {
  const [clients, setClients] = useState<ApiClient[]>([]);
  const [rooms, setRooms] = useState<ApiRoom[]>([]);
  const [engineers, setEngineers] = useState<ApiEngineer[]>([]);
  const [bookings, setBookings] = useState<ApiBooking[]>([]);
  const [notice, setNotice] = useState<string>("No new notification");
  const [loading, setLoading] = useState(true);
  const [bookingForm, setBookingForm] = useState({
    client: "",
    room: "",
    engineer: "",
    start: "2026-05-14T10:00",
    end: "2026-05-14T12:00",
    notes: ""
  });
  const [roomForm, setRoomForm] = useState({
    name: "",
    price: ""
  });
  const [expandedNotes, setExpandedNotes] = useState<number[]>([]);

  const clientNameById = useMemo(() => {
    const map = new Map<number, string>();
    for (const client of clients) {
      const fullName = `${client.first_name} ${client.last_name}`.trim() || client.user_email;
      map.set(client.id, fullName);
    }
    return map;
  }, [clients]);

  const roomNameById = useMemo(() => new Map(rooms.map((room) => [room.id, room.name])), [rooms]);
  const engineerNameById = useMemo(() => new Map(engineers.map((engineer) => [engineer.id, engineer.name])), [engineers]);
  const availableEngineers = useMemo(
    () => engineers.filter((engineer) => engineer.is_available && engineer.role === "engineer"),
    [engineers]
  );

  const sortedBookings = useMemo(() => [...bookings].sort((a, b) => a.id - b.id), [bookings]);

  useEffect(() => {
    async function loadData() {
      try {
        const [clientsData, roomsData, engineersData, bookingsData] = await Promise.all([
          apiFetchList<ApiClient>("/api/v1/clients/"),
          apiFetchList<ApiRoom>("/api/v1/rooms/"),
          apiFetchList<ApiEngineer>("/api/v1/engineers/"),
          apiFetchList<ApiBooking>("/api/v1/bookings/")
        ]);
        setClients(clientsData);
        setRooms(roomsData);
        setEngineers(engineersData);
        setBookings(bookingsData);
        const firstAvailableEngineer = engineersData.find((engineer) => engineer.is_available);

        setBookingForm((prev) => ({
          ...prev,
          client: clientsData[0] ? String(clientsData[0].id) : "",
          room: roomsData[0] ? String(roomsData[0].id) : "",
          engineer: firstAvailableEngineer ? String(firstAvailableEngineer.id) : ""
        }));
      } catch {
        setNotice("Failed to load booking data from API.");
      } finally {
        setLoading(false);
      }
    }
    void loadData();
  }, []);

  async function submitBooking(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    try {
      const created = await apiFetch<ApiBooking>("/api/v1/bookings/", {
        method: "POST",
        body: JSON.stringify({
          client: Number(bookingForm.client),
          room: Number(bookingForm.room),
          engineer: Number(bookingForm.engineer),
          equipment: [],
          start_time: new Date(bookingForm.start).toISOString(),
          end_time: new Date(bookingForm.end).toISOString(),
          notes: bookingForm.notes.trim(),
          status: "pending"
        })
      });
      setBookings((prev) => [created, ...prev]);
      setBookingForm((prev) => ({ ...prev, notes: "" }));
      setNotice(`Booking ${bookingCode(created.id)} created successfully.`);
    } catch (error) {
      setNotice(`Booking rejected: ${parseApiError(error, "Unknown error")}`);
    }
  }

  async function updateBookingStatus(bookingId: number, nextStatus: ApiBooking["status"]): Promise<void> {
    try {
      const target = bookings.find((booking) => booking.id === bookingId);
      if (!target) return;
      const updated = await apiFetch<ApiBooking>(`/api/v1/bookings/${bookingId}/`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus })
      });
      setBookings((prev) => prev.map((booking) => (booking.id === bookingId ? updated : booking)));
      setNotice(`Booking ${bookingCode(bookingId)} set to ${statusLabel(nextStatus)}.`);
    } catch {
      setNotice(`Failed to update booking ${bookingCode(bookingId)}.`);
    }
  }

  async function submitRoom(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const roomName = roomForm.name.trim();
    const roomPrice = Number(roomForm.price);
    if (!roomName) {
      setNotice("Room name is required.");
      return;
    }
    if (!Number.isFinite(roomPrice) || roomPrice <= 0) {
      setNotice("Room price must be greater than 0.");
      return;
    }

    try {
      const createdRoom = await apiFetch<ApiRoom>("/api/v1/rooms/", {
        method: "POST",
        body: JSON.stringify({ name: roomName, price: roomPrice })
      });
      setRooms((prev) => [...prev, createdRoom].sort((a, b) => a.name.localeCompare(b.name)));
      setBookingForm((prev) => ({ ...prev, room: String(createdRoom.id) }));
      setRoomForm({ name: "", price: "" });
      setNotice(`Room ${createdRoom.name} created.`);
    } catch (error) {
      setNotice(`Failed to create room: ${parseApiError(error, "Unknown error")}`);
    }
  }

  function toggleNotes(bookingId: number): void {
    setExpandedNotes((prev) => (prev.includes(bookingId) ? prev.filter((id) => id !== bookingId) : [...prev, bookingId]));
  }

  async function deleteRoom(room: ApiRoom): Promise<void> {
    const confirmed = window.confirm(`Delete room ${room.name}?`);
    if (!confirmed) return;
    try {
      await apiFetch<unknown>(`/api/v1/rooms/${room.id}/`, {
        method: "DELETE"
      });
      setRooms((prev) => prev.filter((item) => item.id !== room.id));
      setBookingForm((prev) => ({
        ...prev,
        room: prev.room === String(room.id) ? "" : prev.room
      }));
      setNotice(`Room ${room.name} deleted.`);
    } catch (error) {
      setNotice(`Failed to delete room: ${parseApiError(error, "Unknown error")}`);
    }
  }

  return (
    <div className="shell">
      <Sidebar />
      <main className="main">
        <section className="topbar" style={{ marginTop: 20 }}>
          <div>
            <h1>Booking</h1>
            <p className="small">Create and review studio bookings</p>
          </div>
        </section>

        <section className="grid">
          <article className="card">
            <h3>Create Booking</h3>
            <p className="small">Multi-resource scheduling with backend conflict detection</p>
            <form className="form-grid" onSubmit={(event) => void submitBooking(event)}>
              <div>
                <label className="small" htmlFor="client-name">
                  Client Name
                </label>
                <select id="client-name" className="select" value={bookingForm.client} onChange={(e) => setBookingForm((p) => ({ ...p, client: e.target.value }))}>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {clientNameById.get(client.id)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                  <label className="small" htmlFor="room-name">
                  Room
                </label>
                <select id="room-name" className="select" value={bookingForm.room} onChange={(e) => setBookingForm((p) => ({ ...p, room: e.target.value }))}>
                  {rooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.name} - {formatIdr(room.price)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="small" htmlFor="engineer-name">
                  Engineer Name
                </label>
                <select
                  id="engineer-name"
                  className="select"
                  value={bookingForm.engineer}
                  onChange={(e) => setBookingForm((p) => ({ ...p, engineer: e.target.value }))}
                >
                  {availableEngineers.map((engineer) => (
                    <option key={engineer.id} value={engineer.id}>
                      {engineer.name}
                    </option>
                  ))}
                </select>
                {availableEngineers.length === 0 ? (
                  <p className="small" style={{ marginTop: 6 }}>
                    No available engineer. Add one from Staff &amp; Equipment.
                  </p>
                ) : null}
              </div>
              <div style={{ gridColumn: "1 / -1", display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
                <div>
                  <label className="small" htmlFor="start-date-time">
                    Start Date &amp; Time
                  </label>
                  <input id="start-date-time" className="input" type="datetime-local" value={bookingForm.start} onChange={(e) => setBookingForm((p) => ({ ...p, start: e.target.value }))} />
                </div>
                <div>
                  <label className="small" htmlFor="end-date-time">
                    End Date &amp; Time
                  </label>
                  <input id="end-date-time" className="input" type="datetime-local" value={bookingForm.end} onChange={(e) => setBookingForm((p) => ({ ...p, end: e.target.value }))} />
                </div>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label className="small" htmlFor="booking-notes">
                  Notes (max 1000 characters)
                </label>
                <textarea
                  id="booking-notes"
                  className="input"
                  maxLength={1000}
                  rows={4}
                  value={bookingForm.notes}
                  onChange={(e) => setBookingForm((p) => ({ ...p, notes: e.target.value }))}
                  placeholder="Optional booking notes or change/cancellation details"
                  style={{ resize: "vertical", minHeight: 96 }}
                />
                <p className="small" style={{ marginTop: 6 }}>
                  {bookingForm.notes.length}/1000
                </p>
              </div>
              <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "center" }}>
                <button className="button" type="submit" disabled={loading || availableEngineers.length === 0} style={{ minWidth: 280 }}>
                  Save Booking
                </button>
              </div>
            </form>
            <p className="small" style={{ marginTop: 10 }}>
              {notice}
            </p>
          </article>

          <article className="card">
            <h3>Add Room</h3>
            <p className="small">Create room for booking selection</p>
            <form className="form-grid" onSubmit={(event) => void submitRoom(event)}>
              <div>
                <label className="small" htmlFor="room-create-name">
                  Room Name
                </label>
                <input
                  id="room-create-name"
                  className="input"
                  value={roomForm.name}
                  onChange={(e) => setRoomForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Room C"
                />
              </div>
              <div>
                <label className="small" htmlFor="room-create-price">
                  Price
                </label>
                <input
                  id="room-create-price"
                  className="input"
                  type="number"
                  min="1"
                  step="1"
                  value={roomForm.price}
                  onChange={(e) => setRoomForm((prev) => ({ ...prev, price: e.target.value }))}
                  placeholder="1500000"
                />
              </div>
              <button className="button" type="submit" disabled={loading}>
                Save Room
              </button>
            </form>
            <div style={{ marginTop: 14 }}>
              <h3>Room List</h3>
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Price</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rooms.map((room) => (
                    <tr key={room.id}>
                      <td>{room.name}</td>
                      <td>{formatIdr(room.price)}</td>
                      <td>
                        <button className="button button-small button-danger" type="button" onClick={() => void deleteRoom(room)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          <article className="card">
            <h3>Booking Calendar (List View)</h3>
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Client</th>
                  <th>Room</th>
                  <th>Engineer</th>
                  <th>Timeslot</th>
                  <th>Notes</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {sortedBookings.map((booking) => {
                  const hasNotes = booking.notes.trim().length > 0;
                  const isExpanded = expandedNotes.includes(booking.id);
                  return (
                    <Fragment key={booking.id}>
                      <tr>
                        <td>{bookingCode(booking.id)}</td>
                        <td>{clientNameById.get(booking.client) ?? `Client #${booking.client}`}</td>
                        <td>{roomNameById.get(booking.room) ?? `Room #${booking.room}`}</td>
                        <td>{engineerNameById.get(booking.engineer) ?? `Engineer #${booking.engineer}`}</td>
                        <td>
                          {toLocalDatetimeInput(booking.start_time).replace("T", " ")} - {toLocalDatetimeInput(booking.end_time).replace("T", " ")}
                        </td>
                        <td>
                          {hasNotes ? (
                            <button className="button button-small" type="button" onClick={() => toggleNotes(booking.id)}>
                              {isExpanded ? "Hide Notes" : "View Notes"}
                            </button>
                          ) : (
                            <span className="small">-</span>
                          )}
                        </td>
                        <td>
                          <span className={getStatusClass(booking.status)}>{statusLabel(booking.status)}</span>
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <button
                              className="button button-small"
                              type="button"
                              onClick={() => void updateBookingStatus(booking.id, "confirmed")}
                              disabled={booking.status === "confirmed" || booking.status === "completed" || booking.status === "cancelled"}
                            >
                              Confirm
                            </button>
                            <button
                              className="button button-small button-danger"
                              type="button"
                              onClick={() => void updateBookingStatus(booking.id, "cancelled")}
                              disabled={booking.status === "cancelled" || booking.status === "completed"}
                            >
                              Cancel
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded ? (
                        <tr>
                          <td colSpan={8} style={{ whiteSpace: "pre-wrap" }}>
                            <strong>Notes:</strong> {booking.notes}
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </article>
        </section>
      </main>
    </div>
  );
}
