import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { APP_CURRENCIES, normalizeCurrency, type AppCurrency } from "@/lib/currency";

type Props = {
  value: string;
  onValueChange: (value: AppCurrency) => void;
};

export function CurrencySelect({ value, onValueChange }: Props) {
  const normalized = normalizeCurrency(value);
  return (
    <Select value={normalized} onValueChange={(v) => onValueChange(v as AppCurrency)}>
      <SelectTrigger><SelectValue /></SelectTrigger>
      <SelectContent>
        {APP_CURRENCIES.map((c) => (
          <SelectItem key={c} value={c}>{c}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
