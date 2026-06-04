"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "../components/sidebar";
import { apiFetchList } from "../lib/api";
import { formatIdr } from "../lib/format";
import { getStatusClass } from "../lib/status";

type ApiInvoice = {
  id: number;
  booking: number;
  total: number | string;
  status: "unpaid" | "partial" | "paid" | "cancelled";
  issued_at: string;
  paid_amount: number | string;
};

function invoiceCode(id: number): string {
  return `INV-${String(id).padStart(3, "0")}`;
}

function bookingCode(id: number): string {
  return `BK-${String(id).padStart(3, "0")}`;
}

function statusLabel(status: ApiInvoice["status"]): string {
  if (status === "partial") return "Partially Paid";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<ApiInvoice[]>([]);
  const [notice, setNotice] = useState("No new notification");
  const sortedInvoices = useMemo(() => [...invoices].sort((a, b) => b.id - a.id), [invoices]);

  useEffect(() => {
    async function loadInvoices() {
      try {
        const data = await apiFetchList<ApiInvoice>("/api/v1/invoices/");
        setInvoices(data);
      } catch {
        setNotice("Failed to load invoices from API.");
      } finally {
      }
    }
    void loadInvoices();
  }, []);

  return (
    <div className="shell">
      <Sidebar />
      <main className="main">
        <section className="topbar" style={{ marginTop: 20 }}>
          <div>
            <h1>Invoices</h1>
            <p className="small">Invoice generation and payment status tracking</p>
          </div>
        </section>

        <section className="grid">
          <article className="card">
            <h3>Invoice &amp; Payment Tracking</h3>
            <table className="table">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Booking</th>
                  <th>Total</th>
                  <th>Paid</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {sortedInvoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td>
                      <Link href={`/invoices/${invoice.id}`} target="_blank" rel="noopener noreferrer">
                        {invoiceCode(invoice.id)}
                      </Link>
                    </td>
                    <td>{bookingCode(invoice.booking)}</td>
                    <td>{formatIdr(Number(invoice.total))}</td>
                    <td>{formatIdr(Number(invoice.paid_amount))}</td>
                    <td>
                      <span className={getStatusClass(invoice.status)}>{statusLabel(invoice.status)}</span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <Link className="button button-small" href={`/invoices/${invoice.id}`} target="_blank" rel="noopener noreferrer">
                          Detail
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="small" style={{ marginTop: 10 }}>
              {notice}
            </p>
          </article>
        </section>
      </main>
    </div>
  );
}
