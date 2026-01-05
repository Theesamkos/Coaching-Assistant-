import { supabase } from '@/config/supabase'
import type {
  DrillCompletion,
  CreateDrillCompletionInput,
  UpdateDrillCompletionInput,
  PerformanceMetric,
  CreatePerformanceMetricInput,
  DrillCompletionWithDetails,
  PlayerProgressSummary,
} from '@/types/database.types'

export const progressService = {
  /**
   * Create a drill completion
   */
  async createCompletion(playerId: string, completionData: CreateDrillCompletionInput) {
    try {
      const { data, error } = await supabase
        .from('drill_completions')
        .insert({
          ...completionData,
          player_id: playerId,
        })
        .select()
        .single()

      if (error) throw error
      return { data: data as DrillCompletion, error: null }
    } catch (error: any) {
      return { data: null, error: { message: error.message } }
    }
  },

  /**
   * Get completions for a player
   */
  async getCompletionsByPlayer(playerId: string, filters?: {
    drillId?: string
    sessionId?: string
    startDate?: string
    endDate?: string
  }) {
    try {
      let query = supabase
        .from('drill_completions')
        .select('*')
        .eq('player_id', playerId)

      if (filters?.drillId) {
        query = query.eq('drill_id', filters.drillId)
      }
      if (filters?.sessionId) {
        query = query.eq('session_id', filters.sessionId)
      }
      if (filters?.startDate) {
        query = query.gte('completed_at', filters.startDate)
      }
      if (filters?.endDate) {
        query = query.lte('completed_at', filters.endDate)
      }

      const { data, error } = await query.order('completed_at', { ascending: false })

      if (error) throw error
      return { data: data as DrillCompletion[], error: null }
    } catch (error: any) {
      return { data: null, error: { message: error.message } }
    }
  },

  /**
   * Get completions with drill details
   */
  async getCompletionsWithDetails(playerId: string, limit?: number) {
    try {
      let query = supabase
        .from('drill_completions')
        .select(`
          *,
          drill:drills(*),
          player:profiles(*)
        `)
        .eq('player_id', playerId)
        .order('completed_at', { ascending: false })

      if (limit) {
        query = query.limit(limit)
      }

      const { data, error } = await query

      if (error) throw error
      return { data: data as DrillCompletionWithDetails[], error: null }
    } catch (error: any) {
      return { data: null, error: { message: error.message } }
    }
  },

  /**
   * Get completion by ID
   */
  async getCompletionById(completionId: string) {
    try {
      const { data, error } = await supabase
        .from('drill_completions')
        .select('*')
        .eq('id', completionId)
        .single()

      if (error) throw error
      return { data: data as DrillCompletion, error: null }
    } catch (error: any) {
      return { data: null, error: { message: error.message } }
    }
  },

  /**
   * Update drill completion (for player notes or coach feedback)
   */
  async updateCompletion(completionId: string, updates: UpdateDrillCompletionInput) {
    try {
      const { data, error } = await supabase
        .from('drill_completions')
        .update(updates)
        .eq('id', completionId)
        .select()
        .single()

      if (error) throw error
      return { data: data as DrillCompletion, error: null }
    } catch (error: any) {
      return { data: null, error: { message: error.message } }
    }
  },

  /**
   * Add coach feedback to completion
   */
  async addCoachFeedback(completionId: string, feedback: string) {
    return this.updateCompletion(completionId, { coach_feedback: feedback })
  },

  /**
   * Delete drill completion
   */
  async deleteCompletion(completionId: string) {
    try {
      const { error } = await supabase
        .from('drill_completions')
        .delete()
        .eq('id', completionId)

      if (error) throw error
      return { success: true, error: null }
    } catch (error: any) {
      return { success: false, error: { message: error.message } }
    }
  },

  /**
   * Get player progress summary
   */
  async getPlayerProgress(playerId: string) {
    try {
      const { data, error } = await supabase
        .from('player_progress_summary')
        .select('*')
        .eq('player_id', playerId)
        .single()

      if (error) throw error
      return { data: data as PlayerProgressSummary, error: null }
    } catch (error: any) {
      return { data: null, error: { message: error.message } }
    }
  },

  /**
   * Get completions for a specific drill
   */
  async getCompletionsByDrill(drillId: string, playerId?: string) {
    try {
      let query = supabase
        .from('drill_completions')
        .select('*')
        .eq('drill_id', drillId)

      if (playerId) {
        query = query.eq('player_id', playerId)
      }

      const { data, error } = await query.order('completed_at', { ascending: false })

      if (error) throw error
      return { data: data as DrillCompletion[], error: null }
    } catch (error: any) {
      return { data: null, error: { message: error.message } }
    }
  },

  /**
   * Get recent completions for a player
   */
  async getRecentCompletions(playerId: string, limit: number = 10) {
    try {
      const { data, error } = await supabase
        .from('drill_completions')
        .select(`
          *,
          drill:drills(*)
        `)
        .eq('player_id', playerId)
        .order('completed_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return { data: data as DrillCompletion[], error: null }
    } catch (error: any) {
      return { data: null, error: { message: error.message } }
    }
  },

  /**
   * Get completions by coach (for all their players)
   */
  async getCompletionsByCoach(coachId: string, filters?: {
    playerId?: string
    startDate?: string
    endDate?: string
  }) {
    try {
      // First get all players for this coach
      const { data: players, error: playersError } = await supabase
        .from('profiles')
        .select('id')
        .eq('coach_id', coachId)

      if (playersError) throw playersError

      const playerIds = players?.map((p) => p.id) || []

      let query = supabase
        .from('drill_completions')
        .select(`
          *,
          drill:drills(*),
          player:profiles(*)
        `)
        .in('player_id', playerIds)

      if (filters?.playerId) {
        query = query.eq('player_id', filters.playerId)
      }
      if (filters?.startDate) {
        query = query.gte('completed_at', filters.startDate)
      }
      if (filters?.endDate) {
        query = query.lte('completed_at', filters.endDate)
      }

      const { data, error } = await query.order('completed_at', { ascending: false })

      if (error) throw error
      return { data: data as DrillCompletionWithDetails[], error: null }
    } catch (error: any) {
      return { data: null, error: { message: error.message } }
    }
  },

  // =====================================================
  // PERFORMANCE METRICS
  // =====================================================

  /**
   * Create performance metric
   */
  async createMetric(playerId: string, metricData: CreatePerformanceMetricInput) {
    try {
      const { data, error } = await supabase
        .from('performance_metrics')
        .insert({
          ...metricData,
          player_id: playerId,
        })
        .select()
        .single()

      if (error) throw error
      return { data: data as PerformanceMetric, error: null }
    } catch (error: any) {
      return { data: null, error: { message: error.message } }
    }
  },

  /**
   * Get metrics for a player
   */
  async getMetricsByPlayer(playerId: string, filters?: {
    metricType?: string
    startDate?: string
    endDate?: string
  }) {
    try {
      let query = supabase
        .from('performance_metrics')
        .select('*')
        .eq('player_id', playerId)

      if (filters?.metricType) {
        query = query.eq('metric_type', filters.metricType)
      }
      if (filters?.startDate) {
        query = query.gte('recorded_at', filters.startDate)
      }
      if (filters?.endDate) {
        query = query.lte('recorded_at', filters.endDate)
      }

      const { data, error } = await query.order('recorded_at', { ascending: false })

      if (error) throw error
      return { data: data as PerformanceMetric[], error: null }
    } catch (error: any) {
      return { data: null, error: { message: error.message } }
    }
  },

  /**
   * Get metrics by type for trend analysis
   */
  async getMetricTrend(playerId: string, metricType: string, limit: number = 20) {
    try {
      const { data, error } = await supabase
        .from('performance_metrics')
        .select('*')
        .eq('player_id', playerId)
        .eq('metric_type', metricType)
        .order('recorded_at', { ascending: true })
        .limit(limit)

      if (error) throw error
      return { data: data as PerformanceMetric[], error: null }
    } catch (error: any) {
      return { data: null, error: { message: error.message } }
    }
  },

  /**
   * Delete performance metric
   */
  async deleteMetric(metricId: string) {
    try {
      const { error } = await supabase
        .from('performance_metrics')
        .delete()
        .eq('id', metricId)

      if (error) throw error
      return { success: true, error: null }
    } catch (error: any) {
      return { success: false, error: { message: error.message } }
    }
  },
}
