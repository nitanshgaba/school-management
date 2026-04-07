import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getSchoolSettings } from '../../lib/schoolSettings'

export default function StudentQuestionPapers() {
  const { profile } = useAuth()
  const [papers, setPapers] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewPaper, setViewPaper] = useState(null)
  const [schoolName, setSchoolName] = useState('Sunrise Public School')

  useEffect(() => { 
    loadPapers() 
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await getSchoolSettings()
      let settings = response?.data || response
      if (Array.isArray(settings)) settings = settings[0]
      if (settings?.school_name) setSchoolName(settings.school_name)
    } catch (err) { console.error(err) }
  }

  const sb = async () => { const { supabase } = await import('../../lib/supabase'); return supabase }

  const loadPapers = async () => {
    setLoading(true)
    const s = await sb()
    const { data: student } = await s.from('students').select('class_id').eq('id', profile.id).single()
    if (!student) { setLoading(false); return }
    const { data } = await s.from('question_papers')
      .select('*, profiles(name)')
      .eq('class_id', student.class_id)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
    setPapers(data || [])
    setLoading(false)
  }

  const printPaper = (paper) => {
    const w = window.open('', '_blank')
    w.document.write(`
      <html><head><title>${paper.subject_name} - Paper</title><style>
        body { font-family: 'Georgia', serif; padding: 50px; max-width: 800px; margin: 0 auto; color: #000; line-height: 1.6; }
        .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 25px; }
        h1 { margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 1px; }
        h2 { margin: 8px 0; font-size: 18px; font-weight: bold; }
        .meta-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; border-bottom: 1px solid #000; padding: 10px 0; margin-bottom: 30px; font-weight: bold; font-size: 14px; }
        .content { white-space: pre-wrap; font-size: 15px; margin-top: 20px; }
        .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #eee; padding-top: 10px; }
        @media print { body { padding: 30px; } .header { border-bottom-width: 4px; } }
      </style></head><body>
      <div class="header">
        <h1>${schoolName}</h1>
        <h2>ANNUAL EXAMINATION / ${paper.exam_type?.toUpperCase()}</h2>
        <div style="font-size: 16px; font-weight: bold;">Subject: ${paper.subject_name} | Class: ${paper.class_id}</div>
      </div>
      <div class="meta-grid">
        <span>TIME: ${paper.time_minutes} MINS</span>
        <span style="text-align:center">MAX MARKS: ${paper.total_marks}</span>
        <span style="text-align:right">ROLL NO: _________</span>
      </div>
      <div class="content">${paper.content.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>
      <div class="footer">Generated via School ERP System</div>
      <script>window.onload=()=>{window.print()}<\/script>
      </body></html>
    `)
    w.document.close()
  }

  const getDiffStyles = (d) => {
    const map = {
      Easy:   { color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
      Medium: { color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
      Hard:   { color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
      Mixed:  { color: '#4f46e5', bg: '#eef2ff', border: '#c7d2fe' }
    }
    return map[d] || { color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' }
  }

  return (
    <div style={styles.container}>
      <div style={styles.pageHeader}>
        <h1 style={styles.pageTitle}>Practice Papers</h1>
        <p style={styles.pageSubtitle}>Review and download question papers shared by your teachers</p>
      </div>

      {loading ? (
        <div style={styles.loadingBox}>⏳ Fetching papers...</div>
      ) : papers.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📚</div>
          <p style={{ color: '#64748b', fontWeight: '600' }}>No question papers available yet.</p>
        </div>
      ) : (
        <div style={styles.paperList}>
          {papers.map(p => {
            const ds = getDiffStyles(p.difficulty)
            return (
              <div key={p.id} style={styles.card}>
                <div style={styles.cardMain}>
                  <div style={styles.subjectRow}>
                    <h3 style={styles.subjectName}>{p.subject_name}</h3>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <span style={{ ...styles.badge, color: ds.color, backgroundColor: ds.bg, border: `1px solid ${ds.border}` }}>
                        {p.difficulty}
                      </span>
                      <span style={styles.answerBadge}>✓ With Answers</span>
                    </div>
                  </div>
                  
                  <div style={styles.metaRow}>
                    <span style={styles.metaItem}>📝 {p.exam_type}</span>
                    <span style={styles.metaDivider}>•</span>
                    <span style={styles.metaItem}>🎯 {p.total_marks} Marks</span>
                    <span style={styles.metaDivider}>•</span>
                    <span style={styles.metaItem}>⏱️ {p.time_minutes} Mins</span>
                  </div>
                  
                  <p style={styles.authorText}>
                    Published by <strong>{p.profiles?.name}</strong> • {new Date(p.created_at).toLocaleDateString('en-IN')}
                  </p>
                </div>

                <div style={styles.actions}>
                  <button style={styles.viewBtn} onClick={() => setViewPaper(p)}>👁️ View</button>
                  <button style={styles.printBtn} onClick={() => printPaper(p)}>🖨️ Print PDF</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modern Modal Preview */}
      {viewPaper && (
        <div style={styles.overlay} onClick={() => setViewPaper(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={{ flex: 1 }}>
                <h3 style={styles.modalTitle}>{viewPaper.subject_name}</h3>
                <p style={styles.modalSub}>{viewPaper.exam_type} • {viewPaper.total_marks} Marks • {viewPaper.time_minutes} Mins</p>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button style={styles.printBtn} onClick={() => printPaper(viewPaper)}>🖨️ Print</button>
                <button style={styles.closeBtn} onClick={() => setViewPaper(null)}>✕ Close</button>
              </div>
            </div>

            <div style={styles.answerAlert}>
              💡 <strong>Self-Study Mode:</strong> This paper includes the marking scheme and answers at the bottom.
            </div>

            <div style={styles.paperContentWrapper}>
              <pre style={styles.preContent}>{viewPaper.content}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  container: { maxWidth: '900px', margin: '0 auto', padding: '20px', fontFamily: 'Inter, sans-serif' },
  pageHeader: { marginBottom: '32px' },
  pageTitle: { fontSize: '28px', fontWeight: '800', color: '#0f172a', margin: 0 },
  pageSubtitle: { fontSize: '14px', color: '#64748b', marginTop: '4px' },
  
  loadingBox: { textAlign: 'center', padding: '80px', color: '#64748b' },
  emptyState: { textAlign: 'center', padding: '80px 20px', backgroundColor: '#f8fafc', border: '2px dashed #e2e8f0', borderRadius: '16px' },

  paperList: { display: 'flex', flexDirection: 'column', gap: '14px' },
  card: { 
    backgroundColor: '#fff', 
    borderRadius: '16px', 
    padding: '20px 24px', 
    border: '1px solid #f1f5f9', 
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)', 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '20px'
  },

  cardMain: { flex: 1, minWidth: '300px' },
  subjectRow: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' },
  subjectName: { fontSize: '18px', fontWeight: '800', color: '#1e293b', margin: 0 },
  badge: { fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '12px', textTransform: 'uppercase' },
  answerBadge: { fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '12px', backgroundColor: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' },

  metaRow: { display: 'flex', alignItems: 'center', gap: '10px', color: '#475569', fontSize: '13px', fontWeight: '500' },
  metaDivider: { color: '#cbd5e1' },
  authorText: { fontSize: '12px', color: '#94a3b8', margin: '10px 0 0 0' },

  actions: { display: 'flex', gap: '10px' },
  viewBtn: { padding: '10px 18px', backgroundColor: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', transition: '0.2s' },
  printBtn: { padding: '10px 18px', backgroundColor: '#eef2ff', color: '#4f46e5', border: '1px solid #c7d2fe', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', transition: '0.2s' },

  overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' },
  modal: { backgroundColor: '#fff', borderRadius: '20px', width: '100%', maxWidth: '800px', height: '90vh', padding: '32px', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #f1f5f9', paddingBottom: '20px', marginBottom: '20px' },
  modalTitle: { fontSize: '22px', fontWeight: '800', color: '#0f172a', margin: 0 },
  modalSub: { fontSize: '14px', color: '#64748b', margin: '4px 0 0 0' },
  closeBtn: { padding: '10px 18px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', color: '#64748b' },

  answerAlert: { backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '12px 16px', borderRadius: '10px', color: '#15803d', fontSize: '14px', marginBottom: '20px' },
  paperContentWrapper: { flex: 1, overflowY: 'auto', backgroundColor: '#fafaf9', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '30px' },
  preContent: { whiteSpace: 'pre-wrap', fontFamily: '"Georgia", serif', fontSize: '15px', color: '#1e293b', lineHeight: '1.8', margin: 0 }
}