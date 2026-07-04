import { appQueryOptions, useAppQuery } from "@/lib/offline/app-query";
import { supabase } from "@/integrations/supabase/client";
import { findLatestUsdToLbpRate, type ExchangeRateRow } from "@/lib/currency";

export const usdLbpRateQuery = appQueryOptions({
  queryKey: ["exchange-rate", "USD", "LBP"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("exchange_rates")
      .select("id,base_currency,quote_currency,rate,effective_date")
      .eq("base_currency", "USD")
      .eq("quote_currency", "LBP")
      .order("effective_date", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data as ExchangeRateRow | null;
  },
});

export function useUsdLbpRate() {
  const { data } = useAppQuery(usdLbpRateQuery);
  const row = data ? findLatestUsdToLbpRate([data]) : null;
  return {
    row,
    rate: row ? Number(row.rate) : null,
  };
}
