-- ============================================================================
-- PRACTICE PLANS SYSTEM - Database Schema
-- ============================================================================
-- Version: 1.0
-- Date: 2026-01-12
-- Description: Comprehensive practice plan templates with sharing capabilities
-- ============================================================================

-- Practice Plan Categories (predefined or custom)
CREATE TABLE IF NOT EXISTS public.practice_plan_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT, -- hex color for UI display
  icon TEXT, -- icon name from lucide-react
  is_system BOOLEAN DEFAULT FALSE, -- system categories can't be deleted
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Practice Plans (Templates)
CREATE TABLE IF NOT EXISTS public.practice_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Basic Info
  title TEXT NOT NULL,
  description TEXT,
  
  -- Metadata
  category_id UUID REFERENCES public.practice_plan_categories(id) ON DELETE SET NULL,
  tags TEXT[] DEFAULT '{}', -- array of tags for search/filter
  
  -- Target Audience
  age_group TEXT, -- e.g., "U10", "U12", "U14", "U16", "Adult"
  skill_level TEXT, -- "beginner", "intermediate", "advanced", "elite"
  team_size_min INTEGER, -- minimum players needed
  team_size_max INTEGER, -- maximum players recommended
  
  -- Duration & Structure
  total_duration_minutes INTEGER,
  
  -- Objectives & Notes
  objectives TEXT[], -- array of learning objectives
  equipment_needed TEXT[], -- array of equipment
  coaching_notes TEXT, -- private notes for the coach
  safety_notes TEXT, -- safety considerations
  
  -- Organization
  folder_path TEXT, -- forward slash separated path like "Offensive/Shooting/Drills"
  
  -- Sharing
  is_public BOOLEAN DEFAULT FALSE, -- if true, visible to all coaches
  is_template BOOLEAN DEFAULT TRUE, -- if false, it's a saved practice
  
  -- Usage Stats
  times_used INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Practice Plan Sections (warmup, main drills, cooldown, etc.)
CREATE TABLE IF NOT EXISTS public.practice_plan_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.practice_plans(id) ON DELETE CASCADE,
  
  title TEXT NOT NULL, -- e.g., "Warm-up", "Main Drills", "Scrimmage", "Cool-down"
  description TEXT,
  duration_minutes INTEGER,
  order_index INTEGER NOT NULL, -- order of sections in the plan
  
  -- Optional styling
  color TEXT, -- hex color for UI
  icon TEXT, -- icon name
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Drills within Plan Sections
CREATE TABLE IF NOT EXISTS public.practice_plan_drills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES public.practice_plan_sections(id) ON DELETE CASCADE,
  drill_id UUID REFERENCES public.drills(id) ON DELETE SET NULL, -- can reference existing drill or be standalone
  
  -- If not referencing existing drill, store custom drill info
  custom_title TEXT,
  custom_description TEXT,
  custom_instructions TEXT,
  
  duration_minutes INTEGER,
  order_index INTEGER NOT NULL, -- order within the section
  
  -- Drill-specific notes
  coaching_points TEXT,
  variations TEXT, -- different ways to run the drill
  
  -- Player organization
  player_count_min INTEGER,
  player_count_max INTEGER,
  groups_count INTEGER, -- how many groups to split into
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Practice Plan Sharing (who can access this plan)
CREATE TABLE IF NOT EXISTS public.practice_plan_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.practice_plans(id) ON DELETE CASCADE,
  shared_with_coach_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  shared_by_coach_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  permission TEXT DEFAULT 'view' NOT NULL CHECK (permission IN ('view', 'copy', 'edit')),
  -- view: can see the plan
  -- copy: can duplicate and modify their own copy
  -- edit: can directly edit the original plan
  
  shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  last_accessed_at TIMESTAMP WITH TIME ZONE,
  
  UNIQUE(plan_id, shared_with_coach_id)
);

-- Practice Plan Favorites
CREATE TABLE IF NOT EXISTS public.practice_plan_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.practice_plans(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  UNIQUE(plan_id, coach_id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_practice_plans_coach_id ON public.practice_plans(coach_id);
CREATE INDEX IF NOT EXISTS idx_practice_plans_category_id ON public.practice_plans(category_id);
CREATE INDEX IF NOT EXISTS idx_practice_plans_is_public ON public.practice_plans(is_public);
CREATE INDEX IF NOT EXISTS idx_practice_plans_tags ON public.practice_plans USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_practice_plans_folder_path ON public.practice_plans(folder_path);

CREATE INDEX IF NOT EXISTS idx_practice_plan_sections_plan_id ON public.practice_plan_sections(plan_id);
CREATE INDEX IF NOT EXISTS idx_practice_plan_drills_section_id ON public.practice_plan_drills(section_id);
CREATE INDEX IF NOT EXISTS idx_practice_plan_drills_drill_id ON public.practice_plan_drills(drill_id);

CREATE INDEX IF NOT EXISTS idx_practice_plan_shares_plan_id ON public.practice_plan_shares(plan_id);
CREATE INDEX IF NOT EXISTS idx_practice_plan_shares_coach_id ON public.practice_plan_shares(shared_with_coach_id);

CREATE INDEX IF NOT EXISTS idx_practice_plan_favorites_coach_id ON public.practice_plan_favorites(coach_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.practice_plan_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_plan_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_plan_drills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_plan_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_plan_favorites ENABLE ROW LEVEL SECURITY;

-- Categories: Coaches can manage their own categories
CREATE POLICY "Coaches can manage their own categories" ON public.practice_plan_categories
FOR ALL USING (auth.uid() = coach_id OR is_system = true) WITH CHECK (auth.uid() = coach_id);

-- Practice Plans: Coaches can see their own plans, public plans, and shared plans
CREATE POLICY "Coaches can view their own plans" ON public.practice_plans
FOR SELECT USING (
  auth.uid() = coach_id OR
  is_public = true OR
  EXISTS (
    SELECT 1 FROM public.practice_plan_shares 
    WHERE practice_plan_shares.plan_id = practice_plans.id 
    AND practice_plan_shares.shared_with_coach_id = auth.uid()
  )
);

CREATE POLICY "Coaches can create their own plans" ON public.practice_plans
FOR INSERT WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Coaches can update their own plans" ON public.practice_plans
FOR UPDATE USING (
  auth.uid() = coach_id OR
  EXISTS (
    SELECT 1 FROM public.practice_plan_shares 
    WHERE practice_plan_shares.plan_id = practice_plans.id 
    AND practice_plan_shares.shared_with_coach_id = auth.uid()
    AND practice_plan_shares.permission = 'edit'
  )
) WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Coaches can delete their own plans" ON public.practice_plans
FOR DELETE USING (auth.uid() = coach_id);

-- Sections: Can access if can access the plan
CREATE POLICY "Coaches can view plan sections" ON public.practice_plan_sections
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.practice_plans
    WHERE practice_plans.id = practice_plan_sections.plan_id
    AND (
      practice_plans.coach_id = auth.uid() OR
      practice_plans.is_public = true OR
      EXISTS (
        SELECT 1 FROM public.practice_plan_shares 
        WHERE practice_plan_shares.plan_id = practice_plans.id 
        AND practice_plan_shares.shared_with_coach_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "Coaches can manage sections of their plans" ON public.practice_plan_sections
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.practice_plans
    WHERE practice_plans.id = practice_plan_sections.plan_id
    AND practice_plans.coach_id = auth.uid()
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.practice_plans
    WHERE practice_plans.id = practice_plan_sections.plan_id
    AND practice_plans.coach_id = auth.uid()
  )
);

-- Drills: Can access if can access the section
CREATE POLICY "Coaches can view plan drills" ON public.practice_plan_drills
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.practice_plan_sections
    JOIN public.practice_plans ON practice_plans.id = practice_plan_sections.plan_id
    WHERE practice_plan_sections.id = practice_plan_drills.section_id
    AND (
      practice_plans.coach_id = auth.uid() OR
      practice_plans.is_public = true OR
      EXISTS (
        SELECT 1 FROM public.practice_plan_shares 
        WHERE practice_plan_shares.plan_id = practice_plans.id 
        AND practice_plan_shares.shared_with_coach_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "Coaches can manage drills in their plans" ON public.practice_plan_drills
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.practice_plan_sections
    JOIN public.practice_plans ON practice_plans.id = practice_plan_sections.plan_id
    WHERE practice_plan_sections.id = practice_plan_drills.section_id
    AND practice_plans.coach_id = auth.uid()
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.practice_plan_sections
    JOIN public.practice_plans ON practice_plans.id = practice_plan_sections.plan_id
    WHERE practice_plan_sections.id = practice_plan_drills.section_id
    AND practice_plans.coach_id = auth.uid()
  )
);

-- Shares: Coaches can manage who they share with
CREATE POLICY "Coaches can view shares of their plans" ON public.practice_plan_shares
FOR SELECT USING (
  auth.uid() = shared_by_coach_id OR 
  auth.uid() = shared_with_coach_id
);

CREATE POLICY "Coaches can create shares for their plans" ON public.practice_plan_shares
FOR INSERT WITH CHECK (
  auth.uid() = shared_by_coach_id AND
  EXISTS (
    SELECT 1 FROM public.practice_plans
    WHERE practice_plans.id = practice_plan_shares.plan_id
    AND practice_plans.coach_id = auth.uid()
  )
);

CREATE POLICY "Coaches can delete shares of their plans" ON public.practice_plan_shares
FOR DELETE USING (auth.uid() = shared_by_coach_id);

-- Favorites: Coaches can manage their own favorites
CREATE POLICY "Coaches can manage their own favorites" ON public.practice_plan_favorites
FOR ALL USING (auth.uid() = coach_id) WITH CHECK (auth.uid() = coach_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_practice_plan_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_practice_plans_modtime
BEFORE UPDATE ON public.practice_plans
FOR EACH ROW
EXECUTE FUNCTION update_practice_plan_updated_at();

CREATE TRIGGER update_practice_plan_categories_modtime
BEFORE UPDATE ON public.practice_plan_categories
FOR EACH ROW
EXECUTE FUNCTION update_practice_plan_updated_at();

CREATE TRIGGER update_practice_plan_sections_modtime
BEFORE UPDATE ON public.practice_plan_sections
FOR EACH ROW
EXECUTE FUNCTION update_practice_plan_updated_at();

CREATE TRIGGER update_practice_plan_drills_modtime
BEFORE UPDATE ON public.practice_plan_drills
FOR EACH ROW
EXECUTE FUNCTION update_practice_plan_updated_at();

-- ============================================================================
-- SEED DATA - System Categories
-- ============================================================================

INSERT INTO public.practice_plan_categories (coach_id, name, description, color, icon, is_system)
SELECT 
  (SELECT id FROM public.profiles WHERE role = 'coach' LIMIT 1),
  'Offensive Skills',
  'Plans focused on offensive techniques and strategies',
  '#3b82f6',
  'Target',
  true
WHERE NOT EXISTS (SELECT 1 FROM public.practice_plan_categories WHERE name = 'Offensive Skills' AND is_system = true);

INSERT INTO public.practice_plan_categories (coach_id, name, description, color, icon, is_system)
SELECT 
  (SELECT id FROM public.profiles WHERE role = 'coach' LIMIT 1),
  'Defensive Skills',
  'Plans focused on defensive techniques and strategies',
  '#ef4444',
  'Shield',
  true
WHERE NOT EXISTS (SELECT 1 FROM public.practice_plan_categories WHERE name = 'Defensive Skills' AND is_system = true);

INSERT INTO public.practice_plan_categories (coach_id, name, description, color, icon, is_system)
SELECT 
  (SELECT id FROM public.profiles WHERE role = 'coach' LIMIT 1),
  'Conditioning',
  'Fitness and conditioning focused plans',
  '#10b981',
  'Activity',
  true
WHERE NOT EXISTS (SELECT 1 FROM public.practice_plan_categories WHERE name = 'Conditioning' AND is_system = true);

INSERT INTO public.practice_plan_categories (coach_id, name, description, color, icon, is_system)
SELECT 
  (SELECT id FROM public.profiles WHERE role = 'coach' LIMIT 1),
  'Team Building',
  'Plans focused on teamwork and communication',
  '#8b5cf6',
  'Users',
  true
WHERE NOT EXISTS (SELECT 1 FROM public.practice_plan_categories WHERE name = 'Team Building' AND is_system = true);

INSERT INTO public.practice_plan_categories (coach_id, name, description, color, icon, is_system)
SELECT 
  (SELECT id FROM public.profiles WHERE role = 'coach' LIMIT 1),
  'Game Prep',
  'Pre-game preparation and strategy plans',
  '#f59e0b',
  'Flag',
  true
WHERE NOT EXISTS (SELECT 1 FROM public.practice_plan_categories WHERE name = 'Game Prep' AND is_system = true);
