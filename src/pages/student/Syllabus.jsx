import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

export default function StudentSyllabus() {
  const { profile } = useAuth()
  const [syllabi, setSyllabi] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchSyllabus() }, [])

  const fetchSyllabus = async () => {
    const { data: studentData } = await supabase.from('students').select('class_id').eq('id', profile.id).single()
    if (!studentData) { setLoading(false); return }
    
    const { data } = await supabase
      .from('syllabus')
      .select('*, classes(name), subjects(name)')
      .eq('class_id', studentData.class_id)
      .order('created_at', { ascending: false })
      
    setSyllabi(data || [])
    setLoading(false)
  }

  if (loading) return (
    <div style={styles.loadingContainer}>
      <div style={{ fontSize: '40px', marginBottom: '16px' }}>📖</div>
      <div style={{ color: '#64748b', fontSize: '16px', fontWeight: '600' }}>Loading curriculum...</div>
    </div>
  )

  return (
    <div style={styles.container}>
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Course Syllabus</h1>
          <p style={styles.pageSubtitle}>Download and view the curriculum for your current session</p>
        </div>
      </div>

      {syllabi.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyStateIcon}>📚</div>
          <h3 style={{ color: '#374151', margin: '0 0 8px 0' }}>No Syllabus Found</h3>
          <p style={{ color: '#6b7280', margin: 0, fontSize: '14px' }}>Your teachers haven't uploaded any documents for your class yet.</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {syllabi.map((s, index) => (
            <div key={s.id} style={styles.card}>
              <div style={styles.cardMain}>
                {/* Subject Avatar */}
                <div style={{ 
                  ...styles.subjectAvatar, 
                  backgroundColor: ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][index % 5] 
                }}>
                  {s.subjects?.name ? s.subjects.name.charAt(0).toUpperCase() : 'S'}
                </div>

                <div style={styles.cardInfo}>
                  <div style={styles.cardHeaderRow}>
                    <p style={styles.cardTitle}>{s.subjects?.name || 'General Syllabus'}</p>
                    <span style={styles.classBadge}>Class {s.classes?.name}</span>
                  </div>
                  
                  {s.title && <p style={styles.docTitle}>📄 {s.title}</p>}
                  
                  {s.description && <p style={styles.cardDesc}>{s.description}</p>}
                  
                  <div style={styles.cardFooter}>
                    <span style={styles.cardDate}>
                      Uploaded on {new Date(s.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Area */}
              <div style={styles.cardActions}>
                {s.file_url ? (
                  <a href={s.file_url} target="_blank" rel="noreferrer" style={styles.downloadBtn}>
                    <span style={{ marginRight: '8px' }}>📥</span> Download PDF
                  </a>
                ) : (
                  <button style={styles.disabledBtn} disabled>Not Available</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── STYLES ────────────────────────────────────────────────
const styles = {
  container: { maxWidth: '1000px', margin: '0 auto', padding: '20px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' },
  pageHeader: { marginBottom: '32px' },
  pageTitle: { fontSize: '32px', fontWeight: '800', color: '#111827', margin: '0 0 8px 0', letterSpacing: '-0.5px' },
  pageSubtitle: { fontSize: '15px', color: '#6b7280', margin: 0 },
  
  loadingContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' },

  grid: { display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeIn 0.3s ease-in' },
  
  card: { 
    backgroundColor: '#fff', 
    borderRadius: '16px', 
    padding: '24px', 
    boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)', 
    border: '1px solid #f1f5f9',
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    gap: '24px',
    flexWrap: 'wrap',
    transition: 'all 0.2s',
    ':hover': { boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }
  },

  cardMain: { display: 'flex', alignItems: 'flex-start', gap: '20px', flex: 1, minWidth: '300px' },
  
  subjectAvatar: { 
    width: '56px', 
    height: '56px', 
    borderRadius: '12px', 
    color: '#fff', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    fontSize: '24px', 
    fontWeight: '800',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
    flexShrink: 0
  },

  cardInfo: { flex: 1 },
  cardHeaderRow: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' },
  cardTitle: { fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0 },
  classBadge: { backgroundColor: '#eff6ff', color: '#2563eb', padding: '2px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700', border: '1px solid #bfdbfe' },
  
  docTitle: { fontSize: '14px', fontWeight: '600', color: '#475569', margin: '4px 0' },
  cardDesc: { fontSize: '13px', color: '#64748b', margin: '8px 0', lineHeight: '1.5' },
  
  cardFooter: { marginTop: '12px', display: 'flex', alignItems: 'center' },
  cardDate: { fontSize: '12px', color: '#94a3b8', fontWeight: '500' },

  cardActions: { flexShrink: 0 },
  downloadBtn: { 
    display: 'inline-flex',
    alignItems: 'center',
    padding: '10px 20px', 
    backgroundColor: '#eef2ff', 
    color: '#4f46e5', 
    borderRadius: '10px', 
    fontSize: '14px', 
    textDecoration: 'none', 
    fontWeight: '700', 
    whiteSpace: 'nowrap',
    border: '1px solid #c7d2fe',
    transition: 'all 0.2s',
    ':hover': { backgroundColor: '#4f46e5', color: '#fff' }
  },
  disabledBtn: { padding: '10px 20px', backgroundColor: '#f1f5f9', color: '#94a3b8', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', cursor: 'not-allowed' },

  emptyState: { textAlign: 'center', padding: '80px 20px', border: '2px dashed #e2e8f0', borderRadius: '16px', backgroundColor: '#fafaf9', marginTop: '16px' },
  emptyStateIcon: { fontSize: '56px', marginBottom: '16px', opacity: 0.8 },
}