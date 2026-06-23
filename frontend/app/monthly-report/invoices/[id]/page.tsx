import { useEffect } from "react";
import { useParams, useRouter } from "../../../lib/router";

export default function RevenueInvoiceRedirectPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  useEffect(() => {
    router.replace(id ? `/invoices/${id}?readonly=1` : "/monthly-report");
  }, [id, router]);

  return null;
}
