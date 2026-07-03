import { supabase } from "@/integrations/supabase/client";

type SoftDeleteTable = "clients" | "workshops" | "payments" | "expenses" | "notes" | "documents";

export async function softDeleteRow(table: SoftDeleteTable, id: string, userId: string) {
  const now = new Date().toISOString();
  return supabase.from(table).update({ deleted_at: now, deleted_by: userId }).eq("id", id);
}

export async function restoreRow(table: SoftDeleteTable, id: string) {
  return supabase.from(table).update({ deleted_at: null, deleted_by: null }).eq("id", id);
}
