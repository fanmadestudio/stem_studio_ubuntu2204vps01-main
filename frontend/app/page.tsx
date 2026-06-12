"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "./components/sidebar";
import { KpiRow } from "./components/kpi-row";
import { ExecutiveTrendPanel } from "./components/executive-trend-panel";
import { SmartInsightsBox } from "./components/smart-insights-box";
import { SystemHealthCard } from "./components/system-health-card";
import { useTheme } from "./components/theme-provider";
import { apiFetch, apiFetchPage, getApiBase } from "./lib/api";

const AUTH_NAME_KEY = "studio_name";
const AUTH_EXPIRY_KEY = "auth_expires_at";
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
type DashboardPayload = {
  monthly_revenue: string;
  yearly_revenue: string;
  total_revenue: string;
  utilization_percent: number;
  active_clients: number;
  unpaid_invoices: number;
  total_invoices: number;
  paid_invoices: number;
  pending_bookings: number;
  todays_bookings: number;
  available_engineers: number;
  total_engineers: number;
};
type DashboardTrendsPayload = {
  labels: string[];
  revenue_trend: number[];
  bookings_trend: number[];
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
  const [dashboard, setDashboard] = useState<DashboardPayload | null>(null);
  const [trends, setTrends] = useState<DashboardTrendsPayload | null>(null);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_NAME_KEY);
    localStorage.removeItem(AUTH_EXPIRY_KEY);
    localStorage.removeItem("user_name");
    localStorage.removeItem("username");
    localStorage.removeItem("name");
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("user");
    setAuthName("Not signed in");
    router.replace("/login");
  }, [router]);

  useEffect(() => {
    const accessToken = localStorage.getItem("access");
    const savedName = localStorage.getItem("user_name") ?? localStorage.getItem("username") ?? localStorage.getItem("name") ?? localStorage.getItem(AUTH_NAME_KEY);
    if (!savedName || !accessToken) {
      logout();
      return;
    }

    const now = Date.now();
    const rawExpiry = localStorage.getItem(AUTH_EXPIRY_KEY);
    const parsedExpiry = rawExpiry ? Number(rawExpiry) : NaN;

    if (!Number.isFinite(parsedExpiry) || parsedExpiry <= now) {
      logout();
      return;
    }

    const expiresAt = parsedExpiry;
    setAuthName(savedName);

    const timer = window.setTimeout(
      () => {
        logout();
      },
      Math.max(0, expiresAt - now),
    );

    return () => window.clearTimeout(timer);
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
        const [clientsData, engineersData, roomsData, bookingsData] = await Promise.all([
          apiFetchPage<ApiClient>("/api/v1/clients/?page_size=20"),
          apiFetchPage<ApiEngineer>("/api/v1/engineers/?page_size=20"),
          apiFetchPage<ApiRoom>("/api/v1/rooms/?page_size=20"),
          apiFetchPage<ApiBooking>("/api/v1/bookings/?page_size=5"),
        ]);
        const [analytics, trendPayload] = await Promise.all([
          apiFetch<DashboardPayload>("/api/v1/analytics/dashboard/"),
          apiFetch<DashboardTrendsPayload>("/api/v1/analytics/dashboard-trends/"),
        ]);
        if (!active) return;
        setClients(clientsData.results);
        setEngineers(engineersData.results);
        setRooms(roomsData.results);
        setBookings(bookingsData.results);
        setDashboard(analytics);
        setTrends(trendPayload);
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

  const trendLabels = useMemo(() => trends?.labels ?? [], [trends]);
  const revenueTrend = useMemo(() => trends?.revenue_trend ?? [], [trends]);
  const bookingsTrend = useMemo(() => trends?.bookings_trend ?? [], [trends]);
  const todayKey = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const monthlyRevenueLabel = useMemo(() => `${new Date().toLocaleDateString("en-US", { month: "long" })}'s Revenue`, []);
  const yearlyRevenueLabel = useMemo(() => `${new Date().getFullYear()}'s Revenue`, []);
  const monthlyRevenue = useMemo(() => Number(dashboard?.monthly_revenue ?? 0), [dashboard]);
  const unpaidInvoices = useMemo(() => dashboard?.unpaid_invoices ?? 0, [dashboard]);
  const yearlyRevenue = useMemo(() => Number(dashboard?.yearly_revenue ?? 0), [dashboard]);
  const totalRevenue = useMemo(() => Number(dashboard?.total_revenue ?? 0), [dashboard]);
  const todaysBookings = useMemo(() => dashboard?.todays_bookings ?? bookings.filter((booking) => booking.start_time.slice(0, 10) === todayKey).length, [dashboard, bookings, todayKey]);
  const paidInvoices = useMemo(() => dashboard?.paid_invoices ?? 0, [dashboard]);
  const pendingBookings = useMemo(() => dashboard?.pending_bookings ?? 0, [dashboard]);
  const activeClients = useMemo(() => dashboard?.active_clients ?? clients.length, [dashboard, clients.length]);
  const availableEngineers = useMemo(() => dashboard?.available_engineers ?? engineers.filter((engineer) => engineer.role === "engineer" && engineer.is_available).length, [dashboard, engineers]);
  const totalEngineers = useMemo(() => dashboard?.total_engineers ?? engineers.filter((engineer) => engineer.role === "engineer").length, [dashboard, engineers]);

  const roomNameById = useMemo(() => new Map<number, string>(rooms.map((room) => [room.id, room.name])), [rooms]);
  const recentBookings = useMemo(
    () =>
      [...bookings]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5)
        .map((booking) => ({
          time: new Date(booking.created_at).toLocaleString("id-ID"),
          update: `Booking BK-${String(booking.id).padStart(3, "0")} (${roomNameById.get(booking.room) ?? `Room #${booking.room}`}) - ${booking.status}`,
          actor: "System",
        })),
    [bookings, roomNameById],
  );

  const utilizationTrend = useMemo(
    () =>
      bookingsTrend.map((activeMonthBookings) => {
        const capacity = Math.max(rooms.length, 1) * 120;
        return Math.min(100, Math.round((activeMonthBookings / capacity) * 100));
      }),
    [bookingsTrend, rooms.length],
  );

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

        <KpiRow
          monthlyRevenueLabel={monthlyRevenueLabel}
          yearlyRevenueLabel={yearlyRevenueLabel}
          monthlyRevenue={monthlyRevenue}
          yearlyRevenue={yearlyRevenue}
          totalRevenue={totalRevenue}
          activeClients={activeClients}
          unpaidInvoices={unpaidInvoices}
          todaysBookings={todaysBookings}
          paidInvoices={paidInvoices}
        />

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
            totalInvoices={dashboard?.total_invoices ?? 0}
            pendingBookings={pendingBookings}
            availableEngineers={availableEngineers}
            totalEngineers={totalEngineers}
          />

          <SystemHealthCard apiStatus={apiStatus} lastSync={lastSync} />
        </section>
      </main>
    </div>
  );
}
