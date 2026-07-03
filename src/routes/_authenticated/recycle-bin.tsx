import { useTranslation } from "react-i18next";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Empty } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/format";
import { restoreRow } from "@/lib/soft-delete";
import { invalidateAfterRecycleChange } from "@/lib/invalidate-app-data";
import { prefetchRouteQuery } from "@/lib/prefetch-route";
import { useState } from "react";

const recycleQuery = queryOptions({
  queryKey: ["recycle"],
  queryFn: async () => {
    const [clients, workshops, payments, expenses, notes, documents] = await Promise.all([
      supabase.from("clients").select("id,full_name,deleted_at").not("deleted_at", "is", null),
      supabase.from("workshops").select("id,name,deleted_at").not("deleted_at", "is", null),
      supabase.from("payments").select("id,amount,currency,deleted_at").not("deleted_at", "is", null),
      supabase.from("expenses").select("id,name,deleted_at").not("deleted_at", "is", null),
      supabase.from("notes").select("id,body,deleted_at").not("deleted_at", "is", null),
      supabase.from("documents").select("id,file_name,deleted_at").not("deleted_at", "is", null),
    ]);
    return {
      clients: clients.data ?? [], workshops: workshops.data ?? [],
      payments: payments.data ?? [], expenses: expenses.data ?? [],
      notes: notes.data ?? [], documents: documents.data ?? [],
    };
  },
});

export const Route = createFileRoute("/_authenticated/recycle-bin")({
  loader: ({ context }) => {
    prefetchRouteQuery(context.queryClient, recycleQuery);
  },
  component: RecycleBin,
});

const TABLE_KEYS = ["clients", "workshops", "payments", "expenses", "notes", "documents"] as const;

function RecycleBin() {
  const { t } = useTranslation();
  const { data } = useSuspenseQuery(recycleQuery);
  const TABLES = TABLE_KEYS.map((key) => ({
    key,
    table: key as typeof TABLE_KEYS[number],
    label: t(`recyclePage.sections.${key}`),
    field: key === "clients" ? "full_name" : key === "payments" ? "amount" : key === "notes" ? "body" : key === "documents" ? "file_name" : "name",
  }));

  type RowKey = `${string}:${string}`;
  const qc = useQueryClient();
  const d = data as Record<string, any[]>;
  const total = TABLES.reduce((s, tbl) => s + (d[tbl.key]?.length ?? 0), 0);
  const [selected, setSelected] = useState<Set<RowKey>>(new Set());

  function rowKey(table: string, id: string): RowKey {
    return `${table}:${id}`;
  }

  function toggle(table: string, id: string, on: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      const k = rowKey(table, id);
      if (on) next.add(k);
      else next.delete(k);
      return next;
    });
  }

  function toggleSection(table: string, items: any[], on: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const it of items) {
        const k = rowKey(table, it.id);
        if (on) next.add(k);
        else next.delete(k);
      }
      return next;
    });
  }

  async function restore(table: typeof TABLES[number]["table"], id: string) {
    const { error } = await restoreRow(table, id);
    if (error) return toast.error(error.message);
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(rowKey(table, id));
      return next;
    });
    toast.success(t("toasts.restored"));
    invalidateAfterRecycleChange(qc);
  }

  async function restoreSelected() {
    const pairs = [...selected].map((k) => {
      const [table, id] = k.split(":");
      return { table: table as typeof TABLES[number]["table"], id };
    });
    let ok = 0;
    for (const { table, id } of pairs) {
      const { error } = await restoreRow(table, id);
      if (!error) ok++;
    }
    setSelected(new Set());
    toast.success(t("toasts.restoredCount", { count: ok }));
    invalidateAfterRecycleChange(qc);
  }

  async function destroy(table: string, id: string) {
    if (!confirm(t("confirm.permanentDelete"))) return;
    if (table === "documents") {
      const { data: doc } = await supabase.from("documents").select("storage_path").eq("id", id).maybeSingle();
      if (doc?.storage_path) {
        await supabase.storage.from("files").remove([doc.storage_path]);
      }
    }
    const { error } = await (supabase.from(table as any) as any).delete().eq("id", id);
    if (error) return toast.error(error.message);
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(rowKey(table, id));
      return next;
    });
    toast.success(t("toasts.permanentlyDeleted"));
    invalidateAfterRecycleChange(qc);
  }

  return (
    <div>
      <PageHeader
        title={t("recycle.title")}
        description={t("recycle.subtitle")}
        action={selected.size > 0 ? (
          <Button className="rounded-xl" onClick={restoreSelected}>
            <RotateCcw className="me-1.5 h-4 w-4" />{t("recyclePage.restoreSelected", { count: selected.size })}
          </Button>
        ) : undefined}
      />
      {total === 0 ? <Empty icon={Trash2} title={t("recycle.empty")} /> : (
        <div className="space-y-6">
          {TABLES.map((section) => {
            const items = (d[section.key] ?? []) as any[];
            if (items.length === 0) return null;
            const allSelected = items.every((it) => selected.has(rowKey(section.table, it.id)));
            return (
              <section key={section.key} className="surface-card overflow-hidden">
                <div className="flex items-center justify-between gap-3 border-b border-border bg-surface-2 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={(v) => toggleSection(section.table, items, !!v)}
                      aria-label={t("recyclePage.selectAll", { label: section.label })}
                    />
                    <span className="text-sm font-semibold">{section.label} ({items.length})</span>
                  </div>
                </div>
                <ul className="divide-y divide-border">
                  {items.map((it: any) => {
                    const k = rowKey(section.table, it.id);
                    return (
                      <li key={it.id} className="flex items-center justify-between gap-3 px-4 py-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <Checkbox
                            checked={selected.has(k)}
                            onCheckedChange={(v) => toggle(section.table, it.id, !!v)}
                            aria-label={t("recyclePage.selectItem")}
                          />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{String(it[section.field] ?? "—")}</p>
                            <p className="text-xs text-muted-foreground">{t("recyclePage.deleted", { date: formatDate(it.deleted_at) })}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => restore(section.table, it.id)}><RotateCcw className="me-1.5 h-3.5 w-3.5" />{t("recycle.restore")}</Button>
                          <Button variant="ghost" size="icon" onClick={() => destroy(section.table, it.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
