import { createStore, del, get, set, update } from "idb-keyval";
import type { QueuedMutation } from "./types";

const store = createStore("perfect-design-offline", "mutation-queue");
const QUEUE_KEY = "pending-mutations";

export async function readQueue(): Promise<QueuedMutation[]> {
  const items = await get<QueuedMutation[]>(QUEUE_KEY, store);
  return items ?? [];
}

export async function writeQueue(items: QueuedMutation[]) {
  await set(QUEUE_KEY, items, store);
}

export async function appendMutation(item: QueuedMutation) {
  await update(
    QUEUE_KEY,
    (current: QueuedMutation[] | undefined) => [...(current ?? []), item],
    store,
  );
}

export async function removeMutation(id: string) {
  await update(
    QUEUE_KEY,
    (current: QueuedMutation[] | undefined) => (current ?? []).filter((item) => item.id !== id),
    store,
  );
}

export async function updateMutation(id: string, patch: Partial<QueuedMutation>) {
  await update(
    QUEUE_KEY,
    (current: QueuedMutation[] | undefined) =>
      (current ?? []).map((item) => (item.id === id ? { ...item, ...patch } : item)),
    store,
  );
}

export async function clearQueue() {
  await del(QUEUE_KEY, store);
}
