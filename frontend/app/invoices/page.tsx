"use client";

import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "../components/language-provider";
import { Sidebar } from "../components/sidebar";
import { apiFetchPage } from "../lib/api";
import { formatIdr } from "../lib/format";
import { Link } from "../lib/router";
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
  const { t } = useLanguage();
  const [invoices, setInvoices] = useState<ApiInvoice[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [notice, setNotice] = useState("No new notification");
  const sortedInvoices = useMemo(() => [...invoices].sort((a, b) => b.id - a.id), [invoices]);

  useEffect(() => {
    async function loadInvoices() {
      try {
        const data = await apiFetchPage<ApiInvoice>(`/api/v1/invoices/?page=${page}&page_size=${pageSize}`);
        setInvoices(data.results);
        setTotalPages(Math.max(1, Math.ceil(data.count / pageSize)));
      } catch {
        setNotice("Failed to load invoices from API.");
      }
    }
    void loadInvoices();
  }, [page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [pageSize]);

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
                      <Link href={`/invoices/${invoice.id}`}>
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
                        <Link className="button button-small" href={`/invoices/${invoice.id}`}>
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
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <label className="small" htmlFor="invoice-page-size" style={{ alignSelf: "center" }}>
                {t("common.rows")}
              </label>
              <select
                id="invoice-page-size"
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
              <span className="small" style={{ alignSelf: "center" }}>
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
