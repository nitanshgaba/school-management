import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

export default function StudentMarks() {
  const { profile } = useAuth()
  const [marks, setMarks] = useState([])
  const [exams, setExams] = useState([])
  const [selectedExam, setSelectedExam] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (profile?.id) { fetchExams(); fetchMarks() } }, [profile])

  const fetchExams = async () => {
    const { data: studentData } = await supabase.from('students').select('class_id').eq('id', profile.id).single()
    const { data } = await supabase.from('exams').select('*').eq('class_id', studentData?.class_id).order('exam_date', { ascending: false })
    setExams(data || [])
    setLoading(false)
  }

  const fetchMarks = async (examId) => {
    setLoading(true)
    let query = supabase.from('marks').select('*, subjects(name), exams(exam_name)').eq('student_id', profile.id)
    if (examId) query = query.eq('exam_id', examId)
    const { data } = await query
    setMarks(data || [])
    setLoading(false)
  }

  const handleExamChange = (examId) => {
    setSelectedExam(examId)
    fetchMarks(examId)
  }

  const totalObtained = marks.reduce((sum, m) => sum + (m.obtained_marks || 0), 0)
  const totalMax = marks.reduce((sum, m) => sum + (m.total_marks || 0), 0)
  const percent = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : 0

  const getGradeColor = (grade) => {
    if (grade === 'A+' || grade === 'A') return { backgroundColor: '#dcfce7', color: '#16a34a' }
    if (grade === 'B+' || grade === 'B') return { backgroundColor: '#dbeafe', color: '#1d4ed8' }
    if (grade === 'C+' || grade === 'C') return { backgroundColor: '#fef9c3', color: '#ca8a04' }
    if (grade === 'D') return { backgroundColor: '#fed7aa', color: '#ea580c' }
    return { backgroundColor: '#fee2e2', color: '#dc2626' }
  }

  return (
    <div>
      <h1 style={styles.title}>My Marks</h1>

      <div style={styles.card}>
        <div style={styles.filterRow}>
          <div style={styles.filterGroup}>
            <label style={styles.label}>Select Exam</label>
            <select style={styles.input} value={selectedExam} onChange={e => handleExamChange(e.target.value)}>
              <option value="">-- Select Exam --</option>
              {exams.map(e => <option key={e.id} value={e.id}>{e.exam_name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {selectedExam && marks.length > 0 && (
        <div style={styles.summaryGrid}>
          <div style={styles.summaryCard}>
            <p style={styles.summaryValue}>{totalObtained}</p>
            <p style={styles.summaryLabel}>Total Obtained</p>
          </div>
          <div style={styles.summaryCard}>
            <p style={styles.summaryValue}>{totalMax}</p>
            <p style={styles.summaryLabel}>Total Marks</p>
          </div>
          <div style={styles.summaryCard}>
            <p style={{ ...styles.summaryValue, color: percent >= 60 ? '#16a34a' : '#dc2626' }}>{percent}%</p>
            <p style={styles.summaryLabel}>Percentage</p>
          </div>
        </div>
      )}

      {selectedExam && (
        <div style={styles.card}>
          {loading ? <p style={styles.empty}>Loading...</p> :
            marks.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={{ fontSize: '48px' }}>🏆</div>
                <p style={{ color: '#9ca3af', marginTop: '8px' }}>No marks recorded yet</p>
              </div>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>#</th>
                    <th style={styles.th}>Subject</th>
                    <th style={styles.th}>Obtained</th>
                    <th style={styles.th}>Total</th>
                    <th style={styles.th}>Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {marks.map((m, i) => (
                    <tr key={m.id}>
                      <td style={styles.td}>{i + 1}</td>
                      <td style={styles.td}>{m.subjects?.name || '—'}</td>
                      <td style={styles.td}><strong>{m.obtained_marks}</strong></td>
                      <td style={styles.td}>{m.total_marks}</td>
                      <td style={styles.td}>
                        {m.grade && <span style={{ ...styles.badge, ...getGradeColor(m.grade) }}>{m.grade}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          }
        </div>
      )}
    </div>
  )
}

const styles = {
  title: { fontSize: '24px', fontWeight: '700', color: '#1a1a2e', marginBottom: '24px' },
  card: { backgroundColor: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: '20px' },
  filterRow: { display: 'flex', gap: '16px', alignItems: 'flex-end' },
  filterGroup: { display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '200px' },
  label: { fontSize: '13px', fontWeight: '600', color: '#374151' },
  input: { padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', outline: 'none' },
  summaryGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' },
  summaryCard: { backgroundColor: '#fff', borderRadius: '12px', padding: '20px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  summaryValue: { fontSize: '32px', fontWeight: '800', color: '#1a1a2e', margin: 0 },
  summaryLabel: { fontSize: '13px', color: '#6b7280', margin: '4px 0 0' },
  empty: { color: '#9ca3af', fontSize: '14px' },
  emptyState: { textAlign: 'center', padding: '40px 0' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', fontSize: '13px', color: '#6b7280', fontWeight: '600', padding: '10px 12px', borderBottom: '2px solid #f3f4f6' },
  td: { padding: '12px', fontSize: '14px', color: '#374151', borderBottom: '1px solid #f9fafb' },
  badge: { padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' },
}
