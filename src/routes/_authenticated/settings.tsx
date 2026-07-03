import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Plus, Trash2, RotateCcw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { formatDate } from "@/lib/format";
import { WorkshopTagsManager } from "@/components/workshop-tags";
import { settingsBusinessSchema, formatZodError } from "@/lib/schemas";
import { DEFAULT_DASHBOARD_LAYOUT } from "@/components/dashboard/widget-registry";
import { logActivity } from "@/lib/auth-activity";
import { invalidateAfterSettingsChange } from "@/lib/invalidate-app-data";
import { prefetchRouteQuery } from "@/lib/prefetch-route";
import { useTranslation } from "react-i18next";
import { usePh } from "@/hooks/use-ph";

const settingsQuery = queryOptions({
  queryKey: ["settings"],
  queryFn: async () => {
    const [s, rates] = await Promise.all([
      supabase.from("app_settings").select("*").maybeSingle(),
      supabase.from("exchange_rates").select("*").order("effective_date", { ascending: false }),
    ]);
    return { settings: s.data, rates: rates.data ?? [] };
  },
});

export const Route = createFileRoute("/_authenticated/settings")({
  loader: ({ context }) => {
    prefetchRouteQuery(context.queryClient, settingsQuery);
  },
  component: SettingsPage,
});

function SettingsPage() {
  const { t } = useTranslation();
  const ph = usePh();
  const { data } = useSuspenseQuery(settingsQuery);
  const qc = useQueryClient();
  const [s, setS] = useState({
    business_name: data.settings?.business_name ?? "",
    business_email: data.settings?.business_email ?? "",
    business_phone: data.settings?.business_phone ?? "",
    business_address: data.settings?.business_address ?? "",
    base_currency: (data.settings?.base_currency ?? "USD") as "USD" | "LBP",
    invoice_footer: data.settings?.invoice_footer ?? "",
    logo_url: data.settings?.logo_url ?? "",
  });
  const [saving, setSaving] = useState(false);

  async function save() {
    const parsed = settingsBusinessSchema.safeParse({
      business_name: s.business_name,
      base_currency: s.base_currency,
      default_tax_rate: 0,
    });
    if (!parsed.success) {
      toast.error(formatZodError(parsed.error));
      return;
    }
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("app_settings").upsert({
      ...s,
      tax_rate: 0,
      user_id: u.user!.id,
    }, { onConflict: "user_id" });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(t("toasts.saved"));
    invalidateAfterSettingsChange(qc);
    qc.invalidateQueries({ queryKey: ["settings"] });
  }

  async function resetDashboard() {
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("app_settings").update({
      dashboard_layout: DEFAULT_DASHBOARD_LAYOUT,
    }).eq("user_id", u.user!.id);
    if (error) return toast.error(error.message);
    await logActivity("dashboard.layout_updated", "dashboard", undefined, undefined, { queryClient: qc });
    toast.success(t("toasts.layoutReset"));
    invalidateAfterSettingsChange(qc);
  }

  return (
    <div>
      <PageHeader title={t("settings.title")} description={t("settingsPage.subtitle")} />

      <section className="surface-card mb-6 p-6">
        <h2 className="mb-4 text-base font-semibold tracking-tight">{t("settingsPage.businessProfile")}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5"><Label>{t("settingsPage.businessName")}</Label><Input placeholder={ph.settings.businessName} value={s.business_name} onChange={(e) => setS(v => ({ ...v, business_name: e.target.value }))} /></div>
          <div className="space-y-1.5"><Label>{t("clients.email")}</Label><Input type="email" placeholder={ph.settings.email} value={s.business_email} onChange={(e) => setS(v => ({ ...v, business_email: e.target.value }))} /></div>
          <div className="space-y-1.5"><Label>{t("settingsPage.phone")}</Label><Input placeholder={ph.settings.phone} value={s.business_phone} onChange={(e) => setS(v => ({ ...v, business_phone: e.target.value }))} /></div>
          <div className="space-y-1.5">
            <Label>{t("settings.defaultCurrency")}</Label>
            <Select value={s.base_currency} onValueChange={(v) => setS(x => ({ ...x, base_currency: v as "USD" | "LBP" }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="USD">USD</SelectItem><SelectItem value="LBP">LBP</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>{t("settingsPage.logoUrl")}</Label><Input value={s.logo_url} onChange={(e) => setS(v => ({ ...v, logo_url: e.target.value }))} placeholder={ph.settings.logoUrl} /></div>
          <div className="space-y-1.5 sm:col-span-2"><Label>{t("clients.address")}</Label><Input placeholder={ph.settings.address} value={s.business_address} onChange={(e) => setS(v => ({ ...v, business_address: e.target.value }))} /></div>
          <div className="space-y-1.5 sm:col-span-2"><Label>{t("settingsPage.invoiceFooter")}</Label><Input placeholder={ph.settings.invoiceFooter} value={s.invoice_footer} onChange={(e) => setS(v => ({ ...v, invoice_footer: e.target.value }))} /></div>
        </div>
        <div className="mt-5 flex justify-end"><Button onClick={save} disabled={saving}><Save className="mr-1.5 h-4 w-4" />{saving ? t("common.saving") : t("common.save")}</Button></div>
      </section>

      <WorkshopTagsManager />

      <section className="surface-card mb-6 p-6">
        <h2 className="mb-1 text-base font-semibold tracking-tight">{t("settingsPage.dashboardLayout")}</h2>
        <p className="mb-4 text-xs text-muted-foreground">{t("settingsPage.dashboardLayoutHint")}</p>
        <Button variant="outline" onClick={resetDashboard}><RotateCcw className="mr-1.5 h-4 w-4" />{t("settingsPage.resetDashboard")}</Button>
      </section>

      <ExchangeRates rates={data.rates} />
    </div>
  );
}

function ExchangeRates({ rates }: { rates: any[] }) {
  const { t } = useTranslation();
  const ph = usePh();
  const qc = useQueryClient();
  const [form, setForm] = useState({ base_currency: "USD", quote_currency: "LBP", rate: "", effective_date: new Date().toISOString().slice(0, 10) });
  async function add() {
    if (!form.rate) return;
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("exchange_rates").insert({
      user_id: u.user!.id, base_currency: form.base_currency as any, quote_currency: form.quote_currency as any,
      rate: Number(form.rate), effective_date: form.effective_date,
    });
    if (error) return toast.error(error.message);
    toast.success(t("toasts.rateAdded"));
    setForm(f => ({ ...f, rate: "" }));
    invalidateAfterSettingsChange(qc);
    qc.invalidateQueries({ queryKey: ["settings"] });
  }
  async function del(id: string) {
    await supabase.from("exchange_rates").delete().eq("id", id);
    invalidateAfterSettingsChange(qc);
    qc.invalidateQueries({ queryKey: ["settings"] });
  }
  return (
    <section className="surface-card p-6">
      <h2 className="mb-1 text-base font-semibold tracking-tight">{t("settings.exchangeRates")}</h2>
      <p className="mb-4 text-xs text-muted-foreground">{t("settingsPage.exchangeRatesHint")}</p>
      <div className="grid gap-3 rounded-xl border border-border bg-surface-2 p-4 sm:grid-cols-5">
        <Select value={form.base_currency} onValueChange={(v) => setForm(f => ({ ...f, base_currency: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="USD">USD</SelectItem><SelectItem value="LBP">LBP</SelectItem></SelectContent>
        </Select>
        <Select value={form.quote_currency} onValueChange={(v) => setForm(f => ({ ...f, quote_currency: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="USD">USD</SelectItem><SelectItem value="LBP">LBP</SelectItem></SelectContent>
        </Select>
        <Input type="number" step="0.0001" placeholder={ph.settings.exchangeRate} value={form.rate} onChange={(e) => setForm(f => ({ ...f, rate: e.target.value }))} />
        <Input type="date" value={form.effective_date} onChange={(e) => setForm(f => ({ ...f, effective_date: e.target.value }))} />
        <Button onClick={add}><Plus className="mr-1 h-4 w-4" />{t("settingsPage.addRate")}</Button>
      </div>

      {rates.length > 0 && (
        <div className="mt-4 overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-surface-2 text-left text-xs uppercase text-muted-foreground">
              <tr><th className="px-4 py-2.5 font-medium">{t("settingsPage.pair")}</th><th className="px-4 py-2.5 font-medium">{t("settingsPage.rate")}</th><th className="px-4 py-2.5 font-medium">{t("settingsPage.effective")}</th><th /></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rates.map(r => (
                <tr key={r.id}>
                  <td className="px-4 py-2.5">1 {r.base_currency} = {r.quote_currency}</td>
                  <td className="px-4 py-2.5 num-tabular">{Number(r.rate).toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{formatDate(r.effective_date)}</td>
                  <td className="px-4 py-2.5 text-right"><Button variant="ghost" size="icon" onClick={() => del(r.id)}><Trash2 className="h-3.5 w-3.5" /></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
