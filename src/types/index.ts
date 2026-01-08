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
  playerId: string | null // Can be null if player hasn't registered yet
  playerEmail: string // Email of the invited player
  invitationToken: string | null
  status: InvitationStatus
  invitedAt: Date
  acceptedAt: Date | null
  expiresAt: Date | null // When the invitation expires
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

// ============================================================================
// PLAYER MANAGEMENT SYSTEM TYPES
// ============================================================================

// Privacy Settings
export interface PrivacySettings {
  hidePhone: boolean
  hideEmail: boolean
  hideAddress: boolean
  hideSocial: boolean
  hideAge: boolean
  hideStats: boolean
}

// Shoots direction
export type ShootsDirection = 'left' | 'right'

// Skill levels
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'elite'

// Enhanced Player Profile
export interface EnhancedPlayer extends User {
  role: 'player'
  
  // Basic hockey info
  position?: string
  jerseyNumber?: number | null
  shoots?: ShootsDirection | null
  heightInches?: number | null
  weightLbs?: number | null
  yearsExperience?: number | null
  skillLevel?: SkillLevel | null
  
  // Contact information
  phone?: string | null
  dateOfBirth?: Date | null
  
  // Emergency contact
  emergencyContactName?: string | null
  emergencyContactPhone?: string | null
  emergencyContactRelationship?: string | null
  
  // Parent/Guardian (for minors)
  parentName?: string | null
  parentEmail?: string | null
  parentPhone?: string | null
  
  // Address
  addressLine1?: string | null
  addressLine2?: string | null
  city?: string | null
  state?: string | null
  zipCode?: string | null
  country?: string | null
  
  // Social media
  instagramHandle?: string | null
  twitterHandle?: string | null
  
  // Privacy settings
  privacySettings: PrivacySettings
  
  // Medical notes (coaches only)
  medicalNotes?: string | null
  
  // Computed
  age?: number
  teams?: TeamInfo[]
}

// Player form data for creating/updating profiles
export interface PlayerFormData {
  displayName: string
  email: string
  phone?: string
  dateOfBirth?: Date
  position?: string
  jerseyNumber?: number
  shoots?: ShootsDirection
  heightInches?: number
  weightLbs?: number
  yearsExperience?: number
  skillLevel?: SkillLevel
  emergencyContactName?: string
  emergencyContactPhone?: string
  emergencyContactRelationship?: string
  parentName?: string
  parentEmail?: string
  parentPhone?: string
  addressLine1?: string
  addressLine2?: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
  instagramHandle?: string
  twitterHandle?: string
  privacySettings?: PrivacySettings
  medicalNotes?: string
}

// Team Types
export interface Team {
  id: string
  coachId: string
  name: string
  description: string | null
  season: string | null
  photoUrl: string | null
  createdAt: Date
  updatedAt: Date
  // Populated relationships
  coach?: User
  players?: TeamPlayer[]
  playerCount?: number
}

export interface TeamFormData {
  name: string
  description?: string
  season?: string
  photoUrl?: string
}

export interface TeamInfo {
  teamId: string
  teamName: string
  season: string | null
}

// Team-Player relationship
export interface TeamPlayer {
  id: string
  teamId: string
  playerId: string
  joinedAt: Date
  createdAt: Date
  // Populated relationships
  team?: Team
  player?: EnhancedPlayer
}

// Coach Notes Types
export type NoteType = 'general' | 'performance' | 'behavioral' | 'improvement' | 'goals' | 'medical'

export interface CoachNote {
  id: string
  coachId: string
  playerId: string
  noteType: NoteType
  content: string
  tags: string[]
  isVisibleToPlayer: boolean
  createdAt: Date
  updatedAt: Date
  // Populated relationships
  coach?: User
  player?: EnhancedPlayer
}

export interface CoachNoteFormData {
  noteType: NoteType
  content: string
  tags?: string[]
  isVisibleToPlayer?: boolean
}

export interface NoteFilters {
  noteType?: NoteType
  tags?: string[]
  playerId?: string
  searchTerm?: string
  isVisibleToPlayer?: boolean
}

// Player Statistics Types
export type StatType = 'practice' | 'game' | 'assessment' | 'custom'
export type PracticeAttendance = 'present' | 'absent' | 'late' | 'excused'

export interface SkillRatings {
  [skillName: string]: number // 1-5 rating
}

export interface CustomStats {
  [statName: string]: number | string
}

export interface PlayerStatistic {
  id: string
  playerId: string
  coachId: string
  statDate: Date
  statType: StatType
  
  // Practice stats
  attendanceStatus?: PracticeAttendance | null
  drillsCompleted?: number | null
  practiceRating?: number | null // 1-5
  
  // Performance metrics
  skillRatings?: SkillRatings
  
  // Game stats
  goals?: number
  assists?: number
  points?: number
  plusMinus?: number
  shots?: number
  saves?: number // For goalies
  
  // Custom stats
  customStats?: CustomStats
  
  // Notes
  notes?: string | null
  
  createdAt: Date
  updatedAt: Date
  
  // Populated relationships
  player?: EnhancedPlayer
  coach?: User
}

export interface StatisticFormData {
  statDate: Date
  statType: StatType
  attendanceStatus?: PracticeAttendance
  drillsCompleted?: number
  practiceRating?: number
  skillRatings?: SkillRatings
  goals?: number
  assists?: number
  points?: number
  plusMinus?: number
  shots?: number
  saves?: number
  customStats?: CustomStats
  notes?: string
}

export interface StatisticFilters {
  statType?: StatType
  startDate?: Date
  endDate?: Date
  playerId?: string
}

// Aggregated Statistics
export interface PlayerStatsAggregate {
  playerId: string
  totalPractices: number
  attendanceRate: number
  averageRating: number
  totalGoals: number
  totalAssists: number
  totalPoints: number
  skillAverages: SkillRatings
}

// Enhanced CoachPlayer with invitation management
export interface EnhancedCoachPlayer extends CoachPlayer {
  expiresAt: Date | null
  invitationMessage: string | null
  cancelledAt: Date | null
  isExpired: boolean
}

// Enhanced filters for player management
export interface EnhancedPlayerFilters extends PlayerFilters {
  teamId?: string
  skillLevel?: SkillLevel
  ageMin?: number
  ageMax?: number
  hasPhoto?: boolean
}

// ============================================================================
// PHOTO UPLOAD TYPES
// ============================================================================

export interface PhotoUpload {
  file: File
  preview: string
}

export interface PhotoUploadResult {
  url: string
  path: string
  error?: string
}



