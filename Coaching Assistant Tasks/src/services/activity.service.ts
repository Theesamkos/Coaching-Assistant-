import { supabase } from '@/config/supabase'
import type { ActivityLog, CreateActivityLogInput } from '@/types/database.types'

export const activityService = {
  /**
   * Create an activity log entry
   */
  async logActivity(userId: string, logData: CreateActivityLogInput) {
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .insert({
          ...logData,
          user_id: userId,
        })
        .select()
        .single()

      if (error) throw error
      return { data: data as ActivityLog, error: null }
    } catch (error: any) {
      return { data: null, error: { message: error.message } }
    }
  },

  /**
   * Get activity logs for a user
   */
  async getActivityLogs(userId: string, filters?: {
    actionType?: string
    entityType?: string
    startDate?: string
    endDate?: string
    limit?: number
  }) {
    try {
      let query = supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', userId)

      if (filters?.actionType) {
        query = query.eq('action_type', filters.actionType)
      }
      if (filters?.entityType) {
        query = query.eq('entity_type', filters.entityType)
      }
      if (filters?.startDate) {
        query = query.gte('created_at', filters.startDate)
      }
      if (filters?.endDate) {
        query = query.lte('created_at', filters.endDate)
      }

      query = query.order('created_at', { ascending: false })

      if (filters?.limit) {
        query = query.limit(filters.limit)
      }

      const { data, error } = await query

      if (error) throw error
      return { data: data as ActivityLog[], error: null }
    } catch (error: any) {
      return { data: null, error: { message: error.message } }
    }
  },

  /**
   * Get recent activity for a user
   */
  async getRecentActivity(userId: string, limit: number = 20) {
    return this.getActivityLogs(userId, { limit })
  },

  /**
   * Get activity logs by type
   */
  async getActivityByType(userId: string, actionType: string, limit?: number) {
    return this.getActivityLogs(userId, { actionType, limit })
  },

  /**
   * Get activity logs for a specific entity
   */
  async getActivityForEntity(userId: string, entityType: string, entityId: string) {
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return { data: data as ActivityLog[], error: null }
    } catch (error: any) {
      return { data: null, error: { message: error.message } }
    }
  },

  /**
   * Delete old activity logs (for cleanup)
   */
  async deleteOldLogs(userId: string, beforeDate: string) {
    try {
      const { error } = await supabase
        .from('activity_logs')
        .delete()
        .eq('user_id', userId)
        .lt('created_at', beforeDate)

      if (error) throw error
      return { success: true, error: null }
    } catch (error: any) {
      return { success: false, error: { message: error.message } }
    }
  },

  // =====================================================
  // HELPER FUNCTIONS FOR COMMON ACTIVITIES
  // =====================================================

  async logDrillCompleted(userId: string, drillId: string, drillTitle: string) {
    return this.logActivity(userId, {
      action_type: 'drill_completed',
      entity_type: 'drill',
      entity_id: drillId,
      description: `Completed drill: ${drillTitle}`,
    })
  },

  async logSessionScheduled(
    userId: string,
    sessionId: string,
    sessionTitle: string,
    playerName: string
  ) {
    return this.logActivity(userId, {
      action_type: 'session_scheduled',
      entity_type: 'session',
      entity_id: sessionId,
      description: `Scheduled practice session "${sessionTitle}" for ${playerName}`,
    })
  },

  async logFeedbackGiven(userId: string, completionId: string, playerName: string) {
    return this.logActivity(userId, {
      action_type: 'feedback_given',
      entity_type: 'completion',
      entity_id: completionId,
      description: `Provided feedback to ${playerName}`,
    })
  },

  async logDrillCreated(userId: string, drillId: string, drillTitle: string) {
    return this.logActivity(userId, {
      action_type: 'drill_created',
      entity_type: 'drill',
      entity_id: drillId,
      description: `Created custom drill: ${drillTitle}`,
    })
  },

  async logGoalCreated(userId: string, goalId: string, goalTitle: string, playerName: string) {
    return this.logActivity(userId, {
      action_type: 'goal_created',
      entity_type: 'goal',
      entity_id: goalId,
      description: `Set goal "${goalTitle}" for ${playerName}`,
    })
  },

  async logPlayerInvited(userId: string, invitationId: string, playerEmail: string) {
    return this.logActivity(userId, {
      action_type: 'player_invited',
      entity_type: 'invitation',
      entity_id: invitationId,
      description: `Invited player: ${playerEmail}`,
    })
  },
}
