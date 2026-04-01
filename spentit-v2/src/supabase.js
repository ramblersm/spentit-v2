import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = url?.startsWith('https://') && key && key !== 'your_supabase_anon_key'
  ? createClient(url, key)
  : null
