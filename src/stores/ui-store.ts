import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AppLocale = "en" | "ar";
export type AppTheme = "light" | "dark";

interface UiState {
  locale: AppLocale;
  theme: AppTheme;
  sidebarCollapsed: boolean;
  commandOpen: boolean;
  setLocale: (l: AppLocale) => void;
  setTheme: (t: AppTheme) => void;
  toggleTheme: () => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (v: boolean) => void;
  setCommandOpen: (v: boolean) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      locale: "en",
      theme: "dark",
      sidebarCollapsed: false,
      commandOpen: false,
      setLocale: (l) => set({ locale: l }),
      setTheme: (t) => set({ theme: t }),
      toggleTheme: () => set((s) => ({ theme: s.theme === "dark" ? "light" : "dark" })),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
      setCommandOpen: (v) => set({ commandOpen: v }),
    }),
    { name: "atelier-ui", partialize: (s) => ({ locale: s.locale, theme: s.theme, sidebarCollapsed: s.sidebarCollapsed }) }
  )
);
