import { create } from 'zustand'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { User } from '@/types'

interface AuthState {
  supabaseUser: SupabaseUser | null
  userProfile: User | null
  loading: boolean
  error: string | null
  setSupabaseUser: (user: SupabaseUser | null) => void
  setUserProfile: (profile: User | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  supabaseUser: null,
  userProfile: null,
  loading: true,
  error: null,
  setSupabaseUser: (user) => set({ supabaseUser: user }),
  setUserProfile: (profile) => set({ userProfile: profile }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  clearAuth: () =>
    set({
      supabaseUser: null,
      userProfile: null,
      loading: false,
      error: null,
    }),
}))
