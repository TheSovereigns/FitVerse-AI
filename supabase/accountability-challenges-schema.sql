-- =============================================
-- FitVerse AI - Accountability Partner & Challenges
-- =============================================

-- Accountability Partners (pair of users who keep each other accountable)
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

-- Accountability partner daily check-ins
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

-- Challenges
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

-- Challenge participants and progress
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_acc_pairs_user_a ON public.accountability_pairs(user_a_id);
CREATE INDEX IF NOT EXISTS idx_acc_pairs_user_b ON public.accountability_pairs(user_b_id);
CREATE INDEX IF NOT EXISTS idx_acc_pairs_clan ON public.accountability_pairs(clan_id);
CREATE INDEX IF NOT EXISTS idx_acc_checkins_pair ON public.accountability_checkins(pair_id);
CREATE INDEX IF NOT EXISTS idx_acc_checkins_date ON public.accountability_checkins(checkin_date);
CREATE INDEX IF NOT EXISTS idx_challenges_clan ON public.challenges(clan_id);
CREATE INDEX IF NOT EXISTS idx_challenges_active ON public.challenges(is_active, end_date);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_challenge ON public.challenge_participants(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_user ON public.challenge_participants(user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.challenges;
ALTER PUBLICATION supabase_realtime ADD TABLE public.challenge_participants;

-- RLS
ALTER TABLE public.accountability_pairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accountability_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_participants ENABLE ROW LEVEL SECURITY;

-- Accountability pairs: users can see their own pairs
CREATE POLICY "acc_pairs_select_own" ON public.accountability_pairs FOR SELECT USING (
  user_a_id = auth.uid() OR user_b_id = auth.uid()
);
CREATE POLICY "acc_pairs_insert" ON public.accountability_pairs FOR INSERT WITH CHECK (
  user_a_id = auth.uid() OR user_b_id = auth.uid()
);
CREATE POLICY "acc_pairs_update" ON public.accountability_pairs FOR UPDATE USING (
  user_a_id = auth.uid() OR user_b_id = auth.uid()
);

-- Check-ins: users in the pair can see, user can insert own
CREATE POLICY "acc_checkins_select" ON public.accountability_checkins FOR SELECT USING (
  pair_id IN (
    SELECT id FROM public.accountability_pairs WHERE user_a_id = auth.uid() OR user_b_id = auth.uid()
  )
);
CREATE POLICY "acc_checkins_insert" ON public.accountability_checkins FOR INSERT WITH CHECK (
  user_id = auth.uid()
);

-- Challenges: clan members can see clan challenges, anyone can see global
CREATE POLICY "challenges_select" ON public.challenges FOR SELECT USING (
  clan_id IS NULL
  OR clan_id IN (SELECT clan_id FROM public.clan_members WHERE user_id = auth.uid())
  OR created_by = auth.uid()
);
CREATE POLICY "challenges_insert" ON public.challenges FOR INSERT WITH CHECK (
  created_by = auth.uid()
);

-- Challenge participants: users can see if they're in the challenge or same clan
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
