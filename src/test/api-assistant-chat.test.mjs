import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Hoisted mocks so they are applied before the handler module is imported
vi.mock('../../api/_lib/auth', () => ({
  getUserFromReq: async () => ({ user: { id: '1111-2222-3333-4444' } }),
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: () => ({
      insert: async () => ({ error: null }),
      select: async () => ({ count: 0 }),
    }),
  }),
}))

function makeReq(headers = {}, body = {}) {
  return {
    method: 'POST',
    headers,
    json: async () => body,
    socket: { remoteAddress: '127.0.0.1' },
  }
}

function makeRes() {
  const res = {}
  res.status = code => {
    res.statusCode = code
    return res
  }
  res.json = payload => {
    res.body = payload
    return res
  }
  return res
}

describe('api/assistant/chat', () => {
  let origFetch

  beforeEach(() => {
    origFetch = global.fetch
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ completion: 'Hello from Claude (mock).' }),
    })
  })

  afterEach(() => {
    vi.resetAllMocks()
    global.fetch = origFetch
    delete process.env.ANTHROPIC_API_KEY
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
    delete process.env.SUPABASE_URL
  })

  it('returns 400 when messages missing', async () => {
    const { default: handler } = await import('../../api/assistant/chat.js')
    const req = makeReq({ authorization: 'Bearer token' }, {})
    const res = makeRes()
    // @ts-ignore
    await handler(req, res)
    expect(res.statusCode).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('proxies to Anthropic and logs', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'svc-key'
    process.env.SUPABASE_URL = 'https://example.supabase.co'

    const { default: handler } = await import('../../api/assistant/chat.js')
    const req = makeReq(
      { authorization: 'Bearer token' },
      { messages: [{ role: 'user', content: 'Hi' }] }
    )
    const res = makeRes()
    // @ts-ignore
    await handler(req, res)

    expect(res.statusCode).toBe(200)
    expect(res.body.data).toHaveProperty('content')
    expect(global.fetch.mock.calls[0][0]).toContain('api.anthropic.com')
  })
})
