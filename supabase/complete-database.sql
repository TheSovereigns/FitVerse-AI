-- ═══════════════════════════════════════════════════════════════════════════
-- FITVERSE AI - SQL COMPLETO DO BANCO DE DADOS
-- Execute este SQL no Supabase SQL Editor para fazer o site funcionar
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- PARTE 1: TABELA PROFILES (usuários)
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'premium')),
  is_admin BOOLEAN DEFAULT false,
  is_banned BOOLEAN DEFAULT false,
  country TEXT DEFAULT 'BR',
  last_seen TIMESTAMPTZ,
  stripe_customer_id TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- PARTE 2: TABELA SCANS (histórico de scans de produtos)
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_name TEXT,
  product_brand TEXT,
  scan_data JSONB,
  score INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- PARTE 3: TABELA METABOLIC PLANS (planos metabólicos dos usuários)
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.metabolic_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  perfil JSONB,
  macros JSONB,
  meals JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- PARTE 4: TABELA SUBSCRIPTIONS (assinaturas Stripe)
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  plan TEXT NOT NULL DEFAULT 'free',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'incomplete')),
  amount_brl NUMERIC,
  amount_usd NUMERIC,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- PARTE 5: TABELA EVENTS (feed de atividade em tempo real)
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_name TEXT,
  user_email TEXT,
  type TEXT NOT NULL CHECK (type IN ('signup', 'login', 'logout', 'subscription', 'upgrade', 'cancel', 'ban', 'ai_message', 'scan', 'workout', 'recipe_generate', 'profile_update')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- PARTE 6: TABELA AI_USAGE (uso do chat IA)
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  messages_count INTEGER DEFAULT 0,
  tokens_used INTEGER DEFAULT 0,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- ═══════════════════════════════════════════════════════════════════════════
-- PARTE 7: TABELA WORKOUTS (treinos dos usuários)
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT,
  exercises JSONB,
  duration_minutes INTEGER,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- PARTE 8: TABELA RECIPES (receitas geradas)
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT,
  ingredients JSONB,
  instructions JSONB,
  nutrition JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- PARTE 9: HABILITAR RLS EM TODAS AS TABELAS
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metabolic_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════════════════
-- PARTE 10: POLÍTICAS RLS (SEGURANÇA)
-- ═══════════════════════════════════════════════════════════════════════════

-- PROFILES
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;
CREATE POLICY "Admins can update profiles" ON public.profiles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

DROP POLICY IF EXISTS "Service can insert profiles" ON public.profiles;
CREATE POLICY "Service can insert profiles" ON public.profiles
  FOR INSERT WITH CHECK (true);

-- SCANS
DROP POLICY IF EXISTS "Users can view own scans" ON public.scans;
CREATE POLICY "Users can view own scans" ON public.scans
  FOR SELECT USING (user_id = (SELECT id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert scans" ON public.scans;
CREATE POLICY "Users can insert scans" ON public.scans
  FOR INSERT WITH CHECK (user_id = (SELECT id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Admins can view all scans" ON public.scans;
CREATE POLICY "Admins can view all scans" ON public.scans
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- METABOLIC PLANS
DROP POLICY IF EXISTS "Users can view own plans" ON public.metabolic_plans;
CREATE POLICY "Users can view own plans" ON public.metabolic_plans
  FOR SELECT USING (user_id = (SELECT id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert plans" ON public.metabolic_plans;
CREATE POLICY "Users can insert plans" ON public.metabolic_plans
  FOR INSERT WITH CHECK (user_id = (SELECT id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can update own plans" ON public.metabolic_plans;
CREATE POLICY "Users can update own plans" ON public.metabolic_plans
  FOR UPDATE USING (user_id = (SELECT id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Admins can view all plans" ON public.metabolic_plans;
CREATE POLICY "Admins can view all plans" ON public.metabolic_plans
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- SUBSCRIPTIONS
DROP POLICY IF EXISTS "Users can view own subscription" ON public.subscriptions;
CREATE POLICY "Users can view own subscription" ON public.subscriptions
  FOR SELECT USING (user_id = (SELECT id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert own subscription" ON public.subscriptions;
CREATE POLICY "Users can insert own subscription" ON public.subscriptions
  FOR INSERT WITH CHECK (user_id = (SELECT id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can update own subscription" ON public.subscriptions;
CREATE POLICY "Users can update own subscription" ON public.subscriptions
  FOR UPDATE USING (user_id = (SELECT id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.subscriptions;
CREATE POLICY "Admins can view all subscriptions" ON public.subscriptions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- EVENTS (feed público para admins)
DROP POLICY IF EXISTS "Users can view own events" ON public.events;
CREATE POLICY "Users can view own events" ON public.events
  FOR SELECT USING (user_id = (SELECT id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert events" ON public.events;
CREATE POLICY "Users can insert events" ON public.events
  FOR INSERT WITH CHECK (user_id = (SELECT id FROM public.profiles WHERE id = auth.uid()) OR user_id IS NULL);

DROP POLICY IF EXISTS "Admins can view all events" ON public.events;
CREATE POLICY "Admins can view all events" ON public.events
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- AI_USAGE
DROP POLICY IF EXISTS "Users can view own usage" ON public.ai_usage;
CREATE POLICY "Users can view own usage" ON public.ai_usage
  FOR SELECT USING (user_id = (SELECT id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert own usage" ON public.ai_usage;
CREATE POLICY "Users can insert own usage" ON public.ai_usage
  FOR INSERT WITH CHECK (user_id = (SELECT id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can update own usage" ON public.ai_usage;
CREATE POLICY "Users can update own usage" ON public.ai_usage
  FOR UPDATE USING (user_id = (SELECT id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Admins can view all usage" ON public.ai_usage;
CREATE POLICY "Admins can view all usage" ON public.ai_usage
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- WORKOUTS
DROP POLICY IF EXISTS "Users can view own workouts" ON public.workouts;
CREATE POLICY "Users can view own workouts" ON public.workouts
  FOR SELECT USING (user_id = (SELECT id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert workouts" ON public.workouts;
CREATE POLICY "Users can insert workouts" ON public.workouts
  FOR INSERT WITH CHECK (user_id = (SELECT id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can update own workouts" ON public.workouts;
CREATE POLICY "Users can update own workouts" ON public.workouts
  FOR UPDATE USING (user_id = (SELECT id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Admins can view all workouts" ON public.workouts;
CREATE POLICY "Admins can view all workouts" ON public.workouts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- RECIPES
DROP POLICY IF EXISTS "Users can view own recipes" ON public.recipes;
CREATE POLICY "Users can view own recipes" ON public.recipes
  FOR SELECT USING (user_id = (SELECT id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert recipes" ON public.recipes;
CREATE POLICY "Users can insert recipes" ON public.recipes
  FOR INSERT WITH CHECK (user_id = (SELECT id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Admins can view all recipes" ON public.recipes;
CREATE POLICY "Admins can view all recipes" ON public.recipes
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ═══════════════════════════════════════════════════════════════════════════
-- PARTE 11: ÍNDICES PARA PERFORMANCE
-- ═══════════════════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_plan ON public.profiles(plan);
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON public.profiles(is_admin);
CREATE INDEX IF NOT EXISTS idx_profiles_is_banned ON public.profiles(is_banned);
CREATE INDEX IF NOT EXISTS idx_scans_user_id ON public.scans(user_id);
CREATE INDEX IF NOT EXISTS idx_scans_created_at ON public.scans(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_metabolic_plans_user_id ON public.metabolic_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_events_user_id ON public.events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON public.events(type);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON public.events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_date ON public.ai_usage(user_id, date);
CREATE INDEX IF NOT EXISTS idx_workouts_user_id ON public.workouts(user_id);
CREATE INDEX IF NOT EXISTS idx_recipes_user_id ON public.recipes(user_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- PARTE 12: FUNÇÕES ÚTEIS
-- ═══════════════════════════════════════════════════════════════════════════

-- Função para criar perfil automaticamente após signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, country)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'country', 'BR')
  );
  
  -- Log do evento de signup
  INSERT INTO public.events (user_id, user_email, type, metadata)
  VALUES (NEW.id, NEW.email, 'signup', '{}');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar perfil
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Função para registrar eventos
CREATE OR REPLACE FUNCTION public.log_event(
  p_type TEXT,
  p_user_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.events (user_id, type, metadata)
  VALUES (p_user_id, p_type, p_metadata);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para atualizar último acesso (last_seen)
CREATE OR REPLACE FUNCTION public.update_last_seen(p_user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.profiles
  SET last_seen = NOW()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════════════════
-- PARTE 13: VIEWS ADMINISTRATIVAS
-- ═══════════════════════════════════════════════════════════════════════════

-- View para overview do admin
CREATE OR REPLACE VIEW public.admin_overview AS
SELECT
  (SELECT COUNT(*) FROM public.profiles) as total_users,
  (SELECT COUNT(*) FROM public.profiles WHERE plan = 'free') as free_users,
  (SELECT COUNT(*) FROM public.profiles WHERE plan = 'premium') as premium_users,
  (SELECT COUNT(*) FROM public.profiles WHERE is_admin = true) as admin_users,
  (SELECT COUNT(*) FROM public.profiles WHERE is_banned = true) as banned_users,
  (SELECT COUNT(*) FROM public.profiles WHERE DATE(created_at) = CURRENT_DATE) as new_today,
  (SELECT COUNT(*) FROM public.subscriptions WHERE status = 'active') as active_subs,
  (SELECT COUNT(*) FROM public.subscriptions WHERE status = 'canceled' AND DATE(canceled_at) >= CURRENT_DATE - INTERVAL '30 days') as canceled_this_month,
  (SELECT COALESCE(SUM(amount_brl), 0) FROM public.subscriptions WHERE status = 'active') as mrr_brl,
  (SELECT COALESCE(SUM(amount_usd), 0) FROM public.subscriptions WHERE status = 'active') as mrr_usd;

-- View para usuários ativos recentemento
CREATE OR REPLACE VIEW public.active_users AS
SELECT 
  p.id,
  p.name,
  p.email,
  p.plan,
  p.is_admin,
  p.last_seen,
  p.created_at,
  COUNT(s.id) as total_scans,
  COALESCE(SUM(au.messages_count), 0) as total_ai_messages
FROM public.profiles p
LEFT JOIN public.scans s ON s.user_id = p.id
LEFT JOIN public.ai_usage au ON au.user_id = p.id
GROUP BY p.id, p.name, p.email, p.plan, p.is_admin, p.last_seen, p.created_at
ORDER BY p.last_seen DESC NULLS LAST;

-- View para recente atividade
CREATE OR REPLACE VIEW public.recent_events AS
SELECT 
  e.id,
  e.user_id,
  e.user_email,
  e.type,
  e.metadata,
  e.created_at,
  p.plan,
  p.is_banned
FROM public.events e
LEFT JOIN public.profiles p ON e.user_id = p.id
ORDER BY e.created_at DESC
LIMIT 100;

-- ═══════════════════════════════════════════════════════════════════════════
-- PARTE 14: HABILITAR REALTIME
-- ═══════════════════════════════════════════════════════════════════════════
ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;

-- ═══════════════════════════════════════════════════════════════════════════
-- INSTRUÇÕES FINAIS:
-- ═══════════════════════════════════════════════════════════════════════════

/*
Para criar um usuário ADMIN, execute:

-- Primeiro, найдите o ID do usuário pelo email
SELECT id, email, name, is_admin FROM public.profiles WHERE email = 'seu-email@dominio.com';

-- Depois, atualize para admin
UPDATE public.profiles SET is_admin = true WHERE email = 'seu-email@dominio.com';

Para verificar se tudo está funcionando:
SELECT * FROM public.admin_overview;
*/

-- Criar usuário admin inicial (substitua pelo seu email)
-- UPDATE public.profiles SET is_admin = true WHERE email = 'SEU_EMAIL_AQUI';