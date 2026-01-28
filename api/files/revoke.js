import { createClient } from '@supabase/supabase-js'
import { getUserFromReq } from '../_lib/auth'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { user } = await getUserFromReq(req)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  const { shareId } = req.body || {}
  if (!shareId) return res.status(400).json({ error: 'Missing shareId' })

  try {
    const { data: share, error: shareErr } = await supabase
      .from('file_shares')
      .select('id,file_id,shared_by_user_id')
      .eq('id', shareId)
      .single()
    if (shareErr) return res.status(500).json({ error: shareErr.message })
    if (!share) return res.status(404).json({ error: 'Share not found' })

    const { data: file, error: fileErr } = await supabase
      .from('files')
      .select('uploaded_by')
      .eq('id', share.file_id)
      .single()
    if (fileErr) return res.status(500).json({ error: fileErr.message })
    if (!file) return res.status(404).json({ error: 'File not found' })

    // Only file owner can revoke shares
    if (file.uploaded_by !== user.id) return res.status(403).json({ error: 'Forbidden' })

    const { error: delErr } = await supabase.from('file_shares').delete().eq('id', shareId)
    if (delErr) return res.status(500).json({ error: delErr.message })

    return res.status(200).json({ success: true })
  } catch (err) {
    console.error('revoke share error', err)
    return res.status(500).json({ error: 'Failed to revoke share' })
  }
}
