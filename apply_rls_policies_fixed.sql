-- Drop existing policies if any (to avoid conflicts)
DROP POLICY IF EXISTS "Coaches can view their own player relationships" ON public.coach_players;
DROP POLICY IF EXISTS "Players can view their own coach relationships" ON public.coach_players;
DROP POLICY IF EXISTS "Coaches can invite players" ON public.coach_players;
DROP POLICY IF EXISTS "Coaches can update their player relationships" ON public.coach_players;
DROP POLICY IF EXISTS "Players can accept/decline invitations" ON public.coach_players;
DROP POLICY IF EXISTS "Coaches can remove players" ON public.coach_players;

DROP POLICY IF EXISTS "Coaches can view their own drills" ON public.drills;
DROP POLICY IF EXISTS "Coaches can create drills" ON public.drills;
DROP POLICY IF EXISTS "Coaches can update their own drills" ON public.drills;
DROP POLICY IF EXISTS "Coaches can delete their own drills" ON public.drills;
DROP POLICY IF EXISTS "Players can view drills in assigned practices" ON public.drills;

DROP POLICY IF EXISTS "Coaches can view their own practices" ON public.practices;
DROP POLICY IF EXISTS "Coaches can create practices" ON public.practices;
DROP POLICY IF EXISTS "Coaches can update their own practices" ON public.practices;
DROP POLICY IF EXISTS "Coaches can delete their own practices" ON public.practices;
DROP POLICY IF EXISTS "Players can view assigned practices" ON public.practices;

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

-- RLS Policies for practices
CREATE POLICY "Coaches can view their own practices" ON public.practices FOR SELECT USING (auth.uid() = coach_id);
CREATE POLICY "Coaches can create practices" ON public.practices FOR INSERT WITH CHECK (auth.uid() = coach_id);
CREATE POLICY "Coaches can update their own practices" ON public.practices FOR UPDATE USING (auth.uid() = coach_id);
CREATE POLICY "Coaches can delete their own practices" ON public.practices FOR DELETE USING (auth.uid() = coach_id);

-- RLS Policies for practice_drills
CREATE POLICY "Coaches can manage practice drills" ON public.practice_drills FOR ALL USING (EXISTS (SELECT 1 FROM public.practices WHERE practices.id = practice_drills.practice_id AND practices.coach_id = auth.uid()));

-- RLS Policies for practice_players
CREATE POLICY "Coaches can manage practice players" ON public.practice_players FOR ALL USING (EXISTS (SELECT 1 FROM public.practices WHERE practices.id = practice_players.practice_id AND practices.coach_id = auth.uid()));
CREATE POLICY "Players can view their own practice assignments" ON public.practice_players FOR SELECT USING (auth.uid() = player_id);
