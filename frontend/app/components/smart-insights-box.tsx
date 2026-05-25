type SmartInsightsBoxProps = {
  paidInvoices: number;
  totalInvoices: number;
  pendingBookings: number;
  availableEngineers: number;
  totalEngineers: number;
};

export function SmartInsightsBox({ paidInvoices, totalInvoices, pendingBookings, availableEngineers, totalEngineers }: SmartInsightsBoxProps) {
  const collectionRate = totalInvoices === 0 ? 0 : Math.round((paidInvoices / totalInvoices) * 100);

  return (
    <article className="card">
      <h3>3. Smart Insights Box</h3>
      <p className="small">Live operational summary</p>
      <ul style={{ margin: "10px 0 0", paddingLeft: 18, color: "var(--text)" }}>
        <li>Current invoice collection rate is {collectionRate}%.</li>
        <li>Pending bookings to follow up: {pendingBookings}.</li>
        <li>Available engineers right now: {availableEngineers} of {totalEngineers}.</li>
        <li>Paid invoices: {paidInvoices} of {totalInvoices}.</li>
      </ul>
    </article>
  );
}
