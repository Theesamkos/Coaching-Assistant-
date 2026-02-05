import { getUserFromReq } from '../_lib/auth'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const { user } = await getUserFromReq(req)
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  let body
  try {
    body = await req.json()
  } catch (err) {
    res.status(400).json({ error: 'Invalid JSON body' })
    return
  }

  const messages = Array.isArray(body.messages) ? body.messages : null
  if (!messages || messages.length === 0) {
    res.status(400).json({ error: 'messages is required' })
    return
  }

  const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY
  const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-2.1'

  // Supabase admin client used for audit logging and simple rate limiting
  const admin =
    process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_URL
      ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
      : null

  if (!ANTHROPIC_KEY) {
    const assistantReply = {
      id: 'stub-1',
      role: 'assistant',
      content: `No Anthropic key configured. Set ANTHROPIC_API_KEY to enable the assistant.`,
    }
    // Log stub usage when possible
    try {
      if (admin) {
        await admin.from('assistant_logs').insert({
          user_id: user.id,
          input: messages,
          response: { stub: true, message: assistantReply },
          model: null,
          ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || null,
        })
      }
    } catch (err) {
      console.error('failed to log stub assistant call', err)
    }
    res.status(200).json({ data: assistantReply })
    return
  }

  // Convert messages array to an Anthropic-style prompt
  // Map roles: user -> Human, assistant -> Assistant, system -> System (included as comment)
  const promptParts = messages.map(m => {
    if (m.role === 'user') return `Human: ${m.content}`
    if (m.role === 'assistant') return `Assistant: ${m.content}`
    return `System: ${m.content}`
  })
  const prompt = promptParts.join('\n\n') + '\n\nAssistant:'

  // Rate limiting: simple per-user check against assistant_logs in last window
  try {
    if (admin) {
      const WINDOW_MS = Number(process.env.ASSISTANT_RATE_LIMIT_WINDOW_MS) || 60000
      const MAX_REQS = Number(process.env.ASSISTANT_RATE_LIMIT_MAX) || 6
      const cutoff = new Date(Date.now() - WINDOW_MS).toISOString()
      const listResp = await admin
        .from('assistant_logs')
        .select('id', { count: 'exact' })
        .gte('created_at', cutoff)
        .eq('user_id', user.id)

      const recentCount = listResp.count || 0
      if (recentCount >= MAX_REQS) {
        res.status(429).json({ error: 'Rate limit exceeded' })
        return
      }
    }
  } catch (err) {
    console.error('rate limit check failed', err)
    // proceed without blocking if rate limit check fails
  }

  try {
    const resp = await fetch('https://api.anthropic.com/v1/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        prompt,
        max_tokens_to_sample: 800,
        temperature: 0.2,
      }),
    })

    if (!resp.ok) {
      const text = await resp.text()
      console.error('Anthropic error', resp.status, text)
      res.status(502).json({ error: 'Model provider error' })
      return
    }

    const data = await resp.json()
    // Anthropic completion API returns `completion`
    const completion = data?.completion || ''
    const assistantMessage = { role: 'assistant', content: completion }

    // Persist audit log
    try {
      if (admin) {
        await admin.from('assistant_logs').insert({
          user_id: user.id,
          input: messages,
          response: { model: ANTHROPIC_MODEL, completion },
          model: ANTHROPIC_MODEL,
          ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || null,
        })
      }
    } catch (err) {
      console.error('failed to write assistant log', err)
    }

    res.status(200).json({ data: assistantMessage })
  } catch (err) {
    console.error('assistant handler error', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}
