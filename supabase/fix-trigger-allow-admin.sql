-- Fix: allow postgres (SQL Editor) and service_role to update privileged fields
-- Run this in Supabase SQL Editor

DROP TRIGGER IF EXISTS prevent_client_privileged_profile_updates ON public.profiles;

CREATE OR REPLACE FUNCTION public.prevent_client_privileged_profile_updates()
RETURNS TRIGGER AS $$
BEGIN
  IF auth.role() NOT IN ('service_role', 'postgres') THEN
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

CREATE TRIGGER prevent_client_privileged_profile_updates
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_client_privileged_profile_updates();

-- Set your user as admin (replace email)
UPDATE profiles SET is_admin = true WHERE email = 'ferreiravictor280@gmail.com';

-- Now you can also change plans directly from SQL Editor:
-- UPDATE profiles SET plan = 'pro', ads_enabled = false WHERE email = 'ferreiravictor280@gmail.com';
