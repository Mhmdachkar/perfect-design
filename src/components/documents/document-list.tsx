import { useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { softDeleteRow } from "@/lib/soft-delete";
import { Button } from "@/components/ui/button";
import { Upload, Download, Trash2, FileText } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/format";
import { logActivity } from "@/lib/auth-activity";
import { invalidateAfterEntityTimelineChange } from "@/lib/invalidate-app-data";
import { validateUploadFile, sanitizeFileName } from "@/lib/upload-validation";

export function DocumentList({ entityType, entityId }: { entityType: string; entityId: string }) {
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: docs = [] } = useQuery({
    queryKey: ["documents", entityType, entityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("entity_type", entityType)
        .eq("entity_id", entityId)
        .is("deleted_at", null)
        .order("uploaded_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;

    for (const file of Array.from(files)) {
      const validationError = validateUploadFile(file);
      if (validationError) {
        toast.error(validationError);
        continue;
      }
      const safeName = sanitizeFileName(file.name);
      const path = `${u.user.id}/${entityType}/${entityId}/${Date.now()}-${safeName}`;
      const { error: upErr } = await supabase.storage.from("files").upload(path, file);
      if (upErr) { toast.error(upErr.message); continue; }

      const { error } = await supabase.from("documents").insert({
        user_id: u.user.id,
        entity_type: entityType,
        entity_id: entityId,
        file_name: safeName,
        storage_path: path,
        mime_type: file.type || null,
        doc_type: "attachment",
        size_bytes: file.size,
      });
      if (error) toast.error(error.message);
    }
    qc.invalidateQueries({ queryKey: ["documents", entityType, entityId] });
    invalidateAfterEntityTimelineChange(qc, entityType, entityId);
    toast.success("Upload complete");
  }

  async function download(storagePath: string, fileName: string) {
    const { data, error } = await supabase.storage.from("files").download(storagePath);
    if (error || !data) return toast.error(error?.message ?? "Download failed");
    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
    await logActivity("document.downloaded", entityType, entityId, fileName, { queryClient: qc });
  }

  async function del(id: string) {
    if (!confirm("Move document to recycle bin?")) return;
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { error } = await softDeleteRow("documents", id, u.user.id);
    if (error) return toast.error(error.message);
    invalidateAfterEntityTimelineChange(qc, entityType, entityId);
    toast.success("Document deleted");
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <input ref={inputRef} type="file" className="hidden" multiple onChange={(e) => upload(e.target.files)} />
        <Button variant="outline" size="sm" className="rounded-xl" onClick={() => inputRef.current?.click()}>
          <Upload className="mr-1.5 h-3.5 w-3.5" />Upload
        </Button>
      </div>
      {docs.length === 0 ? (
        <p className="py-4 text-sm text-muted-foreground">No documents yet.</p>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border">
          {docs.map((d) => (
            <li key={d.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="flex min-w-0 items-center gap-2">
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{d.file_name}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(d.uploaded_at)}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => download(d.storage_path, d.file_name)}>
                  <Download className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => del(d.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
