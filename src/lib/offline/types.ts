import type { AppDataScope } from "@/lib/invalidate-app-data";

export type MutationOp =
  | {
      type: "insert";
      table: string;
      payload: Record<string, unknown>;
      select?: string;
    }
  | {
      type: "update";
      table: string;
      payload: Record<string, unknown>;
      match: { column: string; value: string };
    }
  | {
      type: "upsert";
      table: string;
      payload: Record<string, unknown>;
      onConflict?: string;
    }
  | {
      type: "delete";
      table: string;
      match: { column: string; value: string };
    };

export type QueuedMutation = {
  id: string;
  createdAt: number;
  retries: number;
  scopes: AppDataScope[];
  settings?: boolean;
  entityTimeline?: { entityType: string; entityId: string };
  extraQueryKeys?: (readonly string[])[];
  op: MutationOp;
  localRecordId?: string;
};

export type WriteResult<T = unknown> =
  | { status: "saved"; data: T }
  | { status: "queued"; localId?: string; queueId: string };
