import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

export default function StudentExams() {
  const { profile } = useAuth()
  const [exams, setExams] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (profile?.id) fetchExams() }, [profile])

  const fetchExams = async () => {
    const { data: studentData } = await supabase
      .from('students')
      .select('class_id')
      .eq('id', profile.id)
      .single()
    const classId = studentData?.class_id
    const { data } = await supabase
      .from('exams')
      .select('*, subjects(name), sections(name)')
      .eq('class_id', classId)
      .order('exam_date', { ascending: true })
    setExams(data || [])
    setLoading(false)
  }

  const upcoming = exams.filter(e => new Date(e.exam_date) >= new Date().setHours(0,0,0,0))
  const past = exams.filter(e => new Date(e.exam_date) < new Date().setHours(0,0,0,0))

  if (loading) return (
    <div style={styles.loadingContainer}>
      <div style={{ fontSize: '40px', marginBottom: '16px' }}>📝</div>
      <div style={{ color: '#64748b', fontSize: '16px', fontWeight: '600' }}>Loading exam schedule...</div>
    </div>
  )

  return (
    <div style={styles.container}>
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Examination Schedule</h1>
          <p style={styles.pageSubtitle}>Stay updated with your upcoming tests and assessments</p>
        </div>
      </div>

      {exams.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyStateIcon}>📑</div>
          <h3 style={{ color: '#374151', margin: '0 0 8px 0' }}>No Exams Scheduled</h3>
          <p style={{ color: '#6b7280', margin: 0, fontSize: '14px' }}>Great news! There are no upcoming exams for your class at the moment.</p>
        </div>
      ) : (
        <div style={styles.fadeIn}>
          
          {/* UPCOMING EXAMS */}
          {upcoming.length > 0 && (
            <div style={styles.sectionWrapper}>
              <h2 style={styles.sectionTitle}>📅 Upcoming Assessments</h2>
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={{ ...styles.th, width: '50px', textAlign: 'center' }}>#</th>
                      <th style={styles.th}>Exam Name</th>
                      <th style={styles.th}>Subject</th>
                      <th style={styles.th}>Date & Session</th>
                      <th style={{ ...styles.th, textAlign: 'right', paddingRight: '24px' }}>Max Marks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {upcoming.map((e, i) => (
                      <tr key={e.id} style={styles.tr}>
                        <td style={{ ...styles.td, textAlign: 'center', color: '#94a3b8', fontWeight: '500' }}>{i + 1}</td>
                        <td style={styles.td}>
                          <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '15px' }}>{e.exam_name}</div>
                          {e.session && <div style={styles.sessionLabel}>{e.session} Session</div>}
                        </td>
                        <td style={styles.td}>
                          <div style={styles.subjectCell}>
                            <div style={styles.subjectIcon}>📚</div>
                            <span style={{ fontWeight: '600', color: '#334155' }}>{e.subjects?.name || 'General'}</span>
                          </div>
                        </td>
                        <td style={styles.td}>
                          <span style={styles.upcomingBadge}>
                            🗓️ {new Date(e.exam_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                        </td>
                        <td style={{ ...styles.td, textAlign: 'right', paddingRight: '20px' }}>
                          <span style={styles.marksBadge}>{e.max_marks}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PAST EXAMS */}
          {past.length > 0 && (
            <div style={{ ...styles.sectionWrapper, marginTop: '40px' }}>
              <h2 style={{ ...styles.sectionTitle, color: '#64748b' }}>✅ Completed Exams</h2>
              <div style={{ ...styles.tableWrapper, opacity: 0.8 }}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={{ ...styles.th, width: '50px', textAlign: 'center' }}>#</th>
                      <th style={styles.th}>Exam Name</th>
                      <th style={styles.th}>Subject</th>
                      <th style={styles.th}>Date</th>
                      <th style={{ ...styles.th, textAlign: 'right', paddingRight: '24px' }}>Max Marks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {past.map((e, i) => (
                      <tr key={e.id} style={styles.trPast}>
                        <td style={{ ...styles.td, textAlign: 'center', color: '#cbd5e1' }}>{i + 1}</td>
                        <td style={styles.td}>
                          <div style={{ fontWeight: '600', color: '#64748b' }}>{e.exam_name}</div>
                        </td>
                        <td style={styles.td}>
                          <span style={{ color: '#94a3b8', fontSize: '13px' }}>{e.subjects?.name || '—'}</span>
                        </td>
                        <td style={styles.td}>
                          <span style={styles.pastBadge}>
                            {new Date(e.exam_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                          </span>
                        </td>
                        <td style={{ ...styles.td, textAlign: 'right', paddingRight: '20px', color: '#94a3b8' }}>
                          {e.max_marks}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const styles = {
  container: { maxWidth: '1000px', margin: '0 auto', padding: '20px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' },
  pageHeader: { marginBottom: '32px' },
  pageTitle: { fontSize: '32px', fontWeight: '800', color: '#111827', margin: '0 0 8px 0', letterSpacing: '-0.5px' },
  pageSubtitle: { fontSize: '15px', color: '#6b7280', margin: 0 },
  
  loadingContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' },
  fadeIn: { opacity: 1, transition: 'opacity 0.3s ease-in' },

  sectionWrapper: { marginBottom: '24px' },
  sectionTitle: { fontSize: '18px', fontWeight: '800', color: '#1e293b', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' },

  tableWrapper: { backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff' },
  th: { textAlign: 'left', fontSize: '12px', color: '#64748b', fontWeight: '700', padding: '16px 20px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textTransform: 'uppercase', letterSpacing: '0.5px' },
  tr: { borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.15s ease', ':hover': { backgroundColor: '#fcfcfd' } },
  trPast: { borderBottom: '1px solid #f8fafc', backgroundColor: '#fafafa' },
  td: { padding: '16px 20px', fontSize: '14px', color: '#1e293b', verticalAlign: 'middle' },
  
  subjectCell: { display: 'flex', alignItems: 'center', gap: '10px' },
  subjectIcon: { fontSize: '16px', opacity: 0.7 },
  
  sessionLabel: { fontSize: '11px', color: '#6366f1', fontWeight: '700', marginTop: '4px', textTransform: 'uppercase' },
  
  upcomingBadge: { backgroundColor: '#eff6ff', color: '#2563eb', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', border: '1px solid #bfdbfe', whiteSpace: 'nowrap' },
  pastBadge: { backgroundColor: '#f1f5f9', color: '#94a3b8', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', border: '1px solid #e2e8f0' },
  marksBadge: { backgroundColor: '#f8fafc', color: '#0f172a', padding: '4px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: '800', border: '1px solid #e2e8f0' },

  emptyState: { textAlign: 'center', padding: '60px 20px', border: '2px dashed #e2e8f0', borderRadius: '16px', backgroundColor: '#fafaf9', marginTop: '16px' },
  emptyStateIcon: { fontSize: '56px', marginBottom: '16px', opacity: 0.8 },
}