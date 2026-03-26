import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { name, properties, user_id } = req.body

  if (!name) return res.status(400).json({ error: 'Event name required' })

  const { error } = await supabase.from('events').insert({
    user_id: user_id || null,
    name,
    properties: properties || {},
    occurred_at: new Date().toISOString(),
  })

  if (error) return res.status(500).json({ error: error.message })
  return res.status(201).end()
}
