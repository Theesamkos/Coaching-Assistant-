import { supabase } from '@/config/supabase'
import type {
  PracticeSession,
  CreatePracticeSessionInput,
  UpdatePracticeSessionInput,
  SessionDrill,
  CreateSessionDrillInput,
  SessionStatus,
  PracticeSessionWithDrills,
} from '@/types/database.types'

export const practiceService = {
  /**
   * Get all practice sessions for a coach
   */
  async getSessionsByCoach(coachId: string, filters?: {
    playerId?: string
    status?: SessionStatus
    startDate?: string
    endDate?: string
  }) {
    try {
      let query = supabase
        .from('practice_sessions')
        .select('*')
        .eq('coach_id', coachId)

      if (filters?.playerId) {
        query = query.eq('player_id', filters.playerId)
      }
      if (filters?.status) {
        query = query.eq('status', filters.status)
      }
      if (filters?.startDate) {
        query = query.gte('scheduled_date', filters.startDate)
      }
      if (filters?.endDate) {
        query = query.lte('scheduled_date', filters.endDate)
      }

      const { data, error } = await query.order('scheduled_date', { ascending: false })

      if (error) throw error
      return { data: data as PracticeSession[], error: null }
    } catch (error: any) {
      return { data: null, error: { message: error.message } }
    }
  },

  /**
   * Get all practice sessions for a player
   */
  async getSessionsByPlayer(playerId: string, filters?: {
    status?: SessionStatus
    startDate?: string
    endDate?: string
  }) {
    try {
      let query = supabase
        .from('practice_sessions')
        .select('*')
        .eq('player_id', playerId)

      if (filters?.status) {
        query = query.eq('status', filters.status)
      }
      if (filters?.startDate) {
        query = query.gte('scheduled_date', filters.startDate)
      }
      if (filters?.endDate) {
        query = query.lte('scheduled_date', filters.endDate)
      }

      const { data, error } = await query.order('scheduled_date', { ascending: false })

      if (error) throw error
      return { data: data as PracticeSession[], error: null }
    } catch (error: any) {
      return { data: null, error: { message: error.message } }
    }
  },

  /**
   * Get a single practice session by ID
   */
  async getSessionById(sessionId: string) {
    try {
      const { data, error } = await supabase
        .from('practice_sessions')
        .select('*')
        .eq('id', sessionId)
        .single()

      if (error) throw error
      return { data: data as PracticeSession, error: null }
    } catch (error: any) {
      return { data: null, error: { message: error.message } }
    }
  },

  /**
   * Get practice session with drills
   */
  async getSessionWithDrills(sessionId: string) {
    try {
      const { data: session, error: sessionError } = await this.getSessionById(sessionId)
      if (sessionError || !session) throw new Error('Session not found')

      const { data: sessionDrills, error: drillsError } = await supabase
        .from('session_drills')
        .select(`
          *,
          drill:drills(*)
        `)
        .eq('session_id', sessionId)
        .order('order_index')

      if (drillsError) throw drillsError

      const { data: player, error: playerError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.player_id)
        .single()

      if (playerError) throw playerError

      return {
        data: {
          ...session,
          drills: sessionDrills,
          player,
        } as PracticeSessionWithDrills,
        error: null,
      }
    } catch (error: any) {
      return { data: null, error: { message: error.message } }
    }
  },

  /**
   * Create a new practice session
   */
  async createSession(coachId: string, sessionData: CreatePracticeSessionInput) {
    try {
      const { data, error } = await supabase
        .from('practice_sessions')
        .insert({
          ...sessionData,
          coach_id: coachId,
        })
        .select()
        .single()

      if (error) throw error
      return { data: data as PracticeSession, error: null }
    } catch (error: any) {
      return { data: null, error: { message: error.message } }
    }
  },

  /**
   * Update a practice session
   */
  async updateSession(sessionId: string, updates: UpdatePracticeSessionInput) {
    try {
      const { data, error } = await supabase
        .from('practice_sessions')
        .update(updates)
        .eq('id', sessionId)
        .select()
        .single()

      if (error) throw error
      return { data: data as PracticeSession, error: null }
    } catch (error: any) {
      return { data: null, error: { message: error.message } }
    }
  },

  /**
   * Delete a practice session
   */
  async deleteSession(sessionId: string) {
    try {
      const { error } = await supabase
        .from('practice_sessions')
        .delete()
        .eq('id', sessionId)

      if (error) throw error
      return { success: true, error: null }
    } catch (error: any) {
      return { success: false, error: { message: error.message } }
    }
  },

  /**
   * Add drill to session
   */
  async addDrillToSession(sessionDrillData: CreateSessionDrillInput) {
    try {
      const { data, error } = await supabase
        .from('session_drills')
        .insert(sessionDrillData)
        .select()
        .single()

      if (error) throw error
      return { data: data as SessionDrill, error: null }
    } catch (error: any) {
      return { data: null, error: { message: error.message } }
    }
  },

  /**
   * Remove drill from session
   */
  async removeDrillFromSession(sessionDrillId: string) {
    try {
      const { error } = await supabase
        .from('session_drills')
        .delete()
        .eq('id', sessionDrillId)

      if (error) throw error
      return { success: true, error: null }
    } catch (error: any) {
      return { success: false, error: { message: error.message } }
    }
  },

  /**
   * Get drills for a session
   */
  async getSessionDrills(sessionId: string) {
    try {
      const { data, error } = await supabase
        .from('session_drills')
        .select(`
          *,
          drill:drills(*)
        `)
        .eq('session_id', sessionId)
        .order('order_index')

      if (error) throw error
      return { data: data as SessionDrill[], error: null }
    } catch (error: any) {
      return { data: null, error: { message: error.message } }
    }
  },

  /**
   * Update session drill order
   */
  async updateDrillOrder(sessionDrillId: string, newOrderIndex: number) {
    try {
      const { data, error } = await supabase
        .from('session_drills')
        .update({ order_index: newOrderIndex })
        .eq('id', sessionDrillId)
        .select()
        .single()

      if (error) throw error
      return { data: data as SessionDrill, error: null }
    } catch (error: any) {
      return { data: null, error: { message: error.message } }
    }
  },

  /**
   * Mark session as completed
   */
  async completeSession(sessionId: string, notes?: string) {
    return this.updateSession(sessionId, {
      status: 'completed',
      notes,
    })
  },

  /**
   * Cancel a session
   */
  async cancelSession(sessionId: string, notes?: string) {
    return this.updateSession(sessionId, {
      status: 'cancelled',
      notes,
    })
  },

  /**
   * Get upcoming sessions for a player
   */
  async getUpcomingSessions(playerId: string, limit: number = 5) {
    try {
      const now = new Date().toISOString()
      const { data, error } = await supabase
        .from('practice_sessions')
        .select('*')
        .eq('player_id', playerId)
        .eq('status', 'scheduled')
        .gte('scheduled_date', now)
        .order('scheduled_date', { ascending: true })
        .limit(limit)

      if (error) throw error
      return { data: data as PracticeSession[], error: null }
    } catch (error: any) {
      return { data: null, error: { message: error.message } }
    }
  },

  /**
   * Get past sessions for a player
   */
  async getPastSessions(playerId: string, limit: number = 10) {
    try {
      const now = new Date().toISOString()
      const { data, error } = await supabase
        .from('practice_sessions')
        .select('*')
        .eq('player_id', playerId)
        .in('status', ['completed', 'cancelled', 'missed'])
        .lte('scheduled_date', now)
        .order('scheduled_date', { ascending: false })
        .limit(limit)

      if (error) throw error
      return { data: data as PracticeSession[], error: null }
    } catch (error: any) {
      return { data: null, error: { message: error.message } }
    }
  },
}
