"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "./components/sidebar";
import { KpiRow } from "./components/kpi-row";
import { ExecutiveTrendPanel } from "./components/executive-trend-panel";
import { SmartInsightsBox } from "./components/smart-insights-box";
import { SystemHealthCard } from "./components/system-health-card";
import { useTheme } from "./components/theme-provider";
import { apiFetchList, getApiBase } from "./lib/api";
import { bootstrapSupabaseSession, signOutFromSupabase } from "./lib/auth";
type ApiClient = { id: number; first_name: string; last_name: string };
type ApiEngineer = { id: number; name: string; role: "engineer" | "staff"; is_available: boolean };
type ApiRoom = { id: number; name: string };
type ApiBooking = {
  id: number;
  client: number;
  room: number;
  engineer: number;
  start_time: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  created_at: string;
};
type ApiInvoice = {
  id: number;
  booking: number;
  total: number | string;
  status: "unpaid" | "partial" | "paid";
  issued_at: string;
};

export default function Home() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [authName, setAuthName] = useState("Not signed in");
  const [apiStatus, setApiStatus] = useState<"Online" | "Offline" | "Checking">("Checking");
  const [lastSync, setLastSync] = useState("Not synced yet");
  const [clients, setClients] = useState<ApiClient[]>([]);
  const [engineers, setEngineers] = useState<ApiEngineer[]>([]);
  const [rooms, setRooms] = useState<ApiRoom[]>([]);
  const [bookings, setBookings] = useState<ApiBooking[]>([]);
  const [invoices, setInvoices] = useState<ApiInvoice[]>([]);

  const logout = useCallback(() => {
    void signOutFromSupabase().finally(() => {
      setAuthName("Not signed in");
      router.replace("/login");
    });
  }, [router]);

  useEffect(() => {
    let active = true;
    async function loadSession() {
      const session = await bootstrapSupabaseSession();
      if (!active) return;
      const displayName =
        localStorage.getItem("user_name") ??
        localStorage.getItem("username") ??
        localStorage.getItem("name") ??
        session?.user.email ??
        "Not signed in";
      setAuthName(displayName);
    }
    void loadSession();
    return () => {
      active = false;
    };
  }, [logout]);

  useEffect(() => {
    const controller = new AbortController();

    async function checkHealth(): Promise<void> {
      try {
        const response = await fetch(`${getApiBase()}/api/v1/analytics/dashboard/`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          setApiStatus("Offline");
          return;
        }
        setApiStatus("Online");
        setLastSync(new Date().toLocaleString("id-ID"));
      } catch {
        setApiStatus("Offline");
      }
    }

    void checkHealth();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    let active = true;
    async function loadDashboardData(): Promise<void> {
      try {
        const [clientsData, engineersData, roomsData, bookingsData, invoicesData] = await Promise.all([
          apiFetchList<ApiClient>("/api/v1/clients/"),
          apiFetchList<ApiEngineer>("/api/v1/engineers/"),
          apiFetchList<ApiRoom>("/api/v1/rooms/"),
          apiFetchList<ApiBooking>("/api/v1/bookings/"),
          apiFetchList<ApiInvoice>("/api/v1/invoices/"),
        ]);
        if (!active) return;
        setClients(clientsData);
        setEngineers(engineersData);
        setRooms(roomsData);
        setBookings(bookingsData);
        setInvoices(invoicesData);
      } catch {
        if (!active) return;
        setApiStatus("Offline");
      }
    }
    void loadDashboardData();
    return () => {
      active = false;
    };
  }, []);

  const todayKey = new Date().toISOString().slice(0, 10);
  const monthlyRevenue = invoices.reduce((sum, invoice) => sum + Number(invoice.total), 0);
  const unpaidInvoices = invoices.filter((invoice) => invoice.status !== "paid").length;
  const todaysBookings = bookings.filter((booking) => booking.start_time.slice(0, 10) === todayKey).length;
  const paidInvoices = invoices.filter((invoice) => invoice.status === "paid").length;
  const pendingBookings = bookings.filter((booking) => booking.status === "pending").length;
  const availableEngineers = engineers.filter((engineer) => engineer.role === "engineer" && engineer.is_available).length;

  const roomNameById = new Map<number, string>(rooms.map((room) => [room.id, room.name]));

  const recentBookings = [...bookings]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)
    .map((booking) => ({
      time: new Date(booking.created_at).toLocaleString("id-ID"),
      update: `Booking BK-${String(booking.id).padStart(3, "0")} (${roomNameById.get(booking.room) ?? `Room #${booking.room}`}) - ${booking.status}`,
      actor: "System",
    }));

  const periodMonths = 12;
  const monthStarts = Array.from({ length: periodMonths }, (_, idx) => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    d.setMonth(d.getMonth() - (periodMonths - idx - 1));
    return d;
  });
  const trendLabels = monthStarts.map((d) =>
    d.toLocaleDateString("en-US", {
      month: "short",
      year: "2-digit",
    }),
  );
  const revenueTrend = monthStarts.map((monthStart) => {
    const year = monthStart.getFullYear();
    const month = monthStart.getMonth();
    return invoices
      .filter((inv) => {
        const issuedDate = new Date(inv.issued_at);
        return issuedDate.getFullYear() === year && issuedDate.getMonth() === month;
      })
      .reduce((sum, inv) => sum + Number(inv.total), 0);
  });
  const bookingsTrend = monthStarts.map((monthStart) => {
    const year = monthStart.getFullYear();
    const month = monthStart.getMonth();
    return bookings.filter((b) => {
      const startDate = new Date(b.start_time);
      return startDate.getFullYear() === year && startDate.getMonth() === month;
    }).length;
  });
  const utilizationTrend = monthStarts.map((monthStart) => {
    const year = monthStart.getFullYear();
    const month = monthStart.getMonth();
    const activeMonthBookings = bookings.filter((b) => {
      const startDate = new Date(b.start_time);
      return startDate.getFullYear() === year && startDate.getMonth() === month;
    }).length;
    const capacity = Math.max(rooms.length, 1) * 120;
    return Math.min(100, Math.round((activeMonthBookings / capacity) * 100));
  });

  return (
    <div className="shell">
      <Sidebar />

      <main className="main">
        <section className="topbar">
          <div>
            <h1>Dashboard</h1>
            <p className="small">Displays important data, metrics, and activities in real time</p>
          </div>
          <div className="chips">
            <button className="chip" onClick={toggleTheme}>
              Theme: {theme === "light" ? "Light" : "Dark"}
            </button>
            <span className="chip">Signed in: {authName}</span>
            <button className="chip" type="button" onClick={logout}>
              Logout
            </button>
          </div>
        </section>

        <KpiRow monthlyRevenue={monthlyRevenue} activeClients={clients.length} unpaidInvoices={unpaidInvoices} todaysBookings={todaysBookings} />

        <section className="grid">
          <article className="card">
            <h3>1. Recent Activity Feed</h3>
            <table className="table" style={{ marginTop: 8 }}>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Update</th>
                  <th>Actor</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.length === 0 ? (
                  <tr>
                    <td>-</td>
                    <td>No recent booking activity yet</td>
                    <td>System</td>
                  </tr>
                ) : (
                  recentBookings.map((activity) => (
                    <tr key={`${activity.time}-${activity.update}`}>
                      <td>{activity.time}</td>
                      <td>{activity.update}</td>
                      <td>{activity.actor}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </article>

          <ExecutiveTrendPanel labels={trendLabels} revenueTrend={revenueTrend} bookingsTrend={bookingsTrend} utilizationTrend={utilizationTrend} />

          <SmartInsightsBox
            paidInvoices={paidInvoices}
            totalInvoices={invoices.length}
            pendingBookings={pendingBookings}
            availableEngineers={availableEngineers}
            totalEngineers={engineers.filter((engineer) => engineer.role === "engineer").length}
          />

          <SystemHealthCard apiStatus={apiStatus} lastSync={lastSync} />
        </section>
      </main>
    </div>
  );
}
