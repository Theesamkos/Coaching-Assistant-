import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

export default async function handler(req, res) {
  const {
    fileName = 'file',
    fileType = 'application/octet-stream',
    expiresIn = '3600',
    entityType = 'general',
  } = req.query

  import { getUserFromReq } from '../_lib/auth'

  try {
    const { user } = await getUserFromReq(req)
    if (!user) return res.status(401).json({ error: 'Unauthorized' })
    const path = `${entityType}/${user.id}/${Date.now()}-${fileName}`

    // Return a generated storage path and a public URL (clients may still upload via Supabase client)
    const { data: publicData } = supabase.storage.from('files').getPublicUrl(path)

    return res.status(200).json({ path, publicUrl: publicData.publicUrl })
  } catch (err) {
    console.error('presigned error', err)
    return res.status(500).json({ error: 'Failed to generate presigned info' })
  }
}
