import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { email } = req.body
  if (!email) return res.status(400).json({ error: 'Email required' })

  const { error } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email,
  })

  if (error) return res.status(500).json({ error: error.message })
  return res.status(200).json({ success: true })
}
