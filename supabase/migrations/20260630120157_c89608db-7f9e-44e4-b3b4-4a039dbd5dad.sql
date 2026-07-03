
CREATE TYPE public.workflow_status AS ENUM ('planning','in_progress','waiting','completed','cancelled','archived');
CREATE TYPE public.priority_level AS ENUM ('low','medium','high','urgent');
CREATE TYPE public.payment_method AS ENUM ('cash','bank_transfer','credit_card','western_union','paypal','other');
CREATE TYPE public.expense_category AS ENUM ('equipment','travel','software','marketing','office','taxes','utilities','other');
CREATE TYPE public.currency_code AS ENUM ('USD','LBP');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name TEXT, avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile" ON public.profiles FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.tg_set_updated_at() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.app_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  business_name TEXT, business_email TEXT, business_phone TEXT, business_address TEXT, logo_url TEXT,
  base_currency public.currency_code NOT NULL DEFAULT 'USD',
  tax_rate NUMERIC(5,2) DEFAULT 0,
  invoice_footer TEXT,
  dashboard_layout JSONB NOT NULL DEFAULT '[
    {"widget":"stat_total_clients","x":0,"y":0,"w":1,"h":1,"visible":true},
    {"widget":"stat_total_workshops","x":1,"y":0,"w":1,"h":1,"visible":true},
    {"widget":"stat_revenue","x":2,"y":0,"w":1,"h":1,"visible":true},
    {"widget":"stat_received","x":3,"y":0,"w":1,"h":1,"visible":true},
    {"widget":"stat_outstanding","x":0,"y":1,"w":1,"h":1,"visible":true},
    {"widget":"stat_today_payments","x":1,"y":1,"w":1,"h":1,"visible":true},
    {"widget":"stat_month_revenue","x":2,"y":1,"w":1,"h":1,"visible":true},
    {"widget":"stat_profit","x":3,"y":1,"w":1,"h":1,"visible":true},
    {"widget":"chart_revenue","x":0,"y":2,"w":4,"h":2,"visible":true},
    {"widget":"upcoming_workshops","x":0,"y":4,"w":2,"h":2,"visible":true},
    {"widget":"latest_payments","x":2,"y":4,"w":2,"h":2,"visible":true},
    {"widget":"latest_expenses","x":0,"y":6,"w":2,"h":2,"visible":true},
    {"widget":"recent_activity","x":2,"y":6,"w":2,"h":2,"visible":true}
  ]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own settings" ON public.app_settings FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_settings_updated BEFORE UPDATE ON public.app_settings FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.exchange_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  base_currency public.currency_code NOT NULL,
  quote_currency public.currency_code NOT NULL,
  rate NUMERIC(20,6) NOT NULL CHECK (rate > 0),
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_exchange_rates_lookup ON public.exchange_rates(user_id, base_currency, quote_currency, effective_date DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exchange_rates TO authenticated;
GRANT ALL ON public.exchange_rates TO service_role;
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own rates" ON public.exchange_rates FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.rate_at(p_user UUID, p_from public.currency_code, p_to public.currency_code, p_as_of DATE)
RETURNS NUMERIC LANGUAGE plpgsql STABLE SET search_path = public AS $$
DECLARE r NUMERIC;
BEGIN
  IF p_from = p_to THEN RETURN 1; END IF;
  SELECT rate INTO r FROM public.exchange_rates
    WHERE user_id = p_user AND base_currency = p_from AND quote_currency = p_to AND effective_date <= p_as_of
    ORDER BY effective_date DESC LIMIT 1;
  IF r IS NOT NULL THEN RETURN r; END IF;
  SELECT 1/rate INTO r FROM public.exchange_rates
    WHERE user_id = p_user AND base_currency = p_to AND quote_currency = p_from AND effective_date <= p_as_of
    ORDER BY effective_date DESC LIMIT 1;
  RETURN COALESCE(r, 1);
END $$;

CREATE OR REPLACE FUNCTION public.to_base(p_user UUID, p_amount NUMERIC, p_from public.currency_code, p_as_of DATE)
RETURNS NUMERIC LANGUAGE plpgsql STABLE SET search_path = public AS $$
DECLARE base_ccy public.currency_code;
BEGIN
  SELECT base_currency INTO base_ccy FROM public.app_settings WHERE user_id = p_user;
  RETURN COALESCE(p_amount,0) * public.rate_at(p_user, p_from, COALESCE(base_ccy,'USD'), p_as_of);
END $$;

CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT, whatsapp TEXT, country TEXT, email TEXT, company TEXT, address TEXT, photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ, deleted_by UUID
);
CREATE INDEX idx_clients_user ON public.clients(user_id) WHERE deleted_at IS NULL;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clients TO authenticated;
GRANT ALL ON public.clients TO service_role;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own clients" ON public.clients FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_clients_updated BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.workshop_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6b7280',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, name)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workshop_tags TO authenticated;
GRANT ALL ON public.workshop_tags TO service_role;
ALTER TABLE public.workshop_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own tags" ON public.workshop_tags FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.workshops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT, category TEXT,
  workflow_status public.workflow_status NOT NULL DEFAULT 'planning',
  start_date DATE, end_date DATE, deadline DATE,
  priority public.priority_level NOT NULL DEFAULT 'medium',
  assigned_date DATE DEFAULT CURRENT_DATE,
  estimated_hours NUMERIC(8,2),
  internal_notes TEXT,
  price NUMERIC(14,2) NOT NULL DEFAULT 0,
  currency public.currency_code NOT NULL DEFAULT 'USD',
  discount NUMERIC(14,2) NOT NULL DEFAULT 0,
  tax NUMERIC(14,2) NOT NULL DEFAULT 0,
  final_amount NUMERIC(14,2) GENERATED ALWAYS AS (GREATEST(price - discount, 0) + tax) STORED,
  completion_pct INT NOT NULL DEFAULT 0 CHECK (completion_pct BETWEEN 0 AND 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ, deleted_by UUID
);
CREATE INDEX idx_workshops_user ON public.workshops(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_workshops_client ON public.workshops(client_id) WHERE deleted_at IS NULL;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workshops TO authenticated;
GRANT ALL ON public.workshops TO service_role;
ALTER TABLE public.workshops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own workshops" ON public.workshops FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_workshops_updated BEFORE UPDATE ON public.workshops FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.workshop_tag_assignments (
  workshop_id UUID NOT NULL REFERENCES public.workshops ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.workshop_tags ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  PRIMARY KEY (workshop_id, tag_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workshop_tag_assignments TO authenticated;
GRANT ALL ON public.workshop_tag_assignments TO service_role;
ALTER TABLE public.workshop_tag_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own tag assigns" ON public.workshop_tag_assignments FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients ON DELETE CASCADE,
  workshop_id UUID REFERENCES public.workshops ON DELETE SET NULL,
  amount NUMERIC(14,2) NOT NULL CHECK (amount >= 0),
  currency public.currency_code NOT NULL DEFAULT 'USD',
  method public.payment_method NOT NULL DEFAULT 'cash',
  due_date DATE, received_date DATE,
  reference TEXT, notes TEXT, receipt_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ, deleted_by UUID
);
CREATE INDEX idx_payments_user ON public.payments(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_payments_workshop ON public.payments(workshop_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_payments_client ON public.payments(client_id) WHERE deleted_at IS NULL;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own payments" ON public.payments FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_payments_updated BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL, description TEXT,
  category public.expense_category NOT NULL DEFAULT 'other',
  amount NUMERIC(14,2) NOT NULL CHECK (amount >= 0),
  currency public.currency_code NOT NULL DEFAULT 'USD',
  vendor TEXT,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  receipt_url TEXT, notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ, deleted_by UUID
);
CREATE INDEX idx_expenses_user ON public.expenses(user_id) WHERE deleted_at IS NULL;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expenses TO authenticated;
GRANT ALL ON public.expenses TO service_role;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own expenses" ON public.expenses FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_expenses_updated BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  entity_type TEXT NOT NULL, entity_id UUID NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);
CREATE INDEX idx_notes_entity ON public.notes(entity_type, entity_id) WHERE deleted_at IS NULL;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notes TO authenticated;
GRANT ALL ON public.notes TO service_role;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own notes" ON public.notes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_notes_updated BEFORE UPDATE ON public.notes FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  entity_type TEXT NOT NULL, entity_id UUID NOT NULL,
  file_name TEXT NOT NULL, storage_path TEXT NOT NULL,
  mime_type TEXT, doc_type TEXT, size_bytes BIGINT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ, deleted_by UUID
);
CREATE INDEX idx_documents_entity ON public.documents(entity_type, entity_id) WHERE deleted_at IS NULL;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO authenticated;
GRANT ALL ON public.documents TO service_role;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own documents" ON public.documents FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL, entity_id UUID, entity_name TEXT,
  prev_values JSONB, new_values JSONB,
  ip TEXT, user_agent TEXT, reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_activity_user_time ON public.activity_log(user_id, created_at DESC);
CREATE INDEX idx_activity_entity ON public.activity_log(entity_type, entity_id);
GRANT SELECT, INSERT ON public.activity_log TO authenticated;
GRANT ALL ON public.activity_log TO service_role;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own activity read" ON public.activity_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own activity insert" ON public.activity_log FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.tg_log_activity() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user UUID; v_action TEXT; v_name TEXT;
  v_prev JSONB; v_new JSONB; v_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_user := OLD.user_id; v_id := OLD.id;
    v_prev := to_jsonb(OLD); v_new := NULL;
    v_action := TG_TABLE_NAME || '.deleted';
  ELSIF TG_OP = 'UPDATE' THEN
    v_user := NEW.user_id; v_id := NEW.id;
    v_prev := to_jsonb(OLD); v_new := to_jsonb(NEW);
    IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
      v_action := TG_TABLE_NAME || '.soft_deleted';
    ELSIF OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL THEN
      v_action := TG_TABLE_NAME || '.restored';
    ELSE
      v_action := TG_TABLE_NAME || '.updated';
    END IF;
  ELSE
    v_user := NEW.user_id; v_id := NEW.id;
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
  END IF;

  INSERT INTO public.activity_log (user_id, action, entity_type, entity_id, entity_name, prev_values, new_values)
  VALUES (v_user, v_action, TG_TABLE_NAME, v_id, v_name, v_prev, v_new);
  RETURN COALESCE(NEW, OLD);
END $$;

CREATE TRIGGER trg_audit_clients   AFTER INSERT OR UPDATE OR DELETE ON public.clients   FOR EACH ROW EXECUTE FUNCTION public.tg_log_activity();
CREATE TRIGGER trg_audit_workshops AFTER INSERT OR UPDATE OR DELETE ON public.workshops FOR EACH ROW EXECUTE FUNCTION public.tg_log_activity();
CREATE TRIGGER trg_audit_payments  AFTER INSERT OR UPDATE OR DELETE ON public.payments  FOR EACH ROW EXECUTE FUNCTION public.tg_log_activity();
CREATE TRIGGER trg_audit_expenses  AFTER INSERT OR UPDATE OR DELETE ON public.expenses  FOR EACH ROW EXECUTE FUNCTION public.tg_log_activity();

CREATE TABLE public.saved_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  page TEXT NOT NULL, name TEXT NOT NULL,
  filters JSONB NOT NULL DEFAULT '{}'::jsonb,
  sort JSONB NOT NULL DEFAULT '{}'::jsonb,
  columns JSONB NOT NULL DEFAULT '[]'::jsonb,
  pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_views TO authenticated;
GRANT ALL ON public.saved_views TO service_role;
ALTER TABLE public.saved_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own saved views" ON public.saved_views FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE VIEW public.workshop_financials
WITH (security_invoker = true) AS
SELECT
  w.id, w.user_id, w.client_id, w.name, w.description, w.category,
  w.workflow_status, w.start_date, w.end_date, w.deadline, w.priority,
  w.assigned_date, w.estimated_hours, w.internal_notes,
  w.price, w.currency, w.discount, w.tax, w.final_amount, w.completion_pct,
  w.created_at, w.updated_at,
  c.full_name AS client_name,
  COALESCE(SUM(public.to_base(w.user_id, p.amount, p.currency, COALESCE(p.received_date, CURRENT_DATE)))
           FILTER (WHERE p.id IS NOT NULL AND p.received_date IS NOT NULL AND p.deleted_at IS NULL), 0) AS paid_base,
  public.to_base(w.user_id, w.final_amount, w.currency, CURRENT_DATE) AS final_amount_base,
  GREATEST(
    public.to_base(w.user_id, w.final_amount, w.currency, CURRENT_DATE)
    - COALESCE(SUM(public.to_base(w.user_id, p.amount, p.currency, COALESCE(p.received_date, CURRENT_DATE)))
              FILTER (WHERE p.id IS NOT NULL AND p.received_date IS NOT NULL AND p.deleted_at IS NULL), 0),
    0
  ) AS remaining_base,
  MAX(p.received_date) FILTER (WHERE p.received_date IS NOT NULL AND p.deleted_at IS NULL) AS last_payment_date,
  CASE
    WHEN w.workflow_status = 'cancelled' THEN 'cancelled'
    WHEN w.final_amount > 0 AND
         COALESCE(SUM(public.to_base(w.user_id, p.amount, p.currency, COALESCE(p.received_date, CURRENT_DATE)))
                  FILTER (WHERE p.received_date IS NOT NULL AND p.deleted_at IS NULL),0)
         >= public.to_base(w.user_id, w.final_amount, w.currency, CURRENT_DATE)
      THEN 'paid'
    WHEN COALESCE(SUM(public.to_base(w.user_id, p.amount, p.currency, COALESCE(p.received_date, CURRENT_DATE)))
                  FILTER (WHERE p.received_date IS NOT NULL AND p.deleted_at IS NULL),0) > 0
      THEN 'partial'
    WHEN w.deadline IS NOT NULL AND w.deadline < CURRENT_DATE THEN 'overdue'
    ELSE 'pending'
  END AS financial_status
FROM public.workshops w
LEFT JOIN public.clients c ON c.id = w.client_id
LEFT JOIN public.payments p ON p.workshop_id = w.id
WHERE w.deleted_at IS NULL
GROUP BY w.id, c.full_name;

GRANT SELECT ON public.workshop_financials TO authenticated;

CREATE OR REPLACE FUNCTION public.dashboard_kpis()
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path = public AS $$
DECLARE
  v_user UUID := auth.uid();
  v_today DATE := CURRENT_DATE;
  v_month_start DATE := date_trunc('month', CURRENT_DATE)::DATE;
  v_total_clients INT; v_total_workshops INT; v_open INT; v_completed INT; v_cancelled INT;
  v_total_ws_value NUMERIC;
  v_total_received NUMERIC; v_today_received NUMERIC; v_month_received NUMERIC; v_avg_delay NUMERIC;
  v_total_expenses NUMERIC; v_month_expenses NUMERIC;
  v_revenue NUMERIC; v_outstanding NUMERIC; v_overdue INT;
BEGIN
  IF v_user IS NULL THEN RETURN '{}'::jsonb; END IF;

  SELECT COUNT(*) INTO v_total_clients FROM clients WHERE user_id=v_user AND deleted_at IS NULL;

  SELECT COUNT(*),
         COUNT(*) FILTER (WHERE workflow_status IN ('planning','in_progress','waiting')),
         COUNT(*) FILTER (WHERE workflow_status='completed'),
         COUNT(*) FILTER (WHERE workflow_status='cancelled'),
         COALESCE(SUM(to_base(v_user, final_amount, currency, CURRENT_DATE)),0)
    INTO v_total_workshops, v_open, v_completed, v_cancelled, v_total_ws_value
    FROM workshops WHERE user_id=v_user AND deleted_at IS NULL;

  SELECT COALESCE(SUM(to_base(v_user, amount, currency, COALESCE(received_date,CURRENT_DATE)))
                  FILTER (WHERE received_date IS NOT NULL), 0),
         COALESCE(SUM(to_base(v_user, amount, currency, received_date))
                  FILTER (WHERE received_date = v_today), 0),
         COALESCE(SUM(to_base(v_user, amount, currency, received_date))
                  FILTER (WHERE received_date >= v_month_start), 0),
         COALESCE(AVG(EXTRACT(EPOCH FROM (received_date - due_date))/86400)
                  FILTER (WHERE received_date IS NOT NULL AND due_date IS NOT NULL), 0)
    INTO v_total_received, v_today_received, v_month_received, v_avg_delay
    FROM payments WHERE user_id=v_user AND deleted_at IS NULL;

  SELECT COALESCE(SUM(to_base(v_user, amount, currency, expense_date)), 0),
         COALESCE(SUM(to_base(v_user, amount, currency, expense_date))
                  FILTER (WHERE expense_date >= v_month_start), 0)
    INTO v_total_expenses, v_month_expenses
    FROM expenses WHERE user_id=v_user AND deleted_at IS NULL;

  SELECT COALESCE(SUM(final_amount_base),0),
         COALESCE(SUM(remaining_base),0),
         COUNT(*) FILTER (WHERE financial_status='overdue')
    INTO v_revenue, v_outstanding, v_overdue
    FROM workshop_financials WHERE user_id=v_user;

  RETURN jsonb_build_object(
    'total_clients', v_total_clients,
    'total_workshops', v_total_workshops,
    'open_workshops', v_open,
    'completed_workshops', v_completed,
    'cancelled_workshops', v_cancelled,
    'total_revenue', v_revenue,
    'total_received', v_total_received,
    'outstanding', v_outstanding,
    'today_received', v_today_received,
    'month_received', v_month_received,
    'month_expenses', v_month_expenses,
    'total_expenses', v_total_expenses,
    'profit', v_revenue - v_total_expenses,
    'net_income', v_total_received - v_total_expenses,
    'overdue_invoices', v_overdue,
    'collection_rate', CASE WHEN v_revenue>0 THEN ROUND((v_total_received / v_revenue * 100)::numeric, 1) ELSE 0 END,
    'avg_payment_delay_days', ROUND(v_avg_delay::numeric, 1),
    'avg_workshop_value', CASE WHEN v_total_workshops>0 THEN ROUND((v_total_ws_value / v_total_workshops)::numeric,2) ELSE 0 END,
    'avg_client_value', CASE WHEN v_total_clients>0 THEN ROUND((v_revenue / v_total_clients)::numeric,2) ELSE 0 END
  );
END $$;

GRANT EXECUTE ON FUNCTION public.dashboard_kpis() TO authenticated;
GRANT EXECUTE ON FUNCTION public.rate_at(UUID, public.currency_code, public.currency_code, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.to_base(UUID, NUMERIC, public.currency_code, DATE) TO authenticated;

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), NEW.raw_user_meta_data->>'avatar_url');
  INSERT INTO public.app_settings (user_id) VALUES (NEW.id);
  INSERT INTO public.exchange_rates (user_id, base_currency, quote_currency, rate, effective_date)
  VALUES (NEW.id, 'USD', 'LBP', 89500, CURRENT_DATE);
  INSERT INTO public.workshop_tags (user_id, name, color) VALUES
    (NEW.id,'Branding','#f59e0b'),(NEW.id,'Web Design','#3b82f6'),(NEW.id,'UI/UX Design','#8b5cf6'),
    (NEW.id,'Graphic Design','#ec4899'),(NEW.id,'Logo Design','#10b981'),(NEW.id,'Photography','#06b6d4'),
    (NEW.id,'Videography','#ef4444'),(NEW.id,'Video Editing','#f97316'),(NEW.id,'Motion Graphics','#a855f7'),
    (NEW.id,'Social Media','#14b8a6'),(NEW.id,'Marketing','#eab308'),(NEW.id,'Development','#6366f1'),
    (NEW.id,'Mobile App','#0ea5e9'),(NEW.id,'Consulting','#84cc16'),(NEW.id,'Maintenance','#64748b'),
    (NEW.id,'Printing','#d97706'),(NEW.id,'Content Creation','#22c55e'),(NEW.id,'SEO','#0891b2'),
    (NEW.id,'Advertising','#db2777'),(NEW.id,'Other','#6b7280');
  RETURN NEW;
END $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
