-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Invitations table
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

-- Drills table
CREATE TABLE IF NOT EXISTS public.drills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('shooting', 'skating', 'stickhandling', 'passing', 'defensive', 'goaltending', 'conditioning', 'other')),
    difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    duration_minutes INTEGER NOT NULL,
    equipment TEXT[],
    key_points TEXT[],
    video_urls TEXT[],
    is_custom BOOLEAN DEFAULT false,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_drills_category ON public.drills(category);
CREATE INDEX IF NOT EXISTS idx_drills_difficulty ON public.drills(difficulty);
CREATE INDEX IF NOT EXISTS idx_drills_created_by ON public.drills(created_by);

-- Practice sessions table
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
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_practice_sessions_coach_id ON public.practice_sessions(coach_id);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_player_id ON public.practice_sessions(player_id);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_scheduled_date ON public.practice_sessions(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_status ON public.practice_sessions(status);

-- Session drills table
CREATE TABLE IF NOT EXISTS public.session_drills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES public.practice_sessions(id) ON DELETE CASCADE,
    drill_id UUID NOT NULL REFERENCES public.drills(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL,
    sets INTEGER DEFAULT 1,
    reps INTEGER DEFAULT 1,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_session_drills_session_id ON public.session_drills(session_id);
CREATE INDEX IF NOT EXISTS idx_session_drills_drill_id ON public.session_drills(drill_id);

-- Drill completions table
CREATE TABLE IF NOT EXISTS public.drill_completions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    drill_id UUID NOT NULL REFERENCES public.drills(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.practice_sessions(id) ON DELETE SET NULL,
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    duration_minutes INTEGER,
    sets_completed INTEGER,
    reps_completed INTEGER,
    performance_rating INTEGER CHECK (performance_rating >= 1 AND performance_rating <= 5),
    player_notes TEXT,
    coach_feedback TEXT,
    video_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_drill_completions_player_id ON public.drill_completions(player_id);
CREATE INDEX IF NOT EXISTS idx_drill_completions_drill_id ON public.drill_completions(drill_id);
CREATE INDEX IF NOT EXISTS idx_drill_completions_session_id ON public.drill_completions(session_id);
CREATE INDEX IF NOT EXISTS idx_drill_completions_completed_at ON public.drill_completions(completed_at);

-- Performance metrics table
CREATE TABLE IF NOT EXISTS public.performance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    metric_type TEXT NOT NULL,
    metric_value DECIMAL(10, 2) NOT NULL,
    unit TEXT NOT NULL,
    recorded_at TIMESTAMPTZ DEFAULT NOW(),
    drill_completion_id UUID REFERENCES public.drill_completions(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_performance_metrics_player_id ON public.performance_metrics(player_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_metric_type ON public.performance_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_recorded_at ON public.performance_metrics(recorded_at);

-- Activity logs table
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    description TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action_type ON public.activity_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at);

-- Messages table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    subject TEXT,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    parent_message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON public.messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);

-- AI conversations table
CREATE TABLE IF NOT EXISTS public.ai_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT,
    context JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_conversations_player_id ON public.ai_conversations(player_id);

-- AI messages table
CREATE TABLE IF NOT EXISTS public.ai_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation_id ON public.ai_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_created_at ON public.ai_messages(created_at);

-- Goals table
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
