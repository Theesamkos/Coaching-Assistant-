import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

export default async function handler(req, res) {
  try {
    const { entityType } = req.query

    let query = supabase.from('files').select('*')
    if (entityType) query = query.eq('entity_type', entityType)

    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) return res.status(500).json({ error: error.message })

    return res.status(200).json({ data })
  } catch (err) {
    console.error('files list error', err)
    return res.status(500).json({ error: 'Failed to list files' })
  }
}
