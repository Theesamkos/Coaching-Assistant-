import { supabase } from '@/config/supabase'
import { Drill, DrillFormData, DrillFilters, ApiResponse } from '@/types'

export const drillService = {
  /**
   * Create a new drill
   */
  async createDrill(
    coachId: string, 
    drillData: DrillFormData
  ): Promise<ApiResponse<Drill>> {
    try {
      const { data, error } = await supabase
        .from('drills')
        .insert({
          coach_id: coachId,
          title: drillData.title,
          description: drillData.description || null,
          category: drillData.category || null,
          duration_minutes: drillData.durationMinutes || null,
          difficulty: drillData.difficulty || null,
          objectives: drillData.objectives || [],
          equipment_needed: drillData.equipmentNeeded || [],
          instructions: drillData.instructions || null,
          video_url: drillData.videoUrl || null,
          is_favorite: drillData.isFavorite || false,
        })
        .select()
        .single()

      if (error) {
        return { data: null, error: { code: error.code, message: error.message } }
      }

      const drill: Drill = {
        id: data.id,
        coachId: data.coach_id,
        title: data.title,
        description: data.description,
        category: data.category,
        durationMinutes: data.duration_minutes,
        difficulty: data.difficulty,
        objectives: data.objectives || [],
        equipmentNeeded: data.equipment_needed || [],
        instructions: data.instructions,
        videoUrl: data.video_url,
        isFavorite: data.is_favorite,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      }

      return { data: drill, error: null }
    } catch (error: any) {
      return { data: null, error: { code: 'unknown_error', message: error.message } }
    }
  },

  /**
   * Get all drills for a coach with optional filters
   */
  async getDrills(
    coachId: string, 
    filters?: DrillFilters
  ): Promise<ApiResponse<Drill[]>> {
    try {
      let query = supabase
        .from('drills')
        .select('*')
        .eq('coach_id', coachId)

      // Apply filters
      if (filters?.category) {
        query = query.eq('category', filters.category)
      }
      if (filters?.difficulty) {
        query = query.eq('difficulty', filters.difficulty)
      }
      if (filters?.isFavorite !== undefined) {
        query = query.eq('is_favorite', filters.isFavorite)
      }
      if (filters?.searchTerm) {
        query = query.or(`title.ilike.%${filters.searchTerm}%,description.ilike.%${filters.searchTerm}%`)
      }

      query = query.order('created_at', { ascending: false })

      const { data, error } = await query

      if (error) {
        return { data: null, error: { code: error.code, message: error.message } }
      }

      const drills: Drill[] = data.map((item: any) => ({
        id: item.id,
        coachId: item.coach_id,
        title: item.title,
        description: item.description,
        category: item.category,
        durationMinutes: item.duration_minutes,
        difficulty: item.difficulty,
        objectives: item.objectives || [],
        equipmentNeeded: item.equipment_needed || [],
        instructions: item.instructions,
        videoUrl: item.video_url,
        isFavorite: item.is_favorite,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at),
      }))

      return { data: drills, error: null }
    } catch (error: any) {
      return { data: null, error: { code: 'unknown_error', message: error.message } }
    }
  },

  /**
   * Get a single drill by ID
   */
  async getDrill(drillId: string): Promise<ApiResponse<Drill>> {
    try {
      const { data, error } = await supabase
        .from('drills')
        .select('*')
        .eq('id', drillId)
        .single()

      if (error) {
        return { data: null, error: { code: error.code, message: error.message } }
      }

      const drill: Drill = {
        id: data.id,
        coachId: data.coach_id,
        title: data.title,
        description: data.description,
        category: data.category,
        durationMinutes: data.duration_minutes,
        difficulty: data.difficulty,
        objectives: data.objectives || [],
        equipmentNeeded: data.equipment_needed || [],
        instructions: data.instructions,
        videoUrl: data.video_url,
        isFavorite: data.is_favorite,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      }

      return { data: drill, error: null }
    } catch (error: any) {
      return { data: null, error: { code: 'unknown_error', message: error.message } }
    }
  },

  /**
   * Update a drill
   */
  async updateDrill(
    drillId: string, 
    updates: Partial<DrillFormData>
  ): Promise<ApiResponse<Drill>> {
    try {
      const dbUpdates: any = {}

      if (updates.title !== undefined) dbUpdates.title = updates.title
      if (updates.description !== undefined) dbUpdates.description = updates.description
      if (updates.category !== undefined) dbUpdates.category = updates.category
      if (updates.durationMinutes !== undefined) dbUpdates.duration_minutes = updates.durationMinutes
      if (updates.difficulty !== undefined) dbUpdates.difficulty = updates.difficulty
      if (updates.objectives !== undefined) dbUpdates.objectives = updates.objectives
      if (updates.equipmentNeeded !== undefined) dbUpdates.equipment_needed = updates.equipmentNeeded
      if (updates.instructions !== undefined) dbUpdates.instructions = updates.instructions
      if (updates.videoUrl !== undefined) dbUpdates.video_url = updates.videoUrl
      if (updates.isFavorite !== undefined) dbUpdates.is_favorite = updates.isFavorite

      const { data, error } = await supabase
        .from('drills')
        .update(dbUpdates)
        .eq('id', drillId)
        .select()
        .single()

      if (error) {
        return { data: null, error: { code: error.code, message: error.message } }
      }

      const drill: Drill = {
        id: data.id,
        coachId: data.coach_id,
        title: data.title,
        description: data.description,
        category: data.category,
        durationMinutes: data.duration_minutes,
        difficulty: data.difficulty,
        objectives: data.objectives || [],
        equipmentNeeded: data.equipment_needed || [],
        instructions: data.instructions,
        videoUrl: data.video_url,
        isFavorite: data.is_favorite,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      }

      return { data: drill, error: null }
    } catch (error: any) {
      return { data: null, error: { code: 'unknown_error', message: error.message } }
    }
  },

  /**
   * Delete a drill
   */
  async deleteDrill(drillId: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('drills')
        .delete()
        .eq('id', drillId)

      if (error) {
        return { data: null, error: { code: error.code, message: error.message } }
      }

      return { data: true, error: null }
    } catch (error: any) {
      return { data: null, error: { code: 'unknown_error', message: error.message } }
    }
  },

  /**
   * Toggle favorite status of a drill
   */
  async toggleFavorite(drillId: string, isFavorite: boolean): Promise<ApiResponse<Drill>> {
    try {
      const { data, error } = await supabase
        .from('drills')
        .update({ is_favorite: isFavorite })
        .eq('id', drillId)
        .select()
        .single()

      if (error) {
        return { data: null, error: { code: error.code, message: error.message } }
      }

      const drill: Drill = {
        id: data.id,
        coachId: data.coach_id,
        title: data.title,
        description: data.description,
        category: data.category,
        durationMinutes: data.duration_minutes,
        difficulty: data.difficulty,
        objectives: data.objectives || [],
        equipmentNeeded: data.equipment_needed || [],
        instructions: data.instructions,
        videoUrl: data.video_url,
        isFavorite: data.is_favorite,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      }

      return { data: drill, error: null }
    } catch (error: any) {
      return { data: null, error: { code: 'unknown_error', message: error.message } }
    }
  },

  /**
   * Get drill categories used by a coach
   */
  async getCategories(coachId: string): Promise<ApiResponse<string[]>> {
    try {
      const { data, error } = await supabase
        .from('drills')
        .select('category')
        .eq('coach_id', coachId)
        .not('category', 'is', null)

      if (error) {
        return { data: null, error: { code: error.code, message: error.message } }
      }

      // Get unique categories
      const categories = [...new Set(data.map((item: any) => item.category).filter(Boolean))]

      return { data: categories, error: null }
    } catch (error: any) {
      return { data: null, error: { code: 'unknown_error', message: error.message } }
    }
  },
}

