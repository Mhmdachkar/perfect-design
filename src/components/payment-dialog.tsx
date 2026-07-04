import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { usePh } from "@/hooks/use-ph";
import { invalidateAfterPaymentChange } from "@/lib/invalidate-app-data";
import { paymentSchema, formatZodError } from "@/lib/schemas";
import {
  defaultPaymentReference,
  nowDateTimeLocal,
  toDateTimeLocalValue,
  toTimestampIso,
} from "@/lib/datetime";
import { formatDateTimeFull, formatMoney } from "@/lib/format";
import { CurrencySelect } from "@/components/currency-select";
import { CurrencyConversionHint } from "@/components/currency-conversion-hint";
import { useUsdLbpRate } from "@/hooks/use-usd-lbp-rate";
import { DEFAULT_CURRENCY, normalizeCurrency, type AppCurrency } from "@/lib/currency";

type Payment = {
  id: string;
  amount: number;
  amount_base?: number | null;
  currency: string;
  method: string;
  received_date: string | null;
  due_date: string | null;
  reference: string | null;
  notes: string | null;
  client_id: string;
  workshop_id: string | null;
  created_at?: string;
  updated_at?: string;
};

const METHODS = ["cash", "credit_card", "bank_transfer"] as const;
const LEGACY_METHODS = ["western_union", "paypal", "other"] as const;

function emptyForm(defaults: { currency: string; client_id: string; workshop_id: string }) {
  const now = nowDateTimeLocal();
  return {
    amount: "",
    currency: defaults.currency,
    method: "cash",
    received_date: now,
    due_date: now,
    reference: defaultPaymentReference(),
    notes: "",
    client_id: defaults.client_id,
    workshop_id: defaults.workshop_id,
  };
}

export function PaymentDialog({
  payment,
  workshopId,
  clientId,
  defaultCurrency = DEFAULT_CURRENCY,
  trigger,
}: {
  payment?: Payment;
  workshopId?: string;
  clientId?: string;
  defaultCurrency?: string;
  trigger?: React.ReactNode;
}) {
  const { t } = useTranslation();
  const ph = usePh();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();
  const isEdit = !!payment;

  const [form, setForm] = useState(() =>
    emptyForm({
      currency: normalizeCurrency(defaultCurrency),
      client_id: clientId ?? "",
      workshop_id: workshopId ?? "",
    }),
  );

  useEffect(() => {
    if (!open) return;
    if (payment) {
      setForm({
        amount: String(payment.amount),
        currency: normalizeCurrency(payment.currency),
        method: payment.method,
        received_date: toDateTimeLocalValue(payment.received_date) || nowDateTimeLocal(),
        due_date: toDateTimeLocalValue(payment.due_date) || nowDateTimeLocal(),
        reference: payment.reference ?? "",
        notes: payment.notes ?? "",
        client_id: payment.client_id,
        workshop_id: payment.workshop_id ?? "",
      });
      return;
    }
    setForm(
      emptyForm({
        currency: normalizeCurrency(defaultCurrency),
        client_id: clientId ?? "",
        workshop_id: workshopId ?? "",
      }),
    );
  }, [payment, open, defaultCurrency, clientId, workshopId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = paymentSchema.safeParse({
      ...form,
      amount: form.amount,
      workshop_id: form.workshop_id || "",
    });
    if (!parsed.success) {
      toast.error(formatZodError(parsed.error));
      return;
    }
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    const payload = {
      amount: parsed.data.amount,
      currency: parsed.data.currency as AppCurrency,
      method: parsed.data.method as (typeof METHODS)[number] | (typeof LEGACY_METHODS)[number],
      received_date: toTimestampIso(form.received_date),
      due_date: toTimestampIso(form.due_date),
      reference: parsed.data.reference?.trim() || null,
      notes: parsed.data.notes?.trim() || null,
      client_id: parsed.data.client_id,
      workshop_id: parsed.data.workshop_id || null,
    };

    const { error } = isEdit
      ? await supabase.from("payments").update(payload).eq("id", payment!.id)
      : await supabase.from("payments").insert({ ...payload, user_id: u.user!.id });

    setSaving(false);
    if (error) return toast.error(error.message);
    invalidateAfterPaymentChange(qc);
    if (form.client_id) {
      qc.invalidateQueries({ queryKey: ["client", form.client_id] });
    }
    toast.success(isEdit ? t("toasts.paymentUpdated") : t("toasts.paymentRecorded"));
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" className="rounded-xl">
            <Plus className="mr-1 h-3.5 w-3.5" />
            {isEdit ? t("common.edit") : t("payments.newPayment")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? t("common.edit") : t("payments.newPayment")}</DialogTitle>
        </DialogHeader>
        <PaymentFormFields
          form={form}
          setForm={setForm}
          showEntityPickers={!workshopId && !clientId && !isEdit}
          open={open}
          isEdit={isEdit}
          payment={payment}
        />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            {t("common.cancel")}
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? t("common.saving") : t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PaymentFormFields({
  form,
  setForm,
  showEntityPickers,
  open,
  isEdit,
  payment,
}: {
  form: Record<string, string>;
  setForm: React.Dispatch<React.SetStateAction<typeof form>>;
  showEntityPickers?: boolean;
  open?: boolean;
  isEdit?: boolean;
  payment?: Payment;
}) {
  const { t } = useTranslation();
  const ph = usePh();
  const { rate } = useUsdLbpRate();

  return (
    <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
      {showEntityPickers && <EntityPickers form={form} setForm={setForm} open={!!open} />}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5 col-span-2 sm:col-span-1">
          <Label>{t("common.amount")} *</Label>
          <Input
            type="number"
            step="0.01"
            required
            placeholder={ph.payment.amount}
            value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
          />
          <CurrencyConversionHint amount={form.amount} currency={form.currency} rate={rate} />
        </div>
        <div className="space-y-1.5">
          <Label>{t("common.currency")}</Label>
          <CurrencySelect value={form.currency} onValueChange={(v) => setForm((f) => ({ ...f, currency: v }))} />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>{t("payments.method")} *</Label>
          <div className="flex flex-wrap gap-2">
            {METHODS.map((m) => (
              <Button
                key={m}
                type="button"
                size="sm"
                variant={form.method === m ? "default" : "outline"}
                className="rounded-xl"
                onClick={() => setForm((f) => ({ ...f, method: m }))}
              >
                {t(`payments.methods.${m}`)}
              </Button>
            ))}
          </div>
          {isEdit && LEGACY_METHODS.includes(form.method as (typeof LEGACY_METHODS)[number]) && (
            <p className="text-xs text-muted-foreground">
              {t("payments.legacyMethod", { method: t(`payments.methods.${form.method}`, { defaultValue: form.method }) })}
            </p>
          )}
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>{t("payments.referenceCode")}</Label>
          <Input
            placeholder={ph.payment.reference}
            value={form.reference}
            onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))}
          />
        </div>
        <div className="space-y-1.5 col-span-2 sm:col-span-1">
          <Label>{t("payments.received")}</Label>
          <Input
            type="datetime-local"
            step={1}
            value={form.received_date}
            onChange={(e) => setForm((f) => ({ ...f, received_date: e.target.value }))}
          />
          <p className="text-[11px] text-muted-foreground">{t("payments.datetimeHint")}</p>
        </div>
        <div className="space-y-1.5 col-span-2 sm:col-span-1">
          <Label>{t("payments.due")}</Label>
          <Input
            type="datetime-local"
            step={1}
            value={form.due_date}
            onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
          />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>{t("payments.note")}</Label>
          <Textarea
            rows={3}
            placeholder={ph.payment.notes}
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          />
        </div>
      </div>

      {isEdit && payment && (
        <dl className="grid grid-cols-1 gap-2 rounded-xl border border-border bg-surface-2 p-3 text-xs sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">{t("payments.recordedAt")}</dt>
            <dd className="mt-0.5 font-medium">{formatDateTimeFull(payment.created_at)}</dd>
          </div>
          {payment.amount_base != null && (
            <div>
              <dt className="text-muted-foreground">Base amount</dt>
              <dd className="mt-0.5 font-medium num-tabular">{formatMoney(payment.amount_base, "USD")}</dd>
            </div>
          )}
          {payment.updated_at && payment.updated_at !== payment.created_at && (
            <div className="sm:col-span-2">
              <dt className="text-muted-foreground">Last updated</dt>
              <dd className="mt-0.5 font-medium">{formatDateTimeFull(payment.updated_at)}</dd>
            </div>
          )}
        </dl>
      )}
    </form>
  );
}

function EntityPickers({
  form,
  setForm,
  open,
}: {
  form: Record<string, string>;
  setForm: React.Dispatch<React.SetStateAction<typeof form>>;
  open: boolean;
}) {
  const { t } = useTranslation();
  const ph = usePh();
  const [clients, setClients] = useState<{ id: string; full_name: string }[]>([]);
  const [workshops, setWorkshops] = useState<{ id: string; name: string; client_id: string }[]>([]);
  const [clientQ, setClientQ] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      const [cRes, wRes] = await Promise.all([
        supabase
          .from("clients")
          .select("id,full_name")
          .is("deleted_at", null)
          .order("full_name")
          .limit(500),
        supabase
          .from("workshops")
          .select("id,name,client_id")
          .is("deleted_at", null)
          .order("created_at", { ascending: false })
          .limit(500),
      ]);
      if (cancelled) return;
      setClients(cRes.data ?? []);
      setWorkshops(wRes.data ?? []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [open]);

  const filteredClients = clients.filter((c) =>
    !clientQ || c.full_name.toLowerCase().includes(clientQ.toLowerCase()),
  );
  const filteredWs = workshops.filter(
    (w) => (!form.client_id || w.client_id === form.client_id) &&
      (!clientQ || w.name.toLowerCase().includes(clientQ.toLowerCase())),
  );

  return (
    <>
      <div className="space-y-1.5">
        <Label>{t("workshops.client")} *</Label>
        <Input
          placeholder={ph.payment.selectClient}
          value={clientQ}
          onChange={(e) => setClientQ(e.target.value)}
          className="mb-2"
        />
        <Select value={form.client_id} onValueChange={(v) => setForm((f) => ({ ...f, client_id: v, workshop_id: "" }))}>
          <SelectTrigger><SelectValue placeholder={loading ? t("common.loading") : ph.payment.selectClient} /></SelectTrigger>
          <SelectContent className="max-h-60">
            {filteredClients.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>{t("payments.workshopOptional")}</Label>
        <Select value={form.workshop_id || "none"} onValueChange={(v) => setForm((f) => ({ ...f, workshop_id: v === "none" ? "" : v }))}>
          <SelectTrigger><SelectValue placeholder={t("payments.noWorkshop")} /></SelectTrigger>
          <SelectContent className="max-h-60">
            <SelectItem value="none">{t("payments.noWorkshop")}</SelectItem>
            {filteredWs.map((w) => (
              <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );
}

export { PaymentFormFields };
