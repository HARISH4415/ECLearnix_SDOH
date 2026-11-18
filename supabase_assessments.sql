-- =========================================================================
-- CareEquity SDOH: Patient Assessment History & Favorites Table
-- Run this in your Supabase SQL Editor
-- =========================================================================

-- 1. Create the assessments table to store history and favorites
CREATE TABLE IF NOT EXISTS public.assessments (
  id TEXT PRIMARY KEY,
  user_email TEXT NOT NULL,
  name TEXT NOT NULL,
  age INTEGER DEFAULT 45,
  gender TEXT DEFAULT 'Female',
  diabetes TEXT DEFAULT 'No',
  hypertension TEXT DEFAULT 'No',
  heart_disease TEXT DEFAULT 'No',
  asthma TEXT DEFAULT 'No',
  systolic_bp NUMERIC,
  diastolic_bp NUMERIC,
  hba1c NUMERIC,
  fasting_glucose NUMERIC,
  total_cholesterol NUMERIC,
  smoking_status TEXT DEFAULT 'Never',
  height_cm NUMERIC DEFAULT 170.0,
  weight_kg NUMERIC DEFAULT 70.0,
  county TEXT,
  state TEXT,
  country TEXT DEFAULT 'United States',
  notes TEXT,
  is_favorite BOOLEAN DEFAULT false,
  extra_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  timestamp TIMESTAMPTZ DEFAULT now()
);

-- 2. Indexes for fast retrieval of user history & favorites
CREATE INDEX IF NOT EXISTS idx_assessments_user_email ON public.assessments(user_email);
CREATE INDEX IF NOT EXISTS idx_assessments_favorite ON public.assessments(user_email, is_favorite);
CREATE INDEX IF NOT EXISTS idx_assessments_created_at ON public.assessments(created_at DESC);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;

-- 4. Policies for Select, Insert, Update (for starring/favorites), and Delete
DROP POLICY IF EXISTS "Allow public select assessments" ON public.assessments;
CREATE POLICY "Allow public select assessments" 
ON public.assessments 
FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Allow public insert assessments" ON public.assessments;
CREATE POLICY "Allow public insert assessments" 
ON public.assessments 
FOR INSERT 
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update assessments" ON public.assessments;
CREATE POLICY "Allow public update assessments" 
ON public.assessments 
FOR UPDATE 
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public delete assessments" ON public.assessments;
CREATE POLICY "Allow public delete assessments" 
ON public.assessments 
FOR DELETE 
USING (true);

-- 5. Grant access permissions to anon and authenticated clients
GRANT ALL ON TABLE public.assessments TO anon, authenticated, service_role;
