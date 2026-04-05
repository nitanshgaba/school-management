// import { useState, useEffect } from 'react'
// import { supabase } from '../../lib/supabase'
// import { useAuth } from '../../context/AuthContext'

// export default function TeacherAttendance() {
//   const { profile } = useAuth()
//   const [classes, setClasses] = useState([])
//   const [sections, setSections] = useState([])
//   const [students, setStudents] = useState([])
//   const [selectedClass, setSelectedClass] = useState('')
//   const [selectedSection, setSelectedSection] = useState('')
//   const [date, setDate] = useState(new Date().toISOString().split('T')[0])
//   const [attendance, setAttendance] = useState({})
//   const [loading, setLoading] = useState(false)
//   const [message, setMessage] = useState('')

//   useEffect(() => { fetchAssignedClasses() }, [])

//   const fetchAssignedClasses = async () => {
//     const { data } = await supabase
//       .from('teacher_classes')
//       .select('class_id, section_id, classes(id, name), sections(id, name)')
//       .eq('teacher_id', profile.id)
//     const assignments = data || []
//     // Build unique classes list
//     const classMap = {}
//     assignments.forEach(a => {
//       if (!classMap[a.class_id]) classMap[a.class_id] = { id: a.class_id, name: a.classes?.name, sections: [] }
//       if (a.section_id) classMap[a.class_id].sections.push({ id: a.section_id, name: a.sections?.name })
//     })
//     setClasses(Object.values(classMap))
//   }

//   const handleClassChange = (classId) => {
//     setSelectedClass(classId)
//     setSelectedSection('')
//     setStudents([])
//     const cls = classes.find(c => String(c.id) === String(classId))
//     setSections(cls?.sections || [])
//   }

//   const handleFind = async () => {
//     if (!selectedClass) return
//     setLoading(true)
//     const { data } = await supabase
//       .from('students')
//       .select('id, roll_no, profiles(name)')
//       .eq('class_id', selectedClass)
//       .eq(selectedSection ? 'section_id' : 'class_id', selectedSection || selectedClass)
    
//     const studentList = data || []
//     setStudents(studentList)

//     // Load existing attendance for this date
//     const { data: existing } = await supabase
//       .from('attendance')
//       .select('*')
//       .eq('date', date)
//       .in('student_id', studentList.map(s => s.id))

//     const map = {}
//     studentList.forEach(s => map[s.id] = 'present')
//     existing?.forEach(a => map[a.student_id] = a.status)
//     setAttendance(map)
//     setLoading(false)
//   }

//   const handleSubmit = async () => {
//     if (students.length === 0) return
//     setLoading(true)
//     const records = students.map(s => ({
//       student_id: s.id,
//       class_id: selectedClass,
//       section_id: selectedSection || null,
//       date: date,
//       is_present: (attendance[s.id] || 'present') === 'present',
//       status: attendance[s.id] || 'present',
//       marked_by: profile.id,
//     }))

//     const { error } = await supabase.from('attendance').upsert(records, { onConflict: 'student_id,date' })
//     setMessage(error ? '❌ Error saving attendance' : '✅ Attendance saved successfully!')
//     setLoading(false)
//   }

//   return (
//     <div>
//       <h1 style={styles.title}>Attendance</h1>

//       <div style={styles.card}>
//         <div style={styles.filterRow}>
//           <div style={styles.filterGroup}>
//             <label style={styles.label}>Date</label>
//             <input style={styles.input} type="date" value={date} onChange={e => setDate(e.target.value)} />
//           </div>
//           <div style={styles.filterGroup}>
//             <label style={styles.label}>Class</label>
//             <select style={styles.input} value={selectedClass} onChange={e => handleClassChange(e.target.value)}>
//               <option value="">-- Select Class --</option>
//               {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
//             </select>
//           </div>
//           <div style={styles.filterGroup}>
//             <label style={styles.label}>Section</label>
//             <select style={styles.input} value={selectedSection} onChange={e => setSelectedSection(e.target.value)}>
//               <option value="">-- All Sections --</option>
//               {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
//             </select>
//           </div>
//           <button style={styles.findBtn} onClick={handleFind}>🔍 Load</button>
//         </div>
//       </div>

//       {students.length > 0 && (
//         <div style={styles.card}>
//           <div style={styles.tableHeader}>
//             <h2 style={styles.sectionTitle}>Students — {date}</h2>
//             <div style={styles.legend}>
//               <span style={{ ...styles.badge, backgroundColor: '#dcfce7', color: '#16a34a' }}>Present</span>
//               <span style={{ ...styles.badge, backgroundColor: '#fee2e2', color: '#dc2626' }}>Absent</span>
//               <span style={{ ...styles.badge, backgroundColor: '#fef9c3', color: '#ca8a04' }}>Late</span>
//             </div>
//           </div>

//           <table style={styles.table}>
//             <thead>
//               <tr>
//                 <th style={styles.th}>#</th>
//                 <th style={styles.th}>Name</th>
//                 <th style={styles.th}>Status</th>
//               </tr>
//             </thead>
//             <tbody>
//               {students.map((s, i) => (
//                 <tr key={s.id}>
//                   <td style={styles.td}>{i + 1}</td>
//                   <td style={styles.td}>
//                     <div style={styles.nameCell}>
//                       <div style={styles.avatar}>{s.profiles?.name?.charAt(0).toUpperCase()}</div>
//                       {s.profiles?.name}
//                     </div>
//                   </td>
//                   <td style={styles.td}>
//                     <div style={styles.statusBtns}>
//                       {['present', 'absent', 'late'].map(status => (
//                         <button
//                           key={status}
//                           onClick={() => setAttendance({ ...attendance, [s.id]: status })}
//                           style={{
//                             ...styles.statusBtn,
//                             backgroundColor: attendance[s.id] === status
//                               ? status === 'present' ? '#22c55e' : status === 'absent' ? '#ef4444' : '#eab308'
//                               : '#f3f4f6',
//                             color: attendance[s.id] === status ? '#fff' : '#6b7280',
//                           }}
//                         >
//                           {status.charAt(0).toUpperCase() + status.slice(1)}
//                         </button>
//                       ))}
//                     </div>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>

//           {message && <p style={{ color: message.startsWith('✅') ? '#22c55e' : '#ef4444', fontSize: '14px', marginTop: '12px' }}>{message}</p>}
//           <button style={styles.submitBtn} onClick={handleSubmit} disabled={loading}>
//             {loading ? 'Saving...' : '💾 Save Attendance'}
//           </button>
//         </div>
//       )}
//     </div>
//   )
// }

// const styles = {
//   title: { fontSize: '24px', fontWeight: '700', color: '#1a1a2e', marginBottom: '24px' },
//   card: { backgroundColor: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: '20px' },
//   filterRow: { display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' },
//   filterGroup: { display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '160px' },
//   label: { fontSize: '13px', fontWeight: '600', color: '#374151' },
//   input: { padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', outline: 'none' },
//   findBtn: { padding: '10px 20px', backgroundColor: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', height: '42px' },
//   tableHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
//   sectionTitle: { fontSize: '16px', fontWeight: '700', color: '#1a1a2e' },
//   legend: { display: 'flex', gap: '8px' },
//   badge: { padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' },
//   table: { width: '100%', borderCollapse: 'collapse' },
//   th: { textAlign: 'left', fontSize: '13px', color: '#6b7280', fontWeight: '600', padding: '10px 12px', borderBottom: '2px solid #f3f4f6' },
//   td: { padding: '12px', fontSize: '14px', color: '#374151', borderBottom: '1px solid #f9fafb' },
//   nameCell: { display: 'flex', alignItems: 'center', gap: '10px' },
//   avatar: { width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#4f46e5', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700' },
//   statusBtns: { display: 'flex', gap: '8px' },
//   statusBtn: { padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '500', transition: 'all 0.2s' },
//   submitBtn: { marginTop: '16px', padding: '12px 24px', backgroundColor: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
// }


import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

export default function TeacherAttendance() {
  const { profile } = useAuth()
  const [classes, setClasses] = useState([])
  const [sections, setSections] = useState([])
  const [students, setStudents] = useState([])
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedSection, setSelectedSection] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [attendance, setAttendance] = useState({})
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => { fetchAssignedClasses() }, [])

  const fetchAssignedClasses = async () => {
    const { data } = await supabase
      .from('teacher_classes')
      .select('class_id, section_id, classes(id, name), sections(id, name)')
      .eq('teacher_id', profile.id)
    const assignments = data || []
    const classMap = {}
    assignments.forEach(a => {
      if (!classMap[a.class_id]) classMap[a.class_id] = { id: a.class_id, name: a.classes?.name, sections: [] }
      if (a.section_id) classMap[a.class_id].sections.push({ id: a.section_id, name: a.sections?.name })
    })
    setClasses(Object.values(classMap))
  }

  const handleClassChange = (classId) => {
    setSelectedClass(classId)
    setSelectedSection('')
    setStudents([])
    const cls = classes.find(c => String(c.id) === String(classId))
    setSections(cls?.sections || [])
  }

  const handleFind = async () => {
    if (!selectedClass) return
    setLoading(true)
    const { data } = await supabase
      .from('students')
      .select('id, roll_no, profiles(name, avatar_url)')
      .eq('class_id', selectedClass)
      .eq(selectedSection ? 'section_id' : 'class_id', selectedSection || selectedClass)
    
    const studentList = data || []
    setStudents(studentList)

    const { data: existing } = await supabase
      .from('attendance')
      .select('*')
      .eq('date', date)
      .in('student_id', studentList.map(s => s.id))

    const map = {}
    studentList.forEach(s => map[s.id] = 'present')
    existing?.forEach(a => map[a.student_id] = a.status)
    setAttendance(map)
    setLoading(false)
  }

  const handleSubmit = async () => {
    if (students.length === 0) return
    setLoading(true)
    const records = students.map(s => ({
      student_id: s.id,
      class_id: selectedClass,
      section_id: selectedSection || null,
      date: date,
      is_present: (attendance[s.id] || 'present') === 'present',
      status: attendance[s.id] || 'present',
      marked_by: profile.id,
    }))

    const { error } = await supabase.from('attendance').upsert(records, { onConflict: 'student_id,date' })
    if (error) {
      setMessage('❌ Error: Could not save records.')
    } else {
      setMessage('✅ Attendance saved successfully!')
      setTimeout(() => setMessage(''), 3000)
    }
    setLoading(false)
  }

  return (
    <div style={styles.container}>
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Class Attendance</h1>
          <p style={styles.pageSubtitle}>Mark and manage daily presence for your assigned classes</p>
        </div>
      </div>

      {/* Control Panel */}
      <div style={styles.card}>
        <div style={styles.filterRow}>
          <div style={styles.filterGroup}>
            <label style={styles.label}>Select Date</label>
            <input style={styles.input} type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div style={styles.filterGroup}>
            <label style={styles.label}>Choose Class</label>
            <select style={styles.input} value={selectedClass} onChange={e => handleClassChange(e.target.value)}>
              <option value="">-- Select --</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div style={styles.filterGroup}>
            <label style={styles.label}>Section</label>
            <select style={styles.input} value={selectedSection} onChange={e => setSelectedSection(e.target.value)}>
              <option value="">-- All --</option>
              {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <button style={styles.findBtn} onClick={handleFind} disabled={!selectedClass}>
            {loading && !students.length ? '⌛' : '🔍 Load Roster'}
          </button>
        </div>
      </div>

      {students.length > 0 && (
        <div style={{ ...styles.card, marginTop: '24px', animation: 'fadeIn 0.3s ease-in' }}>
          <div style={styles.tableHeader}>
            <h2 style={styles.sectionTitle}>
              Student Roster 
              <span style={styles.countBadge}>{students.length} Total</span>
            </h2>
            <div style={styles.legend}>
              <span style={{ ...styles.badge, backgroundColor: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}>Present</span>
              <span style={{ ...styles.badge, backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>Absent</span>
              <span style={{ ...styles.badge, backgroundColor: '#fffbeb', color: '#d97706', border: '1px solid #fde68a' }}>Late</span>
            </div>
          </div>

          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={{ ...styles.th, width: '50px', textAlign: 'center' }}>#</th>
                  <th style={styles.th}>Student Name</th>
                  <th style={{ ...styles.th, textAlign: 'right', paddingRight: '40px' }}>Mark Status</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s, i) => (
                  <tr key={s.id} style={styles.tr}>
                    <td style={{ ...styles.td, textAlign: 'center', color: '#94a3b8', fontWeight: '600' }}>{i + 1}</td>
                    <td style={styles.td}>
                      <div style={styles.nameCell}>
                        {s.profiles?.avatar_url ? (
                          <img src={s.profiles.avatar_url} style={styles.avatar} alt="Avatar" />
                        ) : (
                          <div style={{ ...styles.avatar, backgroundColor: ['#4f46e5', '#10b981', '#f59e0b', '#ef4444'][i % 4] }}>
                            {s.profiles?.name?.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p style={styles.stName}>{s.profiles?.name}</p>
                          <p style={styles.stRoll}>Roll No: {s.roll_no || 'N/A'}</p>
                        </div>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.statusBtns}>
                        {[
                          { id: 'present', label: 'Present', color: '#10b981', bg: '#f0fdf4' },
                          { id: 'absent', label: 'Absent', color: '#ef4444', bg: '#fef2f2' },
                          { id: 'late', label: 'Late', color: '#f59e0b', bg: '#fffbeb' }
                        ].map(st => (
                          <button
                            key={st.id}
                            onClick={() => setAttendance({ ...attendance, [s.id]: st.id })}
                            style={{
                              ...styles.statusBtn,
                              backgroundColor: attendance[s.id] === st.id ? st.color : '#f1f5f9',
                              color: attendance[s.id] === st.id ? '#fff' : '#64748b',
                              boxShadow: attendance[s.id] === st.id ? `0 4px 10px ${st.color}40` : 'none',
                              fontWeight: attendance[s.id] === st.id ? '700' : '500',
                            }}
                          >
                            {st.label}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={styles.footerAction}>
            {message && <div style={{ ...styles.alert, backgroundColor: message.startsWith('✅') ? '#f0fdf4' : '#fef2f2', color: message.startsWith('✅') ? '#16a34a' : '#dc2626' }}>{message}</div>}
            <button style={styles.submitBtn} onClick={handleSubmit} disabled={loading}>
              {loading ? '⌛ Saving Records...' : '💾 Submit Attendance'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  container: { maxWidth: '1000px', margin: '0 auto', padding: '20px', fontFamily: 'Inter, sans-serif' },
  pageHeader: { marginBottom: '32px' },
  pageTitle: { fontSize: '32px', fontWeight: '800', color: '#111827', margin: 0, letterSpacing: '-0.5px' },
  pageSubtitle: { fontSize: '15px', color: '#64748b', margin: '4px 0 0' },

  card: { backgroundColor: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' },
  
  filterRow: { display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' },
  filterGroup: { display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, minWidth: '160px' },
  label: { fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' },
  input: { padding: '12px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', backgroundColor: '#fff', color: '#1e293b' },
  
  findBtn: { padding: '0 24px', backgroundColor: '#4f46e5', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: '700', height: '45px', transition: '0.2s', ':hover': { backgroundColor: '#4338ca' } },

  tableHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' },
  sectionTitle: { fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' },
  countBadge: { fontSize: '12px', fontWeight: '700', color: '#6366f1', backgroundColor: '#eef2ff', padding: '4px 10px', borderRadius: '12px', border: '1px solid #c7d2fe' },
  legend: { display: 'flex', gap: '8px' },
  badge: { padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' },

  tableWrapper: { borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', fontSize: '12px', color: '#64748b', fontWeight: '700', padding: '16px 20px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textTransform: 'uppercase' },
  tr: { borderBottom: '1px solid #f1f5f9', transition: '0.15s' },
  td: { padding: '12px 20px', fontSize: '15px', color: '#1e293b', verticalAlign: 'middle' },

  nameCell: { display: 'flex', alignItems: 'center', gap: '12px' },
  avatar: { width: '40px', height: '40px', borderRadius: '50%', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: '800', objectFit: 'cover' },
  stName: { margin: 0, fontWeight: '700', color: '#1e293b' },
  stRoll: { margin: 0, fontSize: '11px', color: '#94a3b8', fontWeight: '600' },

  statusBtns: { display: 'flex', gap: '8px', justifyContent: 'flex-end' },
  statusBtn: { padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '12px', transition: 'all 0.2s', textTransform: 'uppercase', letterSpacing: '0.5px' },

  footerAction: { marginTop: '32px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px' },
  alert: { padding: '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: '600' },
  submitBtn: { padding: '14px 32px', backgroundColor: '#0f172a', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontSize: '15px', fontWeight: '700', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.2)' },
}