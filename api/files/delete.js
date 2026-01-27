import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

export default async function handler(req, res) {
  const { id } = req.query
  const { storagePath } = req.body || {}

  if (!id) return res.status(400).json({ error: 'Missing file id' })

  try {
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
