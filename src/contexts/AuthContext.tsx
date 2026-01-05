import { createContext, useContext, useEffect, ReactNode } from 'react'
import { useAuthStore } from '@/store/authStore'
import { authService } from '@/services/auth.service'
import { userService } from '@/services/user.service'
import { User as SupabaseUser } from '@supabase/supabase-js'

interface AuthContextType {
  // Auth state is managed by Zustand store
  // This context provides initialization and helper methods
  initializeAuth: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { setSupabaseUser, setUserProfile, setLoading, clearAuth } = useAuthStore()

  const initializeAuth = () => {
    setLoading(true)
    
    // Listen to auth state changes
    const unsubscribe = authService.onAuthStateChanged(async (supabaseUser: SupabaseUser | null) => {
      setSupabaseUser(supabaseUser)

      if (supabaseUser) {
        // Load user profile from Supabase
        const { user, error } = await userService.getUserProfile(supabaseUser.id)
        if (user && !error) {
          setUserProfile(user)
        } else {
          // Profile doesn't exist yet - user needs to complete profile setup
          setUserProfile(null)
        }
      } else {
        clearAuth()
      }
      
      setLoading(false)
    })

    return unsubscribe
  }

  useEffect(() => {
    const unsubscribe = initializeAuth()
    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [])

  return (
    <AuthContext.Provider value={{ initializeAuth }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}
