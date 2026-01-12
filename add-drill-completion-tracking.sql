-- Add drill completion tracking to practice_drills table
-- This allows coaches to mark drills as completed during practice

ALTER TABLE public.practice_drills
ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT FALSE NOT NULL;

-- Add updated_at column if it doesn't exist
ALTER TABLE public.practice_drills
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_practice_drills_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS practice_drills_updated_at ON public.practice_drills;
CREATE TRIGGER practice_drills_updated_at
  BEFORE UPDATE ON public.practice_drills
  FOR EACH ROW
  EXECUTE FUNCTION update_practice_drills_updated_at();

-- Add index for querying completed drills
CREATE INDEX IF NOT EXISTS idx_practice_drills_completed 
  ON public.practice_drills(practice_id, completed);

COMMENT ON COLUMN public.practice_drills.completed IS 'Whether the drill was completed during the practice';
