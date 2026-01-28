import { createClient } from '@supabase/supabase-js'
import { getUserFromReq } from '../_lib/auth'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

export default async function handler(req, res) {
  const { user } = await getUserFromReq(req)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  try {
    if (req.method === 'GET') {
      const { fileId } = req.query
      if (!fileId) return res.status(400).json({ error: 'Missing fileId' })

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
        .select('*')
        .eq('file_id', fileId)
        .order('created_at', { ascending: false })
      if (error) return res.status(500).json({ error: error.message })

      return res.status(200).json({ data })
    }

    if (req.method === 'DELETE') {
      const { id } = req.query
      if (!id) return res.status(400).json({ error: 'Missing comment id' })

      // Get comment and file
      const { data: comment, error: cErr } = await supabase
        .from('file_comments')
        .select('*')
        .eq('id', id)
        .single()
      if (cErr) return res.status(500).json({ error: cErr.message })
      if (!comment) return res.status(404).json({ error: 'Comment not found' })

      const { data: file } = await supabase
        .from('files')
        .select('uploaded_by')
        .eq('id', comment.file_id)
        .single()
      if (!file) return res.status(404).json({ error: 'File not found' })

      // Allow deletion if comment author or file owner
      if (comment.user_id !== user.id && file.uploaded_by !== user.id)
        return res.status(403).json({ error: 'Forbidden' })

      const { error: delErr } = await supabase.from('file_comments').delete().eq('id', id)
      if (delErr) return res.status(500).json({ error: delErr.message })

      return res.status(200).json({ success: true })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error('comments handler error', err)
    return res.status(500).json({ error: 'Comments handler failure' })
  }
}
