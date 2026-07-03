import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Empty } from "@/components/app-shell";
import { AnimatedNumber } from "@/components/animated-number";
import { formatMoney, formatCompact, formatDate, formatDateTimeFull } from "@/lib/format";
import { chartTheme } from "@/lib/chart-theme";
import { Users, Briefcase, TrendingUp, Wallet, AlertCircle, CalendarClock, ArrowUpRight, Receipt, BarChart3 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { parseDashboardLayout, visibleWidgets } from "@/components/dashboard/widget-registry";
import { fetchDashboardKpis } from "@/lib/dashboard-kpis";
import { STAT_WIDGET_LINKS } from "@/lib/dashboard-detail-queries";
import { prefetchRouteQuery } from "@/lib/prefetch-route";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const dashboardData = queryOptions({
  queryKey: ["dashboard"],
  queryFn: async () => {
    const [kpis, settings, upcoming, latestPayments, latestExpenses, paysRes, expsRes] = await Promise.all([
      fetchDashboardKpis(),
      supabase.from("app_settings").select("base_currency,business_name,dashboard_layout").maybeSingle(),
      supabase.from("workshop_financials")
        .select("id,name,client_name,deadline,workflow_status,financial_status,remaining_base,final_amount_base")
        .in("workflow_status", ["planning", "in_progress", "waiting"])
        .order("deadline", { ascending: true, nullsFirst: false })
        .limit(6),
      supabase.from("payments").select("id,amount,currency,received_date,method,reference,workshop_id,client_id,clients(full_name),workshops(name)")
        .is("deleted_at", null).not("received_date", "is", null)
        .order("received_date", { ascending: false }).limit(6),
      supabase.from("expenses").select("id,name,amount,currency,category,expense_date,vendor")
        .is("deleted_at", null).order("expense_date", { ascending: false }).limit(6),
      supabase.from("payments").select("amount,amount_base,currency,received_date").is("deleted_at", null).not("received_date", "is", null).gte("received_date", monthsAgoISO(11)),
      supabase.from("expenses").select("amount,amount_base,currency,expense_date").is("deleted_at", null).gte("expense_date", monthsAgoISO(11)),
    ]);
    for (const res of [settings, upcoming, latestPayments, latestExpenses, paysRes, expsRes]) {
      if (res.error) throw res.error;
    }
    return {
      kpis,
      settings: settings.data ?? { base_currency: "USD", business_name: null, dashboard_layout: null },
      upcoming: upcoming.data ?? [],
      latestPayments: latestPayments.data ?? [],
      latestExpenses: latestExpenses.data ?? [],
      monthly: buildMonthly(paysRes.data ?? [], expsRes.data ?? []),
    };
  },
});

function monthsAgoISO(n: number) {
  const d = new Date(); d.setMonth(d.getMonth() - n); d.setDate(1);
  return d.toISOString().slice(0, 10);
}

function buildMonthly(pays: any[], exps: any[]) {
  const months: { key: string; label: string; revenue: number; expenses: number; profit: number }[] = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    months.push({ key, label: d.toLocaleDateString("en-US", { month: "short" }), revenue: 0, expenses: 0, profit: 0 });
  }
  const idx = new Map(months.map((m, i) => [m.key, i]));
  for (const p of pays) {
    const k = (p.received_date as string).slice(0, 7);
    const i = idx.get(k); if (i == null) continue;
    months[i].revenue += Number(p.amount_base ?? p.amount);
  }
  for (const e of exps) {
    const k = (e.expense_date as string).slice(0, 7);
    const i = idx.get(k); if (i == null) continue;
    months[i].expenses += Number(e.amount_base ?? e.amount);
  }
  for (const m of months) m.profit = m.revenue - m.expenses;
  return months;
}

export const Route = createFileRoute("/_authenticated/dashboard/")({
  loader: ({ context }) => {
    prefetchRouteQuery(context.queryClient, dashboardData);
  },
  component: Dashboard,
});

function Dashboard() {
  const { t } = useTranslation();
  const { data } = useSuspenseQuery(dashboardData);
  const k = data.kpis;
  const ccy = data.settings.base_currency ?? "USD";
  const layout = parseDashboardLayout(data.settings.dashboard_layout);
  const widgets = new Set(visibleWidgets(layout).map((w) => w.widget));
  const show = (id: string) => widgets.has(id);

  const stats = [
    { id: "stat_total_clients", label: t("dashboard.totalClients"), value: k.total_clients ?? 0, icon: Users, fmt: (n: number) => Math.round(n).toString(), tint: "info" },
    { id: "stat_total_workshops", label: t("nav.workshops"), value: k.total_workshops ?? 0, icon: Briefcase, fmt: (n: number) => Math.round(n).toString(), tint: "primary" },
    { id: "stat_revenue", label: t("dashboard.revenue"), value: k.total_revenue ?? 0, icon: TrendingUp, fmt: (n: number) => formatMoney(n, ccy), tint: "success" },
    { id: "stat_received", label: t("workshops.paid"), value: k.total_received ?? 0, icon: Wallet, fmt: (n: number) => formatMoney(n, ccy), tint: "success" },
    { id: "stat_outstanding", label: t("dashboard.outstanding"), value: k.outstanding ?? 0, icon: AlertCircle, fmt: (n: number) => formatMoney(n, ccy), tint: "warning" },
    { id: "stat_today_payments", label: t("dashboard.latestPayments"), value: k.today_received ?? 0, icon: Wallet, fmt: (n: number) => formatMoney(n, ccy), tint: "info" },
    { id: "stat_month_revenue", label: t("dashboardDetail.monthRevenue.shortLabel"), value: k.month_received ?? 0, icon: BarChart3, fmt: (n: number) => formatMoney(n, ccy), tint: "primary" },
    { id: "stat_profit", label: t("dashboard.profit"), value: k.profit ?? 0, icon: TrendingUp, fmt: (n: number) => formatMoney(n, ccy), tint: (k.profit ?? 0) >= 0 ? "success" : "destructive" },
  ].filter((s) => show(s.id));

  return (
    <div>
      <PageHeader
        title={t("dashboard.title")}
        description={t("dashboard.subtitle")}
      />

      {stats.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
          {stats.map((s) => {
            const metric = STAT_WIDGET_LINKS[s.id];
            return (
              <StatCard
                key={s.id}
                {...s}
                metric={metric}
              />
            );
          })}
        </div>
      )}

      {show("chart_revenue") && (
      <Link
        to="/dashboard/revenue-trends"
        className="group/chart surface-card mt-6 block p-5 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-[var(--shadow-elev)] sm:p-7"
      >
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold tracking-tight">{t("dashboardSections.chartTitle")}</h2>
            <p className="text-xs text-muted-foreground">{t("dashboardSections.chartSubtitle", { currency: ccy })}</p>
          </div>
          <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
            <span className="flex items-center gap-1 text-xs text-primary opacity-70 transition-opacity group-hover/chart:opacity-100">
              {t("dashboardDetail.viewDetails")}
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover/chart:translate-x-0.5 group-hover/chart:-translate-y-0.5" />
            </span>
            <div className="hidden gap-4 text-xs text-muted-foreground sm:flex">
              <LegendDot color={chartTheme.revenue} label={t("dashboardSections.revenue")} />
              <LegendDot color={chartTheme.expenses} label={t("dashboardSections.expenses")} />
              <LegendDot color={chartTheme.profit} label={t("dashboardSections.profit")} />
            </div>
          </div>
        </div>
        <div className="h-64 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.monthly} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="g-rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={chartTheme.revenue} stopOpacity={0.45} />
                  <stop offset="100%" stopColor={chartTheme.revenue} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="g-exp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={chartTheme.expenses} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={chartTheme.expenses} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="g-pro" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={chartTheme.profit} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={chartTheme.profit} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 4" stroke={chartTheme.grid} vertical={false} />
              <XAxis dataKey="label" stroke={chartTheme.axis} fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke={chartTheme.axis} fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => formatCompact(v)} width={48} />
              <Tooltip content={<ChartTooltip ccy={ccy} />} />
              <Area type="monotone" dataKey="revenue" stroke={chartTheme.revenue} strokeWidth={2} fill="url(#g-rev)" />
              <Area type="monotone" dataKey="expenses" stroke={chartTheme.expenses} strokeWidth={2} fill="url(#g-exp)" />
              <Area type="monotone" dataKey="profit" stroke={chartTheme.profit} strokeWidth={2} fill="url(#g-pro)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Link>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {show("upcoming_workshops") && (
        <section className="surface-card p-5 sm:p-6">
          <SectionHeader title={t("dashboardSections.upcoming")} link={{ to: "/workshops", label: t("dashboardSections.viewAll") }} />
          {data.upcoming.length === 0 ? (
            <p className="py-6 text-sm text-muted-foreground">{t("empty.noUpcoming")}</p>
          ) : (
            <ul className="divide-y divide-border">
              {data.upcoming.map((w: any) => (
                <li key={w.id}>
                  <Link to="/workshops/$id" params={{ id: w.id }} className="flex items-center gap-3 py-3 group">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-surface-2"><Briefcase className="h-4 w-4 text-primary" /></div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium">{w.name}</p>
                        <StatusBadge status={w.financial_status} />
                      </div>
                      <p className="truncate text-xs text-muted-foreground">{w.client_name} · {w.deadline ? t("detail.due", { date: formatDate(w.deadline) }) : t("detail.noDeadline")}</p>
                    </div>
                    <div className="hidden text-right text-xs sm:block">
                      <p className="font-medium num-tabular">{formatMoney(w.remaining_base, ccy)}</p>
                      <p className="text-muted-foreground">{t("dashboardSections.remaining")}</p>
                    </div>
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
        )}

        {show("latest_payments") && (
        <section className="surface-card p-5 sm:p-6">
          <SectionHeader title={t("dashboardSections.latestPayments")} link={{ to: "/payments", label: t("dashboardSections.viewAll") }} />
          {data.latestPayments.length === 0 ? (
            <p className="py-6 text-sm text-muted-foreground">{t("empty.noPaymentsRecorded")}</p>
          ) : (
            <ul className="divide-y divide-border">
              {data.latestPayments.map((p: any) => (
                <li key={p.id} className="flex items-center gap-3 py-3 group transition-colors hover:bg-surface-2/40 -mx-2 px-2 rounded-lg">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-success/10 text-success"><Wallet className="h-4 w-4" /></div>
                  <div className="min-w-0 flex-1">
                    {p.workshop_id ? (
                      <Link to="/workshops/$id" params={{ id: p.workshop_id }} className="truncate text-sm font-medium hover:text-primary hover:underline">
                        {p.workshops?.name ?? t("detail.payment")}
                      </Link>
                    ) : (
                      <p className="truncate text-sm font-medium">{p.workshops?.name ?? t("detail.payment")}</p>
                    )}
                    <p className="truncate text-xs text-muted-foreground">
                      {p.client_id ? (
                        <Link to="/clients/$id" params={{ id: p.client_id }} className="hover:text-foreground hover:underline">
                          {p.clients?.full_name}
                        </Link>
                      ) : (
                        p.clients?.full_name
                      )}
                      {" · "}{formatDateTimeFull(p.received_date)}
                      {p.reference ? ` · ${p.reference}` : ""}
                    </p>
                  </div>
                  <Link to="/payments" className="text-sm font-semibold num-tabular text-success hover:underline">
                    {formatMoney(p.amount, p.currency)}
                  </Link>
                  {p.workshop_id && (
                    <Link to="/workshops/$id" params={{ id: p.workshop_id }} className="shrink-0">
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
        )}

        {show("latest_expenses") && (
        <section className="surface-card p-5 sm:p-6">
          <SectionHeader title={t("dashboardSections.latestExpenses")} link={{ to: "/expenses", label: t("dashboardSections.viewAll") }} />
          {data.latestExpenses.length === 0 ? (
            <Empty title={t("empty.noExpenses")} description={t("expenses.emptyDescription")} icon={Receipt} />
          ) : (
            <ul className="divide-y divide-border">
              {data.latestExpenses.map((e: any) => (
                <li key={e.id}>
                  <Link
                    to="/expenses"
                    className="flex items-center gap-3 py-3 group transition-colors hover:bg-surface-2/40 -mx-2 px-2 rounded-lg"
                  >
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-destructive/10 text-destructive"><Receipt className="h-4 w-4" /></div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium group-hover:text-primary">{e.name}</p>
                      <p className="truncate text-xs text-muted-foreground capitalize">{e.category} · {formatDate(e.expense_date)}</p>
                    </div>
                    <p className="text-sm font-semibold num-tabular text-destructive">−{formatMoney(e.amount, e.currency)}</p>
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
        )}

        {show("kpi_glance") && (
        <section className="surface-card p-5 sm:p-6">
          <SectionHeader title={t("dashboardSections.kpiGlance")} />
          <dl className="grid grid-cols-2 gap-4">
            <KPI label={t("dashboardSections.collectionRate")} value={`${k.collection_rate ?? 0}%`} to="/dashboard/$metric" params={{ metric: "paid" }} />
            <KPI label={t("dashboardSections.avgPaymentDelay")} value={`${k.avg_payment_delay_days ?? 0}d`} />
            <KPI label={t("dashboardSections.openWorkshops")} value={String(k.open_workshops ?? 0)} to="/workshops" />
            <KPI label={t("dashboardSections.overdueInvoices")} value={String(k.overdue_invoices ?? 0)} tone={k.overdue_invoices ? "warn" : undefined} to="/dashboard/$metric" params={{ metric: "outstanding" }} />
            <KPI label={t("dashboardSections.completed")} value={String(k.completed_workshops ?? 0)} to="/dashboard/$metric" params={{ metric: "workshops" }} />
            <KPI label={t("dashboardSections.monthExpenses")} value={formatMoney(k.month_expenses ?? 0, ccy)} to="/expenses" />
          </dl>
        </section>
        )}
      </div>
    </div>
  );
}

const STAT_CARD_HOVER =
  "group relative surface-card block cursor-pointer overflow-hidden p-4 transition-all duration-300 ease-out hover:-translate-y-1 hover:border-primary/25 hover:shadow-[var(--shadow-elev)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:p-5";

function StatCard({ label, value, icon: Icon, fmt, tint, metric }: any) {
  const { t } = useTranslation();
  const tintMap: Record<string, string> = {
    primary: "bg-primary/10 text-primary group-hover:bg-primary/15",
    success: "bg-success/10 text-success group-hover:bg-success/15",
    warning: "bg-warning/10 text-warning group-hover:bg-warning/15",
    info: "bg-info/10 text-info group-hover:bg-info/15",
    destructive: "bg-destructive/10 text-destructive group-hover:bg-destructive/15",
  };
  const inner = (
    <>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/[0.04] via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />
      <div className="relative mb-3 flex items-center justify-between gap-2">
        <span className="truncate text-xs font-medium text-muted-foreground transition-colors group-hover:text-foreground/80">{label}</span>
        <div className="flex items-center gap-1.5">
          <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-primary opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
          <div className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg transition-colors duration-300 ${tintMap[tint] ?? "bg-surface-2"}`}>
            <Icon className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>
      <AnimatedNumber value={Number(value) || 0} format={fmt} className="relative text-xl font-semibold tracking-tight num-tabular transition-colors group-hover:text-foreground sm:text-2xl" />
      {metric && (
        <p className="relative mt-2 text-[10px] font-medium uppercase tracking-wide text-primary opacity-0 transition-opacity duration-300 group-hover:opacity-70">
          {t("dashboardDetail.viewDetails")}
        </p>
      )}
    </>
  );
  if (metric) {
    return (
      <Link
        to="/dashboard/$metric"
        params={{ metric }}
        className={STAT_CARD_HOVER}
      >
        {inner}
      </Link>
    );
  }
  return <div className="surface-card p-4 sm:p-5">{inner}</div>;
}

function SectionHeader({ title, link }: { title: string; link?: { to: string; label: string } }) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
      {link && <Link to={link.to as any} className="text-xs text-muted-foreground hover:text-foreground">{link.label} →</Link>}
    </div>
  );
}

function KPI({
  label,
  value,
  tone,
  to,
  params,
}: {
  label: string;
  value: string;
  tone?: "warn";
  to?: string;
  params?: Record<string, string>;
}) {
  const inner = (
    <>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={`mt-1 text-lg font-semibold num-tabular ${tone === "warn" ? "text-warning" : ""}`}>{value}</dd>
    </>
  );
  if (!to) return <div>{inner}</div>;
  return (
    <Link
      to={to as any}
      params={params as any}
      className="group rounded-lg border border-transparent p-2 -m-2 transition-all hover:border-border hover:bg-surface-2/50"
    >
      {inner}
    </Link>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} /> {label}</span>;
}

function ChartTooltip({ active, payload, label, ccy }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-popover px-3 py-2 text-xs shadow-[var(--shadow-elev)]">
      <p className="mb-1 font-medium">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="flex items-center justify-between gap-3">
          <span className="capitalize text-muted-foreground">{p.dataKey}</span>
          <span className="font-medium num-tabular">{formatMoney(p.value, ccy)}</span>
        </p>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  const styles: Record<string, string> = {
    paid: "bg-success/15 text-success",
    partial: "bg-info/15 text-info",
    pending: "bg-muted text-muted-foreground",
    cancelled: "bg-muted text-muted-foreground",
    overdue: "bg-destructive/15 text-destructive",
    refunded: "bg-warning/15 text-warning",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${styles[status] ?? "bg-muted text-muted-foreground"}`}>
      {t(`statuses.${status}`, { defaultValue: status })}
    </span>
  );
}

void CalendarClock;
