// src/lib/schoolSettings.js
// Cached school settings — fetched once, used everywhere
let cache = null

export async function getSchoolSettings() {
  if (cache) return cache
  const { supabase } = await import('./supabase')
  const { data } = await supabase.from('school_settings').select('*').single()
  cache = data || {}
  return cache
}

export function clearSchoolSettingsCache() {
  cache = null
}
