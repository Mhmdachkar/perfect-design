import { useState, useEffect } from "react";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil } from "lucide-react";
import { toast } from "sonner";
import { usePh } from "@/hooks/use-ph";
import { invalidateAfterWorkshopChange } from "@/lib/invalidate-app-data";
import { WorkshopProductFields } from "@/components/workshop-product-fields";
import {
  buildOptionsSnapshot,
  emptyProductFormState,
  findWorkshopProduct,
  productFormStateFromWorkshop,
  validateWorkshopProduct,
  type WorkshopProductFormState,
} from "@/lib/workshop-measurements";
import { workshopSchema, formatZodError } from "@/lib/schemas";
import { queryOptions } from "@tanstack/react-query";

const clientsLite = queryOptions({
  queryKey: ["clients-lite"],
  queryFn: async () => {
    const { data, error } = await supabase.from("clients").select("id,full_name").is("deleted_at", null).order("full_name");
    if (error) throw error;
    return data ?? [];
  },
});

const COLUMN_KEYS = ["planning", "in_progress", "waiting", "completed"] as const;

type WorkshopRow = {
  id: string;
  name: string;
  client_id: string;
  category?: string | null;
  price?: number;
  currency?: string;
  discount?: number;
  deadline?: string | null;
  start_date?: string | null;
  priority?: string;
  workflow_status?: string;
  description?: string | null;
  product_ref_id?: string | null;
  category_path_snapshot?: string | null;
  options_snapshot?: Record<string, string> | null;
  custom_measurement?: string | null;
};

type FormState = {
  name: string;
  client_id: string;
  base_amount: string;
  currency: string;
  discount: string;
  deadline: string;
  start_date: string;
  priority: string;
  workflow_status: string;
  description: string;
};

function emptyForm(): FormState {
  return {
    name: "",
    client_id: "",
    base_amount: "",
    currency: "LYD",
    discount: "0",
    deadline: "",
    start_date: "",
    priority: "medium",
    workflow_status: "planning",
    description: "",
  };
}

function workshopPayload(
  form: FormState,
  productState: WorkshopProductFormState,
  userId: string,
  clientId?: string,
) {
  const product = findWorkshopProduct(productState.productId);
  const options = product ? buildOptionsSnapshot(product, productState) : {};
  const customMeasurement = productState.customMeasurement.trim() || null;

  return {
    user_id: userId,
    client_id: clientId ?? form.client_id,
    name: form.name,
    price: Number(form.base_amount) || 0,
    currency: form.currency as "USD" | "LBP" | "LYD",
    discount: Number(form.discount) || 0,
    tax: 0,
    deadline: form.deadline || null,
    start_date: form.start_date || null,
    priority: form.priority as "low" | "medium" | "high" | "urgent",
    workflow_status: form.workflow_status as "planning" | "in_progress" | "waiting" | "completed" | "cancelled" | "archived",
    description: form.description || null,
    category: product?.name ?? null,
    product_ref_id: productState.productId || null,
    category_path_snapshot: product?.categoryPath ?? null,
    options_snapshot: options,
    custom_measurement: customMeasurement,
  };
}

export function NewWorkshopDialog() {
  const { t } = useTranslation();
  const ph = usePh();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();
  const { data: clients } = useSuspenseQuery(clientsLite);
  const [form, setForm] = useState(emptyForm);
  const [productState, setProductState] = useState(emptyProductFormState);

  useEffect(() => {
    if (!open) return;
    setForm(emptyForm());
    setProductState(emptyProductFormState());
  }, [open]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const product = findWorkshopProduct(productState.productId);
    const validationKey = validateWorkshopProduct(product, productState);
    if (validationKey) {
      toast.error(t(validationKey));
      return;
    }
    const parsed = workshopSchema.safeParse({
      name: form.name,
      client_id: form.client_id,
      price: form.base_amount,
      discount: form.discount,
      currency: form.currency,
      deadline: form.deadline,
      description: form.description,
    });
    if (!parsed.success) {
      toast.error(formatZodError(parsed.error));
      return;
    }
    if (!form.client_id) {
      toast.error(t("payments.clientRequired"));
      return;
    }
    setSaving(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const { error } = await supabase.from("workshops").insert(workshopPayload(form, productState, u.user.id));
      if (error) throw error;
      toast.success(t("toasts.workshopCreated"));
      setOpen(false);
      invalidateAfterWorkshopChange(qc);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t("auth.errorGeneric"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-xl"><Plus className="mr-1.5 h-4 w-4" /> {t("workshops.newWorkshop")}</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader><DialogTitle>{t("workshopsPage.newDialogTitle")}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <WorkshopProductFields
            state={productState}
            onChange={(patch) => setProductState((s) => ({ ...s, ...patch }))}
            onProductSelect={(_id, basePrice, suggestedName) => {
              setForm((f) => ({
                ...f,
                name: f.name || suggestedName || f.name,
                base_amount: basePrice != null ? String(basePrice) : f.base_amount,
              }));
            }}
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 col-span-2">
              <Label>{t("common.name")} *</Label>
              <Input required placeholder={ph.workshop.name} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>{t("workshops.client")} *</Label>
              <Select value={form.client_id} onValueChange={(v) => setForm((f) => ({ ...f, client_id: v }))}>
                <SelectTrigger><SelectValue placeholder={ph.workshop.selectClient} /></SelectTrigger>
                <SelectContent>{clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t("common.amount")} *</Label>
              <Input type="number" step="0.01" required placeholder={ph.workshop.amount} value={form.base_amount} onChange={(e) => setForm((f) => ({ ...f, base_amount: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("common.currency")}</Label>
              <Select value={form.currency} onValueChange={(v) => setForm((f) => ({ ...f, currency: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="LYD">LYD</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="LBP">LBP</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>{t("invoice.discount")}</Label><Input type="number" step="0.01" placeholder={ph.workshop.discount} value={form.discount} onChange={(e) => setForm((f) => ({ ...f, discount: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>{t("workshops.deadline")}</Label><Input type="date" value={form.deadline} onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))} /></div>
            <div className="space-y-1.5">
              <Label>{t("common.status")}</Label>
              <Select value={form.workflow_status} onValueChange={(v) => setForm((f) => ({ ...f, workflow_status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COLUMN_KEYS.map((k) => (
                    <SelectItem key={k} value={k}>{t(`statuses.${k}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>{t("detail.description")}</Label>
              <Textarea rows={2} placeholder={ph.workshop.description} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>{t("common.cancel")}</Button>
            <Button type="submit" disabled={saving || !form.client_id}>{saving ? t("common.saving") : t("common.create")}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function EditWorkshopDialog({ workshop }: { workshop: WorkshopRow }) {
  const { t } = useTranslation();
  const ph = usePh();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();
  const [form, setForm] = useState<FormState>(() => ({
    name: workshop.name,
    client_id: workshop.client_id,
    base_amount: String(workshop.price ?? 0),
    currency: workshop.currency ?? "LYD",
    discount: String(workshop.discount ?? 0),
    deadline: workshop.deadline?.slice(0, 10) ?? "",
    start_date: workshop.start_date?.slice(0, 10) ?? "",
    priority: workshop.priority ?? "medium",
    workflow_status: workshop.workflow_status ?? "planning",
    description: workshop.description ?? "",
  }));
  const [productState, setProductState] = useState<WorkshopProductFormState>(() =>
    productFormStateFromWorkshop(workshop),
  );

  function openDialog(next: boolean) {
    if (next) {
      setForm({
        name: workshop.name,
        client_id: workshop.client_id,
        base_amount: String(workshop.price ?? 0),
        currency: workshop.currency ?? "LYD",
        discount: String(workshop.discount ?? 0),
        deadline: workshop.deadline?.slice(0, 10) ?? "",
        start_date: workshop.start_date?.slice(0, 10) ?? "",
        priority: workshop.priority ?? "medium",
        workflow_status: workshop.workflow_status ?? "planning",
        description: workshop.description ?? "",
      });
      setProductState(productFormStateFromWorkshop(workshop));
    }
    setOpen(next);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const product = findWorkshopProduct(productState.productId);
    const validationKey = validateWorkshopProduct(product, productState);
    if (validationKey) {
      toast.error(t(validationKey));
      return;
    }
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const payload = workshopPayload(form, productState, u.user.id, workshop.client_id);
    const { error } = await supabase.from("workshops").update({
      name: payload.name,
      category: payload.category,
      price: payload.price,
      currency: payload.currency,
      discount: payload.discount,
      tax: payload.tax,
      deadline: payload.deadline,
      start_date: payload.start_date,
      priority: payload.priority,
      description: payload.description,
      product_ref_id: payload.product_ref_id,
      category_path_snapshot: payload.category_path_snapshot,
      options_snapshot: payload.options_snapshot,
      custom_measurement: payload.custom_measurement,
    }).eq("id", workshop.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    invalidateAfterWorkshopChange(qc);
    qc.invalidateQueries({ queryKey: ["workshop", workshop.id] });
    toast.success(t("toasts.saved"));
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={openDialog}>
      <DialogTrigger asChild>
        <Button variant="outline" className="rounded-xl"><Pencil className="mr-1.5 h-4 w-4" />{t("detail.edit")}</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader><DialogTitle>{t("workshopsPage.editDialogTitle")}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <WorkshopProductFields
            state={productState}
            onChange={(patch) => setProductState((s) => ({ ...s, ...patch }))}
            onProductSelect={(_id, basePrice) => {
              if (basePrice != null) setForm((f) => ({ ...f, base_amount: String(basePrice) }));
            }}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 col-span-2"><Label>{t("common.name")}</Label><Input placeholder={ph.workshop.name} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>{t("common.amount")}</Label><Input type="number" step="0.01" placeholder={ph.workshop.amount} value={form.base_amount} onChange={(e) => setForm((f) => ({ ...f, base_amount: e.target.value }))} /></div>
            <div className="space-y-1.5">
              <Label>{t("common.currency")}</Label>
              <Select value={form.currency} onValueChange={(v) => setForm((f) => ({ ...f, currency: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="LYD">LYD</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="LBP">LBP</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>{t("invoice.discount")}</Label><Input type="number" step="0.01" placeholder={ph.workshop.discount} value={form.discount} onChange={(e) => setForm((f) => ({ ...f, discount: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>{t("workshops.deadline")}</Label><Input type="date" value={form.deadline} onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))} /></div>
            <div className="space-y-1.5 col-span-2"><Label>{t("detail.description")}</Label><Textarea rows={3} placeholder={ph.workshop.description} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} /></div>
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
