import { supabase } from '@/config/supabase'
import type {
  AIConversation,
  AIMessage,
  CreateAIConversationInput,
  CreateAIMessageInput,
} from '@/types/database.types'

export const aiService = {
  /**
   * Create a new AI conversation
   */
  async createConversation(playerId: string, conversationData: CreateAIConversationInput) {
    try {
      const { data, error } = await supabase
        .from('ai_conversations')
        .insert({
          ...conversationData,
          player_id: playerId,
        })
        .select()
        .single()

      if (error) throw error
      return { data: data as AIConversation, error: null }
    } catch (error: any) {
      return { data: null, error: { message: error.message } }
    }
  },

  /**
   * Get all conversations for a player
   */
  async getConversationsByPlayer(playerId: string) {
    try {
      const { data, error } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('player_id', playerId)
        .order('updated_at', { ascending: false })

      if (error) throw error
      return { data: data as AIConversation[], error: null }
    } catch (error: any) {
      return { data: null, error: { message: error.message } }
    }
  },

  /**
   * Get conversation by ID
   */
  async getConversationById(conversationId: string) {
    try {
      const { data, error } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('id', conversationId)
        .single()

      if (error) throw error
      return { data: data as AIConversation, error: null }
    } catch (error: any) {
      return { data: null, error: { message: error.message } }
    }
  },

  /**
   * Update conversation
   */
  async updateConversation(
    conversationId: string,
    updates: Partial<CreateAIConversationInput>
  ) {
    try {
      const { data, error } = await supabase
        .from('ai_conversations')
        .update(updates)
        .eq('id', conversationId)
        .select()
        .single()

      if (error) throw error
      return { data: data as AIConversation, error: null }
    } catch (error: any) {
      return { data: null, error: { message: error.message } }
    }
  },

  /**
   * Delete conversation
   */
  async deleteConversation(conversationId: string) {
    try {
      const { error } = await supabase
        .from('ai_conversations')
        .delete()
        .eq('id', conversationId)

      if (error) throw error
      return { success: true, error: null }
    } catch (error: any) {
      return { success: false, error: { message: error.message } }
    }
  },

  /**
   * Add message to conversation
   */
  async addMessage(messageData: CreateAIMessageInput) {
    try {
      const { data, error } = await supabase
        .from('ai_messages')
        .insert(messageData)
        .select()
        .single()

      if (error) throw error

      // Update conversation's updated_at timestamp
      await supabase
        .from('ai_conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', messageData.conversation_id)

      return { data: data as AIMessage, error: null }
    } catch (error: any) {
      return { data: null, error: { message: error.message } }
    }
  },

  /**
   * Get messages for a conversation
   */
  async getMessages(conversationId: string) {
    try {
      const { data, error } = await supabase
        .from('ai_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (error) throw error
      return { data: data as AIMessage[], error: null }
    } catch (error: any) {
      return { data: null, error: { message: error.message } }
    }
  },

  /**
   * Get conversation with messages
   */
  async getConversationWithMessages(conversationId: string) {
    try {
      const { data: conversation, error: convError } =
        await this.getConversationById(conversationId)
      if (convError || !conversation) throw new Error('Conversation not found')

      const { data: messages, error: msgError } = await this.getMessages(conversationId)
      if (msgError) throw msgError

      return {
        data: {
          ...conversation,
          messages,
        },
        error: null,
      }
    } catch (error: any) {
      return { data: null, error: { message: error.message } }
    }
  },

  /**
   * Generate AI response (placeholder - you'll integrate with OpenAI/Claude)
   */
  async generateAIResponse(conversationId: string, userMessage: string, context?: any) {
    try {
      // Add user message
      await this.addMessage({
        conversation_id: conversationId,
        role: 'user',
        content: userMessage,
      })

      // TODO: Integrate with OpenAI/Claude API
      // For now, return a placeholder response
      const aiResponse = 'This is a placeholder AI response. Integrate with OpenAI or Claude API.'

      // Add AI response
      const { data, error } = await this.addMessage({
        conversation_id: conversationId,
        role: 'assistant',
        content: aiResponse,
      })

      if (error) throw error
      return { data, error: null }
    } catch (error: any) {
      return { data: null, error: { message: error.message } }
    }
  },

  /**
   * Get AI assistance for upcoming practice
   */
  async getPreparationAdvice(playerId: string, sessionId: string) {
    try {
      // Get session details
      const { data: session, error: sessionError } = await supabase
        .from('practice_sessions')
        .select(`
          *,
          session_drills:session_drills(
            *,
            drill:drills(*)
          )
        `)
        .eq('id', sessionId)
        .single()

      if (sessionError) throw sessionError

      // Create conversation with context
      const { data: conversation, error: convError } = await this.createConversation(playerId, {
        title: `Preparation for ${session.title}`,
        context: {
          session_id: sessionId,
          scheduled_date: session.scheduled_date,
          drills: session.session_drills,
        },
      })

      if (convError || !conversation) throw new Error('Failed to create conversation')

      // Generate initial AI message with preparation advice
      const drillNames = session.session_drills?.map((sd: any) => sd.drill.title).join(', ')
      const userMessage = `I have a practice session scheduled for ${session.scheduled_date} called "${session.title}". The drills include: ${drillNames}. How should I prepare physically and mentally?`

      await this.generateAIResponse(conversation.id, userMessage, session)

      return { data: conversation, error: null }
    } catch (error: any) {
      return { data: null, error: { message: error.message } }
    }
  },
}
