import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  const { token_hash, type } = req.query

  if (token_hash && type === 'email') {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash,
      type: 'email',
    })
    if (!error && data.session) {
      const { access_token, refresh_token } = data.session
      // Tokens passed as query params — App.jsx picks them up and cleans the URL
      return res.redirect(
        `/?access_token=${access_token}&refresh_token=${refresh_token}&type=magiclink`
      )
    }
  }

  return res.redirect('/?error=auth_failed')
}
