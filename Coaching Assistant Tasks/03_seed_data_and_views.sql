-- Insert sample pre-built drills
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
)
ON CONFLICT DO NOTHING;

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
