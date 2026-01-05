import { supabase } from '@/config/supabase'
import type { UserRole, Profile } from '@/types/database.types'

export interface AuthError {
  code: string
  message: string
}

export const authService = {
  /**
   * Sign up with email and password
   */
  async signUp(email: string, password: string, userData: {
    displayName: string
    role: UserRole
    organization?: string
    position?: string
  }) {
    try {
      // Sign up user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (signUpError) throw signUpError
      if (!authData.user) throw new Error('User creation failed')

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email,
          display_name: userData.displayName,
          role: userData.role,
          organization: userData.organization,
          position: userData.position,
        })

      if (profileError) throw profileError

      return { user: authData.user, error: null }
    } catch (error: any) {
      return { 
        user: null, 
        error: { 
          code: error.code || 'unknown', 
          message: error.message 
        } as AuthError 
      }
    }
  },

  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error
      return { user: data.user, session: data.session, error: null }
    } catch (error: any) {
      return { 
        user: null, 
        session: null,
        error: { 
          code: error.code || 'unknown', 
          message: error.message 
        } as AuthError 
      }
    }
  },

  /**
   * Sign in with Google OAuth
   */
  async signInWithGoogle() {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error
      return { data, error: null }
    } catch (error: any) {
      return { 
        data: null, 
        error: { 
          code: error.code || 'unknown', 
          message: error.message 
        } as AuthError 
      }
    }
  },

  /**
   * Sign out
   */
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      return { error: null }
    } catch (error: any) {
      return { 
        error: { 
          code: error.code || 'unknown', 
          message: error.message 
        } as AuthError 
      }
    }
  },

  /**
   * Send password reset email
   */
  async resetPassword(email: string) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })
      if (error) throw error
      return { error: null }
    } catch (error: any) {
      return { 
        error: { 
          code: error.code || 'unknown', 
          message: error.message 
        } as AuthError 
      }
    }
  },

  /**
   * Update password
   */
  async updatePassword(newPassword: string) {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })
      if (error) throw error
      return { error: null }
    } catch (error: any) {
      return { 
        error: { 
          code: error.code || 'unknown', 
          message: error.message 
        } as AuthError 
      }
    }
  },

  /**
   * Get current user
   */
  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) throw error
      return { user, error: null }
    } catch (error: any) {
      return { 
        user: null, 
        error: { 
          code: error.code || 'unknown', 
          message: error.message 
        } as AuthError 
      }
    }
  },

  /**
   * Get current session
   */
  async getSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) throw error
      return { session, error: null }
    } catch (error: any) {
      return { 
        session: null, 
        error: { 
          code: error.code || 'unknown', 
          message: error.message 
        } as AuthError 
      }
    }
  },

  /**
   * Get user profile
   */
  async getUserProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      return { profile: data as Profile, error: null }
    } catch (error: any) {
      return { 
        profile: null, 
        error: { 
          code: error.code || 'unknown', 
          message: error.message 
        } as AuthError 
      }
    }
  },

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updates: Partial<Profile>) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single()

      if (error) throw error
      return { profile: data as Profile, error: null }
    } catch (error: any) {
      return { 
        profile: null, 
        error: { 
          code: error.code || 'unknown', 
          message: error.message 
        } as AuthError 
      }
    }
  },

  /**
   * Listen to auth state changes
   */
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback)
  },
}
