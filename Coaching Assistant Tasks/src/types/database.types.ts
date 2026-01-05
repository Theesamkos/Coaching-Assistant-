// =====================================================
// DATABASE TYPES - Generated from Supabase Schema
// =====================================================

export type UserRole = 'coach' | 'player'

export type DrillCategory = 
  | 'shooting' 
  | 'skating' 
  | 'stickhandling' 
  | 'passing' 
  | 'defensive' 
  | 'goaltending' 
  | 'conditioning' 
  | 'other'

export type DrillDifficulty = 'beginner' | 'intermediate' | 'advanced'

export type SessionStatus = 'scheduled' | 'completed' | 'cancelled' | 'missed'

export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'cancelled'

export type GoalStatus = 'active' | 'completed' | 'cancelled'

export type AIMessageRole = 'user' | 'assistant' | 'system'

// =====================================================
// PROFILE TYPES
// =====================================================

export interface Profile {
  id: string
  email: string
  display_name: string
  photo_url?: string
  role: UserRole
  organization?: string // For coaches
  position?: string // For players
  coach_id?: string // For players
  created_at: string
  updated_at: string
}

export interface Coach extends Profile {
  role: 'coach'
  organization?: string
}

export interface Player extends Profile {
  role: 'player'
  position?: string
  coach_id?: string
}

// =====================================================
// INVITATION TYPES
// =====================================================

export interface Invitation {
  id: string
  coach_id: string
  email: string
  token: string
  status: InvitationStatus
  created_at: string
  expires_at: string
  accepted_at?: string
}

export interface CreateInvitationInput {
  email: string
  expires_at: string
}

// =====================================================
// DRILL TYPES
// =====================================================

export interface Drill {
  id: string
  title: string
  description: string
  category: DrillCategory
  difficulty: DrillDifficulty
  duration_minutes: number
  equipment: string[]
  key_points: string[]
  video_urls: string[]
  is_custom: boolean
  created_by?: string
  created_at: string
  updated_at: string
}

export interface CreateDrillInput {
  title: string
  description: string
  category: DrillCategory
  difficulty: DrillDifficulty
  duration_minutes: number
  equipment: string[]
  key_points: string[]
  video_urls: string[]
  is_custom?: boolean
}

export interface UpdateDrillInput {
  title?: string
  description?: string
  category?: DrillCategory
  difficulty?: DrillDifficulty
  duration_minutes?: number
  equipment?: string[]
  key_points?: string[]
  video_urls?: string[]
}

// =====================================================
// PRACTICE SESSION TYPES
// =====================================================

export interface PracticeSession {
  id: string
  coach_id: string
  player_id: string
  title: string
  description?: string
  scheduled_date: string
  duration_minutes: number
  location?: string
  status: SessionStatus
  notes?: string
  created_at: string
  updated_at: string
}

export interface CreatePracticeSessionInput {
  player_id: string
  title: string
  description?: string
  scheduled_date: string
  duration_minutes: number
  location?: string
  notes?: string
}

export interface UpdatePracticeSessionInput {
  title?: string
  description?: string
  scheduled_date?: string
  duration_minutes?: number
  location?: string
  status?: SessionStatus
  notes?: string
}

// =====================================================
// SESSION DRILL TYPES
// =====================================================

export interface SessionDrill {
  id: string
  session_id: string
  drill_id: string
  order_index: number
  sets: number
  reps: number
  notes?: string
  created_at: string
}

export interface CreateSessionDrillInput {
  session_id: string
  drill_id: string
  order_index: number
  sets?: number
  reps?: number
  notes?: string
}

// =====================================================
// DRILL COMPLETION TYPES
// =====================================================

export interface DrillCompletion {
  id: string
  player_id: string
  drill_id: string
  session_id?: string
  completed_at: string
  duration_minutes?: number
  sets_completed?: number
  reps_completed?: number
  performance_rating?: number // 1-5
  player_notes?: string
  coach_feedback?: string
  video_url?: string
  created_at: string
  updated_at: string
}

export interface CreateDrillCompletionInput {
  drill_id: string
  session_id?: string
  duration_minutes?: number
  sets_completed?: number
  reps_completed?: number
  performance_rating?: number
  player_notes?: string
  video_url?: string
}

export interface UpdateDrillCompletionInput {
  duration_minutes?: number
  sets_completed?: number
  reps_completed?: number
  performance_rating?: number
  player_notes?: string
  coach_feedback?: string
  video_url?: string
}

// =====================================================
// PERFORMANCE METRICS TYPES
// =====================================================

export interface PerformanceMetric {
  id: string
  player_id: string
  metric_type: string
  metric_value: number
  unit: string
  recorded_at: string
  drill_completion_id?: string
  notes?: string
  created_at: string
}

export interface CreatePerformanceMetricInput {
  metric_type: string
  metric_value: number
  unit: string
  drill_completion_id?: string
  notes?: string
}

// =====================================================
// ACTIVITY LOG TYPES
// =====================================================

export interface ActivityLog {
  id: string
  user_id: string
  action_type: string
  entity_type?: string
  entity_id?: string
  description: string
  metadata?: Record<string, any>
  created_at: string
}

export interface CreateActivityLogInput {
  action_type: string
  entity_type?: string
  entity_id?: string
  description: string
  metadata?: Record<string, any>
}

// =====================================================
// MESSAGE TYPES
// =====================================================

export interface Message {
  id: string
  sender_id: string
  recipient_id: string
  subject?: string
  content: string
  is_read: boolean
  parent_message_id?: string
  created_at: string
}

export interface CreateMessageInput {
  recipient_id: string
  subject?: string
  content: string
  parent_message_id?: string
}

// =====================================================
// AI CONVERSATION TYPES
// =====================================================

export interface AIConversation {
  id: string
  player_id: string
  title?: string
  context?: Record<string, any>
  created_at: string
  updated_at: string
}

export interface AIMessage {
  id: string
  conversation_id: string
  role: AIMessageRole
  content: string
  created_at: string
}

export interface CreateAIConversationInput {
  title?: string
  context?: Record<string, any>
}

export interface CreateAIMessageInput {
  conversation_id: string
  role: AIMessageRole
  content: string
}

// =====================================================
// GOAL TYPES
// =====================================================

export interface Goal {
  id: string
  player_id: string
  coach_id: string
  title: string
  description?: string
  target_date?: string
  status: GoalStatus
  progress_percentage: number
  created_at: string
  updated_at: string
}

export interface CreateGoalInput {
  player_id: string
  title: string
  description?: string
  target_date?: string
}

export interface UpdateGoalInput {
  title?: string
  description?: string
  target_date?: string
  status?: GoalStatus
  progress_percentage?: number
}

// =====================================================
// VIEW TYPES
// =====================================================

export interface PlayerProgressSummary {
  player_id: string
  display_name: string
  total_completions: number
  total_sessions: number
  avg_performance_rating: number
  unique_drills_completed: number
}

export interface CoachDashboard {
  coach_id: string
  coach_name: string
  total_players: number
  total_sessions: number
  custom_drills_created: number
}

// =====================================================
// EXTENDED TYPES WITH RELATIONS
// =====================================================

export interface PracticeSessionWithDrills extends PracticeSession {
  drills: (SessionDrill & { drill: Drill })[]
  player: Player
}

export interface DrillCompletionWithDetails extends DrillCompletion {
  drill: Drill
  player: Player
}

export interface MessageWithSender extends Message {
  sender: Profile
  recipient: Profile
}

export interface GoalWithProgress extends Goal {
  player: Player
  coach: Coach
}
