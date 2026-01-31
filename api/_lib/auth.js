import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

export async function getUserFromReq(req) {
  const authHeader = req.headers?.authorization || req.headers?.Authorization
  if (!authHeader) return { user: null }

  const parts = authHeader.split(' ')
  if (parts.length !== 2) return { user: null }

  const token = parts[1]

  try {
    // Try both common call shapes depending on supabase-js version
    let resp = await supabase.auth.getUser(token).catch(() => null)
    if (!resp || resp.error) {
      resp = await supabase.auth.getUser({ access_token: token }).catch(() => null)
    }

    const user = resp?.data?.user || null
    return { user }
  } catch (err) {
    console.error('auth helper error', err)
    return { user: null }
  }
}
