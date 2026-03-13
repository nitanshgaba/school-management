import { createClient } from "@supabase/supabase-js"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Wake up Supabase on app start to avoid cold start delays
supabase.from('profiles').select('id').limit(1).then(() => {
  console.log('Supabase connection ready')
})
