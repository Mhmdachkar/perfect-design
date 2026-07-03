-- Storage bucket for documents + immutable monthly report snapshots

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('files', 'files', false, 52428800, NULL)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.reports_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  report_month DATE NOT NULL,
  revenue NUMERIC(14,2) NOT NULL DEFAULT 0,
  expenses NUMERIC(14,2) NOT NULL DEFAULT 0,
  profit NUMERIC(14,2) NOT NULL DEFAULT 0,
  base_currency public.currency_code NOT NULL DEFAULT 'USD',
  rates_used JSONB,
  pdf_path TEXT,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, report_month)
);

CREATE INDEX idx_reports_snapshots_user ON public.reports_snapshots(user_id, report_month DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.reports_snapshots TO authenticated;
GRANT ALL ON public.reports_snapshots TO service_role;
ALTER TABLE public.reports_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own report snapshots" ON public.reports_snapshots
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
