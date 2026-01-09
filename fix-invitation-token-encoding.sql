-- Fix invitation token encoding to be URL-safe
-- This replaces the standard base64 characters that cause routing issues

CREATE OR REPLACE FUNCTION generate_invitation_token()
RETURNS TEXT AS $$
BEGIN
  -- Use base64 encoding and make it URL-safe by replacing / with _ and + with -
  -- Also remove the = padding which isn't needed
  RETURN REPLACE(REPLACE(TRIM(TRAILING '=' FROM encode(gen_random_bytes(32), 'base64')), '+', '-'), '/', '_');
END;
$$ LANGUAGE plpgsql;

-- Optional: Update existing tokens to be URL-safe
-- WARNING: This will break existing invitation links!
-- Only run this if you're okay with regenerating all pending invitations

/*
UPDATE public.coach_players
SET invitation_token = REPLACE(REPLACE(TRIM(TRAILING '=' FROM invitation_token), '+', '-'), '/', '_')
WHERE status = 'pending' AND invitation_token IS NOT NULL;
*/

-- Verification: Generate a sample token to test
-- SELECT generate_invitation_token();
