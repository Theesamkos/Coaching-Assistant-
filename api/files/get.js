import { createClient } from '@supabase/supabase-js'
import { getUserFromReq } from '../_lib/auth'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

export default async function handler(req, res) {
  const { user } = await getUserFromReq(req)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  const { id } = req.query
  if (!id) return res.status(400).json({ error: 'Missing file id' })

  try {
    const { data, error } = await supabase.from('files').select('*').eq('id', id).single()
    if (error) return res.status(500).json({ error: error.message })

    // Authorization: allow if owner, public, or shared
    const isOwner = data.uploaded_by === user.id
    const isPublic = data.is_public === true
    const { data: shares } = await supabase
      .from('file_shares')
      .select('*')
      .eq('file_id', id)
      .eq('shared_with_user_id', user.id)
    const isShared = (shares || []).length > 0

    if (!isOwner && !isPublic && !isShared) return res.status(403).json({ error: 'Forbidden' })

    return res.status(200).json({ data })
  } catch (err) {
    console.error('files get error', err)
    return res.status(500).json({ error: 'Failed to fetch file' })
  }
}
