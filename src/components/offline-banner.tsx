import { useTranslation } from "react-i18next";
import { CloudOff, CloudUpload, Wifi } from "lucide-react";
import { useOfflineSync } from "@/hooks/use-offline-sync";
import { cn } from "@/lib/utils";

export function OfflineBanner() {
  const { t } = useTranslation();
  const { online, pendingCount, syncing } = useOfflineSync();

  if (online && pendingCount === 0 && !syncing) return null;

  const tone = !online ? "offline" : syncing ? "syncing" : "pending";
  const Icon = !online ? CloudOff : syncing ? CloudUpload : Wifi;

  return (
    <div
      className={cn(
        "sticky top-0 z-50 border-b px-4 py-2 text-xs sm:text-sm",
        tone === "offline" && "border-amber-500/30 bg-amber-500/10 text-amber-100",
        tone === "syncing" && "border-primary/30 bg-primary/10 text-primary-foreground",
        tone === "pending" && "border-sky-500/30 bg-sky-500/10 text-sky-100",
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center gap-2">
        <Icon className="h-4 w-4 shrink-0" />
        <p>
          {!online
            ? pendingCount > 0
              ? t("offline.workingOfflinePending", { count: pendingCount })
              : t("offline.workingOffline")
            : syncing
              ? t("offline.syncing", { count: pendingCount })
              : t("offline.pendingSync", { count: pendingCount })}
        </p>
      </div>
    </div>
  );
}
