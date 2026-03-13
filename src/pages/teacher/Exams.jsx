import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function Exams() {
  const [classes, setClasses] = useState([])
  const [exams, setExams] = useState([])
  const [selectedClass, setSelectedClass] = useState('')
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    supabase.from('classes').select('*').then(({ data }) => setClasses((data || []).sort((a, b) => { const na = parseInt(a.name); const nb = parseInt(b.name); if (!isNaN(na) && !isNaN(nb)) return na - nb; return a.name.localeCompare(b.name) })))
    fetchExams()
  }, [])

  const fetchExams = async (classId) => {
    setLoading(true)
    setSearched(true)
    let query = supabase.from('exams')
      .select('*, classes(name), sections(name), subjects(name)')
      .order('exam_date', { ascending: true })
    if (classId) query = query.eq('class_id', classId)
    const { data } = await query
    setExams(data || [])
    setLoading(false)
  }

  const upcoming = exams.filter(e => new Date(e.exam_date) >= new Date())
  const past = exams.filter(e => new Date(e.exam_date) < new Date())

  return (
    <div>
      <div style={styles.pageHeader}>
        <h1 style={styles.pageTitle}>Exam Schedule</h1>
      </div>
      <div style={styles.card}>
        <div style={styles.filterRow}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Filter by Class</label>
            <select style={styles.input} value={selectedClass} onChange={e => {
              setSelectedClass(e.target.value)
              fetchExams(e.target.value)
            }}>
              <option value="">All Classes</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        {loading ? <p style={{ color: '#9ca3af' }}>Loading...</p> : !searched ? null : exams.length === 0 ? (
          <div style={styles.emptyState}><div style={{ fontSize: '48px' }}>📝</div><p style={{ color: '#9ca3af' }}>No exams found</p></div>
        ) : (
          <>
            {upcoming.length > 0 && (
              <>
                <h3 style={styles.sectionTitle}>📅 Upcoming Exams</h3>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Exam</th>
                      <th style={styles.th}>Class</th>
                      <th style={styles.th}>Subject</th>
                      <th style={styles.th}>Date</th>
                      <th style={styles.th}>Max Marks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {upcoming.map(e => (
                      <tr key={e.id}>
                        <td style={styles.td}><strong>{e.exam_name}</strong>{e.session && <span style={{ fontSize: '12px', color: '#9ca3af', marginLeft: '6px' }}>{e.session}</span>}</td>
                        <td style={styles.td}>{e.classes?.name}{e.sections?.name && ` - ${e.sections.name}`}</td>
                        <td style={styles.td}>{e.subjects?.name || '—'}</td>
                        <td style={styles.td}>
                          <span style={{ backgroundColor: '#dcfce7', color: '#16a34a', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
                            {new Date(e.exam_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                        </td>
                        <td style={styles.td}>{e.max_marks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
            {past.length > 0 && (
              <>
                <h3 style={{ ...styles.sectionTitle, marginTop: '24px' }}>✅ Past Exams</h3>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Exam</th>
                      <th style={styles.th}>Class</th>
                      <th style={styles.th}>Subject</th>
                      <th style={styles.th}>Date</th>
                      <th style={styles.th}>Max Marks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {past.map(e => (
                      <tr key={e.id}>
                        <td style={styles.td}><strong>{e.exam_name}</strong>{e.session && <span style={{ fontSize: '12px', color: '#9ca3af', marginLeft: '6px' }}>{e.session}</span>}</td>
                        <td style={styles.td}>{e.classes?.name}{e.sections?.name && ` - ${e.sections.name}`}</td>
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
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

const styles = {
  pageHeader: { marginBottom: '24px' },
  pageTitle: { fontSize: '28px', fontWeight: '700', color: '#1a1a2e', margin: 0 },
  card: { backgroundColor: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  filterRow: { marginBottom: '24px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '6px', maxWidth: '200px' },
  label: { fontSize: '13px', fontWeight: '600', color: '#374151' },
  input: { padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', outline: 'none' },
  sectionTitle: { fontSize: '15px', fontWeight: '700', color: '#1a1a2e', marginBottom: '12px' },
  table: { width: '100%', borderCollapse: 'collapse', marginBottom: '8px' },
  th: { textAlign: 'left', fontSize: '13px', color: '#6b7280', fontWeight: '600', padding: '10px 12px', borderBottom: '2px solid #f3f4f6' },
  td: { padding: '12px', fontSize: '14px', color: '#374151', borderBottom: '1px solid #f9fafb' },
  emptyState: { textAlign: 'center', padding: '60px 0' },
}
