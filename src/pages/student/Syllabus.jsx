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

  if (loading) return <div style={styles.loading}>Loading...</div>

  return (
    <div>
      <h1 style={styles.title}>Syllabus</h1>
      {syllabi.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={{ fontSize: '64px' }}>📖</div>
          <p style={{ color: '#9ca3af', marginTop: '12px' }}>No syllabus available yet</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {syllabi.map(s => (
            <div key={s.id} style={styles.card}>
              <div style={styles.cardIcon}>📖</div>
              <div style={styles.cardInfo}>
                <p style={styles.cardTitle}>{s.title}</p>
                <p style={styles.cardMeta}>{s.classes?.name} {s.subjects?.name && `· ${s.subjects.name}`}</p>
                {s.description && <p style={styles.cardDesc}>{s.description}</p>}
                <p style={styles.cardDate}>{new Date(s.created_at).toLocaleDateString('en-IN')}</p>
              </div>
              {s.file_url && (
                <a href={s.file_url} target="_blank" rel="noreferrer" style={styles.viewBtn}>📥 Download</a>
              )}
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
  grid: { display: 'flex', flexDirection: 'column', gap: '12px' },
  card: { backgroundColor: '#fff', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: '16px' },
  cardIcon: { fontSize: '32px', flexShrink: 0 },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: '15px', fontWeight: '600', color: '#1a1a2e', margin: 0 },
  cardMeta: { fontSize: '13px', color: '#6b7280', margin: '2px 0 0' },
  cardDesc: { fontSize: '13px', color: '#9ca3af', margin: '4px 0 0' },
  cardDate: { fontSize: '12px', color: '#d1d5db', margin: '4px 0 0' },
  viewBtn: { padding: '8px 16px', backgroundColor: '#dbeafe', color: '#1d4ed8', borderRadius: '8px', fontSize: '13px', textDecoration: 'none', fontWeight: '500', whiteSpace: 'nowrap' },
}
