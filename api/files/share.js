import { createClient } from '@supabase/supabase-js'
import { getUserFromReq } from '../_lib/auth'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { user } = await getUserFromReq(req)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  const { fileId, sharedWithUserId, permissionLevel = 'view' } = req.body || {}
  if (!fileId || !sharedWithUserId) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  try {
    // Only file owner can create shares
    const { data: file } = await supabase
      .from('files')
      .select('uploaded_by')
      .eq('id', fileId)
      .single()
    if (!file) return res.status(404).json({ error: 'File not found' })
    if (file.uploaded_by !== user.id) return res.status(403).json({ error: 'Forbidden' })

    const { data, error } = await supabase
      .from('file_shares')
      .insert([
        {
          file_id: fileId,
          shared_with_user_id: sharedWithUserId,
          permission_level: permissionLevel,
          shared_by_user_id: user.id,
        },
      ])
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })

    return res.status(200).json({ data })
  } catch (err) {
    console.error('share error', err)
    return res.status(500).json({ error: 'Failed to share file' })
  }
}
