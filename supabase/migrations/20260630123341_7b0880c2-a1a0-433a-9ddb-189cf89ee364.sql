
-- 1. Drop 'tax' from expense_category enum (no rows currently use it)
ALTER TYPE public.expense_category RENAME TO expense_category_old;
CREATE TYPE public.expense_category AS ENUM ('software','hardware','travel','marketing','rent','utilities','supplies','freelancer','other');
ALTER TABLE public.expenses
  ALTER COLUMN category DROP DEFAULT,
  ALTER COLUMN category TYPE public.expense_category
  USING category::text::public.expense_category;
ALTER TABLE public.expenses ALTER COLUMN category SET DEFAULT 'other'::public.expense_category;
DROP TYPE public.expense_category_old;

-- 2. Add client_id / workshop_id to expenses
ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS workshop_id uuid REFERENCES public.workshops(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS expenses_client_id_idx ON public.expenses(client_id);
CREATE INDEX IF NOT EXISTS expenses_workshop_id_idx ON public.expenses(workshop_id);

-- 3. Add locale + preferred_currency to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS locale text NOT NULL DEFAULT 'en' CHECK (locale IN ('en','ar')),
  ADD COLUMN IF NOT EXISTS preferred_currency text NOT NULL DEFAULT 'USD';
