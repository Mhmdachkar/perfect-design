-- Stored conversion on payments and expenses for historical accuracy

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS exchange_rate NUMERIC(20,6),
  ADD COLUMN IF NOT EXISTS amount_base NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS rate_effective_date DATE;

ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS exchange_rate NUMERIC(20,6),
  ADD COLUMN IF NOT EXISTS amount_base NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS rate_effective_date DATE;

CREATE OR REPLACE FUNCTION public.tg_snapshot_transaction_rate()
RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  v_as_of DATE;
  v_base public.currency_code;
  v_rate NUMERIC;
BEGIN
  IF TG_TABLE_NAME = 'payments' THEN
    v_as_of := COALESCE(NEW.received_date, NEW.due_date, CURRENT_DATE);
  ELSE
    v_as_of := COALESCE(NEW.expense_date, CURRENT_DATE);
  END IF;

  SELECT base_currency INTO v_base FROM public.app_settings WHERE user_id = NEW.user_id;
  v_base := COALESCE(v_base, 'USD');
  v_rate := public.rate_at(NEW.user_id, NEW.currency, v_base, v_as_of);

  NEW.rate_effective_date := v_as_of;
  NEW.exchange_rate := v_rate;
  NEW.amount_base := COALESCE(NEW.amount, 0) * v_rate;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_payments_snapshot_rate ON public.payments;
CREATE TRIGGER trg_payments_snapshot_rate
  BEFORE INSERT OR UPDATE OF amount, currency, received_date, due_date ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.tg_snapshot_transaction_rate();

DROP TRIGGER IF EXISTS trg_expenses_snapshot_rate ON public.expenses;
CREATE TRIGGER trg_expenses_snapshot_rate
  BEFORE INSERT OR UPDATE OF amount, currency, expense_date ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.tg_snapshot_transaction_rate();

UPDATE public.payments p SET
  rate_effective_date = COALESCE(p.received_date, p.due_date, CURRENT_DATE),
  exchange_rate = public.rate_at(p.user_id, p.currency, COALESCE(s.base_currency, 'USD'), COALESCE(p.received_date, p.due_date, CURRENT_DATE)),
  amount_base = public.to_base(p.user_id, p.amount, p.currency, COALESCE(p.received_date, p.due_date, CURRENT_DATE))
FROM public.app_settings s
WHERE s.user_id = p.user_id;

UPDATE public.expenses e SET
  rate_effective_date = COALESCE(e.expense_date, CURRENT_DATE),
  exchange_rate = public.rate_at(e.user_id, e.currency, COALESCE(s.base_currency, 'USD'), COALESCE(e.expense_date, CURRENT_DATE)),
  amount_base = public.to_base(e.user_id, e.amount, e.currency, COALESCE(e.expense_date, CURRENT_DATE))
FROM public.app_settings s
WHERE s.user_id = e.user_id;

REVOKE EXECUTE ON FUNCTION public.tg_snapshot_transaction_rate() FROM PUBLIC, anon, authenticated;
