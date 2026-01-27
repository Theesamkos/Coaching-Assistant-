import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { fileId, sharedWithUserId, permissionLevel = 'view', sharedByUserId } = req.body || {}
  if (!fileId || !sharedWithUserId || !sharedByUserId) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  try {
    const { data, error } = await supabase
      .from('file_shares')
      .insert([
        {
          file_id: fileId,
          shared_with_user_id: sharedWithUserId,
          permission_level: permissionLevel,
          shared_by_user_id: sharedByUserId,
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
