import type { QueryClient } from "@tanstack/react-query";
import {
  invalidateAfterClientChange,
  invalidateAfterEntityTimelineChange,
  invalidateAfterExpenseChange,
  invalidateAfterPaymentChange,
  invalidateAfterSettingsChange,
  invalidateAfterWorkshopChange,
  invalidateAppData,
  type AppDataScope,
} from "@/lib/invalidate-app-data";
import { executeMutation } from "./execute-mutation";
import { readQueue, removeMutation, updateMutation } from "./queue-store";
import { isBrowserOnline, subscribeNetworkStatus } from "./network";
import type { QueuedMutation } from "./types";

const MAX_RETRIES = 8;
const listeners = new Set<(count: number, syncing: boolean) => void>();

let queryClient: QueryClient | null = null;
let syncing = false;
let initialized = false;
let retryTimer: ReturnType<typeof setInterval> | undefined;

function notify(count: number) {
  listeners.forEach((listener) => listener(count, syncing));
}

function invalidateScope(qc: QueryClient, scope: AppDataScope) {
  switch (scope) {
    case "clients":
      invalidateAfterClientChange(qc);
      break;
    case "workshops":
      invalidateAfterWorkshopChange(qc);
      break;
    case "payments":
      invalidateAfterPaymentChange(qc);
      break;
    case "expenses":
      invalidateAfterExpenseChange(qc);
      break;
    default:
      invalidateAppData(qc, [scope]);
  }
}

/** Invalidate the right caches after a direct save or queued save. */
export function invalidateAfterWrite(
  qc: QueryClient,
  meta: {
    scopes: AppDataScope[];
    settings?: boolean;
    entityTimeline?: { entityType: string; entityId: string };
    extraQueryKeys?: (readonly string[])[];
  },
) {
  const seen = new Set<AppDataScope>();
  for (const scope of meta.scopes) {
    if (seen.has(scope)) continue;
    seen.add(scope);
    invalidateScope(qc, scope);
  }
  if (meta.settings) invalidateAfterSettingsChange(qc);
  if (meta.entityTimeline) {
    invalidateAfterEntityTimelineChange(qc, meta.entityTimeline.entityType, meta.entityTimeline.entityId);
  }
  for (const key of meta.extraQueryKeys ?? []) {
    qc.invalidateQueries({ queryKey: [...key] });
  }
}

function invalidateForMutation(item: QueuedMutation) {
  if (!queryClient) return;
  invalidateAfterWrite(queryClient, {
    scopes: item.scopes,
    settings: item.settings,
    entityTimeline: item.entityTimeline,
    extraQueryKeys: item.extraQueryKeys,
  });
}

export async function getPendingMutationCount() {
  const queue = await readQueue();
  return queue.length;
}

export function subscribeSyncStatus(listener: (pendingCount: number, syncing: boolean) => void) {
  listeners.add(listener);
  void getPendingMutationCount().then((count) => listener(count, syncing));
  return () => listeners.delete(listener);
}

export async function flushMutationQueue(options?: { force?: boolean }) {
  if (!queryClient || syncing) return;
  if (!options?.force && !isBrowserOnline()) return;

  const queue = await readQueue();
  if (queue.length === 0) {
    notify(0);
    return;
  }

  syncing = true;
  notify(queue.length);

  let remaining = queue.length;
  for (const item of queue) {
    try {
      await executeMutation(item.op);
      await removeMutation(item.id);
      invalidateForMutation(item);
      remaining -= 1;
      notify(remaining);
    } catch (err) {
      const retries = item.retries + 1;
      if (retries >= MAX_RETRIES) {
        await removeMutation(item.id);
        remaining -= 1;
        notify(remaining);
        console.error("[offline-sync] Dropping mutation after max retries", item, err);
        continue;
      }
      await updateMutation(item.id, { retries });
      if (!isBrowserOnline() || !isRetryableSyncError(err)) break;
    }
  }

  syncing = false;
  notify(await getPendingMutationCount());
}

function isRetryableSyncError(err: unknown) {
  if (!isBrowserOnline()) return false;
  const message = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
  return (
    message.includes("fetch") ||
    message.includes("network") ||
    message.includes("timeout") ||
    message.includes("failed to fetch") ||
    message.includes("load failed")
  );
}

export function initSyncEngine(client: QueryClient) {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  queryClient = client;

  subscribeNetworkStatus((online) => {
    if (online) void flushMutationQueue({ force: true });
  });

  window.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void flushMutationQueue();
  });

  retryTimer = setInterval(() => {
    void flushMutationQueue();
  }, 30_000);

  void flushMutationQueue();
}

export function disposeSyncEngine() {
  if (retryTimer) clearInterval(retryTimer);
  retryTimer = undefined;
  initialized = false;
  queryClient = null;
}
