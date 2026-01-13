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
export type PracticeStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled'

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
  completed: boolean
  createdAt: Date
  updatedAt: Date
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
export type AttendanceStatus = 'invited' | 'confirmed' | 'attended' | 'missed' | 'excused' | 'present' | 'absent' | 'late'

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
  players: (PracticePlayer & { player: User & { position?: string } })[]
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
export type NoteType = 'general' | 'technical' | 'physical' | 'mental' | 'game'

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
  totalDrillsCompleted?: number
  skillAverages: SkillRatings
  currentStreak?: number // Days of consecutive practice attendance
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

// ============================================================================
// COMMUNICATION CENTER TYPES
// ============================================================================

// Announcement Priority
export type AnnouncementPriority = 'low' | 'normal' | 'high' | 'urgent'

// Announcement Target Audience
export type AnnouncementAudience = 'all' | 'team' | 'individual'

// Announcement
export interface Announcement {
  id: string
  coachId: string
  title: string
  content: string
  priority: AnnouncementPriority
  targetAudience: AnnouncementAudience
  targetTeamId: string | null
  targetPlayerId: string | null
  relatedPracticeId: string | null
  isPinned: boolean
  publishedAt: Date
  expiresAt: Date | null
  createdAt: Date
  updatedAt: Date
  // Populated relationships
  coach?: User
  targetTeam?: Team
  targetPlayer?: User
  relatedPractice?: Practice
  readCount?: number
  isRead?: boolean
}

// Announcement Form Data
export interface AnnouncementFormData {
  title: string
  content: string
  priority: AnnouncementPriority
  targetAudience: AnnouncementAudience
  targetTeamId?: string
  targetPlayerId?: string
  relatedPracticeId?: string
  isPinned?: boolean
  expiresAt?: Date
}

// Announcement Read
export interface AnnouncementRead {
  id: string
  announcementId: string
  playerId: string
  readAt: Date
  createdAt: Date
}

// Team Message
export interface TeamMessage {
  id: string
  authorId: string
  teamId: string | null
  coachId: string | null
  content: string
  isCoachOnly: boolean
  createdAt: Date
  updatedAt: Date
  // Populated relationships
  author?: User
  team?: Team
  reactions?: MessageReaction[]
}

// Team Message Form Data
export interface TeamMessageFormData {
  content: string
  teamId?: string
  coachId?: string
  isCoachOnly?: boolean
}

// Message Reaction
export type ReactionType = 'like' | 'celebrate' | 'support' | 'fire'

export interface MessageReaction {
  id: string
  messageId: string
  userId: string
  reaction: ReactionType
  createdAt: Date
  // Populated relationships
  user?: User
}

// ============================================================================
// PRACTICE PLANS SYSTEM TYPES
// ============================================================================

// Practice Plan Category
export interface PracticePlanCategory {
  id: string
  coachId: string
  name: string
  description: string | null
  color: string | null
  icon: string | null
  isSystem: boolean
  createdAt: Date
  updatedAt: Date
}

export interface PracticePlanCategoryFormData {
  name: string
  description?: string
  color?: string
  icon?: string
}

// Practice Plan
export type AgeGroup = 'U10' | 'U12' | 'U14' | 'U16' | 'U18' | 'Adult' | 'All Ages'
export type SkillLevelPlan = 'beginner' | 'intermediate' | 'advanced' | 'elite' | 'mixed'
export type PlanPermission = 'view' | 'copy' | 'edit'

export interface PracticePlan {
  id: string
  coachId: string
  
  // Basic Info
  title: string
  description: string | null
  
  // Metadata
  categoryId: string | null
  tags: string[]
  
  // Target Audience
  ageGroup: AgeGroup | null
  skillLevel: SkillLevelPlan | null
  teamSizeMin: number | null
  teamSizeMax: number | null
  
  // Duration & Structure
  totalDurationMinutes: number | null
  
  // Objectives & Notes
  objectives: string[]
  equipmentNeeded: string[]
  coachingNotes: string | null
  safetyNotes: string | null
  
  // Organization
  folderPath: string | null
  
  // Sharing
  isPublic: boolean
  isTemplate: boolean
  
  // Usage Stats
  timesUsed: number
  lastUsedAt: Date | null
  
  // Timestamps
  createdAt: Date
  updatedAt: Date
  
  // Populated relationships
  category?: PracticePlanCategory
  coach?: User
  sections?: PracticePlanSection[]
  shares?: PracticePlanShare[]
  isFavorite?: boolean
}

export interface PracticePlanFormData {
  title: string
  description?: string
  categoryId?: string
  tags?: string[]
  ageGroup?: AgeGroup
  skillLevel?: SkillLevelPlan
  teamSizeMin?: number
  teamSizeMax?: number
  totalDurationMinutes?: number
  objectives?: string[]
  equipmentNeeded?: string[]
  coachingNotes?: string
  safetyNotes?: string
  folderPath?: string
  isPublic?: boolean
  isTemplate?: boolean
}

// Practice Plan Section
export interface PracticePlanSection {
  id: string
  planId: string
  title: string
  description: string | null
  durationMinutes: number | null
  orderIndex: number
  color: string | null
  icon: string | null
  createdAt: Date
  updatedAt: Date
  // Populated relationships
  drills?: PracticePlanDrill[]
}

export interface PracticePlanSectionFormData {
  title: string
  description?: string
  durationMinutes?: number
  orderIndex: number
  color?: string
  icon?: string
}

// Practice Plan Drill (within a section)
export interface PracticePlanDrill {
  id: string
  sectionId: string
  drillId: string | null // reference to existing drill or null if custom
  
  // Custom drill info (if not referencing existing drill)
  customTitle: string | null
  customDescription: string | null
  customInstructions: string | null
  
  durationMinutes: number | null
  orderIndex: number
  
  // Drill-specific notes
  coachingPoints: string | null
  variations: string | null
  
  // Player organization
  playerCountMin: number | null
  playerCountMax: number | null
  groupsCount: number | null
  
  createdAt: Date
  updatedAt: Date
  
  // Populated relationships
  drill?: Drill
}

export interface PracticePlanDrillFormData {
  drillId?: string
  customTitle?: string
  customDescription?: string
  customInstructions?: string
  durationMinutes?: number
  orderIndex: number
  coachingPoints?: string
  variations?: string
  playerCountMin?: number
  playerCountMax?: number
  groupsCount?: number
}

// Practice Plan Share
export interface PracticePlanShare {
  id: string
  planId: string
  sharedWithCoachId: string
  sharedByCoachId: string
  permission: PlanPermission
  sharedAt: Date
  lastAccessedAt: Date | null
  // Populated relationships
  sharedWithCoach?: User
  sharedByCoach?: User
  plan?: PracticePlan
}

export interface PracticePlanShareFormData {
  sharedWithCoachId: string
  permission: PlanPermission
}

// Practice Plan Favorite
export interface PracticePlanFavorite {
  id: string
  planId: string
  coachId: string
  createdAt: Date
}

// Practice Plan with full details
export interface PracticePlanWithDetails extends PracticePlan {
  sections: (PracticePlanSection & { drills: (PracticePlanDrill & { drill?: Drill })[] })[]
}

// Practice Plan Filters
export interface PracticePlanFilters {
  categoryId?: string
  tags?: string[]
  ageGroup?: AgeGroup
  skillLevel?: SkillLevelPlan
  isPublic?: boolean
  isFavorite?: boolean
  folderPath?: string
  searchTerm?: string
}


