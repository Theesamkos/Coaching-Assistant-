import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/config/firebase'
import { User, Coach, Player, UserRole } from '@/types'

export const userService = {
  /**
   * Create user profile in Firestore
   */
  async createUserProfile(
    userId: string,
    userData: {
      email: string
      displayName: string
      photoURL?: string
      role: UserRole
      organization?: string
      position?: string
      coachId?: string
    }
  ) {
    try {
      const userRef = doc(db, 'users', userId)
      const profileData: Partial<User> = {
        id: userId,
        email: userData.email,
        displayName: userData.displayName,
        photoURL: userData.photoURL,
        role: userData.role,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      // Add role-specific data
      if (userData.role === 'coach') {
        const coachData: Partial<Coach> = {
          ...profileData,
          organization: userData.organization,
          players: [],
        }
        await setDoc(userRef, coachData, { merge: true })
      } else if (userData.role === 'player') {
        const playerData: Partial<Player> = {
          ...profileData,
          position: userData.position,
          coachId: userData.coachId,
        }
        await setDoc(userRef, playerData, { merge: true })
      } else {
        await setDoc(userRef, profileData, { merge: true })
      }

      return { success: true, error: null }
    } catch (error: any) {
      return { success: false, error: { code: error.code, message: error.message } }
    }
  },

  /**
   * Get user profile from Firestore
   */
  async getUserProfile(userId: string) {
    try {
      const userRef = doc(db, 'users', userId)
      const userSnap = await getDoc(userRef)

      if (userSnap.exists()) {
        const data = userSnap.data()
        return {
          user: {
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          } as User,
          error: null,
        }
      } else {
        return { user: null, error: { code: 'not-found', message: 'User profile not found' } }
      }
    } catch (error: any) {
      return { user: null, error: { code: error.code, message: error.message } }
    }
  },

  /**
   * Update user profile
   */
  async updateUserProfile(userId: string, updates: Partial<User>) {
    try {
      const userRef = doc(db, 'users', userId)
      await updateDoc(userRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      })
      return { success: true, error: null }
    } catch (error: any) {
      return { success: false, error: { code: error.code, message: error.message } }
    }
  },
}



