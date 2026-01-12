import { supabase } from '@/config/supabase'
import {
  PracticePlan,
  PracticePlanFormData,
  PracticePlanWithDetails,
  PracticePlanSection,
  PracticePlanSectionFormData,
  PracticePlanDrill,
  PracticePlanDrillFormData,
  PracticePlanCategory,
  PracticePlanCategoryFormData,
  PracticePlanShare,
  PracticePlanShareFormData,
  PracticePlanFavorite,
  PracticePlanFilters,
  ApiResponse,
} from '@/types'

export const practicePlanService = {
  // ============================================================================
  // PRACTICE PLANS
  // ============================================================================

  /**
   * Get all practice plans for a coach (including shared)
   */
  async getPlans(
    coachId: string,
    filters?: PracticePlanFilters
  ): Promise<ApiResponse<PracticePlan[]>> {
    try {
      let query = supabase
        .from('practice_plans')
        .select(`
          *,
          category:practice_plan_categories(*),
          sections:practice_plan_sections(
            *,
            drills:practice_plan_drills(*, drill:drills(*))
          )
        `)
        .or(`coach_id.eq.${coachId},is_public.eq.true`)
        .order('updated_at', { ascending: false })

      // Apply filters
      if (filters?.categoryId) {
        query = query.eq('category_id', filters.categoryId)
      }

      if (filters?.ageGroup) {
        query = query.eq('age_group', filters.ageGroup)
      }

      if (filters?.skillLevel) {
        query = query.eq('skill_level', filters.skillLevel)
      }

      if (filters?.isPublic !== undefined) {
        query = query.eq('is_public', filters.isPublic)
      }

      if (filters?.folderPath) {
        query = query.eq('folder_path', filters.folderPath)
      }

      if (filters?.searchTerm) {
        query = query.or(
          `title.ilike.%${filters.searchTerm}%,description.ilike.%${filters.searchTerm}%`
        )
      }

      if (filters?.tags && filters.tags.length > 0) {
        query = query.contains('tags', filters.tags)
      }

      const { data, error } = await query

      if (error) {
        return { data: null, error: { code: error.code, message: error.message } }
      }

      const plans: PracticePlan[] = data.map((item: any) => ({
        id: item.id,
        coachId: item.coach_id,
        title: item.title,
        description: item.description,
        categoryId: item.category_id,
        tags: item.tags || [],
        ageGroup: item.age_group,
        skillLevel: item.skill_level,
        teamSizeMin: item.team_size_min,
        teamSizeMax: item.team_size_max,
        totalDurationMinutes: item.total_duration_minutes,
        objectives: item.objectives || [],
        equipmentNeeded: item.equipment_needed || [],
        coachingNotes: item.coaching_notes,
        safetyNotes: item.safety_notes,
        folderPath: item.folder_path,
        isPublic: item.is_public,
        isTemplate: item.is_template,
        timesUsed: item.times_used,
        lastUsedAt: item.last_used_at ? new Date(item.last_used_at) : null,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at),
        category: item.category ? {
          id: item.category.id,
          coachId: item.category.coach_id,
          name: item.category.name,
          description: item.category.description,
          color: item.category.color,
          icon: item.category.icon,
          isSystem: item.category.is_system,
          createdAt: new Date(item.category.created_at),
          updatedAt: new Date(item.category.updated_at),
        } : undefined,
      }))

      return { data: plans, error: null }
    } catch (error: any) {
      return { data: null, error: { code: 'unknown_error', message: error.message } }
    }
  },

  /**
   * Get a single practice plan with full details
   */
  async getPlanWithDetails(planId: string): Promise<ApiResponse<PracticePlanWithDetails>> {
    try {
      const { data, error } = await supabase
        .from('practice_plans')
        .select(`
          *,
          category:practice_plan_categories(*),
          sections:practice_plan_sections(
            *,
            drills:practice_plan_drills(
              *,
              drill:drills(*)
            )
          )
        `)
        .eq('id', planId)
        .single()

      if (error) {
        return { data: null, error: { code: error.code, message: error.message } }
      }

      const plan: PracticePlanWithDetails = {
        id: data.id,
        coachId: data.coach_id,
        title: data.title,
        description: data.description,
        categoryId: data.category_id,
        tags: data.tags || [],
        ageGroup: data.age_group,
        skillLevel: data.skill_level,
        teamSizeMin: data.team_size_min,
        teamSizeMax: data.team_size_max,
        totalDurationMinutes: data.total_duration_minutes,
        objectives: data.objectives || [],
        equipmentNeeded: data.equipment_needed || [],
        coachingNotes: data.coaching_notes,
        safetyNotes: data.safety_notes,
        folderPath: data.folder_path,
        isPublic: data.is_public,
        isTemplate: data.is_template,
        timesUsed: data.times_used,
        lastUsedAt: data.last_used_at ? new Date(data.last_used_at) : null,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        category: data.category ? {
          id: data.category.id,
          coachId: data.category.coach_id,
          name: data.category.name,
          description: data.category.description,
          color: data.category.color,
          icon: data.category.icon,
          isSystem: data.category.is_system,
          createdAt: new Date(data.category.created_at),
          updatedAt: new Date(data.category.updated_at),
        } : undefined,
        sections: (data.sections || []).map((section: any) => ({
          id: section.id,
          planId: section.plan_id,
          title: section.title,
          description: section.description,
          durationMinutes: section.duration_minutes,
          orderIndex: section.order_index,
          color: section.color,
          icon: section.icon,
          createdAt: new Date(section.created_at),
          updatedAt: new Date(section.updated_at),
          drills: (section.drills || []).map((drill: any) => ({
            id: drill.id,
            sectionId: drill.section_id,
            drillId: drill.drill_id,
            customTitle: drill.custom_title,
            customDescription: drill.custom_description,
            customInstructions: drill.custom_instructions,
            durationMinutes: drill.duration_minutes,
            orderIndex: drill.order_index,
            coachingPoints: drill.coaching_points,
            variations: drill.variations,
            playerCountMin: drill.player_count_min,
            playerCountMax: drill.player_count_max,
            groupsCount: drill.groups_count,
            createdAt: new Date(drill.created_at),
            updatedAt: new Date(drill.updated_at),
            drill: drill.drill ? {
              id: drill.drill.id,
              coachId: drill.drill.coach_id,
              title: drill.drill.title,
              description: drill.drill.description,
              category: drill.drill.category,
              durationMinutes: drill.drill.duration_minutes,
              difficulty: drill.drill.difficulty,
              objectives: drill.drill.objectives || [],
              equipmentNeeded: drill.drill.equipment_needed || [],
              instructions: drill.drill.instructions,
              videoUrl: drill.drill.video_url,
              isFavorite: drill.drill.is_favorite,
              createdAt: new Date(drill.drill.created_at),
              updatedAt: new Date(drill.drill.updated_at),
            } : undefined,
          })),
        })),
      }

      return { data: plan, error: null }
    } catch (error: any) {
      return { data: null, error: { code: 'unknown_error', message: error.message } }
    }
  },

  /**
   * Create a new practice plan
   */
  async createPlan(
    coachId: string,
    planData: PracticePlanFormData
  ): Promise<ApiResponse<PracticePlan>> {
    try {
      const { data, error } = await supabase
        .from('practice_plans')
        .insert({
          coach_id: coachId,
          title: planData.title,
          description: planData.description || null,
          category_id: planData.categoryId || null,
          tags: planData.tags || [],
          age_group: planData.ageGroup || null,
          skill_level: planData.skillLevel || null,
          team_size_min: planData.teamSizeMin || null,
          team_size_max: planData.teamSizeMax || null,
          total_duration_minutes: planData.totalDurationMinutes || null,
          objectives: planData.objectives || [],
          equipment_needed: planData.equipmentNeeded || [],
          coaching_notes: planData.coachingNotes || null,
          safety_notes: planData.safetyNotes || null,
          folder_path: planData.folderPath || null,
          is_public: planData.isPublic || false,
          is_template: planData.isTemplate !== false, // default true
        })
        .select()
        .single()

      if (error) {
        return { data: null, error: { code: error.code, message: error.message } }
      }

      const plan: PracticePlan = {
        id: data.id,
        coachId: data.coach_id,
        title: data.title,
        description: data.description,
        categoryId: data.category_id,
        tags: data.tags || [],
        ageGroup: data.age_group,
        skillLevel: data.skill_level,
        teamSizeMin: data.team_size_min,
        teamSizeMax: data.team_size_max,
        totalDurationMinutes: data.total_duration_minutes,
        objectives: data.objectives || [],
        equipmentNeeded: data.equipment_needed || [],
        coachingNotes: data.coaching_notes,
        safetyNotes: data.safety_notes,
        folderPath: data.folder_path,
        isPublic: data.is_public,
        isTemplate: data.is_template,
        timesUsed: data.times_used,
        lastUsedAt: data.last_used_at ? new Date(data.last_used_at) : null,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      }

      return { data: plan, error: null }
    } catch (error: any) {
      return { data: null, error: { code: 'unknown_error', message: error.message } }
    }
  },

  /**
   * Update a practice plan
   */
  async updatePlan(
    planId: string,
    planData: Partial<PracticePlanFormData>
  ): Promise<ApiResponse<PracticePlan>> {
    try {
      const updates: any = {
        updated_at: new Date().toISOString(),
      }

      if (planData.title !== undefined) updates.title = planData.title
      if (planData.description !== undefined) updates.description = planData.description
      if (planData.categoryId !== undefined) updates.category_id = planData.categoryId
      if (planData.tags !== undefined) updates.tags = planData.tags
      if (planData.ageGroup !== undefined) updates.age_group = planData.ageGroup
      if (planData.skillLevel !== undefined) updates.skill_level = planData.skillLevel
      if (planData.teamSizeMin !== undefined) updates.team_size_min = planData.teamSizeMin
      if (planData.teamSizeMax !== undefined) updates.team_size_max = planData.teamSizeMax
      if (planData.totalDurationMinutes !== undefined) updates.total_duration_minutes = planData.totalDurationMinutes
      if (planData.objectives !== undefined) updates.objectives = planData.objectives
      if (planData.equipmentNeeded !== undefined) updates.equipment_needed = planData.equipmentNeeded
      if (planData.coachingNotes !== undefined) updates.coaching_notes = planData.coachingNotes
      if (planData.safetyNotes !== undefined) updates.safety_notes = planData.safetyNotes
      if (planData.folderPath !== undefined) updates.folder_path = planData.folderPath
      if (planData.isPublic !== undefined) updates.is_public = planData.isPublic
      if (planData.isTemplate !== undefined) updates.is_template = planData.isTemplate

      const { data, error } = await supabase
        .from('practice_plans')
        .update(updates)
        .eq('id', planId)
        .select()
        .single()

      if (error) {
        return { data: null, error: { code: error.code, message: error.message } }
      }

      const plan: PracticePlan = {
        id: data.id,
        coachId: data.coach_id,
        title: data.title,
        description: data.description,
        categoryId: data.category_id,
        tags: data.tags || [],
        ageGroup: data.age_group,
        skillLevel: data.skill_level,
        teamSizeMin: data.team_size_min,
        teamSizeMax: data.team_size_max,
        totalDurationMinutes: data.total_duration_minutes,
        objectives: data.objectives || [],
        equipmentNeeded: data.equipment_needed || [],
        coachingNotes: data.coaching_notes,
        safetyNotes: data.safety_notes,
        folderPath: data.folder_path,
        isPublic: data.is_public,
        isTemplate: data.is_template,
        timesUsed: data.times_used,
        lastUsedAt: data.last_used_at ? new Date(data.last_used_at) : null,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      }

      return { data: plan, error: null }
    } catch (error: any) {
      return { data: null, error: { code: 'unknown_error', message: error.message } }
    }
  },

  /**
   * Delete a practice plan
   */
  async deletePlan(planId: string): Promise<ApiResponse<null>> {
    try {
      const { error } = await supabase
        .from('practice_plans')
        .delete()
        .eq('id', planId)

      if (error) {
        return { data: null, error: { code: error.code, message: error.message } }
      }

      return { data: null, error: null }
    } catch (error: any) {
      return { data: null, error: { code: 'unknown_error', message: error.message } }
    }
  },

  /**
   * Duplicate a practice plan
   */
  async duplicatePlan(
    planId: string,
    coachId: string,
    newTitle?: string
  ): Promise<ApiResponse<PracticePlan>> {
    try {
      // Get the original plan with full details
      const { data: originalPlan, error: fetchError } = await this.getPlanWithDetails(planId)
      
      if (fetchError || !originalPlan) {
        return { data: null, error: fetchError || { code: 'not_found', message: 'Plan not found' } }
      }

      // Create new plan with same data
      const { data: newPlan, error: createError } = await this.createPlan(coachId, {
        title: newTitle || `${originalPlan.title} (Copy)`,
        description: originalPlan.description || undefined,
        categoryId: originalPlan.categoryId || undefined,
        tags: originalPlan.tags,
        ageGroup: originalPlan.ageGroup || undefined,
        skillLevel: originalPlan.skillLevel || undefined,
        teamSizeMin: originalPlan.teamSizeMin || undefined,
        teamSizeMax: originalPlan.teamSizeMax || undefined,
        totalDurationMinutes: originalPlan.totalDurationMinutes || undefined,
        objectives: originalPlan.objectives,
        equipmentNeeded: originalPlan.equipmentNeeded,
        coachingNotes: originalPlan.coachingNotes || undefined,
        safetyNotes: originalPlan.safetyNotes || undefined,
        isPublic: false, // copies are private by default
        isTemplate: originalPlan.isTemplate,
      })

      if (createError || !newPlan) {
        return { data: null, error: createError || { code: 'create_failed', message: 'Failed to create plan' } }
      }

      // Duplicate sections and drills
      for (const section of originalPlan.sections) {
        const { data: newSection, error: sectionError } = await this.createSection(newPlan.id, {
          title: section.title,
          description: section.description || undefined,
          durationMinutes: section.durationMinutes || undefined,
          orderIndex: section.orderIndex,
          color: section.color || undefined,
          icon: section.icon || undefined,
        })

        if (sectionError || !newSection) continue

        for (const drill of section.drills) {
          await this.createDrill(newSection.id, {
            drillId: drill.drillId || undefined,
            customTitle: drill.customTitle || undefined,
            customDescription: drill.customDescription || undefined,
            customInstructions: drill.customInstructions || undefined,
            durationMinutes: drill.durationMinutes || undefined,
            orderIndex: drill.orderIndex,
            coachingPoints: drill.coachingPoints || undefined,
            variations: drill.variations || undefined,
            playerCountMin: drill.playerCountMin || undefined,
            playerCountMax: drill.playerCountMax || undefined,
            groupsCount: drill.groupsCount || undefined,
          })
        }
      }

      return { data: newPlan, error: null }
    } catch (error: any) {
      return { data: null, error: { code: 'unknown_error', message: error.message } }
    }
  },

  /**
   * Increment times used for a plan
   */
  async incrementTimesUsed(planId: string): Promise<ApiResponse<null>> {
    try {
      const { error } = await supabase.rpc('increment_plan_usage', {
        plan_id: planId
      })

      if (error) {
        return { data: null, error: { code: error.code, message: error.message } }
      }

      return { data: null, error: null }
    } catch (error: any) {
      return { data: null, error: { code: 'unknown_error', message: error.message } }
    }
  },

  // ============================================================================
  // SECTIONS
  // ============================================================================

  /**
   * Create a section in a plan
   */
  async createSection(
    planId: string,
    sectionData: PracticePlanSectionFormData
  ): Promise<ApiResponse<PracticePlanSection>> {
    try {
      const { data, error } = await supabase
        .from('practice_plan_sections')
        .insert({
          plan_id: planId,
          title: sectionData.title,
          description: sectionData.description || null,
          duration_minutes: sectionData.durationMinutes || null,
          order_index: sectionData.orderIndex,
          color: sectionData.color || null,
          icon: sectionData.icon || null,
        })
        .select()
        .single()

      if (error) {
        return { data: null, error: { code: error.code, message: error.message } }
      }

      const section: PracticePlanSection = {
        id: data.id,
        planId: data.plan_id,
        title: data.title,
        description: data.description,
        durationMinutes: data.duration_minutes,
        orderIndex: data.order_index,
        color: data.color,
        icon: data.icon,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      }

      return { data: section, error: null }
    } catch (error: any) {
      return { data: null, error: { code: 'unknown_error', message: error.message } }
    }
  },

  /**
   * Update a section
   */
  async updateSection(
    sectionId: string,
    sectionData: Partial<PracticePlanSectionFormData>
  ): Promise<ApiResponse<PracticePlanSection>> {
    try {
      const updates: any = {
        updated_at: new Date().toISOString(),
      }

      if (sectionData.title !== undefined) updates.title = sectionData.title
      if (sectionData.description !== undefined) updates.description = sectionData.description
      if (sectionData.durationMinutes !== undefined) updates.duration_minutes = sectionData.durationMinutes
      if (sectionData.orderIndex !== undefined) updates.order_index = sectionData.orderIndex
      if (sectionData.color !== undefined) updates.color = sectionData.color
      if (sectionData.icon !== undefined) updates.icon = sectionData.icon

      const { data, error } = await supabase
        .from('practice_plan_sections')
        .update(updates)
        .eq('id', sectionId)
        .select()
        .single()

      if (error) {
        return { data: null, error: { code: error.code, message: error.message } }
      }

      const section: PracticePlanSection = {
        id: data.id,
        planId: data.plan_id,
        title: data.title,
        description: data.description,
        durationMinutes: data.duration_minutes,
        orderIndex: data.order_index,
        color: data.color,
        icon: data.icon,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      }

      return { data: section, error: null }
    } catch (error: any) {
      return { data: null, error: { code: 'unknown_error', message: error.message } }
    }
  },

  /**
   * Delete a section
   */
  async deleteSection(sectionId: string): Promise<ApiResponse<null>> {
    try {
      const { error } = await supabase
        .from('practice_plan_sections')
        .delete()
        .eq('id', sectionId)

      if (error) {
        return { data: null, error: { code: error.code, message: error.message } }
      }

      return { data: null, error: null }
    } catch (error: any) {
      return { data: null, error: { code: 'unknown_error', message: error.message } }
    }
  },

  // ============================================================================
  // DRILLS
  // ============================================================================

  /**
   * Create a drill in a section
   */
  async createDrill(
    sectionId: string,
    drillData: PracticePlanDrillFormData
  ): Promise<ApiResponse<PracticePlanDrill>> {
    try {
      const { data, error } = await supabase
        .from('practice_plan_drills')
        .insert({
          section_id: sectionId,
          drill_id: drillData.drillId || null,
          custom_title: drillData.customTitle || null,
          custom_description: drillData.customDescription || null,
          custom_instructions: drillData.customInstructions || null,
          duration_minutes: drillData.durationMinutes || null,
          order_index: drillData.orderIndex,
          coaching_points: drillData.coachingPoints || null,
          variations: drillData.variations || null,
          player_count_min: drillData.playerCountMin || null,
          player_count_max: drillData.playerCountMax || null,
          groups_count: drillData.groupsCount || null,
        })
        .select()
        .single()

      if (error) {
        return { data: null, error: { code: error.code, message: error.message } }
      }

      const drill: PracticePlanDrill = {
        id: data.id,
        sectionId: data.section_id,
        drillId: data.drill_id,
        customTitle: data.custom_title,
        customDescription: data.custom_description,
        customInstructions: data.custom_instructions,
        durationMinutes: data.duration_minutes,
        orderIndex: data.order_index,
        coachingPoints: data.coaching_points,
        variations: data.variations,
        playerCountMin: data.player_count_min,
        playerCountMax: data.player_count_max,
        groupsCount: data.groups_count,
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
    drillData: Partial<PracticePlanDrillFormData>
  ): Promise<ApiResponse<PracticePlanDrill>> {
    try {
      const updates: any = {
        updated_at: new Date().toISOString(),
      }

      if (drillData.drillId !== undefined) updates.drill_id = drillData.drillId
      if (drillData.customTitle !== undefined) updates.custom_title = drillData.customTitle
      if (drillData.customDescription !== undefined) updates.custom_description = drillData.customDescription
      if (drillData.customInstructions !== undefined) updates.custom_instructions = drillData.customInstructions
      if (drillData.durationMinutes !== undefined) updates.duration_minutes = drillData.durationMinutes
      if (drillData.orderIndex !== undefined) updates.order_index = drillData.orderIndex
      if (drillData.coachingPoints !== undefined) updates.coaching_points = drillData.coachingPoints
      if (drillData.variations !== undefined) updates.variations = drillData.variations
      if (drillData.playerCountMin !== undefined) updates.player_count_min = drillData.playerCountMin
      if (drillData.playerCountMax !== undefined) updates.player_count_max = drillData.playerCountMax
      if (drillData.groupsCount !== undefined) updates.groups_count = drillData.groupsCount

      const { data, error } = await supabase
        .from('practice_plan_drills')
        .update(updates)
        .eq('id', drillId)
        .select()
        .single()

      if (error) {
        return { data: null, error: { code: error.code, message: error.message } }
      }

      const drill: PracticePlanDrill = {
        id: data.id,
        sectionId: data.section_id,
        drillId: data.drill_id,
        customTitle: data.custom_title,
        customDescription: data.custom_description,
        customInstructions: data.custom_instructions,
        durationMinutes: data.duration_minutes,
        orderIndex: data.order_index,
        coachingPoints: data.coaching_points,
        variations: data.variations,
        playerCountMin: data.player_count_min,
        playerCountMax: data.player_count_max,
        groupsCount: data.groups_count,
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
  async deleteDrill(drillId: string): Promise<ApiResponse<null>> {
    try {
      const { error } = await supabase
        .from('practice_plan_drills')
        .delete()
        .eq('id', drillId)

      if (error) {
        return { data: null, error: { code: error.code, message: error.message } }
      }

      return { data: null, error: null }
    } catch (error: any) {
      return { data: null, error: { code: 'unknown_error', message: error.message } }
    }
  },

  // ============================================================================
  // CATEGORIES
  // ============================================================================

  /**
   * Get all categories for a coach
   */
  async getCategories(coachId: string): Promise<ApiResponse<PracticePlanCategory[]>> {
    try {
      const { data, error } = await supabase
        .from('practice_plan_categories')
        .select('*')
        .or(`coach_id.eq.${coachId},is_system.eq.true`)
        .order('name')

      if (error) {
        return { data: null, error: { code: error.code, message: error.message } }
      }

      const categories: PracticePlanCategory[] = data.map((item: any) => ({
        id: item.id,
        coachId: item.coach_id,
        name: item.name,
        description: item.description,
        color: item.color,
        icon: item.icon,
        isSystem: item.is_system,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at),
      }))

      return { data: categories, error: null }
    } catch (error: any) {
      return { data: null, error: { code: 'unknown_error', message: error.message } }
    }
  },

  /**
   * Create a category
   */
  async createCategory(
    coachId: string,
    categoryData: PracticePlanCategoryFormData
  ): Promise<ApiResponse<PracticePlanCategory>> {
    try {
      const { data, error } = await supabase
        .from('practice_plan_categories')
        .insert({
          coach_id: coachId,
          name: categoryData.name,
          description: categoryData.description || null,
          color: categoryData.color || null,
          icon: categoryData.icon || null,
        })
        .select()
        .single()

      if (error) {
        return { data: null, error: { code: error.code, message: error.message } }
      }

      const category: PracticePlanCategory = {
        id: data.id,
        coachId: data.coach_id,
        name: data.name,
        description: data.description,
        color: data.color,
        icon: data.icon,
        isSystem: data.is_system,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      }

      return { data: category, error: null }
    } catch (error: any) {
      return { data: null, error: { code: 'unknown_error', message: error.message } }
    }
  },

  // ============================================================================
  // SHARING
  // ============================================================================

  /**
   * Share a plan with another coach
   */
  async sharePlan(
    planId: string,
    sharedByCoachId: string,
    shareData: PracticePlanShareFormData
  ): Promise<ApiResponse<PracticePlanShare>> {
    try {
      const { data, error } = await supabase
        .from('practice_plan_shares')
        .insert({
          plan_id: planId,
          shared_by_coach_id: sharedByCoachId,
          shared_with_coach_id: shareData.sharedWithCoachId,
          permission: shareData.permission,
        })
        .select()
        .single()

      if (error) {
        return { data: null, error: { code: error.code, message: error.message } }
      }

      const share: PracticePlanShare = {
        id: data.id,
        planId: data.plan_id,
        sharedWithCoachId: data.shared_with_coach_id,
        sharedByCoachId: data.shared_by_coach_id,
        permission: data.permission,
        sharedAt: new Date(data.shared_at),
        lastAccessedAt: data.last_accessed_at ? new Date(data.last_accessed_at) : null,
      }

      return { data: share, error: null }
    } catch (error: any) {
      return { data: null, error: { code: 'unknown_error', message: error.message } }
    }
  },

  /**
   * Unshare a plan
   */
  async unsharePlan(shareId: string): Promise<ApiResponse<null>> {
    try {
      const { error } = await supabase
        .from('practice_plan_shares')
        .delete()
        .eq('id', shareId)

      if (error) {
        return { data: null, error: { code: error.code, message: error.message } }
      }

      return { data: null, error: null }
    } catch (error: any) {
      return { data: null, error: { code: 'unknown_error', message: error.message } }
    }
  },

  // ============================================================================
  // FAVORITES
  // ============================================================================

  /**
   * Toggle favorite status of a plan
   */
  async toggleFavorite(
    planId: string,
    coachId: string
  ): Promise<ApiResponse<boolean>> {
    try {
      // Check if already favorited
      const { data: existing } = await supabase
        .from('practice_plan_favorites')
        .select('id')
        .eq('plan_id', planId)
        .eq('coach_id', coachId)
        .single()

      if (existing) {
        // Remove favorite
        const { error } = await supabase
          .from('practice_plan_favorites')
          .delete()
          .eq('id', existing.id)

        if (error) {
          return { data: null, error: { code: error.code, message: error.message } }
        }

        return { data: false, error: null } // not favorited anymore
      } else {
        // Add favorite
        const { error } = await supabase
          .from('practice_plan_favorites')
          .insert({
            plan_id: planId,
            coach_id: coachId,
          })

        if (error) {
          return { data: null, error: { code: error.code, message: error.message } }
        }

        return { data: true, error: null } // now favorited
      }
    } catch (error: any) {
      return { data: null, error: { code: 'unknown_error', message: error.message } }
    }
  },
}
