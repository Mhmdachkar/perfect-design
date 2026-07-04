import { useEffect, useState } from "react";
import { getPendingMutationCount, subscribeSyncStatus } from "@/lib/offline/sync-engine";
import { isBrowserOnline, subscribeNetworkStatus } from "@/lib/offline/network";

export function useOfflineSync() {
  const [online, setOnline] = useState(() => isBrowserOnline());
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => subscribeNetworkStatus(setOnline), []);
  useEffect(
    () =>
      subscribeSyncStatus((count, isSyncing) => {
        setPendingCount(count);
        setSyncing(isSyncing);
      }),
    [],
  );
  useEffect(() => {
    void getPendingMutationCount().then(setPendingCount);
  }, []);

  return { online, pendingCount, syncing };
}
