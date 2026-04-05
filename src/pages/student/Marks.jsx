// import { useState, useEffect } from 'react'
// import { supabase } from '../../lib/supabase'
// import { useAuth } from '../../context/AuthContext'

// export default function StudentMarks() {
//   const { profile } = useAuth()
//   const [marks, setMarks] = useState([])
//   const [exams, setExams] = useState([])
//   const [selectedExam, setSelectedExam] = useState('')
//   const [loading, setLoading] = useState(true)

//   useEffect(() => { if (profile?.id) { fetchExams(); fetchMarks() } }, [profile])

//   const fetchExams = async () => {
//     const { data: studentData } = await supabase.from('students').select('class_id').eq('id', profile.id).single()
//     const { data } = await supabase.from('exams').select('*').eq('class_id', studentData?.class_id).order('exam_date', { ascending: false })
//     setExams(data || [])
//     setLoading(false)
//   }

//   const fetchMarks = async (examId) => {
//     setLoading(true)
//     let query = supabase.from('marks').select('*, subjects(name), exams(exam_name)').eq('student_id', profile.id)
//     if (examId) query = query.eq('exam_id', examId)
//     const { data } = await query
//     setMarks(data || [])
//     setLoading(false)
//   }

//   const handleExamChange = (examId) => {
//     setSelectedExam(examId)
//     fetchMarks(examId)
//   }

//   const totalObtained = marks.reduce((sum, m) => sum + (m.obtained_marks || 0), 0)
//   const totalMax = marks.reduce((sum, m) => sum + (m.total_marks || 0), 0)
//   const percent = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : 0

//   const getGradeColor = (grade) => {
//     if (grade === 'A+' || grade === 'A') return { backgroundColor: '#dcfce7', color: '#16a34a' }
//     if (grade === 'B+' || grade === 'B') return { backgroundColor: '#dbeafe', color: '#1d4ed8' }
//     if (grade === 'C+' || grade === 'C') return { backgroundColor: '#fef9c3', color: '#ca8a04' }
//     if (grade === 'D') return { backgroundColor: '#fed7aa', color: '#ea580c' }
//     return { backgroundColor: '#fee2e2', color: '#dc2626' }
//   }

//   return (
//     <div>
//       <h1 style={styles.title}>My Marks</h1>

//       <div style={styles.card}>
//         <div style={styles.filterRow}>
//           <div style={styles.filterGroup}>
//             <label style={styles.label}>Select Exam</label>
//             <select style={styles.input} value={selectedExam} onChange={e => handleExamChange(e.target.value)}>
//               <option value="">-- Select Exam --</option>
//               {exams.map(e => <option key={e.id} value={e.id}>{e.exam_name}</option>)}
//             </select>
//           </div>
//         </div>
//       </div>

//       {selectedExam && marks.length > 0 && (
//         <div style={styles.summaryGrid}>
//           <div style={styles.summaryCard}>
//             <p style={styles.summaryValue}>{totalObtained}</p>
//             <p style={styles.summaryLabel}>Total Obtained</p>
//           </div>
//           <div style={styles.summaryCard}>
//             <p style={styles.summaryValue}>{totalMax}</p>
//             <p style={styles.summaryLabel}>Total Marks</p>
//           </div>
//           <div style={styles.summaryCard}>
//             <p style={{ ...styles.summaryValue, color: percent >= 60 ? '#16a34a' : '#dc2626' }}>{percent}%</p>
//             <p style={styles.summaryLabel}>Percentage</p>
//           </div>
//         </div>
//       )}

//       {selectedExam && (
//         <div style={styles.card}>
//           {loading ? <p style={styles.empty}>Loading...</p> :
//             marks.length === 0 ? (
//               <div style={styles.emptyState}>
//                 <div style={{ fontSize: '48px' }}>🏆</div>
//                 <p style={{ color: '#9ca3af', marginTop: '8px' }}>No marks recorded yet</p>
//               </div>
//             ) : (
//               <table style={styles.table}>
//                 <thead>
//                   <tr>
//                     <th style={styles.th}>#</th>
//                     <th style={styles.th}>Subject</th>
//                     <th style={styles.th}>Obtained</th>
//                     <th style={styles.th}>Total</th>
//                     <th style={styles.th}>Grade</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {marks.map((m, i) => (
//                     <tr key={m.id}>
//                       <td style={styles.td}>{i + 1}</td>
//                       <td style={styles.td}>{m.subjects?.name || '—'}</td>
//                       <td style={styles.td}><strong>{m.obtained_marks}</strong></td>
//                       <td style={styles.td}>{m.total_marks}</td>
//                       <td style={styles.td}>
//                         {m.grade && <span style={{ ...styles.badge, ...getGradeColor(m.grade) }}>{m.grade}</span>}
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             )
//           }
//         </div>
//       )}
//     </div>
//   )
// }

// const styles = {
//   title: { fontSize: '24px', fontWeight: '700', color: '#1a1a2e', marginBottom: '24px' },
//   card: { backgroundColor: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: '20px' },
//   filterRow: { display: 'flex', gap: '16px', alignItems: 'flex-end' },
//   filterGroup: { display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '200px' },
//   label: { fontSize: '13px', fontWeight: '600', color: '#374151' },
//   input: { padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', outline: 'none' },
//   summaryGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' },
//   summaryCard: { backgroundColor: '#fff', borderRadius: '12px', padding: '20px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
//   summaryValue: { fontSize: '32px', fontWeight: '800', color: '#1a1a2e', margin: 0 },
//   summaryLabel: { fontSize: '13px', color: '#6b7280', margin: '4px 0 0' },
//   empty: { color: '#9ca3af', fontSize: '14px' },
//   emptyState: { textAlign: 'center', padding: '40px 0' },
//   table: { width: '100%', borderCollapse: 'collapse' },
//   th: { textAlign: 'left', fontSize: '13px', color: '#6b7280', fontWeight: '600', padding: '10px 12px', borderBottom: '2px solid #f3f4f6' },
//   td: { padding: '12px', fontSize: '14px', color: '#374151', borderBottom: '1px solid #f9fafb' },
//   badge: { padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' },
// }


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
    const g = grade?.toUpperCase()
    if (g === 'A+' || g === 'A') return { backgroundColor: '#dcfce7', color: '#16a34a', border: '1px solid #bbf7d0' }
    if (g === 'B+' || g === 'B') return { backgroundColor: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }
    if (g === 'C+' || g === 'C') return { backgroundColor: '#fef3c7', color: '#d97706', border: '1px solid #fde68a' }
    if (g === 'D') return { backgroundColor: '#fff7ed', color: '#ea580c', border: '1px solid #ffedd5' }
    return { backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }
  }

  return (
    <div style={styles.container}>
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Marks & Performance</h1>
          <p style={styles.pageSubtitle}>View your examination results and academic progress</p>
        </div>
      </div>

      {/* Filter Section */}
      <div style={styles.card}>
        <div style={styles.filterBox}>
          <div style={styles.filterGroup}>
            <label style={styles.label}>Select Examination</label>
            <select style={styles.input} value={selectedExam} onChange={e => handleExamChange(e.target.value)}>
              <option value="">-- Choose an Exam --</option>
              {exams.map(e => <option key={e.id} value={e.id}>{e.exam_name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {!selectedExam ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyStateIcon}>📊</div>
          <h3 style={{ color: '#374151', margin: '0 0 8px 0' }}>Select an exam</h3>
          <p style={{ color: '#6b7280', margin: 0, fontSize: '14px' }}>Choose an examination from the dropdown above to view your scores.</p>
        </div>
      ) : (
        <div style={styles.fadeIn}>
          {/* Summary Stats */}
          {marks.length > 0 && (
            <div style={styles.summaryGrid}>
              <div style={{ ...styles.summaryCard, borderLeft: '4px solid #4f46e5' }}>
                <p style={styles.summaryLabel}>TOTAL OBTAINED</p>
                <p style={styles.summaryValue}>{totalObtained} <span style={{fontSize: '16px', color: '#94a3b8', fontWeight: '500'}}>marks</span></p>
              </div>
              <div style={{ ...styles.summaryCard, borderLeft: '4px solid #64748b' }}>
                <p style={styles.summaryLabel}>TOTAL MARKS</p>
                <p style={styles.summaryValue}>{totalMax} <span style={{fontSize: '16px', color: '#94a3b8', fontWeight: '500'}}>marks</span></p>
              </div>
              <div style={{ 
                ...styles.summaryCard, 
                backgroundColor: percent >= 40 ? '#f0fdf4' : '#fef2f2',
                borderLeft: `4px solid ${percent >= 40 ? '#16a34a' : '#dc2626'}` 
              }}>
                <p style={{ ...styles.summaryLabel, color: percent >= 40 ? '#16a34a' : '#dc2626' }}>PERCENTAGE</p>
                <p style={{ ...styles.summaryValue, color: percent >= 40 ? '#15803d' : '#991b1b' }}>{percent}%</p>
              </div>
            </div>
          )}

          {/* Results Table */}
          <div style={styles.tableCard}>
            <div style={styles.cardHeader}>
              <h2 style={styles.sectionTitle}>📋 Subject-wise Report Card</h2>
            </div>
            
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>⏳ Loading your results...</div>
            ) : marks.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={styles.emptyStateIcon}>🏆</div>
                <p style={{ color: '#9ca3af', marginTop: '8px' }}>No marks have been recorded for this exam yet.</p>
              </div>
            ) : (
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={{ ...styles.th, width: '60px', textAlign: 'center' }}>#</th>
                      <th style={styles.th}>Subject</th>
                      <th style={styles.th}>Obtained</th>
                      <th style={styles.th}>Max Marks</th>
                      <th style={{ ...styles.th, textAlign: 'right', paddingRight: '24px' }}>Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {marks.map((m, i) => (
                      <tr key={m.id} style={styles.tr}>
                        <td style={{ ...styles.td, textAlign: 'center', color: '#94a3b8', fontWeight: '500' }}>{i + 1}</td>
                        <td style={{ ...styles.td, fontWeight: '700', color: '#1e293b' }}>{m.subjects?.name || '—'}</td>
                        <td style={styles.td}>
                          <span style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>{m.obtained_marks}</span>
                        </td>
                        <td style={{ ...styles.td, color: '#64748b', fontWeight: '500' }}>{m.total_marks}</td>
                        <td style={{ ...styles.td, textAlign: 'right', paddingRight: '20px' }}>
                          {m.grade ? (
                            <span style={{ ...styles.badge, ...getGradeColor(m.grade) }}>{m.grade}</span>
                          ) : (
                            <span style={{ color: '#cbd5e1', fontStyle: 'italic', fontSize: '13px' }}>N/A</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
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
  
  fadeIn: { opacity: 1, transition: 'opacity 0.3s ease-in' },
  
  card: { backgroundColor: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9', marginBottom: '24px' },
  filterBox: { backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' },
  filterGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' },
  input: { padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none', backgroundColor: '#fff', color: '#1e293b', transition: 'border-color 0.2s', cursor: 'pointer' },
  
  summaryGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '24px' },
  summaryCard: { backgroundColor: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' },
  summaryValue: { fontSize: '36px', fontWeight: '900', color: '#0f172a', margin: '8px 0 0' },
  summaryLabel: { fontSize: '12px', fontWeight: '700', color: '#64748b', margin: 0, textTransform: 'uppercase', letterSpacing: '1px' },
  
  tableCard: { backgroundColor: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #f3f4f6' },
  cardHeader: { marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' },
  sectionTitle: { fontSize: '18px', fontWeight: '800', color: '#1f2937', margin: 0 },
  
  tableWrapper: { borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff' },
  th: { textAlign: 'left', fontSize: '12px', color: '#64748b', fontWeight: '700', padding: '16px 20px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textTransform: 'uppercase', letterSpacing: '0.5px' },
  tr: { borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.15s ease' },
  td: { padding: '16px 20px', fontSize: '15px', color: '#1e293b', verticalAlign: 'middle' },
  
  badge: { padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '800', display: 'inline-flex', alignItems: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' },
  
  emptyState: { textAlign: 'center', padding: '60px 20px', border: '2px dashed #e2e8f0', borderRadius: '16px', backgroundColor: '#fafaf9' },
  emptyStateIcon: { fontSize: '56px', marginBottom: '16px', opacity: 0.8 },
}