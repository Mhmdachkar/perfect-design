import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Empty } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Receipt, Trash2, Pencil } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { formatDate, formatMoney } from "@/lib/format";
import { FilterBar } from "@/components/filter-bar";
import { ExpenseDialog } from "@/components/expense-dialog";
import { invalidateAfterExpenseChange } from "@/lib/invalidate-app-data";
import { prefetchRouteQuery } from "@/lib/prefetch-route";
import { softDeleteRow } from "@/lib/soft-delete";

const expensesQuery = queryOptions({
  queryKey: ["expenses"],
  queryFn: async () => {
    const [exps, settings] = await Promise.all([
      supabase.from("expenses").select("*,clients(full_name),workshops(name)").is("deleted_at", null).order("expense_date", { ascending: false }).limit(500),
      supabase.from("app_settings").select("base_currency").maybeSingle(),
    ]);
    if (exps.error) throw exps.error;
    return { expenses: exps.data ?? [], baseCurrency: settings.data?.base_currency ?? "USD" };
  },
});

export const Route = createFileRoute("/_authenticated/expenses")({
  loader: ({ context }) => {
    prefetchRouteQuery(context.queryClient, expensesQuery);
  },
  component: ExpensesPage,
});

const CATS = ["software", "hardware", "travel", "marketing", "rent", "utilities", "supplies", "freelancer", "other"];

function ExpensesPage() {
  const { t } = useTranslation();
  const { data } = useSuspenseQuery(expensesQuery);
  const qc = useQueryClient();
  const [filters, setFilters] = useState<Record<string, string>>({ category: "all", currency: "all" });

  let items = data.expenses;
  if (filters.category && filters.category !== "all") {
    items = items.filter((e) => e.category === filters.category);
  }
  if (filters.currency && filters.currency !== "all") {
    items = items.filter((e) => e.currency === filters.currency);
  }

  const total = items.reduce((s, e) => s + Number(e.amount_base ?? e.amount), 0);

  async function del(id: string) {
    if (!confirm(t("confirm.deleteExpense"))) return;
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { error } = await softDeleteRow("expenses", id, u.user.id);
    if (error) return toast.error(error.message);
    invalidateAfterExpenseChange(qc);
    toast.success(t("toasts.movedToRecycle"));
  }

  return (
    <div>
      <PageHeader title={t("expenses.title")} description={`${items.length} · ${formatMoney(total, data.baseCurrency)}`} action={<ExpenseDialog />} />

      <FilterBar
        page="expenses"
        filters={filters}
        onFiltersChange={setFilters}
        filterDefs={[
          { key: "category", label: t("filters.category"), options: CATS.map((c) => ({ value: c, label: t(`expenses.categories.${c}`) })) },
          { key: "currency", label: t("filters.currency"), options: [{ value: "USD", label: "USD" }, { value: "LBP", label: "LBP" }] },
        ]}
      />

      {items.length === 0 ? (
        <Empty icon={Receipt} title={t("expenses.empty")} description={t("expenses.emptyDescription")} action={<ExpenseDialog />} />
      ) : (
        <div className="surface-card overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-border bg-surface-2 text-start text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">{t("common.date")}</th>
                <th className="px-4 py-3 font-medium">{t("common.name")}</th>
                <th className="px-4 py-3 font-medium">{t("common.category")}</th>
                <th className="px-4 py-3 font-medium">{t("workshops.client")}</th>
                <th className="px-4 py-3 font-medium text-end">{t("common.amount")}</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((e) => (
                <tr key={e.id} className="hover:bg-surface-2/60">
                  <td className="px-4 py-3">{formatDate(e.expense_date)}</td>
                  <td className="px-4 py-3 font-medium">{e.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{t(`expenses.categories.${e.category}`)}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {(e as any).clients?.full_name ?? (e as any).workshops?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-end font-semibold num-tabular text-destructive">−{formatMoney(e.amount, e.currency)}</td>
                  <td className="px-4 py-3 text-end">
                    <div className="flex justify-end gap-1">
                      <ExpenseDialog expense={e} trigger={<Button variant="ghost" size="icon" className="min-h-11 min-w-11 sm:min-h-9 sm:min-w-9"><Pencil className="h-3.5 w-3.5" /></Button>} />
                      <Button variant="ghost" size="icon" className="min-h-11 min-w-11 sm:min-h-9 sm:min-w-9" onClick={() => del(e.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
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
