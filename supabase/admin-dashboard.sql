-- =============================================
-- FitVerse AI - SQL COMPLETO PARA ADMIN DASHBOARD
-- Execute no Supabase SQL Editor
-- =============================================

-- =============================================
-- 1. ALTERAR TABELA PROFILES (adicionar colunas)
-- =============================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plan text DEFAULT 'free';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS country text DEFAULT 'BR';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_seen timestamp with time zone;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_customer_id text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_banned boolean DEFAULT false;

-- =============================================
-- 2. CRIAR TABELA SUBSCRIPTIONS
-- =============================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_subscription_id text UNIQUE,
  stripe_customer_id text,
  plan text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  amount_brl numeric,
  amount_usd numeric,
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  canceled_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

-- =============================================
-- 3. CRIAR TABELA EVENTS (feed de atividade)
-- =============================================
CREATE TABLE IF NOT EXISTS events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  user_name text,
  user_email text,
  type text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now()
);

-- =============================================
-- 4. CRIAR TABELA AI_USAGE (uso do chat IA)
-- =============================================
CREATE TABLE IF NOT EXISTS ai_usage (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  messages_count integer DEFAULT 0,
  tokens_used integer DEFAULT 0,
  date date DEFAULT CURRENT_DATE,
  UNIQUE(user_id, date)
);

-- =============================================
-- 5. CRIAR ÍNDICES PARA PERFORMANCE
-- =============================================
CREATE INDEX IF NOT EXISTS idx_profiles_plan ON profiles(plan);
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin);
CREATE INDEX IF NOT EXISTS idx_profiles_is_banned ON profiles(is_banned);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at);
CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_id ON ai_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_date ON ai_usage(date);

-- =============================================
-- 6. POLÍTICAS RLS (SEGURANÇA)
-- =============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;

-- Policies para profiles
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT TO authenticated
  USING (is_admin = true);

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

-- Policies para subscriptions
CREATE POLICY "Admins can view all subscriptions" ON subscriptions
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Users can view own subscription" ON subscriptions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Policies para events
CREATE POLICY "Admins can view all events" ON events
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Users can view own events" ON events
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Policy de insert para events (qualquer usuário logado pode criar)
CREATE POLICY "Authenticated can insert events" ON events
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Policies para ai_usage
CREATE POLICY "Admins can view all ai_usage" ON ai_usage
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Users can view own ai_usage" ON ai_usage
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- =============================================
-- 7. CRIAR VIEW ADMIN_OVERVIEW
-- =============================================
CREATE OR REPLACE VIEW admin_overview AS
SELECT
  (SELECT COUNT(*) FROM profiles) as total_users,
  (SELECT COUNT(*) FROM profiles WHERE plan = 'free') as free_users,
  (SELECT COUNT(*) FROM profiles WHERE plan = 'premium') as premium_users,
  (SELECT COUNT(*) FROM profiles WHERE DATE(created_at) = CURRENT_DATE) as new_today,
  (SELECT COUNT(*) FROM subscriptions WHERE status = 'active') as active_subs,
  (SELECT COALESCE(SUM(amount_brl), 0) FROM subscriptions WHERE status = 'active') as mrr_brl,
  (SELECT COALESCE(SUM(amount_usd), 0) FROM subscriptions WHERE status = 'active') as mrr_usd;

-- =============================================
-- 8. CRIAR VIEW PARA ATIVIDADE RECENTE
-- =============================================
CREATE OR REPLACE VIEW recent_events_view AS
SELECT 
  e.id,
  e.user_id,
  e.user_name,
  e.user_email,
  e.type,
  e.metadata,
  e.created_at,
  p.plan,
  p.is_banned
FROM events e
LEFT JOIN profiles p ON e.user_id = p.id
ORDER BY e.created_at DESC
LIMIT 50;

-- =============================================
-- 9. CRIAR VIEW PARA TOP USUÁRIOS
-- =============================================
CREATE OR REPLACE VIEW top_users_view AS
SELECT 
  p.id,
  p.name,
  p.email,
  p.plan,
  p.is_admin,
  p.is_banned,
  COALESCE(SUM(au.messages_count), 0) as total_messages
FROM profiles p
LEFT JOIN ai_usage au ON p.id = au.user_id
WHERE au.date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY p.id, p.name, p.email, p.plan, p.is_admin, p.is_banned
ORDER BY total_messages DESC
LIMIT 10;

-- =============================================
-- 10. CRIAR FUNÇÃO RPC PARA LOG DE EVENTOS
-- =============================================
CREATE OR REPLACE FUNCTION log_event(
  p_type text,
  p_user_id uuid DEFAULT auth.uid(),
  p_metadata jsonb DEFAULT '{}'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO events (user_id, user_name, user_email, type, metadata)
  SELECT 
    p.id,
    p.name,
    p.email,
    p_type,
    p_metadata
  FROM profiles p
  WHERE p.id = p_user_id
  ON CONFLICT DO NOTHING;
END;
$$;

-- =============================================
-- 11. CRIAR FUNÇÃO PARA ATUALIZAR PRESENÇA
-- =============================================
CREATE OR REPLACE FUNCTION update_last_seen(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET last_seen = now()
  WHERE id = p_user_id;
END;
$$;

-- =============================================
-- 12. CRIAR TRIGGER PARA ATUALIZAR last_seen
-- =============================================
CREATE OR REPLACE FUNCTION update_last_seen_trigger()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE profiles
  SET last_seen = now()
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$;

-- =============================================
-- 13. HABILITAR REALTIME
-- =============================================
ALTER PUBLICATION supabase_realtime ADD TABLE events;
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;

-- =============================================
-- 14. CRIAR USUÁRIO ADMIN (execute separadamente)
-- =============================================
-- UPDATE profiles SET is_admin = true WHERE email = 'seu-email@dominio.com';

-- =============================================
-- 15. CRIAR DADOS DE TESTE (OPCIONAL)
-- =============================================
-- INSERT INTO events (user_id, user_name, user_email, type, metadata)
-- SELECT 
--   id, 
--   name, 
--   email, 
--   (ARRAY['signup', 'login', 'subscription', 'cancel', 'ai_message'])[floor(random() * 5 + 1)],
--   '{}'
-- FROM profiles
-- ORDER BY random()
-- LIMIT 20;