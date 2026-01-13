import { supabase } from '@/config/supabase'
import { CoachNote, CoachNoteFormData, NoteFilters, ApiResponse } from '@/types'

export const noteService = {
  /**
   * Create a new note
   */
  async createNote(
    coachId: string,
    playerId: string,
    noteData: CoachNoteFormData
  ): Promise<ApiResponse<CoachNote>> {
    try {
      const { data, error } = await supabase
        .from('coach_notes')
        .insert({
          coach_id: coachId,
          player_id: playerId,
          note_type: noteData.noteType,
          content: noteData.content,
          tags: noteData.tags || [],
          is_visible_to_player: noteData.isVisibleToPlayer || false,
        })
        .select()
        .single()

      if (error) {
        return { data: null, error: { code: error.code, message: error.message } }
      }

      const note: CoachNote = {
        id: data.id,
        coachId: data.coach_id,
        playerId: data.player_id,
        noteType: data.note_type,
        content: data.content,
        tags: data.tags || [],
        isVisibleToPlayer: data.is_visible_to_player,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      }

      return { data: note, error: null }
    } catch (error: any) {
      return { data: null, error: { code: 'unknown_error', message: error.message } }
    }
  },

  /**
   * Get notes for a player (coach view)
   */
  async getPlayerNotes(
    playerId: string,
    coachId?: string,
    filters?: NoteFilters
  ): Promise<ApiResponse<CoachNote[]>> {
    try {
      let query = supabase
        .from('coach_notes')
        .select(`
          *,
          coach:profiles!coach_notes_coach_id_fkey(id, display_name, email),
          player:profiles!coach_notes_player_id_fkey(id, display_name, email)
        `)
        .eq('player_id', playerId)
      
      // Only filter by coach if coachId is provided
      if (coachId) {
        query = query.eq('coach_id', coachId)
      }

      // Apply filters
      if (filters?.noteType) {
        query = query.eq('note_type', filters.noteType)
      }

      if (filters?.isVisibleToPlayer !== undefined) {
        query = query.eq('is_visible_to_player', filters.isVisibleToPlayer)
      }

      if (filters?.tags && filters.tags.length > 0) {
        query = query.contains('tags', filters.tags)
      }

      query = query.order('created_at', { ascending: false })

      const { data, error } = await query

      if (error) {
        return { data: null, error: { code: error.code, message: error.message } }
      }

      // Apply search filter client-side
      let notes = data.map((item: any) => this.transformDatabaseToNote(item))

      if (filters?.searchTerm) {
        const term = filters.searchTerm.toLowerCase()
        notes = notes.filter((note) => note.content.toLowerCase().includes(term))
      }

      return { data: notes, error: null }
    } catch (error: any) {
      return { data: null, error: { code: 'unknown_error', message: error.message } }
    }
  },

  /**
   * Get notes visible to player (player view)
   */
  async getVisibleNotesForPlayer(playerId: string): Promise<ApiResponse<CoachNote[]>> {
    try {
      const { data, error } = await supabase
        .from('coach_notes')
        .select(`
          *,
          coach:profiles!coach_notes_coach_id_fkey(id, display_name, email)
        `)
        .eq('player_id', playerId)
        .eq('is_visible_to_player', true)
        .order('created_at', { ascending: false })

      if (error) {
        return { data: null, error: { code: error.code, message: error.message } }
      }

      const notes = data.map((item: any) => this.transformDatabaseToNote(item))
      return { data: notes, error: null }
    } catch (error: any) {
      return { data: null, error: { code: 'unknown_error', message: error.message } }
    }
  },

  /**
   * Get all notes by a coach (across all players)
   */
  async getCoachNotes(coachId: string, filters?: NoteFilters): Promise<ApiResponse<CoachNote[]>> {
    try {
      let query = supabase
        .from('coach_notes')
        .select(`
          *,
          player:profiles!coach_notes_player_id_fkey(id, display_name, email, position)
        `)
        .eq('coach_id', coachId)

      // Apply filters
      if (filters?.noteType) {
        query = query.eq('note_type', filters.noteType)
      }

      if (filters?.playerId) {
        query = query.eq('player_id', filters.playerId)
      }

      if (filters?.tags && filters.tags.length > 0) {
        query = query.contains('tags', filters.tags)
      }

      query = query.order('created_at', { ascending: false })

      const { data, error } = await query

      if (error) {
        return { data: null, error: { code: error.code, message: error.message } }
      }

      // Apply search filter client-side
      let notes = data.map((item: any) => this.transformDatabaseToNote(item))

      if (filters?.searchTerm) {
        const term = filters.searchTerm.toLowerCase()
        notes = notes.filter((note) => note.content.toLowerCase().includes(term))
      }

      return { data: notes, error: null }
    } catch (error: any) {
      return { data: null, error: { code: 'unknown_error', message: error.message } }
    }
  },

  /**
   * Update a note
   */
  async updateNote(
    noteId: string,
    updates: Partial<CoachNoteFormData>
  ): Promise<ApiResponse<CoachNote>> {
    try {
      const dbUpdates: any = {}

      if (updates.noteType !== undefined) dbUpdates.note_type = updates.noteType
      if (updates.content !== undefined) dbUpdates.content = updates.content
      if (updates.tags !== undefined) dbUpdates.tags = updates.tags
      if (updates.isVisibleToPlayer !== undefined)
        dbUpdates.is_visible_to_player = updates.isVisibleToPlayer

      const { data, error } = await supabase
        .from('coach_notes')
        .update(dbUpdates)
        .eq('id', noteId)
        .select()
        .single()

      if (error) {
        return { data: null, error: { code: error.code, message: error.message } }
      }

      const note = this.transformDatabaseToNote(data)
      return { data: note, error: null }
    } catch (error: any) {
      return { data: null, error: { code: 'unknown_error', message: error.message } }
    }
  },

  /**
   * Delete a note
   */
  async deleteNote(noteId: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase.from('coach_notes').delete().eq('id', noteId)

      if (error) {
        return { data: null, error: { code: error.code, message: error.message } }
      }

      return { data: true, error: null }
    } catch (error: any) {
      return { data: null, error: { code: 'unknown_error', message: error.message } }
    }
  },

  /**
   * Toggle note visibility to player
   */
  async toggleNoteVisibility(
    noteId: string,
    isVisible: boolean
  ): Promise<ApiResponse<CoachNote>> {
    try {
      const { data, error } = await supabase
        .from('coach_notes')
        .update({ is_visible_to_player: isVisible })
        .eq('id', noteId)
        .select()
        .single()

      if (error) {
        return { data: null, error: { code: error.code, message: error.message } }
      }

      const note = this.transformDatabaseToNote(data)
      return { data: note, error: null }
    } catch (error: any) {
      return { data: null, error: { code: 'unknown_error', message: error.message } }
    }
  },

  /**
   * Get all unique tags used by a coach
   */
  async getCoachTags(coachId: string): Promise<ApiResponse<string[]>> {
    try {
      const { data, error } = await supabase
        .from('coach_notes')
        .select('tags')
        .eq('coach_id', coachId)

      if (error) {
        return { data: null, error: { code: error.code, message: error.message } }
      }

      // Flatten and deduplicate tags
      const allTags = data.flatMap((note: any) => note.tags || [])
      const uniqueTags = [...new Set(allTags)].sort()

      return { data: uniqueTags, error: null }
    } catch (error: any) {
      return { data: null, error: { code: 'unknown_error', message: error.message } }
    }
  },

  /**
   * Transform database row to CoachNote
   */
  transformDatabaseToNote(data: any): CoachNote {
    return {
      id: data.id,
      coachId: data.coach_id,
      playerId: data.player_id,
      noteType: data.note_type,
      content: data.content,
      tags: data.tags || [],
      isVisibleToPlayer: data.is_visible_to_player,
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

