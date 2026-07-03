import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Empty } from "@/components/app-shell";
import { Users, Search, MessageCircle } from "lucide-react";
import { useState } from "react";
import { NewClientModal } from "@/components/clients/new-client-modal";
import { prefetchRouteQuery } from "@/lib/prefetch-route";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { usePh } from "@/hooks/use-ph";
import { initialsOf, relativeTime } from "@/lib/format";

const clientsQuery = queryOptions({
  queryKey: ["clients"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("clients")
      .select("id,full_name,phone,whatsapp,notes,created_at")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw error;
    return data;
  },
});

export const Route = createFileRoute("/_authenticated/clients/")({
  loader: ({ context }) => {
    prefetchRouteQuery(context.queryClient, clientsQuery);
  },
  component: ClientsPage,
});

function clientPhone(c: { phone?: string | null; whatsapp?: string | null }) {
  return c.phone || c.whatsapp || "";
}

function ClientsPage() {
  const { t } = useTranslation();
  const ph = usePh();
  const { data: clients } = useSuspenseQuery(clientsQuery);
  const [q, setQ] = useState("");

  const filtered = clients.filter((c) => {
    if (!q) return true;
    const needle = q.toLowerCase();
    const phone = clientPhone(c);
    return (
      c.full_name?.toLowerCase().includes(needle) ||
      phone.includes(q)
    );
  });

  return (
    <div>
      <PageHeader
        title={t("clients.title")}
        description={`${clients.length} ${t("clients.title").toLowerCase()}`}
        action={<NewClientModal />}
      />

      <div className="surface-card mb-4 flex items-center gap-2 px-4 py-2.5">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={ph.client.search}
          className="flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground md:text-sm"
        />
      </div>

      {filtered.length === 0 ? (
        <Empty
          icon={Users}
          title={clients.length === 0 ? t("empty.noClients") : t("empty.noMatches")}
          description={clients.length === 0 ? t("clientsPage.emptyDescription") : t("clientsPage.noMatchesDescription")}
          action={clients.length === 0 ? <NewClientModal /> : undefined}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => {
            const phone = clientPhone(c);
            return (
              <div key={c.id} className="surface-card group p-5 transition-all hover:border-border-strong hover:shadow-[var(--shadow-elev)]">
                <div className="flex items-start gap-2">
                  <Link to="/clients/$id" params={{ id: c.id }} className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary to-primary/60 text-sm font-semibold text-primary-foreground">
                      {initialsOf(c.full_name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{c.full_name}</p>
                      <p className="truncate text-xs text-muted-foreground">{phone || "—"}</p>
                    </div>
                  </Link>
                  {phone && <WhatsAppButton phone={phone} compact />}
                </div>
                <Link to="/clients/$id" params={{ id: c.id }} className="block">
                  {c.notes && (
                    <p className="mt-3 line-clamp-2 text-xs text-muted-foreground">{c.notes}</p>
                  )}
                  <div className="mt-4 space-y-1.5 text-xs text-muted-foreground">
                    {phone && (
                      <p className="flex items-center gap-2">
                        <MessageCircle className="h-3 w-3" /> {phone}
                      </p>
                    )}
                  </div>
                  <p className="mt-4 text-[11px] text-muted-foreground">
                    {t("clientsPage.added", { time: relativeTime(c.created_at) })}
                  </p>
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
