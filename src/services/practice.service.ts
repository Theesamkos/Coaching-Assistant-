import { supabase } from '@/config/supabase'
import { 
  Practice, 
  PracticeFormData, 
  PracticeFilters, 
  PracticeDrill,
  PracticeDrillFormData,
  PracticePlayer,
  PracticeWithDetails,
  ApiResponse,
  AttendanceStatus,
  Drill,
  User 
} from '@/types'

export const practiceService = {
  /**
   * Create a new practice
   */
  async createPractice(
    coachId: string, 
    practiceData: PracticeFormData
  ): Promise<ApiResponse<Practice>> {
    try {
      const { data, error } = await supabase
        .from('practices')
        .insert({
          coach_id: coachId,
          title: practiceData.title,
          description: practiceData.description || null,
          scheduled_date: practiceData.scheduledDate.toISOString(),
          duration_minutes: practiceData.durationMinutes || null,
          location: practiceData.location || null,
          notes: practiceData.notes || null,
          status: practiceData.status || 'scheduled',
        })
        .select()
        .single()

      if (error) {
        return { data: null, error: { code: error.code, message: error.message } }
      }

      const practice: Practice = {
        id: data.id,
        coachId: data.coach_id,
        title: data.title,
        description: data.description,
        scheduledDate: new Date(data.scheduled_date),
        durationMinutes: data.duration_minutes,
        location: data.location,
        notes: data.notes,
        status: data.status,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      }

      return { data: practice, error: null }
    } catch (error: any) {
      return { data: null, error: { code: 'unknown_error', message: error.message } }
    }
  },

  /**
   * Get practices for a coach with optional filters
   */
  async getPractices(
    coachId: string, 
    filters?: PracticeFilters
  ): Promise<ApiResponse<Practice[]>> {
    try {
      let query = supabase
        .from('practices')
        .select('*')
        .eq('coach_id', coachId)

      // Apply filters
      if (filters?.status) {
        query = query.eq('status', filters.status)
      }
      if (filters?.startDate) {
        query = query.gte('scheduled_date', filters.startDate.toISOString())
      }
      if (filters?.endDate) {
        query = query.lte('scheduled_date', filters.endDate.toISOString())
      }

      query = query.order('scheduled_date', { ascending: true })

      const { data, error } = await query

      if (error) {
        return { data: null, error: { code: error.code, message: error.message } }
      }

      const practices: Practice[] = data.map((item: any) => ({
        id: item.id,
        coachId: item.coach_id,
        title: item.title,
        description: item.description,
        scheduledDate: new Date(item.scheduled_date),
        durationMinutes: item.duration_minutes,
        location: item.location,
        notes: item.notes,
        status: item.status,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at),
      }))

      return { data: practices, error: null }
    } catch (error: any) {
      return { data: null, error: { code: 'unknown_error', message: error.message } }
    }
  },

  /**
   * Get practices for a player
   */
  async getPlayerPractices(playerId: string): Promise<ApiResponse<PracticeWithDetails[]>> {
    try {
      const { data, error } = await supabase
        .from('practice_players')
        .select(`
          *,
          practice:practices(*)
        `)
        .eq('player_id', playerId)
        .order('created_at', { ascending: false })

      if (error) {
        return { data: null, error: { code: error.code, message: error.message } }
      }

      // Get unique practices with details
      const practiceIds = [...new Set(data.map((item: any) => item.practice.id))]
      const practicesWithDetails = await Promise.all(
        practiceIds.map((id) => this.getPracticeWithDetails(id))
      )

      const validPractices = practicesWithDetails
        .filter((p) => p.data !== null)
        .map((p) => p.data!)

      return { data: validPractices, error: null }
    } catch (error: any) {
      return { data: null, error: { code: 'unknown_error', message: error.message } }
    }
  },

  /**
   * Get a single practice with full details (drills and players)
   */
  async getPracticeWithDetails(practiceId: string): Promise<ApiResponse<PracticeWithDetails>> {
    try {
      // Get practice
      const { data: practiceData, error: practiceError } = await supabase
        .from('practices')
        .select('*')
        .eq('id', practiceId)
        .single()

      if (practiceError) {
        return { data: null, error: { code: practiceError.code, message: practiceError.message } }
      }

      // Get practice drills with drill details
      const { data: drillsData, error: drillsError } = await supabase
        .from('practice_drills')
        .select(`
          *,
          drill:drills(*)
        `)
        .eq('practice_id', practiceId)
        .order('order_index', { ascending: true })

      // Get practice players with player details
      const { data: playersData, error: playersError } = await supabase
        .from('practice_players')
        .select(`
          *,
          player:profiles(*)
        `)
        .eq('practice_id', practiceId)

      const practice: PracticeWithDetails = {
        id: practiceData.id,
        coachId: practiceData.coach_id,
        title: practiceData.title,
        description: practiceData.description,
        scheduledDate: new Date(practiceData.scheduled_date),
        durationMinutes: practiceData.duration_minutes,
        location: practiceData.location,
        notes: practiceData.notes,
        status: practiceData.status,
        createdAt: new Date(practiceData.created_at),
        updatedAt: new Date(practiceData.updated_at),
        drills: drillsData?.map((item: any) => ({
          id: item.id,
          practiceId: item.practice_id,
          drillId: item.drill_id,
          orderIndex: item.order_index,
          customNotes: item.custom_notes,
          createdAt: new Date(item.created_at),
          drill: item.drill ? {
            id: item.drill.id,
            coachId: item.drill.coach_id,
            title: item.drill.title,
            description: item.drill.description,
            category: item.drill.category,
            durationMinutes: item.drill.duration_minutes,
            difficulty: item.drill.difficulty,
            objectives: item.drill.objectives || [],
            equipmentNeeded: item.drill.equipment_needed || [],
            instructions: item.drill.instructions,
            videoUrl: item.drill.video_url,
            isFavorite: item.drill.is_favorite,
            createdAt: new Date(item.drill.created_at),
            updatedAt: new Date(item.drill.updated_at),
          } as Drill : undefined,
        })) || [],
        players: playersData?.map((item: any) => ({
          id: item.id,
          practiceId: item.practice_id,
          playerId: item.player_id,
          attendanceStatus: item.attendance_status,
          notes: item.notes,
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
        })) || [],
      }

      return { data: practice, error: null }
    } catch (error: any) {
      return { data: null, error: { code: 'unknown_error', message: error.message } }
    }
  },

  /**
   * Update a practice
   */
  async updatePractice(
    practiceId: string, 
    updates: Partial<PracticeFormData>
  ): Promise<ApiResponse<Practice>> {
    try {
      const dbUpdates: any = {}

      if (updates.title !== undefined) dbUpdates.title = updates.title
      if (updates.description !== undefined) dbUpdates.description = updates.description
      if (updates.scheduledDate !== undefined) dbUpdates.scheduled_date = updates.scheduledDate.toISOString()
      if (updates.durationMinutes !== undefined) dbUpdates.duration_minutes = updates.durationMinutes
      if (updates.location !== undefined) dbUpdates.location = updates.location
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes
      if (updates.status !== undefined) dbUpdates.status = updates.status

      const { data, error } = await supabase
        .from('practices')
        .update(dbUpdates)
        .eq('id', practiceId)
        .select()
        .single()

      if (error) {
        return { data: null, error: { code: error.code, message: error.message } }
      }

      const practice: Practice = {
        id: data.id,
        coachId: data.coach_id,
        title: data.title,
        description: data.description,
        scheduledDate: new Date(data.scheduled_date),
        durationMinutes: data.duration_minutes,
        location: data.location,
        notes: data.notes,
        status: data.status,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      }

      return { data: practice, error: null }
    } catch (error: any) {
      return { data: null, error: { code: 'unknown_error', message: error.message } }
    }
  },

  /**
   * Delete a practice
   */
  async deletePractice(practiceId: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('practices')
        .delete()
        .eq('id', practiceId)

      if (error) {
        return { data: null, error: { code: error.code, message: error.message } }
      }

      return { data: true, error: null }
    } catch (error: any) {
      return { data: null, error: { code: 'unknown_error', message: error.message } }
    }
  },

  /**
   * Add a drill to a practice
   */
  async addDrillToPractice(
    practiceId: string, 
    drillData: PracticeDrillFormData
  ): Promise<ApiResponse<PracticeDrill>> {
    try {
      const { data, error } = await supabase
        .from('practice_drills')
        .insert({
          practice_id: practiceId,
          drill_id: drillData.drillId,
          order_index: drillData.orderIndex,
          custom_notes: drillData.customNotes || null,
        })
        .select()
        .single()

      if (error) {
        return { data: null, error: { code: error.code, message: error.message } }
      }

      const practiceDrill: PracticeDrill = {
        id: data.id,
        practiceId: data.practice_id,
        drillId: data.drill_id,
        orderIndex: data.order_index,
        customNotes: data.custom_notes,
        createdAt: new Date(data.created_at),
      }

      return { data: practiceDrill, error: null }
    } catch (error: any) {
      return { data: null, error: { code: 'unknown_error', message: error.message } }
    }
  },

  /**
   * Remove a drill from a practice
   */
  async removeDrillFromPractice(practiceDrillId: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('practice_drills')
        .delete()
        .eq('id', practiceDrillId)

      if (error) {
        return { data: null, error: { code: error.code, message: error.message } }
      }

      return { data: true, error: null }
    } catch (error: any) {
      return { data: null, error: { code: 'unknown_error', message: error.message } }
    }
  },

  /**
   * Assign players to a practice
   */
  async assignPlayersToPractice(
    practiceId: string, 
    playerIds: string[]
  ): Promise<ApiResponse<PracticePlayer[]>> {
    try {
      const inserts = playerIds.map((playerId) => ({
        practice_id: practiceId,
        player_id: playerId,
        attendance_status: 'invited' as AttendanceStatus,
      }))

      const { data, error } = await supabase
        .from('practice_players')
        .insert(inserts)
        .select()

      if (error) {
        return { data: null, error: { code: error.code, message: error.message } }
      }

      const practicePlayers: PracticePlayer[] = data.map((item: any) => ({
        id: item.id,
        practiceId: item.practice_id,
        playerId: item.player_id,
        attendanceStatus: item.attendance_status,
        notes: item.notes,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at),
      }))

      return { data: practicePlayers, error: null }
    } catch (error: any) {
      return { data: null, error: { code: 'unknown_error', message: error.message } }
    }
  },

  /**
   * Remove a player from a practice
   */
  async removePlayerFromPractice(practicePlayerId: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('practice_players')
        .delete()
        .eq('id', practicePlayerId)

      if (error) {
        return { data: null, error: { code: error.code, message: error.message } }
      }

      return { data: true, error: null }
    } catch (error: any) {
      return { data: null, error: { code: 'unknown_error', message: error.message } }
    }
  },

  /**
   * Update player attendance status
   */
  async updateAttendance(
    practicePlayerId: string, 
    status: AttendanceStatus,
    notes?: string
  ): Promise<ApiResponse<PracticePlayer>> {
    try {
      const updates: any = {
        attendance_status: status,
      }
      if (notes !== undefined) {
        updates.notes = notes
      }

      const { data, error } = await supabase
        .from('practice_players')
        .update(updates)
        .eq('id', practicePlayerId)
        .select()
        .single()

      if (error) {
        return { data: null, error: { code: error.code, message: error.message } }
      }

      const practicePlayer: PracticePlayer = {
        id: data.id,
        practiceId: data.practice_id,
        playerId: data.player_id,
        attendanceStatus: data.attendance_status,
        notes: data.notes,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      }

      return { data: practicePlayer, error: null }
    } catch (error: any) {
      return { data: null, error: { code: 'unknown_error', message: error.message } }
    }
  },
}

