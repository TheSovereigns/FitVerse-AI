-- =============================================
-- FitVerse AI - Clan System Tables
-- =============================================

-- Clans table
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

-- Clan members
CREATE TABLE IF NOT EXISTS public.clan_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clan_id UUID NOT NULL REFERENCES public.clans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(clan_id, user_id)
);

-- Clan messages (chat)
CREATE TABLE IF NOT EXISTS public.clan_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clan_id UUID NOT NULL REFERENCES public.clans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'activity', 'system')),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Clan activities (shared scans, workouts, diets)
CREATE TABLE IF NOT EXISTS public.clan_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clan_id UUID NOT NULL REFERENCES public.clans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('scan', 'workout', 'diet', 'streak', 'badge')),
  activity_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Clan invitations
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_clan_members_clan ON public.clan_members(clan_id);
CREATE INDEX IF NOT EXISTS idx_clan_members_user ON public.clan_members(user_id);
CREATE INDEX IF NOT EXISTS idx_clan_messages_clan ON public.clan_messages(clan_id);
CREATE INDEX IF NOT EXISTS idx_clan_messages_created ON public.clan_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clan_activities_clan ON public.clan_activities(clan_id);
CREATE INDEX IF NOT EXISTS idx_clan_activities_created ON public.clan_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clan_invitations_code ON public.clan_invitations(invite_code);
CREATE INDEX IF NOT EXISTS idx_clan_invitations_clan ON public.clan_invitations(clan_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.clan_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.clan_activities;

-- RLS Policies
ALTER TABLE public.clans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clan_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clan_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clan_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clan_invitations ENABLE ROW LEVEL SECURITY;

-- Clans: anyone can view public clans, members can view their clans
CREATE POLICY "clans_select_public" ON public.clans FOR SELECT USING (is_public = true);
CREATE POLICY "clans_select_member" ON public.clans FOR SELECT USING (
  id IN (SELECT clan_id FROM public.clan_members WHERE user_id = auth.uid())
);
CREATE POLICY "clans_insert_auth" ON public.clans FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "clans_update_owner" ON public.clans FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY "clans_delete_owner" ON public.clans FOR DELETE USING (owner_id = auth.uid());

-- Clan members: members can view, owners/admins can manage
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

-- Clan messages: members can read/write
CREATE POLICY "clan_messages_select" ON public.clan_messages FOR SELECT USING (
  clan_id IN (SELECT clan_id FROM public.clan_members WHERE user_id = auth.uid())
);
CREATE POLICY "clan_messages_insert" ON public.clan_messages FOR INSERT WITH CHECK (
  user_id = auth.uid() AND clan_id IN (SELECT clan_id FROM public.clan_members WHERE user_id = auth.uid())
);

-- Clan activities: members can view, users can insert their own
CREATE POLICY "clan_activities_select" ON public.clan_activities FOR SELECT USING (
  clan_id IN (SELECT clan_id FROM public.clan_members WHERE user_id = auth.uid())
);
CREATE POLICY "clan_activities_insert" ON public.clan_activities FOR INSERT WITH CHECK (
  user_id = auth.uid() AND clan_id IN (SELECT clan_id FROM public.clan_members WHERE user_id = auth.uid())
);

-- Clan invitations: members can view, anyone authed can use invite codes
CREATE POLICY "clan_invitations_select" ON public.clan_invitations FOR SELECT USING (
  invited_by = auth.uid() OR invited_user_id = auth.uid()
  OR clan_id IN (SELECT clan_id FROM public.clan_members WHERE user_id = auth.uid())
);
CREATE POLICY "clan_invitations_insert" ON public.clan_invitations FOR INSERT WITH CHECK (
  invited_by = auth.uid() AND clan_id IN (SELECT clan_id FROM public.clan_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
);
CREATE POLICY "clan_invitations_update" ON public.clan_invitations FOR UPDATE USING (true);

-- Function to get user's clan
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

-- Function to get clan ranking (weekly points)
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
