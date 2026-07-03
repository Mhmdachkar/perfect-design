import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator,
} from "@/components/ui/command";
import { useUiStore } from "@/stores/ui-store";
import {
  LayoutDashboard, Users, Briefcase, Wallet, Receipt, Calendar, Activity, FileBarChart2, Settings, Trash2,
} from "lucide-react";
import { commandSearchQuery } from "@/lib/command-search";
import { formatMoney } from "@/lib/format";

const NAV = [
  { to: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { to: "/clients", labelKey: "nav.clients", icon: Users },
  { to: "/workshops", labelKey: "nav.workshops", icon: Briefcase },
  { to: "/payments", labelKey: "nav.payments", icon: Wallet },
  { to: "/expenses", labelKey: "nav.expenses", icon: Receipt },
  { to: "/calendar", labelKey: "nav.calendar", icon: Calendar },
  { to: "/activity", labelKey: "nav.activity", icon: Activity },
  { to: "/reports", labelKey: "nav.reports", icon: FileBarChart2 },
  { to: "/recycle-bin", labelKey: "nav.recycleBin", icon: Trash2 },
  { to: "/settings", labelKey: "nav.settings", icon: Settings },
] as const;

export function CommandPalette() {
  const { t } = useTranslation();
  const open = useUiStore((s) => s.commandOpen);
  const setOpen = useUiStore((s) => s.setCommandOpen);
  const navigate = useNavigate();
  const { data } = useQuery({ ...commandSearchQuery, enabled: open });

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(!open);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  function go(to: string, params?: { id: string }) {
    setOpen(false);
    if (params) navigate({ to, params } as any);
    else navigate({ to });
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder={t("common.searchGlobal")} />
      <CommandList>
        <CommandEmpty>{t("common.noResults")}</CommandEmpty>

        {(data?.clients.length ?? 0) > 0 && (
          <CommandGroup heading={t("clients.title")}>
            {data!.clients.map((c) => (
              <CommandItem key={c.id} value={`client ${c.full_name} ${c.company ?? ""}`} onSelect={() => go("/clients/$id", { id: c.id })}>
                <Users className="me-2 h-4 w-4" />
                <span className="truncate">{c.full_name}</span>
                {c.company && <span className="ms-2 truncate text-xs text-muted-foreground">{c.company}</span>}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {(data?.workshops.length ?? 0) > 0 && (
          <CommandGroup heading={t("workshops.title")}>
            {data!.workshops.map((w) => (
              <CommandItem key={w.id} value={`workshop ${w.name} ${w.client_name ?? ""}`} onSelect={() => go("/workshops/$id", { id: w.id })}>
                <Briefcase className="me-2 h-4 w-4" />
                <span className="truncate">{w.name}</span>
                {w.client_name && <span className="ms-2 truncate text-xs text-muted-foreground">{w.client_name}</span>}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {(data?.payments.length ?? 0) > 0 && (
          <CommandGroup heading={t("payments.title")}>
            {data!.payments.map((p) => (
              <CommandItem
                key={p.id}
                value={`payment ${p.reference ?? ""} ${p.amount}`}
                onSelect={() => p.workshop_id ? go("/workshops/$id", { id: p.workshop_id }) : go("/payments")}
              >
                <Wallet className="me-2 h-4 w-4" />
                <span>{formatMoney(p.amount, p.currency)}</span>
                {p.reference && <span className="ms-2 text-xs text-muted-foreground">{p.reference}</span>}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandSeparator />
        <CommandGroup heading={t("common.navigate")}>
          {NAV.map((item) => (
            <CommandItem key={item.to} value={t(item.labelKey)} onSelect={() => go(item.to)}>
              <item.icon className="me-2 h-4 w-4" />
              {t(item.labelKey)}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading={t("common.actions")}>
          <CommandItem onSelect={() => go("/clients")}>{t("clients.newClient")}</CommandItem>
          <CommandItem onSelect={() => go("/workshops")}>{t("workshops.newWorkshop")}</CommandItem>
          <CommandItem onSelect={() => go("/expenses")}>{t("expenses.newExpense")}</CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
