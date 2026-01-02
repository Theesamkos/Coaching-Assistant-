import { create } from 'zustand'
import { User as FirebaseUser } from 'firebase/auth'
import { User } from '@/types'

interface AuthState {
  firebaseUser: FirebaseUser | null
  userProfile: User | null
  loading: boolean
  error: string | null
  setFirebaseUser: (user: FirebaseUser | null) => void
  setUserProfile: (profile: User | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  firebaseUser: null,
  userProfile: null,
  loading: true,
  error: null,
  setFirebaseUser: (user) => set({ firebaseUser: user }),
  setUserProfile: (profile) => set({ userProfile: profile }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  clearAuth: () =>
    set({
      firebaseUser: null,
      userProfile: null,
      loading: false,
      error: null,
    }),
}))



