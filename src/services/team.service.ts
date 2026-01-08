import { supabase } from '@/config/supabase'
import { Team, TeamFormData, TeamPlayer, ApiResponse } from '@/types'

export const teamService = {
  /**
   * Create a new team
   */
  async createTeam(coachId: string, teamData: TeamFormData): Promise<ApiResponse<Team>> {
    try {
      const { data, error } = await supabase
        .from('teams')
        .insert({
          coach_id: coachId,
          name: teamData.name,
          description: teamData.description || null,
          season: teamData.season || null,
          photo_url: teamData.photoUrl || null,
        })
        .select()
        .single()

      if (error) {
        return { data: null, error: { code: error.code, message: error.message } }
      }

      const team: Team = {
        id: data.id,
        coachId: data.coach_id,
        name: data.name,
        description: data.description,
        season: data.season,
        photoUrl: data.photo_url,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      }

      return { data: team, error: null }
    } catch (error: any) {
      return { data: null, error: { code: 'unknown_error', message: error.message } }
    }
  },

  /**
   * Get all teams for a coach
   */
  async getCoachTeams(coachId: string): Promise<ApiResponse<Team[]>> {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select(`
          *,
          players:team_players(count)
        `)
        .eq('coach_id', coachId)
        .order('created_at', { ascending: false })

      if (error) {
        return { data: null, error: { code: error.code, message: error.message } }
      }

      const teams: Team[] = data.map((item: any) => ({
        id: item.id,
        coachId: item.coach_id,
        name: item.name,
        description: item.description,
        season: item.season,
        photoUrl: item.photo_url,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at),
        playerCount: item.players[0]?.count || 0,
      }))

      return { data: teams, error: null }
    } catch (error: any) {
      return { data: null, error: { code: 'unknown_error', message: error.message } }
    }
  },

  /**
   * Get team with full roster
   */
  async getTeamWithRoster(teamId: string): Promise<ApiResponse<Team>> {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select(`
          *,
          players:team_players(
            id,
            player_id,
            joined_at,
            created_at,
            player:profiles(
              id,
              email,
              display_name,
              photo_url,
              position,
              jersey_number
            )
          )
        `)
        .eq('id', teamId)
        .single()

      if (error) {
        return { data: null, error: { code: error.code, message: error.message } }
      }

      const team: Team = {
        id: data.id,
        coachId: data.coach_id,
        name: data.name,
        description: data.description,
        season: data.season,
        photoUrl: data.photo_url,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        players: data.players.map((tp: any) => ({
          id: tp.id,
          teamId: data.id,
          playerId: tp.player_id,
          joinedAt: new Date(tp.joined_at),
          createdAt: new Date(tp.created_at),
          player: tp.player ? {
            id: tp.player.id,
            email: tp.player.email,
            displayName: tp.player.display_name,
            photoURL: tp.player.photo_url,
            role: 'player',
            position: tp.player.position,
            jerseyNumber: tp.player.jersey_number,
            createdAt: new Date(),
            updatedAt: new Date(),
          } : undefined,
        })),
        playerCount: data.players.length,
      }

      return { data: team, error: null }
    } catch (error: any) {
      return { data: null, error: { code: 'unknown_error', message: error.message } }
    }
  },

  /**
   * Update team
   */
  async updateTeam(
    teamId: string,
    updates: Partial<TeamFormData>
  ): Promise<ApiResponse<Team>> {
    try {
      const dbUpdates: any = {}

      if (updates.name !== undefined) dbUpdates.name = updates.name
      if (updates.description !== undefined) dbUpdates.description = updates.description
      if (updates.season !== undefined) dbUpdates.season = updates.season
      if (updates.photoUrl !== undefined) dbUpdates.photo_url = updates.photoUrl

      const { data, error } = await supabase
        .from('teams')
        .update(dbUpdates)
        .eq('id', teamId)
        .select()
        .single()

      if (error) {
        return { data: null, error: { code: error.code, message: error.message } }
      }

      const team: Team = {
        id: data.id,
        coachId: data.coach_id,
        name: data.name,
        description: data.description,
        season: data.season,
        photoUrl: data.photo_url,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      }

      return { data: team, error: null }
    } catch (error: any) {
      return { data: null, error: { code: 'unknown_error', message: error.message } }
    }
  },

  /**
   * Delete team
   */
  async deleteTeam(teamId: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase.from('teams').delete().eq('id', teamId)

      if (error) {
        return { data: null, error: { code: error.code, message: error.message } }
      }

      return { data: true, error: null }
    } catch (error: any) {
      return { data: null, error: { code: 'unknown_error', message: error.message } }
    }
  },

  /**
   * Add player to team
   */
  async addPlayerToTeam(teamId: string, playerId: string): Promise<ApiResponse<TeamPlayer>> {
    try {
      const { data, error} = await supabase
        .from('team_players')
        .insert({
          team_id: teamId,
          player_id: playerId,
        })
        .select()
        .single()

      if (error) {
        return { data: null, error: { code: error.code, message: error.message } }
      }

      const teamPlayer: TeamPlayer = {
        id: data.id,
        teamId: data.team_id,
        playerId: data.player_id,
        joinedAt: new Date(data.joined_at),
        createdAt: new Date(data.created_at),
      }

      return { data: teamPlayer, error: null }
    } catch (error: any) {
      return { data: null, error: { code: 'unknown_error', message: error.message } }
    }
  },

  /**
   * Add multiple players to team
   */
  async addPlayersToTeam(
    teamId: string,
    playerIds: string[]
  ): Promise<ApiResponse<TeamPlayer[]>> {
    try {
      const inserts = playerIds.map((playerId) => ({
        team_id: teamId,
        player_id: playerId,
      }))

      const { data, error } = await supabase
        .from('team_players')
        .insert(inserts)
        .select()

      if (error) {
        return { data: null, error: { code: error.code, message: error.message } }
      }

      const teamPlayers: TeamPlayer[] = data.map((item: any) => ({
        id: item.id,
        teamId: item.team_id,
        playerId: item.player_id,
        joinedAt: new Date(item.joined_at),
        createdAt: new Date(item.created_at),
      }))

      return { data: teamPlayers, error: null }
    } catch (error: any) {
      return { data: null, error: { code: 'unknown_error', message: error.message } }
    }
  },

  /**
   * Remove player from team
   */
  async removePlayerFromTeam(teamPlayerId: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('team_players')
        .delete()
        .eq('id', teamPlayerId)

      if (error) {
        return { data: null, error: { code: error.code, message: error.message } }
      }

      return { data: true, error: null }
    } catch (error: any) {
      return { data: null, error: { code: 'unknown_error', message: error.message } }
    }
  },

  /**
   * Get teams for a player
   */
  async getPlayerTeams(playerId: string): Promise<ApiResponse<Team[]>> {
    try {
      const { data, error } = await supabase
        .from('team_players')
        .select(`
          *,
          team:teams(*)
        `)
        .eq('player_id', playerId)

      if (error) {
        return { data: null, error: { code: error.code, message: error.message } }
      }

      const teams: Team[] = data.map((tp: any) => ({
        id: tp.team.id,
        coachId: tp.team.coach_id,
        name: tp.team.name,
        description: tp.team.description,
        season: tp.team.season,
        photoUrl: tp.team.photo_url,
        createdAt: new Date(tp.team.created_at),
        updatedAt: new Date(tp.team.updated_at),
      }))

      return { data: teams, error: null }
    } catch (error: any) {
      return { data: null, error: { code: 'unknown_error', message: error.message } }
    }
  },
}

