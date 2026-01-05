import { supabase } from '@/config/supabase'
import { 
  CoachPlayer, 
  User, 
  InvitationStatus,
  ApiResponse,
  CoachWithPlayers,
  PlayerWithCoaches 
} from '@/types'

export const playerService = {
  /**
   * Get all players for a specific coach
   */
  async getCoachPlayers(coachId: string): Promise<ApiResponse<CoachPlayer[]>> {
    try {
      const { data, error } = await supabase
        .from('coach_players')
        .select(`
          *,
          player:profiles!coach_players_player_id_fkey(*)
        `)
        .eq('coach_id', coachId)
        .order('created_at', { ascending: false })

      if (error) {
        return { data: null, error: { code: error.code, message: error.message } }
      }

      // Transform the data to match our types
      const coachPlayers: CoachPlayer[] = data.map((item: any) => ({
        id: item.id,
        coachId: item.coach_id,
        playerId: item.player_id,
        invitationToken: item.invitation_token,
        status: item.status as InvitationStatus,
        invitedAt: new Date(item.invited_at),
        acceptedAt: item.accepted_at ? new Date(item.accepted_at) : null,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at),
        player: item.player ? {
          id: item.player.id,
          email: item.player.email,
          displayName: item.player.display_name,
          photoURL: item.player.photo_url,
          role: item.player.role,
          createdAt: new Date(item.player.created_at),
          updatedAt: new Date(item.player.updated_at),
        } as User : undefined,
      }))

      return { data: coachPlayers, error: null }
    } catch (error: any) {
      return { data: null, error: { code: 'unknown_error', message: error.message } }
    }
  },

  /**
   * Get all coaches for a specific player
   */
  async getPlayerCoaches(playerId: string): Promise<ApiResponse<CoachPlayer[]>> {
    try {
      const { data, error } = await supabase
        .from('coach_players')
        .select(`
          *,
          coach:profiles!coach_players_coach_id_fkey(*)
        `)
        .eq('player_id', playerId)
        .eq('status', 'accepted')
        .order('created_at', { ascending: false })

      if (error) {
        return { data: null, error: { code: error.code, message: error.message } }
      }

      const coachPlayers: CoachPlayer[] = data.map((item: any) => ({
        id: item.id,
        coachId: item.coach_id,
        playerId: item.player_id,
        invitationToken: item.invitation_token,
        status: item.status as InvitationStatus,
        invitedAt: new Date(item.invited_at),
        acceptedAt: item.accepted_at ? new Date(item.accepted_at) : null,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at),
        coach: item.coach ? {
          id: item.coach.id,
          email: item.coach.email,
          displayName: item.coach.display_name,
          photoURL: item.coach.photo_url,
          role: item.coach.role,
          createdAt: new Date(item.coach.created_at),
          updatedAt: new Date(item.coach.updated_at),
        } as User : undefined,
      }))

      return { data: coachPlayers, error: null }
    } catch (error: any) {
      return { data: null, error: { code: 'unknown_error', message: error.message } }
    }
  },

  /**
   * Invite a player by email
   * Creates a pending coach_players relationship with invitation token
   */
  async invitePlayer(
    coachId: string, 
    playerEmail: string
  ): Promise<ApiResponse<CoachPlayer>> {
    try {
      // First, check if player with this email exists
      const { data: playerData, error: playerError } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('email', playerEmail)
        .single()

      if (playerError && playerError.code !== 'PGRST116') {
        return { data: null, error: { code: playerError.code, message: playerError.message } }
      }

      // If player doesn't exist, return error
      if (!playerData) {
        return { 
          data: null, 
          error: { 
            code: 'player_not_found', 
            message: 'No user found with that email. They need to register first.' 
          } 
        }
      }

      // Check if player role is correct
      if (playerData.role !== 'player') {
        return { 
          data: null, 
          error: { 
            code: 'invalid_role', 
            message: 'This user is not registered as a player.' 
          } 
        }
      }

      // Check if relationship already exists
      const { data: existingRelation } = await supabase
        .from('coach_players')
        .select('*')
        .eq('coach_id', coachId)
        .eq('player_id', playerData.id)
        .single()

      if (existingRelation) {
        return { 
          data: null, 
          error: { 
            code: 'already_invited', 
            message: 'This player has already been invited or is already on your roster.' 
          } 
        }
      }

      // Generate invitation token
      const { data: tokenData } = await supabase.rpc('generate_invitation_token')
      const invitationToken = tokenData as string

      // Create the coach_players relationship
      const { data, error } = await supabase
        .from('coach_players')
        .insert({
          coach_id: coachId,
          player_id: playerData.id,
          invitation_token: invitationToken,
          status: 'pending',
        })
        .select()
        .single()

      if (error) {
        return { data: null, error: { code: error.code, message: error.message } }
      }

      const coachPlayer: CoachPlayer = {
        id: data.id,
        coachId: data.coach_id,
        playerId: data.player_id,
        invitationToken: data.invitation_token,
        status: data.status as InvitationStatus,
        invitedAt: new Date(data.invited_at),
        acceptedAt: data.accepted_at ? new Date(data.accepted_at) : null,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      }

      return { data: coachPlayer, error: null }
    } catch (error: any) {
      return { data: null, error: { code: 'unknown_error', message: error.message } }
    }
  },

  /**
   * Accept an invitation using the token
   */
  async acceptInvitation(
    token: string, 
    playerId: string
  ): Promise<ApiResponse<CoachPlayer>> {
    try {
      // Find the invitation
      const { data: invitation, error: findError } = await supabase
        .from('coach_players')
        .select('*')
        .eq('invitation_token', token)
        .eq('player_id', playerId)
        .single()

      if (findError || !invitation) {
        return { 
          data: null, 
          error: { 
            code: 'invalid_token', 
            message: 'Invalid or expired invitation.' 
          } 
        }
      }

      // Check if already accepted
      if (invitation.status === 'accepted') {
        return { 
          data: null, 
          error: { 
            code: 'already_accepted', 
            message: 'This invitation has already been accepted.' 
          } 
        }
      }

      // Accept the invitation
      const { data, error } = await supabase
        .from('coach_players')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString(),
        })
        .eq('id', invitation.id)
        .select()
        .single()

      if (error) {
        return { data: null, error: { code: error.code, message: error.message } }
      }

      const coachPlayer: CoachPlayer = {
        id: data.id,
        coachId: data.coach_id,
        playerId: data.player_id,
        invitationToken: data.invitation_token,
        status: data.status as InvitationStatus,
        invitedAt: new Date(data.invited_at),
        acceptedAt: data.accepted_at ? new Date(data.accepted_at) : null,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      }

      return { data: coachPlayer, error: null }
    } catch (error: any) {
      return { data: null, error: { code: 'unknown_error', message: error.message } }
    }
  },

  /**
   * Decline an invitation
   */
  async declineInvitation(
    token: string, 
    playerId: string
  ): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('coach_players')
        .update({ status: 'declined' })
        .eq('invitation_token', token)
        .eq('player_id', playerId)

      if (error) {
        return { data: null, error: { code: error.code, message: error.message } }
      }

      return { data: true, error: null }
    } catch (error: any) {
      return { data: null, error: { code: 'unknown_error', message: error.message } }
    }
  },

  /**
   * Remove a player from coach's roster
   */
  async removePlayer(
    coachId: string, 
    playerId: string
  ): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('coach_players')
        .delete()
        .eq('coach_id', coachId)
        .eq('player_id', playerId)

      if (error) {
        return { data: null, error: { code: error.code, message: error.message } }
      }

      return { data: true, error: null }
    } catch (error: any) {
      return { data: null, error: { code: 'unknown_error', message: error.message } }
    }
  },

  /**
   * Get invitation by token (for verification)
   */
  async getInvitationByToken(token: string): Promise<ApiResponse<CoachPlayer>> {
    try {
      const { data, error } = await supabase
        .from('coach_players')
        .select(`
          *,
          coach:profiles!coach_players_coach_id_fkey(*)
        `)
        .eq('invitation_token', token)
        .single()

      if (error) {
        return { data: null, error: { code: error.code, message: error.message } }
      }

      const coachPlayer: CoachPlayer = {
        id: data.id,
        coachId: data.coach_id,
        playerId: data.player_id,
        invitationToken: data.invitation_token,
        status: data.status as InvitationStatus,
        invitedAt: new Date(data.invited_at),
        acceptedAt: data.accepted_at ? new Date(data.accepted_at) : null,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        coach: data.coach ? {
          id: data.coach.id,
          email: data.coach.email,
          displayName: data.coach.display_name,
          photoURL: data.coach.photo_url,
          role: data.coach.role,
          createdAt: new Date(data.coach.created_at),
          updatedAt: new Date(data.coach.updated_at),
        } as User : undefined,
      }

      return { data: coachPlayer, error: null }
    } catch (error: any) {
      return { data: null, error: { code: 'unknown_error', message: error.message } }
    }
  },
}

