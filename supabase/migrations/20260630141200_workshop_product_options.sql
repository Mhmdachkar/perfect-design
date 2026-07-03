-- Workshop product options (measurements, sizes, cover choices)
ALTER TABLE public.workshops ADD COLUMN IF NOT EXISTS product_ref_id TEXT;
ALTER TABLE public.workshops ADD COLUMN IF NOT EXISTS category_path_snapshot TEXT;
ALTER TABLE public.workshops ADD COLUMN IF NOT EXISTS options_snapshot JSONB NOT NULL DEFAULT '{}';
ALTER TABLE public.workshops ADD COLUMN IF NOT EXISTS custom_measurement TEXT;
