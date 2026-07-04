import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { writeInsert, writeUpdate } from "@/lib/offline/offline-write";
import { runSoftDelete, runWrite } from "@/lib/offline/run-write";
import { Empty } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Plus, Pencil, Trash2, FileText, Check, X } from "lucide-react";
import { relativeTime } from "@/lib/format";
import { usePh } from "@/hooks/use-ph";

type Note = { id: string; body: string; created_at: string; updated_at?: string };

export function NotesPanel({
  entityType,
  entityId,
  notes,
  queryKey,
}: {
  entityType: string;
  entityId: string;
  notes: Note[];
  queryKey?: unknown[];
}) {
  const { t } = useTranslation();
  const ph = usePh();
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");
  const qc = useQueryClient();

  async function add() {
    if (!body.trim()) return;
    setSaving(true);
    const timeline = { entityType, entityId };
    await runWrite({
      qc,
      t,
      meta: {
        scopes: ["activity"],
        entityTimeline: timeline,
        extraQueryKeys: queryKey ? [queryKey as readonly string[]] : undefined,
      },
      successKey: "toasts.noteAdded",
      write: async () => {
        const { data: u } = await supabase.auth.getUser();
        if (!u.user) throw new Error("Not signed in");
        return writeInsert({
          table: "notes",
          payload: {
            entity_type: entityType,
            entity_id: entityId,
            body,
            user_id: u.user.id,
          },
          scopes: ["activity"],
          entityTimeline: timeline,
        });
      },
      onSaved: () => setBody(""),
    });
    setSaving(false);
  }

  async function saveEdit(id: string) {
    if (!editBody.trim()) return;
    const timeline = { entityType, entityId };
    await runWrite({
      qc,
      t,
      meta: {
        scopes: ["activity"],
        entityTimeline: timeline,
        extraQueryKeys: queryKey ? [queryKey as readonly string[]] : undefined,
      },
      successKey: "toasts.noteUpdated",
      write: () =>
        writeUpdate({
          table: "notes",
          payload: { body: editBody },
          match: { column: "id", value: id },
          scopes: ["activity"],
          entityTimeline: timeline,
        }),
      onSaved: () => setEditingId(null),
    });
  }

  async function del(id: string) {
    if (!confirm(t("confirm.deleteNote"))) return;
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    await runSoftDelete({
      qc,
      t,
      table: "notes",
      id,
      userId: u.user.id,
      successKey: "toasts.noteDeleted",
      entityTimeline: { entityType, entityId },
      extraQueryKeys: queryKey ? [queryKey as readonly string[]] : undefined,
    });
  }

  return (
    <div className="space-y-3">
      <div className="surface-card p-4">
        <Textarea placeholder={ph.notes.new} value={body} onChange={(e) => setBody(e.target.value)} rows={3} />
        <div className="mt-2 flex justify-end">
          <Button onClick={add} disabled={saving || !body.trim()}>
            <Plus className="mr-1 h-4 w-4" />{t("detail.addNote")}
          </Button>
        </div>
      </div>
      {notes.length === 0 ? (
        <Empty icon={FileText} title={t("empty.noNotes")} />
      ) : (
        <ul className="space-y-2">
          {notes.map((n) => (
            <li key={n.id} className="surface-card p-4">
              {editingId === n.id ? (
                <div className="space-y-2">
                  <Input placeholder={ph.notes.edit} value={editBody} onChange={(e) => setEditBody(e.target.value)} />
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="outline" onClick={() => setEditingId(null)}><X className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" onClick={() => saveEdit(n.id)}><Check className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="whitespace-pre-wrap text-sm">{n.body}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-[11px] text-muted-foreground">{relativeTime(n.created_at)}</p>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingId(n.id); setEditBody(n.body); }}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => del(n.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
