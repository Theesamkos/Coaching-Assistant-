import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { aiService } from '@/services/ai.service'
import type { AIConversation, AIMessage } from '@/types/database.types'

interface AIChatProps {
  conversationId?: string
  context?: any
  onClose?: () => void
}

export default function AIChat({ conversationId, context, onClose }: AIChatProps) {
  const { user } = useAuth()
  const [conversation, setConversation] = useState<AIConversation | null>(null)
  const [messages, setMessages] = useState<AIMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (user?.id) {
      initializeChat()
    }
  }, [user, conversationId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const initializeChat = async () => {
    if (!user?.id) return

    setInitializing(true)
    try {
      if (conversationId) {
        // Load existing conversation
        const { data: convData } = await aiService.getConversationWithMessages(conversationId)
        if (convData) {
          setConversation(convData as any)
          setMessages((convData as any).messages || [])
        }
      } else {
        // Create new conversation
        const { data: newConv } = await aiService.createConversation(user.id, {
          title: 'AI Coach Chat',
          context,
        })
        if (newConv) {
          setConversation(newConv)
          // Add welcome message
          const welcomeMsg: AIMessage = {
            id: 'welcome',
            conversation_id: newConv.id,
            role: 'assistant',
            content:
              "Hi! I'm your AI coaching assistant. I can help you prepare for practice, understand drills, and answer questions about your training. What would you like to know?",
            created_at: new Date().toISOString(),
          }
          setMessages([welcomeMsg])
        }
      }
    } catch (error) {
      console.error('Error initializing chat:', error)
    } finally {
      setInitializing(false)
    }
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !conversation || !user?.id) return

    const userMessage = inputMessage.trim()
    setInputMessage('')
    setLoading(true)

    try {
      // Add user message to UI immediately
      const tempUserMsg: AIMessage = {
        id: `temp-${Date.now()}`,
        conversation_id: conversation.id,
        role: 'user',
        content: userMessage,
        created_at: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, tempUserMsg])

      // Send to AI service
      const { data: aiResponse } = await aiService.generateAIResponse(
        conversation.id,
        userMessage,
        context
      )

      // Reload messages to get the actual AI response
      const { data: updatedMessages } = await aiService.getMessages(conversation.id)
      if (updatedMessages) {
        setMessages(updatedMessages)
      }
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (initializing) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Initializing AI chat...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white text-xl">🤖</span>
          </div>
          <div>
            <h3 className="font-semibold">AI Coach</h3>
            <p className="text-xs text-gray-500">Always here to help</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              <p
                className={`text-xs mt-1 ${
                  message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                }`}
              >
                {new Date(message.created_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-3">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex space-x-2">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about your training..."
            rows={2}
            disabled={loading}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:bg-gray-100"
          />
          <button
            onClick={handleSendMessage}
            disabled={loading || !inputMessage.trim()}
            className="px-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          💡 Tip: Ask about upcoming practice, drill techniques, or mental preparation
        </p>
      </div>
    </div>
  )
}
