import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  const { token_hash, type } = req.query

  if (token_hash && type === 'email') {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: 'email',
    })
    if (!error) return res.redirect('/')
  }

  return res.redirect('/?error=auth_failed')
}
