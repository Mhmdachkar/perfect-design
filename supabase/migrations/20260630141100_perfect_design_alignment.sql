-- Align with Perfect Design spec: client notes + LYD currency
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TYPE public.currency_code ADD VALUE IF NOT EXISTS 'LYD';
