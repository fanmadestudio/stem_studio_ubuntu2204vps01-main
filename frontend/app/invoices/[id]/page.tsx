"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Sidebar } from "../../components/sidebar";
import { apiFetch, apiFetchList } from "../../lib/api";
import { formatIdr } from "../../lib/format";

type ApiInvoice = {
  id: number;
  booking: number;
  total: number | string;
  status: "unpaid" | "partial" | "paid" | "cancelled";
  issued_at: string;
  paid_amount: number | string;
};

type ApiPayment = {
  id: number;
  invoice: number;
  amount: number | string;
  paid_at: string;
  note: string;
};

type ApiBooking = {
  id: number;
  client: number;
  room: number;
  engineer: number;
  start_time: string;
  end_time: string;
  notes: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
};

type ApiClient = { id: number; first_name: string; last_name: string; user_email: string };
type ApiRoom = { id: number; name: string };
type ApiEngineer = { id: number; name: string };
type ApiProfile = { id: number; role: "admin" | "staff" | "client" };

function invoiceCode(id: number): string {
  return `INV-${String(id).padStart(3, "0")}`;
}

function bookingCode(id: number): string {
  return `BK-${String(id).padStart(3, "0")}`;
}

function statusLabel(status: ApiInvoice["status"]): string {
  if (status === "partial") return "PARTIALLY PAID";
  return status.toUpperCase();
}

function parseApiError(error: unknown, fallback: string): string {
  if (!(error instanceof Error)) return fallback;
  const raw = error.message?.trim();
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (typeof parsed.detail === "string" && parsed.detail) return parsed.detail;
  } catch {
    // Keep raw fallback.
  }
  return raw;
}

export default function InvoiceDetailPage() {
  const params = useParams<{ id: string }>();
  const invoiceId = Number(params.id);

  const [invoice, setInvoice] = useState<ApiInvoice | null>(null);
  const [payments, setPayments] = useState<ApiPayment[]>([]);
  const [booking, setBooking] = useState<ApiBooking | null>(null);
  const [clients, setClients] = useState<ApiClient[]>([]);
  const [rooms, setRooms] = useState<ApiRoom[]>([]);
  const [engineers, setEngineers] = useState<ApiEngineer[]>([]);
  const [profile, setProfile] = useState<ApiProfile | null>(null);
  const [savingPayment, setSavingPayment] = useState(false);
  const [deletingPaymentId, setDeletingPaymentId] = useState<number | null>(null);
  const [paymentForm, setPaymentForm] = useState({ amount: "", note: "" });
  const [notice, setNotice] = useState("Loading invoice...");

  useEffect(() => {
    if (!Number.isFinite(invoiceId)) {
      setNotice("Invalid invoice id.");
      return;
    }

    async function loadData() {
      try {
        const [invoiceData, allPayments, clientsData, roomsData, engineersData, profileData] = await Promise.all([
          apiFetch<ApiInvoice>(`/api/v1/invoices/${invoiceId}/`),
          apiFetchList<ApiPayment>("/api/v1/payments/"),
          apiFetchList<ApiClient>("/api/v1/clients/"),
          apiFetchList<ApiRoom>("/api/v1/rooms/"),
          apiFetchList<ApiEngineer>("/api/v1/engineers/"),
          apiFetch<ApiProfile>("/api/v1/auth/profile/")
        ]);
        const bookingData = await apiFetch<ApiBooking>(`/api/v1/bookings/${invoiceData.booking}/`);

        setInvoice(invoiceData);
        setPayments(allPayments.filter((payment) => payment.invoice === invoiceId));
        setBooking(bookingData);
        setClients(clientsData);
        setRooms(roomsData);
        setEngineers(engineersData);
        setProfile(profileData);
        setNotice("Invoice loaded.");
      } catch {
        setNotice("Failed to load invoice detail.");
      }
    }

    void loadData();
  }, [invoiceId]);

  const issuedDate = useMemo(() => {
    if (!invoice?.issued_at) return "-";
    return new Date(invoice.issued_at).toLocaleDateString("id-ID");
  }, [invoice?.issued_at]);

  const bookingStart = useMemo(() => {
    if (!booking?.start_time) return "-";
    return new Date(booking.start_time).toLocaleString("id-ID");
  }, [booking?.start_time]);

  const bookingEnd = useMemo(() => {
    if (!booking?.end_time) return "-";
    return new Date(booking.end_time).toLocaleString("id-ID");
  }, [booking?.end_time]);

  const clientName = useMemo(() => {
    if (!booking) return "-";
    const target = clients.find((client) => client.id === booking.client);
    if (!target) return `Client #${booking.client}`;
    return `${target.first_name} ${target.last_name}`.trim() || target.user_email;
  }, [booking, clients]);

  const roomName = useMemo(() => {
    if (!booking) return "-";
    const target = rooms.find((room) => room.id === booking.room);
    return target?.name ?? `Room #${booking.room}`;
  }, [booking, rooms]);

  const engineerName = useMemo(() => {
    if (!booking) return "-";
    const target = engineers.find((engineer) => engineer.id === booking.engineer);
    return target?.name ?? `Engineer #${booking.engineer}`;
  }, [booking, engineers]);

  const isAdmin = profile?.role === "admin";
  const totalAmount = Number(invoice?.total ?? 0);
  const paidAmount = Number(invoice?.paid_amount ?? 0);
  const balance = Math.max(totalAmount - paidAmount, 0);

  async function refreshInvoiceAndPayments(): Promise<void> {
    const [invoiceData, allPayments] = await Promise.all([
      apiFetch<ApiInvoice>(`/api/v1/invoices/${invoiceId}/`),
      apiFetchList<ApiPayment>("/api/v1/payments/")
    ]);
    setInvoice(invoiceData);
    setPayments(allPayments.filter((payment) => payment.invoice === invoiceId));
  }

  async function submitPayment(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const amount = Number(paymentForm.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setNotice("Payment amount must be greater than 0.");
      return;
    }

    setSavingPayment(true);
    try {
      await apiFetch<ApiPayment>("/api/v1/payments/", {
        method: "POST",
        body: JSON.stringify({
          invoice: invoiceId,
          amount,
          note: paymentForm.note.trim()
        })
      });
      await refreshInvoiceAndPayments();
      setPaymentForm({ amount: "", note: "" });
      setNotice("Payment added.");
    } catch (error) {
      setNotice(parseApiError(error, "Failed to add payment."));
    } finally {
      setSavingPayment(false);
    }
  }

  async function deletePayment(paymentId: number): Promise<void> {
    const proceed = window.confirm("Delete this payment?");
    if (!proceed) return;

    setDeletingPaymentId(paymentId);
    try {
      await apiFetch<undefined>(`/api/v1/payments/${paymentId}/`, { method: "DELETE" });
      await refreshInvoiceAndPayments();
      setNotice(`Payment PMT-${String(paymentId).padStart(3, "0")} deleted.`);
    } catch (error) {
      setNotice(parseApiError(error, "Failed to delete payment."));
    } finally {
      setDeletingPaymentId(null);
    }
  }

  return (
    <div className="shell invoice-shell">
      <Sidebar />
      <main className="main invoice-main">
        <section className="topbar no-print" style={{ marginTop: 20 }}>
          <div>
            <h1>{invoice ? invoiceCode(invoice.id) : "Invoice Detail"}</h1>
            <p className="small">Detailed invoice information and payment history</p>
          </div>
          <button className="button button-small" type="button" onClick={() => window.print()}>
            Export PDF
          </button>
        </section>

        <section className="grid" style={{ marginTop: 20 }}>
          <article className="invoice-paper">
            {invoice ? (
              <>
                <header className="invoice-header">
                  <div>
                    <p className="invoice-kicker">INVOICE</p>
                    <h2 className="invoice-number">{invoiceCode(invoice.id)}</h2>
                  </div>
                  <div className="invoice-meta">
                    <p><strong>Date:</strong> {issuedDate}</p>
                    <p><strong>Booking:</strong> {bookingCode(invoice.booking)}</p>
                    <p><strong>Status:</strong> {statusLabel(invoice.status)}</p>
                  </div>
                </header>

                <section className="invoice-block">
                  <div>
                    <p className="block-title">Billed To</p>
                    <p>{clientName}</p>
                  </div>
                  <div>
                    <p className="block-title">Service Info</p>
                    <p>{roomName}</p>
                    <p>{engineerName}</p>
                    <p>{bookingStart} - {bookingEnd}</p>
                  </div>
                </section>

                <section className="invoice-block">
                  <table className="invoice-table">
                    <thead>
                      <tr>
                        <th>Description</th>
                        <th className="amount-col">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Recording Session ({booking ? bookingCode(booking.id) : "-"})</td>
                        <td className="amount-col">{formatIdr(totalAmount)}</td>
                      </tr>
                    </tbody>
                  </table>
                </section>

                <section className="totals-box">
                  <div><span>Subtotal</span><strong>{formatIdr(totalAmount)}</strong></div>
                  <div><span>Paid</span><strong>{formatIdr(paidAmount)}</strong></div>
                  <div className="balance-row"><span>Balance Due</span><strong>{formatIdr(balance)}</strong></div>
                </section>

                <section className="invoice-block no-print">
                  <h3>Payment Input</h3>
                  <form className="payment-form" onSubmit={(event) => void submitPayment(event)}>
                    <input
                      className="input"
                      type="number"
                      min="1"
                      step="0.01"
                      placeholder="Payment amount"
                      value={paymentForm.amount}
                      onChange={(event) => setPaymentForm((prev) => ({ ...prev, amount: event.target.value }))}
                      required
                    />
                    <input
                      className="input"
                      type="text"
                      placeholder="Optional note"
                      value={paymentForm.note}
                      onChange={(event) => setPaymentForm((prev) => ({ ...prev, note: event.target.value }))}
                    />
                    <button className="button button-small" type="submit" disabled={savingPayment}>
                      {savingPayment ? "Saving..." : "Add Payment"}
                    </button>
                  </form>
                </section>

                <section className="invoice-block">
                  <h3>Payment History</h3>
                  <table className="invoice-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Paid At</th>
                        <th>Note</th>
                        <th className="amount-col">Amount</th>
                        <th className="no-print">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.length === 0 ? (
                        <tr>
                          <td colSpan={5}>No payment history.</td>
                        </tr>
                      ) : (
                        payments.map((payment) => (
                          <tr key={payment.id}>
                            <td>PMT-{String(payment.id).padStart(3, "0")}</td>
                            <td>{new Date(payment.paid_at).toLocaleString("id-ID")}</td>
                            <td>{payment.note || "-"}</td>
                            <td className="amount-col">{formatIdr(Number(payment.amount))}</td>
                            <td className="no-print">
                              {isAdmin ? (
                                <button
                                  className="button button-small button-danger"
                                  type="button"
                                  onClick={() => void deletePayment(payment.id)}
                                  disabled={deletingPaymentId === payment.id}
                                >
                                  {deletingPaymentId === payment.id ? "Deleting..." : "Delete"}
                                </button>
                              ) : (
                                "-"
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </section>

                <footer className="invoice-footer">
                  <p>Notes: {booking?.notes?.trim() ? booking.notes : "Thank you for your business."}</p>
                </footer>
              </>
            ) : (
              <p className="small">{notice}</p>
            )}
          </article>
          {invoice && <p className="small no-print">{notice}</p>}
        </section>
      </main>
      <style jsx>{`
        .invoice-main {
          background: #f5f5f5;
        }

        .invoice-paper {
          background: #ffffff;
          border: 1px solid #1a1a1a;
          border-radius: 4px;
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.08);
          width: 100%;
          max-width: 900px;
          margin: 0 auto;
          padding: 32px;
          color: #0f0f0f;
          font-family: "Trebuchet MS", Arial, sans-serif;
        }

        .invoice-header {
          display: flex;
          justify-content: space-between;
          gap: 24px;
          border-bottom: 2px solid #111;
          padding-bottom: 16px;
        }

        .invoice-kicker {
          margin: 0;
          letter-spacing: 2px;
          font-size: 12px;
        }

        .invoice-number {
          margin: 4px 0 0;
          font-size: 34px;
          letter-spacing: 1px;
        }

        .invoice-meta p {
          margin: 0 0 6px;
          font-size: 13px;
          text-align: right;
        }

        .invoice-block {
          margin-top: 20px;
        }

        .invoice-block h3 {
          font-size: 15px;
          margin-bottom: 10px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .block-title {
          margin: 0 0 6px;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #444;
        }

        .invoice-block p {
          margin: 0 0 4px;
          font-size: 14px;
        }

        .invoice-block:first-of-type {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .invoice-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }

        .invoice-table th,
        .invoice-table td {
          border: 1px solid #222;
          padding: 9px 10px;
          text-align: left;
          vertical-align: top;
        }

        .invoice-table th {
          background: #efefef;
          font-weight: 700;
        }

        .amount-col {
          width: 180px;
          text-align: right !important;
          white-space: nowrap;
        }

        .totals-box {
          margin-top: 20px;
          margin-left: auto;
          width: 320px;
          border: 1px solid #111;
        }

        .totals-box div {
          display: flex;
          justify-content: space-between;
          border-bottom: 1px solid #111;
          padding: 10px 12px;
          font-size: 13px;
        }

        .totals-box div:last-child {
          border-bottom: none;
        }

        .balance-row {
          background: #111;
          color: #fff;
          font-size: 14px !important;
        }

        .payment-form {
          display: grid;
          grid-template-columns: 1fr 1fr auto;
          gap: 10px;
        }

        .invoice-footer {
          margin-top: 24px;
          border-top: 1px solid #111;
          padding-top: 12px;
          font-size: 12px;
          color: #333;
        }

        @media (max-width: 980px) {
          .invoice-paper {
            padding: 18px;
          }

          .invoice-header {
            flex-direction: column;
          }

          .invoice-meta p {
            text-align: left;
          }

          .invoice-block:first-of-type {
            grid-template-columns: 1fr;
          }

          .payment-form {
            grid-template-columns: 1fr;
          }

          .totals-box {
            width: 100%;
          }
        }

        @media print {
          :global(html),
          :global(body) {
            background: #fff !important;
          }

          .no-print,
          :global(.sidebar) {
            display: none !important;
          }

          .invoice-shell {
            display: block !important;
          }

          .invoice-main {
            padding: 0 !important;
            background: #fff !important;
          }

          .invoice-paper {
            max-width: none !important;
            width: auto !important;
            margin: 0 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            border: 1px solid #111 !important;
            page-break-inside: avoid;
          }

          @page {
            size: A4;
            margin: 12mm;
          }
        }
      `}</style>
    </div>
  );
}
