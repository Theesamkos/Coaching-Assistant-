import { createClient } from '@supabase/supabase-js'
import { getUserFromReq } from '../_lib/auth'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { user } = await getUserFromReq(req)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  const { fileId, comment, timestampPosition } = req.body || {}
  if (!fileId || !comment) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  try {
    // Ensure user has access to the file
    const { data: file } = await supabase
      .from('files')
      .select('uploaded_by,is_public')
      .eq('id', fileId)
      .single()
    if (!file) return res.status(404).json({ error: 'File not found' })

    const isOwner = file.uploaded_by === user.id
    const isPublic = file.is_public === true
    const { data: shares } = await supabase
      .from('file_shares')
      .select('*')
      .eq('file_id', fileId)
      .eq('shared_with_user_id', user.id)
    const isShared = (shares || []).length > 0

    if (!isOwner && !isPublic && !isShared) return res.status(403).json({ error: 'Forbidden' })

    const { data, error } = await supabase
      .from('file_comments')
      .insert([
        {
          file_id: fileId,
          user_id: user.id,
          comment,
          timestamp_position: timestampPosition || null,
        },
      ])
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })

    return res.status(200).json({ data })
  } catch (err) {
    console.error('comment error', err)
    return res.status(500).json({ error: 'Failed to add comment' })
  }
}
