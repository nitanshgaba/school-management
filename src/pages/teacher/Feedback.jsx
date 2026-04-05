// import { useState, useEffect } from 'react'
// import { supabase } from '../../lib/supabase'
// import { useAuth } from '../../context/AuthContext'

// export default function TeacherFeedback() {
//   const { profile } = useAuth()
//   const [classes, setClasses] = useState([])
//   const [sections, setSections] = useState([])
//   const [students, setStudents] = useState([])
//   const [selectedClass, setSelectedClass] = useState('')
//   const [selectedSection, setSelectedSection] = useState('')
//   const [selectedStudent, setSelectedStudent] = useState('')
//   const [message, setMessage] = useState('')
//   const [sending, setSending] = useState(false)
//   const [status, setStatus] = useState('')
//   const [feedbacks, setFeedbacks] = useState([])
//   const [loadingFeedbacks, setLoadingFeedbacks] = useState(false)

//   useEffect(() => { if (profile?.id) fetchAssignedClasses() }, [profile])

//   const fetchAssignedClasses = async () => {
//     const { data } = await supabase
//       .from('teacher_classes')
//       .select('class_id, section_id, classes(id, name), sections(id, name)')
//       .eq('teacher_id', profile.id)
//     const classMap = {}
//     ;(data || []).forEach(a => {
//       if (!classMap[a.class_id]) classMap[a.class_id] = { id: a.class_id, name: a.classes?.name, sections: [] }
//       if (a.section_id) classMap[a.class_id].sections.push({ id: a.section_id, name: a.sections?.name })
//     })
//     setClasses(Object.values(classMap))
//     fetchMyFeedbacks()
//   }

//   const fetchMyFeedbacks = async () => {
//     setLoadingFeedbacks(true)
//     const { data } = await supabase
//       .from('feedback')
//       .select('*, students(profiles(name))')
//       .eq('sent_by', profile.id)
//       .order('created_at', { ascending: false })
//     setFeedbacks(data || [])
//     setLoadingFeedbacks(false)
//   }

//   const handleClassChange = async (classId) => {
//     setSelectedClass(classId)
//     setSelectedSection('')
//     setSelectedStudent('')
//     setStudents([])
//     const cls = classes.find(c => String(c.id) === String(classId))
//     setSections(cls?.sections || [])
//     const { data } = await supabase.from('students').select('id, profiles(name)').eq('class_id', classId)
//     setStudents(data || [])
//   }

//   const handleSectionChange = async (sectionId) => {
//     setSelectedSection(sectionId)
//     setSelectedStudent('')
//     let query = supabase.from('students').select('id, profiles(name)').eq('class_id', selectedClass)
//     if (sectionId) query = query.eq('section_id', sectionId)
//     const { data } = await query
//     setStudents(data || [])
//   }

//   const handleSend = async () => {
//     if (!selectedStudent || !message.trim()) {
//       setStatus('❌ Please select a student and write a message.')
//       return
//     }
//     setSending(true)
//     setStatus('')
//     const { error } = await supabase.from('feedback').insert({
//       student_id: selectedStudent,
//       sent_by: profile.id,
//       message: message.trim(),
//     })
//     if (error) {
//       setStatus('❌ Error: ' + error.message)
//     } else {
//       setStatus('✅ Feedback sent successfully!')
//       setMessage('')
//       setSelectedStudent('')
//       fetchMyFeedbacks()
//     }
//     setSending(false)
//   }

//   return (
//     <div>
//       <h1 style={styles.title}>Feedback</h1>
//       <div style={styles.card}>
//         <h2 style={styles.sectionTitle}>✉️ Send Feedback</h2>
//         <div style={styles.filterRow}>
//           <div style={styles.filterGroup}>
//             <label style={styles.label}>Class</label>
//             <select style={styles.input} value={selectedClass} onChange={e => handleClassChange(e.target.value)}>
//               <option value="">-- Select Class --</option>
//               {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
//             </select>
//           </div>
//           <div style={styles.filterGroup}>
//             <label style={styles.label}>Section</label>
//             <select style={styles.input} value={selectedSection} onChange={e => handleSectionChange(e.target.value)} disabled={!selectedClass}>
//               <option value="">-- All Sections --</option>
//               {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
//             </select>
//           </div>
//           <div style={styles.filterGroup}>
//             <label style={styles.label}>Student</label>
//             <select style={styles.input} value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)} disabled={!selectedClass}>
//               <option value="">-- Select Student --</option>
//               {students.map(s => <option key={s.id} value={s.id}>{s.profiles?.name}</option>)}
//             </select>
//           </div>
//         </div>
//         <div style={styles.formGroup}>
//           <label style={styles.label}>Message</label>
//           <textarea style={styles.textarea} rows={4} placeholder="Write your feedback here..."
//             value={message} onChange={e => setMessage(e.target.value)} />
//         </div>
//         {status && <p style={{ color: status.startsWith('✅') ? '#22c55e' : '#ef4444', fontSize: '14px' }}>{status}</p>}
//         <button style={styles.sendBtn} onClick={handleSend} disabled={sending}>
//           {sending ? 'Sending...' : '📨 Send Feedback'}
//         </button>
//       </div>

//       <div style={styles.card}>
//         <h2 style={styles.sectionTitle}>📋 Sent Feedbacks</h2>
//         {loadingFeedbacks ? <p style={{ color: '#9ca3af' }}>Loading...</p> :
//           feedbacks.length === 0 ? <p style={{ color: '#9ca3af', fontSize: '14px' }}>No feedbacks sent yet.</p> : (
//           <table style={styles.table}>
//             <thead><tr>
//               <th style={styles.th}>#</th>
//               <th style={styles.th}>Student</th>
//               <th style={styles.th}>Message</th>
//               <th style={styles.th}>Date</th>
//             </tr></thead>
//             <tbody>
//               {feedbacks.map((f, i) => (
//                 <tr key={f.id}>
//                   <td style={styles.td}>{i + 1}</td>
//                   <td style={styles.td}>{f.students?.profiles?.name || '—'}</td>
//                   <td style={styles.td}>{f.message}</td>
//                   <td style={styles.td}>{new Date(f.created_at).toLocaleDateString('en-IN')}</td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         )}
//       </div>
//     </div>
//   )
// }

// const styles = {
//   title: { fontSize: '24px', fontWeight: '700', color: '#1a1a2e', marginBottom: '24px' },
//   card: { backgroundColor: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: '20px' },
//   sectionTitle: { fontSize: '15px', fontWeight: '700', color: '#1a1a2e', marginBottom: '16px' },
//   filterRow: { display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '16px' },
//   filterGroup: { display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '160px' },
//   formGroup: { display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' },
//   label: { fontSize: '13px', fontWeight: '600', color: '#374151' },
//   input: { padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', outline: 'none' },
//   textarea: { padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', outline: 'none', resize: 'vertical', fontFamily: 'inherit' },
//   sendBtn: { padding: '10px 24px', backgroundColor: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
//   table: { width: '100%', borderCollapse: 'collapse' },
//   th: { textAlign: 'left', fontSize: '13px', color: '#6b7280', fontWeight: '600', padding: '10px 12px', borderBottom: '2px solid #f3f4f6' },
//   td: { padding: '12px', fontSize: '14px', color: '#374151', borderBottom: '1px solid #f9fafb' },
// }


import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

export default function TeacherFeedback() {
  const { profile } = useAuth()
  const [classes, setClasses] = useState([])
  const [sections, setSections] = useState([])
  const [students, setStudents] = useState([])
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedSection, setSelectedSection] = useState('')
  const [selectedStudent, setSelectedStudent] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [status, setStatus] = useState('')
  const [feedbacks, setFeedbacks] = useState([])
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(false)

  useEffect(() => { if (profile?.id) fetchAssignedClasses() }, [profile])

  const fetchAssignedClasses = async () => {
    const { data } = await supabase
      .from('teacher_classes')
      .select('class_id, section_id, classes(id, name), sections(id, name)')
      .eq('teacher_id', profile.id)
    const classMap = {}
    ;(data || []).forEach(a => {
      if (!classMap[a.class_id]) classMap[a.class_id] = { id: a.class_id, name: a.classes?.name, sections: [] }
      if (a.section_id) classMap[a.class_id].sections.push({ id: a.section_id, name: a.sections?.name })
    })
    setClasses(Object.values(classMap))
    fetchMyFeedbacks()
  }

  const fetchMyFeedbacks = async () => {
    setLoadingFeedbacks(true)
    const { data } = await supabase
      .from('feedback')
      .select('*, students(profiles(name))')
      .eq('sent_by', profile.id)
      .order('created_at', { ascending: false })
    setFeedbacks(data || [])
    setLoadingFeedbacks(false)
  }

  const handleClassChange = async (classId) => {
    setSelectedClass(classId); setSelectedSection(''); setSelectedStudent(''); setStudents([])
    const cls = classes.find(c => String(c.id) === String(classId))
    setSections(cls?.sections || [])
    const { data } = await supabase.from('students').select('id, profiles(name)').eq('class_id', classId)
    setStudents(data || [])
  }

  const handleSectionChange = async (sectionId) => {
    setSelectedSection(sectionId); setSelectedStudent('')
    let query = supabase.from('students').select('id, profiles(name)').eq('class_id', selectedClass)
    if (sectionId) query = query.eq('section_id', sectionId)
    const { data } = await query
    setStudents(data || [])
  }

  const handleSend = async () => {
    if (!selectedStudent || !message.trim()) {
      setStatus('⚠️ Please select a student and write a message.')
      return
    }
    setSending(true); setStatus('')
    const { error } = await supabase.from('feedback').insert({
      student_id: selectedStudent,
      sent_by: profile.id,
      message: message.trim(),
    })
    if (error) {
      setStatus('❌ Error: ' + error.message)
    } else {
      setStatus('✅ Feedback sent successfully!')
      setMessage(''); setSelectedStudent(''); fetchMyFeedbacks()
      setTimeout(() => setStatus(''), 3000)
    }
    setSending(false)
  }

  return (
    <div style={styles.container}>
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Student Feedback</h1>
          <p style={styles.pageSubtitle}>Send personalized academic remarks and performance reviews</p>
        </div>
      </div>

      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>✉️ Compose New Remark</h2>
        <div style={styles.filterRow}>
          <div style={styles.filterGroup}>
            <label style={styles.label}>Choose Class</label>
            <select style={styles.input} value={selectedClass} onChange={e => handleClassChange(e.target.value)}>
              <option value="">-- Select Class --</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div style={styles.filterGroup}>
            <label style={styles.label}>Section</label>
            <select style={styles.input} value={selectedSection} onChange={e => handleSectionChange(e.target.value)} disabled={!selectedClass}>
              <option value="">-- All --</option>
              {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div style={styles.filterGroup}>
            <label style={styles.label}>Select Student</label>
            <select style={styles.input} value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)} disabled={!selectedClass}>
              <option value="">-- Choose Student --</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.profiles?.name}</option>)}
            </select>
          </div>
        </div>
        
        <div style={styles.formGroup}>
          <label style={styles.label}>Feedback Message</label>
          <textarea style={styles.textarea} rows={4} placeholder="Type your observations or suggestions for the student..."
            value={message} onChange={e => setMessage(e.target.value)} />
        </div>

        <div style={styles.footerRow}>
          {status && <div style={{ 
            ...styles.alert, 
            backgroundColor: status.startsWith('✅') ? '#f0fdf4' : '#fff1f2',
            color: status.startsWith('✅') ? '#16a34a' : '#dc2626',
            border: `1px solid ${status.startsWith('✅') ? '#bbf7d0' : '#fecaca'}`
          }}>{status}</div>}
          
          <button style={styles.sendBtn} onClick={handleSend} disabled={sending}>
            {sending ? '⌛ Processing...' : '🚀 Send Feedback'}
          </button>
        </div>
      </div>

      <div style={{ ...styles.card, marginTop: '32px' }}>
        <h2 style={styles.sectionTitle}>📋 Message Outbox</h2>
        <div style={styles.tableWrapper}>
          {loadingFeedbacks ? (
            <div style={styles.loadingBox}>⌛ Loading sent history...</div>
          ) : feedbacks.length === 0 ? (
            <div style={styles.emptyState}>No messages have been sent yet.</div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={{ ...styles.th, width: '50px', textAlign: 'center' }}>#</th>
                  <th style={{ ...styles.th, width: '200px' }}>To Student</th>
                  <th style={styles.th}>Remark Message</th>
                  <th style={{ ...styles.th, width: '120px', textAlign: 'right' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {feedbacks.map((f, i) => (
                  <tr key={f.id} style={styles.tr}>
                    <td style={{ ...styles.td, textAlign: 'center', color: '#94a3b8', fontWeight: '600' }}>{i + 1}</td>
                    <td style={{ ...styles.td, fontWeight: '700', color: '#1e293b' }}>
                      {f.students?.profiles?.name || 'Unknown Student'}
                    </td>
                    <td style={{ ...styles.td, color: '#475569', lineHeight: '1.5', fontSize: '13px' }}>
                      <div style={styles.msgBubble}>"{f.message}"</div>
                    </td>
                    <td style={{ ...styles.td, textAlign: 'right', color: '#64748b', fontSize: '12px', fontWeight: '600' }}>
                      {new Date(f.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: { maxWidth: '1100px', margin: '0 auto', padding: '20px', fontFamily: 'Inter, sans-serif' },
  pageHeader: { marginBottom: '32px' },
  pageTitle: { fontSize: '32px', fontWeight: '800', color: '#111827', margin: 0, letterSpacing: '-1px' },
  pageSubtitle: { fontSize: '15px', color: '#64748b', marginTop: '4px' },

  card: { backgroundColor: '#fff', borderRadius: '20px', padding: '32px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' },
  sectionTitle: { fontSize: '18px', fontWeight: '800', color: '#1e293b', marginBottom: '24px' },
  
  filterRow: { display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '24px' },
  filterGroup: { display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, minWidth: '200px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' },
  label: { fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' },
  input: { padding: '12px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', backgroundColor: '#fff', transition: 'border-color 0.2s' },
  textarea: { padding: '16px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', resize: 'vertical', fontFamily: 'inherit', backgroundColor: '#fcfcfd' },
  
  footerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' },
  alert: { padding: '10px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', animation: 'fadeIn 0.3s ease-in' },
  sendBtn: { padding: '14px 32px', backgroundColor: '#4f46e5', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontSize: '15px', fontWeight: '700', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)', transition: '0.2s' },

  tableWrapper: { borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', fontSize: '12px', color: '#64748b', fontWeight: '700', padding: '16px 20px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textTransform: 'uppercase' },
  tr: { borderBottom: '1px solid #f1f5f9', transition: '0.15s', ':hover': { backgroundColor: '#fcfcfd' } },
  td: { padding: '16px 20px', verticalAlign: 'middle' },
  msgBubble: { backgroundColor: '#f8fafc', padding: '10px 14px', borderRadius: '10px', border: '1px solid #f1f5f9', fontStyle: 'italic' },
  
  loadingBox: { textAlign: 'center', padding: '60px', color: '#64748b', fontSize: '14px', fontWeight: '600' },
  emptyState: { textAlign: 'center', padding: '60px', color: '#94a3b8', fontSize: '14px', backgroundColor: '#fafafa' },
}