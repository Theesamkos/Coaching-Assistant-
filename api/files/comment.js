import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { fileId, userId, comment, timestampPosition } = req.body || {}
  if (!fileId || !userId || !comment) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  try {
    const { data, error } = await supabase
      .from('file_comments')
      .insert([
        {
          file_id: fileId,
          user_id: userId,
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
