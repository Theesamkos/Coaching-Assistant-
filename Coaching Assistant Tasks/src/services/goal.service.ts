import { supabase } from '@/config/supabase'
import type { Goal, CreateGoalInput, UpdateGoalInput, GoalStatus } from '@/types/database.types'

export const goalService = {
  /**
   * Create a new goal
   */
  async createGoal(coachId: string, goalData: CreateGoalInput) {
    try {
      const { data, error } = await supabase
        .from('goals')
        .insert({
          ...goalData,
          coach_id: coachId,
        })
        .select()
        .single()

      if (error) throw error
      return { data: data as Goal, error: null }
    } catch (error: any) {
      return { data: null, error: { message: error.message } }
    }
  },

  /**
   * Get goals for a player
   */
  async getGoalsByPlayer(playerId: string, status?: GoalStatus) {
    try {
      let query = supabase.from('goals').select('*').eq('player_id', playerId)

      if (status) {
        query = query.eq('status', status)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error
      return { data: data as Goal[], error: null }
    } catch (error: any) {
      return { data: null, error: { message: error.message } }
    }
  },

  /**
   * Get goals created by a coach
   */
  async getGoalsByCoach(coachId: string, filters?: {
    playerId?: string
    status?: GoalStatus
  }) {
    try {
      let query = supabase.from('goals').select('*').eq('coach_id', coachId)

      if (filters?.playerId) {
        query = query.eq('player_id', filters.playerId)
      }
      if (filters?.status) {
        query = query.eq('status', filters.status)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error
      return { data: data as Goal[], error: null }
    } catch (error: any) {
      return { data: null, error: { message: error.message } }
    }
  },

  /**
   * Get goal by ID
   */
  async getGoalById(goalId: string) {
    try {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('id', goalId)
        .single()

      if (error) throw error
      return { data: data as Goal, error: null }
    } catch (error: any) {
      return { data: null, error: { message: error.message } }
    }
  },

  /**
   * Update a goal
   */
  async updateGoal(goalId: string, updates: UpdateGoalInput) {
    try {
      const { data, error } = await supabase
        .from('goals')
        .update(updates)
        .eq('id', goalId)
        .select()
        .single()

      if (error) throw error
      return { data: data as Goal, error: null }
    } catch (error: any) {
      return { data: null, error: { message: error.message } }
    }
  },

  /**
   * Update goal progress
   */
  async updateProgress(goalId: string, progressPercentage: number) {
    return this.updateGoal(goalId, { progress_percentage: progressPercentage })
  },

  /**
   * Mark goal as completed
   */
  async completeGoal(goalId: string) {
    return this.updateGoal(goalId, {
      status: 'completed',
      progress_percentage: 100,
    })
  },

  /**
   * Cancel a goal
   */
  async cancelGoal(goalId: string) {
    return this.updateGoal(goalId, { status: 'cancelled' })
  },

  /**
   * Delete a goal
   */
  async deleteGoal(goalId: string) {
    try {
      const { error } = await supabase.from('goals').delete().eq('id', goalId)

      if (error) throw error
      return { success: true, error: null }
    } catch (error: any) {
      return { success: false, error: { message: error.message } }
    }
  },

  /**
   * Get active goals for a player
   */
  async getActiveGoals(playerId: string) {
    return this.getGoalsByPlayer(playerId, 'active')
  },

  /**
   * Get completed goals for a player
   */
  async getCompletedGoals(playerId: string) {
    return this.getGoalsByPlayer(playerId, 'completed')
  },

  /**
   * Get goals with details (including player and coach info)
   */
  async getGoalsWithDetails(coachId: string) {
    try {
      const { data, error } = await supabase
        .from('goals')
        .select(`
          *,
          player:profiles!goals_player_id_fkey(*),
          coach:profiles!goals_coach_id_fkey(*)
        `)
        .eq('coach_id', coachId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return { data, error: null }
    } catch (error: any) {
      return { data: null, error: { message: error.message } }
    }
  },

  /**
   * Get upcoming goal deadlines for a player
   */
  async getUpcomingDeadlines(playerId: string, daysAhead: number = 30) {
    try {
      const today = new Date()
      const futureDate = new Date()
      futureDate.setDate(today.getDate() + daysAhead)

      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('player_id', playerId)
        .eq('status', 'active')
        .gte('target_date', today.toISOString().split('T')[0])
        .lte('target_date', futureDate.toISOString().split('T')[0])
        .order('target_date', { ascending: true })

      if (error) throw error
      return { data: data as Goal[], error: null }
    } catch (error: any) {
      return { data: null, error: { message: error.message } }
    }
  },
}
