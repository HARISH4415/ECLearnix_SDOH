-- =========================================================================
-- CareEquity SDOH: Auto-Confirm Users in Supabase Auth (Fixed)
-- Note: "confirmed_at" is a generated column in Supabase, so we only update
-- "email_confirmed_at". Supabase automatically calculates "confirmed_at".
-- =========================================================================

-- 1. Immediately confirm all existing users who are "Waiting for verification"
UPDATE auth.users 
SET email_confirmed_at = now(), 
    last_sign_in_at = now()
WHERE email_confirmed_at IS NULL;

-- 2. Automatically confirm and authenticate every new user upon registration
CREATE OR REPLACE FUNCTION public.auto_confirm_user()
RETURNS trigger AS $$
BEGIN
  NEW.email_confirmed_at := now();
  NEW.last_sign_in_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_auto_confirm_user ON auth.users;
CREATE TRIGGER tr_auto_confirm_user
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_confirm_user();
