import Link from "next/link";
import { useLanguage } from "./language-provider";

export function Sidebar() {
  const { t } = useLanguage();
  return (
    <aside className="sidebar">
      <div className="brand">
        <h2>Stem Studio</h2>
        <p>{t("brand.tagline")}</p>
      </div>
      <nav className="nav">
        <Link href="/">{t("nav.dashboard")}</Link>
        <Link href="/booking">{t("nav.booking")}</Link>
        <Link href="/clients">{t("nav.clients")}</Link>
        <Link href="/staff-equipment">{t("nav.staffEquipment")}</Link>
        <Link href="/invoices">{t("nav.invoices")}</Link>
        <Link href="/monthly-report">{t("nav.revenue")}</Link>
        <Link href="/settings">{t("nav.settings")}</Link>
      </nav>
    </aside>
  );
}
