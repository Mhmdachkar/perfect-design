import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { usePh } from "@/hooks/use-ph";
import { invalidateAfterClientChange } from "@/lib/invalidate-app-data";
import { clientSchema, formatZodError } from "@/lib/schemas";

type NewClientModalProps = {
  trigger?: React.ReactNode;
  onCreated?: (clientId: string) => void;
};

export function NewClientModal({ trigger, onCreated }: NewClientModalProps) {
  const { t } = useTranslation();
  const ph = usePh();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", phone: "", notes: "" });

  function resetForm() {
    setForm({ name: "", phone: "", notes: "" });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = clientSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(formatZodError(parsed.error));
      return;
    }
    setSaving(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const { name, phone, notes } = parsed.data;
      const { data, error } = await supabase
        .from("clients")
        .insert({
          full_name: name,
          phone: phone || null,
          whatsapp: phone || null,
          notes: notes || null,
          user_id: u.user.id,
        })
        .select("id")
        .single();
      if (error) throw error;
      toast.success(t("toasts.clientAdded"));
      setOpen(false);
      resetForm();
      invalidateAfterClientChange(qc);
      if (onCreated) {
        onCreated(data.id);
      } else {
        navigate({ to: "/clients/$id", params: { id: data.id } });
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t("auth.errorGeneric"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="rounded-xl">
            <Plus className="mr-1.5 h-4 w-4" /> {t("clients.newClient")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("clientsPage.newDialogTitle")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
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
              {saving ? t("common.saving") : t("clientsPage.createClient")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
