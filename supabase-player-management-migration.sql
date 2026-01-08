-- Player Management System - Complete Database Schema
-- Includes: Enhanced profiles, photos, contact info, notes, teams, statistics
--
-- Run this AFTER supabase-phase1a-migration.sql

-- ============================================================================
-- 1. ENHANCED PROFILES TABLE
-- Add additional fields to existing profiles table
-- ============================================================================

-- Add new columns to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS position TEXT; -- Already exists, keeping it
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS jersey_number INTEGER;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS shoots TEXT CHECK (shoots IN ('left', 'right'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS height_inches INTEGER;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS weight_lbs INTEGER;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS years_experience INTEGER;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS skill_level TEXT CHECK (skill_level IN ('beginner', 'intermediate', 'advanced', 'elite'));

-- Emergency contact fields
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS emergency_contact_relationship TEXT;

-- Parent/Guardian (for minors)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS parent_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS parent_email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS parent_phone TEXT;

-- Address
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address_line1 TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address_line2 TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS zip_code TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country TEXT;

-- Social media
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS instagram_handle TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS twitter_handle TEXT;

-- Privacy settings (JSON object for flexible privacy controls)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS privacy_settings JSONB DEFAULT '{
  "hide_phone": false,
  "hide_email": false,
  "hide_address": false,
  "hide_social": false,
  "hide_age": false,
  "hide_stats": false
}'::jsonb;

-- Medical notes (only visible to coaches)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS medical_notes TEXT;

-- ============================================================================
-- 2. TEAMS TABLE
-- Coaches can organize players into teams/groups
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  season TEXT, -- e.g., "2025-2026", "Spring 2025"
  photo_url TEXT, -- Team logo/photo
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS teams_coach_id_idx ON public.teams(coach_id);

-- RLS
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Coaches can manage their own teams" ON public.teams;
CREATE POLICY "Coaches can manage their own teams"
ON public.teams FOR ALL
USING (auth.uid() = coach_id);

-- ============================================================================
-- 3. TEAM_PLAYERS TABLE (Junction)
-- Many-to-many relationship: Players can be in multiple teams
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.team_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(team_id, player_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS team_players_team_id_idx ON public.team_players(team_id);
CREATE INDEX IF NOT EXISTS team_players_player_id_idx ON public.team_players(player_id);

-- RLS
ALTER TABLE public.team_players ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Coaches can manage their team rosters" ON public.team_players;
CREATE POLICY "Coaches can manage their team rosters"
ON public.team_players FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.teams
    WHERE teams.id = team_players.team_id
    AND teams.coach_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Players can view their team memberships" ON public.team_players;
CREATE POLICY "Players can view their team memberships"
ON public.team_players FOR SELECT
USING (auth.uid() = player_id);

-- ============================================================================
-- 4. COACH_NOTES TABLE
-- Private notes that coaches make about players
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.coach_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  note_type TEXT CHECK (note_type IN ('general', 'performance', 'behavioral', 'improvement', 'goals', 'medical')),
  content TEXT NOT NULL,
  tags TEXT[], -- Array of tags for organization
  is_visible_to_player BOOLEAN DEFAULT false, -- Can player see this note?
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS coach_notes_coach_id_idx ON public.coach_notes(coach_id);
CREATE INDEX IF NOT EXISTS coach_notes_player_id_idx ON public.coach_notes(player_id);
CREATE INDEX IF NOT EXISTS coach_notes_note_type_idx ON public.coach_notes(note_type);
CREATE INDEX IF NOT EXISTS coach_notes_tags_idx ON public.coach_notes USING GIN(tags);

-- RLS
ALTER TABLE public.coach_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Coaches can manage their own notes" ON public.coach_notes;
CREATE POLICY "Coaches can manage their own notes"
ON public.coach_notes FOR ALL
USING (auth.uid() = coach_id);

DROP POLICY IF EXISTS "Coaches can view notes about their players" ON public.coach_notes;
CREATE POLICY "Coaches can view notes about their players"
ON public.coach_notes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.coach_players
    WHERE coach_players.player_id = coach_notes.player_id
    AND coach_players.coach_id = auth.uid()
    AND coach_players.status = 'accepted'
  )
);

DROP POLICY IF EXISTS "Players can view notes marked as visible to them" ON public.coach_notes;
CREATE POLICY "Players can view notes marked as visible to them"
ON public.coach_notes FOR SELECT
USING (
  auth.uid() = player_id
  AND is_visible_to_player = true
);

-- ============================================================================
-- 5. PLAYER_STATISTICS TABLE
-- Track various statistics for players
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.player_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  stat_date DATE NOT NULL,
  stat_type TEXT NOT NULL, -- 'practice', 'game', 'assessment', 'custom'
  
  -- Practice stats
  attendance_status TEXT CHECK (attendance_status IN ('present', 'absent', 'late', 'excused')),
  drills_completed INTEGER,
  practice_rating INTEGER CHECK (practice_rating >= 1 AND practice_rating <= 5),
  
  -- Performance metrics
  skill_ratings JSONB, -- Flexible JSON for various skills: {"skating": 4, "shooting": 3, etc}
  
  -- Game stats (if applicable)
  goals INTEGER DEFAULT 0,
  assists INTEGER DEFAULT 0,
  points INTEGER DEFAULT 0,
  plus_minus INTEGER DEFAULT 0,
  shots INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0, -- For goalies
  
  -- Custom stats (flexible JSON)
  custom_stats JSONB DEFAULT '{}'::jsonb,
  
  -- Notes about this stat entry
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS player_statistics_player_id_idx ON public.player_statistics(player_id);
CREATE INDEX IF NOT EXISTS player_statistics_coach_id_idx ON public.player_statistics(coach_id);
CREATE INDEX IF NOT EXISTS player_statistics_stat_date_idx ON public.player_statistics(stat_date);
CREATE INDEX IF NOT EXISTS player_statistics_stat_type_idx ON public.player_statistics(stat_type);

-- RLS
ALTER TABLE public.player_statistics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Coaches can manage statistics for their players" ON public.player_statistics;
CREATE POLICY "Coaches can manage statistics for their players"
ON public.player_statistics FOR ALL
USING (
  auth.uid() = coach_id
  AND EXISTS (
    SELECT 1 FROM public.coach_players
    WHERE coach_players.player_id = player_statistics.player_id
    AND coach_players.coach_id = auth.uid()
    AND coach_players.status = 'accepted'
  )
);

DROP POLICY IF EXISTS "Players can view their own statistics" ON public.player_statistics;
CREATE POLICY "Players can view their own statistics"
ON public.player_statistics FOR SELECT
USING (auth.uid() = player_id);

-- ============================================================================
-- 6. INVITATION ENHANCEMENTS
-- Update coach_players table for better invitation management
-- ============================================================================

-- Add more metadata to invitations (expires_at and cancelled_at might already exist from Phase 1A)
ALTER TABLE public.coach_players ADD COLUMN IF NOT EXISTS invitation_message TEXT;

-- Note: expires_at and cancelled_at should already exist from Phase 1A migration
-- If they don't exist, add them:
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='coach_players' AND column_name='expires_at') THEN
    ALTER TABLE public.coach_players ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Update any existing invitations without expiration (set to 30 days from invited_at)
UPDATE public.coach_players 
SET expires_at = invited_at + INTERVAL '30 days'
WHERE expires_at IS NULL AND status = 'pending';

-- ============================================================================
-- 7. STORAGE BUCKETS FOR PHOTOS
-- Set up Supabase Storage for profile photos and team photos
-- ============================================================================

-- Note: These need to be created in Supabase Dashboard or via API
-- Storage bucket policies will be set up separately

-- ============================================================================
-- 8. TRIGGERS FOR UPDATED_AT
-- ============================================================================

DROP TRIGGER IF EXISTS set_updated_at_teams ON public.teams;
CREATE TRIGGER set_updated_at_teams
BEFORE UPDATE ON public.teams
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_coach_notes ON public.coach_notes;
CREATE TRIGGER set_updated_at_coach_notes
BEFORE UPDATE ON public.coach_notes
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_player_statistics ON public.player_statistics;
CREATE TRIGGER set_updated_at_player_statistics
BEFORE UPDATE ON public.player_statistics
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- 9. HELPER FUNCTIONS
-- ============================================================================

-- Function to check if invitation is expired
CREATE OR REPLACE FUNCTION is_invitation_expired(invitation_row public.coach_players)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN invitation_row.expires_at IS NOT NULL 
    AND invitation_row.expires_at < NOW()
    AND invitation_row.status = 'pending';
END;
$$ LANGUAGE plpgsql;

-- Function to get player's coaches (for permission checks)
CREATE OR REPLACE FUNCTION get_player_coaches(p_player_id UUID)
RETURNS TABLE(coach_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT cp.coach_id
  FROM public.coach_players cp
  WHERE cp.player_id = p_player_id
    AND cp.status = 'accepted';
END;
$$ LANGUAGE plpgsql;

-- Function to calculate player age from date_of_birth
CREATE OR REPLACE FUNCTION calculate_age(birth_date DATE)
RETURNS INTEGER AS $$
BEGIN
  RETURN EXTRACT(YEAR FROM AGE(birth_date));
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 10. VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View: Player with full profile and team info
CREATE OR REPLACE VIEW player_full_profiles AS
SELECT 
  p.*,
  calculate_age(p.date_of_birth) as age,
  json_agg(DISTINCT jsonb_build_object(
    'team_id', t.id,
    'team_name', t.name,
    'season', t.season
  )) FILTER (WHERE t.id IS NOT NULL) as teams
FROM public.profiles p
LEFT JOIN public.team_players tp ON tp.player_id = p.id
LEFT JOIN public.teams t ON t.id = tp.team_id
WHERE p.role = 'player'
GROUP BY p.id;

-- ============================================================================
-- VERIFICATION QUERIES (Run these to verify migration)
-- ============================================================================

-- Check new columns in profiles
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'profiles' AND table_schema = 'public'
-- ORDER BY column_name;

-- Check new tables
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name IN ('teams', 'team_players', 'coach_notes', 'player_statistics');

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Next steps:
-- 1. Run this migration in Supabase SQL Editor
-- 2. Set up Storage buckets for photos
-- 3. Update TypeScript types
-- 4. Build service layer
-- 5. Create UI components

