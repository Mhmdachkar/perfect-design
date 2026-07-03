-- Security hardening: soft-delete RLS, storage MIME types, restricted activity logging

-- ---------------------------------------------------------------------------
-- Activity log: remove open client INSERT; use restricted RPC instead
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "own activity insert" ON public.activity_log;

CREATE OR REPLACE FUNCTION public.log_app_activity(
  p_action text,
  p_entity_type text,
  p_entity_id uuid DEFAULT NULL,
  p_entity_name text DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  allowed boolean := false;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;

  allowed := (
    (p_action IN ('auth.signed_in', 'auth.signed_out') AND p_entity_type = 'auth')
    OR (p_action IN ('workshop.invoice_printed', 'workshop.tag_assigned', 'workshop.tag_removed') AND p_entity_type = 'workshop')
    OR (p_action = 'document.downloaded' AND p_entity_type IN ('client', 'workshop'))
    OR (p_action = 'dashboard.layout_updated' AND p_entity_type = 'dashboard')
    OR (p_action IN ('reports.snapshot_generated', 'reports.exported') AND p_entity_type = 'reports')
  );

  IF NOT allowed THEN
    RAISE EXCEPTION 'activity action not permitted';
  END IF;

  INSERT INTO public.activity_log (user_id, action, entity_type, entity_id, entity_name, user_agent)
  VALUES (auth.uid(), p_action, p_entity_type, p_entity_id, p_entity_name, p_user_agent);
END;
$$;

REVOKE ALL ON FUNCTION public.log_app_activity(text, text, uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_app_activity(text, text, uuid, text, text) TO authenticated;

-- ---------------------------------------------------------------------------
-- Storage bucket MIME allowlist
-- ---------------------------------------------------------------------------
UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv'
]::text[]
WHERE id = 'files';

-- ---------------------------------------------------------------------------
-- Soft-delete RLS: split FOR ALL into granular policies per tenant table
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  tbl text;
  pol text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['clients', 'workshops', 'payments', 'expenses', 'notes', 'documents']
  LOOP
    pol := 'own ' || tbl;
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol, tbl);

    EXECUTE format(
      'CREATE POLICY %I_select_active ON public.%I FOR SELECT USING (auth.uid() = user_id AND deleted_at IS NULL)',
      tbl, tbl
    );
    EXECUTE format(
      'CREATE POLICY %I_select_deleted ON public.%I FOR SELECT USING (auth.uid() = user_id AND deleted_at IS NOT NULL)',
      tbl, tbl
    );
    EXECUTE format(
      'CREATE POLICY %I_insert ON public.%I FOR INSERT WITH CHECK (auth.uid() = user_id)',
      tbl, tbl
    );
    EXECUTE format(
      'CREATE POLICY %I_update ON public.%I FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)',
      tbl, tbl
    );
    EXECUTE format(
      'CREATE POLICY %I_delete ON public.%I FOR DELETE USING (auth.uid() = user_id)',
      tbl, tbl
    );
  END LOOP;
END $$;
