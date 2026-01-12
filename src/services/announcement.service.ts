import { supabase } from '@/config/supabase'
import {
  Announcement,
  AnnouncementFormData,
  AnnouncementRead,
  TeamMessage,
  TeamMessageFormData,
  MessageReaction,
  ReactionType,
  ApiResponse,
  User,
} from '@/types'

export const announcementService = {
  /**
   * Create a new announcement
   */
  async createAnnouncement(
    coachId: string,
    announcementData: AnnouncementFormData
  ): Promise<ApiResponse<Announcement>> {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .insert({
          coach_id: coachId,
          title: announcementData.title,
          content: announcementData.content,
          priority: announcementData.priority,
          target_audience: announcementData.targetAudience,
          target_team_id: announcementData.targetTeamId || null,
          target_player_id: announcementData.targetPlayerId || null,
          related_practice_id: announcementData.relatedPracticeId || null,
          is_pinned: announcementData.isPinned || false,
          expires_at: announcementData.expiresAt?.toISOString() || null,
        })
        .select()
        .single()

      if (error) {
        return { data: null, error: { code: error.code, message: error.message } }
      }

      const announcement: Announcement = {
        id: data.id,
        coachId: data.coach_id,
        title: data.title,
        content: data.content,
        priority: data.priority,
        targetAudience: data.target_audience,
        targetTeamId: data.target_team_id,
        targetPlayerId: data.target_player_id,
        relatedPracticeId: data.related_practice_id,
        isPinned: data.is_pinned,
        publishedAt: new Date(data.published_at),
        expiresAt: data.expires_at ? new Date(data.expires_at) : null,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      }

      return { data: announcement, error: null }
    } catch (error: any) {
      return { data: null, error: { code: 'unknown_error', message: error.message } }
    }
  },

  /**
   * Get announcements for a coach
   */
  async getCoachAnnouncements(coachId: string): Promise<ApiResponse<Announcement[]>> {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select(`
          *,
          coach:profiles!announcements_coach_id_fkey(*),
          target_team:teams!announcements_target_team_id_fkey(*),
          target_player:profiles!announcements_target_player_id_fkey(*),
          related_practice:practices!announcements_related_practice_id_fkey(*)
        `)
        .eq('coach_id', coachId)
        .order('is_pinned', { ascending: false })
        .order('published_at', { ascending: false })

      if (error) {
        return { data: null, error: { code: error.code, message: error.message } }
      }

      const announcements: Announcement[] = data.map((item: any) => ({
        id: item.id,
        coachId: item.coach_id,
        title: item.title,
        content: item.content,
        priority: item.priority,
        targetAudience: item.target_audience,
        targetTeamId: item.target_team_id,
        targetPlayerId: item.target_player_id,
        relatedPracticeId: item.related_practice_id,
        isPinned: item.is_pinned,
        publishedAt: new Date(item.published_at),
        expiresAt: item.expires_at ? new Date(item.expires_at) : null,
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

      return { data: announcements, error: null }
    } catch (error: any) {
      return { data: null, error: { code: 'unknown_error', message: error.message } }
    }
  },

  /**
   * Get announcements for a player
   */
  async getPlayerAnnouncements(playerId: string): Promise<ApiResponse<Announcement[]>> {
    try {
      const { data, error} = await supabase
        .from('announcements')
        .select(`
          *,
          coach:profiles!announcements_coach_id_fkey(*),
          announcement_reads(*)
        `)
        .or(`target_audience.eq.all,and(target_audience.eq.individual,target_player_id.eq.${playerId})`)
        .order('is_pinned', { ascending: false })
        .order('published_at', { ascending: false })

      if (error) {
        return { data: null, error: { code: error.code, message: error.message } }
      }

      const announcements: Announcement[] = data.map((item: any) => ({
        id: item.id,
        coachId: item.coach_id,
        title: item.title,
        content: item.content,
        priority: item.priority,
        targetAudience: item.target_audience,
        targetTeamId: item.target_team_id,
        targetPlayerId: item.target_player_id,
        relatedPracticeId: item.related_practice_id,
        isPinned: item.is_pinned,
        publishedAt: new Date(item.published_at),
        expiresAt: item.expires_at ? new Date(item.expires_at) : null,
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
        isRead: item.announcement_reads?.some((r: any) => r.player_id === playerId) || false,
      }))

      return { data: announcements, error: null }
    } catch (error: any) {
      return { data: null, error: { code: 'unknown_error', message: error.message } }
    }
  },

  /**
   * Update an announcement
   */
  async updateAnnouncement(
    announcementId: string,
    announcementData: Partial<AnnouncementFormData>
  ): Promise<ApiResponse<Announcement>> {
    try {
      const updates: any = {}
      if (announcementData.title !== undefined) updates.title = announcementData.title
      if (announcementData.content !== undefined) updates.content = announcementData.content
      if (announcementData.priority !== undefined) updates.priority = announcementData.priority
      if (announcementData.isPinned !== undefined) updates.is_pinned = announcementData.isPinned
      if (announcementData.expiresAt !== undefined) {
        updates.expires_at = announcementData.expiresAt?.toISOString() || null
      }

      const { data, error } = await supabase
        .from('announcements')
        .update(updates)
        .eq('id', announcementId)
        .select()
        .single()

      if (error) {
        return { data: null, error: { code: error.code, message: error.message } }
      }

      const announcement: Announcement = {
        id: data.id,
        coachId: data.coach_id,
        title: data.title,
        content: data.content,
        priority: data.priority,
        targetAudience: data.target_audience,
        targetTeamId: data.target_team_id,
        targetPlayerId: data.target_player_id,
        relatedPracticeId: data.related_practice_id,
        isPinned: data.is_pinned,
        publishedAt: new Date(data.published_at),
        expiresAt: data.expires_at ? new Date(data.expires_at) : null,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      }

      return { data: announcement, error: null }
    } catch (error: any) {
      return { data: null, error: { code: 'unknown_error', message: error.message } }
    }
  },

  /**
   * Delete an announcement
   */
  async deleteAnnouncement(announcementId: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', announcementId)

      if (error) {
        return { data: null, error: { code: error.code, message: error.message } }
      }

      return { data: undefined, error: null }
    } catch (error: any) {
      return { data: null, error: { code: 'unknown_error', message: error.message } }
    }
  },

  /**
   * Mark announcement as read
   */
  async markAsRead(announcementId: string, playerId: string): Promise<ApiResponse<AnnouncementRead>> {
    try {
      const { data, error } = await supabase
        .from('announcement_reads')
        .upsert({
          announcement_id: announcementId,
          player_id: playerId,
        })
        .select()
        .single()

      if (error) {
        return { data: null, error: { code: error.code, message: error.message } }
      }

      const read: AnnouncementRead = {
        id: data.id,
        announcementId: data.announcement_id,
        playerId: data.player_id,
        readAt: new Date(data.read_at),
        createdAt: new Date(data.created_at),
      }

      return { data: read, error: null }
    } catch (error: any) {
      return { data: null, error: { code: 'unknown_error', message: error.message } }
    }
  },

  /**
   * Get unread announcement count for a player
   */
  async getUnreadCount(playerId: string): Promise<ApiResponse<number>> {
    try {
      // Get all announcements for player
      const { data: announcements, error: announcementsError } = await supabase
        .from('announcements')
        .select('id')
        .or(`target_audience.eq.all,and(target_audience.eq.individual,target_player_id.eq.${playerId})`)

      if (announcementsError) {
        return { data: null, error: { code: announcementsError.code, message: announcementsError.message } }
      }

      // Get read announcements
      const { data: reads, error: readsError } = await supabase
        .from('announcement_reads')
        .select('announcement_id')
        .eq('player_id', playerId)

      if (readsError) {
        return { data: null, error: { code: readsError.code, message: readsError.message } }
      }

      const readIds = new Set(reads?.map((r) => r.announcement_id) || [])
      const unreadCount = announcements?.filter((a) => !readIds.has(a.id)).length || 0

      return { data: unreadCount, error: null }
    } catch (error: any) {
      return { data: null, error: { code: 'unknown_error', message: error.message } }
    }
  },

  /**
   * Create a team message
   */
  async createTeamMessage(
    authorId: string,
    messageData: TeamMessageFormData
  ): Promise<ApiResponse<TeamMessage>> {
    try {
      const { data, error } = await supabase
        .from('team_messages')
        .insert({
          author_id: authorId,
          team_id: messageData.teamId || null,
          coach_id: messageData.coachId || null,
          content: messageData.content,
          is_coach_only: messageData.isCoachOnly || false,
        })
        .select(`
          *,
          author:profiles!team_messages_author_id_fkey(*)
        `)
        .single()

      if (error) {
        return { data: null, error: { code: error.code, message: error.message } }
      }

      const message: TeamMessage = {
        id: data.id,
        authorId: data.author_id,
        teamId: data.team_id,
        coachId: data.coach_id,
        content: data.content,
        isCoachOnly: data.is_coach_only,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        author: data.author ? {
          id: data.author.id,
          email: data.author.email,
          displayName: data.author.display_name,
          photoURL: data.author.photo_url,
          role: data.author.role,
          createdAt: new Date(data.author.created_at),
          updatedAt: new Date(data.author.updated_at),
        } as User : undefined,
      }

      return { data: message, error: null }
    } catch (error: any) {
      return { data: null, error: { code: 'unknown_error', message: error.message } }
    }
  },

  /**
   * Get team messages
   */
  async getTeamMessages(teamId: string): Promise<ApiResponse<TeamMessage[]>> {
    try {
      const { data, error } = await supabase
        .from('team_messages')
        .select(`
          *,
          author:profiles!team_messages_author_id_fkey(*),
          reactions:message_reactions(*)
        `)
        .eq('team_id', teamId)
        .order('created_at', { ascending: false })

      if (error) {
        return { data: null, error: { code: error.code, message: error.message } }
      }

      const messages: TeamMessage[] = data.map((item: any) => ({
        id: item.id,
        authorId: item.author_id,
        teamId: item.team_id,
        coachId: item.coach_id,
        content: item.content,
        isCoachOnly: item.is_coach_only,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at),
        author: item.author ? {
          id: item.author.id,
          email: item.author.email,
          displayName: item.author.display_name,
          photoURL: item.author.photo_url,
          role: item.author.role,
          createdAt: new Date(item.author.created_at),
          updatedAt: new Date(item.author.updated_at),
        } as User : undefined,
        reactions: item.reactions || [],
      }))

      return { data: messages, error: null }
    } catch (error: any) {
      return { data: null, error: { code: 'unknown_error', message: error.message } }
    }
  },

  /**
   * Add reaction to message
   */
  async addReaction(
    messageId: string,
    userId: string,
    reaction: ReactionType
  ): Promise<ApiResponse<MessageReaction>> {
    try {
      const { data, error } = await supabase
        .from('message_reactions')
        .upsert({
          message_id: messageId,
          user_id: userId,
          reaction,
        })
        .select()
        .single()

      if (error) {
        return { data: null, error: { code: error.code, message: error.message } }
      }

      const messageReaction: MessageReaction = {
        id: data.id,
        messageId: data.message_id,
        userId: data.user_id,
        reaction: data.reaction,
        createdAt: new Date(data.created_at),
      }

      return { data: messageReaction, error: null }
    } catch (error: any) {
      return { data: null, error: { code: 'unknown_error', message: error.message } }
    }
  },

  /**
   * Remove reaction from message
   */
  async removeReaction(messageId: string, userId: string, reaction: ReactionType): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('message_reactions')
        .delete()
        .eq('message_id', messageId)
        .eq('user_id', userId)
        .eq('reaction', reaction)

      if (error) {
        return { data: null, error: { code: error.code, message: error.message } }
      }

      return { data: undefined, error: null }
    } catch (error: any) {
      return { data: null, error: { code: 'unknown_error', message: error.message } }
    }
  },
}
