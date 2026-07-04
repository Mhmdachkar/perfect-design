import type { ReactNode } from "react";

/** Placeholder gate — cache restore is handled by PersistQueryClientProvider. */
export function OfflineQueryRestoreGate({ children }: { children: ReactNode }) {
  return children;
}
