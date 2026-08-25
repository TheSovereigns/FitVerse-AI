-- =============================================
-- FitVerse AI - Guild System Evolution Migration
-- =============================================

-- 1. Add XP and achievement columns to clans table
ALTER TABLE public.clans ADD COLUMN IF NOT EXISTS total_xp INT DEFAULT 0;
ALTER TABLE public.clans ADD COLUMN IF NOT EXISTS achievements TEXT[] DEFAULT '{}';
ALTER TABLE public.clans ADD COLUMN IF NOT EXISTS streak_days INT DEFAULT 0;

-- 2. XP audit log table
CREATE TABLE IF NOT EXISTS public.clan_xp_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clan_id UUID NOT NULL REFERENCES public.clans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  xp_amount INT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('workout', 'scan', 'diet', 'streak', 'badge', 'challenge')),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Indexes for XP log
CREATE INDEX IF NOT EXISTS idx_clan_xp_log_clan ON public.clan_xp_log(clan_id);
CREATE INDEX IF NOT EXISTS idx_clan_xp_log_user ON public.clan_xp_log(user_id);
CREATE INDEX IF NOT EXISTS idx_clan_xp_log_created ON public.clan_xp_log(created_at DESC);

-- 4. Enable RLS on XP log
ALTER TABLE public.clan_xp_log ENABLE ROW LEVEL SECURITY;

-- Members can view XP log for their clan
CREATE POLICY "clan_xp_log_select" ON public.clan_xp_log FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.clan_members WHERE clan_id = clan_xp_log.clan_id AND user_id = auth.uid())
);

-- System can insert XP log
CREATE POLICY "clan_xp_log_insert" ON public.clan_xp_log FOR INSERT WITH CHECK (true);

-- 5. Function to add XP to a clan atomically
CREATE OR REPLACE FUNCTION public.add_clan_xp(
  p_clan_id UUID,
  p_user_id UUID,
  p_xp_amount INT,
  p_source TEXT,
  p_metadata JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  -- Insert XP log
  INSERT INTO public.clan_xp_log (clan_id, user_id, xp_amount, source, metadata)
  VALUES (p_clan_id, p_user_id, p_xp_amount, p_source, p_metadata);

  -- Update clan total XP
  UPDATE public.clans
  SET total_xp = total_xp + p_xp_amount,
      updated_at = now()
  WHERE id = p_clan_id;

  -- Auto-assign achievements based on XP milestones
  UPDATE public.clans
  SET achievements = CASE
    WHEN total_xp >= 50 AND NOT ('first_workout' = ANY(achievements))
      THEN array_append(achievements, 'first_workout')
    ELSE achievements
  END
  WHERE id = p_clan_id AND total_xp >= 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Function to get clan stats with XP and achievements
CREATE OR REPLACE FUNCTION public.get_clan_stats(p_clan_id UUID)
RETURNS TABLE (
  total_xp INT,
  achievements TEXT[],
  streak_days INT,
  member_count BIGINT,
  activity_count BIGINT,
  workouts_this_week BIGINT,
  scans_this_week BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.total_xp,
    c.achievements,
    c.streak_days,
    (SELECT COUNT(*)::BIGINT FROM public.clan_members WHERE clan_id = p_clan_id),
    (SELECT COUNT(*)::BIGINT FROM public.clan_activities WHERE clan_id = p_clan_id),
    (SELECT COUNT(*)::BIGINT FROM public.clan_activities
     WHERE clan_id = p_clan_id AND activity_type = 'workout'
     AND created_at >= date_trunc('week', now())),
    (SELECT COUNT(*)::BIGINT FROM public.clan_activities
     WHERE clan_id = p_clan_id AND activity_type = 'scan'
     AND created_at >= date_trunc('week', now()))
  FROM public.clans c
  WHERE c.id = p_clan_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
