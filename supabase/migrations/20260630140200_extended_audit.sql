-- Extend audit logging to notes, documents, tags, settings, exchange rates

CREATE OR REPLACE FUNCTION public.tg_log_activity() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user UUID; v_action TEXT; v_name TEXT;
  v_prev JSONB; v_new JSONB; v_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_user := OLD.user_id;
    IF TG_TABLE_NAME = 'app_settings' THEN v_id := OLD.user_id;
    ELSE v_id := OLD.id;
    END IF;
    v_prev := to_jsonb(OLD); v_new := NULL;
    v_action := TG_TABLE_NAME || '.deleted';
  ELSIF TG_OP = 'UPDATE' THEN
    v_user := NEW.user_id;
    IF TG_TABLE_NAME = 'app_settings' THEN v_id := NEW.user_id;
    ELSE v_id := NEW.id;
    END IF;
    v_prev := to_jsonb(OLD); v_new := to_jsonb(NEW);
    IF TG_TABLE_NAME IN ('clients','workshops','payments','expenses','notes','documents')
       AND OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
      v_action := TG_TABLE_NAME || '.soft_deleted';
    ELSIF TG_TABLE_NAME IN ('clients','workshops','payments','expenses','notes','documents')
       AND OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL THEN
      v_action := TG_TABLE_NAME || '.restored';
    ELSE
      v_action := TG_TABLE_NAME || '.updated';
    END IF;
  ELSE
    v_user := NEW.user_id;
    IF TG_TABLE_NAME = 'app_settings' THEN v_id := NEW.user_id;
    ELSE v_id := NEW.id;
    END IF;
    v_prev := NULL; v_new := to_jsonb(NEW);
    v_action := TG_TABLE_NAME || '.created';
  END IF;

  IF TG_TABLE_NAME = 'clients' THEN
    v_name := COALESCE((v_new->>'full_name'), (v_prev->>'full_name'));
  ELSIF TG_TABLE_NAME = 'workshops' THEN
    v_name := COALESCE((v_new->>'name'), (v_prev->>'name'));
  ELSIF TG_TABLE_NAME = 'expenses' THEN
    v_name := COALESCE((v_new->>'name'), (v_prev->>'name'));
  ELSIF TG_TABLE_NAME = 'payments' THEN
    v_name := 'Payment ' || COALESCE((v_new->>'amount'), (v_prev->>'amount'),'');
  ELSIF TG_TABLE_NAME = 'notes' THEN
    v_name := left(COALESCE((v_new->>'body'), (v_prev->>'body'), ''), 80);
  ELSIF TG_TABLE_NAME = 'documents' THEN
    v_name := COALESCE((v_new->>'file_name'), (v_prev->>'file_name'));
  ELSIF TG_TABLE_NAME = 'workshop_tags' THEN
    v_name := COALESCE((v_new->>'name'), (v_prev->>'name'));
  ELSIF TG_TABLE_NAME = 'app_settings' THEN
    v_name := COALESCE((v_new->>'business_name'), (v_prev->>'business_name'), 'Settings');
  ELSIF TG_TABLE_NAME = 'exchange_rates' THEN
    v_name := COALESCE((v_new->>'base_currency'), (v_prev->>'base_currency'), '') || '→' ||
              COALESCE((v_new->>'quote_currency'), (v_prev->>'quote_currency'), '');
  END IF;

  INSERT INTO public.activity_log (user_id, action, entity_type, entity_id, entity_name, prev_values, new_values)
  VALUES (v_user, v_action, TG_TABLE_NAME, v_id, v_name, v_prev, v_new);
  RETURN COALESCE(NEW, OLD);
END $$;

DROP TRIGGER IF EXISTS trg_audit_notes ON public.notes;
CREATE TRIGGER trg_audit_notes AFTER INSERT OR UPDATE OR DELETE ON public.notes
  FOR EACH ROW EXECUTE FUNCTION public.tg_log_activity();

DROP TRIGGER IF EXISTS trg_audit_documents ON public.documents;
CREATE TRIGGER trg_audit_documents AFTER INSERT OR UPDATE OR DELETE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.tg_log_activity();

DROP TRIGGER IF EXISTS trg_audit_tags ON public.workshop_tags;
CREATE TRIGGER trg_audit_tags AFTER INSERT OR UPDATE OR DELETE ON public.workshop_tags
  FOR EACH ROW EXECUTE FUNCTION public.tg_log_activity();

DROP TRIGGER IF EXISTS trg_audit_settings ON public.app_settings;
CREATE TRIGGER trg_audit_settings AFTER INSERT OR UPDATE OR DELETE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION public.tg_log_activity();

DROP TRIGGER IF EXISTS trg_audit_rates ON public.exchange_rates;
CREATE TRIGGER trg_audit_rates AFTER INSERT OR UPDATE OR DELETE ON public.exchange_rates
  FOR EACH ROW EXECUTE FUNCTION public.tg_log_activity();
