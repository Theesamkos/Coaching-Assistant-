import { supabase } from '@/config/supabase'
import type { Profile, UserRole, Coach, Player } from '@/types/database.types'

export const userService = {
  /**
   * Create user profile in Supabase
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
      const profileData: Partial<Profile> = {
        id: userId,
        email: userData.email,
        display_name: userData.displayName,
        photo_url: userData.photoURL,
        role: userData.role,
        organization: userData.organization,
        position: userData.position,
        coach_id: userData.coachId,
      }

      const { data, error } = await supabase
        .from('profiles')
        .insert(profileData)
        .select()
        .single()

      if (error) throw error
      return { success: true, profile: data as Profile, error: null }
    } catch (error: any) {
      return { 
        success: false, 
        profile: null,
        error: { code: error.code, message: error.message } 
      }
    }
  },

  /**
   * Get user profile from Supabase
   */
  async getUserProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      return { user: data as Profile, error: null }
    } catch (error: any) {
      return { 
        user: null, 
        error: { code: error.code, message: error.message } 
      }
    }
  },

  /**
   * Update user profile
   */
  async updateUserProfile(userId: string, updates: Partial<Profile>) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single()

      if (error) throw error
      return { success: true, user: data as Profile, error: null }
    } catch (error: any) {
      return { 
        success: false, 
        user: null,
        error: { code: error.code, message: error.message } 
      }
    }
  },

  /**
   * Get all coaches
   */
  async getCoaches() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'coach')
        .order('display_name')

      if (error) throw error
      return { coaches: data as Coach[], error: null }
    } catch (error: any) {
      return { 
        coaches: null, 
        error: { code: error.code, message: error.message } 
      }
    }
  },

  /**
   * Get all players
   */
  async getPlayers() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'player')
        .order('display_name')

      if (error) throw error
      return { players: data as Player[], error: null }
    } catch (error: any) {
      return { 
        players: null, 
        error: { code: error.code, message: error.message } 
      }
    }
  },

  /**
   * Delete user profile
   */
  async deleteUserProfile(userId: string) {
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)

      if (error) throw error
      return { success: true, error: null }
    } catch (error: any) {
      return { 
        success: false, 
        error: { code: error.code, message: error.message } 
      }
    }
  },
}
