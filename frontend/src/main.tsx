import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import RootLayout from "../app/layout";
import Home from "../app/page";
import BookingPage from "../app/booking/page";
import ClientsPage from "../app/clients/page";
import InvoicesPage from "../app/invoices/page";
import InvoiceDetailPage from "../app/invoices/[id]/page";
import LoginPage from "../app/login/page";
import MonthlyReportPage from "../app/monthly-report/page";
import MonthlyInvoiceListPage from "../app/monthly-report/[month]/page";
import SettingsPage from "../app/settings/page";
import StaffEquipmentPage from "../app/staff-equipment/page";
import { RouterProvider, usePathname, useRouter } from "../app/lib/router";

function RevenueInvoiceRedirect() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const match = pathname.match(/^\/monthly-report\/invoices\/([^/]+)$/);
    const id = match?.[1];
    router.replace(id ? `/invoices/${id}?readonly=1` : "/monthly-report");
  }, [pathname, router]);

  return null;
}

function AppRoutes() {
  const pathname = usePathname();

  if (pathname === "/") return <Home />;
  if (pathname === "/booking") return <BookingPage />;
  if (pathname === "/clients") return <ClientsPage />;
  if (pathname === "/invoices") return <InvoicesPage />;
  if (/^\/invoices\/[^/]+$/.test(pathname)) return <InvoiceDetailPage />;
  if (pathname === "/login") return <LoginPage />;
  if (pathname === "/monthly-report") return <MonthlyReportPage />;
  if (/^\/monthly-report\/invoices\/[^/]+$/.test(pathname)) return <RevenueInvoiceRedirect />;
  if (/^\/monthly-report\/[^/]+$/.test(pathname)) return <MonthlyInvoiceListPage />;
  if (pathname === "/settings") return <SettingsPage />;
  if (pathname === "/staff-equipment") return <StaffEquipmentPage />;

  return <Home />;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider>
      <RootLayout>
        <AppRoutes />
      </RootLayout>
    </RouterProvider>
  </StrictMode>,
);
