import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Empty } from "@/components/app-shell";
import { Briefcase, LayoutGrid, List, Search } from "lucide-react";
import { useState } from "react";
import { formatDate, formatMoney } from "@/lib/format";
import { DEFAULT_CURRENCY } from "@/lib/currency";
import { StatusPill } from "@/components/status-pill";
import { FilterBar } from "@/components/filter-bar";
import { usePh } from "@/hooks/use-ph";
import { prefetchRouteQuery } from "@/lib/prefetch-route";
import { NewWorkshopDialog } from "@/components/workshop-dialog";

const workshopsQuery = queryOptions({
  queryKey: ["workshops"],
  queryFn: async () => {
    const [ws, settings] = await Promise.all([
      supabase
        .from("workshop_financials")
        .select("id,name,client_name,workflow_status,financial_status,remaining_base,final_amount_base,deadline,category,priority,created_at,paid_base")
        .order("created_at", { ascending: false })
        .limit(500),
      supabase.from("app_settings").select("base_currency").maybeSingle(),
    ]);
    if (ws.error) throw ws.error;
    return {
      workshops: ws.data ?? [],
      baseCurrency: settings.data?.base_currency ?? DEFAULT_CURRENCY,
    };
  },
});

export const Route = createFileRoute("/_authenticated/workshops/")({
  loader: ({ context }) => {
    prefetchRouteQuery(context.queryClient, workshopsQuery);
    prefetchRouteQuery(context.queryClient, clientsLite);
  },
  component: WorkshopsPage,
});

const clientsLite = queryOptions({
  queryKey: ["clients-lite"],
  queryFn: async () => {
    const { data, error } = await supabase.from("clients").select("id,full_name").is("deleted_at", null).order("full_name");
    if (error) throw error;
    return data ?? [];
  },
});

const COLUMN_KEYS = ["planning", "in_progress", "waiting", "completed"] as const;

function WorkshopsPage() {
  const { t } = useTranslation();
  const ph = usePh();
  const { data } = useSuspenseQuery(workshopsQuery);
  const workshops = data.workshops;
  const baseCurrency = data.baseCurrency;
  const [view, setView] = useState<"board" | "list">("board");
  const [q, setQ] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({ workflow_status: "all", financial_status: "all", tag: "all" });

  const boardLabels: Record<string, string> = {
    planning: t("workshopsPage.boardPlanning"),
    in_progress: t("workshopsPage.boardInProgress"),
    waiting: t("workshopsPage.boardWaiting"),
    completed: t("workshopsPage.boardCompleted"),
  };
  const financialOptions = ["pending", "partial", "paid", "overdue"].map((v) => ({
    value: v,
    label: t(`statuses.${v}`),
  }));

  const { data: tagData } = useQuery({
    queryKey: ["workshop-tags-filter"],
    queryFn: async () => {
      const [tags, assigns] = await Promise.all([
        supabase.from("workshop_tags").select("id,name,color"),
        supabase.from("workshop_tag_assignments").select("workshop_id,tag_id"),
      ]);
      return { tags: tags.data ?? [], assigns: assigns.data ?? [] };
    },
  });

  let filtered = workshops.filter((w: any) =>
    !q || w.name?.toLowerCase().includes(q.toLowerCase()) || w.client_name?.toLowerCase().includes(q.toLowerCase())
  );
  if (filters.workflow_status && filters.workflow_status !== "all") {
    filtered = filtered.filter((w: any) => w.workflow_status === filters.workflow_status);
  }
  if (filters.financial_status && filters.financial_status !== "all") {
    filtered = filtered.filter((w: any) => w.financial_status === filters.financial_status);
  }
  if (filters.tag && filters.tag !== "all" && tagData) {
    const wsIds = new Set(tagData.assigns.filter((a) => a.tag_id === filters.tag).map((a) => a.workshop_id));
    filtered = filtered.filter((w: any) => wsIds.has(w.id));
  }
  return (
    <div>
      <PageHeader title={t("workshops.title")} description={t("workshopsPage.subtitle")} action={<NewWorkshopDialog />} />

      <FilterBar
        page="workshops"
        filters={filters}
        onFiltersChange={setFilters}
        filterDefs={[
          { key: "workflow_status", label: t("filters.status"), options: COLUMN_KEYS.map((k) => ({ value: k, label: boardLabels[k] })) },
          { key: "financial_status", label: t("filters.financial"), options: financialOptions },
          { key: "tag", label: t("filters.tag"), options: (tagData?.tags ?? []).map((tg) => ({ value: tg.id, label: tg.name })) },
        ]}
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="surface-card flex flex-1 items-center gap-2 px-3 py-2 min-w-[240px]">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={ph.workshop.search} className="flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground md:text-sm" />
        </div>
        <div className="surface-card flex items-center p-1">
          <button onClick={() => setView("board")} className={`grid min-h-11 min-w-11 place-items-center rounded-md sm:h-7 sm:w-7 sm:min-h-0 sm:min-w-0 ${view === "board" ? "bg-surface-2 text-foreground" : "text-muted-foreground"}`}><LayoutGrid className="h-3.5 w-3.5" /></button>
          <button onClick={() => setView("list")} className={`grid min-h-11 min-w-11 place-items-center rounded-md sm:h-7 sm:w-7 sm:min-h-0 sm:min-w-0 ${view === "list" ? "bg-surface-2 text-foreground" : "text-muted-foreground"}`}><List className="h-3.5 w-3.5" /></button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Empty icon={Briefcase} title={t("empty.noWorkshops")} description={t("workshopsPage.emptyDescription")} action={<NewWorkshopDialog />} />
      ) : view === "board" ? (
        <div className="grid gap-4 lg:grid-cols-4">
          {COLUMN_KEYS.map((colKey) => {
            const items = filtered.filter((w: any) => w.workflow_status === colKey);
            return (
              <div key={colKey} className="surface-card p-3">
                <div className="mb-2 flex items-center justify-between px-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{boardLabels[colKey]}</h3>
                  <span className="text-xs text-muted-foreground">{items.length}</span>
                </div>
                <div className="space-y-2">
                  {items.map((w: any) => (
                    <Link key={w.id} to="/workshops/$id" params={{ id: w.id }} className="block rounded-xl border border-border bg-surface-2 p-3 transition-colors hover:border-border-strong">
                      <p className="truncate text-sm font-medium">{w.name}</p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">{w.client_name}{w.category ? ` · ${w.category}` : ""}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <StatusPill status={w.financial_status} kind="financial" />
                        <p className="text-xs font-semibold num-tabular">{formatMoney(w.final_amount_base, baseCurrency)}</p>
                      </div>
                      {w.deadline && <p className="mt-1.5 text-[11px] text-muted-foreground">{t("detail.due", { date: formatDate(w.deadline) })}</p>}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <ul className="surface-card divide-y divide-border">
          {filtered.map((w: any) => (
            <li key={w.id}>
              <Link to="/workshops/$id" params={{ id: w.id }} className="grid grid-cols-[1fr_auto] items-center gap-4 p-4 hover:bg-surface-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium">{w.name}</p>
                    <StatusPill status={w.workflow_status} />
                    <StatusPill status={w.financial_status} kind="financial" />
                  </div>
                  <p className="mt-1 truncate text-xs text-muted-foreground">{w.client_name}{w.category ? ` · ${w.category}` : ""} · {w.deadline ? t("detail.due", { date: formatDate(w.deadline) }) : t("detail.noDeadline")}</p>
                </div>
                <div className="text-right text-xs">
                  <p className="font-semibold num-tabular">{formatMoney(w.final_amount_base, baseCurrency)}</p>
                  <p className="text-muted-foreground">{formatMoney(w.paid_base, baseCurrency)} {t("workshops.paid").toLowerCase()}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
