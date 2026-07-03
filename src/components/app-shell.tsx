import { useState, type ReactNode } from "react";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard, Users, Briefcase, Wallet, Receipt, Calendar,
  Activity, FileBarChart2, Settings, Trash2, Sparkles, Search, LogOut, Menu, X, ChevronsLeft, ChevronsRight, Languages, Moon, Sun,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useUiStore } from "@/stores/ui-store";
import { CommandPalette } from "@/components/command-palette";
import { NotificationsBell } from "@/components/notifications-bell";
import { APP_NAME } from "@/lib/brand";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NAV = [
  { to: "/dashboard", key: "dashboard", icon: LayoutDashboard },
  { to: "/clients", key: "clients", icon: Users },
  { to: "/workshops", key: "workshops", icon: Briefcase },
  { to: "/payments", key: "payments", icon: Wallet },
  { to: "/expenses", key: "expenses", icon: Receipt },
  { to: "/calendar", key: "calendar", icon: Calendar },
  { to: "/activity", key: "activity", icon: Activity },
  { to: "/reports", key: "reports", icon: FileBarChart2 },
] as const;

const SECONDARY = [
  { to: "/recycle-bin", key: "recycleBin", icon: Trash2 },
  { to: "/settings", key: "settings", icon: Settings },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const sidebarCollapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const locale = useUiStore((s) => s.locale);
  const setLocale = useUiStore((s) => s.setLocale);
  const setCommandOpen = useUiStore((s) => s.setCommandOpen);
  const theme = useUiStore((s) => s.theme);
  const toggleTheme = useUiStore((s) => s.toggleTheme);

  const isActive = (to: string) =>
    pathname === to || (to !== "/" && pathname.startsWith(to + "/"));

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const sidebarWidth = sidebarCollapsed ? "lg:w-[72px]" : "lg:w-[248px]";
  const mainPad = sidebarCollapsed ? "lg:ps-[72px]" : "lg:ps-[248px]";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <CommandPalette />
      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-border bg-background/80 px-4 py-3 backdrop-blur pt-[max(0.75rem,env(safe-area-inset-top))] lg:hidden">
        <button onClick={() => setMobileOpen(true)} className="grid min-h-11 min-w-11 place-items-center rounded-lg border border-border" aria-label={t("nav.menu", { defaultValue: "Menu" })}>
          <Menu className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-lg bg-primary text-primary-foreground"><Sparkles className="h-3.5 w-3.5" /></div>
          <span className="text-sm font-semibold tracking-tight">{APP_NAME}</span>
        </div>
        <div className="flex items-center gap-2">
          <NotificationsBell compact />
          <LanguageSwitcher locale={locale} setLocale={setLocale} compact />
        </div>
      </header>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" />
          <aside className="absolute top-0 h-full w-72 border-e border-sidebar-border bg-sidebar p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] start-0" onClick={(e) => e.stopPropagation()}>
            <SidebarContent
              collapsed={false}
              onNav={() => setMobileOpen(false)}
              signOut={signOut}
              isActive={isActive}
              t={t}
              locale={locale}
              setLocale={setLocale}
              onOpenCommand={() => setCommandOpen(true)}
              onToggleTheme={toggleTheme}
              theme={theme}
            />
            <button onClick={() => setMobileOpen(false)} className="absolute top-3 grid h-8 w-8 place-items-center rounded-lg hover:bg-sidebar-accent end-3">
              <X className="h-4 w-4" />
            </button>
          </aside>
        </div>
      )}

      <div className="flex">
        {/* Desktop sidebar */}
        <aside className={cn(
          "hidden lg:fixed lg:inset-y-0 lg:z-30 lg:flex lg:flex-col lg:border-sidebar-border lg:bg-sidebar transition-[width] duration-200 lg:start-0 lg:border-e",
          sidebarWidth
        )}>
          <SidebarContent
            collapsed={sidebarCollapsed}
            onToggleCollapse={toggleSidebar}
            signOut={signOut}
            isActive={isActive}
            t={t}
            locale={locale}
            setLocale={setLocale}
            onOpenCommand={() => setCommandOpen(true)}
            onToggleTheme={toggleTheme}
            theme={theme}
          />
        </aside>

        {/* Main */}
        <main className={cn("min-w-0 flex-1", mainPad)}>
          <div className="mx-auto w-full max-w-[1400px] px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6 lg:px-10 lg:py-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function LanguageSwitcher({ locale, setLocale, compact }: { locale: "en" | "ar"; setLocale: (l: "en" | "ar") => void; compact?: boolean }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className={cn(
          "inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-medium hover:bg-surface-2",
          compact && "px-2"
        )}>
          <Languages className="h-3.5 w-3.5" />
          <span>{locale === "ar" ? "العربية" : "English"}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[140px]">
        <DropdownMenuItem onClick={() => setLocale("en")}>🇬🇧 English</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLocale("ar")}>🇸🇦 العربية</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SidebarContent({
  collapsed, onNav, onToggleCollapse, signOut, isActive, t, locale, setLocale, onOpenCommand, onToggleTheme, theme,
}: {
  collapsed: boolean;
  onNav?: () => void;
  onToggleCollapse?: () => void;
  signOut: () => void;
  isActive: (to: string) => boolean;
  t: (k: string) => string;
  locale: "en" | "ar";
  setLocale: (l: "en" | "ar") => void;
  onOpenCommand?: () => void;
  onToggleTheme?: () => void;
  theme?: "light" | "dark";
}) {
  return (
    <div className="flex h-full flex-col gap-2 p-3">
      <div className="flex items-center justify-between px-2 py-3">
        <Link to="/dashboard" onClick={onNav} className="flex min-w-0 items-center gap-2.5">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-[var(--shadow-glow)]">
            <Sparkles className="h-4 w-4" />
          </div>
          {!collapsed && <span className="truncate text-base font-semibold tracking-tight">{APP_NAME}</span>}
        </Link>
        {onToggleCollapse && (
          <button onClick={onToggleCollapse} className="hidden h-7 w-7 place-items-center rounded-lg text-muted-foreground hover:bg-sidebar-accent lg:grid">
            {collapsed
              ? <ChevronsRight className="h-4 w-4 rtl-flip" />
              : <ChevronsLeft className="h-4 w-4 rtl-flip" />}
          </button>
        )}
      </div>

      {!collapsed && (
        <div className="px-2">
          <button type="button" onClick={onOpenCommand} className="flex w-full items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm text-muted-foreground hover:bg-surface-2">
            <Search className="h-3.5 w-3.5" />
            <span className="flex-1 text-start">{t("common.search")}</span>
            <kbd className="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px]">⌘K</kbd>
          </button>
        </div>
      )}

      <nav className="mt-2 flex flex-1 flex-col gap-0.5 overflow-y-auto px-1">
        {NAV.map((item) => (
          <NavItem key={item.to} to={item.to} label={t(`nav.${item.key}`)} Icon={item.icon} active={isActive(item.to)} onNav={onNav} collapsed={collapsed} />
        ))}
        <div className="my-2 h-px bg-sidebar-border" />
        {SECONDARY.map((item) => (
          <NavItem key={item.to} to={item.to} label={t(`nav.${item.key}`)} Icon={item.icon} active={isActive(item.to)} onNav={onNav} collapsed={collapsed} />
        ))}
      </nav>

      {!collapsed && (
        <div className="flex items-center gap-2 px-2">
          <NotificationsBell />
          <LanguageSwitcher locale={locale} setLocale={setLocale} />
          {onToggleTheme && (
            <button type="button" onClick={onToggleTheme} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-surface-2" title="Toggle theme">
              {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            </button>
          )}
        </div>
      )}

      <div className="border-t border-sidebar-border pt-2">
        <button
          onClick={signOut}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
            collapsed && "justify-center"
          )}
        >
          <LogOut className="h-4 w-4 shrink-0 rtl-flip" />
          {!collapsed && <span>{t("nav.signOut")}</span>}
        </button>
      </div>
    </div>
  );
}

function NavItem({ to, label, Icon, active, onNav, collapsed }: {
  to: string; label: string; Icon: React.ComponentType<{ className?: string }>;
  active: boolean; onNav?: () => void; collapsed?: boolean;
}) {
  return (
    <Link
      to={to as any}
      onClick={onNav}
      preload="intent"
      className={cn(
        "group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        collapsed && "justify-center"
      )}
      title={collapsed ? label : undefined}
    >
      <Icon className={cn("h-4 w-4 shrink-0", active && "text-primary")} />
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );
}

export function PageHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <header className="mb-8 flex flex-col items-stretch gap-3 sm:grid sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end sm:gap-4">
      <div className="min-w-0">
        <h1 className="truncate text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{title}</h1>
        {description && <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="shrink-0 [&_.rounded-xl]:w-full sm:[&_.rounded-xl]:w-auto">{action}</div>}
    </header>
  );
}

export function Empty({ title, description, action, icon: Icon }: {
  title: string; description?: string; action?: ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="surface-card flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      {Icon && (
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-surface-2 text-muted-foreground">
          <Icon className="h-5 w-5" />
        </div>
      )}
      <h3 className="text-base font-semibold">{title}</h3>
      {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export { Button };
