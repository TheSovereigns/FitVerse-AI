-- Fix events RLS
DROP POLICY IF EXISTS "Anyone can view events" ON events;
CREATE POLICY "Users view own events" ON events FOR SELECT USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- Fix clan_invitations
DROP POLICY IF EXISTS "clan_invitations_update" ON clan_invitations;
CREATE POLICY "clan_invitations_update" ON clan_invitations FOR UPDATE USING (invited_user_id = auth.uid() OR EXISTS (SELECT 1 FROM clans WHERE id = clan_id AND owner_id = auth.uid()));

-- Also ensure enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE clan_invitations ENABLE ROW LEVEL SECURITY;
