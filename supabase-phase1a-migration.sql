-- Phase 1A Database Schema Migration
-- Hockey Coaching Assistant - Foundation Tables
-- 
-- This migration adds:
-- 1. coach_players (many-to-many relationship with invitations)
-- 2. drills (coach's drill library)
-- 3. practices (scheduled practice sessions)
-- 4. practice_drills (links drills to practices)
-- 5. practice_players (tracks player attendance)
--
-- Run this in your Supabase SQL Editor

-- ============================================================================
-- 1. COACH_PLAYERS TABLE (Junction table with invitation system)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.coach_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  invitation_token TEXT UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'declined')),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(coach_id, player_id)
);

-- Indexes for coach_players
CREATE INDEX IF NOT EXISTS coach_players_coach_id_idx ON public.coach_players(coach_id);
CREATE INDEX IF NOT EXISTS coach_players_player_id_idx ON public.coach_players(player_id);
CREATE INDEX IF NOT EXISTS coach_players_token_idx ON public.coach_players(invitation_token);
CREATE INDEX IF NOT EXISTS coach_players_status_idx ON public.coach_players(status);

-- RLS for coach_players
ALTER TABLE public.coach_players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can view their own player relationships"
ON public.coach_players FOR SELECT
USING (auth.uid() = coach_id);

CREATE POLICY "Players can view their own coach relationships"
ON public.coach_players FOR SELECT
USING (auth.uid() = player_id);

CREATE POLICY "Coaches can invite players"
ON public.coach_players FOR INSERT
WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Coaches can update their player relationships"
ON public.coach_players FOR UPDATE
USING (auth.uid() = coach_id);

CREATE POLICY "Players can accept/decline invitations"
ON public.coach_players FOR UPDATE
USING (auth.uid() = player_id);

CREATE POLICY "Coaches can remove players"
ON public.coach_players FOR DELETE
USING (auth.uid() = coach_id);

-- ============================================================================
-- 2. DRILLS TABLE (Drill library with AI-ready data)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.drills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  duration_minutes INTEGER,
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  objectives TEXT[], -- Array of learning objectives
  equipment_needed TEXT[], -- Array of equipment
  instructions TEXT, -- Detailed step-by-step for AI
  video_url TEXT,
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for drills
CREATE INDEX IF NOT EXISTS drills_coach_id_idx ON public.drills(coach_id);
CREATE INDEX IF NOT EXISTS drills_category_idx ON public.drills(category);
CREATE INDEX IF NOT EXISTS drills_difficulty_idx ON public.drills(difficulty);

-- RLS for drills
ALTER TABLE public.drills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can view their own drills"
ON public.drills FOR SELECT
USING (auth.uid() = coach_id);

CREATE POLICY "Coaches can create drills"
ON public.drills FOR INSERT
WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Coaches can update their own drills"
ON public.drills FOR UPDATE
USING (auth.uid() = coach_id);

CREATE POLICY "Coaches can delete their own drills"
ON public.drills FOR DELETE
USING (auth.uid() = coach_id);

-- Players can view drills assigned to their practices (will add after practice_drills)

-- ============================================================================
-- 3. PRACTICES TABLE (Scheduled practice sessions)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.practices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER,
  location TEXT,
  notes TEXT, -- Coach's notes for AI context
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for practices
CREATE INDEX IF NOT EXISTS practices_coach_id_idx ON public.practices(coach_id);
CREATE INDEX IF NOT EXISTS practices_scheduled_date_idx ON public.practices(scheduled_date);
CREATE INDEX IF NOT EXISTS practices_status_idx ON public.practices(status);

-- RLS for practices
ALTER TABLE public.practices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can view their own practices"
ON public.practices FOR SELECT
USING (auth.uid() = coach_id);

CREATE POLICY "Coaches can create practices"
ON public.practices FOR INSERT
WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Coaches can update their own practices"
ON public.practices FOR UPDATE
USING (auth.uid() = coach_id);

CREATE POLICY "Coaches can delete their own practices"
ON public.practices FOR DELETE
USING (auth.uid() = coach_id);

-- Players can view practices they're assigned to (will add after practice_players)

-- ============================================================================
-- 4. PRACTICE_DRILLS TABLE (Links drills to practices)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.practice_drills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID NOT NULL REFERENCES public.practices(id) ON DELETE CASCADE,
  drill_id UUID NOT NULL REFERENCES public.drills(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  custom_notes TEXT, -- Practice-specific notes about this drill
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(practice_id, drill_id)
);

-- Indexes for practice_drills
CREATE INDEX IF NOT EXISTS practice_drills_practice_id_idx ON public.practice_drills(practice_id);
CREATE INDEX IF NOT EXISTS practice_drills_drill_id_idx ON public.practice_drills(drill_id);

-- RLS for practice_drills
ALTER TABLE public.practice_drills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can manage practice drills"
ON public.practice_drills FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.practices
    WHERE practices.id = practice_drills.practice_id
    AND practices.coach_id = auth.uid()
  )
);

-- Players can view drills in their assigned practices
CREATE POLICY "Players can view practice drills"
ON public.practice_drills FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.practice_players
    WHERE practice_players.practice_id = practice_drills.practice_id
    AND practice_players.player_id = auth.uid()
  )
);

-- ============================================================================
-- 5. PRACTICE_PLAYERS TABLE (Tracks player attendance)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.practice_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID NOT NULL REFERENCES public.practices(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  attendance_status TEXT DEFAULT 'invited' CHECK (
    attendance_status IN ('invited', 'confirmed', 'attended', 'missed', 'excused')
  ),
  notes TEXT, -- Player's notes or coach's notes about attendance
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(practice_id, player_id)
);

-- Indexes for practice_players
CREATE INDEX IF NOT EXISTS practice_players_practice_id_idx ON public.practice_players(practice_id);
CREATE INDEX IF NOT EXISTS practice_players_player_id_idx ON public.practice_players(player_id);
CREATE INDEX IF NOT EXISTS practice_players_status_idx ON public.practice_players(attendance_status);

-- RLS for practice_players
ALTER TABLE public.practice_players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can manage practice players"
ON public.practice_players FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.practices
    WHERE practices.id = practice_players.practice_id
    AND practices.coach_id = auth.uid()
  )
);

CREATE POLICY "Players can view their own practice assignments"
ON public.practice_players FOR SELECT
USING (auth.uid() = player_id);

CREATE POLICY "Players can update their attendance status"
ON public.practice_players FOR UPDATE
USING (auth.uid() = player_id)
WITH CHECK (auth.uid() = player_id);

-- ============================================================================
-- ADD PLAYER POLICIES FOR VIEWING PRACTICES AND DRILLS
-- ============================================================================

-- Players can view practices they're assigned to
CREATE POLICY "Players can view assigned practices"
ON public.practices FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.practice_players
    WHERE practice_players.practice_id = practices.id
    AND practice_players.player_id = auth.uid()
  )
);

-- Players can view drills in their assigned practices
CREATE POLICY "Players can view drills in assigned practices"
ON public.drills FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.practice_drills pd
    JOIN public.practice_players pp ON pp.practice_id = pd.practice_id
    WHERE pd.drill_id = drills.id
    AND pp.player_id = auth.uid()
  )
);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT TIMESTAMPS
-- ============================================================================

-- Reuse the existing handle_updated_at function from profiles table

CREATE TRIGGER set_updated_at_coach_players
BEFORE UPDATE ON public.coach_players
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_drills
BEFORE UPDATE ON public.drills
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_practices
BEFORE UPDATE ON public.practices
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_practice_players
BEFORE UPDATE ON public.practice_players
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to generate secure invitation tokens
CREATE OR REPLACE FUNCTION generate_invitation_token()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'base64');
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VERIFICATION QUERIES (Optional - for testing)
-- ============================================================================

-- Uncomment and run these to verify the schema was created correctly:

-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name IN ('coach_players', 'drills', 'practices', 'practice_drills', 'practice_players');

-- SELECT * FROM pg_policies WHERE schemaname = 'public' 
-- AND tablename IN ('coach_players', 'drills', 'practices', 'practice_drills', 'practice_players');

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Next steps:
-- 1. Run this entire script in Supabase SQL Editor
-- 2. Verify all tables were created
-- 3. Test RLS policies with example data
-- 4. Update TypeScript types to match new schema

