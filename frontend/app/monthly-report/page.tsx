"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "../components/language-provider";
import { Sidebar } from "../components/sidebar";
import { apiFetch } from "../lib/api";
import { formatIdr } from "../lib/format";

type MonthlySummaryRow = {
  year: number;
  monthIndex: number;
  monthLabel: string;
  periodLabel: string;
  totalInvoices: number;
  paidInvoices: number;
  unpaidInvoices: number;
  cancelledInvoices: number;
  totalRevenue: number;
};
type SummaryApiRow = {
  month: number;
  total_invoices: number;
  paid_invoices: number;
  unpaid_invoices: number;
  cancelled_invoices: number;
  total_revenue: string;
};
type SummaryApiPayload = {
  year: number;
  rows: SummaryApiRow[];
  yearly_total: string;
};

type InvoiceDateRangePayload = {
  oldest_issued_at: string | null;
  newest_issued_at: string | null;
};

function monthLabel(monthIndex: number): string {
  return new Date(2026, monthIndex, 1).toLocaleString("id-ID", { month: "long" });
}

function buildMonthRange(startDate: Date, endDate: Date): Array<{ year: number; month: number }> {
  const safeStart = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  const safeEnd = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
  const periods: Array<{ year: number; month: number }> = [];
  const cursor = new Date(safeStart);
  while (cursor <= safeEnd) {
    periods.push({ year: cursor.getFullYear(), month: cursor.getMonth() + 1 });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return periods;
}

export default function MonthlyReportPage() {
  const { t } = useLanguage();
  const [rows, setRows] = useState<MonthlySummaryRow[]>([]);
  const [rangeTotal, setRangeTotal] = useState(0);
  const [notice, setNotice] = useState("");
  const [periodLabel, setPeriodLabel] = useState("-");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    async function loadSummary() {
      try {
        const range = await apiFetch<InvoiceDateRangePayload>("/api/v1/analytics/invoice-date-range/");
        if (!range.oldest_issued_at || !range.newest_issued_at) {
          setRows([]);
          setRangeTotal(0);
          setPeriodLabel("-");
          setNotice("Belum ada data invoice.");
          return;
        }
        const start = new Date(range.oldest_issued_at);
        const end = new Date(range.newest_issued_at);
        const startYear = start.getFullYear();
        const endYear = end.getFullYear();
        const years = Array.from({ length: endYear - startYear + 1 }, (_, idx) => startYear + idx);
        const yearlyPayloads = await Promise.all(
          years.map((year) => apiFetch<SummaryApiPayload>(`/api/v1/analytics/monthly-invoice-summary/?year=${year}`)),
        );
        const allowedPeriods = new Set(buildMonthRange(start, end).map((p) => `${p.year}-${p.month}`));

        const allRows = yearlyPayloads.flatMap((data) =>
          (data.rows ?? []).map((row) => {
            const monthIdx = row.month - 1;
            return {
              year: data.year,
              monthIndex: monthIdx,
              monthLabel: monthLabel(monthIdx),
              periodLabel: `${monthLabel(monthIdx)} ${data.year}`,
              totalInvoices: row.total_invoices,
              paidInvoices: row.paid_invoices,
              unpaidInvoices: row.unpaid_invoices,
              cancelledInvoices: row.cancelled_invoices,
              totalRevenue: Number(row.total_revenue),
            };
          }),
        );

        const mappedRows = allRows
          .filter((row) => allowedPeriods.has(`${row.year}-${row.monthIndex + 1}`))
          .sort((a, b) => (a.year === b.year ? a.monthIndex - b.monthIndex : a.year - b.year));

        setRows(mappedRows);
        setRangeTotal(mappedRows.reduce((acc, row) => acc + row.totalRevenue, 0));
        const nextPeriodLabel = `${monthLabel(start.getMonth())} ${start.getFullYear()} - ${monthLabel(end.getMonth())} ${end.getFullYear()}`;
        setPeriodLabel(nextPeriodLabel);
        setNotice("");
      } catch {
        setNotice("Failed to load invoices from API.");
      }
    }
    void loadSummary();
  }, []);

  async function exportExcel() {
    const XLSX = await import("xlsx");
    const workbookRows = rows.map((row) => ({
      Month: row.periodLabel,
      "Jumlah Invoice": row.totalInvoices,
      Lunas: row.paidInvoices,
      "Belum Lunas/Parsial": row.unpaidInvoices,
      Dibatalkan: row.cancelledInvoices,
      "Total Nilai Invoice (IDR)": row.totalRevenue
    }));

    const worksheet = XLSX.utils.json_to_sheet(workbookRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Bulanan");
    XLSX.writeFile(workbook, `Monthly Revenue-${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  useEffect(() => {
    setPage(1);
  }, [pageSize]);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const paginatedRows = useMemo(
    () => rows.slice((page - 1) * pageSize, page * pageSize),
    [rows, page, pageSize],
  );

  return (
    <div className="shell">
      <Sidebar />
      <main className="main">
        <section className="topbar" style={{ marginTop: 20 }}>
          <div>
            <h1>Montly Revenue</h1>
            <p className="small">Revenue report per bulan dan export ke Excel</p>
          </div>
          <button className="button button-small" onClick={exportExcel} type="button">
            Export Excel
          </button>
        </section>

        <section className="grid">
          <article className="card">
            <h3>Rekap Per Bulan</h3>
            <table className="table" style={{ marginTop: 10 }}>
              <thead>
                <tr>
                  <th>Month</th>
                  <th style={{ textAlign: "center" }}>Jumlah Invoice</th>
                  <th style={{ textAlign: "center" }}>Lunas</th>
                  <th style={{ textAlign: "center" }}>Belum Lunas/Parsial</th>
                  <th style={{ textAlign: "center" }}>Dibatalkan</th>
                  <th style={{ textAlign: "center" }}>Total Nilai Invoice</th>
                  <th style={{ textAlign: "center" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRows.map((row) => (
                  <tr key={`${row.year}-${row.monthIndex + 1}`}>
                    <td style={{ textTransform: "capitalize" }}>{row.periodLabel}</td>
                    <td style={{ textAlign: "center" }}>{row.totalInvoices}</td>
                    <td style={{ textAlign: "center" }}>{row.paidInvoices}</td>
                    <td style={{ textAlign: "center" }}>{row.unpaidInvoices}</td>
                    <td style={{ textAlign: "center" }}>{row.cancelledInvoices}</td>
                    <td style={{ textAlign: "center" }}>{formatIdr(row.totalRevenue)}</td>
                    <td style={{ textAlign: "center" }}>
                      <Link className="button button-small" href={`/monthly-report/${row.monthIndex + 1}?year=${row.year}`}>
                        Detail
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ display: "flex", gap: 8, marginTop: 12, alignItems: "center", flexWrap: "wrap" }}>
              <label className="small" htmlFor="monthly-page-size">
                {t("common.rows")}
              </label>
              <select
                id="monthly-page-size"
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
            <p className="small" style={{ marginTop: 10 }}>
              Total nilai invoice periode {periodLabel}: {formatIdr(rangeTotal)}
            </p>
            {notice ? <p className="small">{notice}</p> : null}
          </article>
        </section>
      </main>
    </div>
  );
}
