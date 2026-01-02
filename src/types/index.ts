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



