import { getAuthUser, supabase } from '../_auth.js'

export default async function handler(req, res) {
  const { id } = req.query

  if (req.method === 'PATCH') {
    const user = await getAuthUser(req)
    if (!user) return res.status(401).json({ error: 'Unauthorized' })

    const { amount, category, note, type, date } = req.body

    const { data, error } = await supabase
      .from('expenses')
      .update({ amount, category, note, type, date })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }

  if (req.method === 'DELETE') {
    const user = await getAuthUser(req)
    if (!user) return res.status(401).json({ error: 'Unauthorized' })

    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) return res.status(500).json({ error: error.message })
    return res.status(204).end()
  }

  return res.status(405).end()
}
