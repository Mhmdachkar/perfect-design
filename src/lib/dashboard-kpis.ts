import { supabase } from "@/integrations/supabase/client";
import { isSameLocalDay, localDatePart } from "@/lib/datetime";

export type DashboardKPIs = {
  total_clients: number;
  total_workshops: number;
  open_workshops: number;
  completed_workshops: number;
  cancelled_workshops?: number;
  total_revenue: number;
  total_received: number;
  outstanding: number;
  today_received: number;
  month_received: number;
  month_expenses: number;
  total_expenses: number;
  profit: number;
  net_income?: number;
  overdue_invoices: number;
  collection_rate: number;
  avg_payment_delay_days: number;
  avg_workshop_value?: number;
  avg_client_value?: number;
};

const OPEN_STATUSES = new Set(["planning", "in_progress", "waiting"]);

function baseAmount(row: { amount_base?: number | null; amount: number }) {
  return Number(row.amount_base ?? row.amount);
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

async function fetchDashboardKpisFromTables(): Promise<DashboardKPIs> {
  const monthStart = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-01`;

  const [clientsRes, workshopsRes, financialsRes, paymentsRes, expensesRes] = await Promise.all([
    supabase.from("clients").select("id", { count: "exact", head: true }).is("deleted_at", null),
    supabase.from("workshops").select("workflow_status, final_amount, currency").is("deleted_at", null),
    supabase.from("workshop_financials").select("final_amount_base, remaining_base, financial_status"),
    supabase.from("payments").select("amount, amount_base, received_date, due_date").is("deleted_at", null),
    supabase.from("expenses").select("amount, amount_base, expense_date").is("deleted_at", null),
  ]);

  for (const res of [clientsRes, workshopsRes, financialsRes, paymentsRes, expensesRes]) {
    if (res.error) throw res.error;
  }

  const workshops = workshopsRes.data ?? [];
  const financials = financialsRes.data ?? [];
  const payments = paymentsRes.data ?? [];
  const expenses = expensesRes.data ?? [];
  const received = payments.filter((p) => p.received_date);

  const total_clients = clientsRes.count ?? 0;
  const total_workshops = workshops.length;
  const open_workshops = workshops.filter((w) => OPEN_STATUSES.has(w.workflow_status)).length;
  const completed_workshops = workshops.filter((w) => w.workflow_status === "completed").length;
  const cancelled_workshops = workshops.filter((w) => w.workflow_status === "cancelled").length;

  const total_received = received.reduce((s, p) => s + baseAmount(p), 0);
  const today_received = received
    .filter((p) => isSameLocalDay(p.received_date))
    .reduce((s, p) => s + baseAmount(p), 0);
  const month_received = received
    .filter((p) => localDatePart(p.received_date) >= monthStart)
    .reduce((s, p) => s + baseAmount(p), 0);

  const delayDays = received
    .filter((p) => p.due_date)
    .map((p) => {
      const recv = new Date(p.received_date as string).getTime();
      const due = new Date(p.due_date as string).getTime();
      return (recv - due) / 86_400_000;
    });
  const avg_payment_delay_days = delayDays.length
    ? round1(delayDays.reduce((a, b) => a + b, 0) / delayDays.length)
    : 0;

  const total_expenses = expenses.reduce((s, e) => s + baseAmount(e), 0);
  const month_expenses = expenses
    .filter((e) => (e.expense_date as string) >= monthStart)
    .reduce((s, e) => s + baseAmount(e), 0);

  const total_revenue = financials.reduce((s, f) => s + Number(f.final_amount_base ?? 0), 0);
  const outstanding = financials.reduce((s, f) => s + Number(f.remaining_base ?? 0), 0);
  const overdue_invoices = financials.filter((f) => f.financial_status === "overdue").length;

  const collection_rate = total_revenue > 0 ? round1((total_received / total_revenue) * 100) : 0;
  const profit = total_revenue - total_expenses;

  return {
    total_clients,
    total_workshops,
    open_workshops,
    completed_workshops,
    cancelled_workshops,
    total_revenue,
    total_received,
    outstanding,
    today_received,
    month_received,
    month_expenses,
    total_expenses,
    profit,
    net_income: total_received - total_expenses,
    overdue_invoices,
    collection_rate,
    avg_payment_delay_days,
    avg_workshop_value: total_workshops > 0 ? round1(total_revenue / total_workshops) : 0,
    avg_client_value: total_clients > 0 ? round1(total_revenue / total_clients) : 0,
  };
}

/** KPIs aligned with list-page queries; uses table queries (RPC optional when deployed). */
export async function fetchDashboardKpis(): Promise<DashboardKPIs> {
  return fetchDashboardKpisFromTables();
}
