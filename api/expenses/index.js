import { getAuthUser, supabase } from '../_auth.js'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const user = await getAuthUser(req)
    if (!user) return res.status(401).json({ error: 'Unauthorized' })

    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }

  if (req.method === 'POST') {
    const user = await getAuthUser(req)
    if (!user) return res.status(401).json({ error: 'Unauthorized' })

    const { id, amount, category, note, type, date, createdAt } = req.body

    const { data, error } = await supabase
      .from('expenses')
      .insert({
        id,
        user_id: user.id,
        amount,
        category,
        note: note || '',
        type: type || 'personal',
        date,
        created_at: new Date(createdAt).toISOString(),
      })
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })
    return res.status(201).json(data)
  }

  return res.status(405).end()
}
