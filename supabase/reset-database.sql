-- ═══════════════════════════════════════════════════════════════════════
-- FITVERSE AI — RESET COMPLETO DO BANCO DE DADOS
-- Rodar no Supabase SQL Editor
-- Isso DELETA todas as tabelas, views, funções, triggers e policies
-- ═══════════════════════════════════════════════════════════════════════

-- 1. Dropar todas as policies RLS
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- 2. Dropar triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 3. Dropar funções
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.log_event(TEXT, UUID, JSONB) CASCADE;
DROP FUNCTION IF EXISTS public.update_last_seen(UUID) CASCADE;

-- 4. Dropar views
DROP VIEW IF EXISTS public.admin_overview CASCADE;
DROP VIEW IF EXISTS public.active_users CASCADE;
DROP VIEW IF EXISTS public.recent_events CASCADE;
DROP VIEW IF EXISTS public.dataset_stats CASCADE;

-- 5. Dropar tabelas (ordem importa por causa de foreign keys)
DROP TABLE IF EXISTS public.dataset_exports CASCADE;
DROP TABLE IF EXISTS public.ai_messages CASCADE;
DROP TABLE IF EXISTS public.ai_conversations CASCADE;
DROP TABLE IF EXISTS public.recipes CASCADE;
DROP TABLE IF EXISTS public.workouts CASCADE;
DROP TABLE IF EXISTS public.ai_usage CASCADE;
DROP TABLE IF EXISTS public.events CASCADE;
DROP TABLE IF EXISTS public.subscriptions CASCADE;
DROP TABLE IF EXISTS public.metabolic_plans CASCADE;
DROP TABLE IF EXISTS public.scans CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 6. Dropar índices (já foram com CASCADE, mas por segurança)
-- Não necessário pois CASCADE já remove

-- ═══════════════════════════════════════════════════════════════════════
-- FIM DO RESET — Agora rode o complete-database.sql + ai-dataset.sql
-- ═══════════════════════════════════════════════════════════════════════
