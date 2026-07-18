-- ═══════════════════════════════════════════════════════════════════════════
-- FITVERSE AI - BANCO DE DADOS COMPLETO
-- Execute este SQL no Supabase SQL Editor para configurar tudo
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- PARTE 1: TABELA PROFILES (usuarios)
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'premium', 'banned')),
  is_admin BOOLEAN DEFAULT false,
  is_banned BOOLEAN DEFAULT false,
  country TEXT DEFAULT 'BR' CHECK (country IN ('BR', 'US', 'other')),
  last_seen TIMESTAMPTZ,
  stripe_customer_id TEXT,
  avatar_url TEXT,
  ads_enabled BOOLEAN DEFAULT true,
  age INTEGER CHECK (age >= 10 AND age <= 120),
  weight REAL CHECK (weight > 0 AND weight <= 500),
  height REAL CHECK (height > 0 AND height <= 300),
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  fitness_goal TEXT CHECK (fitness_goal IN ('lose_weight', 'gain_muscle', 'maintain', 'improve_health')),
  profile_setup_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT profiles_email_unique UNIQUE (email)
);

-- ═══════════════════════════════════════════════════════════════════════════
-- PARTE 2: TABELA SCANS (historico de scans de produtos)
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
-- PARTE 3: TABELA METABOLIC PLANS (planos metabolicos dos usuarios)
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
-- PARTE 7: TABELA WORKOUTS (treinos dos usuarios)
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
-- PARTE 9: TABELA ONLINE_USERS (presenca em tempo real)
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.online_users (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  online_at TIMESTAMPTZ DEFAULT NOW(),
  device_info JSONB DEFAULT '{}'
);

-- ═══════════════════════════════════════════════════════════════════════════
-- PARTE 10: TABELA STRIPE_WEBHOOKS (registro de webhooks)
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.stripe_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT UNIQUE,
  event_type TEXT,
  data JSONB,
  processed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- PARTE 11: TABELA CLANS (sistema de clãs)
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.clans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT DEFAULT '',
  avatar_url TEXT,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  max_members INT DEFAULT 50,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.clan_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clan_id UUID NOT NULL REFERENCES public.clans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(clan_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.clan_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clan_id UUID NOT NULL REFERENCES public.clans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'activity', 'system')),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.clan_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clan_id UUID NOT NULL REFERENCES public.clans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('scan', 'workout', 'diet', 'streak', 'badge')),
  activity_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.clan_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clan_id UUID NOT NULL REFERENCES public.clans(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  invited_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  invite_code TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- PARTE 12: TABELA ACCOUNTABILITY (parceiros e desafios)
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.accountability_pairs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_a_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_b_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  clan_id UUID REFERENCES public.clans(id) ON DELETE SET NULL,
  combined_streak INT DEFAULT 0,
  longest_combined_streak INT DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'ended')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_a_id, user_b_id),
  CHECK (user_a_id <> user_b_id)
);

CREATE TABLE IF NOT EXISTS public.accountability_checkins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pair_id UUID NOT NULL REFERENCES public.accountability_pairs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  checkin_date DATE NOT NULL DEFAULT CURRENT_DATE,
  activity_type TEXT NOT NULL,
  activity_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(pair_id, user_id, checkin_date)
);

CREATE TABLE IF NOT EXISTS public.challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  challenge_type TEXT NOT NULL CHECK (challenge_type IN ('scans', 'workouts', 'streak', 'calories', 'custom')),
  target_value INT NOT NULL,
  unit TEXT DEFAULT '',
  clan_id UUID REFERENCES public.clans(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_date TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.challenge_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  current_value INT DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(challenge_id, user_id)
);

-- ═══════════════════════════════════════════════════════════════════════════
-- PARTE 13: HABILITAR RLS EM TODAS AS TABELAS
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metabolic_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clan_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clan_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clan_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clan_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accountability_pairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accountability_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_participants ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════════════════
-- PARTE 14: POLITICAS RLS - PROFILES
-- ═══════════════════════════════════════════════════════════════════════════
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

-- ═══════════════════════════════════════════════════════════════════════════
-- PARTE 15: POLITICAS RLS - SCANS
-- ═══════════════════════════════════════════════════════════════════════════
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

-- ═══════════════════════════════════════════════════════════════════════════
-- PARTE 16: POLITICAS RLS - METABOLIC PLANS
-- ═══════════════════════════════════════════════════════════════════════════
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

-- ═══════════════════════════════════════════════════════════════════════════
-- PARTE 17: POLITICAS RLS - SUBSCRIPTIONS
-- ═══════════════════════════════════════════════════════════════════════════
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

-- ═══════════════════════════════════════════════════════════════════════════
-- PARTE 18: POLITICAS RLS - EVENTS
-- ═══════════════════════════════════════════════════════════════════════════
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

-- ═══════════════════════════════════════════════════════════════════════════
-- PARTE 19: POLITICAS RLS - AI_USAGE
-- ═══════════════════════════════════════════════════════════════════════════
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

-- ═══════════════════════════════════════════════════════════════════════════
-- PARTE 20: POLITICAS RLS - WORKOUTS
-- ═══════════════════════════════════════════════════════════════════════════
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

-- ═══════════════════════════════════════════════════════════════════════════
-- PARTE 21: POLITICAS RLS - RECIPES
-- ═══════════════════════════════════════════════════════════════════════════
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
-- PARTE 22: POLITICAS RLS - CLANS
-- ═══════════════════════════════════════════════════════════════════════════
CREATE POLICY "clans_select_public" ON public.clans FOR SELECT USING (is_public = true);
CREATE POLICY "clans_select_member" ON public.clans FOR SELECT USING (
  id IN (SELECT clan_id FROM public.clan_members WHERE user_id = auth.uid())
);
CREATE POLICY "clans_insert_auth" ON public.clans FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "clans_update_owner" ON public.clans FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY "clans_delete_owner" ON public.clans FOR DELETE USING (owner_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════════════════
-- PARTE 23: POLITICAS RLS - CLAN_MEMBERS
-- ═══════════════════════════════════════════════════════════════════════════
CREATE POLICY "clan_members_select" ON public.clan_members FOR SELECT USING (
  clan_id IN (SELECT clan_id FROM public.clan_members WHERE user_id = auth.uid())
);
CREATE POLICY "clan_members_insert_self" ON public.clan_members FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "clan_members_delete_self" ON public.clan_members FOR DELETE USING (user_id = auth.uid());
CREATE POLICY "clan_members_delete_owner" ON public.clan_members FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.clan_members cm
    WHERE cm.clan_id = clan_members.clan_id AND cm.user_id = auth.uid() AND cm.role IN ('owner', 'admin')
  )
);

-- ═══════════════════════════════════════════════════════════════════════════
-- PARTE 24: POLITICAS RLS - CLAN_MESSAGES
-- ═══════════════════════════════════════════════════════════════════════════
CREATE POLICY "clan_messages_select" ON public.clan_messages FOR SELECT USING (
  clan_id IN (SELECT clan_id FROM public.clan_members WHERE user_id = auth.uid())
);
CREATE POLICY "clan_messages_insert" ON public.clan_messages FOR INSERT WITH CHECK (
  user_id = auth.uid() AND clan_id IN (SELECT clan_id FROM public.clan_members WHERE user_id = auth.uid())
);

-- ═══════════════════════════════════════════════════════════════════════════
-- PARTE 25: POLITICAS RLS - CLAN_ACTIVITIES
-- ═══════════════════════════════════════════════════════════════════════════
CREATE POLICY "clan_activities_select" ON public.clan_activities FOR SELECT USING (
  clan_id IN (SELECT clan_id FROM public.clan_members WHERE user_id = auth.uid())
);
CREATE POLICY "clan_activities_insert" ON public.clan_activities FOR INSERT WITH CHECK (
  user_id = auth.uid() AND clan_id IN (SELECT clan_id FROM public.clan_members WHERE user_id = auth.uid())
);

-- ═══════════════════════════════════════════════════════════════════════════
-- PARTE 26: POLITICAS RLS - CLAN_INVITATIONS
-- ═══════════════════════════════════════════════════════════════════════════
CREATE POLICY "clan_invitations_select" ON public.clan_invitations FOR SELECT USING (
  invited_by = auth.uid() OR invited_user_id = auth.uid()
  OR clan_id IN (SELECT clan_id FROM public.clan_members WHERE user_id = auth.uid())
);
CREATE POLICY "clan_invitations_insert" ON public.clan_invitations FOR INSERT WITH CHECK (
  invited_by = auth.uid() AND clan_id IN (SELECT clan_id FROM public.clan_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
);
CREATE POLICY "clan_invitations_update" ON public.clan_invitations FOR UPDATE USING (true);

-- ═══════════════════════════════════════════════════════════════════════════
-- PARTE 27: POLITICAS RLS - ACCOUNTABILITY_PAIRS
-- ═══════════════════════════════════════════════════════════════════════════
CREATE POLICY "acc_pairs_select_own" ON public.accountability_pairs FOR SELECT USING (
  user_a_id = auth.uid() OR user_b_id = auth.uid()
);
CREATE POLICY "acc_pairs_insert" ON public.accountability_pairs FOR INSERT WITH CHECK (
  user_a_id = auth.uid() OR user_b_id = auth.uid()
);
CREATE POLICY "acc_pairs_update" ON public.accountability_pairs FOR UPDATE USING (
  user_a_id = auth.uid() OR user_b_id = auth.uid()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- PARTE 28: POLITICAS RLS - ACCOUNTABILITY_CHECKINS
-- ═══════════════════════════════════════════════════════════════════════════
CREATE POLICY "acc_checkins_select" ON public.accountability_checkins FOR SELECT USING (
  pair_id IN (
    SELECT id FROM public.accountability_pairs WHERE user_a_id = auth.uid() OR user_b_id = auth.uid()
  )
);
CREATE POLICY "acc_checkins_insert" ON public.accountability_checkins FOR INSERT WITH CHECK (
  user_id = auth.uid()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- PARTE 29: POLITICAS RLS - CHALLENGES
-- ═══════════════════════════════════════════════════════════════════════════
CREATE POLICY "challenges_select" ON public.challenges FOR SELECT USING (
  clan_id IS NULL
  OR clan_id IN (SELECT clan_id FROM public.clan_members WHERE user_id = auth.uid())
  OR created_by = auth.uid()
);
CREATE POLICY "challenges_insert" ON public.challenges FOR INSERT WITH CHECK (
  created_by = auth.uid()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- PARTE 30: POLITICAS RLS - CHALLENGE_PARTICIPANTS
-- ═══════════════════════════════════════════════════════════════════════════
CREATE POLICY "challenge_participants_select" ON public.challenge_participants FOR SELECT USING (
  user_id = auth.uid()
  OR challenge_id IN (
    SELECT id FROM public.challenges WHERE
      clan_id IS NULL
      OR clan_id IN (SELECT clan_id FROM public.clan_members WHERE user_id = auth.uid())
  )
);
CREATE POLICY "challenge_participants_insert" ON public.challenge_participants FOR INSERT WITH CHECK (
  user_id = auth.uid()
);
CREATE POLICY "challenge_participants_update" ON public.challenge_participants FOR UPDATE USING (
  user_id = auth.uid()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- PARTE 31: INDICES PARA PERFORMANCE
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
CREATE INDEX IF NOT EXISTS idx_clan_members_clan ON public.clan_members(clan_id);
CREATE INDEX IF NOT EXISTS idx_clan_members_user ON public.clan_members(user_id);
CREATE INDEX IF NOT EXISTS idx_clan_messages_clan ON public.clan_messages(clan_id);
CREATE INDEX IF NOT EXISTS idx_clan_messages_created ON public.clan_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clan_activities_clan ON public.clan_activities(clan_id);
CREATE INDEX IF NOT EXISTS idx_clan_activities_created ON public.clan_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clan_invitations_code ON public.clan_invitations(invite_code);
CREATE INDEX IF NOT EXISTS idx_clan_invitations_clan ON public.clan_invitations(clan_id);
CREATE INDEX IF NOT EXISTS idx_acc_pairs_user_a ON public.accountability_pairs(user_a_id);
CREATE INDEX IF NOT EXISTS idx_acc_pairs_user_b ON public.accountability_pairs(user_b_id);
CREATE INDEX IF NOT EXISTS idx_acc_pairs_clan ON public.accountability_pairs(clan_id);
CREATE INDEX IF NOT EXISTS idx_acc_checkins_pair ON public.accountability_checkins(pair_id);
CREATE INDEX IF NOT EXISTS idx_acc_checkins_date ON public.accountability_checkins(checkin_date);
CREATE INDEX IF NOT EXISTS idx_challenges_clan ON public.challenges(clan_id);
CREATE INDEX IF NOT EXISTS idx_challenges_active ON public.challenges(is_active, end_date);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_challenge ON public.challenge_participants(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_user ON public.challenge_participants(user_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- PARTE 32: FUNCOES - CRIACAO AUTOMATICA DE PERFIL
-- ═══════════════════════════════════════════════════════════════════════════
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

  INSERT INTO public.events (user_id, user_email, type, metadata)
  VALUES (NEW.id, NEW.email, 'signup', '{}');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ═══════════════════════════════════════════════════════════════════════════
-- PARTE 33: FUNCOES - LOG DE EVENTOS
-- ═══════════════════════════════════════════════════════════════════════════
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

-- ═══════════════════════════════════════════════════════════════════════════
-- PARTE 34: FUNCOES - ATUALIZAR ULTIMO ACESSO
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.update_last_seen(p_user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.profiles
  SET last_seen = NOW()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════════════════
-- PARTE 35: FUNCOES - CLANS
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.get_user_clan(p_user_id UUID)
RETURNS TABLE (
  clan_id UUID,
  clan_name TEXT,
  clan_description TEXT,
  clan_avatar_url TEXT,
  member_role TEXT,
  member_count BIGINT,
  owner_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.name,
    c.description,
    c.avatar_url,
    cm.role,
    (SELECT COUNT(*) FROM public.clan_members WHERE clan_id = c.id),
    p.name
  FROM public.clan_members cm
  JOIN public.clans c ON c.id = cm.clan_id
  JOIN public.profiles p ON p.id = c.owner_id
  WHERE cm.user_id = p_user_id
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_clan_ranking(p_clan_id UUID, p_days INT DEFAULT 7)
RETURNS TABLE (
  user_id UUID,
  user_name TEXT,
  user_avatar TEXT,
  scan_count BIGINT,
  workout_count BIGINT,
  activity_count BIGINT,
  total_points BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ca.user_id,
    p.name,
    p.avatar_url,
    COUNT(*) FILTER (WHERE ca.activity_type = 'scan'),
    COUNT(*) FILTER (WHERE ca.activity_type = 'workout'),
    COUNT(*)::BIGINT,
    (
      COUNT(*) FILTER (WHERE ca.activity_type = 'scan') * 10
      + COUNT(*) FILTER (WHERE ca.activity_type = 'workout') * 20
      + COUNT(*) FILTER (WHERE ca.activity_type = 'diet') * 15
      + COUNT(*) FILTER (WHERE ca.activity_type = 'streak') * 5
    )::BIGINT
  FROM public.clan_activities ca
  JOIN public.profiles p ON p.id = ca.user_id
  WHERE ca.clan_id = p_clan_id
    AND ca.created_at >= now() - (p_days || ' days')::INTERVAL
  GROUP BY ca.user_id, p.name, p.avatar_url
  ORDER BY total_points DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════════════════
-- PARTE 36: FUNCOES - SEGURANCA (bloquear alteracoes privilegiadas)
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.prevent_client_privileged_profile_updates()
RETURNS TRIGGER AS $$
BEGIN
  IF auth.role() <> 'service_role' THEN
    IF NEW.plan IS DISTINCT FROM OLD.plan THEN
      RAISE EXCEPTION 'plan can only be changed by trusted server code';
    END IF;
    IF NEW.is_admin IS DISTINCT FROM OLD.is_admin THEN
      RAISE EXCEPTION 'is_admin can only be changed by trusted server code';
    END IF;
    IF NEW.stripe_customer_id IS DISTINCT FROM OLD.stripe_customer_id THEN
      RAISE EXCEPTION 'stripe_customer_id can only be changed by trusted server code';
    END IF;
    IF NEW.email IS DISTINCT FROM OLD.email THEN
      RAISE EXCEPTION 'email can only be changed by trusted server code';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS prevent_client_privileged_profile_updates ON public.profiles;
CREATE TRIGGER prevent_client_privileged_profile_updates
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_client_privileged_profile_updates();

-- ═══════════════════════════════════════════════════════════════════════════
-- PARTE 37: VIEWS ADMINISTRATIVAS
-- ═══════════════════════════════════════════════════════════════════════════
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
-- PARTE 38: HABILITAR REALTIME
-- ═══════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  tbl TEXT;
  tables_to_add TEXT[] := ARRAY['events', 'profiles', 'clan_messages', 'clan_activities', 'challenges', 'challenge_participants'];
BEGIN
  FOREACH tbl IN ARRAY tables_to_add LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND tablename = tbl
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', tbl);
    END IF;
  END LOOP;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- PRONTO! O banco de dados esta configurado.
-- ═══════════════════════════════════════════════════════════════════════════
