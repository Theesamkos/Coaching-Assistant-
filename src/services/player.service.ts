import { supabase } from '@/config/supabase'
import type { Player, Profile, PlayerProgressSummary } from '@/types/database.types'

export const playerService = {
  /**
   * Get all players for a coach
   */
  async getPlayersByCoach(coachId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'player')
        .eq('coach_id', coachId)
        .order('display_name')

      if (error) throw error
      return { data: data as Player[], error: null }
    } catch (error: any) {
      return { data: null, error: { message: error.message } }
    }
  },

  /**
   * Get a single player by ID
   */
  async getPlayerById(playerId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', playerId)
        .eq('role', 'player')
        .single()

      if (error) throw error
      return { data: data as Player, error: null }
    } catch (error: any) {
      return { data: null, error: { message: error.message } }
    }
  },

  /**
   * Get player's coach
   */
  async getPlayerCoach(playerId: string) {
    try {
      const { data: player, error: playerError } = await supabase
        .from('profiles')
        .select('coach_id')
        .eq('id', playerId)
        .single()

      if (playerError) throw playerError
      if (!player?.coach_id) {
        return { data: null, error: { message: 'Player has no assigned coach' } }
      }

      const { data: coach, error: coachError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', player.coach_id)
        .single()

      if (coachError) throw coachError
      return { data: coach as Profile, error: null }
    } catch (error: any) {
      return { data: null, error: { message: error.message } }
    }
  },

  /**
   * Update player profile
   */
  async updatePlayer(playerId: string, updates: Partial<Player>) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', playerId)
        .select()
        .single()

      if (error) throw error
      return { data: data as Player, error: null }
    } catch (error: any) {
      return { data: null, error: { message: error.message } }
    }
  },

  /**
   * Link player to coach
   */
  async linkPlayerToCoach(playerId: string, coachId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ coach_id: coachId })
        .eq('id', playerId)
        .select()
        .single()

      if (error) throw error
      return { data: data as Player, error: null }
    } catch (error: any) {
      return { data: null, error: { message: error.message } }
    }
  },

  /**
   * Unlink player from coach
   */
  async unlinkPlayerFromCoach(playerId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ coach_id: null })
        .eq('id', playerId)
        .select()
        .single()

      if (error) throw error
      return { data: data as Player, error: null }
    } catch (error: any) {
      return { data: null, error: { message: error.message } }
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
   * Search players by name or email
   */
  async searchPlayers(query: string, coachId?: string) {
    try {
      let queryBuilder = supabase
        .from('profiles')
        .select('*')
        .eq('role', 'player')
        .or(`display_name.ilike.%${query}%,email.ilike.%${query}%`)

      if (coachId) {
        queryBuilder = queryBuilder.eq('coach_id', coachId)
      }

      const { data, error } = await queryBuilder.order('display_name')

      if (error) throw error
      return { data: data as Player[], error: null }
    } catch (error: any) {
      return { data: null, error: { message: error.message } }
    }
  },

  /**
   * Delete player profile
   */
  async deletePlayer(playerId: string) {
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', playerId)

      if (error) throw error
      return { success: true, error: null }
    } catch (error: any) {
      return { success: false, error: { message: error.message } }
    }
  },
}
