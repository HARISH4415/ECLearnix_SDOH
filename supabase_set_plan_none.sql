-- =========================================================================
-- CareEquity SDOH: Set Default User Plan to 'none' in Supabase
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/nagoqcyeezpayhfpvrbk/sql/new
-- =========================================================================

-- 1. Set the default plan to 'none' in the users table
ALTER TABLE public.users ALTER COLUMN plan SET DEFAULT 'none';

-- 2. Reset existing users to 'none' so they must choose a plan on their own
UPDATE public.users SET plan = 'none';

-- 3. Ensure the app is allowed to update the plan when the user picks one
DROP POLICY IF EXISTS "Allow public update users" ON public.users;
CREATE POLICY "Allow public update users" 
ON public.users 
FOR UPDATE 
USING (true) 
WITH CHECK (true);
