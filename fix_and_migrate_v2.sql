-- ============================================================================
-- COACHING ASSISTANT - COMPREHENSIVE FIX AND MIGRATION V2
-- ============================================================================
-- This script will:
-- 1. Drop foreign key constraints referencing drills
-- 2. Rename old drills table to drills_backup
-- 3. Create new tables (coach_players, drills, practices, etc.)
-- 4. Migrate data from drills_backup to new drills table
-- 5. Re-create foreign key constraints
-- 6. Enable RLS on all tables
-- ============================================================================

-- ============================================================================
-- STEP 1: DROP FOREIGN KEY CONSTRAINTS REFERENCING DRILLS
-- ============================================================================

ALTER TABLE IF EXISTS public.session_drills DROP CONSTRAINT IF EXISTS session_drills_drill_id_fkey;
ALTER TABLE IF EXISTS public.drill_completions DROP CONSTRAINT IF EXISTS drill_completions_drill_id_fkey;

-- ============================================================================
-- STEP 2: RENAME OLD DRILLS TABLE
-- ============================================================================

ALTER TABLE IF EXISTS public.drills RENAME TO drills_backup;

-- ============================================================================
-- STEP 3: ENABLE RLS ON EXISTING TABLES
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
-- STEP 4: ADD RLS POLICIES FOR EXISTING TABLES
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
-- STEP 5: CREATE NEW TABLES
-- ============================================================================

-- 1. COACH_PLAYERS TABLE
CREATE TABLE public.coach_players (
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

CREATE INDEX coach_players_coach_id_idx ON public.coach_players(coach_id);
CREATE INDEX coach_players_player_id_idx ON public.coach_players(player_id);
CREATE INDEX coach_players_token_idx ON public.coach_players(invitation_token);
CREATE INDEX coach_players_status_idx ON public.coach_players(status);

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

-- 2. NEW DRILLS TABLE
CREATE TABLE public.drills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  duration_minutes INTEGER,
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  objectives TEXT[],
  equipment_needed TEXT[],
  instructions TEXT,
  video_url TEXT,
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX drills_coach_id_idx ON public.drills(coach_id);
CREATE INDEX drills_category_idx ON public.drills(category);
CREATE INDEX drills_difficulty_idx ON public.drills(difficulty);

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

-- 3. PRACTICES TABLE
CREATE TABLE public.practices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER,
  location TEXT,
  notes TEXT,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX practices_coach_id_idx ON public.practices(coach_id);
CREATE INDEX practices_scheduled_date_idx ON public.practices(scheduled_date);
CREATE INDEX practices_status_idx ON public.practices(status);

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

-- 4. PRACTICE_DRILLS TABLE
CREATE TABLE public.practice_drills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID NOT NULL REFERENCES public.practices(id) ON DELETE CASCADE,
  drill_id UUID NOT NULL REFERENCES public.drills(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  custom_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(practice_id, drill_id)
);

CREATE INDEX practice_drills_practice_id_idx ON public.practice_drills(practice_id);
CREATE INDEX practice_drills_drill_id_idx ON public.practice_drills(drill_id);

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

-- 5. PRACTICE_PLAYERS TABLE
CREATE TABLE public.practice_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID NOT NULL REFERENCES public.practices(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  attendance_status TEXT DEFAULT 'invited' CHECK (
    attendance_status IN ('invited', 'confirmed', 'attended', 'missed', 'excused')
  ),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(practice_id, player_id)
);

CREATE INDEX practice_players_practice_id_idx ON public.practice_players(practice_id);
CREATE INDEX practice_players_player_id_idx ON public.practice_players(player_id);
CREATE INDEX practice_players_status_idx ON public.practice_players(attendance_status);

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

-- Player policies for viewing practices and drills
CREATE POLICY "Players can view assigned practices"
ON public.practices FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.practice_players
    WHERE practice_players.practice_id = practices.id
    AND practice_players.player_id = auth.uid()
  )
);

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
-- STEP 6: CREATE TRIGGERS
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
-- STEP 7: CREATE HELPER FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_invitation_token()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'base64');
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 8: MIGRATE OLD DRILLS DATA
-- ============================================================================

DO $$
DECLARE
  first_coach_id UUID;
BEGIN
  SELECT id INTO first_coach_id
  FROM public.profiles
  WHERE role = 'coach'
  LIMIT 1;

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
      first_coach_id,
      title,
      description,
      category,
      duration_minutes,
      difficulty,
      key_points,
      equipment,
      description,
      video_urls[1],
      false,
      created_at,
      updated_at
    FROM public.drills_backup;

    RAISE NOTICE 'Migrated % drills', (SELECT COUNT(*) FROM public.drills_backup);
  ELSE
    RAISE NOTICE 'No coach found. Drills not migrated.';
  END IF;
END $$;

-- ============================================================================
-- STEP 9: RE-CREATE FOREIGN KEY CONSTRAINTS
-- ============================================================================

ALTER TABLE public.session_drills 
ADD CONSTRAINT session_drills_drill_id_fkey 
FOREIGN KEY (drill_id) REFERENCES public.drills(id) ON DELETE CASCADE;

ALTER TABLE public.drill_completions 
ADD CONSTRAINT drill_completions_drill_id_fkey 
FOREIGN KEY (drill_id) REFERENCES public.drills(id) ON DELETE CASCADE;

-- ============================================================================
-- STEP 10: ADD INDEXES FOR PERFORMANCE
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

SELECT 
  'Migration Complete!' as status,
  (SELECT COUNT(*) FROM public.coach_players) as coach_players_count,
  (SELECT COUNT(*) FROM public.drills) as drills_count,
  (SELECT COUNT(*) FROM public.practices) as practices_count,
  (SELECT COUNT(*) FROM public.practice_drills) as practice_drills_count,
  (SELECT COUNT(*) FROM public.practice_players) as practice_players_count,
  (SELECT COUNT(*) FROM public.drills_backup) as drills_backup_count;
