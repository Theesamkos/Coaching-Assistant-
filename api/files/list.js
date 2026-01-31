import { createClient } from '@supabase/supabase-js'
import { getUserFromReq } from '../_lib/auth'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

export default async function handler(req, res) {
  const { user } = await getUserFromReq(req)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  try {
    const { entityType } = req.query

    let query = supabase.from('files').select('*')
    if (entityType) query = query.eq('entity_type', entityType)

    // Only return files the user owns, files shared with them, or public files
    query = query.or(`uploaded_by.eq.${user.id},is_public.eq.true`)

    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) return res.status(500).json({ error: error.message })

    return res.status(200).json({ data })
  } catch (err) {
    console.error('files list error', err)
    return res.status(500).json({ error: 'Failed to list files' })
  }
}
