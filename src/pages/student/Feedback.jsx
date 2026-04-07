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

  if (loading) return (
    <div style={styles.loadingBox}>
      <div style={{ fontSize: '40px', marginBottom: '16px' }}>💬</div>
      <div style={{ color: '#64748b', fontWeight: '600' }}>Fetching your feedback...</div>
    </div>
  )

  return (
    <div style={styles.container}>
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Teacher Feedback</h1>
          <p style={styles.pageSubtitle}>Personal comments and performance reviews from your instructors</p>
        </div>
      </div>

      <div style={styles.fadeIn}>
        {feedbacks.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={{ fontSize: '56px', marginBottom: '16px' }}>📭</div>
            <h3 style={{ color: '#374151', margin: '0 0 8px 0' }}>No Feedback Yet</h3>
            <p style={{ color: '#6b7280', margin: 0 }}>Your academic feedback and remarks will appear here.</p>
          </div>
        ) : (
          <div style={styles.timeline}>
            {feedbacks.map((f, index) => (
              <div key={f.id} style={styles.feedbackItem}>
                {/* Vertical Timeline Line */}
                {index !== feedbacks.length - 1 && <div style={styles.timelineLine} />}
                
                <div style={styles.avatarColumn}>
                  <div style={{ 
                    ...styles.avatar, 
                    backgroundColor: ['#4f46e5', '#10b981', '#f59e0b', '#ef4444'][index % 4] 
                  }}>
                    {(f.sent_by_profile?.name || 'T').charAt(0).toUpperCase()}
                  </div>
                </div>

                <div style={styles.contentColumn}>
                  <div style={styles.card}>
                    <div style={styles.cardHeader}>
                      <div>
                        <p style={styles.teacherName}>{f.sent_by_profile?.name || 'Teacher'}</p>
                        <p style={styles.dateText}>
                          {new Date(f.created_at).toLocaleString('en-IN', { 
                            day: '2-digit', month: 'short', year: 'numeric', 
                            hour: '2-digit', minute: '2-digit', hour12: true 
                          })}
                        </p>
                      </div>
                      <span style={styles.typeBadge}>Academic Remark</span>
                    </div>
                    
                    <div style={styles.messageBox}>
                      <p style={styles.messageText}>{f.message}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const styles = {
  container: { maxWidth: '850px', margin: '0 auto', padding: '20px', fontFamily: 'Inter, sans-serif' },
  pageHeader: { marginBottom: '32px' },
  pageTitle: { fontSize: '32px', fontWeight: '800', color: '#111827', margin: '0 0 8px 0', letterSpacing: '-0.5px' },
  pageSubtitle: { fontSize: '15px', color: '#64748b', margin: 0 },
  
  loadingBox: { textAlign: 'center', padding: '100px 0' },
  fadeIn: { animation: 'fadeIn 0.3s ease-in' },

  timeline: { display: 'flex', flexDirection: 'column', gap: '32px', position: 'relative', paddingLeft: '10px' },
  feedbackItem: { display: 'flex', gap: '20px', position: 'relative' },
  timelineLine: { position: 'absolute', left: '20px', top: '40px', bottom: '-40px', width: '2px', backgroundColor: '#e2e8f0', zIndex: 0 },
  
  avatarColumn: { zIndex: 1 },
  avatar: { width: '42px', height: '42px', borderRadius: '50%', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '800', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', border: '3px solid #fff' },
  
  contentColumn: { flex: 1 },
  card: { backgroundColor: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' },
  
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' },
  teacherName: { margin: 0, fontSize: '15px', fontWeight: '800', color: '#0f172a' },
  dateText: { margin: '2px 0 0 0', fontSize: '12px', color: '#94a3b8', fontWeight: '500' },
  
  typeBadge: { backgroundColor: '#f8fafc', color: '#64748b', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700', border: '1px solid #e2e8f0', textTransform: 'uppercase', letterSpacing: '0.5px' },
  
  messageBox: { backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #f1f5f9' },
  messageText: { margin: 0, fontSize: '15px', color: '#334155', lineHeight: '1.7', whiteSpace: 'pre-wrap' },

  emptyState: { textAlign: 'center', padding: '80px 20px', border: '2px dashed #e2e8f0', borderRadius: '20px', backgroundColor: '#fafaf9' },
}