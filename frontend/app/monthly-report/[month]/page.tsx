"use client";

import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "../../components/language-provider";
import { Sidebar } from "../../components/sidebar";
import { apiFetchPage } from "../../lib/api";
import { formatIdr } from "../../lib/format";
import { Link, useParams, useSearchParams } from "../../lib/router";
import { getStatusClass } from "../../lib/status";

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

export default function MonthlyInvoiceListPage() {
  const { t } = useLanguage();
  const params = useParams<{ month: string }>();
  const searchParams = useSearchParams();
  const monthNumber = Number(params.month);
  const yearFromQuery = Number(searchParams.get("year"));
  const selectedYear = Number.isFinite(yearFromQuery) && yearFromQuery > 0 ? yearFromQuery : new Date().getFullYear();
  const [invoices, setInvoices] = useState<ApiInvoice[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [notice, setNotice] = useState("Loading invoices...");

  useEffect(() => {
    setPage(1);
  }, [monthNumber, selectedYear, pageSize]);

  useEffect(() => {
    if (!Number.isFinite(monthNumber) || monthNumber < 1 || monthNumber > 12) {
      setInvoices([]);
      setTotalPages(1);
      setNotice("Invalid month.");
      return;
    }

    async function loadInvoices() {
      try {
        const data = await apiFetchPage<ApiInvoice>(
          `/api/v1/invoices/?year=${selectedYear}&month=${monthNumber}&page=${page}&page_size=${pageSize}`,
        );
        setInvoices(data.results);
        setTotalPages(Math.max(1, Math.ceil(data.count / pageSize)));
        setNotice("Invoices loaded.");
      } catch {
        setNotice("Failed to load invoices from API.");
      }
    }
    void loadInvoices();
  }, [monthNumber, page, selectedYear, pageSize]);

  const monthLabel = useMemo(() => {
    if (!Number.isFinite(monthNumber) || monthNumber < 1 || monthNumber > 12) return "Unknown Month";
    return new Date(2026, monthNumber - 1, 1).toLocaleString("id-ID", { month: "long" });
  }, [monthNumber]);

  const filteredInvoices = useMemo(() => [...invoices].sort((a, b) => b.id - a.id), [invoices]);

  return (
    <div className="shell">
      <Sidebar />
      <main className="main">
        <section className="topbar" style={{ marginTop: 20 }}>
          <div>
            <h1>Revenue Detail - {monthLabel} {selectedYear}</h1>
            <p className="small">Table list invoice per bulan dengan mode read-only</p>
          </div>
          <Link className="button button-small" href="/monthly-report">
            Back to Revenue
          </Link>
        </section>

        <section className="grid">
          <article className="card">
            <h3>List Invoice</h3>
            <table className="table" style={{ marginTop: 10 }}>
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Booking</th>
                  <th>Tanggal</th>
                  <th>Total</th>
                  <th>Paid</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={7}>Tidak ada invoice pada bulan ini.</td>
                  </tr>
                ) : (
                  filteredInvoices.map((invoice) => (
                    <tr key={invoice.id}>
                      <td>{invoiceCode(invoice.id)}</td>
                      <td>{bookingCode(invoice.booking)}</td>
                      <td>{new Date(invoice.issued_at).toLocaleDateString("id-ID")}</td>
                      <td>{formatIdr(Number(invoice.total))}</td>
                      <td>{formatIdr(Number(invoice.paid_amount))}</td>
                      <td>
                        <span className={getStatusClass(invoice.status)}>{statusLabel(invoice.status)}</span>
                      </td>
                      <td>
                        <Link className="button button-small" href={`/invoices/${invoice.id}?readonly=1`}>
                          Detail
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <p className="small">{notice}</p>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <label className="small" htmlFor="monthly-invoice-page-size" style={{ alignSelf: "center" }}>
                {t("common.rows")}
              </label>
              <select
                id="monthly-invoice-page-size"
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
