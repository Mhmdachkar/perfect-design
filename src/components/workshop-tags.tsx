import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { usePh } from "@/hooks/use-ph";
import { Tag } from "@/components/status-pill";
import { logActivity } from "@/lib/auth-activity";
import { invalidateAfterActivityChange } from "@/lib/invalidate-app-data";

export function WorkshopTagsManager() {
  const { t } = useTranslation();
  const ph = usePh();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [color, setColor] = useState("#6366f1");

  const { data: tags = [] } = useQuery({
    queryKey: ["workshop-tags"],
    queryFn: async () => {
      const { data, error } = await supabase.from("workshop_tags").select("*").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  async function add() {
    if (!name.trim()) return;
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("workshop_tags").insert({
      user_id: u.user!.id, name: name.trim(), color,
    });
    if (error) return toast.error(error.message);
    setName("");
    qc.invalidateQueries({ queryKey: ["workshop-tags"] });
    toast.success(t("toasts.tagCreated"));
  }

  async function del(id: string) {
    if (!confirm(t("confirm.deleteTag"))) return;
    await supabase.from("workshop_tag_assignments").delete().eq("tag_id", id);
    const { error } = await supabase.from("workshop_tags").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["workshop-tags"] });
  }

  return (
    <section className="surface-card mb-6 p-6">
      <h2 className="mb-1 text-base font-semibold tracking-tight">{t("settingsPage.workshopTags")}</h2>
      <p className="mb-4 text-xs text-muted-foreground">{t("settingsPage.workshopTagsHint")}</p>
      <div className="mb-4 flex flex-wrap gap-2">
        {tags.map((tag) => (
          <div key={tag.id} className="flex items-center gap-1">
            <Tag name={tag.name} color={tag.color} />
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => del(tag.id)}><Trash2 className="h-3 w-3" /></Button>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <Input placeholder={ph.tag} value={name} onChange={(e) => setName(e.target.value)} className="max-w-[200px]" />
        <Input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-9 w-14 p-1" />
        <Button onClick={add}><Plus className="mr-1 h-4 w-4" />{t("settingsPage.addTag")}</Button>
      </div>
    </section>
  );
}

export function WorkshopTagPicker({
  workshopId,
  assignedIds,
}: {
  workshopId: string;
  assignedIds: string[];
}) {
  const qc = useQueryClient();
  const { data: tags = [] } = useQuery({
    queryKey: ["workshop-tags"],
    queryFn: async () => {
      const { data } = await supabase.from("workshop_tags").select("*").order("name");
      return data ?? [];
    },
  });

  async function toggle(tagId: string) {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const tag = tags.find((tg) => tg.id === tagId);
    const tagName = tag?.name ?? "Unknown";
    if (assignedIds.includes(tagId)) {
      await supabase.from("workshop_tag_assignments").delete().eq("workshop_id", workshopId).eq("tag_id", tagId);
      await logActivity("workshop.tag_removed", "workshop", workshopId, `Tag: ${tagName}`, { queryClient: qc });
    } else {
      await supabase.from("workshop_tag_assignments").insert({ workshop_id: workshopId, tag_id: tagId, user_id: u.user.id });
      await logActivity("workshop.tag_assigned", "workshop", workshopId, `Tag: ${tagName}`, { queryClient: qc });
    }
    qc.invalidateQueries({ queryKey: ["workshop", workshopId] });
    qc.invalidateQueries({ queryKey: ["workshops"] });
    invalidateAfterActivityChange(qc);
  }

  if (tags.length === 0) return null;

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {tags.map((tag) => {
        const active = assignedIds.includes(tag.id);
        return (
          <button
            key={tag.id}
            type="button"
            onClick={() => toggle(tag.id)}
            className={`rounded-full border px-2.5 py-0.5 text-xs font-medium transition-opacity ${active ? "opacity-100" : "opacity-40"}`}
            style={{ borderColor: tag.color, color: tag.color }}
          >
            {tag.name}
          </button>
        );
      })}
    </div>
  );
}
