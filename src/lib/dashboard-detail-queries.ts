import { supabase } from "@/integrations/supabase/client";
import { fetchDashboardKpis } from "@/lib/dashboard-kpis";
import { isSameLocalDay, localDatePart } from "@/lib/datetime";

export const DASHBOARD_METRIC_SLUGS = [
  "clients",
  "workshops",
  "revenue",
  "paid",
  "outstanding",
  "today-payments",
  "month-revenue",
  "profit",
  "revenue-trends",
] as const;

export type DashboardMetricSlug = (typeof DASHBOARD_METRIC_SLUGS)[number];

export const STAT_WIDGET_LINKS: Record<string, DashboardMetricSlug> = {
  stat_total_clients: "clients",
  stat_total_workshops: "workshops",
  stat_revenue: "revenue",
  stat_received: "paid",
  stat_outstanding: "outstanding",
  stat_today_payments: "today-payments",
  stat_month_revenue: "month-revenue",
  stat_profit: "profit",
};

export function isDashboardMetricSlug(s: string): s is DashboardMetricSlug {
  return (DASHBOARD_METRIC_SLUGS as readonly string[]).includes(s);
}

function monthStartISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

function baseAmount(row: { amount_base?: number | null; amount: number }) {
  return Number(row.amount_base ?? row.amount);
}

export type DashboardDetailBase = {
  metric: DashboardMetricSlug;
  ccy: string;
  kpis: Awaited<ReturnType<typeof fetchDashboardKpis>>;
};

export async function fetchDashboardDetail(metric: DashboardMetricSlug): Promise<DashboardDetailBase & Record<string, unknown>> {
  const [kpis, settings] = await Promise.all([
    fetchDashboardKpis(),
    supabase.from("app_settings").select("base_currency").maybeSingle(),
  ]);
  if (settings.error) throw settings.error;
  const ccy = settings.data?.base_currency ?? "USD";

  const base = { metric, ccy, kpis };

  switch (metric) {
    case "clients":
      return { ...base, ...(await fetchClientsDetail()) };
    case "workshops":
      return { ...base, ...(await fetchWorkshopsDetail()) };
    case "revenue":
      return { ...base, ...(await fetchRevenueDetail()) };
    case "paid":
      return { ...base, ...(await fetchPaidDetail()) };
    case "outstanding":
      return { ...base, ...(await fetchOutstandingDetail()) };
    case "today-payments":
      return { ...base, ...(await fetchTodayPaymentsDetail()) };
    case "month-revenue":
      return { ...base, ...(await fetchMonthRevenueDetail()) };
    case "profit":
      return { ...base, ...(await fetchProfitDetail()) };
    case "revenue-trends":
      return { ...base, ...(await fetchRevenueTrendsDetail()) };
    default:
      return base;
  }
}

async function fetchClientsDetail() {
  const [clientsRes, financialsRes] = await Promise.all([
    supabase
      .from("clients")
      .select("id,full_name,phone,whatsapp,created_at")
      .is("deleted_at", null)
      .order("full_name")
      .limit(500),
    supabase
      .from("workshop_financials")
      .select("client_id,final_amount_base,paid_base,remaining_base"),
  ]);
  if (clientsRes.error) throw clientsRes.error;
  if (financialsRes.error) throw financialsRes.error;

  const byClient = new Map<string, { workshops: number; revenue: number; paid: number; outstanding: number }>();
  for (const f of financialsRes.data ?? []) {
    if (!f.client_id) continue;
    const cur = byClient.get(f.client_id) ?? { workshops: 0, revenue: 0, paid: 0, outstanding: 0 };
    cur.workshops += 1;
    cur.revenue += Number(f.final_amount_base ?? 0);
    cur.paid += Number(f.paid_base ?? 0);
    cur.outstanding += Number(f.remaining_base ?? 0);
    byClient.set(f.client_id, cur);
  }

  const rows = (clientsRes.data ?? []).map((c) => {
    const agg = byClient.get(c.id) ?? { workshops: 0, revenue: 0, paid: 0, outstanding: 0 };
    return {
      id: c.id,
      name: c.full_name,
      phone: c.phone ?? c.whatsapp,
      created_at: c.created_at,
      ...agg,
    };
  });

  return { rows, total: rows.length };
}

async function fetchWorkshopsDetail() {
  const { data, error } = await supabase
    .from("workshop_financials")
    .select("id,name,client_name,client_id,workflow_status,financial_status,final_amount_base,paid_base,remaining_base,category,deadline,created_at")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw error;

  const rows = data ?? [];
  const byWorkflow = countBy(rows, (r) => r.workflow_status ?? "unknown");
  const byFinancial = countBy(rows, (r) => r.financial_status ?? "unknown");

  return { rows, total: rows.length, byWorkflow, byFinancial };
}

async function fetchRevenueDetail() {
  const { data, error } = await supabase
    .from("workshop_financials")
    .select("id,name,client_name,client_id,price,discount,tax,final_amount,final_amount_base,currency,financial_status,created_at")
    .order("final_amount_base", { ascending: false })
    .limit(500);
  if (error) throw error;

  const rows = (data ?? []).map((w) => ({
    ...w,
    final_amount_base: Number(w.final_amount_base ?? 0),
  }));

  return {
    rows,
    total: rows.reduce((s, r) => s + r.final_amount_base, 0),
  };
}

async function fetchPaidDetail() {
  const { data, error } = await supabase
    .from("payments")
    .select("id,amount,amount_base,currency,method,received_date,reference,notes,client_id,workshop_id,clients(full_name),workshops(name)")
    .is("deleted_at", null)
    .not("received_date", "is", null)
    .order("received_date", { ascending: false })
    .limit(500);
  if (error) throw error;

  const rows = (data ?? []).map((p) => ({
    ...p,
    base: baseAmount(p),
  }));

  const byMethod = countBy(rows, (r) => r.method);
  return {
    rows,
    total: rows.reduce((s, r) => s + r.base, 0),
    byMethod,
  };
}

async function fetchOutstandingDetail() {
  const { data, error } = await supabase
    .from("workshop_financials")
    .select("id,name,client_name,client_id,final_amount_base,paid_base,remaining_base,financial_status,workflow_status,deadline,last_payment_date")
    .gt("remaining_base", 0)
    .order("remaining_base", { ascending: false })
    .limit(500);
  if (error) throw error;

  const rows = (data ?? []).map((w) => ({
    ...w,
    final_amount_base: Number(w.final_amount_base ?? 0),
    paid_base: Number(w.paid_base ?? 0),
    remaining_base: Number(w.remaining_base ?? 0),
  }));

  const byStatus = countBy(rows, (r) => r.financial_status ?? "pending");

  return {
    rows,
    total: rows.reduce((s, r) => s + r.remaining_base, 0),
    byStatus,
  };
}

async function fetchTodayPaymentsDetail() {
  const { data, error } = await supabase
    .from("payments")
    .select("id,amount,amount_base,currency,method,received_date,reference,client_id,workshop_id,clients(full_name),workshops(name)")
    .is("deleted_at", null)
    .not("received_date", "is", null)
    .order("received_date", { ascending: false })
    .limit(500);
  if (error) throw error;

  const rows = (data ?? [])
    .filter((p) => isSameLocalDay(p.received_date))
    .map((p) => ({ ...p, base: baseAmount(p) }));

  return { rows, total: rows.reduce((s, r) => s + r.base, 0) };
}

async function fetchMonthRevenueDetail() {
  const monthStart = monthStartISO();
  const { data, error } = await supabase
    .from("payments")
    .select("id,amount,amount_base,currency,method,received_date,reference,client_id,workshop_id,clients(full_name),workshops(name)")
    .is("deleted_at", null)
    .not("received_date", "is", null)
    .gte("received_date", monthStart)
    .order("received_date", { ascending: false })
    .limit(500);
  if (error) throw error;

  const rows = (data ?? []).map((p) => ({ ...p, base: baseAmount(p) }));
  return { rows, total: rows.reduce((s, r) => s + r.base, 0), monthStart };
}

async function fetchProfitDetail() {
  const [financialsRes, expensesRes] = await Promise.all([
    supabase
      .from("workshop_financials")
      .select("id,name,client_name,client_id,final_amount_base")
      .order("final_amount_base", { ascending: false })
      .limit(500),
    supabase
      .from("expenses")
      .select("id,name,amount,amount_base,currency,category,expense_date,vendor")
      .is("deleted_at", null)
      .order("expense_date", { ascending: false })
      .limit(500),
  ]);
  if (financialsRes.error) throw financialsRes.error;
  if (expensesRes.error) throw expensesRes.error;

  const revenueRows = (financialsRes.data ?? []).map((w) => ({
    ...w,
    final_amount_base: Number(w.final_amount_base ?? 0),
  }));
  const expenseRows = (expensesRes.data ?? []).map((e) => ({
    ...e,
    base: baseAmount(e),
  }));

  const totalRevenue = revenueRows.reduce((s, r) => s + r.final_amount_base, 0);
  const totalExpenses = expenseRows.reduce((s, r) => s + r.base, 0);

  return {
    revenueRows,
    expenseRows,
    totalRevenue,
    totalExpenses,
    profit: totalRevenue - totalExpenses,
  };
}

async function fetchRevenueTrendsDetail() {
  const monthsAgo = (() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 11);
    d.setDate(1);
    return d.toISOString().slice(0, 10);
  })();

  const [paysRes, expsRes] = await Promise.all([
    supabase
      .from("payments")
      .select("amount,amount_base,received_date")
      .is("deleted_at", null)
      .not("received_date", "is", null)
      .gte("received_date", monthsAgo),
    supabase
      .from("expenses")
      .select("amount,amount_base,expense_date")
      .is("deleted_at", null)
      .gte("expense_date", monthsAgo),
  ]);
  if (paysRes.error) throw paysRes.error;
  if (expsRes.error) throw expsRes.error;

  const months: { key: string; label: string; revenue: number; expenses: number; profit: number }[] = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    months.push({ key, label: d.toLocaleDateString("en-US", { month: "short", year: "2-digit" }), revenue: 0, expenses: 0, profit: 0 });
  }
  const idx = new Map(months.map((m, i) => [m.key, i]));

  for (const p of paysRes.data ?? []) {
    const k = (p.received_date as string).slice(0, 7);
    const i = idx.get(k);
    if (i == null) continue;
    months[i].revenue += baseAmount(p);
  }
  for (const e of expsRes.data ?? []) {
    const k = (e.expense_date as string).slice(0, 7);
    const i = idx.get(k);
    if (i == null) continue;
    months[i].expenses += baseAmount(e);
  }
  for (const m of months) m.profit = m.revenue - m.expenses;

  return { monthly: months };
}

function countBy<T>(items: T[], keyFn: (item: T) => string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const item of items) {
    const k = keyFn(item);
    out[k] = (out[k] ?? 0) + 1;
  }
  return out;
}

export { monthStartISO, baseAmount as paymentBaseAmount };
