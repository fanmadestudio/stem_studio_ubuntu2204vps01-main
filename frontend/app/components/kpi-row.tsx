import { formatIdr } from "../lib/format";

type KpiRowProps = {
  monthlyRevenueLabel: string;
  yearlyRevenueLabel: string;
  monthlyRevenue: number;
  yearlyRevenue: number;
  totalRevenue: number;
  activeClients: number;
  unpaidInvoices: number;
  todaysBookings: number;
  paidInvoices: number;
};

export function KpiRow({
  monthlyRevenueLabel,
  yearlyRevenueLabel,
  monthlyRevenue,
  yearlyRevenue,
  totalRevenue,
  activeClients,
  unpaidInvoices,
  todaysBookings,
  paidInvoices,
}: KpiRowProps) {
  return (
    <>
      <section className="grid kpi-row kpi-row--revenue">
        <article className="card kpi">
          <p>{monthlyRevenueLabel}</p>
          <h3>{formatIdr(monthlyRevenue)}</h3>
        </article>
        <article className="card kpi">
          <p>{yearlyRevenueLabel}</p>
          <h3>{formatIdr(yearlyRevenue)}</h3>
        </article>
        <article className="card kpi">
          <p>Total Revenue</p>
          <h3>{formatIdr(totalRevenue)}</h3>
        </article>
      </section>

      <section className="grid kpi-row kpi-row--ops">
        <article className="card kpi">
          <p>Active Clients</p>
          <h3>{activeClients}</h3>
        </article>
        <article className="card kpi">
          <p>Unpaid Invoices</p>
          <h3>{unpaidInvoices}</h3>
        </article>
        <article className="card kpi">
          <p>Today&apos;s Booking</p>
          <h3>{todaysBookings}</h3>
        </article>
        <article className="card kpi">
          <p>Paid Invoices</p>
          <h3>{paidInvoices}</h3>
        </article>
      </section>
    </>
  );
}
