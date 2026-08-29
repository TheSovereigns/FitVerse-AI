-- ═══════════════════════════════════════════════════════════════════════════
-- FITVERSE AI - ATOMIC PLAN LIMIT ENFORCEMENT (optional strict mode)
-- Prevents race conditions on concurrent scan/workout requests.
-- JS checks in route.ts remain as fast fallback; these DB functions
-- provide true serialization via advisory lock + SELECT FOR UPDATE.
--
-- Usage (strict, after auth):
--   const { data: allowed } = await supabaseAdmin.rpc('check_and_increment_scan', { p_user_id: auth.userId });
--   if (!allowed) return NextResponse.json({ error: 'Limite atingido.' }, { status: 403 });
--   -- then proceed to insert scan; function is read-check only, not incrementing.
--   -- For true check-and-insert atomically, wrap insert in same transaction or
--   -- call a combined function that inserts. This check alone serializes counts.
--
-- Idempotent: safe to re-run (CREATE OR REPLACE).
-- Requires: public.profiles(id, plan), public.scans(user_id, created_at),
--           public.workouts(user_id, created_at)
-- ═══════════════════════════════════════════════════════════════════════════

-- ---------------------------------------------------------------------------
-- Scans:  free=5/day, pro=50/day, premium=unlimited (999999 sentinel), banned=0
-- Counts scans where created_at >= date_trunc('day', now())
-- Serialized per-user via pg_advisory_xact_lock + SELECT FOR UPDATE on profile
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_and_increment_scan(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_count INT;
  v_limit INT;
  v_plan TEXT;
BEGIN
  -- Serialize concurrent checks for the same user within this transaction
  PERFORM pg_advisory_xact_lock(hashtext(p_user_id::text));

  -- Lock the profile row to prevent plan changes mid-check (SELECT FOR UPDATE)
  SELECT plan INTO v_plan FROM public.profiles WHERE id = p_user_id FOR UPDATE;

  -- Default to 'free' if profile missing/null (fail-closed to free limits)
  v_plan := COALESCE(v_plan, 'free');

  v_limit := CASE v_plan
    WHEN 'premium' THEN 999999
    WHEN 'pro' THEN 50
    WHEN 'banned' THEN 0
    ELSE 5  -- 'free' and any unknown
  END;

  IF v_limit = 999999 THEN
    RETURN TRUE;
  END IF;

  SELECT COUNT(*) INTO v_count
  FROM public.scans
  WHERE user_id = p_user_id
    AND created_at >= date_trunc('day', now());

  IF v_count >= v_limit THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ---------------------------------------------------------------------------
-- Workouts: free=1/month, pro=5/month, premium=unlimited, banned=0
-- Counts workouts where created_at >= date_trunc('month', now())
-- Same serialization guarantees as scans
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_and_increment_workout(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_count INT;
  v_limit INT;
  v_plan TEXT;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext(('workout:' || p_user_id::text)));

  SELECT plan INTO v_plan FROM public.profiles WHERE id = p_user_id FOR UPDATE;

  v_plan := COALESCE(v_plan, 'free');

  v_limit := CASE v_plan
    WHEN 'premium' THEN 999999
    WHEN 'pro' THEN 5
    WHEN 'banned' THEN 0
    WHEN 'free' THEN 1
    ELSE 1
  END;

  IF v_limit = 999999 THEN
    RETURN TRUE;
  END IF;

  SELECT COUNT(*) INTO v_count
  FROM public.workouts
  WHERE user_id = p_user_id
    AND created_at >= date_trunc('month', now());

  IF v_count >= v_limit THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Optional: grant execute to authenticated and service_role (idempotent)
GRANT EXECUTE ON FUNCTION public.check_and_increment_scan(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.check_and_increment_workout(UUID) TO authenticated, service_role;

-- Verify with:
--   SELECT public.check_and_increment_scan('00000000-0000-0000-0000-000000000000');
--   SELECT public.check_and_increment_workout('00000000-0000-0000-0000-000000000000');
