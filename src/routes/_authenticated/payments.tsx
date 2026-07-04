import { createFileRoute, Link } from "@tanstack/react-router";
import { appQueryOptions, useAppSuspenseQuery } from "@/lib/offline/app-query";
import { useTranslation as useTranslationSafe } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Empty } from "@/components/app-shell";
import { Wallet } from "lucide-react";
import { formatDate, formatDateTimeFull, formatMoney } from "@/lib/format";
import { PaymentDialog } from "@/components/payment-dialog";
import { FilterBar } from "@/components/filter-bar";
import { usePh } from "@/hooks/use-ph";
import { applyFilterState, applyTextFilter } from "@/lib/filters";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { runSoftDelete } from "@/lib/offline/run-write";
import { prefetchRouteQuery } from "@/lib/prefetch-route";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const paymentsQuery = appQueryOptions({
  queryKey: ["payments-all"],
  queryFn: async () => {
    const [payments, settings] = await Promise.all([
      supabase
        .from("payments")
        .select("*,workshops(id,name),clients(id,full_name)")
        .is("deleted_at", null)
        .order("received_date", { ascending: false, nullsFirst: false })
        .limit(1000),
      supabase.from("app_settings").select("base_currency").maybeSingle(),
    ]);
    if (payments.error) throw payments.error;
    return { payments: payments.data ?? [], baseCurrency: settings.data?.base_currency ?? "USD" };
  },
});

export const Route = createFileRoute("/_authenticated/payments")({
  loader: ({ context }) => {
    prefetchRouteQuery(context.queryClient, paymentsQuery);
  },
  component: PaymentsPage,
});

function PaymentsPage() {
  const { data } = useAppSuspenseQuery(paymentsQuery);
  const { t } = useTranslationSafe();
  const ph = usePh();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({ currency: "all", method: "all" });

  let items = applyTextFilter(data.payments, q, ["reference", "notes"] as any);
  items = applyFilterState(items as any[], filters) as typeof data.payments;
  if (filters.currency && filters.currency !== "all") {
    items = items.filter((p) => p.currency === filters.currency);
  }
  if (filters.method && filters.method !== "all") {
    items = items.filter((p) => p.method === filters.method);
  }

  const total = items.reduce((s, p) => s + Number(p.amount_base ?? p.amount), 0);

  async function del(id: string) {
    if (!confirm(t("confirm.deletePaymentRecycle"))) return;
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    await runSoftDelete({
      qc,
      t,
      table: "payments",
      id,
      userId: u.user.id,
    });
  }

  return (
    <div>
      <PageHeader
        title={t("payments.title")}
        description={`${items.length} · ${formatMoney(total, data.baseCurrency)}`}
        action={<PaymentDialog trigger={<Button className="rounded-xl">{t("payments.newPayment")}</Button>} />}
      />

      <FilterBar
        page="payments"
        filters={filters}
        onFiltersChange={setFilters}
        filterDefs={[
          { key: "currency", label: t("filters.currency"), options: [{ value: "USD", label: "USD" }, { value: "LBP", label: "LBP" }] },
          { key: "method", label: t("payments.method"), options: [
            { value: "cash", label: t("payments.methods.cash") },
            { value: "bank_transfer", label: t("payments.methods.bank_transfer") },
            { value: "credit_card", label: t("payments.methods.credit_card") },
            { value: "other", label: t("payments.methods.other") },
          ]},
        ]}
      />

      <div className="surface-card mb-4 flex items-center gap-2 px-4 py-2.5">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={ph.paymentsSearch}
          className="flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground md:text-sm"
        />
      </div>

      {items.length === 0 ? <Empty icon={Wallet} title={t("payments.empty")} /> : (
        <div className="surface-card overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b border-border bg-surface-2 text-start text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Received</th>
                <th className="px-4 py-3 font-medium">Due</th>
                <th className="px-4 py-3 font-medium">Reference</th>
                <th className="px-4 py-3 font-medium">Workshop</th>
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 font-medium">Method</th>
                <th className="px-4 py-3 font-medium text-end">Amount</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((p: any) => (
                <tr key={p.id} className="hover:bg-surface-2/60">
                  <td className="px-4 py-3">
                    <p className="font-medium">{formatDateTimeFull(p.received_date)}</p>
                    {p.created_at && (
                      <p className="mt-0.5 text-[11px] text-muted-foreground">Logged {formatDateTimeFull(p.created_at)}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDateTimeFull(p.due_date)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.reference ?? "—"}</td>
                  <td className="px-4 py-3">
                    {p.workshops?.id ? (
                      <Link to="/workshops/$id" params={{ id: p.workshops.id }} className="hover:text-primary">{p.workshops.name}</Link>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{p.clients?.full_name ?? "—"}</td>
                  <td className="px-4 py-3 capitalize text-muted-foreground">{p.method?.replace(/_/g, " ") ?? "—"}</td>
                  <td className="px-4 py-3 text-end font-semibold num-tabular text-success">{formatMoney(p.amount, p.currency)}</td>
                  <td className="px-4 py-3 text-end">
                    <div className="flex justify-end gap-1">
                      <PaymentDialog payment={p} trigger={<Button variant="ghost" size="icon" className="min-h-11 min-w-11 sm:min-h-9 sm:min-w-9"><Pencil className="h-3.5 w-3.5" /></Button>} />
                      <Button variant="ghost" size="icon" className="min-h-11 min-w-11 sm:min-h-9 sm:min-w-9" onClick={() => del(p.id)}>×</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}
