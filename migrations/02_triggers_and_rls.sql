-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_drills_updated_at BEFORE UPDATE ON public.drills FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_practice_sessions_updated_at BEFORE UPDATE ON public.practice_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_drill_completions_updated_at BEFORE UPDATE ON public.drill_completions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_conversations_updated_at BEFORE UPDATE ON public.ai_conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON public.goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
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
