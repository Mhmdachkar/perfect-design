import type { AppDataScope } from "@/lib/invalidate-app-data";
import { appendMutation } from "./queue-store";
import { executeMutation } from "./execute-mutation";
import { isBrowserOnline, isRetryableNetworkError, isTimeoutError, markConnectionDegraded, raceWithTimeout } from "./network";
import type { MutationOp, QueuedMutation, WriteResult } from "./types";

type WriteMeta = {
  scopes: AppDataScope[];
  settings?: boolean;
  entityTimeline?: { entityType: string; entityId: string };
  extraQueryKeys?: (readonly string[])[];
};

type InsertOptions = WriteMeta & {
  table: string;
  payload: Record<string, unknown>;
  select?: string;
  id?: string;
};

type UpdateOptions = WriteMeta & {
  table: string;
  payload: Record<string, unknown>;
  match: { column: string; value: string };
};

type UpsertOptions = WriteMeta & {
  table: string;
  payload: Record<string, unknown>;
  onConflict?: string;
};

type DeleteOptions = WriteMeta & {
  table: string;
  match: { column: string; value: string };
};

async function enqueue(op: MutationOp, meta: WriteMeta, localRecordId?: string): Promise<string> {
  const entry: QueuedMutation = {
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    retries: 0,
    scopes: meta.scopes,
    settings: meta.settings,
    entityTimeline: meta.entityTimeline,
    extraQueryKeys: meta.extraQueryKeys,
    op,
    localRecordId,
  };
  await appendMutation(entry);
  return entry.id;
}

async function attemptWrite<T>(execute: () => Promise<T>): Promise<T> {
  if (!isBrowserOnline()) {
    throw new Error("offline");
  }
  try {
    return await raceWithTimeout(execute());
  } catch (err) {
    if (isTimeoutError(err)) markConnectionDegraded();
    throw err;
  }
}

export async function writeInsert<T = { id: string }>(options: InsertOptions): Promise<WriteResult<T>> {
  const localId = options.id ?? crypto.randomUUID();
  const payload = { ...options.payload, id: localId };
  const op: MutationOp = {
    type: "insert",
    table: options.table,
    payload,
    select: options.select,
  };

  try {
    const data = (await attemptWrite(() => executeMutation(op))) as T;
    return { status: "saved", data: data ?? ({ id: localId } as T) };
  } catch (err) {
    if (!isRetryableNetworkError(err)) throw err;
    const queueId = await enqueue(op, options, localId);
    return { status: "queued", localId, queueId };
  }
}

export async function writeUpdate(options: UpdateOptions): Promise<WriteResult> {
  const op: MutationOp = {
    type: "update",
    table: options.table,
    payload: options.payload,
    match: options.match,
  };

  try {
    await attemptWrite(() => executeMutation(op));
    return { status: "saved", data: null };
  } catch (err) {
    if (!isRetryableNetworkError(err)) throw err;
    const queueId = await enqueue(op, options);
    return { status: "queued", queueId };
  }
}

export async function writeUpsert(options: UpsertOptions): Promise<WriteResult> {
  const op: MutationOp = {
    type: "upsert",
    table: options.table,
    payload: options.payload,
    onConflict: options.onConflict,
  };

  try {
    await attemptWrite(() => executeMutation(op));
    return { status: "saved", data: null };
  } catch (err) {
    if (!isRetryableNetworkError(err)) throw err;
    const queueId = await enqueue(op, options);
    return { status: "queued", queueId };
  }
}

export async function writeDelete(options: DeleteOptions): Promise<WriteResult> {
  const op: MutationOp = {
    type: "delete",
    table: options.table,
    match: options.match,
  };

  try {
    await attemptWrite(() => executeMutation(op));
    return { status: "saved", data: null };
  } catch (err) {
    if (!isRetryableNetworkError(err)) throw err;
    const queueId = await enqueue(op, options);
    return { status: "queued", queueId };
  }
}

export async function writeSoftDelete(
  table: string,
  id: string,
  userId: string,
  meta: WriteMeta,
): Promise<WriteResult> {
  const now = new Date().toISOString();
  return writeUpdate({
    table,
    payload: { deleted_at: now, deleted_by: userId },
    match: { column: "id", value: id },
    ...meta,
  });
}

export async function writeRestore(table: string, id: string, meta: WriteMeta): Promise<WriteResult> {
  return writeUpdate({
    table,
    payload: { deleted_at: null, deleted_by: null },
    match: { column: "id", value: id },
    ...meta,
  });
}
