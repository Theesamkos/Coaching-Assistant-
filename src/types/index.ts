export type UserRole = 'coach' | 'player'

export interface User {
  id: string
  email: string
  displayName: string
  photoURL?: string
  role: UserRole
  createdAt: Date
  updatedAt: Date
}

export interface Coach extends User {
  role: 'coach'
  organization?: string
  players?: string[] // Array of player IDs
}

export interface Player extends User {
  role: 'player'
  position?: string
  coachId?: string // Reference to coach ID
}

export interface Invitation {
  id: string
  coachId: string
  email: string
  token: string
  status: 'pending' | 'accepted' | 'expired' | 'cancelled'
  createdAt: Date
  expiresAt: Date
  acceptedAt?: Date
}

// ============================================================================
// PHASE 1A TYPES - Coach/Player Management & Practice System
// ============================================================================

// Coach-Player Relationship Types
export type InvitationStatus = 'pending' | 'accepted' | 'declined'

export interface CoachPlayer {
  id: string
  coachId: string
  playerId: string
  invitationToken: string | null
  status: InvitationStatus
  invitedAt: Date
  acceptedAt: Date | null
  createdAt: Date
  updatedAt: Date
  // Populated relationships (when joined)
  coach?: User
  player?: User
}

// Drill Types
export type DrillDifficulty = 'beginner' | 'intermediate' | 'advanced'

export interface Drill {
  id: string
  coachId: string
  title: string
  description: string | null
  category: string | null
  durationMinutes: number | null
  difficulty: DrillDifficulty | null
  objectives: string[]
  equipmentNeeded: string[]
  instructions: string | null
  videoUrl: string | null
  isFavorite: boolean
  createdAt: Date
  updatedAt: Date
  // Populated relationships (when joined)
  coach?: User
}

export interface DrillFormData {
  title: string
  description?: string
  category?: string
  durationMinutes?: number
  difficulty?: DrillDifficulty
  objectives: string[]
  equipmentNeeded: string[]
  instructions?: string
  videoUrl?: string
  isFavorite?: boolean
}

// Practice Types
export type PracticeStatus = 'scheduled' | 'completed' | 'cancelled'

export interface Practice {
  id: string
  coachId: string
  title: string
  description: string | null
  scheduledDate: Date
  durationMinutes: number | null
  location: string | null
  notes: string | null
  status: PracticeStatus
  createdAt: Date
  updatedAt: Date
  // Populated relationships (when joined)
  coach?: User
  drills?: PracticeDrill[]
  players?: PracticePlayer[]
}

export interface PracticeFormData {
  title: string
  description?: string
  scheduledDate: Date
  durationMinutes?: number
  location?: string
  notes?: string
  status?: PracticeStatus
}

// Practice-Drill Relationship
export interface PracticeDrill {
  id: string
  practiceId: string
  drillId: string
  orderIndex: number
  customNotes: string | null
  createdAt: Date
  // Populated relationships (when joined)
  drill?: Drill
  practice?: Practice
}

export interface PracticeDrillFormData {
  drillId: string
  orderIndex: number
  customNotes?: string
}

// Practice-Player Relationship (Attendance)
export type AttendanceStatus = 'invited' | 'confirmed' | 'attended' | 'missed' | 'excused'

export interface PracticePlayer {
  id: string
  practiceId: string
  playerId: string
  attendanceStatus: AttendanceStatus
  notes: string | null
  createdAt: Date
  updatedAt: Date
  // Populated relationships (when joined)
  player?: User
  practice?: Practice
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T> {
  data: T | null
  error: ApiError | null
}

export interface ApiError {
  code: string
  message: string
}

// ============================================================================
// FILTER AND QUERY TYPES
// ============================================================================

export interface DrillFilters {
  category?: string
  difficulty?: DrillDifficulty
  searchTerm?: string
  isFavorite?: boolean
}

export interface PracticeFilters {
  startDate?: Date
  endDate?: Date
  status?: PracticeStatus
  playerId?: string // Filter practices for a specific player
}

export interface PlayerFilters {
  status?: InvitationStatus
  searchTerm?: string
  position?: string
}

// ============================================================================
// EXTENDED TYPES WITH RELATIONSHIPS
// ============================================================================

// Practice with full drill and player details
export interface PracticeWithDetails extends Practice {
  drills: (PracticeDrill & { drill: Drill })[]
  players: (PracticePlayer & { player: User })[]
}

// Coach with their players
export interface CoachWithPlayers extends Coach {
  coachPlayers: (CoachPlayer & { player: User })[]
}

// Player with their coaches
export interface PlayerWithCoaches extends Player {
  coachPlayers: (CoachPlayer & { coach: User })[]
}



