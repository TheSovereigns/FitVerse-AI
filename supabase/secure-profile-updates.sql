-- Run this in Supabase SQL Editor before going to production.
-- It prevents client-side profile updates from changing privileged fields.

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_plan_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_plan_check CHECK (plan IN ('free', 'pro', 'premium', 'banned'));

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
