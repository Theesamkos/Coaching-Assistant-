import { supabase } from '@/config/supabase'
import {
  EnhancedPlayer,
  PlayerFormData,
  EnhancedPlayerFilters,
  ApiResponse,
  PrivacySettings,
} from '@/types'

export const playerManagementService = {
  /**
   * Get enhanced player profile with all details
   */
  async getPlayerProfile(playerId: string): Promise<ApiResponse<EnhancedPlayer>> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          teams:team_players(
            team_id,
            team:teams(id, name, season)
          )
        `)
        .eq('id', playerId)
        .single()

      if (error) {
        return { data: null, error: { code: error.code, message: error.message } }
      }

      const player: EnhancedPlayer = this.transformDatabaseToPlayer(data)
      return { data: player, error: null }
    } catch (error: any) {
      return { data: null, error: { code: 'unknown_error', message: error.message } }
    }
  },

  /**
   * Get all players for a coach with filters
   */
  async getCoachPlayersEnhanced(
    coachId: string,
    filters?: EnhancedPlayerFilters
  ): Promise<ApiResponse<EnhancedPlayer[]>> {
    try {
      let query = supabase
        .from('coach_players')
        .select(`
          *,
          player:profiles!coach_players_player_id_fkey(
            *,
            teams:team_players(
              team_id,
              team:teams(id, name, season)
            )
          )
        `)
        .eq('coach_id', coachId)

      // Apply filters
      if (filters?.status) {
        query = query.eq('status', filters.status)
      }

      const { data, error } = await query

      if (error) {
        return { data: null, error: { code: error.code, message: error.message } }
      }

      // Transform and filter
      let players = data
        .map((cp: any) => this.transformDatabaseToPlayer(cp.player))
        .filter((p): p is EnhancedPlayer => p !== null)

      // Apply client-side filters
      if (filters?.searchTerm) {
        const term = filters.searchTerm.toLowerCase()
        players = players.filter(
          (p) =>
            p.displayName.toLowerCase().includes(term) ||
            p.email.toLowerCase().includes(term) ||
            p.position?.toLowerCase().includes(term)
        )
      }

      if (filters?.position) {
        players = players.filter((p) => p.position === filters.position)
      }

      if (filters?.skillLevel) {
        players = players.filter((p) => p.skillLevel === filters.skillLevel)
      }

      if (filters?.teamId) {
        players = players.filter((p) =>
          p.teams?.some((t) => t.teamId === filters.teamId)
        )
      }

      if (filters?.ageMin !== undefined) {
        players = players.filter((p) => (p.age || 0) >= filters.ageMin!)
      }

      if (filters?.ageMax !== undefined) {
        players = players.filter((p) => (p.age || 0) <= filters.ageMax!)
      }

      if (filters?.hasPhoto !== undefined) {
        players = players.filter((p) => (!!p.photoURL) === filters.hasPhoto)
      }

      return { data: players, error: null }
    } catch (error: any) {
      return { data: null, error: { code: 'unknown_error', message: error.message } }
    }
  },

  /**
   * Update player profile (by player or coach)
   */
  async updatePlayerProfile(
    playerId: string,
    updates: Partial<PlayerFormData>
  ): Promise<ApiResponse<EnhancedPlayer>> {
    try {
      const dbUpdates: any = {}

      // Transform camelCase to snake_case
      if (updates.displayName !== undefined) dbUpdates.display_name = updates.displayName
      if (updates.phone !== undefined) dbUpdates.phone = updates.phone
      if (updates.dateOfBirth !== undefined) dbUpdates.date_of_birth = updates.dateOfBirth
      if (updates.position !== undefined) dbUpdates.position = updates.position
      if (updates.jerseyNumber !== undefined) dbUpdates.jersey_number = updates.jerseyNumber
      if (updates.shoots !== undefined) dbUpdates.shoots = updates.shoots
      if (updates.heightInches !== undefined) dbUpdates.height_inches = updates.heightInches
      if (updates.weightLbs !== undefined) dbUpdates.weight_lbs = updates.weightLbs
      if (updates.yearsExperience !== undefined)
        dbUpdates.years_experience = updates.yearsExperience
      if (updates.skillLevel !== undefined) dbUpdates.skill_level = updates.skillLevel

      // Emergency contact
      if (updates.emergencyContactName !== undefined)
        dbUpdates.emergency_contact_name = updates.emergencyContactName
      if (updates.emergencyContactPhone !== undefined)
        dbUpdates.emergency_contact_phone = updates.emergencyContactPhone
      if (updates.emergencyContactRelationship !== undefined)
        dbUpdates.emergency_contact_relationship = updates.emergencyContactRelationship

      // Parent/Guardian
      if (updates.parentName !== undefined) dbUpdates.parent_name = updates.parentName
      if (updates.parentEmail !== undefined) dbUpdates.parent_email = updates.parentEmail
      if (updates.parentPhone !== undefined) dbUpdates.parent_phone = updates.parentPhone

      // Address
      if (updates.addressLine1 !== undefined) dbUpdates.address_line1 = updates.addressLine1
      if (updates.addressLine2 !== undefined) dbUpdates.address_line2 = updates.addressLine2
      if (updates.city !== undefined) dbUpdates.city = updates.city
      if (updates.state !== undefined) dbUpdates.state = updates.state
      if (updates.zipCode !== undefined) dbUpdates.zip_code = updates.zipCode
      if (updates.country !== undefined) dbUpdates.country = updates.country

      // Social media
      if (updates.instagramHandle !== undefined)
        dbUpdates.instagram_handle = updates.instagramHandle
      if (updates.twitterHandle !== undefined) dbUpdates.twitter_handle = updates.twitterHandle

      // Privacy settings
      if (updates.privacySettings !== undefined) {
        dbUpdates.privacy_settings = {
          hide_phone: updates.privacySettings.hidePhone,
          hide_email: updates.privacySettings.hideEmail,
          hide_address: updates.privacySettings.hideAddress,
          hide_social: updates.privacySettings.hideSocial,
          hide_age: updates.privacySettings.hideAge,
          hide_stats: updates.privacySettings.hideStats,
        }
      }

      // Medical notes (coaches only)
      if (updates.medicalNotes !== undefined) dbUpdates.medical_notes = updates.medicalNotes

      const { data, error } = await supabase
        .from('profiles')
        .update(dbUpdates)
        .eq('id', playerId)
        .select()
        .single()

      if (error) {
        return { data: null, error: { code: error.code, message: error.message } }
      }

      const player = this.transformDatabaseToPlayer(data)
      return { data: player, error: null }
    } catch (error: any) {
      return { data: null, error: { code: 'unknown_error', message: error.message } }
    }
  },

  /**
   * Update privacy settings
   */
  async updatePrivacySettings(
    playerId: string,
    settings: PrivacySettings
  ): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          privacy_settings: {
            hide_phone: settings.hidePhone,
            hide_email: settings.hideEmail,
            hide_address: settings.hideAddress,
            hide_social: settings.hideSocial,
            hide_age: settings.hideAge,
            hide_stats: settings.hideStats,
          },
        })
        .eq('id', playerId)

      if (error) {
        return { data: null, error: { code: error.code, message: error.message } }
      }

      return { data: true, error: null }
    } catch (error: any) {
      return { data: null, error: { code: 'unknown_error', message: error.message } }
    }
  },

  /**
   * Check if user can view player's field based on privacy settings
   */
  canViewField(
    player: EnhancedPlayer,
    field: keyof PrivacySettings,
    viewerId: string,
    viewerCoachIds: string[]
  ): boolean {
    // Player can always see their own data
    if (player.id === viewerId) return true

    // Coaches can always see their players' data
    if (viewerCoachIds.length > 0) return true

    // Check privacy settings
    return !player.privacySettings[field]
  },

  /**
   * Get player's visible profile (respecting privacy settings)
   */
  async getVisibleProfile(
    playerId: string,
    viewerId: string,
    viewerCoachIds: string[]
  ): Promise<ApiResponse<Partial<EnhancedPlayer>>> {
    try {
      const { data: player, error } = await this.getPlayerProfile(playerId)

      if (error || !player) {
        return { data: null, error }
      }

      // If viewer is the player or their coach, return full profile
      if (player.id === viewerId || viewerCoachIds.length > 0) {
        return { data: player, error: null }
      }

      // Otherwise, filter based on privacy settings
      const visibleProfile: Partial<EnhancedPlayer> = {
        id: player.id,
        displayName: player.displayName,
        role: player.role,
        photoURL: player.photoURL,
        position: player.position,
        jerseyNumber: player.jerseyNumber,
      }

      if (!player.privacySettings.hideEmail) {
        visibleProfile.email = player.email
      }

      if (!player.privacySettings.hidePhone) {
        visibleProfile.phone = player.phone
      }

      if (!player.privacySettings.hideAddress) {
        visibleProfile.addressLine1 = player.addressLine1
        visibleProfile.city = player.city
        visibleProfile.state = player.state
      }

      if (!player.privacySettings.hideSocial) {
        visibleProfile.instagramHandle = player.instagramHandle
        visibleProfile.twitterHandle = player.twitterHandle
      }

      if (!player.privacySettings.hideAge) {
        visibleProfile.age = player.age
        visibleProfile.dateOfBirth = player.dateOfBirth
      }

      return { data: visibleProfile, error: null }
    } catch (error: any) {
      return { data: null, error: { code: 'unknown_error', message: error.message } }
    }
  },

  /**
   * Transform database row to EnhancedPlayer
   */
  transformDatabaseToPlayer(data: any): EnhancedPlayer {
    if (!data) return null as any

    const privacySettings: PrivacySettings = data.privacy_settings || {
      hidePhone: false,
      hideEmail: false,
      hideAddress: false,
      hideSocial: false,
      hideAge: false,
      hideStats: false,
    }

    // Transform snake_case privacy settings to camelCase
    if (data.privacy_settings) {
      privacySettings.hidePhone = data.privacy_settings.hide_phone ?? false
      privacySettings.hideEmail = data.privacy_settings.hide_email ?? false
      privacySettings.hideAddress = data.privacy_settings.hide_address ?? false
      privacySettings.hideSocial = data.privacy_settings.hide_social ?? false
      privacySettings.hideAge = data.privacy_settings.hide_age ?? false
      privacySettings.hideStats = data.privacy_settings.hide_stats ?? false
    }

    // Calculate age if date_of_birth exists
    let age: number | undefined
    if (data.date_of_birth) {
      const birthDate = new Date(data.date_of_birth)
      const today = new Date()
      age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }
    }

    // Transform teams array
    const teams = data.teams?.map((tp: any) => ({
      teamId: tp.team?.id,
      teamName: tp.team?.name,
      season: tp.team?.season,
    })).filter((t: any) => t.teamId) || []

    return {
      id: data.id,
      email: data.email,
      displayName: data.display_name,
      photoURL: data.photo_url,
      role: data.role,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),

      // Hockey info
      position: data.position,
      jerseyNumber: data.jersey_number,
      shoots: data.shoots,
      heightInches: data.height_inches,
      weightLbs: data.weight_lbs,
      yearsExperience: data.years_experience,
      skillLevel: data.skill_level,

      // Contact
      phone: data.phone,
      dateOfBirth: data.date_of_birth ? new Date(data.date_of_birth) : undefined,

      // Emergency contact
      emergencyContactName: data.emergency_contact_name,
      emergencyContactPhone: data.emergency_contact_phone,
      emergencyContactRelationship: data.emergency_contact_relationship,

      // Parent/Guardian
      parentName: data.parent_name,
      parentEmail: data.parent_email,
      parentPhone: data.parent_phone,

      // Address
      addressLine1: data.address_line1,
      addressLine2: data.address_line2,
      city: data.city,
      state: data.state,
      zipCode: data.zip_code,
      country: data.country,

      // Social
      instagramHandle: data.instagram_handle,
      twitterHandle: data.twitter_handle,

      // Privacy
      privacySettings,

      // Medical (coaches only)
      medicalNotes: data.medical_notes,

      // Computed
      age,
      teams: teams.length > 0 ? teams : undefined,
    }
  },
}

