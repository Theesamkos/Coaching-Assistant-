import { supabase } from '@/config/supabase'
import {
  PlayerStatistic,
  StatisticFormData,
  StatisticFilters,
  PlayerStatsAggregate,
  ApiResponse,
} from '@/types'

export const statisticsService = {
  /**
   * Create a new statistic entry
   */
  async createStatistic(
    coachId: string,
    playerId: string,
    statData: StatisticFormData
  ): Promise<ApiResponse<PlayerStatistic>> {
    try {
      const { data, error } = await supabase
        .from('player_statistics')
        .insert({
          player_id: playerId,
          coach_id: coachId,
          stat_date: statData.statDate.toISOString(),
          stat_type: statData.statType,
          attendance_status: statData.attendanceStatus || null,
          drills_completed: statData.drillsCompleted || null,
          practice_rating: statData.practiceRating || null,
          skill_ratings: statData.skillRatings || null,
          goals: statData.goals || 0,
          assists: statData.assists || 0,
          points: statData.points || 0,
          plus_minus: statData.plusMinus || 0,
          shots: statData.shots || 0,
          saves: statData.saves || 0,
          custom_stats: statData.customStats || {},
          notes: statData.notes || null,
        })
        .select()
        .single()

      if (error) {
        return { data: null, error: { code: error.code, message: error.message } }
      }

      const stat = this.transformDatabaseToStatistic(data)
      return { data: stat, error: null }
    } catch (error: any) {
      return { data: null, error: { code: 'unknown_error', message: error.message } }
    }
  },

  /**
   * Get statistics for a player
   */
  async getPlayerStatistics(
    playerId: string,
    filters?: StatisticFilters
  ): Promise<ApiResponse<PlayerStatistic[]>> {
    try {
      let query = supabase
        .from('player_statistics')
        .select(`
          *,
          coach:profiles!player_statistics_coach_id_fkey(id, display_name, email)
        `)
        .eq('player_id', playerId)

      // Apply filters
      if (filters?.statType) {
        query = query.eq('stat_type', filters.statType)
      }

      if (filters?.startDate) {
        query = query.gte('stat_date', filters.startDate.toISOString())
      }

      if (filters?.endDate) {
        query = query.lte('stat_date', filters.endDate.toISOString())
      }

      query = query.order('stat_date', { ascending: false })

      const { data, error } = await query

      if (error) {
        return { data: null, error: { code: error.code, message: error.message } }
      }

      const stats = data.map((item: any) => this.transformDatabaseToStatistic(item))
      return { data: stats, error: null }
    } catch (error: any) {
      return { data: null, error: { code: 'unknown_error', message: error.message } }
    }
  },

  /**
   * Get all statistics entered by a coach
   */
  async getCoachStatistics(
    coachId: string,
    filters?: StatisticFilters
  ): Promise<ApiResponse<PlayerStatistic[]>> {
    try {
      let query = supabase
        .from('player_statistics')
        .select(`
          *,
          player:profiles!player_statistics_player_id_fkey(id, display_name, email, position, jersey_number)
        `)
        .eq('coach_id', coachId)

      // Apply filters
      if (filters?.playerId) {
        query = query.eq('player_id', filters.playerId)
      }

      if (filters?.statType) {
        query = query.eq('stat_type', filters.statType)
      }

      if (filters?.startDate) {
        query = query.gte('stat_date', filters.startDate.toISOString())
      }

      if (filters?.endDate) {
        query = query.lte('stat_date', filters.endDate.toISOString())
      }

      query = query.order('stat_date', { ascending: false })

      const { data, error } = await query

      if (error) {
        return { data: null, error: { code: error.code, message: error.message } }
      }

      const stats = data.map((item: any) => this.transformDatabaseToStatistic(item))
      return { data: stats, error: null }
    } catch (error: any) {
      return { data: null, error: { code: 'unknown_error', message: error.message } }
    }
  },

  /**
   * Update a statistic entry
   */
  async updateStatistic(
    statisticId: string,
    updates: Partial<StatisticFormData>
  ): Promise<ApiResponse<PlayerStatistic>> {
    try {
      const dbUpdates: any = {}

      if (updates.statDate !== undefined) dbUpdates.stat_date = updates.statDate.toISOString()
      if (updates.statType !== undefined) dbUpdates.stat_type = updates.statType
      if (updates.attendanceStatus !== undefined)
        dbUpdates.attendance_status = updates.attendanceStatus
      if (updates.drillsCompleted !== undefined)
        dbUpdates.drills_completed = updates.drillsCompleted
      if (updates.practiceRating !== undefined) dbUpdates.practice_rating = updates.practiceRating
      if (updates.skillRatings !== undefined) dbUpdates.skill_ratings = updates.skillRatings
      if (updates.goals !== undefined) dbUpdates.goals = updates.goals
      if (updates.assists !== undefined) dbUpdates.assists = updates.assists
      if (updates.points !== undefined) dbUpdates.points = updates.points
      if (updates.plusMinus !== undefined) dbUpdates.plus_minus = updates.plusMinus
      if (updates.shots !== undefined) dbUpdates.shots = updates.shots
      if (updates.saves !== undefined) dbUpdates.saves = updates.saves
      if (updates.customStats !== undefined) dbUpdates.custom_stats = updates.customStats
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes

      const { data, error } = await supabase
        .from('player_statistics')
        .update(dbUpdates)
        .eq('id', statisticId)
        .select()
        .single()

      if (error) {
        return { data: null, error: { code: error.code, message: error.message } }
      }

      const stat = this.transformDatabaseToStatistic(data)
      return { data: stat, error: null }
    } catch (error: any) {
      return { data: null, error: { code: 'unknown_error', message: error.message } }
    }
  },

  /**
   * Delete a statistic entry
   */
  async deleteStatistic(statisticId: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('player_statistics')
        .delete()
        .eq('id', statisticId)

      if (error) {
        return { data: null, error: { code: error.code, message: error.message } }
      }

      return { data: true, error: null }
    } catch (error: any) {
      return { data: null, error: { code: 'unknown_error', message: error.message } }
    }
  },

  /**
   * Get aggregated statistics for a player
   */
  async getPlayerStatsAggregate(
    playerId: string,
    filters?: StatisticFilters
  ): Promise<ApiResponse<PlayerStatsAggregate>> {
    try {
      let query = supabase
        .from('player_statistics')
        .select('*')
        .eq('player_id', playerId)

      // Apply filters
      if (filters?.statType) {
        query = query.eq('stat_type', filters.statType)
      }

      if (filters?.startDate) {
        query = query.gte('stat_date', filters.startDate.toISOString())
      }

      if (filters?.endDate) {
        query = query.lte('stat_date', filters.endDate.toISOString())
      }

      const { data, error } = await query

      if (error) {
        return { data: null, error: { code: error.code, message: error.message } }
      }

      // Calculate aggregates
      const practiceStats = data.filter((s: any) => s.stat_type === 'practice')
      const totalPractices = practiceStats.length
      const attendedPractices = practiceStats.filter(
        (s: any) => s.attendance_status === 'present'
      ).length
      const attendanceRate = totalPractices > 0 ? (attendedPractices / totalPractices) * 100 : 0

      const ratingsSum = practiceStats.reduce(
        (sum: number, s: any) => sum + (s.practice_rating || 0),
        0
      )
      const averageRating = totalPractices > 0 ? ratingsSum / totalPractices : 0

      const totalGoals = data.reduce((sum: number, s: any) => sum + (s.goals || 0), 0)
      const totalAssists = data.reduce((sum: number, s: any) => sum + (s.assists || 0), 0)
      const totalPoints = totalGoals + totalAssists

      // Calculate skill averages
      const skillRatingsMap: { [key: string]: number[] } = {}
      data.forEach((stat: any) => {
        if (stat.skill_ratings) {
          Object.entries(stat.skill_ratings).forEach(([skill, rating]) => {
            if (!skillRatingsMap[skill]) {
              skillRatingsMap[skill] = []
            }
            skillRatingsMap[skill].push(rating as number)
          })
        }
      })

      const skillAverages: { [key: string]: number } = {}
      Object.entries(skillRatingsMap).forEach(([skill, ratings]) => {
        skillAverages[skill] = ratings.reduce((a, b) => a + b, 0) / ratings.length
      })

      const aggregate: PlayerStatsAggregate = {
        playerId,
        totalPractices,
        attendanceRate: Math.round(attendanceRate * 100) / 100,
        averageRating: Math.round(averageRating * 100) / 100,
        totalGoals,
        totalAssists,
        totalPoints,
        skillAverages,
      }

      return { data: aggregate, error: null }
    } catch (error: any) {
      return { data: null, error: { code: 'unknown_error', message: error.message } }
    }
  },

  /**
   * Get latest practice rating for a player
   */
  async getLatestPracticeRating(playerId: string): Promise<ApiResponse<number | null>> {
    try {
      const { data, error } = await supabase
        .from('player_statistics')
        .select('practice_rating')
        .eq('player_id', playerId)
        .eq('stat_type', 'practice')
        .not('practice_rating', 'is', null)
        .order('stat_date', { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') {
        // PGRST116 is "no rows returned"
        return { data: null, error: { code: error.code, message: error.message } }
      }

      return { data: data?.practice_rating || null, error: null }
    } catch (error: any) {
      return { data: null, error: { code: 'unknown_error', message: error.message } }
    }
  },

  /**
   * Transform database row to PlayerStatistic
   */
  transformDatabaseToStatistic(data: any): PlayerStatistic {
    return {
      id: data.id,
      playerId: data.player_id,
      coachId: data.coach_id,
      statDate: new Date(data.stat_date),
      statType: data.stat_type,
      attendanceStatus: data.attendance_status,
      drillsCompleted: data.drills_completed,
      practiceRating: data.practice_rating,
      skillRatings: data.skill_ratings || {},
      goals: data.goals || 0,
      assists: data.assists || 0,
      points: data.points || 0,
      plusMinus: data.plus_minus || 0,
      shots: data.shots || 0,
      saves: data.saves || 0,
      customStats: data.custom_stats || {},
      notes: data.notes,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      coach: data.coach ? {
        id: data.coach.id,
        displayName: data.coach.display_name,
        email: data.coach.email,
        role: 'coach',
        createdAt: new Date(),
        updatedAt: new Date(),
      } : undefined,
      player: data.player ? {
        id: data.player.id,
        displayName: data.player.display_name,
        email: data.player.email,
        role: 'player',
        position: data.player.position,
        jerseyNumber: data.player.jersey_number,
        privacySettings: {
          hidePhone: false,
          hideEmail: false,
          hideAddress: false,
          hideSocial: false,
          hideAge: false,
          hideStats: false,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      } : undefined,
    }
  },
}

