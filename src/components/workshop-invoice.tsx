import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDateTime, formatMoneyLocalized } from "@/lib/format";
import { APP_NAME } from "@/lib/brand";
import ar from "@/locales/ar.json";

const L = ar.invoice;
const AR = "ar";

type WorkshopInvoiceProps = {
  workshop: {
    id: string;
    name: string;
    category: string | null;
    description: string | null;
    currency: string;
    price: number;
    discount: number;
    deadline: string | null;
    clients: { full_name: string; company: string | null };
  };
  fin: {
    final_amount?: number;
    final_amount_base?: number;
    paid_base?: number;
    remaining_base?: number;
  } | null;
  payments: {
    amount: number;
    currency: string;
    received_date: string | null;
    method: string | null;
    reference?: string | null;
  }[];
};

function methodLabelAr(method: string | null) {
  if (!method) return "—";
  const key = method as keyof typeof ar.payments.methods;
  return ar.payments.methods[key] ?? method;
}

export function WorkshopInvoice({ workshop: w, fin, payments }: WorkshopInvoiceProps) {
  const { data: settings } = useQuery({
    queryKey: ["settings-invoice"],
    queryFn: async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("business_name,business_email,business_phone,business_address,invoice_footer,logo_url")
        .maybeSingle();
      return data;
    },
    staleTime: 60_000,
  });

  const business = settings?.business_name || APP_NAME;
  const final = Number(fin?.final_amount_base ?? w.price - w.discount);
  const paid = Number(fin?.paid_base ?? 0);
  const remaining = Math.max(final - paid, 0);
  const issuedAt = new Date();

  return (
    <div
      dir="rtl"
      lang="ar"
      className="hidden print:block print-area p-8 text-sm text-foreground"
      style={{ fontFamily: "'IBM Plex Sans Arabic', 'Inter', sans-serif" }}
    >
      <div className="mb-8 flex items-start justify-between gap-6 border-b border-border pb-6">
        <div className="text-start">
          <h1 className="text-2xl font-bold">{business}</h1>
          {settings?.business_address && <p className="mt-1 text-muted-foreground">{settings.business_address}</p>}
          {settings?.business_phone && <p className="text-muted-foreground">{settings.business_phone}</p>}
          {settings?.business_email && <p className="text-muted-foreground">{settings.business_email}</p>}
        </div>
        <div className="text-end">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{L.title}</p>
          <p className="text-lg font-semibold">{w.name}</p>
          <p className="text-muted-foreground">{formatDateTime(issuedAt, AR)}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {L.issued}: {formatDateTime(issuedAt, AR)}
          </p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-6">
        <div className="text-start">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{L.billTo}</p>
          <p className="mt-1 font-medium">{w.clients.full_name}</p>
          {w.clients.company && <p className="text-muted-foreground">{w.clients.company}</p>}
        </div>
        <div className="text-end">
          {w.category && (
            <p>
              <span className="text-muted-foreground">{L.type}:</span> {w.category}
            </p>
          )}
          {w.deadline && (
            <p>
              <span className="text-muted-foreground">{L.due}:</span> {formatDateTime(w.deadline, AR)}
            </p>
          )}
        </div>
      </div>

      <table className="mb-6 w-full border-collapse">
        <thead>
          <tr className="border-b border-border text-start text-xs uppercase text-muted-foreground">
            <th className="py-2 text-start">{L.description}</th>
            <th className="py-2 text-end">{L.amount}</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-border">
            <td className="py-3 text-start">
              <p className="font-medium">{w.name}</p>
              {w.description && <p className="mt-1 text-muted-foreground">{w.description}</p>}
            </td>
            <td className="py-3 text-end font-semibold num-tabular">
              {formatMoneyLocalized(w.price, w.currency, AR)}
            </td>
          </tr>
          {w.discount > 0 && (
            <tr className="border-b border-border">
              <td className="py-2 text-muted-foreground">{L.discount}</td>
              <td className="py-2 text-end num-tabular">−{formatMoneyLocalized(w.discount, w.currency, AR)}</td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="me-auto max-w-xs space-y-1 text-end">
        <p className="flex justify-between gap-8">
          <span className="text-muted-foreground">{L.total}</span>
          <span className="font-semibold num-tabular">{formatMoneyLocalized(final, w.currency, AR)}</span>
        </p>
        <p className="flex justify-between gap-8">
          <span className="text-muted-foreground">{L.paid}</span>
          <span className="num-tabular text-success">{formatMoneyLocalized(paid, w.currency, AR)}</span>
        </p>
        <p className="flex justify-between gap-8 border-t border-border pt-2 text-base font-semibold">
          <span>{L.balanceDue}</span>
          <span className="num-tabular">{formatMoneyLocalized(remaining, w.currency, AR)}</span>
        </p>
      </div>

      {payments.length > 0 && (
        <div className="mt-8">
          <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">{L.paymentsReceived}</p>
          <ul className="space-y-1 text-sm">
            {payments
              .filter((p) => p.received_date)
              .map((p, i) => (
                <li key={i} className="flex justify-between gap-4">
                  <span>
                    {formatDateTime(p.received_date, AR)} · {methodLabelAr(p.method)}
                    {p.reference ? ` · ${p.reference}` : ""}
                  </span>
                  <span className="num-tabular shrink-0">{formatMoneyLocalized(p.amount, p.currency, AR)}</span>
                </li>
              ))}
          </ul>
        </div>
      )}

      {settings?.invoice_footer && (
        <p className="mt-10 border-t border-border pt-4 text-center text-xs text-muted-foreground">
          {settings.invoice_footer}
        </p>
      )}
    </div>
  );
}
