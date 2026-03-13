import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

export default function StudentFeedback() {
  const { profile } = useAuth()
  const [feedbacks, setFeedbacks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (profile?.id) fetchFeedback() }, [profile])

  const fetchFeedback = async () => {
    const { data } = await supabase
      .from('feedback')
      .select('*, sent_by_profile:profiles!feedback_sent_by_fkey(name)')
      .eq('student_id', profile.id)
      .order('created_at', { ascending: false })
    setFeedbacks(data || [])
    setLoading(false)
  }

  if (loading) return <div style={styles.loading}>Loading...</div>

  return (
    <div>
      <h1 style={styles.title}>My Feedback</h1>
      {feedbacks.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={{ fontSize: '64px' }}>💬</div>
          <p style={{ color: '#9ca3af', marginTop: '12px' }}>No feedback received yet</p>
        </div>
      ) : (
        <div style={styles.list}>
          {feedbacks.map(f => (
            <div key={f.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={styles.teacherInfo}>
                  <div style={styles.avatar}>
                    {(f.sent_by_profile?.name || 'T').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p style={styles.teacherName}>{f.sent_by_profile?.name || 'Teacher'}</p>
                    <p style={styles.date}>{new Date(f.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
                <span style={styles.badge}>💬 Feedback</span>
              </div>
              <p style={styles.message}>{f.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const styles = {
  loading: { textAlign: 'center', padding: '40px', color: '#9ca3af' },
  title: { fontSize: '24px', fontWeight: '700', color: '#1a1a2e', marginBottom: '24px' },
  emptyState: { textAlign: 'center', padding: '80px 0' },
  list: { display: 'flex', flexDirection: 'column', gap: '16px' },
  card: { backgroundColor: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', borderLeft: '4px solid #4f46e5' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  teacherInfo: { display: 'flex', alignItems: 'center', gap: '12px' },
  avatar: { width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#4f46e5', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '700' },
  teacherName: { fontSize: '14px', fontWeight: '700', color: '#1a1a2e', margin: 0 },
  date: { fontSize: '12px', color: '#9ca3af', margin: '2px 0 0' },
  badge: { backgroundColor: '#ede9fe', color: '#4f46e5', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' },
  message: { fontSize: '14px', color: '#374151', lineHeight: '1.7', margin: 0, backgroundColor: '#f9fafb', padding: '12px', borderRadius: '8px' },
}
