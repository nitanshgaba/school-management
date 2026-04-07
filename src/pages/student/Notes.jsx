import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

export default function StudentNotes() {
  const { profile } = useAuth()
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { 
    if (profile?.id) fetchNotes() 
  }, [profile?.id])

  const fetchNotes = async () => {
    setLoading(true)
    try {
      // 1. Get the student's class_id
      const { data: studentData } = await supabase
        .from('students')
        .select('class_id')
        .eq('id', profile.id)
        .single()

      if (!studentData) {
        setLoading(false)
        return
      }

      // 2. Fetch Notes, Classes, and Subjects separately to avoid relationship errors
      const [notesRes, classesRes, subjectsRes] = await Promise.all([
        supabase
          .from('notes')
          .select('*')
          .eq('class_id', studentData.class_id)
          .order('created_at', { ascending: false }),
        supabase.from('classes').select('id, name'),
        supabase.from('subjects').select('id, name')
      ])

      // 3. Manually map names to notes
      const mappedNotes = (notesRes.data || []).map(n => ({
        ...n,
        className: classesRes.data?.find(c => c.id === n.class_id)?.name || 'N/A',
        subjectName: subjectsRes.data?.find(s => s.id === n.subject_id)?.name || 'General'
      }))

      setNotes(mappedNotes)
    } catch (err) {
      console.error("Notes Error:", err)
    } finally {
      setLoading(false)
    }
  }

  const isNew = (date) => {
    const diffDays = Math.ceil(Math.abs(new Date() - new Date(date)) / (1000 * 60 * 60 * 24))
    return diffDays <= 2
  }

  if (loading) return (
    <div style={styles.loadingContainer}>
      <div style={{ fontSize: '40px', marginBottom: '16px' }}>📚</div>
      <div style={{ color: '#64748b', fontSize: '16px', fontWeight: '600' }}>Syncing Library...</div>
    </div>
  )

  return (
    <div style={styles.container}>
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Study Materials</h1>
          <p style={styles.pageSubtitle}>Centralized library for your class resources</p>
        </div>
      </div>

      {notes.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={{ fontSize: '56px', marginBottom: '16px' }}>📑</div>
          <h3 style={{ color: '#374151', margin: '0 0 8px 0' }}>No Study Notes Found</h3>
          <p style={{ color: '#6b7280', margin: 0 }}>Check back later! Your teachers haven't posted any notes yet.</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {notes.map((n, index) => (
            <div key={n.id} style={styles.card}>
              <div style={styles.cardMain}>
                <div style={{ 
                  ...styles.subjectAvatar, 
                  backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6'][index % 6] 
                }}>
                  {n.subjectName.charAt(0).toUpperCase()}
                </div>

                <div style={styles.cardInfo}>
                  <div style={styles.cardHeaderRow}>
                    <p style={styles.cardTitle}>{n.title}</p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {isNew(n.created_at) && <span style={styles.newBadge}>✨ NEW</span>}
                      <span style={styles.subjectBadge}>{n.subjectName}</span>
                    </div>
                  </div>
                  
                  <p style={styles.cardMeta}>
                    Class {n.className} • Posted {new Date(n.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                  </p>
                  
                  {n.body && <p style={styles.cardDesc}>{n.body}</p>}
                </div>
              </div>

              <div style={styles.cardActions}>
                {n.file_url ? (
                  <a href={n.file_url} target="_blank" rel="noreferrer" style={styles.viewBtn}>
                    📥 Download
                  </a>
                ) : (
                  <span style={styles.noFile}>No file attached</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const styles = {
  container: { maxWidth: '1000px', margin: '0 auto', padding: '20px', fontFamily: 'Inter, sans-serif' },
  pageHeader: { marginBottom: '32px' },
  pageTitle: { fontSize: '32px', fontWeight: '800', color: '#111827', margin: 0, letterSpacing: '-0.5px' },
  pageSubtitle: { fontSize: '15px', color: '#64748b', margin: 0 },
  loadingContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' },
  grid: { display: 'flex', flexDirection: 'column', gap: '16px' },
  card: { backgroundColor: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '24px', flexWrap: 'wrap' },
  cardMain: { display: 'flex', alignItems: 'flex-start', gap: '20px', flex: 1, minWidth: '300px' },
  subjectAvatar: { width: '56px', height: '56px', borderRadius: '14px', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: '800', flexShrink: 0 },
  cardInfo: { flex: 1 },
  cardHeaderRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px', gap: '12px' },
  cardTitle: { fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0 },
  subjectBadge: { backgroundColor: '#f8fafc', color: '#475569', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', border: '1px solid #e2e8f0' },
  newBadge: { backgroundColor: '#fef3c7', color: '#d97706', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '800' },
  cardMeta: { fontSize: '13px', color: '#64748b', margin: '0 0 8px 0', fontWeight: '600' },
  cardDesc: { fontSize: '14px', color: '#475569', margin: 0, lineHeight: '1.5' },
  cardActions: { flexShrink: 0 },
  viewBtn: { display: 'inline-flex', padding: '12px 24px', backgroundColor: '#4f46e5', color: '#fff', borderRadius: '12px', fontSize: '14px', textDecoration: 'none', fontWeight: '700' },
  noFile: { fontSize: '13px', color: '#94a3b8', fontStyle: 'italic' },
  emptyState: { textAlign: 'center', padding: '80px 20px', border: '2px dashed #e2e8f0', borderRadius: '16px', backgroundColor: '#fafaf9' },
}