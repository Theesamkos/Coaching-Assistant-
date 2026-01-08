# Player Management System - Migration Instructions

## 🚀 Quick Start

### Step 1: Run Database Migration

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. Click on "SQL Editor" in the left sidebar
4. Click "New Query"
5. Copy the entire contents of `supabase-player-management-migration.sql`
6. Paste into the SQL Editor
7. Click "Run" (or press CMD/CTRL + Enter)
8. Wait for completion (should take ~5-10 seconds)

### Step 2: Verify Migration

Run this verification query in the SQL Editor:

```sql
-- Check new tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('teams', 'team_players', 'coach_notes', 'player_statistics')
ORDER BY table_name;

-- Should return 4 rows: coach_notes, player_statistics, team_players, teams
```

Check new columns in profiles:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
AND column_name IN ('phone', 'date_of_birth', 'jersey_number', 'privacy_settings')
ORDER BY column_name;

-- Should return 4 rows
```

### Step 3: Set Up Storage (Optional - for later)

For profile photos and team photos, we'll need to set up Supabase Storage buckets:

1. Go to "Storage" in Supabase dashboard
2. Create a new bucket called `profile-photos`
3. Set it to **Public** (or configure RLS policies)
4. Create another bucket called `team-photos`
5. Set it to **Public**

**Note:** We'll implement photo upload functionality after core features are working.

---

## 🧪 Testing Plan

### Phase 1: Database Testing (Manual)

**Test 1: Create Enhanced Player Profile**
```sql
-- Insert a test player with enhanced fields
INSERT INTO public.profiles (
  id, email, display_name, role, phone, date_of_birth, 
  position, jersey_number, shoots, privacy_settings
) VALUES (
  gen_random_uuid(),
  'testplayer@example.com',
  'Test Player',
  'player',
  '555-1234',
  '2005-03-15',
  'Center',
  91,
  'left',
  '{"hide_phone": false, "hide_email": false, "hide_address": false, "hide_social": false, "hide_age": false, "hide_stats": false}'::jsonb
);
```

**Test 2: Create Team**
```sql
-- Insert a test team (replace YOUR_COACH_ID with your actual coach user ID)
INSERT INTO public.teams (coach_id, name, description, season)
VALUES ('YOUR_COACH_ID', 'Test Team', 'Testing team functionality', '2025-2026');
```

**Test 3: Add Player to Team**
```sql
-- Link player to team (replace IDs with actual IDs from previous inserts)
INSERT INTO public.team_players (team_id, player_id)
VALUES ('TEAM_ID', 'PLAYER_ID');
```

**Test 4: Create Coach Note**
```sql
-- Create a note (replace IDs with actual IDs)
INSERT INTO public.coach_notes (
  coach_id, player_id, note_type, content, tags, is_visible_to_player
) VALUES (
  'YOUR_COACH_ID',
  'PLAYER_ID',
  'performance',
  'Great improvement in skating this week!',
  ARRAY['skating', 'progress', 'positive'],
  true
);
```

**Test 5: Add Player Statistics**
```sql
-- Add practice stats (replace IDs with actual IDs)
INSERT INTO public.player_statistics (
  player_id, coach_id, stat_date, stat_type, 
  attendance_status, drills_completed, practice_rating,
  skill_ratings
) VALUES (
  'PLAYER_ID',
  'YOUR_COACH_ID',
  '2025-01-07',
  'practice',
  'present',
  8,
  4,
  '{"skating": 4, "shooting": 3, "passing": 5}'::jsonb
);
```

### Phase 2: Service Layer Testing

After migration is successful, we'll test the TypeScript services:

1. **Player Management Service**
   - ✅ Get player profile
   - ✅ Update player profile
   - ✅ Get coach players with filters
   - ✅ Privacy settings

2. **Team Service**
   - ✅ Create team
   - ✅ Get coach teams
   - ✅ Add/remove players
   - ✅ Get team roster

3. **Note Service**
   - ✅ Create note
   - ✅ Get player notes
   - ✅ Filter by tags/type
   - ✅ Toggle visibility

4. **Statistics Service**
   - ✅ Create statistics
   - ✅ Get player statistics
   - ✅ Get aggregates
   - ✅ Filter by date range

### Phase 3: UI Component Testing

Once services are validated, we'll build and test:

1. **Player List Page**
   - Grid/table views
   - Filters & search
   - Pagination

2. **Player Detail Page**
   - Tabbed interface (Profile, Stats, Notes, Teams)
   - Edit functionality
   - Photo upload

3. **Invitation System**
   - Generate link
   - Copy to clipboard
   - Accept/decline flow

4. **Team Management**
   - Create/edit teams
   - Roster management
   - Bulk actions

5. **Notes Interface**
   - Create/edit notes
   - Tag management
   - Visibility toggle

6. **Statistics Dashboard**
   - Entry forms
   - Charts/graphs
   - Aggregated views

---

## 📋 Migration Checklist

Before running migration:
- [ ] Backup your database (Supabase does this automatically, but good to verify)
- [ ] Review the migration SQL file
- [ ] Ensure you're in the correct project

After running migration:
- [ ] Run verification queries
- [ ] Check for any errors in SQL editor
- [ ] Test RLS policies (try accessing data as different users)
- [ ] Verify triggers are working (update a profile, check updated_at)

---

## 🐛 Troubleshooting

### Error: "relation already exists"
This means some tables/columns already exist. Safe to ignore if it's expected.

### Error: "permission denied"
Check your RLS policies. You may need to temporarily disable RLS for testing:
```sql
ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;
-- Run your test
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
```

### Error: "column does not exist"
The migration might not have fully completed. Re-run the migration SQL.

### Can't see data in UI
Check RLS policies. Make sure your user ID matches the `coach_id` or `player_id` in the data.

---

## ✅ Success Indicators

You'll know the migration was successful when:

1. All 4 verification queries return expected results
2. You can manually insert test data without errors
3. Updated_at triggers work automatically
4. RLS policies properly restrict access
5. Privacy settings JSON field works correctly

---

## 🆘 Need Help?

If you encounter issues:

1. **Check Supabase logs**: Dashboard → Database → Logs
2. **Review error messages**: SQL Editor shows detailed errors
3. **Test individual tables**: Try inserting/selecting from each new table
4. **Check RLS**: Temporarily disable to isolate permission issues

---

**Ready to proceed?** 

Once you've run the migration and verified it's successful, we can start testing the service layer and building the UI!

