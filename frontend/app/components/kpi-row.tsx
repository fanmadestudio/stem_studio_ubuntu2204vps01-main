import { formatIdr } from "../lib/format";

type KpiRowProps = {
  monthlyRevenue: number;
  activeClients: number;
  unpaidInvoices: number;
  todaysBookings: number;
};

export function KpiRow({ monthlyRevenue, activeClients, unpaidInvoices, todaysBookings }: KpiRowProps) {

  return (
    <section className="grid kpi-row">
      <article className="card kpi">
        <p>Monthly Revenue</p>
        <h3>
          {formatIdr(monthlyRevenue)}
        </h3>
      </article>
      <article className="card kpi">
        <p>Active Clients</p>
        <h3>{activeClients}</h3>
      </article>
      <article className="card kpi">
        <p>Unpaid Invoices</p>
        <h3>{unpaidInvoices}</h3>
      </article>
      <article className="card kpi">
        <p>Today&apos;s Bookings</p>
        <h3>{todaysBookings}</h3>
      </article>
    </section>
  );
}
