import { createFileRoute } from "@tanstack/react-router";
import { appQueryOptions, useAppSuspenseQuery } from "@/lib/offline/app-query";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app-shell";
import { formatMoney } from "@/lib/format";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend } from "recharts";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { logActivity } from "@/lib/auth-activity";
import { invalidateAfterActivityChange } from "@/lib/invalidate-app-data";
import { prefetchRouteQuery } from "@/lib/prefetch-route";
import { FileDown, Camera } from "lucide-react";
import { chartTheme } from "@/lib/chart-theme";

const reportsQuery = appQueryOptions({
  queryKey: ["reports"],
  queryFn: async () => {
    const [pays, exps, ws, settings, snapshots] = await Promise.all([
      supabase.from("payments").select("amount,amount_base,currency,received_date").is("deleted_at", null).not("received_date", "is", null),
      supabase.from("expenses").select("amount,amount_base,currency,expense_date,category").is("deleted_at", null),
      supabase.from("workshop_financials").select("workflow_status,financial_status,final_amount_base,paid_base"),
      supabase.from("app_settings").select("base_currency").maybeSingle(),
      supabase.from("reports_snapshots").select("*").order("report_month", { ascending: false }).limit(24),
    ]);
    for (const res of [pays, exps, ws, settings, snapshots]) {
      if (res.error) throw res.error;
    }
    return {
      pays: pays.data ?? [],
      exps: exps.data ?? [],
      ws: ws.data ?? [],
      baseCurrency: settings.data?.base_currency ?? "USD",
      snapshots: snapshots.data ?? [],
    };
  },
});

export const Route = createFileRoute("/_authenticated/reports")({
  loader: ({ context }) => {
    prefetchRouteQuery(context.queryClient, reportsQuery);
  },
  component: Reports,
});

const COLORS = chartTheme.palette;

function Reports() {
  const { t } = useTranslation();
  const { data } = useAppSuspenseQuery(reportsQuery);
  const qc = useQueryClient();
  const ccy = data.baseCurrency;
  const monthly = build12(data.pays, data.exps);
  const byCat = aggCat(data.exps);
  const byStatus = aggStatus(data.ws);
  const totalRev = data.pays.reduce((s: number, p: any) => s + Number(p.amount_base ?? p.amount), 0);
  const totalExp = data.exps.reduce((s: number, e: any) => s + Number(e.amount_base ?? e.amount), 0);

  async function generateSnapshot() {
    const now = new Date();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    const monthPays = data.pays.filter((p: any) => (p.received_date as string)?.startsWith(monthStart.slice(0, 7)));
    const monthExps = data.exps.filter((e: any) => (e.expense_date as string)?.startsWith(monthStart.slice(0, 7)));
    const revenue = monthPays.reduce((s: number, p: any) => s + Number(p.amount_base ?? p.amount), 0);
    const expenses = monthExps.reduce((s: number, e: any) => s + Number(e.amount_base ?? e.amount), 0);
    const { data: u } = await supabase.auth.getUser();
    const { data: rates } = await supabase.from("exchange_rates").select("*").order("effective_date", { ascending: false }).limit(10);
    const { error } = await supabase.from("reports_snapshots").upsert({
      user_id: u.user!.id,
      report_month: monthStart,
      revenue,
      expenses,
      profit: revenue - expenses,
      base_currency: ccy,
      rates_used: rates ?? [],
    }, { onConflict: "user_id,report_month" });
    if (error) return toast.error(error.message);
    await logActivity("reports.snapshot_generated", "reports", undefined, monthStart, { queryClient: qc });
    toast.success("Monthly snapshot saved");
    qc.invalidateQueries({ queryKey: ["reports"] });
    invalidateAfterActivityChange(qc);
  }

  async function exportPdf() {
    await logActivity("reports.exported", "reports", undefined, "PDF export", { queryClient: qc });
    window.print();
  }

  return (
    <div className="print-area">
      <PageHeader
        title={t("reports.title")}
        description={t("reports.subtitle")}
        action={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button variant="outline" className="rounded-xl" onClick={generateSnapshot}>
              <Camera className="me-1.5 h-4 w-4" />Save snapshot
            </Button>
            <Button variant="outline" className="rounded-xl" onClick={exportPdf}>
              <FileDown className="me-1.5 h-4 w-4" />Export PDF
            </Button>
          </div>
        }
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <KCard label={`Revenue (${ccy})`} value={formatMoney(totalRev, ccy)} tone="success" />
        <KCard label={`Expenses (${ccy})`} value={formatMoney(totalExp, ccy)} tone="destructive" />
        <KCard label={`Net (${ccy})`} value={formatMoney(totalRev - totalExp, ccy)} tone={totalRev - totalExp >= 0 ? "success" : "destructive"} />
      </div>

      <section className="surface-card mt-6 p-5">
        <h2 className="mb-4 text-sm font-semibold">Monthly revenue vs expenses</h2>
        <div className="h-56 sm:h-72">
          <ResponsiveContainer>
            <BarChart data={monthly}>
              <CartesianGrid strokeDasharray="2 4" stroke={chartTheme.grid} vertical={false} />
              <XAxis dataKey="label" stroke={chartTheme.axis} fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke={chartTheme.axis} fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--popover-foreground)" }} />
              <Bar dataKey="revenue" fill={chartTheme.revenue} radius={[6, 6, 0, 0]} />
              <Bar dataKey="expenses" fill={chartTheme.expenses} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="surface-card p-5">
          <h2 className="mb-4 text-sm font-semibold">Expenses by category</h2>
          <div className="h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={byCat} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90}>
                  {byCat.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="surface-card p-5">
          <h2 className="mb-4 text-sm font-semibold">Workshops by workflow status</h2>
          <div className="h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={byStatus} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90}>
                  {byStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {data.snapshots.length > 0 && (
        <section className="surface-card mt-6 p-5">
          <h2 className="mb-4 text-sm font-semibold">Historical snapshots</h2>
          <ul className="divide-y divide-border">
            {data.snapshots.map((s: any) => (
              <li key={s.id} className="flex flex-col gap-1 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                <span className="font-medium">{formatDate(s.report_month)}</span>
                <span className="text-muted-foreground">
                  Rev {formatMoney(s.revenue, s.base_currency)} · Exp {formatMoney(s.expenses, s.base_currency)} · Net {formatMoney(s.profit, s.base_currency)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function KCard({ label, value, tone }: { label: string; value: string; tone?: "success" | "destructive" }) {
  const cls = tone === "success" ? "text-success" : tone === "destructive" ? "text-destructive" : "";
  return <div className="surface-card p-5"><p className="text-xs text-muted-foreground">{label}</p><p className={`mt-1.5 text-2xl font-semibold num-tabular ${cls}`}>{value}</p></div>;
}

function build12(pays: any[], exps: any[]) {
  const m: any[] = [];
  const now = new Date();
  const idx = new Map<string, number>();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    idx.set(k, m.length);
    m.push({ key: k, label: d.toLocaleDateString("en-US", { month: "short" }), revenue: 0, expenses: 0 });
  }
  for (const p of pays) {
    const k = (p.received_date as string).slice(0, 7); const i = idx.get(k);
    if (i != null) m[i].revenue += Number(p.amount_base ?? p.amount);
  }
  for (const e of exps) {
    const k = (e.expense_date as string).slice(0, 7); const i = idx.get(k);
    if (i != null) m[i].expenses += Number(e.amount_base ?? e.amount);
  }
  return m;
}

function aggCat(exps: any[]) {
  const m = new Map<string, number>();
  for (const e of exps) m.set(e.category, (m.get(e.category) ?? 0) + Number(e.amount_base ?? e.amount));
  return Array.from(m, ([name, value]) => ({ name, value: Math.round(value) }));
}
function aggStatus(ws: any[]) {
  const m = new Map<string, number>();
  for (const w of ws) m.set(w.workflow_status, (m.get(w.workflow_status) ?? 0) + 1);
  return Array.from(m, ([name, value]) => ({ name, value }));
}
