-- ═══════════════════════════════════════════════════════════════════════════
-- FitVerse AI - Enable Supabase Realtime for Clans (with polling fallback)
-- Run this in Supabase SQL Editor to enable realtime (free tier: 200 connections)
-- Realtime is enhancement; polling fallback (5s) in hooks/useClanChat & hooks/useClanFeed keeps data flowing if disabled/limited.
-- ═══════════════════════════════════════════════════════════════════════════

-- Simple idempotent enable (safe to re-run):
DO $$
DECLARE
  tbl TEXT;
  tables_to_add TEXT[] := ARRAY['clan_messages', 'clan_activities', 'clans'];
BEGIN
  FOREACH tbl IN ARRAY tables_to_add LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = tbl
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', tbl);
      RAISE NOTICE 'Added % to supabase_realtime', tbl;
    ELSE
      RAISE NOTICE '% already in supabase_realtime, skipping', tbl;
    END IF;
  END LOOP;
END $$;

-- ── Alternative explicit SQL (uncomment if you prefer manual, non-idempotent) ──
-- ALTER PUBLICATION supabase_realtime ADD TABLE clan_messages;
-- ALTER PUBLICATION supabase_realtime ADD TABLE clan_activities;
-- ALTER PUBLICATION supabase_realtime ADD TABLE clans;

-- Verify:
-- SELECT tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime' ORDER BY tablename;
