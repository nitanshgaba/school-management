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

  const upcoming = exams.filter(e => new Date(e.exam_date) >= new Date())
  const past = exams.filter(e => new Date(e.exam_date) < new Date())

  return (
    <div>
      <h1 style={styles.title}>Exam Schedule</h1>
      {loading ? <p style={{ color: '#9ca3af' }}>Loading...</p> : exams.length === 0 ? (
        <div style={styles.emptyState}><div style={{ fontSize: '48px' }}>📝</div><p style={{ color: '#9ca3af' }}>No exams scheduled yet</p></div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div style={styles.card}>
              <h2 style={styles.sectionTitle}>📅 Upcoming Exams</h2>
              <table style={styles.table}>
                <thead><tr>
                  <th style={styles.th}>#</th>
                  <th style={styles.th}>Exam</th>
                  <th style={styles.th}>Subject</th>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Max Marks</th>
                </tr></thead>
                <tbody>
                  {upcoming.map((e, i) => (
                    <tr key={e.id}>
                      <td style={styles.td}>{i + 1}</td>
                      <td style={styles.td}><strong>{e.exam_name}</strong>{e.session && <span style={{ fontSize: '12px', color: '#9ca3af', marginLeft: '6px' }}>{e.session}</span>}</td>
                      <td style={styles.td}>{e.subjects?.name || '—'}</td>
                      <td style={styles.td}>
                        <span style={{ backgroundColor: '#dbeafe', color: '#1d4ed8', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
                          {new Date(e.exam_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </td>
                      <td style={styles.td}>{e.max_marks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {past.length > 0 && (
            <div style={styles.card}>
              <h2 style={styles.sectionTitle}>✅ Past Exams</h2>
              <table style={styles.table}>
                <thead><tr>
                  <th style={styles.th}>#</th>
                  <th style={styles.th}>Exam</th>
                  <th style={styles.th}>Subject</th>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Max Marks</th>
                </tr></thead>
                <tbody>
                  {past.map((e, i) => (
                    <tr key={e.id}>
                      <td style={styles.td}>{i + 1}</td>
                      <td style={styles.td}><strong>{e.exam_name}</strong>{e.session && <span style={{ fontSize: '12px', color: '#9ca3af', marginLeft: '6px' }}>{e.session}</span>}</td>
                      <td style={styles.td}>{e.subjects?.name || '—'}</td>
                      <td style={styles.td}>
                        <span style={{ backgroundColor: '#f3f4f6', color: '#6b7280', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
                          {new Date(e.exam_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </td>
                      <td style={styles.td}>{e.max_marks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}

const styles = {
  title: { fontSize: '24px', fontWeight: '700', color: '#1a1a2e', marginBottom: '24px' },
  card: { backgroundColor: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: '20px' },
  sectionTitle: { fontSize: '15px', fontWeight: '700', color: '#1a1a2e', marginBottom: '12px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', fontSize: '13px', color: '#6b7280', fontWeight: '600', padding: '10px 12px', borderBottom: '2px solid #f3f4f6' },
  td: { padding: '12px', fontSize: '14px', color: '#374151', borderBottom: '1px solid #f9fafb' },
  emptyState: { textAlign: 'center', padding: '60px 0' },
}
