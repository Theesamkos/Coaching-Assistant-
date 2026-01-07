-- RLS Policies for profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Coaches can view player profiles" ON public.profiles;

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Coaches can view player profiles" ON public.profiles FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.coach_players 
    WHERE coach_players.coach_id = auth.uid() 
    AND coach_players.player_id = profiles.id
  )
);

-- RLS Policies for practice_sessions
DROP POLICY IF EXISTS "Coaches can manage their own practice sessions" ON public.practice_sessions;
DROP POLICY IF EXISTS "Players can view their assigned practice sessions" ON public.practice_sessions;

CREATE POLICY "Coaches can manage their own practice sessions" ON public.practice_sessions FOR ALL USING (auth.uid() = coach_id);
CREATE POLICY "Players can view their assigned practice sessions" ON public.practice_sessions FOR SELECT USING (auth.uid() = player_id);

-- RLS Policies for drill_completions
DROP POLICY IF EXISTS "Players can manage their own drill completions" ON public.drill_completions;
DROP POLICY IF EXISTS "Coaches can view their players drill completions" ON public.drill_completions;

CREATE POLICY "Players can manage their own drill completions" ON public.drill_completions FOR ALL USING (auth.uid() = player_id);
CREATE POLICY "Coaches can view their players drill completions" ON public.drill_completions FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.practice_sessions ps 
    WHERE ps.id = drill_completions.session_id 
    AND ps.coach_id = auth.uid()
  )
);

-- RLS Policies for session_drills
DROP POLICY IF EXISTS "Coaches can manage session drills" ON public.session_drills;
DROP POLICY IF EXISTS "Players can view session drills" ON public.session_drills;

CREATE POLICY "Coaches can manage session drills" ON public.session_drills FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.practice_sessions ps 
    WHERE ps.id = session_drills.session_id 
    AND ps.coach_id = auth.uid()
  )
);
CREATE POLICY "Players can view session drills" ON public.session_drills FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.practice_sessions ps 
    WHERE ps.id = session_drills.session_id 
    AND ps.player_id = auth.uid()
  )
);

-- RLS Policies for invitations
DROP POLICY IF EXISTS "Coaches can manage their own invitations" ON public.invitations;
DROP POLICY IF EXISTS "Anyone can view invitations by token" ON public.invitations;

CREATE POLICY "Coaches can manage their own invitations" ON public.invitations FOR ALL USING (auth.uid() = coach_id);
CREATE POLICY "Anyone can view invitations by token" ON public.invitations FOR SELECT USING (true);

-- RLS Policies for goals
DROP POLICY IF EXISTS "Players can view their own goals" ON public.goals;
DROP POLICY IF EXISTS "Coaches can manage goals for their players" ON public.goals;

CREATE POLICY "Players can view their own goals" ON public.goals FOR SELECT USING (auth.uid() = player_id);
CREATE POLICY "Coaches can manage goals for their players" ON public.goals FOR ALL USING (auth.uid() = coach_id);

-- RLS Policies for messages
DROP POLICY IF EXISTS "Users can view their sent messages" ON public.messages;
DROP POLICY IF EXISTS "Users can view their received messages" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update their received messages" ON public.messages;

CREATE POLICY "Users can view their sent messages" ON public.messages FOR SELECT USING (auth.uid() = sender_id);
CREATE POLICY "Users can view their received messages" ON public.messages FOR SELECT USING (auth.uid() = recipient_id);
CREATE POLICY "Users can send messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update their received messages" ON public.messages FOR UPDATE USING (auth.uid() = recipient_id);

-- RLS Policies for ai_conversations
DROP POLICY IF EXISTS "Players can manage their own AI conversations" ON public.ai_conversations;

CREATE POLICY "Players can manage their own AI conversations" ON public.ai_conversations FOR ALL USING (auth.uid() = player_id);

-- RLS Policies for ai_messages
DROP POLICY IF EXISTS "Players can manage their AI messages" ON public.ai_messages;

CREATE POLICY "Players can manage their AI messages" ON public.ai_messages FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.ai_conversations ac 
    WHERE ac.id = ai_messages.conversation_id 
    AND ac.player_id = auth.uid()
  )
);

-- RLS Policies for performance_metrics
DROP POLICY IF EXISTS "Players can view their own performance metrics" ON public.performance_metrics;
DROP POLICY IF EXISTS "Coaches can manage performance metrics" ON public.performance_metrics;

CREATE POLICY "Players can view their own performance metrics" ON public.performance_metrics FOR SELECT USING (auth.uid() = player_id);
CREATE POLICY "Coaches can manage performance metrics" ON public.performance_metrics FOR ALL USING (
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

-- RLS Policies for activity_logs
DROP POLICY IF EXISTS "Users can view their own activity logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Users can create their own activity logs" ON public.activity_logs;

CREATE POLICY "Users can view their own activity logs" ON public.activity_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own activity logs" ON public.activity_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
