// Re-export all database types
export * from './database.types'

// Legacy types for backward compatibility (will be removed)
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
  players?: string[]
}

export interface Player extends User {
  role: 'player'
  position?: string
  coachId?: string
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
