// src/lib/logActivity.js
// Call this function anywhere to log an activity
export async function logActivity({ performed_by, performed_by_name, role, action, target_type, target_name, details }) {
  try {
    const { supabase } = await import('./supabase')
    await supabase.from('activity_logs').insert({
      performed_by,
      performed_by_name,
      role,
      action,
      target_type,
      target_name,
      details: details || ''
    })
  } catch(e) {
    console.error('Activity log failed:', e)
  }
}
