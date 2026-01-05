-- Fix Script: Remove Problematic Auto-Profile Creation Trigger
-- 
-- This script removes the trigger that was causing 500 errors during user registration.
-- The trigger attempted to create profiles without the required 'role' field.
-- 
-- Run this script in your Supabase SQL Editor to fix the registration error.

-- Drop the trigger first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop the function
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Verification: Check that the trigger is removed
-- You can run this to verify (optional):
-- SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
-- Should return 0 rows

-- Note: All RLS policies remain intact. Profile creation will be handled by the application.

