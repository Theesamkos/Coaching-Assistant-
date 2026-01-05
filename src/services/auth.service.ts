import { supabase } from '@/config/supabase'
import { User as SupabaseUser } from '@supabase/supabase-js'

export interface AuthError {
  code: string
  message: string
}

export const authService = {
  /**
   * Sign in with email and password
   */
  async signInWithEmail(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) {
        return { user: null, error: { code: error.code || 'auth_error', message: error.message } as AuthError }
      }
      
      return { user: data.user, error: null }
    } catch (error: any) {
      return { user: null, error: { code: error.code || 'unknown_error', message: error.message } as AuthError }
    }
  },

  /**
   * Register with email and password
   */
  async registerWithEmail(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })
      
      if (error) {
        return { user: null, error: { code: error.code || 'auth_error', message: error.message } as AuthError }
      }
      
      return { user: data.user, error: null }
    } catch (error: any) {
      return { user: null, error: { code: error.code || 'unknown_error', message: error.message } as AuthError }
    }
  },

  /**
   * Sign in with Google
   */
  async signInWithGoogle() {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      
      if (error) {
        return { user: null, error: { code: error.code || 'auth_error', message: error.message } as AuthError }
      }
      
      // For OAuth, the user will be redirected and we'll get the user on callback
      return { user: null, error: null }
    } catch (error: any) {
      return { user: null, error: { code: error.code || 'unknown_error', message: error.message } as AuthError }
    }
  },

  /**
   * Sign out
   */
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        return { error: { code: error.code || 'auth_error', message: error.message } as AuthError }
      }
      
      return { error: null }
    } catch (error: any) {
      return { error: { code: error.code || 'unknown_error', message: error.message } as AuthError }
    }
  },

  /**
   * Send password reset email
   */
  async resetPassword(email: string) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      
      if (error) {
        return { error: { code: error.code || 'auth_error', message: error.message } as AuthError }
      }
      
      return { error: null }
    } catch (error: any) {
      return { error: { code: error.code || 'unknown_error', message: error.message } as AuthError }
    }
  },

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<SupabaseUser | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      return user
    } catch (error) {
      return null
    }
  },

  /**
   * Listen to auth state changes
   */
  onAuthStateChanged(callback: (user: SupabaseUser | null) => void) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      callback(session?.user ?? null)
    })
    
    return () => {
      subscription.unsubscribe()
    }
  },
}
