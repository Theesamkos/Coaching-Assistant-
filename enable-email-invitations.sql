-- Migration: Enable Email Invitations for Non-Registered Users
-- This allows coaches to invite players who haven't signed up yet

-- ============================================================================
-- 1. ALTER coach_players TABLE
-- Make player_id nullable and add player_email column
-- ============================================================================

-- Drop the existing unique constraint
ALTER TABLE public.coach_players DROP CONSTRAINT IF EXISTS coach_players_coach_id_player_id_key;

-- Make player_id nullable (allow invitations to non-registered users)
ALTER TABLE public.coach_players ALTER COLUMN player_id DROP NOT NULL;

-- Add player_email column to store the invited email
ALTER TABLE public.coach_players ADD COLUMN IF NOT EXISTS player_email TEXT;

-- Add expires_at column for invitation expiration
ALTER TABLE public.coach_players ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- Update existing records to have player_email from profiles
UPDATE public.coach_players cp
SET player_email = p.email
FROM public.profiles p
WHERE cp.player_id = p.id AND cp.player_email IS NULL;

-- Make player_email NOT NULL (we always need to know who we're inviting)
ALTER TABLE public.coach_players ALTER COLUMN player_email SET NOT NULL;

-- Add new unique constraint: a coach can only have one relationship with a specific email
ALTER TABLE public.coach_players 
ADD CONSTRAINT coach_players_coach_email_unique 
UNIQUE (coach_id, player_email);

-- Create an index on player_email for faster lookups
CREATE INDEX IF NOT EXISTS coach_players_player_email_idx ON public.coach_players(player_email);

-- ============================================================================
-- 2. UPDATE RLS POLICIES
-- Allow players to view invitations sent to their email
-- ============================================================================

-- Drop old policies that depend on player_id
DROP POLICY IF EXISTS "Players can view their own coach relationships" ON public.coach_players;
DROP POLICY IF EXISTS "Players can accept/decline invitations" ON public.coach_players;

-- Create new policies that work with both player_id and player_email
CREATE POLICY "Players can view invitations by player_id or email"
ON public.coach_players FOR SELECT
USING (
  auth.uid() = player_id 
  OR auth.email() = player_email
);

CREATE POLICY "Players can update invitations by player_id or email"
ON public.coach_players FOR UPDATE
USING (
  auth.uid() = player_id 
  OR auth.email() = player_email
);

-- ============================================================================
-- 3. CREATE HELPER FUNCTION
-- Automatically link invitation when user signs up
-- ============================================================================

CREATE OR REPLACE FUNCTION public.link_pending_invitations()
RETURNS TRIGGER AS $$
BEGIN
  -- When a new profile is created, link any pending invitations with matching email
  UPDATE public.coach_players
  SET 
    player_id = NEW.id,
    updated_at = NOW()
  WHERE 
    player_email = NEW.email 
    AND player_id IS NULL 
    AND status = 'pending';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically link invitations on user signup
DROP TRIGGER IF EXISTS link_invitations_on_signup ON public.profiles;
CREATE TRIGGER link_invitations_on_signup
AFTER INSERT ON public.profiles
FOR EACH ROW
WHEN (NEW.role = 'player')
EXECUTE FUNCTION public.link_pending_invitations();

-- ============================================================================
-- 4. UPDATE EXISTING DATA
-- Set expires_at for pending invitations (30 days from invited_at)
-- ============================================================================

UPDATE public.coach_players
SET expires_at = invited_at + INTERVAL '30 days'
WHERE expires_at IS NULL AND status = 'pending';

-- ============================================================================
-- VERIFICATION QUERIES
-- Run these to verify the migration
-- ============================================================================

-- Check the updated schema
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'coach_players' 
-- ORDER BY ordinal_position;

-- Check existing invitations
-- SELECT id, coach_id, player_id, player_email, status, invited_at, expires_at
-- FROM public.coach_players
-- LIMIT 10;

