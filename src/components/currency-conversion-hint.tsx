import { useTranslation } from "react-i18next";
import { convertCurrency, isAppCurrency } from "@/lib/currency";
import { formatMoney } from "@/lib/format";

type Props = {
  amount: string;
  currency: string;
  rate: number | null | undefined;
};

export function CurrencyConversionHint({ amount, currency, rate }: Props) {
  const { t } = useTranslation();
  const parsed = Number(amount);
  if (!amount || !Number.isFinite(parsed) || parsed <= 0) return null;
  if (!isAppCurrency(currency) || !rate) {
    return (
      <p className="text-[11px] text-muted-foreground">
        {t("currency.setRateHint")}
      </p>
    );
  }

  const target = currency === "USD" ? "LBP" : "USD";
  const converted = convertCurrency(parsed, currency, target, rate);
  if (converted == null) return null;

  return (
    <p className="text-[11px] text-muted-foreground">
      {t("currency.convertedAmount", {
        amount: formatMoney(converted, target),
        rate: rate.toLocaleString("en-US"),
      })}
    </p>
  );
}
