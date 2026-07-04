import { supabase } from "@/integrations/supabase/client";
import type { MutationOp } from "./types";

export async function executeMutation(op: MutationOp): Promise<unknown> {
  switch (op.type) {
    case "insert": {
      let query = supabase.from(op.table as never).insert(op.payload as never);
      if (op.select) {
        const { data, error } = await query.select(op.select).single();
        if (error) throw error;
        return data;
      }
      const { error } = await query;
      if (error) throw error;
      return op.payload;
    }
    case "update": {
      const { error } = await supabase
        .from(op.table as never)
        .update(op.payload as never)
        .eq(op.match.column, op.match.value);
      if (error) throw error;
      return null;
    }
    case "upsert": {
      const { error } = await supabase
        .from(op.table as never)
        .upsert(op.payload as never, op.onConflict ? { onConflict: op.onConflict } : undefined);
      if (error) throw error;
      return null;
    }
    case "delete": {
      const { error } = await supabase
        .from(op.table as never)
        .delete()
        .eq(op.match.column, op.match.value);
      if (error) throw error;
      return null;
    }
    default:
      return null;
  }
}
