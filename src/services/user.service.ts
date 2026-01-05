import { supabase } from '@/config/supabase'
import { User, Coach, Player, UserRole } from '@/types'

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
      const profileData: any = {
        id: userId,
        email: userData.email,
        display_name: userData.displayName,
        photo_url: userData.photoURL,
        role: userData.role,
      }

      // Add role-specific data
      if (userData.role === 'coach') {
        profileData.organization = userData.organization
      } else if (userData.role === 'player') {
        profileData.position = userData.position
      }

      const { error } = await supabase
        .from('profiles')
        .insert(profileData)

      if (error) {
        return { success: false, error: { code: error.code, message: error.message } }
      }

      return { success: true, error: null }
    } catch (error: any) {
      return { success: false, error: { code: error.code || 'unknown_error', message: error.message } }
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

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return { user: null, error: { code: 'not-found', message: 'User profile not found' } }
        }
        return { user: null, error: { code: error.code, message: error.message } }
      }

      if (!data) {
        return { user: null, error: { code: 'not-found', message: 'User profile not found' } }
      }

      // Transform the data from snake_case to camelCase to match our types
      const user: User = {
        id: data.id,
        email: data.email,
        displayName: data.display_name,
        photoURL: data.photo_url,
        role: data.role as UserRole,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      }

      // Add role-specific fields
      if (data.role === 'coach') {
        (user as Coach).organization = data.organization
        ;(user as Coach).players = [] // TODO: Implement players relationship
      } else if (data.role === 'player') {
        (user as Player).position = data.position
        ;(user as Player).coachId = data.coach_id
      }

      return { user, error: null }
    } catch (error: any) {
      return { user: null, error: { code: error.code || 'unknown_error', message: error.message } }
    }
  },

  /**
   * Update user profile
   */
  async updateUserProfile(userId: string, updates: Partial<User>) {
    try {
      // Transform camelCase to snake_case for database
      const dbUpdates: any = {}
      
      if (updates.displayName !== undefined) {
        dbUpdates.display_name = updates.displayName
      }
      if (updates.photoURL !== undefined) {
        dbUpdates.photo_url = updates.photoURL
      }
      if (updates.role !== undefined) {
        dbUpdates.role = updates.role
      }
      
      // Handle role-specific fields
      if ('organization' in updates) {
        dbUpdates.organization = (updates as Coach).organization
      }
      if ('position' in updates) {
        dbUpdates.position = (updates as Player).position
      }

      // updated_at is handled by database trigger

      const { error } = await supabase
        .from('profiles')
        .update(dbUpdates)
        .eq('id', userId)

      if (error) {
        return { success: false, error: { code: error.code, message: error.message } }
      }

      return { success: true, error: null }
    } catch (error: any) {
      return { success: false, error: { code: error.code || 'unknown_error', message: error.message } }
    }
  },
}
