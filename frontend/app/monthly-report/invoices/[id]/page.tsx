import { redirect } from "next/navigation";

type RevenueInvoiceRedirectPageProps = {
  params: Promise<{ id: string }>;
};

export default async function RevenueInvoiceRedirectPage({ params }: RevenueInvoiceRedirectPageProps) {
  const { id } = await params;
  redirect(`/invoices/${id}?readonly=1`);
}
