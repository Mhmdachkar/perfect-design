import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useUiStore } from "@/stores/ui-store";
import { applyDocumentLocale } from "@/lib/i18n";

/** Syncs Zustand locale -> i18next + <html lang/dir>. Call once at app root. */
export function useLocaleSync() {
  const locale = useUiStore((s) => s.locale);
  const { i18n } = useTranslation();
  useEffect(() => {
    if (i18n.language !== locale) i18n.changeLanguage(locale);
    applyDocumentLocale(locale);
  }, [locale, i18n]);
}
