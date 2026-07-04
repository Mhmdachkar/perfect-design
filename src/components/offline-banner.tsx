import { useTranslation } from "react-i18next";
import { CloudOff } from "lucide-react";
import { useOfflineSync } from "@/hooks/use-offline-sync";
import { cn } from "@/lib/utils";

export function OfflineBanner() {
  const { t } = useTranslation();
  const { poorConnection, pendingCount } = useOfflineSync();

  if (!poorConnection) return null;

  return (
    <div
      className={cn(
        "sticky top-0 z-50 border-b px-4 py-2 text-xs sm:text-sm",
        "border-amber-500/30 bg-amber-500/10 text-amber-100",
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center gap-2">
        <CloudOff className="h-4 w-4 shrink-0" />
        <p>
          {pendingCount > 0
            ? t("offline.workingOfflinePending", { count: pendingCount })
            : t("offline.workingOffline")}
        </p>
      </div>
    </div>
  );
}
