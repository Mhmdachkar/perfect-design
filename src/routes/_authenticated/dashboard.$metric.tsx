import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  fetchDashboardDetail,
  isDashboardMetricSlug,
  type DashboardMetricSlug,
} from "@/lib/dashboard-detail-queries";
import {
  DashboardDetailShell,
  DetailSection,
  DetailTable,
  DetailRow,
  ClientLink,
  WorkshopLink,
  ListPageLink,
} from "@/components/dashboard/dashboard-detail-shell";
import { prefetchRouteQuery } from "@/lib/prefetch-route";
import { formatMoney, formatDate, formatDateTimeFull } from "@/lib/format";
import { StatusPill } from "@/components/status-pill";
import { chartTheme } from "@/lib/chart-theme";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { formatCompact } from "@/lib/format";

const detailQuery = (metric: DashboardMetricSlug) =>
  queryOptions({
    queryKey: ["dashboard-detail", metric],
    queryFn: () => fetchDashboardDetail(metric),
  });

export const Route = createFileRoute("/_authenticated/dashboard/$metric")({
  beforeLoad: ({ params }) => {
    if (!isDashboardMetricSlug(params.metric)) {
      throw redirect({ to: "/dashboard" });
    }
  },
  loader: ({ context, params }) => {
    prefetchRouteQuery(context.queryClient, detailQuery(params.metric as DashboardMetricSlug));
  },
  component: DashboardMetricPage,
});

function DashboardMetricPage() {
  const { metric } = Route.useParams();
  const { data } = useSuspenseQuery(detailQuery(metric as DashboardMetricSlug));
  const { t } = useTranslation();
  const ccy = data.ccy;
  const k = data.kpis;

  const meta = {
    title: t(`dashboardDetail.${metric}.title`),
    description: t(`dashboardDetail.${metric}.description`),
    formula: t(`dashboardDetail.${metric}.formula`),
  };

  switch (metric) {
    case "clients":
      return (
        <DashboardDetailShell
          {...meta}
          totalLabel={t("dashboard.totalClients")}
          totalDisplay={String(data.total ?? k.total_clients)}
          summaries={[
            { label: t("dashboardDetail.withWorkshops"), value: String((data.rows as any[]).filter((r) => r.workshops > 0).length) },
            { label: t("dashboard.revenue"), value: formatMoney(k.total_revenue, ccy), to: "/dashboard/$metric", params: { metric: "revenue" } },
            { label: t("dashboard.outstanding"), value: formatMoney(k.outstanding, ccy), tone: k.outstanding > 0 ? "warn" : undefined, to: "/dashboard/$metric", params: { metric: "outstanding" } },
          ]}
          relatedLinks={[
            { label: t("nav.workshops"), value: "", to: "/dashboard/$metric", params: { metric: "workshops" } },
            { label: t("workshops.paid"), value: "", to: "/dashboard/$metric", params: { metric: "paid" } },
            { label: t("nav.clients"), value: "", to: "/clients" },
          ]}
        >
          <DetailSection
            title={t("dashboardDetail.clients.breakdown")}
            action={<ListPageLink to="/clients">{t("dashboardSections.viewAll")}</ListPageLink>}
          >
            {(data.rows as any[]).length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">{t("empty.noClients")}</p>
            ) : (
              <DetailTable
                headers={[
                  t("common.name"),
                  t("clientsPage.phone"),
                  t("dashboardDetail.workshopCount"),
                  t("dashboard.revenue"),
                  t("workshops.paid"),
                  t("dashboard.outstanding"),
                ]}
              >
                {(data.rows as any[]).map((r) => (
                  <DetailRow
                    key={r.id}
                    navigateTo={{ to: "/clients/$id", params: { id: r.id } }}
                    cells={[
                      <ClientLink id={r.id} name={r.name} />,
                      r.phone ?? "—",
                      r.workshops > 0 ? (
                        <Link
                          to="/clients/$id"
                          params={{ id: r.id }}
                          className="font-medium num-tabular hover:text-primary hover:underline"
                        >
                          {r.workshops}
                        </Link>
                      ) : (
                        r.workshops
                      ),
                      formatMoney(r.revenue, ccy),
                      formatMoney(r.paid, ccy),
                      r.outstanding > 0 ? (
                        <Link
                          to="/dashboard/$metric"
                          params={{ metric: "outstanding" }}
                          className="font-semibold text-warning num-tabular hover:underline"
                        >
                          {formatMoney(r.outstanding, ccy)}
                        </Link>
                      ) : (
                        <span className="num-tabular">{formatMoney(r.outstanding, ccy)}</span>
                      ),
                    ]}
                  />
                ))}
              </DetailTable>
            )}
          </DetailSection>
        </DashboardDetailShell>
      );

    case "workshops":
      return (
        <DashboardDetailShell
          {...meta}
          totalLabel={t("nav.workshops")}
          totalDisplay={String(data.total ?? k.total_workshops)}
          summaries={[
            { label: t("dashboardSections.openWorkshops"), value: String(k.open_workshops), to: "/workshops" },
            { label: t("dashboardSections.completed"), value: String(k.completed_workshops) },
            { label: t("dashboard.revenue"), value: formatMoney(k.total_revenue, ccy), to: "/dashboard/$metric", params: { metric: "revenue" } },
          ]}
          relatedLinks={[
            { label: t("dashboard.outstanding"), value: "", to: "/dashboard/$metric", params: { metric: "outstanding" } },
            { label: t("workshops.paid"), value: "", to: "/dashboard/$metric", params: { metric: "paid" } },
            { label: t("nav.clients"), value: "", to: "/dashboard/$metric", params: { metric: "clients" } },
          ]}
        >
          <DetailSection
            title={t("dashboardDetail.workshops.breakdown")}
            action={<ListPageLink to="/workshops">{t("dashboardSections.viewAll")}</ListPageLink>}
          >
            <DetailTable
              headers={[
                t("common.name"),
                t("workshops.client"),
                t("common.status"),
                t("workshops.financialStatus"),
                t("dashboard.revenue"),
                t("workshops.paid"),
                t("workshops.remaining"),
              ]}
            >
              {(data.rows as any[]).map((w) => (
                <DetailRow
                  key={w.id}
                  navigateTo={w.id ? { to: "/workshops/$id", params: { id: w.id } } : undefined}
                  cells={[
                    <WorkshopLink id={w.id} name={w.name} />,
                    <ClientLink id={w.client_id} name={w.client_name} />,
                    <StatusPill status={w.workflow_status} />,
                    <StatusPill status={w.financial_status} kind="financial" />,
                    formatMoney(w.final_amount_base, ccy),
                    formatMoney(w.paid_base, ccy),
                    w.remaining_base > 0 ? (
                      <span className="font-semibold text-warning num-tabular">{formatMoney(w.remaining_base, ccy)}</span>
                    ) : (
                      formatMoney(w.remaining_base, ccy)
                    ),
                  ]}
                />
              ))}
            </DetailTable>
          </DetailSection>
        </DashboardDetailShell>
      );

    case "revenue":
      return (
        <DashboardDetailShell
          {...meta}
          totalLabel={t("dashboard.revenue")}
          totalDisplay={formatMoney(data.total ?? k.total_revenue, ccy)}
          summaries={[
            { label: t("workshops.paid"), value: formatMoney(k.total_received, ccy), tone: "success", to: "/dashboard/$metric", params: { metric: "paid" } },
            { label: t("dashboard.outstanding"), value: formatMoney(k.outstanding, ccy), tone: "warn", to: "/dashboard/$metric", params: { metric: "outstanding" } },
            { label: t("dashboardDetail.invoiceCount"), value: String((data.rows as any[]).length) },
          ]}
          relatedLinks={[
            { label: t("dashboard.profit"), value: "", to: "/dashboard/$metric", params: { metric: "profit" } },
            { label: t("dashboardDetail.revenue-trends.title"), value: "", to: "/dashboard/$metric", params: { metric: "revenue-trends" } },
          ]}
        >
          <DetailSection title={t("dashboardDetail.revenue.breakdown")}>
            <DetailTable
              headers={[
                t("common.name"),
                t("workshops.client"),
                t("workshops.price"),
                t("invoice.discount"),
                t("common.total"),
                t("workshops.financialStatus"),
              ]}
            >
              {(data.rows as any[]).map((w) => (
                <DetailRow
                  key={w.id}
                  navigateTo={w.id ? { to: "/workshops/$id", params: { id: w.id } } : undefined}
                  cells={[
                    <WorkshopLink id={w.id} name={w.name} />,
                    <ClientLink id={w.client_id} name={w.client_name} />,
                    formatMoney(w.price, w.currency ?? ccy),
                    formatMoney(w.discount ?? 0, w.currency ?? ccy),
                    <span className="font-semibold num-tabular">{formatMoney(w.final_amount_base, ccy)}</span>,
                    <StatusPill status={w.financial_status} kind="financial" />,
                  ]}
                />
              ))}
            </DetailTable>
          </DetailSection>
        </DashboardDetailShell>
      );

    case "paid":
      return (
        <DashboardDetailShell
          {...meta}
          totalLabel={t("workshops.paid")}
          totalDisplay={formatMoney(data.total ?? k.total_received, ccy)}
          summaries={[
            { label: t("dashboardDetail.paymentCount"), value: String((data.rows as any[]).length) },
            { label: t("dashboardSections.collectionRate"), value: `${k.collection_rate}%` },
            { label: t("dashboard.revenue"), value: formatMoney(k.total_revenue, ccy), to: "/dashboard/$metric", params: { metric: "revenue" } },
          ]}
          relatedLinks={[
            { label: t("dashboard.latestPayments"), value: "", to: "/dashboard/$metric", params: { metric: "today-payments" } },
            { label: t("dashboardDetail.monthRevenue.title"), value: "", to: "/dashboard/$metric", params: { metric: "month-revenue" } },
            { label: t("nav.payments"), value: "", to: "/payments" },
          ]}
        >
          <DetailSection
            title={t("dashboardDetail.paid.breakdown")}
            action={<ListPageLink to="/payments">{t("dashboardSections.viewAll")}</ListPageLink>}
          >
            <DetailTable
              headers={[
                t("common.date"),
                t("workshops.client"),
                t("nav.workshops"),
                t("payments.method"),
                t("payments.reference"),
                t("common.amount"),
              ]}
            >
              {(data.rows as any[]).map((p) => (
                <DetailRow
                  key={p.id}
                  navigateTo={
                    p.workshop_id
                      ? { to: "/workshops/$id", params: { id: p.workshop_id } }
                      : p.client_id
                        ? { to: "/clients/$id", params: { id: p.client_id } }
                        : undefined
                  }
                  cells={[
                    formatDateTimeFull(p.received_date),
                    <ClientLink id={p.client_id} name={p.clients?.full_name} />,
                    <WorkshopLink id={p.workshop_id} name={p.workshops?.name} />,
                    t(`payments.methods.${p.method}`, { defaultValue: p.method }),
                    p.reference ?? "—",
                    <span className="font-semibold text-success num-tabular">{formatMoney(p.base, p.currency)}</span>,
                  ]}
                />
              ))}
            </DetailTable>
          </DetailSection>
        </DashboardDetailShell>
      );

    case "outstanding":
      return (
        <DashboardDetailShell
          {...meta}
          totalLabel={t("dashboard.outstanding")}
          totalDisplay={formatMoney(data.total ?? k.outstanding, ccy)}
          summaries={[
            { label: t("dashboardDetail.unpaidWorkshops"), value: String((data.rows as any[]).length) },
            { label: t("dashboardSections.overdueInvoices"), value: String(k.overdue_invoices), tone: k.overdue_invoices ? "warn" : undefined },
            { label: t("dashboardSections.collectionRate"), value: `${k.collection_rate}%`, to: "/dashboard/$metric", params: { metric: "paid" } },
          ]}
          relatedLinks={[
            { label: t("workshops.paid"), value: "", to: "/dashboard/$metric", params: { metric: "paid" } },
            { label: t("dashboard.revenue"), value: "", to: "/dashboard/$metric", params: { metric: "revenue" } },
            { label: t("nav.workshops"), value: "", to: "/workshops" },
          ]}
        >
          <DetailSection title={t("dashboardDetail.outstanding.breakdown")}>
            {(data.rows as any[]).length === 0 ? (
              <p className="p-6 text-sm text-success">{t("dashboardDetail.outstanding.allPaid")}</p>
            ) : (
              <DetailTable
                headers={[
                  t("common.name"),
                  t("workshops.client"),
                  t("common.total"),
                  t("workshops.paid"),
                  t("workshops.remaining"),
                  t("workshops.financialStatus"),
                  t("dashboardDetail.whyOutstanding"),
                ]}
              >
                {(data.rows as any[]).map((w) => (
                  <DetailRow
                    key={w.id}
                    navigateTo={w.id ? { to: "/workshops/$id", params: { id: w.id } } : undefined}
                    cells={[
                      <WorkshopLink id={w.id} name={w.name} />,
                      <ClientLink id={w.client_id} name={w.client_name} />,
                      formatMoney(w.final_amount_base, ccy),
                      formatMoney(w.paid_base, ccy),
                      <span className="font-semibold text-warning num-tabular">{formatMoney(w.remaining_base, ccy)}</span>,
                      <StatusPill status={w.financial_status} kind="financial" />,
                      t(`dashboardDetail.outstanding.reason.${w.financial_status ?? "partial"}`, {
                        defaultValue: t("dashboardDetail.outstanding.reason.partial"),
                      }),
                    ]}
                  />
                ))}
              </DetailTable>
            )}
          </DetailSection>
        </DashboardDetailShell>
      );

    case "today-payments":
      return (
        <DashboardDetailShell
          {...meta}
          totalLabel={t("dashboard.latestPayments")}
          totalDisplay={formatMoney(data.total ?? k.today_received, ccy)}
          summaries={[
            { label: t("dashboardDetail.paymentCount"), value: String((data.rows as any[]).length) },
            { label: t("dashboardDetail.todayDate"), value: formatDate(new Date().toISOString()) },
            { label: t("dashboardDetail.monthRevenue.shortLabel"), value: formatMoney(k.month_received, ccy), to: "/dashboard/$metric", params: { metric: "month-revenue" } },
          ]}
          relatedLinks={[
            { label: t("workshops.paid"), value: "", to: "/dashboard/$metric", params: { metric: "paid" } },
            { label: t("nav.payments"), value: "", to: "/payments" },
          ]}
        >
          <DetailSection
            title={t("dashboardDetail.todayPayments.breakdown")}
            action={<ListPageLink to="/payments">{t("dashboardSections.viewAll")}</ListPageLink>}
          >
            {(data.rows as any[]).length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">{t("dashboardDetail.todayPayments.none")}</p>
            ) : (
              <DetailTable
                headers={[
                  t("payments.received"),
                  t("workshops.client"),
                  t("nav.workshops"),
                  t("payments.method"),
                  t("common.amount"),
                ]}
              >
                {(data.rows as any[]).map((p) => (
                  <DetailRow
                    key={p.id}
                    navigateTo={
                      p.workshop_id
                        ? { to: "/workshops/$id", params: { id: p.workshop_id } }
                        : undefined
                    }
                    cells={[
                      formatDateTimeFull(p.received_date),
                      <ClientLink id={p.client_id} name={p.clients?.full_name} />,
                      <WorkshopLink id={p.workshop_id} name={p.workshops?.name} />,
                      t(`payments.methods.${p.method}`, { defaultValue: p.method }),
                      formatMoney(p.base, p.currency),
                    ]}
                  />
                ))}
              </DetailTable>
            )}
          </DetailSection>
        </DashboardDetailShell>
      );

    case "month-revenue":
      return (
        <DashboardDetailShell
          {...meta}
          totalLabel={t("dashboardDetail.monthRevenue.title")}
          totalDisplay={formatMoney(data.total ?? k.month_received, ccy)}
          summaries={[
            { label: t("dashboardDetail.paymentCount"), value: String((data.rows as any[]).length) },
            { label: t("dashboardDetail.monthStart"), value: formatDate((data as any).monthStart) },
            { label: t("dashboard.latestPayments"), value: formatMoney(k.today_received, ccy), to: "/dashboard/$metric", params: { metric: "today-payments" } },
          ]}
          relatedLinks={[
            { label: t("workshops.paid"), value: "", to: "/dashboard/$metric", params: { metric: "paid" } },
            { label: t("nav.payments"), value: "", to: "/payments" },
          ]}
        >
          <DetailSection
            title={t("dashboardDetail.monthRevenue.breakdown")}
            action={<ListPageLink to="/payments">{t("dashboardSections.viewAll")}</ListPageLink>}
          >
            <DetailTable
              headers={[
                t("common.date"),
                t("workshops.client"),
                t("nav.workshops"),
                t("payments.method"),
                t("common.amount"),
              ]}
            >
              {(data.rows as any[]).map((p) => (
                <DetailRow
                  key={p.id}
                  navigateTo={
                    p.workshop_id
                      ? { to: "/workshops/$id", params: { id: p.workshop_id } }
                      : undefined
                  }
                  cells={[
                    formatDateTimeFull(p.received_date),
                    <ClientLink id={p.client_id} name={p.clients?.full_name} />,
                    <WorkshopLink id={p.workshop_id} name={p.workshops?.name} />,
                    t(`payments.methods.${p.method}`, { defaultValue: p.method }),
                    formatMoney(p.base, p.currency),
                  ]}
                />
              ))}
            </DetailTable>
          </DetailSection>
        </DashboardDetailShell>
      );

    case "profit":
      return (
        <DashboardDetailShell
          {...meta}
          totalLabel={t("dashboard.profit")}
          totalDisplay={formatMoney((data as any).profit ?? k.profit, ccy)}
          summaries={[
            { label: t("dashboard.revenue"), value: formatMoney((data as any).totalRevenue ?? k.total_revenue, ccy), to: "/dashboard/$metric", params: { metric: "revenue" } },
            { label: t("dashboard.expenses"), value: formatMoney((data as any).totalExpenses ?? k.total_expenses, ccy), tone: "destructive", to: "/expenses" },
            {
              label: t("dashboardDetail.netMargin"),
              value: k.total_revenue > 0 ? `${Math.round(((data as any).profit / k.total_revenue) * 100)}%` : "0%",
            },
          ]}
          relatedLinks={[
            { label: t("dashboardDetail.revenue-trends.title"), value: "", to: "/dashboard/$metric", params: { metric: "revenue-trends" } },
            { label: t("dashboard.outstanding"), value: "", to: "/dashboard/$metric", params: { metric: "outstanding" } },
          ]}
        >
          <DetailSection
            title={t("dashboardDetail.profit.revenueSide")}
            action={<ListPageLink to="/workshops">{t("dashboardSections.viewAll")}</ListPageLink>}
          >
            <DetailTable headers={[t("common.name"), t("workshops.client"), t("common.amount")]}>
              {((data as any).revenueRows ?? []).map((w: any) => (
                <DetailRow
                  key={w.id}
                  navigateTo={w.id ? { to: "/workshops/$id", params: { id: w.id } } : undefined}
                  cells={[
                    <WorkshopLink id={w.id} name={w.name} />,
                    <ClientLink id={w.client_id} name={w.client_name} />,
                    formatMoney(w.final_amount_base, ccy),
                  ]}
                />
              ))}
            </DetailTable>
          </DetailSection>
          <DetailSection
            title={t("dashboardDetail.profit.expenseSide")}
            action={<ListPageLink to="/expenses">{t("dashboardSections.viewAll")}</ListPageLink>}
          >
            <DetailTable headers={[t("common.name"), t("expenses.vendor"), t("common.category"), t("common.date"), t("common.amount")]}>
              {((data as any).expenseRows ?? []).map((e: any) => (
                <DetailRow
                  key={e.id}
                  cells={[
                    e.name,
                    e.vendor ?? "—",
                    t(`expenses.categories.${e.category}`, { defaultValue: e.category }),
                    formatDate(e.expense_date),
                    <span className="text-destructive num-tabular">−{formatMoney(e.base, e.currency)}</span>,
                  ]}
                />
              ))}
            </DetailTable>
          </DetailSection>
        </DashboardDetailShell>
      );

    case "revenue-trends":
      return (
        <DashboardDetailShell
          {...meta}
          totalLabel={t("dashboard.revenueVsExpenses")}
          totalDisplay={formatMoney(k.month_received, ccy)}
          summaries={[
            { label: t("dashboard.expenses"), value: formatMoney(k.month_expenses, ccy), to: "/expenses" },
            { label: t("dashboard.profit"), value: formatMoney(k.profit, ccy), tone: k.profit >= 0 ? "success" : "destructive", to: "/dashboard/$metric", params: { metric: "profit" } },
          ]}
          relatedLinks={[
            { label: t("dashboard.revenue"), value: "", to: "/dashboard/$metric", params: { metric: "revenue" } },
            { label: t("workshops.paid"), value: "", to: "/dashboard/$metric", params: { metric: "paid" } },
          ]}
        >
          <section className="surface-card mb-4 p-5">
            <div className="h-64 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={(data as any).monthly} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 4" stroke={chartTheme.grid} vertical={false} />
                  <XAxis dataKey="label" stroke={chartTheme.axis} fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke={chartTheme.axis} fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => formatCompact(v)} width={48} />
                  <Tooltip />
                  <Area type="monotone" dataKey="revenue" stroke={chartTheme.revenue} fill={chartTheme.revenue} fillOpacity={0.2} />
                  <Area type="monotone" dataKey="expenses" stroke={chartTheme.expenses} fill={chartTheme.expenses} fillOpacity={0.15} />
                  <Area type="monotone" dataKey="profit" stroke={chartTheme.profit} fill={chartTheme.profit} fillOpacity={0.15} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>
          <DetailSection title={t("dashboardDetail.revenueTrends.table")}>
            <DetailTable
              headers={[
                t("common.date"),
                t("dashboardSections.revenue"),
                t("dashboardSections.expenses"),
                t("dashboardSections.profit"),
              ]}
            >
              {((data as any).monthly ?? []).map((m: any) => (
                <DetailRow
                  key={m.key}
                  cells={[
                    m.label,
                    formatMoney(m.revenue, ccy),
                    formatMoney(m.expenses, ccy),
                    <span className={m.profit >= 0 ? "text-success num-tabular" : "text-destructive num-tabular"}>
                      {formatMoney(m.profit, ccy)}
                    </span>,
                  ]}
                />
              ))}
            </DetailTable>
          </DetailSection>
        </DashboardDetailShell>
      );
  }
}
