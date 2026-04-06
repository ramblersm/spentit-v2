import { getAuthUser, supabase } from './_auth.js'

export default async function handler(req, res) {
  const user = await getAuthUser(req)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      return res.status(500).json({ error: error.message })
    }
    return res.status(200).json(data || {})
  }

  if (req.method === 'PATCH') {
    const { monthly_budget, avatar_id, timezone } = req.body
    
    const updates = {}
    if (monthly_budget !== undefined) updates.monthly_budget = parseFloat(monthly_budget)
    if (avatar_id !== undefined) updates.avatar_id = avatar_id
    if (timezone !== undefined) updates.timezone = timezone

    console.log('[api/user-settings] patching user:', user.id, 'updates:', updates)

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      console.error('[api/user-settings] patch error:', error.message)
      return res.status(500).json({ error: error.message })
    }
    return res.status(200).json(data)
  }

  return res.status(405).end()
}
