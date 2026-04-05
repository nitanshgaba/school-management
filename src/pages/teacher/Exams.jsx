// import { useState, useEffect } from 'react'
// import { supabase } from '../../lib/supabase'

// export default function Exams() {
//   const [classes, setClasses] = useState([])
//   const [exams, setExams] = useState([])
//   const [selectedClass, setSelectedClass] = useState('')
//   const [loading, setLoading] = useState(false)
//   const [searched, setSearched] = useState(false)

//   useEffect(() => {
//     supabase.from('classes').select('*').then(({ data }) => setClasses((data || []).sort((a, b) => { const na = parseInt(a.name); const nb = parseInt(b.name); if (!isNaN(na) && !isNaN(nb)) return na - nb; return a.name.localeCompare(b.name) })))
//     fetchExams()
//   }, [])

//   const fetchExams = async (classId) => {
//     setLoading(true)
//     setSearched(true)
//     let query = supabase.from('exams')
//       .select('*, classes(name), sections(name), subjects(name)')
//       .order('exam_date', { ascending: true })
//     if (classId) query = query.eq('class_id', classId)
//     const { data } = await query
//     setExams(data || [])
//     setLoading(false)
//   }

//   const upcoming = exams.filter(e => new Date(e.exam_date) >= new Date())
//   const past = exams.filter(e => new Date(e.exam_date) < new Date())

//   return (
//     <div>
//       <div style={styles.pageHeader}>
//         <h1 style={styles.pageTitle}>Exam Schedule</h1>
//       </div>
//       <div style={styles.card}>
//         <div style={styles.filterRow}>
//           <div style={styles.formGroup}>
//             <label style={styles.label}>Filter by Class</label>
//             <select style={styles.input} value={selectedClass} onChange={e => {
//               setSelectedClass(e.target.value)
//               fetchExams(e.target.value)
//             }}>
//               <option value="">All Classes</option>
//               {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
//             </select>
//           </div>
//         </div>

//         {loading ? <p style={{ color: '#9ca3af' }}>Loading...</p> : !searched ? null : exams.length === 0 ? (
//           <div style={styles.emptyState}><div style={{ fontSize: '48px' }}>📝</div><p style={{ color: '#9ca3af' }}>No exams found</p></div>
//         ) : (
//           <>
//             {upcoming.length > 0 && (
//               <>
//                 <h3 style={styles.sectionTitle}>📅 Upcoming Exams</h3>
//                 <table style={styles.table}>
//                   <thead>
//                     <tr>
//                       <th style={styles.th}>Exam</th>
//                       <th style={styles.th}>Class</th>
//                       <th style={styles.th}>Subject</th>
//                       <th style={styles.th}>Date</th>
//                       <th style={styles.th}>Max Marks</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {upcoming.map(e => (
//                       <tr key={e.id}>
//                         <td style={styles.td}><strong>{e.exam_name}</strong>{e.session && <span style={{ fontSize: '12px', color: '#9ca3af', marginLeft: '6px' }}>{e.session}</span>}</td>
//                         <td style={styles.td}>{e.classes?.name}{e.sections?.name && ` - ${e.sections.name}`}</td>
//                         <td style={styles.td}>{e.subjects?.name || '—'}</td>
//                         <td style={styles.td}>
//                           <span style={{ backgroundColor: '#dcfce7', color: '#16a34a', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
//                             {new Date(e.exam_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
//                           </span>
//                         </td>
//                         <td style={styles.td}>{e.max_marks}</td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </>
//             )}
//             {past.length > 0 && (
//               <>
//                 <h3 style={{ ...styles.sectionTitle, marginTop: '24px' }}>✅ Past Exams</h3>
//                 <table style={styles.table}>
//                   <thead>
//                     <tr>
//                       <th style={styles.th}>Exam</th>
//                       <th style={styles.th}>Class</th>
//                       <th style={styles.th}>Subject</th>
//                       <th style={styles.th}>Date</th>
//                       <th style={styles.th}>Max Marks</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {past.map(e => (
//                       <tr key={e.id}>
//                         <td style={styles.td}><strong>{e.exam_name}</strong>{e.session && <span style={{ fontSize: '12px', color: '#9ca3af', marginLeft: '6px' }}>{e.session}</span>}</td>
//                         <td style={styles.td}>{e.classes?.name}{e.sections?.name && ` - ${e.sections.name}`}</td>
//                         <td style={styles.td}>{e.subjects?.name || '—'}</td>
//                         <td style={styles.td}>
//                           <span style={{ backgroundColor: '#f3f4f6', color: '#6b7280', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
//                             {new Date(e.exam_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
//                           </span>
//                         </td>
//                         <td style={styles.td}>{e.max_marks}</td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </>
//             )}
//           </>
//         )}
//       </div>
//     </div>
//   )
// }

// const styles = {
//   pageHeader: { marginBottom: '24px' },
//   pageTitle: { fontSize: '28px', fontWeight: '700', color: '#1a1a2e', margin: 0 },
//   card: { backgroundColor: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
//   filterRow: { marginBottom: '24px' },
//   formGroup: { display: 'flex', flexDirection: 'column', gap: '6px', maxWidth: '200px' },
//   label: { fontSize: '13px', fontWeight: '600', color: '#374151' },
//   input: { padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', outline: 'none' },
//   sectionTitle: { fontSize: '15px', fontWeight: '700', color: '#1a1a2e', marginBottom: '12px' },
//   table: { width: '100%', borderCollapse: 'collapse', marginBottom: '8px' },
//   th: { textAlign: 'left', fontSize: '13px', color: '#6b7280', fontWeight: '600', padding: '10px 12px', borderBottom: '2px solid #f3f4f6' },
//   td: { padding: '12px', fontSize: '14px', color: '#374151', borderBottom: '1px solid #f9fafb' },
//   emptyState: { textAlign: 'center', padding: '60px 0' },
// }


import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function Exams() {
  const [classes, setClasses] = useState([])
  const [exams, setExams] = useState([])
  const [selectedClass, setSelectedClass] = useState('')
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    supabase.from('classes').select('*').then(({ data }) => 
      setClasses((data || []).sort((a, b) => { 
        const na = parseInt(a.name); 
        const nb = parseInt(b.name); 
        if (!isNaN(na) && !isNaN(nb)) return na - nb; 
        return a.name.localeCompare(b.name) 
      }))
    )
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

  // Set time to start of day for comparison
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcoming = exams.filter(e => new Date(e.exam_date) >= today)
  const past = exams.filter(e => new Date(e.exam_date) < today)

  if (loading && !searched) return <div style={styles.loadingBox}>⌛ Loading exam schedule...</div>

  return (
    <div style={styles.container}>
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Examination Management</h1>
          <p style={styles.pageSubtitle}>Monitor upcoming tests and review previous assessment records</p>
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.filterRow}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Filter by Class</label>
            <select style={styles.input} value={selectedClass} onChange={e => {
              setSelectedClass(e.target.value)
              fetchExams(e.target.value)
            }}>
              <option value="">All Assigned Classes</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>⌛ Fetching exams...</div>
        ) : exams.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={{ fontSize: '56px', marginBottom: '16px' }}>📝</div>
            <h3 style={{ color: '#0f172a', margin: '0 0 8px 0' }}>No Exams Found</h3>
            <p style={{ color: '#64748b', margin: 0 }}>There are no exams scheduled for the selected criteria.</p>
          </div>
        ) : (
          <div style={styles.fadeIn}>
            
            {/* UPCOMING EXAMS */}
            {upcoming.length > 0 && (
              <div style={{ marginBottom: '40px' }}>
                <h3 style={styles.sectionTitle}>
                  <span style={{ marginRight: '10px' }}>🗓️</span> Upcoming Assessments
                </h3>
                <div style={styles.tableWrapper}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Exam Name</th>
                        <th style={styles.th}>Class & Section</th>
                        <th style={styles.th}>Subject</th>
                        <th style={styles.th}>Scheduled Date</th>
                        <th style={{ ...styles.th, textAlign: 'right', paddingRight: '24px' }}>Max Marks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {upcoming.map(e => (
                        <tr key={e.id} style={styles.tr}>
                          <td style={styles.td}>
                            <div style={{ fontWeight: '700', color: '#1e293b' }}>{e.exam_name}</div>
                            {e.session && <div style={styles.sessionBadge}>{e.session} Session</div>}
                          </td>
                          <td style={styles.td}>
                            <span style={styles.classTag}>
                              Class {e.classes?.name}{e.sections?.name && ` • Sec ${e.sections.name}`}
                            </span>
                          </td>
                          <td style={{ ...styles.td, fontWeight: '600', color: '#4f46e5' }}>{e.subjects?.name || '—'}</td>
                          <td style={styles.td}>
                            <span style={styles.dateBadgeUpcoming}>
                              {new Date(e.exam_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                          </td>
                          <td style={{ ...styles.td, textAlign: 'right', paddingRight: '24px', fontWeight: '800', color: '#0f172a' }}>{e.max_marks}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* PAST EXAMS */}
            {past.length > 0 && (
              <div>
                <h3 style={{ ...styles.sectionTitle, color: '#64748b' }}>
                  <span style={{ marginRight: '10px' }}>✅</span> Completed Exams
                </h3>
                <div style={{ ...styles.tableWrapper, opacity: 0.85 }}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Exam Name</th>
                        <th style={styles.th}>Class</th>
                        <th style={styles.th}>Subject</th>
                        <th style={styles.th}>Date</th>
                        <th style={{ ...styles.th, textAlign: 'right', paddingRight: '24px' }}>Max Marks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {past.map(e => (
                        <tr key={e.id} style={{ ...styles.tr, backgroundColor: '#fcfcfd' }}>
                          <td style={{ ...styles.td, color: '#64748b' }}>
                            <strong>{e.exam_name}</strong>
                          </td>
                          <td style={styles.td}>{e.classes?.name}</td>
                          <td style={styles.td}>{e.subjects?.name || '—'}</td>
                          <td style={styles.td}>
                            <span style={styles.dateBadgePast}>
                              {new Date(e.exam_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                            </span>
                          </td>
                          <td style={{ ...styles.td, textAlign: 'right', paddingRight: '24px', color: '#94a3b8' }}>{e.max_marks}</td>
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
    </div>
  )
}

const styles = {
  container: { maxWidth: '1200px', margin: '0 auto', padding: '20px', fontFamily: 'Inter, sans-serif' },
  loadingBox: { textAlign: 'center', padding: '100px', color: '#64748b', fontSize: '16px', fontWeight: '600' },
  
  pageHeader: { marginBottom: '32px' },
  pageTitle: { fontSize: '32px', fontWeight: '800', color: '#0f172a', margin: 0, letterSpacing: '-1px' },
  pageSubtitle: { fontSize: '15px', color: '#64748b', marginTop: '4px' },
  
  card: { backgroundColor: '#fff', borderRadius: '20px', padding: '32px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' },
  
  filterRow: { marginBottom: '32px', paddingBottom: '24px', borderBottom: '1px solid #f1f5f9' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '250px' },
  label: { fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' },
  input: { padding: '12px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', backgroundColor: '#fff', color: '#1e293b' },
  
  sectionTitle: { fontSize: '18px', fontWeight: '800', color: '#1e2937', marginBottom: '16px', display: 'flex', alignItems: 'center' },
  
  tableWrapper: { borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff' },
  th: { textAlign: 'left', fontSize: '12px', color: '#64748b', fontWeight: '700', padding: '16px 20px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textTransform: 'uppercase' },
  tr: { borderBottom: '1px solid #f1f5f9', transition: '0.15s' },
  td: { padding: '16px 20px', fontSize: '14px', color: '#1e293b', verticalAlign: 'middle' },

  sessionBadge: { fontSize: '10px', fontWeight: '700', color: '#6366f1', backgroundColor: '#eef2ff', padding: '2px 8px', borderRadius: '6px', marginTop: '4px', display: 'inline-block' },
  classTag: { fontSize: '12px', fontWeight: '700', color: '#475569', backgroundColor: '#f1f5f9', padding: '4px 10px', borderRadius: '8px' },
  
  dateBadgeUpcoming: { backgroundColor: '#ecfdf5', color: '#059669', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', border: '1px solid #bbf7d0', whiteSpace: 'nowrap' },
  dateBadgePast: { backgroundColor: '#f8fafc', color: '#94a3b8', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', border: '1px solid #e2e8f0', whiteSpace: 'nowrap' },

  emptyState: { textAlign: 'center', padding: '60px 20px', backgroundColor: '#fafafa', borderRadius: '16px', border: '2px dashed #e2e8f0' },
  fadeIn: { animation: 'fadeIn 0.3s ease-in' }
}