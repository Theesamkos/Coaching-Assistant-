-- Communication Center Database Schema
-- Adds announcements, messages, and notification system

-- Announcements Table
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  target_audience TEXT NOT NULL DEFAULT 'all' CHECK (target_audience IN ('all', 'team', 'individual')),
  target_team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  target_player_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  related_practice_id UUID REFERENCES public.practices(id) ON DELETE SET NULL,
  is_pinned BOOLEAN DEFAULT FALSE NOT NULL,
  published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  CONSTRAINT valid_target CHECK (
    (target_audience = 'all' AND target_team_id IS NULL AND target_player_id IS NULL) OR
    (target_audience = 'team' AND target_team_id IS NOT NULL AND target_player_id IS NULL) OR
    (target_audience = 'individual' AND target_player_id IS NOT NULL AND target_team_id IS NULL)
  )
);

-- Announcement Reads (track who has read each announcement)
CREATE TABLE IF NOT EXISTS public.announcement_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(announcement_id, player_id)
);

-- Team Messages Table (message board style)
CREATE TABLE IF NOT EXISTS public.team_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  coach_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_coach_only BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  CONSTRAINT valid_scope CHECK (
    (team_id IS NOT NULL AND coach_id IS NULL) OR
    (coach_id IS NOT NULL AND team_id IS NULL)
  )
);

-- Message Reactions (optional, for engagement)
CREATE TABLE IF NOT EXISTS public.message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.team_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reaction TEXT NOT NULL CHECK (reaction IN ('like', 'celebrate', 'support', 'fire')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(message_id, user_id, reaction)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_announcements_coach_id ON public.announcements(coach_id);
CREATE INDEX IF NOT EXISTS idx_announcements_published_at ON public.announcements(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_target_team ON public.announcements(target_team_id) WHERE target_team_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_announcements_target_player ON public.announcements(target_player_id) WHERE target_player_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_announcements_practice ON public.announcements(related_practice_id) WHERE related_practice_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_announcements_pinned ON public.announcements(is_pinned, published_at DESC) WHERE is_pinned = true;

CREATE INDEX IF NOT EXISTS idx_announcement_reads_announcement ON public.announcement_reads(announcement_id);
CREATE INDEX IF NOT EXISTS idx_announcement_reads_player ON public.announcement_reads(player_id);

CREATE INDEX IF NOT EXISTS idx_team_messages_team ON public.team_messages(team_id, created_at DESC) WHERE team_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_team_messages_coach ON public.team_messages(coach_id, created_at DESC) WHERE coach_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_team_messages_author ON public.team_messages(author_id);

CREATE INDEX IF NOT EXISTS idx_message_reactions_message ON public.message_reactions(message_id);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_announcements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS announcements_updated_at ON public.announcements;
CREATE TRIGGER announcements_updated_at
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW
  EXECUTE FUNCTION update_announcements_updated_at();

CREATE OR REPLACE FUNCTION update_team_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS team_messages_updated_at ON public.team_messages;
CREATE TRIGGER team_messages_updated_at
  BEFORE UPDATE ON public.team_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_team_messages_updated_at();

-- RLS Policies
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

-- Announcements Policies
-- Coaches can create, read, update, delete their own announcements
CREATE POLICY "Coaches can manage their announcements"
  ON public.announcements
  FOR ALL
  USING (auth.uid() = coach_id)
  WITH CHECK (auth.uid() = coach_id);

-- Players can read announcements targeted to them
CREATE POLICY "Players can read their announcements"
  ON public.announcements
  FOR SELECT
  USING (
    target_audience = 'all' OR
    (target_audience = 'individual' AND auth.uid() = target_player_id) OR
    (target_audience = 'team' AND target_team_id IN (
      SELECT team_id FROM public.team_players WHERE player_id = auth.uid()
    ))
  );

-- Announcement Reads Policies
CREATE POLICY "Users can manage their own reads"
  ON public.announcement_reads
  FOR ALL
  USING (auth.uid() = player_id)
  WITH CHECK (auth.uid() = player_id);

CREATE POLICY "Coaches can view reads for their announcements"
  ON public.announcement_reads
  FOR SELECT
  USING (
    announcement_id IN (
      SELECT id FROM public.announcements WHERE coach_id = auth.uid()
    )
  );

-- Team Messages Policies
-- Users can read messages in their teams or coach groups
CREATE POLICY "Users can read their team messages"
  ON public.team_messages
  FOR SELECT
  USING (
    (team_id IS NOT NULL AND team_id IN (
      SELECT tp.team_id FROM public.team_players tp WHERE tp.player_id = auth.uid()
      UNION
      SELECT t.id FROM public.teams t WHERE t.coach_id = auth.uid()
    )) OR
    (coach_id = auth.uid() AND is_coach_only = true) OR
    (coach_id IS NOT NULL AND coach_id IN (
      SELECT cp.coach_id FROM public.coach_players cp WHERE cp.player_id = auth.uid() AND cp.status = 'accepted'
    ))
  );

-- Users can create messages in their teams
CREATE POLICY "Users can create team messages"
  ON public.team_messages
  FOR INSERT
  WITH CHECK (
    auth.uid() = author_id AND (
      (team_id IS NOT NULL AND (
        team_id IN (SELECT team_id FROM public.team_players WHERE player_id = auth.uid()) OR
        team_id IN (SELECT id FROM public.teams WHERE coach_id = auth.uid())
      )) OR
      (coach_id IS NOT NULL AND coach_id = auth.uid())
    )
  );

-- Users can update/delete their own messages
CREATE POLICY "Users can manage their own messages"
  ON public.team_messages
  FOR ALL
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- Message Reactions Policies
CREATE POLICY "Users can manage their reactions"
  ON public.message_reactions
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view all reactions"
  ON public.message_reactions
  FOR SELECT
  USING (true);

-- Comments
COMMENT ON TABLE public.announcements IS 'Announcements and updates from coaches to players';
COMMENT ON TABLE public.announcement_reads IS 'Tracks which players have read which announcements';
COMMENT ON TABLE public.team_messages IS 'Team message board for communication';
COMMENT ON TABLE public.message_reactions IS 'Reactions to team messages';

COMMENT ON COLUMN public.announcements.priority IS 'Priority level: low, normal, high, urgent';
COMMENT ON COLUMN public.announcements.target_audience IS 'Who can see this: all, team, individual';
COMMENT ON COLUMN public.announcements.is_pinned IS 'Whether announcement is pinned to top';
COMMENT ON COLUMN public.team_messages.is_coach_only IS 'Whether message is only for coaches';
