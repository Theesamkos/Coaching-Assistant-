import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  User as FirebaseUser,
  onAuthStateChanged,
} from 'firebase/auth'
import { auth } from '@/config/firebase'

const googleProvider = new GoogleAuthProvider()

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
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      return { user: userCredential.user, error: null }
    } catch (error: any) {
      return { user: null, error: { code: error.code, message: error.message } as AuthError }
    }
  },

  /**
   * Register with email and password
   */
  async registerWithEmail(email: string, password: string) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      return { user: userCredential.user, error: null }
    } catch (error: any) {
      return { user: null, error: { code: error.code, message: error.message } as AuthError }
    }
  },

  /**
   * Sign in with Google
   */
  async signInWithGoogle() {
    try {
      const userCredential = await signInWithPopup(auth, googleProvider)
      return { user: userCredential.user, error: null }
    } catch (error: any) {
      return { user: null, error: { code: error.code, message: error.message } as AuthError }
    }
  },

  /**
   * Sign out
   */
  async signOut() {
    try {
      await signOut(auth)
      return { error: null }
    } catch (error: any) {
      return { error: { code: error.code, message: error.message } as AuthError }
    }
  },

  /**
   * Send password reset email
   */
  async resetPassword(email: string) {
    try {
      await sendPasswordResetEmail(auth, email)
      return { error: null }
    } catch (error: any) {
      return { error: { code: error.code, message: error.message } as AuthError }
    }
  },

  /**
   * Get current user
   */
  getCurrentUser(): FirebaseUser | null {
    return auth.currentUser
  },

  /**
   * Listen to auth state changes
   */
  onAuthStateChanged(callback: (user: FirebaseUser | null) => void) {
    return onAuthStateChanged(auth, callback)
  },
}



