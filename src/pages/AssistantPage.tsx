import React, { useState } from 'react'
import { aiService } from '@/services/aiService'
import ProtectedRoute from '@/components/routing/ProtectedRoute'

export default function AssistantPage() {
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSend(e?: React.FormEvent) {
    e?.preventDefault()
    const trimmed = input.trim()
    if (!trimmed) return

    const userMsg = { role: 'user', content: trimmed }
    const next = [...messages, userMsg]
    setMessages(next)
    setInput('')
    setLoading(true)

    try {
      const resp = await aiService.sendMessage(next)
      const assistant = { role: resp.role || 'assistant', content: resp.content || '' }
      setMessages(m => [...m, assistant])
    } catch (err) {
      setMessages(m => [...m, { role: 'assistant', content: 'Error contacting assistant.' }])
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-3xl mx-auto bg-white shadow rounded-lg overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">AI Assistant</h2>
          <p className="text-sm text-slate-500">
            Ask questions about drills, players, and your data.
          </p>
        </div>

        <div className="p-4 h-96 overflow-auto space-y-3" id="assistant-chat">
          {messages.length === 0 && (
            <div className="text-slate-500">No messages yet — ask something to get started.</div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`rounded-lg px-3 py-2 max-w-[80%] ${
                  m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-900'
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSend} className="p-4 border-t flex gap-2">
          <input
            className="flex-1 border rounded px-3 py-2"
            placeholder="Type a message..."
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={loading}
          />
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Thinking…' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  )
}
