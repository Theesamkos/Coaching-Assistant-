# Phase 1A: Foundation + Data Structure - Implementation Plan

**Goal:** Build coach dashboard, player management, and basic drill/practice systems with AI-ready data architecture.

---

## Database Schema Design

### New Tables to Create

#### 1. **coach_players** (Junction Table)
Maps coaches to their players with invitation status.
```sql
- id (UUID, primary key)
- coach_id (UUID, references profiles.id)
- player_id (UUID, references profiles.id)
- invitation_token (TEXT, unique)
- status ('pending' | 'accepted' | 'declined')
- invited_at (TIMESTAMP)
- accepted_at (TIMESTAMP, nullable)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### 2. **drills**
Store practice drills created by coaches.
```sql
- id (UUID, primary key)
- coach_id (UUID, references profiles.id)
- title (TEXT, required)
- description (TEXT)
- category (TEXT) // 'skating', 'shooting', 'passing', etc.
- duration_minutes (INTEGER)
- difficulty ('beginner' | 'intermediate' | 'advanced')
- objectives (TEXT[]) // Array of learning objectives
- equipment_needed (TEXT[])
- instructions (TEXT) // Step-by-step instructions for AI
- video_url (TEXT, nullable)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### 3. **practices**
Scheduled practice sessions.
```sql
- id (UUID, primary key)
- coach_id (UUID, references profiles.id)
- title (TEXT, required)
- description (TEXT)
- scheduled_date (TIMESTAMP, required)
- duration_minutes (INTEGER)
- location (TEXT)
- notes (TEXT) // Coach's notes for AI context
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### 4. **practice_drills** (Junction Table)
Links drills to practices.
```sql
- id (UUID, primary key)
- practice_id (UUID, references practices.id)
- drill_id (UUID, references drills.id)
- order_index (INTEGER) // Order of drills in practice
- custom_notes (TEXT) // Practice-specific notes
- created_at (TIMESTAMP)
```

#### 5. **practice_players** (Junction Table)
Links players to practices (who should attend).
```sql
- id (UUID, primary key)
- practice_id (UUID, references practices.id)
- player_id (UUID, references profiles.id)
- attendance_status ('invited' | 'confirmed' | 'attended' | 'missed')
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### RLS Policies for New Tables

Each table needs:
- Coaches can CRUD their own data
- Players can READ practices/drills assigned to them
- Players can UPDATE their attendance status

---

## Features to Implement

### 1. Coach Dashboard (`/dashboard`)

**Components:**
- `CoachDashboard.tsx` - Main dashboard layout
- `PlayerList.tsx` - List of coach's players
- `UpcomingPractices.tsx` - Next practices widget
- `QuickStats.tsx` - Player count, upcoming practices count

**Features:**
- View all players (with status: active, pending invitation)
- View upcoming practices
- Quick access to create drill/practice
- Navigation to all major sections

### 2. Player Management

**Routes:**
- `/players` - All players list
- `/players/:id` - Player detail page
- `/players/invite` - Invite new player form

**Components:**
- `PlayerListPage.tsx` - Full player list with filters
- `PlayerDetailPage.tsx` - Individual player view
- `InvitePlayerForm.tsx` - Send invitation form
- `PlayerCard.tsx` - Reusable player card component

**Features:**
- Send invitation by email
- Generate unique invitation tokens
- Email contains link: `/invite/accept/:token`
- View invitation status (pending/accepted)
- Remove players from roster

### 3. Invitation System

**Routes:**
- `/invite/accept/:token` - Accept invitation page

**Components:**
- `AcceptInvitationPage.tsx` - Player accepts invitation

**Features:**
- Player clicks invitation link
- If not logged in → redirect to login/register with token in URL
- After login → automatically accept invitation
- Link coach and player in database
- Redirect to player dashboard

### 4. Drill Library

**Routes:**
- `/drills` - All drills list
- `/drills/new` - Create drill form
- `/drills/:id` - Drill detail/edit

**Components:**
- `DrillLibraryPage.tsx` - List all drills
- `DrillForm.tsx` - Create/edit drill
- `DrillCard.tsx` - Drill preview card
- `DrillDetailPage.tsx` - Full drill view

**Features:**
- Create drills with rich details (for AI context)
- Categorize drills
- Add objectives and instructions
- Search/filter drills
- Mark drills as favorites

### 5. Practice Scheduler (Basic)

**Routes:**
- `/practices` - All practices list
- `/practices/new` - Create practice form
- `/practices/:id` - Practice detail/edit

**Components:**
- `PracticeListPage.tsx` - Calendar/list view
- `PracticeForm.tsx` - Create/edit practice
- `PracticeDetailPage.tsx` - Full practice view
- `DrillSelector.tsx` - Add drills to practice

**Features:**
- Schedule practice with date/time/location
- Add multiple drills to practice
- Assign players to practice
- Add coach notes (AI will use these)
- View/edit upcoming practices

---

## API/Service Layer

### New Services

#### `player.service.ts`
```typescript
- getCoachPlayers(coachId) - Get all players for a coach
- invitePlayer(coachId, email, message) - Send invitation
- acceptInvitation(token, playerId) - Accept invitation
- removePlayer(coachId, playerId) - Remove player from roster
- getPlayerCoaches(playerId) - Get coaches for a player
```

#### `drill.service.ts`
```typescript
- createDrill(coachId, drillData)
- getDrills(coachId, filters?)
- getDrill(drillId)
- updateDrill(drillId, updates)
- deleteDrill(drillId)
```

#### `practice.service.ts`
```typescript
- createPractice(coachId, practiceData)
- getPractices(coachId, dateRange?)
- getPractice(practiceId)
- updatePractice(practiceId, updates)
- deletePractice(practiceId)
- addDrillToPractice(practiceId, drillId, order)
- assignPlayersToPractice(practiceId, playerIds)
```

---

## Implementation Order

### Week 1 - Days 1-2: Database & Auth
1. Create Supabase SQL migration with all tables
2. Set up RLS policies
3. Test policies with example data
4. Update TypeScript types

### Week 1 - Days 3-4: Player Management
1. Create player.service.ts
2. Build InvitePlayerForm component
3. Build PlayerListPage
4. Build AcceptInvitationPage
5. Test full invitation flow

### Week 1 - Days 5-7: Coach Dashboard
1. Create CoachDashboard page
2. Build dashboard widgets
3. Add navigation
4. Test with multiple players

### Week 2 - Days 1-3: Drill Library
1. Create drill.service.ts
2. Build DrillForm component
3. Build DrillLibraryPage
4. Add drill search/filter
5. Test drill CRUD operations

### Week 2 - Days 4-7: Practice Scheduler
1. Create practice.service.ts
2. Build PracticeForm component
3. Build PracticeListPage
4. Add drill selector to practices
5. Add player assignment to practices
6. Test full practice creation flow

---

## AI Preparation

These data structures are designed to give AI agents rich context:

**For AI Agent to access:**
- Player's upcoming practices (dates, locations)
- Drills in each practice (titles, descriptions, objectives)
- Coach's custom notes and instructions
- Drill difficulty levels and prerequisites
- Equipment needed for each practice

**Data design decisions for AI:**
- Rich text fields for instructions (AI can parse)
- Objective arrays (AI can explain each goal)
- Coach notes field (AI uses as context)
- Structured drill categories (AI can group/suggest)

---

## UI/UX Considerations

### Coach Views
- Dashboard should be information-dense
- Quick actions prominently displayed
- Calendar view for practices
- Drag-and-drop for drill ordering

### Player Views (Future)
- Simple, focused interface
- Upcoming practice highlighted
- AI chat widget accessible
- Easy attendance confirmation

---

## Success Criteria

✅ Coach can invite players by email  
✅ Players can accept invitations  
✅ Coach dashboard shows all players  
✅ Coach can create and manage drills  
✅ Coach can schedule practices with drills  
✅ Coach can assign players to practices  
✅ All data is structured for AI consumption  
✅ RLS policies properly secure all data  

---

## Next Steps After Phase 1A

Once foundation is complete:
1. Build Player Dashboard
2. Implement AI Agent (using practice/drill data)
3. Add coach review of AI conversations
4. Enhance with performance tracking

---

**Ready to start implementing?** We'll begin with the database schema and RLS policies.

