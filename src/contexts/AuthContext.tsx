import { createContext, useContext, useEffect, ReactNode } from 'react'
import { useAuthStore } from '@/store/authStore'
import { authService } from '@/services/auth.service'
import { userService } from '@/services/user.service'
import { User as FirebaseUser } from 'firebase/auth'

interface AuthContextType {
  // Auth state is managed by Zustand store
  // This context provides initialization and helper methods
  initializeAuth: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { setFirebaseUser, setUserProfile, setLoading, clearAuth } = useAuthStore()

  const initializeAuth = () => {
    setLoading(true)
    
    // Listen to auth state changes
    const unsubscribe = authService.onAuthStateChanged(async (firebaseUser: FirebaseUser | null) => {
      setFirebaseUser(firebaseUser)

      if (firebaseUser) {
        // Load user profile from Firestore
        const { user, error } = await userService.getUserProfile(firebaseUser.uid)
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



