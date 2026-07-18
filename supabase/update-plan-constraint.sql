-- ═══════════════════════════════════════════════════════════════════════════
-- FITVERSE AI - ATUALIZAÇÃO DE PLANOS
-- Adiciona plano 'pro' e coluna subscription_ends_at
-- ═══════════════════════════════════════════════════════════════════════════

-- Atualizar constraint do plan para incluir 'pro'
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_plan_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_plan_check CHECK (plan IN ('free', 'pro', 'premium'));

-- Adicionar coluna de fim de assinatura
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMPTZ;

-- Atualizar usuários existentes que tinham 'premium' para manter
-- (isso é seguro porque o CHECK constraint já permite 'premium')

-- Criar função para verificar se assinatura está ativa
CREATE OR REPLACE FUNCTION public.is_subscription_active(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_plan TEXT;
  sub_ends TIMESTAMPTZ;
BEGIN
  SELECT plan, subscription_ends_at INTO user_plan, sub_ends
  FROM public.profiles
  WHERE id = user_id;
  
  IF user_plan = 'free' THEN
    RETURN false;
  END IF;
  
  IF sub_ends IS NULL THEN
    RETURN true; -- Sem data de fim = assinatura ativa
  END IF;
  
  RETURN sub_ends > NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar função para obter plano ativo do usuário
CREATE OR REPLACE FUNCTION public.get_user_plan(user_id UUID)
RETURNS TEXT AS $$
DECLARE
  user_plan TEXT;
  sub_ends TIMESTAMPTZ;
BEGIN
  SELECT plan, subscription_ends_at INTO user_plan, sub_ends
  FROM public.profiles
  WHERE id = user_id;
  
  IF user_plan = 'free' THEN
    RETURN 'free';
  END IF;
  
  IF sub_ends IS NOT NULL AND sub_ends <= NOW() THEN
    RETURN 'free'; -- Assinatura expirada
  END IF;
  
  RETURN user_plan;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
