# Hockey Coach Assistant MVP - Development Task List

## Phase 1: Foundation (Hours 0-8)

**Progress Summary:**
- ✅ **1.1 Project Setup** - Complete (except Firebase console setup - user action required)
- ✅ **1.2 Firebase Configuration** - Complete (files created, deployment pending)
- ✅ **1.3 Authentication System** - Complete (except password strength indicator)
- ✅ **1.4 User Profile Setup** - Complete (except profile photo upload)
- ⏳ **1.5 Invitation System** - Not started
- ⏳ **1.6 Routing and Navigation** - Partial (routing done, layout components pending)
- ⏳ **1.7 Deployment Setup** - Partial (scripts done, Vercel setup pending)

### 1.1 Project Setup
- [x] Initialize React + Vite project
  - [x] Create new Vite project with React template
  - [x] Configure Vite config for optimal build settings
  - [x] Set up proper folder structure (components, pages, hooks, utils, services)
- [x] Install and configure Tailwind CSS
  - [x] Install Tailwind dependencies
  - [x] Configure tailwind.config.js
  - [x] Set up base styles in index.css
  - [x] Install shadcn/ui and configure components.json
- [ ] Set up Firebase project
  - [ ] Create Firebase project in console (User action required)
  - [ ] Enable Authentication, Firestore, and Storage (User action required)
  - [ ] Get Firebase config credentials (User action required)
  - [x] Create environment variables file (.env.local.example)
- [x] Install core dependencies
  - [x] Firebase SDK (firebase, @firebase/auth, @firebase/firestore, @firebase/storage)
  - [x] React Router DOM for navigation
  - [x] Date handling library (date-fns or dayjs)
  - [x] Form handling (react-hook-form)
  - [x] State management (zustand or context)
- [x] Create Firebase initialization file
  - [x] Set up firebase.js with config
  - [x] Initialize Auth, Firestore, Storage instances
  - [x] Export configured services
- [x] Set up Firestore security rules
  - [x] Write security rules for users collection
  - [x] Write security rules for coaches collection
  - [x] Write security rules for players collection
  - [x] Write security rules for completions collection
  - [x] Write security rules for messages collection
  - [ ] Deploy security rules to Firebase (User action required)
- [x] Set up Firebase Storage rules
  - [x] Configure rules for video uploads
  - [x] Configure rules for profile photos
  - [x] Set size limits and file type restrictions
- [x] Create Firestore indexes
  - [x] Index for scheduledSessions by playerId and date
  - [x] Index for messages by conversationId and timestamp
  - [x] Index for completions by playerId and completedAt

### 1.3 Authentication System
- [x] Build authentication service layer
  - [x] Create auth.service.js with login/logout/register functions
  - [x] Implement Google OAuth sign-in
  - [x] Implement email/password sign-in
  - [x] Implement email/password registration
  - [x] Add persistent session handling
  - [x] Create auth state listener
- [x] Create auth context/store
  - [x] Set up AuthContext with user state
  - [x] Create useAuth hook
  - [x] Handle loading and error states
  - [x] Implement auto-login on page load
- [x] Build authentication UI components
  - [x] Create Login page component
  - [x] Create Register page component
  - [x] Create role selection (Coach vs Player)
  - [x] Add Google OAuth button
  - [x] Add email/password form with validation
  - [ ] Create password strength indicator
  - [x] Add error message display
  - [x] Create "Forgot Password" flow

### 1.4 User Profile Setup
- [x] Create user profile data structure
  - [x] Define User interface/type
  - [x] Define Coach interface/type
  - [x] Define Player interface/type
- [x] Build user service layer
  - [x] Create user.service.js for Firestore operations
  - [x] Implement createUserProfile function
  - [x] Implement getUserProfile function
  - [x] Implement updateUserProfile function
- [x] Build profile UI components
  - [x] Create ProfileSetup component for first-time users
  - [ ] Create profile photo upload component
  - [x] Create display name input
  - [x] Create role-specific fields (organization for coaches, position for players)
  - [x] Add form validation
  - [x] Create profile completion wizard

### 1.5 Invitation System
- [ ] Create invitation data model
  - [ ] Define Invitation interface
  - [ ] Set up invitations collection in Firestore
- [ ] Build backend invitation logic (Cloud Functions)
  - [ ] Create Cloud Function to generate invitation tokens
  - [ ] Create Cloud Function to send invitation emails
  - [ ] Create Cloud Function to validate invitation tokens
  - [ ] Set up email templates using Firebase Extensions
- [ ] Build invitation UI for coaches
  - [ ] Create "Invite Player" button in coach dashboard
  - [ ] Create invitation modal/form
  - [ ] Add email input with validation
  - [ ] Display list of pending invitations
  - [ ] Add ability to resend or cancel invitations
- [ ] Build invitation acceptance flow
  - [ ] Create invitation landing page for players
  - [ ] Parse invitation token from URL
  - [ ] Validate token and show coach info
  - [ ] Auto-link player to coach upon registration
  - [ ] Handle expired or invalid tokens
  - [ ] Create success confirmation page

### 1.6 Routing and Navigation
- [x] Set up React Router
  - [x] Configure BrowserRouter
  - [x] Create route configuration
  - [x] Set up protected routes (require auth)
  - [x] Set up role-based routes (coach-only, player-only)
- [ ] Create layout components
  - [ ] Build main AppLayout component
  - [ ] Create header/navigation bar
  - [ ] Create sidebar for navigation
  - [ ] Add user profile dropdown
  - [ ] Implement logout functionality
  - [ ] Make responsive for mobile/tablet

### 1.7 Deployment Setup
- [ ] Set up Vercel project
  - [ ] Create Vercel account and project
  - [ ] Connect GitHub repository
  - [ ] Configure build settings
  - [ ] Add environment variables
  - [ ] Set up custom domain (optional)
- [x] Create deployment scripts
  - [x] Add build script to package.json
  - [x] Add preview deployment script
  - [ ] Configure CI/CD pipeline
- [ ] Deploy initial version
  - [ ] Run production build
  - [ ] Deploy to Vercel
  - [ ] Verify deployment works
  - [ ] Test authentication on deployed version

---

## Phase 2: Drill Management (Hours 8-14)

### 2.1 Drill Data Model
- [ ] Define drill data structures
  - [ ] Create Drill interface/type
  - [ ] Define drill categories enum
  - [ ] Define difficulty levels enum
  - [ ] Create PerformanceMetrics interface
- [ ] Set up drills collection in Firestore
  - [ ] Create collection structure
  - [ ] Add indexes for category and difficulty
  - [ ] Set up security rules for drills

### 2.2 Pre-built Drill Library
- [ ] Research and compile drill content
  - [ ] Find 5-7 shooting drills with videos
  - [ ] Find 5-7 skating drills with videos
  - [ ] Find 4-5 stickhandling drills with videos
  - [ ] Find 4-5 passing drills with videos
  - [ ] Find 3-5 defensive drills with videos
- [ ] Create drill seed data
  - [ ] Write JSON file with all drill data
  - [ ] Include titles, descriptions, key points
  - [ ] Add video links (YouTube/Vimeo)
  - [ ] Specify equipment and duration
  - [ ] Set difficulty levels
- [ ] Import drills to Firestore
  - [ ] Create seed script
  - [ ] Run import to populate database
  - [ ] Verify all drills imported correctly

### 2.3 Drill Service Layer
- [ ] Create drill.service.js
  - [ ] Implement getDrills function (with filters)
  - [ ] Implement getDrillById function
  - [ ] Implement createDrill function
  - [ ] Implement updateDrill function
  - [ ] Implement deleteDrill function
  - [ ] Add pagination support
  - [ ] Add search functionality

### 2.4 Drill Library UI
- [ ] Create DrillLibrary page component
  - [ ] Build grid/list layout for drills
  - [ ] Create DrillCard component
  - [ ] Display drill thumbnail, title, difficulty
  - [ ] Add category filter dropdown
  - [ ] Add difficulty filter
  - [ ] Add search bar
  - [ ] Implement pagination controls
- [ ] Create DrillDetail view
  - [ ] Display full drill information
  - [ ] Show video embeds (YouTube/Vimeo)
  - [ ] List equipment needed
  - [ ] Show key coaching points
  - [ ] Display duration and difficulty
  - [ ] Add "Assign to Player" button for coaches
  - [ ] Add "Ask AI" button for players

### 2.5 Custom Drill Creation
- [ ] Build CreateDrill form component
  - [ ] Create multi-step form wizard
  - [ ] Add title and description inputs
  - [ ] Add category selection
  - [ ] Add difficulty level selector
  - [ ] Add duration input
  - [ ] Create equipment multi-select
  - [ ] Add key points list builder
  - [ ] Create video URL input (multiple)
  - [ ] Add performance metrics configuration
  - [ ] Implement form validation
  - [ ] Add save draft functionality
- [ ] Create EditDrill component
  - [ ] Pre-populate form with existing data
  - [ ] Allow editing all fields
  - [ ] Show save/cancel buttons
  - [ ] Handle update confirmation

### 2.6 AI Drill Generator
- [ ] Set up Claude API integration
  - [ ] Create Anthropic API account and get key
  - [ ] Store API key in environment variables
  - [ ] Create Cloud Function for AI requests
  - [ ] Set up rate limiting
- [ ] Build AI drill generation service
  - [ ] Create drillAI.service.js
  - [ ] Write system prompt for drill generation
  - [ ] Implement generateDrill function
  - [ ] Parse AI response into drill structure
  - [ ] Handle API errors gracefully
  - [ ] Add retry logic for failures
- [ ] Create AI drill generation UI
  - [ ] Build "Generate with AI" modal
  - [ ] Add text input for drill description/goal
  - [ ] Add optional parameters (difficulty, duration)
  - [ ] Show loading state during generation
  - [ ] Display generated drill for review
  - [ ] Allow editing before saving
  - [ ] Add regenerate option
  - [ ] Create save to library button

### 2.7 Scheduling System Data Model
- [ ] Define scheduling data structures
  - [ ] Create ScheduledSession interface
  - [ ] Define session status enum
  - [ ] Define recurrence rule structure
- [ ] Set up scheduledSessions collection
  - [ ] Create collection structure
  - [ ] Add compound indexes
  - [ ] Set up security rules

### 2.8 Schedule Service Layer
- [ ] Create schedule.service.js
  - [ ] Implement scheduleSession function
  - [ ] Implement bulkScheduleSessions function
  - [ ] Implement getPlayerSchedule function
  - [ ] Implement getCoachSchedule function
  - [ ] Implement updateSession function
  - [ ] Implement deleteSession function
  - [ ] Implement recurring session logic
  - [ ] Add conflict detection

### 2.9 Calendar/Schedule UI
- [ ] Install and configure calendar library
  - [ ] Choose library (FullCalendar or react-big-calendar)
  - [ ] Install dependencies
  - [ ] Configure basic calendar view
- [ ] Build ScheduleView component for coaches
  - [ ] Display calendar with month/week/day views
  - [ ] Show scheduled sessions for all players
  - [ ] Color-code by player or drill type
  - [ ] Add player filter dropdown
  - [ ] Implement click to add session
  - [ ] Show session details on hover
- [ ] Create AssignDrill modal
  - [ ] Select player dropdown
  - [ ] Select drill from library
  - [ ] Choose date and time
  - [ ] Add recurring session option
  - [ ] Preview schedule before saving
  - [ ] Show confirmation message
- [ ] Build bulk assignment feature
  - [ ] Multi-select players
  - [ ] Assign same drill to all selected
  - [ ] Choose dates/times for each player
  - [ ] Confirm bulk assignment
- [ ] Create PlayerSchedule component
  - [ ] Display player's assigned sessions
  - [ ] Show upcoming sessions prominently
  - [ ] Add calendar view
  - [ ] Add list view option
  - [ ] Highlight today's sessions
  - [ ] Show completion status badges

---

## Phase 3: AI Assistant & Completion (Hours 14-18)

### 3.1 AI Assistant Data Model
- [ ] Define AI conversation structures
  - [ ] Create AIConversation interface
  - [ ] Define message roles (user, assistant)
  - [ ] Create escalation structure
- [ ] Set up aiConversations collection
  - [ ] Create collection structure
  - [ ] Add indexes for playerId and drillId
  - [ ] Set up security rules

### 3.2 AI Assistant Service Layer
- [ ] Create aiAssistant.service.js
  - [ ] Implement sendMessage function
  - [ ] Implement getConversationHistory function
  - [ ] Create Cloud Function for Claude API calls
  - [ ] Write system prompt for coaching assistant
  - [ ] Implement context building (drill info, player history)
  - [ ] Add escalation detection logic
  - [ ] Implement response streaming (optional)
- [ ] Create video discovery feature
  - [ ] Write prompt for video search
  - [ ] Integrate web search capability
  - [ ] Parse and validate video URLs
  - [ ] Filter for quality instructional content

### 3.3 AI Chat UI Component
- [ ] Build AIChat component
  - [ ] Create chat interface within drill view
  - [ ] Display conversation history
  - [ ] Create message bubbles (user vs AI)
  - [ ] Add text input with send button
  - [ ] Show loading indicator while AI responds
  - [ ] Display timestamps
  - [ ] Add "Ask Coach Instead" button
  - [ ] Show escalation notice if needed
- [ ] Add quick question suggestions
  - [ ] Show common questions for each drill type
  - [ ] Create clickable suggestion chips
  - [ ] Pre-populate input on click

### 3.4 Video Upload System
- [ ] Set up Firebase Storage configuration
  - [ ] Configure storage buckets
  - [ ] Set up storage rules
  - [ ] Create folder structure
- [ ] Create video upload service
  - [ ] Create videoUpload.service.js
  - [ ] Implement client-side video validation
  - [ ] Add file size checker (<50MB)
  - [ ] Add duration checker (10-30 seconds)
  - [ ] Implement resumable upload
  - [ ] Add upload progress tracking
  - [ ] Generate thumbnail after upload
  - [ ] Return video URL and thumbnail URL
- [ ] Build VideoUpload component
  - [ ] Create drag-and-drop zone
  - [ ] Add file picker button
  - [ ] Show video preview before upload
  - [ ] Display upload progress bar
  - [ ] Show success/error messages
  - [ ] Add ability to re-record/replace video
  - [ ] Optimize for mobile camera capture

### 3.5 Session Completion Data Model
- [ ] Define completion structures
  - [ ] Create Completion interface
  - [ ] Define performance metrics types
  - [ ] Create difficulty rating scale
- [ ] Set up completions collection
  - [ ] Create collection structure
  - [ ] Add indexes for playerId and sessionId
  - [ ] Set up security rules

### 3.6 Completion Service Layer
- [ ] Create completion.service.js
  - [ ] Implement submitCompletion function
  - [ ] Implement getCompletionById function
  - [ ] Implement getPlayerCompletions function
  - [ ] Implement updateCompletion function (coach feedback)
  - [ ] Link completion to scheduled session
  - [ ] Update session status to completed

### 3.7 Completion Form UI
- [ ] Build CompleteSession component
  - [ ] Create multi-step completion wizard
  - [ ] Add video upload step
  - [ ] Add difficulty rating step (star rating)
  - [ ] Add performance metrics inputs
  - [ ] Add comments textarea
  - [ ] Add questions for coach section
  - [ ] Show progress indicator
  - [ ] Add submit button
  - [ ] Show confirmation message
  - [ ] Update schedule view to show completion badge

### 3.8 Coach Review Interface
- [ ] Create CompletionReview page
  - [ ] Display pending completions list
  - [ ] Show player name and drill title
  - [ ] Add filter by player
  - [ ] Sort by date (newest first)
  - [ ] Add reviewed/unreviewed filter
- [ ] Build CompletionDetail component
  - [ ] Display video player with controls
  - [ ] Add playback speed controls (0.5x, 1x, 2x)
  - [ ] Add frame-by-frame stepping (optional)
  - [ ] Show difficulty rating
  - [ ] Display performance metrics
  - [ ] Show player comments and questions
  - [ ] Create feedback textarea
  - [ ] Add quick response buttons
  - [ ] Add submit feedback button
  - [ ] Show feedback sent confirmation

### 3.9 Video Playback Component
- [ ] Build VideoPlayer component
  - [ ] Use HTML5 video element or Video.js
  - [ ] Add play/pause controls
  - [ ] Add progress bar
  - [ ] Add volume control
  - [ ] Add fullscreen button
  - [ ] Implement speed control
(Content truncated due to size limit. Use page ranges or line ranges to read remaining content)