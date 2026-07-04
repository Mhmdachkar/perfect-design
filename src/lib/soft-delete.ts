import { writeRestore, writeSoftDelete } from "@/lib/offline/offline-write";
import type { WriteResult } from "@/lib/offline/types";
import type { AppDataScope } from "@/lib/invalidate-app-data";

type SoftDeleteTable = "clients" | "workshops" | "payments" | "expenses" | "notes" | "documents";

const TABLE_SCOPES: Record<SoftDeleteTable, AppDataScope[]> = {
  clients: ["clients", "dashboard", "search", "activity"],
  workshops: ["workshops", "clients", "dashboard", "reports", "search", "notifications", "activity", "calendar"],
  payments: ["payments", "workshops", "clients", "dashboard", "reports", "notifications", "activity"],
  expenses: ["expenses", "clients", "dashboard", "reports", "activity"],
  notes: ["activity"],
  documents: ["activity"],
};

export function scopesForSoftDeleteTable(table: SoftDeleteTable): AppDataScope[] {
  return TABLE_SCOPES[table];
}

export async function softDeleteRow(
  table: SoftDeleteTable,
  id: string,
  userId: string,
  extra?: {
    entityTimeline?: { entityType: string; entityId: string };
    extraQueryKeys?: (readonly string[])[];
  },
): Promise<WriteResult> {
  return writeSoftDelete(table, id, userId, {
    scopes: TABLE_SCOPES[table],
    entityTimeline: extra?.entityTimeline,
    extraQueryKeys: extra?.extraQueryKeys,
  });
}

export async function restoreRow(table: SoftDeleteTable, id: string): Promise<WriteResult> {
  return writeRestore(table, id, {
    scopes: [...TABLE_SCOPES[table], "recycle"],
  });
}
