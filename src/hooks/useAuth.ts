import { useAuthStore } from '@/store/authStore'
import { authService } from '@/services/auth.service'
import { userService } from '@/services/user.service'
import { UserRole } from '@/types'

export function useAuth() {
  const { firebaseUser, userProfile, loading, error, setUserProfile } = useAuthStore()

  const signInWithEmail = async (email: string, password: string) => {
    const { user, error } = await authService.signInWithEmail(email, password)
    return { user, error }
  }

  const registerWithEmail = async (
    email: string,
    password: string,
    displayName: string,
    role: UserRole,
    additionalData?: { organization?: string; position?: string }
  ) => {
    const { user, error } = await authService.registerWithEmail(email, password)
    if (user && !error) {
      // Create user profile
      await userService.createUserProfile(user.uid, {
        email,
        displayName,
        role,
        organization: additionalData?.organization,
        position: additionalData?.position,
      })
    }
    return { user, error }
  }

  const signInWithGoogle = async () => {
    const { user, error } = await authService.signInWithGoogle()
    return { user, error }
  }

  const signOut = async () => {
    const { error } = await authService.signOut()
    return { error }
  }

  const resetPassword = async (email: string) => {
    const { error } = await authService.resetPassword(email)
    return { error }
  }

  const isAuthenticated = !!firebaseUser
  const isCoach = userProfile?.role === 'coach'
  const isPlayer = userProfile?.role === 'player'
  const needsProfileSetup = isAuthenticated && !userProfile

  return {
    firebaseUser,
    userProfile,
    loading,
    error,
    isAuthenticated,
    isCoach,
    isPlayer,
    needsProfileSetup,
    signInWithEmail,
    registerWithEmail,
    signInWithGoogle,
    signOut,
    resetPassword,
    setUserProfile,
  }
}



