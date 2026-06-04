import Link from "next/link";

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <h2>Stem Studio</h2>
        <p>Recording Management</p>
      </div>
      <nav className="nav">
        <Link href="/">Dashboard</Link>
        <Link href="/booking">Booking</Link>
        <Link href="/clients">Clients</Link>
        <Link href="/staff-equipment">Staff &amp; Equipment</Link>
        <Link href="/invoices">Invoices</Link>
        <Link href="/settings">Settings</Link>
      </nav>
    </aside>
  );
}

