import { useEffect, useState } from "react";
import { getPendingMutationCount, subscribeSyncStatus } from "@/lib/offline/sync-engine";
import {
  isBrowserOnline,
  isPoorConnection,
  isSlowConnection,
  subscribeConnectionQuality,
  subscribeNetworkStatus,
} from "@/lib/offline/network";

export function useOfflineSync() {
  const [online, setOnline] = useState(() => isBrowserOnline());
  const [slowConnection, setSlowConnection] = useState(() => isSlowConnection());
  const [poorConnection, setPoorConnection] = useState(() => isPoorConnection());
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => subscribeNetworkStatus(setOnline), []);
  useEffect(
    () =>
      subscribeConnectionQuality((poor) => {
        setPoorConnection(poor);
        setSlowConnection(isSlowConnection());
      }),
    [],
  );
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

  return { online, slowConnection, poorConnection, pendingCount, syncing };
}
