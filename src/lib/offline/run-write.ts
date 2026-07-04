import type { QueryClient } from "@tanstack/react-query";
import type { TFunction } from "i18next";
import { toast } from "sonner";
import { softDeleteRow, restoreRow, scopesForSoftDeleteTable } from "@/lib/soft-delete";
import { invalidateAfterWrite } from "./sync-engine";
import type { WriteResult } from "./types";
import type { AppDataScope } from "@/lib/invalidate-app-data";

type WriteMeta = {
  scopes: AppDataScope[];
  settings?: boolean;
  entityTimeline?: { entityType: string; entityId: string };
  extraQueryKeys?: (readonly string[])[];
};

export async function runWrite<T>(options: {
  qc: QueryClient;
  t: TFunction;
  meta: WriteMeta;
  write: () => Promise<WriteResult<T>>;
  successKey?: string;
  onSaved?: (data: T) => void;
}): Promise<boolean> {
  try {
    const result = await options.write();
    invalidateAfterWrite(options.qc, options.meta);

    if (result.status === "queued") {
      toast.success(options.t("offline.savedLocally"));
      options.onSaved?.(result.localId as T);
      return true;
    }

    toast.success(options.t(options.successKey ?? "toasts.saved"));
    if (result.data !== undefined && result.data !== null) {
      options.onSaved?.(result.data as T);
    } else {
      options.onSaved?.(undefined as T);
    }
    return true;
  } catch (err) {
    toast.error(err instanceof Error ? err.message : options.t("auth.errorGeneric"));
    return false;
  }
}

export async function runSoftDelete(options: {
  qc: QueryClient;
  t: TFunction;
  table: Parameters<typeof softDeleteRow>[0];
  id: string;
  userId: string;
  successKey?: string;
  entityTimeline?: { entityType: string; entityId: string };
  extraQueryKeys?: (readonly string[])[];
  onSaved?: () => void;
}): Promise<boolean> {
  return runWrite({
    qc: options.qc,
    t: options.t,
    meta: {
      scopes: scopesForSoftDeleteTable(options.table),
      entityTimeline: options.entityTimeline,
      extraQueryKeys: options.extraQueryKeys,
    },
    successKey: options.successKey ?? "toasts.movedToRecycle",
    write: () =>
      softDeleteRow(options.table, options.id, options.userId, {
        entityTimeline: options.entityTimeline,
        extraQueryKeys: options.extraQueryKeys,
      }),
    onSaved: options.onSaved,
  });
}

export async function runRestore(options: {
  qc: QueryClient;
  t: TFunction;
  table: Parameters<typeof restoreRow>[0];
  id: string;
  onSaved?: () => void;
}): Promise<boolean> {
  return runWrite({
    qc: options.qc,
    t: options.t,
    meta: { scopes: [...scopesForSoftDeleteTable(options.table), "recycle"] },
    successKey: "toasts.restored",
    write: () => restoreRow(options.table, options.id),
    onSaved: options.onSaved,
  });
}
