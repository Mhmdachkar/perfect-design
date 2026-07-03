import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Bookmark, Save } from "lucide-react";
import { toast } from "sonner";
import { usePh } from "@/hooks/use-ph";
import type { FilterState } from "@/lib/filters";

type SavedView = {
  id: string;
  name: string;
  filters: FilterState;
  sort: Record<string, string>;
  columns: string[];
  pinned: boolean;
};

export function FilterBar({
  page,
  filters,
  onFiltersChange,
  filterDefs,
}: {
  page: string;
  filters: FilterState;
  onFiltersChange: (f: FilterState) => void;
  filterDefs: { key: string; label: string; options: { value: string; label: string }[] }[];
}) {
  const { t } = useTranslation();
  const ph = usePh();
  const qc = useQueryClient();
  const [saveName, setSaveName] = useState("");

  const { data: views = [] } = useQuery({
    queryKey: ["saved-views", page],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("saved_views")
        .select("*")
        .eq("page", page)
        .order("pinned", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as SavedView[];
    },
  });

  async function saveView() {
    if (!saveName.trim()) return;
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("saved_views").insert({
      user_id: u.user!.id,
      page,
      name: saveName.trim(),
      filters,
      sort: {},
      columns: [],
    });
    if (error) return toast.error(error.message);
    toast.success(t("toasts.viewSaved"));
    setSaveName("");
    qc.invalidateQueries({ queryKey: ["saved-views", page] });
  }

  function loadView(v: SavedView) {
    onFiltersChange(v.filters as FilterState);
    toast.success(t("toasts.viewLoaded", { name: v.name }));
  }

  return (
    <div className="surface-card mb-4 space-y-3 p-3">
      <div className="flex flex-wrap items-center gap-2">
        {filterDefs.map((def) => (
          <Select
            key={def.key}
            value={filters[def.key] ?? "all"}
            onValueChange={(v) => onFiltersChange({ ...filters, [def.key]: v })}
          >
            <SelectTrigger className="h-8 w-[140px] text-xs">
              <SelectValue placeholder={def.label} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("filters.all", { label: def.label })}</SelectItem>
              {def.options.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
        {views.map((v) => (
          <Button key={v.id} variant="outline" size="sm" className="h-7 text-xs" onClick={() => loadView(v)}>
            {v.pinned && <Bookmark className="mr-1 h-3 w-3" />}{v.name}
          </Button>
        ))}
        <div className="flex flex-1 items-center gap-2 min-w-[200px]">
          <Input
            placeholder={ph.filter}
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            className="h-8 text-xs"
          />
          <Button size="sm" variant="secondary" className="h-8" onClick={saveView} disabled={!saveName.trim()}>
            <Save className="mr-1 h-3 w-3" />{t("filters.saveView")}
          </Button>
        </div>
      </div>
    </div>
  );
}
