-- ============================================================================
-- FIX PROFILE CREATION ISSUE
-- ============================================================================
-- This script will:
-- 1. Create the handle_new_user function
-- 2. Create the trigger on auth.users
-- 3. Create profiles for existing auth users that don't have profiles
-- ============================================================================

-- ============================================================================
-- STEP 1: CREATE PROFILE CREATION FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'player')::user_role
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 2: CREATE TRIGGER ON AUTH.USERS
-- ============================================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- STEP 3: CREATE PROFILES FOR EXISTING AUTH USERS
-- ============================================================================

-- Create profile for samorthtech+test@gmail.com (coach)
INSERT INTO public.profiles (id, email, display_name, role)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'display_name', email),
  'coach'::user_role
FROM auth.users
WHERE email = 'samorthtech+test@gmail.com'
AND id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- Create profile for orth.lightninghockeycolombia+test@gmail.com (coach)
INSERT INTO public.profiles (id, email, display_name, role)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'display_name', email),
  'coach'::user_role
FROM auth.users
WHERE email = 'orth.lightninghockeycolombia+test@gmail.com'
AND id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STEP 4: VERIFY PROFILES CREATED
-- ============================================================================

SELECT 
  'Profile Creation Fixed!' as status,
  (SELECT COUNT(*) FROM auth.users) as total_auth_users,
  (SELECT COUNT(*) FROM public.profiles) as total_profiles,
  (SELECT COUNT(*) FROM public.profiles WHERE role = 'coach') as coach_count,
  (SELECT COUNT(*) FROM public.profiles WHERE role = 'player') as player_count;
