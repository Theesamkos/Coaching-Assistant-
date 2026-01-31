import { createClient } from '@supabase/supabase-js'
import { getUserFromReq } from '../_lib/auth'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

export default async function handler(req, res) {
  const { user } = await getUserFromReq(req)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  const { id } = req.query
  const { storagePath } = req.body || {}

  if (!id) return res.status(400).json({ error: 'Missing file id' })

  try {
    // Ensure the requester is the owner
    const { data: file } = await supabase.from('files').select('uploaded_by').eq('id', id).single()
    if (!file) return res.status(404).json({ error: 'File not found' })
    if (file.uploaded_by !== user.id) return res.status(403).json({ error: 'Forbidden' })

    if (storagePath) {
      await supabase.storage.from('files').remove([storagePath])
    }

    const { error } = await supabase.from('files').delete().eq('id', id)
    if (error) return res.status(500).json({ error: error.message })

    return res.status(200).json({ success: true })
  } catch (err) {
    console.error('files delete error', err)
    return res.status(500).json({ error: 'Failed to delete file' })
  }
}
