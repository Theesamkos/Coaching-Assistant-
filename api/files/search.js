import { createClient } from '@supabase/supabase-js'
import { getUserFromReq } from '../_lib/auth'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

export default async function handler(req, res) {
  const { user } = await getUserFromReq(req)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  try {
    const { q, entityType, fileType, sort = 'newest', page = '1', pageSize = '20' } = req.query

    const pageNum = Math.max(1, parseInt(page, 10) || 1)
    const perPage = Math.max(1, Math.min(parseInt(pageSize, 10) || 20, 200))
    const from = (pageNum - 1) * perPage
    const to = from + perPage - 1

    let select = '*, file_shares(*), file_comments(*)'

    let query = supabase.from('files').select(select, { count: 'exact' })

    if (entityType) query = query.eq('entity_type', entityType)
    if (fileType) query = query.ilike('file_type', `${fileType}%`)

    if (q) {
      const escaped = q.replace(/%/g, '\\%')
      query = query.or(`file_name.ilike.%${escaped}%,description.ilike.%${escaped}%`)
    }

    // Only return files visible to the user: uploaded by them, shared with them, or public
    query = query.or(
      `uploaded_by.eq.${user.id},is_public.eq.true,file_shares.shared_with_user_id.eq.${user.id}`
    )

    const orderAsc = sort === 'oldest'
    query = query.order('created_at', { ascending: orderAsc }).range(from, to)

    const { data, error, count } = await query
    if (error) {
      console.error('files search error', error)
      return res.status(500).json({ error: error.message })
    }

    return res
      .status(200)
      .json({ data: data || [], count: count || 0, page: pageNum, pageSize: perPage })
  } catch (err) {
    console.error('files search exception', err)
    return res.status(500).json({ error: 'Failed to search files' })
  }
}
