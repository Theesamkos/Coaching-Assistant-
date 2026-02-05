import { supabase } from '@/config/supabase'

export const aiService = {
  async _authHeaders(): Promise<Record<string, string>> {
    try {
      const session = await supabase.auth.getSession()
      const token = session.data.session?.access_token
      if (token) return { Authorization: `Bearer ${token}` }
    } catch (err) {
      // ignore
    }
    return {}
  },

  async sendMessage(messages: Array<{ role: string; content: string }>) {
    const resp = await fetch('/api/assistant/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(await this._authHeaders()),
      },
      body: JSON.stringify({ messages }),
    })

    const body = await resp.json()
    if (body.error) throw new Error(body.error || 'AI request failed')
    return body.data
  },
}
