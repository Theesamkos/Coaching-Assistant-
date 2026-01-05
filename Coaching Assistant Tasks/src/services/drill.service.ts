import { supabase } from '@/config/supabase'
import type { 
  Drill, 
  CreateDrillInput, 
  UpdateDrillInput,
  DrillCategory,
  DrillDifficulty 
} from '@/types/database.types'

export const drillService = {
  /**
   * Get all drills (pre-built and custom)
   */
  async getAllDrills(filters?: {
    category?: DrillCategory
    difficulty?: DrillDifficulty
    isCustom?: boolean
    createdBy?: string
  }) {
    try {
      let query = supabase.from('drills').select('*')

      if (filters?.category) {
        query = query.eq('category', filters.category)
      }
      if (filters?.difficulty) {
        query = query.eq('difficulty', filters.difficulty)
      }
      if (filters?.isCustom !== undefined) {
        query = query.eq('is_custom', filters.isCustom)
      }
      if (filters?.createdBy) {
        query = query.eq('created_by', filters.createdBy)
      }

      const { data, error } = await query.order('title')

      if (error) throw error
      return { data: data as Drill[], error: null }
    } catch (error: any) {
      return { data: null, error: { message: error.message } }
    }
  },

  /**
   * Get drill by ID
   */
  async getDrillById(drillId: string) {
    try {
      const { data, error } = await supabase
        .from('drills')
        .select('*')
        .eq('id', drillId)
        .single()

      if (error) throw error
      return { data: data as Drill, error: null }
    } catch (error: any) {
      return { data: null, error: { message: error.message } }
    }
  },

  /**
   * Get pre-built drills (library)
   */
  async getPreBuiltDrills(filters?: {
    category?: DrillCategory
    difficulty?: DrillDifficulty
  }) {
    return this.getAllDrills({ ...filters, isCustom: false })
  },

  /**
   * Get custom drills created by a coach
   */
  async getCustomDrillsByCoach(coachId: string) {
    return this.getAllDrills({ isCustom: true, createdBy: coachId })
  },

  /**
   * Create a new drill
   */
  async createDrill(coachId: string, drillData: CreateDrillInput) {
    try {
      const { data, error } = await supabase
        .from('drills')
        .insert({
          ...drillData,
          is_custom: true,
          created_by: coachId,
        })
        .select()
        .single()

      if (error) throw error
      return { data: data as Drill, error: null }
    } catch (error: any) {
      return { data: null, error: { message: error.message } }
    }
  },

  /**
   * Update a drill
   */
  async updateDrill(drillId: string, updates: UpdateDrillInput) {
    try {
      const { data, error } = await supabase
        .from('drills')
        .update(updates)
        .eq('id', drillId)
        .select()
        .single()

      if (error) throw error
      return { data: data as Drill, error: null }
    } catch (error: any) {
      return { data: null, error: { message: error.message } }
    }
  },

  /**
   * Delete a drill
   */
  async deleteDrill(drillId: string) {
    try {
      const { error } = await supabase
        .from('drills')
        .delete()
        .eq('id', drillId)

      if (error) throw error
      return { success: true, error: null }
    } catch (error: any) {
      return { success: false, error: { message: error.message } }
    }
  },

  /**
   * Search drills by title or description
   */
  async searchDrills(query: string, filters?: {
    category?: DrillCategory
    difficulty?: DrillDifficulty
  }) {
    try {
      let queryBuilder = supabase
        .from('drills')
        .select('*')
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)

      if (filters?.category) {
        queryBuilder = queryBuilder.eq('category', filters.category)
      }
      if (filters?.difficulty) {
        queryBuilder = queryBuilder.eq('difficulty', filters.difficulty)
      }

      const { data, error } = await queryBuilder.order('title')

      if (error) throw error
      return { data: data as Drill[], error: null }
    } catch (error: any) {
      return { data: null, error: { message: error.message } }
    }
  },

  /**
   * Get drills by category
   */
  async getDrillsByCategory(category: DrillCategory) {
    return this.getAllDrills({ category })
  },

  /**
   * Get drills by difficulty
   */
  async getDrillsByDifficulty(difficulty: DrillDifficulty) {
    return this.getAllDrills({ difficulty })
  },

  /**
   * Duplicate a drill (useful for coaches to customize pre-built drills)
   */
  async duplicateDrill(drillId: string, coachId: string, newTitle?: string) {
    try {
      // Get the original drill
      const { data: originalDrill, error: fetchError } = await this.getDrillById(drillId)
      if (fetchError || !originalDrill) {
        throw new Error('Drill not found')
      }

      // Create a copy
      const { data, error } = await supabase
        .from('drills')
        .insert({
          title: newTitle || `${originalDrill.title} (Copy)`,
          description: originalDrill.description,
          category: originalDrill.category,
          difficulty: originalDrill.difficulty,
          duration_minutes: originalDrill.duration_minutes,
          equipment: originalDrill.equipment,
          key_points: originalDrill.key_points,
          video_urls: originalDrill.video_urls,
          is_custom: true,
          created_by: coachId,
        })
        .select()
        .single()

      if (error) throw error
      return { data: data as Drill, error: null }
    } catch (error: any) {
      return { data: null, error: { message: error.message } }
    }
  },
}
