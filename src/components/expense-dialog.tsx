import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { usePh } from "@/hooks/use-ph";
import { invalidateAfterExpenseChange } from "@/lib/invalidate-app-data";
import { expenseSchema, formatZodError } from "@/lib/schemas";

const CATS = ["software", "hardware", "travel", "marketing", "rent", "utilities", "supplies", "freelancer", "other"] as const;

export function ExpenseDialog({
  expense,
  clientId,
  workshopId,
  trigger,
}: {
  expense?: any;
  clientId?: string;
  workshopId?: string;
  trigger?: React.ReactNode;
}) {
  const { t } = useTranslation();
  const ph = usePh();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();
  const isEdit = !!expense;

  const [form, setForm] = useState({
    name: expense?.name ?? "",
    amount: expense ? String(expense.amount) : "",
    currency: expense?.currency ?? "USD",
    category: expense?.category ?? "other",
    expense_date: expense?.expense_date ?? new Date().toISOString().slice(0, 10),
    vendor: expense?.vendor ?? "",
    client_id: expense?.client_id ?? clientId ?? "",
    workshop_id: expense?.workshop_id ?? workshopId ?? "",
  });

  useEffect(() => {
    if (!open) return;
    if (expense) {
      setForm({
        name: expense.name ?? "",
        amount: String(expense.amount),
        currency: expense.currency ?? "USD",
        category: expense.category ?? "other",
        expense_date: expense.expense_date ?? new Date().toISOString().slice(0, 10),
        vendor: expense.vendor ?? "",
        client_id: expense.client_id ?? "",
        workshop_id: expense.workshop_id ?? "",
      });
      return;
    }
    setForm({
      name: "",
      amount: "",
      currency: "USD",
      category: "other",
      expense_date: new Date().toISOString().slice(0, 10),
      vendor: "",
      client_id: clientId ?? "",
      workshop_id: workshopId ?? "",
    });
  }, [open, expense, clientId, workshopId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = expenseSchema.safeParse({
      ...form,
      client_id: form.client_id || "",
      workshop_id: form.workshop_id || "",
    });
    if (!parsed.success) {
      toast.error(formatZodError(parsed.error));
      return;
    }
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    const payload = {
      name: parsed.data.name,
      amount: parsed.data.amount,
      currency: parsed.data.currency as "USD" | "LBP",
      category: parsed.data.category as (typeof CATS)[number],
      expense_date: parsed.data.expense_date,
      vendor: parsed.data.vendor?.trim() || null,
      client_id: form.client_id || null,
      workshop_id: form.workshop_id || null,
    };
    const { error } = isEdit
      ? await supabase.from("expenses").update(payload).eq("id", expense.id)
      : await supabase.from("expenses").insert({ ...payload, user_id: u.user!.id });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(isEdit ? t("toasts.expenseUpdated") : t("toasts.expenseAdded"));
    setOpen(false);
    invalidateAfterExpenseChange(qc);
    if (form.client_id) {
      qc.invalidateQueries({ queryKey: ["client", form.client_id] });
    }
  }

  const lockClient = !!clientId && !isEdit;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="rounded-xl">
            <Plus className="mr-1.5 h-4 w-4" />
            {t("expenses.newExpense")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? t("expenses.editExpense") : t("expenses.newExpense")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5">
            <Label>{t("common.name")} *</Label>
            <Input required placeholder={ph.expense.name} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t("common.amount")} *</Label>
              <Input type="number" step="0.01" required placeholder={ph.expense.amount} value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("common.currency")}</Label>
              <Select value={form.currency} onValueChange={(v) => setForm((f) => ({ ...f, currency: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="LBP">LBP</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t("common.category")}</Label>
              <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATS.map((c) => (
                    <SelectItem key={c} value={c}>{t(`expenses.categories.${c}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t("common.date")}</Label>
              <Input type="date" value={form.expense_date} onChange={(e) => setForm((f) => ({ ...f, expense_date: e.target.value }))} />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>{t("expenses.vendor")}</Label>
              <Input placeholder={ph.expense.vendor} value={form.vendor} onChange={(e) => setForm((f) => ({ ...f, vendor: e.target.value }))} />
            </div>
            <ExpenseEntityPickers form={form} setForm={setForm} open={open} lockClient={lockClient} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>{t("common.cancel")}</Button>
            <Button type="submit" disabled={saving}>{saving ? t("common.saving") : t("common.save")}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ExpenseEntityPickers({
  form,
  setForm,
  open,
  lockClient,
}: {
  form: Record<string, string>;
  setForm: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  open: boolean;
  lockClient?: boolean;
}) {
  const { t } = useTranslation();
  const ph = usePh();
  const [clients, setClients] = useState<{ id: string; full_name: string }[]>([]);
  const [workshops, setWorkshops] = useState<{ id: string; name: string; client_id: string }[]>([]);

  useEffect(() => {
    if (!open) return;
    supabase.from("clients").select("id,full_name").is("deleted_at", null).order("full_name").then(({ data }) => setClients(data ?? []));
    supabase.from("workshops").select("id,name,client_id").is("deleted_at", null).order("name").then(({ data }) => setWorkshops(data ?? []));
  }, [open]);

  const filteredWs = workshops.filter((w) => !form.client_id || w.client_id === form.client_id);

  if (lockClient) {
    return (
      <>
        <div className="space-y-1.5 col-span-2">
          <Label>{t("workshops.client")}</Label>
          <p className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm">
            {clients.find((c) => c.id === form.client_id)?.full_name ?? "—"}
          </p>
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>{t("nav.workshops")}</Label>
          <Select value={form.workshop_id || "none"} onValueChange={(v) => setForm((f) => ({ ...f, workshop_id: v === "none" ? "" : v }))}>
            <SelectTrigger><SelectValue placeholder={t("nav.workshops")} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">—</SelectItem>
              {filteredWs.map((w) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </>
    );
  }

  return (
    <>
      {!lockClient && (
        <div className="space-y-1.5 col-span-2">
          <Label>{t("workshops.client")}</Label>
          <Select value={form.client_id || "none"} onValueChange={(v) => setForm((f) => ({ ...f, client_id: v === "none" ? "" : v, workshop_id: "" }))}>
            <SelectTrigger><SelectValue placeholder={ph.workshop.selectClient} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">—</SelectItem>
              {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="space-y-1.5 col-span-2">
        <Label>{t("nav.workshops")}</Label>
        <Select value={form.workshop_id || "none"} onValueChange={(v) => setForm((f) => ({ ...f, workshop_id: v === "none" ? "" : v }))}>
          <SelectTrigger><SelectValue placeholder={t("nav.workshops")} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">—</SelectItem>
            {filteredWs.map((w) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    </>
  );
}
