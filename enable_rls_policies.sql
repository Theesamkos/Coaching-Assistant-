-- Enable RLS on all tables
ALTER TABLE public.coach_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_drills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_players ENABLE ROW LEVEL SECURITY;
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

-- RLS Policies for coach_players
CREATE POLICY "Coaches can view their own player relationships" ON public.coach_players FOR SELECT USING (auth.uid() = coach_id);
CREATE POLICY "Players can view their own coach relationships" ON public.coach_players FOR SELECT USING (auth.uid() = player_id);
CREATE POLICY "Coaches can invite players" ON public.coach_players FOR INSERT WITH CHECK (auth.uid() = coach_id);
CREATE POLICY "Coaches can update their player relationships" ON public.coach_players FOR UPDATE USING (auth.uid() = coach_id);
CREATE POLICY "Players can accept/decline invitations" ON public.coach_players FOR UPDATE USING (auth.uid() = player_id);
CREATE POLICY "Coaches can remove players" ON public.coach_players FOR DELETE USING (auth.uid() = coach_id);

-- RLS Policies for drills
CREATE POLICY "Coaches can view their own drills" ON public.drills FOR SELECT USING (auth.uid() = coach_id);
CREATE POLICY "Coaches can create drills" ON public.drills FOR INSERT WITH CHECK (auth.uid() = coach_id);
CREATE POLICY "Coaches can update their own drills" ON public.drills FOR UPDATE USING (auth.uid() = coach_id);
CREATE POLICY "Coaches can delete their own drills" ON public.drills FOR DELETE USING (auth.uid() = coach_id);
CREATE POLICY "Players can view drills in assigned practices" ON public.drills FOR SELECT USING (EXISTS (SELECT 1 FROM public.practice_drills pd JOIN public.practice_players pp ON pp.practice_id = pd.practice_id WHERE pd.drill_id = drills.id AND pp.player_id = auth.uid()));

-- RLS Policies for practices
CREATE POLICY "Coaches can view their own practices" ON public.practices FOR SELECT USING (auth.uid() = coach_id);
CREATE POLICY "Coaches can create practices" ON public.practices FOR INSERT WITH CHECK (auth.uid() = coach_id);
CREATE POLICY "Coaches can update their own practices" ON public.practices FOR UPDATE USING (auth.uid() = coach_id);
CREATE POLICY "Coaches can delete their own practices" ON public.practices FOR DELETE USING (auth.uid() = coach_id);
CREATE POLICY "Players can view assigned practices" ON public.practices FOR SELECT USING (EXISTS (SELECT 1 FROM public.practice_players WHERE practice_players.practice_id = practices.id AND practice_players.player_id = auth.uid()));

-- RLS Policies for practice_drills
CREATE POLICY "Coaches can manage practice drills" ON public.practice_drills FOR ALL USING (EXISTS (SELECT 1 FROM public.practices WHERE practices.id = practice_drills.practice_id AND practices.coach_id = auth.uid()));
CREATE POLICY "Players can view practice drills" ON public.practice_drills FOR SELECT USING (EXISTS (SELECT 1 FROM public.practice_players WHERE practice_players.practice_id = practice_drills.practice_id AND practice_players.player_id = auth.uid()));

-- RLS Policies for practice_players
CREATE POLICY "Coaches can manage practice players" ON public.practice_players FOR ALL USING (EXISTS (SELECT 1 FROM public.practices WHERE practices.id = practice_players.practice_id AND practices.coach_id = auth.uid()));
CREATE POLICY "Players can view their own practice assignments" ON public.practice_players FOR SELECT USING (auth.uid() = player_id);
CREATE POLICY "Players can update their attendance status" ON public.practice_players FOR UPDATE USING (auth.uid() = player_id) WITH CHECK (auth.uid() = player_id);

-- RLS Policies for practice_sessions
CREATE POLICY "Coaches can manage their own practice sessions" ON public.practice_sessions FOR ALL USING (auth.uid() = coach_id);
CREATE POLICY "Players can view their assigned practice sessions" ON public.practice_sessions FOR SELECT USING (auth.uid() = player_id);

-- RLS Policies for drill_completions
CREATE POLICY "Players can manage their own drill completions" ON public.drill_completions FOR ALL USING (auth.uid() = player_id);
CREATE POLICY "Coaches can view their players' drill completions" ON public.drill_completions FOR SELECT USING (EXISTS (SELECT 1 FROM public.practice_sessions ps WHERE ps.id = drill_completions.session_id AND ps.coach_id = auth.uid()));

-- RLS Policies for session_drills
CREATE POLICY "Coaches can manage session drills" ON public.session_drills FOR ALL USING (EXISTS (SELECT 1 FROM public.practice_sessions ps WHERE ps.id = session_drills.session_id AND ps.coach_id = auth.uid()));
CREATE POLICY "Players can view session drills" ON public.session_drills FOR SELECT USING (EXISTS (SELECT 1 FROM public.practice_sessions ps WHERE ps.id = session_drills.session_id AND ps.player_id = auth.uid()));

-- RLS Policies for invitations
CREATE POLICY "Coaches can manage their own invitations" ON public.invitations FOR ALL USING (auth.uid() = coach_id);
CREATE POLICY "Anyone can view invitations by token" ON public.invitations FOR SELECT USING (true);

-- RLS Policies for goals
CREATE POLICY "Players can view their own goals" ON public.goals FOR SELECT USING (auth.uid() = player_id);
CREATE POLICY "Coaches can manage goals for their players" ON public.goals FOR ALL USING (auth.uid() = coach_id);

-- RLS Policies for messages
CREATE POLICY "Users can view their sent messages" ON public.messages FOR SELECT USING (auth.uid() = sender_id);
CREATE POLICY "Users can view their received messages" ON public.messages FOR SELECT USING (auth.uid() = recipient_id);
CREATE POLICY "Users can send messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update their received messages" ON public.messages FOR UPDATE USING (auth.uid() = recipient_id);

-- RLS Policies for ai_conversations
CREATE POLICY "Players can manage their own AI conversations" ON public.ai_conversations FOR ALL USING (auth.uid() = player_id);

-- RLS Policies for ai_messages
CREATE POLICY "Players can manage their AI messages" ON public.ai_messages FOR ALL USING (EXISTS (SELECT 1 FROM public.ai_conversations ac WHERE ac.id = ai_messages.conversation_id AND ac.player_id = auth.uid()));

-- RLS Policies for performance_metrics
CREATE POLICY "Players can view their own performance metrics" ON public.performance_metrics FOR SELECT USING (auth.uid() = player_id);
CREATE POLICY "Coaches can manage performance metrics" ON public.performance_metrics FOR ALL USING (EXISTS (SELECT 1 FROM public.drill_completions dc WHERE dc.id = performance_metrics.drill_completion_id AND EXISTS (SELECT 1 FROM public.practice_sessions ps WHERE ps.id = dc.session_id AND ps.coach_id = auth.uid())));

-- RLS Policies for activity_logs
CREATE POLICY "Users can view their own activity logs" ON public.activity_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own activity logs" ON public.activity_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
