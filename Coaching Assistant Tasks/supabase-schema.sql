-- =====================================================
-- COACHING ASSISTANT - COMPLETE DATABASE SCHEMA
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. USERS & PROFILES
-- =====================================================

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    photo_url TEXT,
    role TEXT NOT NULL CHECK (role IN ('coach', 'player')),
    organization TEXT, -- For coaches
    position TEXT, -- For players
    coach_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- For players
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_coach_id ON public.profiles(coach_id);

-- =====================================================
-- 2. INVITATIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    coach_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_invitations_coach_id ON public.invitations(coach_id);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON public.invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON public.invitations(status);

-- =====================================================
-- 3. DRILLS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.drills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('shooting', 'skating', 'stickhandling', 'passing', 'defensive', 'goaltending', 'conditioning', 'other')),
    difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    duration_minutes INTEGER NOT NULL,
    equipment TEXT[], -- Array of equipment needed
    key_points TEXT[], -- Array of coaching points
    video_urls TEXT[], -- Array of video links
    is_custom BOOLEAN DEFAULT false, -- true if created by coach, false if pre-built
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- NULL for pre-built drills
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_drills_category ON public.drills(category);
CREATE INDEX IF NOT EXISTS idx_drills_difficulty ON public.drills(difficulty);
CREATE INDEX IF NOT EXISTS idx_drills_created_by ON public.drills(created_by);

-- =====================================================
-- 4. PRACTICE SESSIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.practice_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    coach_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    scheduled_date TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER NOT NULL,
    location TEXT,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'missed')),
    notes TEXT, -- Coach notes
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_practice_sessions_coach_id ON public.practice_sessions(coach_id);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_player_id ON public.practice_sessions(player_id);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_scheduled_date ON public.practice_sessions(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_status ON public.practice_sessions(status);

-- =====================================================
-- 5. SESSION DRILLS (Many-to-Many relationship)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.session_drills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES public.practice_sessions(id) ON DELETE CASCADE,
    drill_id UUID NOT NULL REFERENCES public.drills(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL, -- Order in the session
    sets INTEGER DEFAULT 1,
    reps INTEGER DEFAULT 1,
    notes TEXT, -- Specific notes for this drill in this session
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_session_drills_session_id ON public.session_drills(session_id);
CREATE INDEX IF NOT EXISTS idx_session_drills_drill_id ON public.session_drills(drill_id);

-- =====================================================
-- 6. DRILL COMPLETIONS (Progress Tracking)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.drill_completions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    drill_id UUID NOT NULL REFERENCES public.drills(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.practice_sessions(id) ON DELETE SET NULL,
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    duration_minutes INTEGER,
    sets_completed INTEGER,
    reps_completed INTEGER,
    performance_rating INTEGER CHECK (performance_rating >= 1 AND performance_rating <= 5), -- 1-5 stars
    player_notes TEXT, -- Player's self-reflection
    coach_feedback TEXT, -- Coach's feedback
    video_url TEXT, -- Optional video of completion
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_drill_completions_player_id ON public.drill_completions(player_id);
CREATE INDEX IF NOT EXISTS idx_drill_completions_drill_id ON public.drill_completions(drill_id);
CREATE INDEX IF NOT EXISTS idx_drill_completions_session_id ON public.drill_completions(session_id);
CREATE INDEX IF NOT EXISTS idx_drill_completions_completed_at ON public.drill_completions(completed_at);

-- =====================================================
-- 7. PERFORMANCE METRICS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.performance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    metric_type TEXT NOT NULL, -- e.g., 'shooting_accuracy', 'skating_speed', 'endurance'
    metric_value DECIMAL(10, 2) NOT NULL,
    unit TEXT NOT NULL, -- e.g., 'percentage', 'seconds', 'count'
    recorded_at TIMESTAMPTZ DEFAULT NOW(),
    drill_completion_id UUID REFERENCES public.drill_completions(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_performance_metrics_player_id ON public.performance_metrics(player_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_metric_type ON public.performance_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_recorded_at ON public.performance_metrics(recorded_at);

-- =====================================================
-- 8. ACTIVITY LOGS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL, -- e.g., 'drill_completed', 'session_scheduled', 'feedback_given'
    entity_type TEXT, -- e.g., 'drill', 'session', 'player'
    entity_id UUID, -- ID of the related entity
    description TEXT NOT NULL,
    metadata JSONB, -- Additional data
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action_type ON public.activity_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at);

-- =====================================================
-- 9. MESSAGES (Coach-Player Communication)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    subject TEXT,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    parent_message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL, -- For threading
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON public.messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);

-- =====================================================
-- 10. AI CONVERSATIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.ai_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT,
    context JSONB, -- Store context like upcoming session, assigned drills
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_conversations_player_id ON public.ai_conversations(player_id);

-- =====================================================
-- 11. AI MESSAGES
-- =====================================================

CREATE TABLE IF NOT EXISTS public.ai_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation_id ON public.ai_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_created_at ON public.ai_messages(created_at);

-- =====================================================
-- 12. GOALS & OBJECTIVES
-- =====================================================

CREATE TABLE IF NOT EXISTS public.goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    coach_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    target_date DATE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_goals_player_id ON public.goals(player_id);
CREATE INDEX IF NOT EXISTS idx_goals_coach_id ON public.goals(coach_id);
CREATE INDEX IF NOT EXISTS idx_goals_status ON public.goals(status);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_drills_updated_at BEFORE UPDATE ON public.drills FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_practice_sessions_updated_at BEFORE UPDATE ON public.practice_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_drill_completions_updated_at BEFORE UPDATE ON public.drill_completions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_conversations_updated_at BEFORE UPDATE ON public.ai_conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON public.goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_drills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drill_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Coaches can view their players" ON public.profiles FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'coach')
    AND coach_id = auth.uid()
);
CREATE POLICY "Players can view their coach" ON public.profiles FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'player' AND coach_id = profiles.id)
);

-- Invitations policies
CREATE POLICY "Coaches can manage their invitations" ON public.invitations FOR ALL USING (coach_id = auth.uid());
CREATE POLICY "Anyone can view pending invitations by token" ON public.invitations FOR SELECT USING (status = 'pending');

-- Drills policies
CREATE POLICY "Anyone authenticated can view drills" ON public.drills FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Coaches can create drills" ON public.drills FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'coach')
);
CREATE POLICY "Coaches can update their drills" ON public.drills FOR UPDATE USING (created_by = auth.uid());
CREATE POLICY "Coaches can delete their drills" ON public.drills FOR DELETE USING (created_by = auth.uid());

-- Practice sessions policies
CREATE POLICY "Coaches can manage their sessions" ON public.practice_sessions FOR ALL USING (coach_id = auth.uid());
CREATE POLICY "Players can view their sessions" ON public.practice_sessions FOR SELECT USING (player_id = auth.uid());

-- Session drills policies
CREATE POLICY "Users can view session drills" ON public.session_drills FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.practice_sessions ps 
        WHERE ps.id = session_drills.session_id 
        AND (ps.coach_id = auth.uid() OR ps.player_id = auth.uid())
    )
);
CREATE POLICY "Coaches can manage session drills" ON public.session_drills FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.practice_sessions ps 
        WHERE ps.id = session_drills.session_id 
        AND ps.coach_id = auth.uid()
    )
);

-- Drill completions policies
CREATE POLICY "Players can manage their completions" ON public.drill_completions FOR ALL USING (player_id = auth.uid());
CREATE POLICY "Coaches can view their players' completions" ON public.drill_completions FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = drill_completions.player_id AND coach_id = auth.uid())
);
CREATE POLICY "Coaches can add feedback to completions" ON public.drill_completions FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = drill_completions.player_id AND coach_id = auth.uid())
);

-- Performance metrics policies
CREATE POLICY "Players can manage their metrics" ON public.performance_metrics FOR ALL USING (player_id = auth.uid());
CREATE POLICY "Coaches can view their players' metrics" ON public.performance_metrics FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = performance_metrics.player_id AND coach_id = auth.uid())
);

-- Activity logs policies
CREATE POLICY "Users can view own activity logs" ON public.activity_logs FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create own activity logs" ON public.activity_logs FOR INSERT WITH CHECK (user_id = auth.uid());

-- Messages policies
CREATE POLICY "Users can view their messages" ON public.messages FOR SELECT USING (
    sender_id = auth.uid() OR recipient_id = auth.uid()
);
CREATE POLICY "Users can send messages" ON public.messages FOR INSERT WITH CHECK (sender_id = auth.uid());

-- AI conversations policies
CREATE POLICY "Players can manage their AI conversations" ON public.ai_conversations FOR ALL USING (player_id = auth.uid());

-- AI messages policies
CREATE POLICY "Players can manage their AI messages" ON public.ai_messages FOR ALL USING (
    EXISTS (SELECT 1 FROM public.ai_conversations WHERE id = ai_messages.conversation_id AND player_id = auth.uid())
);

-- Goals policies
CREATE POLICY "Players can view their goals" ON public.goals FOR SELECT USING (player_id = auth.uid());
CREATE POLICY "Coaches can manage their players' goals" ON public.goals FOR ALL USING (coach_id = auth.uid());

-- =====================================================
-- SEED DATA: Pre-built Drills
-- =====================================================

-- Insert some sample pre-built drills
INSERT INTO public.drills (title, description, category, difficulty, duration_minutes, equipment, key_points, video_urls, is_custom, created_by) VALUES
(
    'Wrist Shot Accuracy',
    'Practice wrist shots focusing on accuracy and quick release. Set up targets in all four corners of the net.',
    'shooting',
    'beginner',
    15,
    ARRAY['pucks', 'net', 'targets'],
    ARRAY['Keep head up', 'Follow through to target', 'Quick release', 'Weight transfer'],
    ARRAY['https://www.youtube.com/watch?v=example1'],
    false,
    NULL
),
(
    'Edge Work Figure 8s',
    'Skating drill focusing on inside and outside edges. Skate figure 8 patterns around cones.',
    'skating',
    'intermediate',
    20,
    ARRAY['cones', 'ice'],
    ARRAY['Deep knee bend', 'Lean into turns', 'Push with outside edge', 'Keep shoulders level'],
    ARRAY['https://www.youtube.com/watch?v=example2'],
    false,
    NULL
),
(
    'Stickhandling Through Cones',
    'Weave through cones while maintaining puck control. Focus on soft hands and head up.',
    'stickhandling',
    'beginner',
    10,
    ARRAY['pucks', 'cones'],
    ARRAY['Soft hands', 'Head up', 'Wide stickhandling', 'Control speed'],
    ARRAY['https://www.youtube.com/watch?v=example3'],
    false,
    NULL
),
(
    '2-on-1 Passing Drill',
    'Two offensive players work against one defender. Focus on quick passes and timing.',
    'passing',
    'advanced',
    25,
    ARRAY['pucks', 'cones'],
    ARRAY['Quick passes', 'Communication', 'Give and go', 'Support teammate'],
    ARRAY['https://www.youtube.com/watch?v=example4'],
    false,
    NULL
),
(
    'Gap Control Drill',
    'Defensive drill focusing on maintaining proper gap between defender and attacker.',
    'defensive',
    'intermediate',
    20,
    ARRAY['pucks', 'cones'],
    ARRAY['Active stick', 'Proper gap', 'Angle off attacker', 'Stay between player and net'],
    ARRAY['https://www.youtube.com/watch?v=example5'],
    false,
    NULL
);

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- View for player progress summary
CREATE OR REPLACE VIEW player_progress_summary AS
SELECT 
    p.id as player_id,
    p.display_name,
    COUNT(DISTINCT dc.id) as total_completions,
    COUNT(DISTINCT ps.id) as total_sessions,
    AVG(dc.performance_rating) as avg_performance_rating,
    COUNT(DISTINCT dc.drill_id) as unique_drills_completed
FROM public.profiles p
LEFT JOIN public.drill_completions dc ON p.id = dc.player_id
LEFT JOIN public.practice_sessions ps ON p.id = ps.player_id
WHERE p.role = 'player'
GROUP BY p.id, p.display_name;

-- View for coach dashboard
CREATE OR REPLACE VIEW coach_dashboard AS
SELECT 
    c.id as coach_id,
    c.display_name as coach_name,
    COUNT(DISTINCT p.id) as total_players,
    COUNT(DISTINCT ps.id) as total_sessions,
    COUNT(DISTINCT d.id) as custom_drills_created
FROM public.profiles c
LEFT JOIN public.profiles p ON c.id = p.coach_id
LEFT JOIN public.practice_sessions ps ON c.id = ps.coach_id
LEFT JOIN public.drills d ON c.id = d.created_by
WHERE c.role = 'coach'
GROUP BY c.id, c.display_name;

-- =====================================================
-- COMPLETE!
-- =====================================================
