import { describe, it, expect, vi } from 'vitest'

// Helper request/response builders used to invoke the handler
function makeReq(query: Record<string, any> = {}, headers: Record<string, string> = {}) {
  return {
    query,
    headers,
  } as any
}

function makeRes() {
  let status = 200
  const body: any = {}
  return {
    status(code: number) {
      status = code
      return this
    },
    json(payload: any) {
      body.payload = payload
      return Promise.resolve()
    },
    _status: () => status,
    _body: () => body.payload,
  } as any
}

describe('api/files/search handler', () => {
  it('returns 401 when no auth header', async () => {
    // Mock the auth helper to return no user
    vi.resetModules()
    vi.doMock('../../api/_lib/auth', () => ({
      getUserFromReq: async () => ({ user: null }),
    }))
    // Mock supabase client used by the handler so module initialization doesn't fail
    vi.doMock('@supabase/supabase-js', () => {
      const mockQuery: any = {
        select: () => mockQuery,
        eq: () => mockQuery,
        ilike: () => mockQuery,
        or: () => mockQuery,
        order: () => mockQuery,
        range: () => mockQuery,
        then: (resolve: any) => resolve({ data: [], error: null, count: 0 }),
      }
      return { createClient: () => ({ from: () => mockQuery }) }
    })

    const { default: searchHandler } = await import('../../api/files/search')

    const req: any = makeReq({ q: 'test' }, {})
    const res: any = makeRes()
    await searchHandler(req, res)
    expect(res._status()).toBe(401)
    expect(res._body()).toHaveProperty('error')
  })

  it('optionally runs an integration smoke test when SUPABASE configured', async () => {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      expect(true).toBe(true)
      return
    }

    // Reset mocks and import real handler to hit Supabase (requires env vars)
    vi.resetModules()
    const { default: searchHandler } = await import('../../api/files/search')

    const req: any = makeReq(
      { q: '' },
      { authorization: `Bearer ${process.env.SUPABASE_TEST_TOKEN || ''}` }
    )
    const res: any = makeRes()
    await searchHandler(req, res)
    const status = res._status()
    expect([200, 204]).toContain(status)
    const body = res._body()
    if (body && body.data) {
      expect(Array.isArray(body.data)).toBe(true)
      expect(body).toHaveProperty('count')
    }
  })
})
