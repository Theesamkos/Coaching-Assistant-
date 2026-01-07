-- ============================================================================
-- COACHING ASSISTANT - COMPREHENSIVE FIX AND MIGRATION
-- ============================================================================
-- This script will:
-- 1. Backup and rename the old drills table
-- 2. Enable RLS on all existing tables
-- 3. Add RLS policies for existing tables
-- 4. Run the Phase 1A migration (new tables)
-- 5. Migrate old drills data to new schema
-- ============================================================================

-- ============================================================================
-- STEP 1: BACKUP OLD DRILLS TABLE
-- ============================================================================

-- Rename old drills table to drills_backup
ALTER TABLE IF EXISTS public.drills RENAME TO drills_backup;

-- ============================================================================
-- STEP 2: ENABLE RLS ON ALL EXISTING TABLES
-- ============================================================================

ALTER TABLE public.drills_backup ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drill_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_drills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 3: ADD RLS POLICIES FOR EXISTING TABLES
-- ============================================================================

-- Policies for practice_sessions
CREATE POLICY "Coaches can manage their own practice sessions"
ON public.practice_sessions FOR ALL
USING (auth.uid() = coach_id);

CREATE POLICY "Players can view their assigned practice sessions"
ON public.practice_sessions FOR SELECT
USING (auth.uid() = player_id);

-- Policies for drill_completions
CREATE POLICY "Players can manage their own drill completions"
ON public.drill_completions FOR ALL
USING (auth.uid() = player_id);

CREATE POLICY "Coaches can view their players' drill completions"
ON public.drill_completions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.practice_sessions ps
    WHERE ps.id = drill_completions.session_id
    AND ps.coach_id = auth.uid()
  )
);

-- Policies for session_drills
CREATE POLICY "Coaches can manage session drills"
ON public.session_drills FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.practice_sessions ps
    WHERE ps.id = session_drills.session_id
    AND ps.coach_id = auth.uid()
  )
);

CREATE POLICY "Players can view session drills"
ON public.session_drills FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.practice_sessions ps
    WHERE ps.id = session_drills.session_id
    AND ps.player_id = auth.uid()
  )
);

-- Policies for invitations
CREATE POLICY "Coaches can manage their own invitations"
ON public.invitations FOR ALL
USING (auth.uid() = coach_id);

CREATE POLICY "Anyone can view invitations by token"
ON public.invitations FOR SELECT
USING (true);

-- Policies for goals
CREATE POLICY "Players can view their own goals"
ON public.goals FOR SELECT
USING (auth.uid() = player_id);

CREATE POLICY "Coaches can manage goals for their players"
ON public.goals FOR ALL
USING (auth.uid() = coach_id);

-- Policies for messages
CREATE POLICY "Users can view their sent messages"
ON public.messages FOR SELECT
USING (auth.uid() = sender_id);

CREATE POLICY "Users can view their received messages"
ON public.messages FOR SELECT
USING (auth.uid() = recipient_id);

CREATE POLICY "Users can send messages"
ON public.messages FOR INSERT
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their received messages"
ON public.messages FOR UPDATE
USING (auth.uid() = recipient_id);

-- Policies for ai_conversations
CREATE POLICY "Players can manage their own AI conversations"
ON public.ai_conversations FOR ALL
USING (auth.uid() = player_id);

-- Policies for ai_messages
CREATE POLICY "Players can manage their AI messages"
ON public.ai_messages FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.ai_conversations ac
    WHERE ac.id = ai_messages.conversation_id
    AND ac.player_id = auth.uid()
  )
);

-- Policies for performance_metrics
CREATE POLICY "Players can view their own performance metrics"
ON public.performance_metrics FOR SELECT
USING (auth.uid() = player_id);

CREATE POLICY "Coaches can manage performance metrics"
ON public.performance_metrics FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.drill_completions dc
    WHERE dc.id = performance_metrics.drill_completion_id
    AND EXISTS (
      SELECT 1 FROM public.practice_sessions ps
      WHERE ps.id = dc.session_id
      AND ps.coach_id = auth.uid()
    )
  )
);

-- Policies for activity_logs
CREATE POLICY "Users can view their own activity logs"
ON public.activity_logs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own activity logs"
ON public.activity_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- STEP 4: RUN PHASE 1A MIGRATION (NEW TABLES)
-- ============================================================================

-- 1. COACH_PLAYERS TABLE (Junction table with invitation system)
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

-- 2. NEW DRILLS TABLE (AI-ready with new schema)
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

-- 3. PRACTICES TABLE (Scheduled practice sessions)
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

-- 4. PRACTICE_DRILLS TABLE (Links drills to practices)
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

-- 5. PRACTICE_PLAYERS TABLE (Tracks player attendance)
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

-- ADD PLAYER POLICIES FOR VIEWING PRACTICES AND DRILLS
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

-- Players can view practice drills
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
-- STEP 5: CREATE TRIGGERS FOR UPDATED_AT TIMESTAMPS
-- ============================================================================

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
-- STEP 6: CREATE HELPER FUNCTIONS
-- ============================================================================

-- Function to generate secure invitation tokens
CREATE OR REPLACE FUNCTION generate_invitation_token()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'base64');
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 7: MIGRATE OLD DRILLS DATA TO NEW SCHEMA
-- ============================================================================
-- Note: This will assign all old drills to the first coach in the system
-- You can manually reassign them later if needed

-- Get the first coach user ID (or you can specify a specific coach_id)
DO $$
DECLARE
  first_coach_id UUID;
BEGIN
  -- Find the first coach in the system
  SELECT id INTO first_coach_id
  FROM public.profiles
  WHERE role = 'coach'
  LIMIT 1;

  -- If a coach exists, migrate the drills
  IF first_coach_id IS NOT NULL THEN
    INSERT INTO public.drills (
      id,
      coach_id,
      title,
      description,
      category,
      duration_minutes,
      difficulty,
      objectives,
      equipment_needed,
      instructions,
      video_url,
      is_favorite,
      created_at,
      updated_at
    )
    SELECT
      id,
      first_coach_id, -- Assign to first coach
      title,
      description,
      category,
      duration_minutes,
      difficulty,
      key_points, -- Map key_points to objectives
      equipment, -- Map equipment to equipment_needed
      description, -- Use description as instructions for now
      video_urls[1], -- Take first video URL
      false, -- Default is_favorite to false
      created_at,
      updated_at
    FROM public.drills_backup;

    RAISE NOTICE 'Migrated % drills to new schema', (SELECT COUNT(*) FROM public.drills_backup);
  ELSE
    RAISE NOTICE 'No coach found. Please create a coach profile first, then manually migrate drills.';
  END IF;
END $$;

-- ============================================================================
-- STEP 8: ADD INDEXES FOR EXISTING TABLES (PERFORMANCE)
-- ============================================================================

CREATE INDEX IF NOT EXISTS practice_sessions_coach_id_idx ON public.practice_sessions(coach_id);
CREATE INDEX IF NOT EXISTS practice_sessions_player_id_idx ON public.practice_sessions(player_id);
CREATE INDEX IF NOT EXISTS practice_sessions_scheduled_date_idx ON public.practice_sessions(scheduled_date);

CREATE INDEX IF NOT EXISTS drill_completions_player_id_idx ON public.drill_completions(player_id);
CREATE INDEX IF NOT EXISTS drill_completions_drill_id_idx ON public.drill_completions(drill_id);
CREATE INDEX IF NOT EXISTS drill_completions_session_id_idx ON public.drill_completions(session_id);

CREATE INDEX IF NOT EXISTS invitations_coach_id_idx ON public.invitations(coach_id);
CREATE INDEX IF NOT EXISTS invitations_token_idx ON public.invitations(token);
CREATE INDEX IF NOT EXISTS invitations_email_idx ON public.invitations(email);

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Verification query
SELECT 
  'Migration Complete!' as status,
  (SELECT COUNT(*) FROM public.coach_players) as coach_players_count,
  (SELECT COUNT(*) FROM public.drills) as drills_count,
  (SELECT COUNT(*) FROM public.practices) as practices_count,
  (SELECT COUNT(*) FROM public.practice_drills) as practice_drills_count,
  (SELECT COUNT(*) FROM public.practice_players) as practice_players_count,
  (SELECT COUNT(*) FROM public.drills_backup) as drills_backup_count;
