import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import { usePh } from "@/hooks/use-ph";
import { invalidateAfterClientChange } from "@/lib/invalidate-app-data";
import { clientSchema, formatZodError } from "@/lib/schemas";

type ClientRow = {
  id: string;
  full_name: string;
  phone?: string | null;
  whatsapp?: string | null;
  notes?: string | null;
};

export function EditClientDialog({ client }: { client: ClientRow }) {
  const { t } = useTranslation();
  const ph = usePh();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: client.full_name ?? "",
    phone: client.phone ?? client.whatsapp ?? "",
    notes: client.notes ?? "",
  });

  function openDialog(next: boolean) {
    if (next) {
      setForm({
        name: client.full_name ?? "",
        phone: client.phone ?? client.whatsapp ?? "",
        notes: client.notes ?? "",
      });
    }
    setOpen(next);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = clientSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(formatZodError(parsed.error));
      return;
    }
    setSaving(true);
    const phone = parsed.data.phone?.trim() || null;
    const notes = parsed.data.notes?.trim() || null;
    const { error } = await supabase
      .from("clients")
      .update({
        full_name: parsed.data.name,
        phone,
        whatsapp: phone,
        notes,
      })
      .eq("id", client.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(t("toasts.saved"));
    setOpen(false);
    invalidateAfterClientChange(qc);
    qc.invalidateQueries({ queryKey: ["client", client.id] });
  }

  return (
    <Dialog open={open} onOpenChange={openDialog}>
      <DialogTrigger asChild>
        <Button variant="outline" className="rounded-xl">
          <Pencil className="mr-1.5 h-4 w-4" /> {t("detail.edit")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("clientsPage.editDialogTitle")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5">
            <Label>{t("clientsPage.clientName")} *</Label>
            <Input
              required
              placeholder={ph.client.fullName}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t("clientsPage.phone")}</Label>
            <Input
              type="tel"
              placeholder={ph.client.phone}
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t("common.notes")}</Label>
            <Textarea
              rows={3}
              placeholder={ph.client.notes}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? t("common.saving") : t("common.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
