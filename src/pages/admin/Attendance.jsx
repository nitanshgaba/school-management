// import { useState, useEffect } from 'react'
// import { supabase } from '../../lib/supabase'

// const TABS = ['Take Attendance', 'Date Wise Attendance']

// export default function Attendance() {
//   const [activeTab, setActiveTab] = useState('Take Attendance')

//   return (
//     <div>
//       <div style={styles.pageHeader}>
//         <h1 style={styles.pageTitle}>Attendance</h1>
//       </div>

//       <div style={styles.card}>
//         <div style={styles.tabs}>
//           {TABS.map(tab => (
//             <button
//               key={tab}
//               onClick={() => setActiveTab(tab)}
//               style={{
//                 ...styles.tab,
//                 borderBottom: activeTab === tab ? '2px solid #22c55e' : '2px solid transparent',
//                 color: activeTab === tab ? '#22c55e' : '#6b7280',
//                 fontWeight: activeTab === tab ? '600' : '400',
//               }}
//             >
//               {tab}
//             </button>
//           ))}
//         </div>

//         {activeTab === 'Take Attendance' && <TakeAttendance />}
//         {activeTab === 'Date Wise Attendance' && <DateWiseAttendance />}
//       </div>
//     </div>
//   )
// }

// // ─── TAKE ATTENDANCE ───────────────────────────────────────
// function TakeAttendance() {
//   const [classes, setClasses] = useState([])
//   const [sections, setSections] = useState([])
//   const [students, setStudents] = useState([])
//   const [attendance, setAttendance] = useState({})
//   const [selectedClass, setSelectedClass] = useState('')
//   const [selectedSection, setSelectedSection] = useState('')
//   const [searched, setSearched] = useState(false)
//   const [loading, setLoading] = useState(false)
//   const [saving, setSaving] = useState(false)
//   const [message, setMessage] = useState('')

//   useEffect(() => {
//     supabase.from('classes').select('*').order('id').then(({ data }) => setClasses(data || []))
//   }, [])

//   const handleClassChange = async (classId) => {
//     setSelectedClass(classId)
//     setSelectedSection('')
//     setSections([])
//     setStudents([])
//     setSearched(false)
//     const { data } = await supabase.from('sections').select('*').eq('class_id', classId)
//     setSections(data || [])
//   }

//   const handleFind = async () => {
//     if (!selectedClass) return
//     setLoading(true)
//     setSearched(true)

//     let query = supabase
//       .from('students')
//       .select('id, roll_no, profiles(name)')
//       .eq('class_id', selectedClass)
//     if (selectedSection) query = query.eq('section_id', selectedSection)

//     const { data } = await query.order('roll_no')
//     const studentList = data || []
//     setStudents(studentList)

//     // Load today's existing attendance
//     const today = new Date().toISOString().split('T')[0]
//     const ids = studentList.map(s => s.id)
//     if (ids.length > 0) {
//       const { data: existing } = await supabase
//         .from('attendance')
//         .select('student_id, is_present')
//         .in('student_id', ids)
//         .eq('date', today)

//       const map = {}
//       studentList.forEach(s => map[s.id] = false)
//       ;(existing || []).forEach(a => map[a.student_id] = a.is_present)
//       setAttendance(map)
//     }

//     setLoading(false)
//   }

//   const toggleAttendance = (studentId) => {
//     setAttendance(prev => ({ ...prev, [studentId]: !prev[studentId] }))
//   }

//   const handleSubmit = async () => {
//     setSaving(true)
//     setMessage('')
//     const today = new Date().toISOString().split('T')[0]
//     const { data: { user } } = await supabase.auth.getUser()

//     const records = students.map(s => ({
//       student_id: s.id,
//       class_id: parseInt(selectedClass),
//       section_id: selectedSection ? parseInt(selectedSection) : null,
//       date: today,
//       is_present: attendance[s.id] || false,
//       status: attendance[s.id] ? 'present' : 'absent',
//       marked_by: user.id,
//     }))

//     const { error } = await supabase
//       .from('attendance')
//       .upsert(records, { onConflict: 'student_id,date' })

//     if (error) {
//       setMessage('❌ Error saving attendance: ' + error.message)
//     } else {
//       setMessage('✅ Attendance saved successfully!')
//       setTimeout(() => setMessage(''), 3000)
//     }
//     setSaving(false)
//   }

//   const handleReset = () => {
//     const reset = {}
//     students.forEach(s => reset[s.id] = false)
//     setAttendance(reset)
//   }

//   const presentCount = Object.values(attendance).filter(Boolean).length

//   return (
//     <div>
//       <h2 style={styles.sectionTitle}>📋 Show Attendance</h2>

//       <div style={styles.filterBox}>
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
//             <select style={styles.input} value={selectedSection} onChange={e => setSelectedSection(e.target.value)}>
//               <option value="">-- Select Section --</option>
//               {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
//             </select>
//           </div>
//           <button style={styles.findBtn} onClick={handleFind}>🔍 Find</button>
//         </div>
//       </div>

//       {searched && (
//         <>
//           {message && (
//             <p style={{ color: message.startsWith('✅') ? '#22c55e' : '#ef4444', fontSize: '14px', marginBottom: '12px' }}>
//               {message}
//             </p>
//           )}

//           {students.length > 0 && (
//             <div style={styles.attendanceSummary}>
//               <span>Total: <strong>{students.length}</strong></span>
//               <span style={{ color: '#22c55e' }}>Present: <strong>{presentCount}</strong></span>
//               <span style={{ color: '#ef4444' }}>Absent: <strong>{students.length - presentCount}</strong></span>
//               <span style={{ color: '#6b7280', fontSize: '13px' }}>
//                 Date: <strong>{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</strong>
//               </span>
//             </div>
//           )}

//           <div style={styles.tableHeader}>
//             <h2 style={styles.sectionTitle}>📋 Student List</h2>
//           </div>

//           <table style={styles.table}>
//             <thead>
//               <tr>
//                 <th style={styles.th}>#</th>
//                 <th style={styles.th}>Roll No.</th>
//                 <th style={styles.th}>Name</th>
//                 <th style={styles.th}>Total Days</th>
//                 <th style={styles.th}>Present</th>
//                 <th style={styles.th}>Mark Present</th>
//               </tr>
//             </thead>
//             <tbody>
//               {loading ? (
//                 <tr><td colSpan={6} style={styles.emptyCell}>Loading...</td></tr>
//               ) : students.length === 0 ? (
//                 <tr><td colSpan={6} style={styles.emptyCell}>No students found in this class/section</td></tr>
//               ) : (
//                 students.map((s, i) => (
//                   <tr key={s.id} style={{ backgroundColor: attendance[s.id] ? '#f0fdf4' : '#fff' }}>
//                     <td style={styles.td}>{i + 1}.</td>
//                     <td style={styles.td}>{s.roll_no || s.id.slice(0, 8)}</td>
//                     <td style={styles.td}>
//                       <div style={styles.nameCell}>
//                         <div style={styles.miniAvatar}>{s.profiles?.name?.charAt(0).toUpperCase()}</div>
//                         {s.profiles?.name}
//                       </div>
//                     </td>
//                     <td style={styles.td}>—</td>
//                     <td style={styles.td}>
//                       <span style={{ color: attendance[s.id] ? '#22c55e' : '#ef4444', fontWeight: '600' }}>
//                         {attendance[s.id] ? 'P' : 'A'}
//                       </span>
//                     </td>
//                     <td style={styles.td}>
//                       <div
//                         onClick={() => toggleAttendance(s.id)}
//                         style={{
//                           ...styles.toggle,
//                           backgroundColor: attendance[s.id] ? '#22c55e' : '#d1d5db',
//                         }}
//                       >
//                         <div style={{
//                           ...styles.toggleKnob,
//                           transform: attendance[s.id] ? 'translateX(20px)' : 'translateX(2px)',
//                         }} />
//                       </div>
//                     </td>
//                   </tr>
//                 ))
//               )}
//             </tbody>
//           </table>

//           {students.length > 0 && (
//             <div style={styles.actionRow}>
//               <button style={styles.resetBtn} onClick={handleReset}>Reset</button>
//               <button style={styles.submitBtn} onClick={handleSubmit} disabled={saving}>
//                 {saving ? 'Saving...' : 'Submit'}
//               </button>
//             </div>
//           )}
//         </>
//       )}

//       {!searched && (
//         <div style={styles.emptyState}>
//           <div style={{ fontSize: '64px' }}>📋</div>
//           <p style={{ color: '#9ca3af', marginTop: '12px' }}>Select class and section to take attendance</p>
//         </div>
//       )}
//     </div>
//   )
// }

// // ─── DATE WISE ATTENDANCE ──────────────────────────────────
// function DateWiseAttendance() {
//   const [classes, setClasses] = useState([])
//   const [sections, setSections] = useState([])
//   const [records, setRecords] = useState([])
//   const [selectedClass, setSelectedClass] = useState('')
//   const [selectedSection, setSelectedSection] = useState('')
//   const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
//   const [searched, setSearched] = useState(false)
//   const [loading, setLoading] = useState(false)

//   useEffect(() => {
//     supabase.from('classes').select('*').order('id').then(({ data }) => setClasses(data || []))
//   }, [])

//   const handleClassChange = async (classId) => {
//     setSelectedClass(classId)
//     setSelectedSection('')
//     const { data } = await supabase.from('sections').select('*').eq('class_id', classId)
//     setSections(data || [])
//   }

//   const handleFind = async () => {
//     if (!selectedClass || !selectedDate) return
//     setLoading(true)
//     setSearched(true)

//     let query = supabase
//       .from('attendance')
//       .select('*, students(roll_no, profiles(name))')
//       .eq('class_id', selectedClass)
//       .eq('date', selectedDate)

//     if (selectedSection) query = query.eq('section_id', selectedSection)

//     const { data } = await query
//     setRecords(data || [])
//     setLoading(false)
//   }

//   return (
//     <div>
//       <h2 style={styles.sectionTitle}>📋 Information</h2>

//       <div style={styles.filterBox}>
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
//             <select style={styles.input} value={selectedSection} onChange={e => setSelectedSection(e.target.value)}>
//               <option value="">-- Select Section --</option>
//               {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
//             </select>
//           </div>
//           <div style={styles.filterGroup}>
//             <label style={styles.label}>Date</label>
//             <input
//               style={styles.input}
//               type="date"
//               value={selectedDate}
//               onChange={e => setSelectedDate(e.target.value)}
//             />
//           </div>
//           <button style={styles.findBtn} onClick={handleFind}>🔍 Find</button>
//         </div>
//       </div>

//       <h2 style={{ ...styles.sectionTitle, marginBottom: '12px' }}>📋 Attendance Sheet</h2>

//       <table style={styles.table}>
//         <thead>
//           <tr>
//             <th style={styles.th}>#</th>
//             <th style={styles.th}>Roll No.</th>
//             <th style={styles.th}>Name</th>
//             <th style={styles.th}>Attendance</th>
//           </tr>
//         </thead>
//         <tbody>
//           {!searched ? (
//             <tr>
//               <td colSpan={4} style={styles.emptyCell}>
//                 <div style={{ textAlign: 'center', padding: '40px' }}>
//                   <div style={{ fontSize: '48px', marginBottom: '8px' }}>🗄️</div>
//                   <div>No Data</div>
//                 </div>
//               </td>
//             </tr>
//           ) : loading ? (
//             <tr><td colSpan={4} style={styles.emptyCell}>Loading...</td></tr>
//           ) : records.length === 0 ? (
//             <tr>
//               <td colSpan={4} style={styles.emptyCell}>
//                 <div style={{ textAlign: 'center', padding: '40px' }}>
//                   <div style={{ fontSize: '48px', marginBottom: '8px' }}>🗄️</div>
//                   <div>No attendance records for this date</div>
//                 </div>
//               </td>
//             </tr>
//           ) : (
//             records.map((r, i) => (
//               <tr key={r.id}>
//                 <td style={styles.td}>{i + 1}.</td>
//                 <td style={styles.td}>{r.students?.roll_no || '—'}</td>
//                 <td style={styles.td}>
//                   <div style={styles.nameCell}>
//                     <div style={styles.miniAvatar}>
//                       {r.students?.profiles?.name?.charAt(0).toUpperCase()}
//                     </div>
//                     {r.students?.profiles?.name}
//                   </div>
//                 </td>
//                 <td style={styles.td}>
//                   <span style={{
//                     padding: '4px 12px',
//                     borderRadius: '20px',
//                     fontSize: '13px',
//                     fontWeight: '600',
//                     backgroundColor: r.is_present ? '#dcfce7' : '#fee2e2',
//                     color: r.is_present ? '#16a34a' : '#dc2626',
//                   }}>
//                     {r.is_present ? 'Present' : 'Absent'}
//                   </span>
//                 </td>
//               </tr>
//             ))
//           )}
//         </tbody>
//       </table>
//     </div>
//   )
// }

// const styles = {
//   pageHeader: { marginBottom: '24px' },
//   pageTitle: { fontSize: '28px', fontWeight: '700', color: '#1a1a2e', margin: 0 },
//   card: { backgroundColor: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
//   tabs: { display: 'flex', gap: '4px', borderBottom: '1px solid #e5e7eb', marginBottom: '24px' },
//   tab: { padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', transition: 'all 0.2s' },
//   sectionTitle: { fontSize: '16px', fontWeight: '700', color: '#1a1a2e', marginBottom: '16px' },
//   filterBox: { backgroundColor: '#f9fafb', borderRadius: '10px', padding: '16px', marginBottom: '24px' },
//   filterRow: { display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' },
//   filterGroup: { display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '160px' },
//   findBtn: { padding: '10px 20px', backgroundColor: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', height: '40px' },
//   label: { fontSize: '13px', fontWeight: '600', color: '#374151' },
//   input: { padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', outline: 'none' },
//   tableHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
//   table: { width: '100%', borderCollapse: 'collapse' },
//   th: { textAlign: 'left', fontSize: '13px', color: '#6b7280', fontWeight: '600', padding: '10px 12px', borderBottom: '2px solid #f3f4f6' },
//   td: { padding: '12px', fontSize: '14px', color: '#374151', borderBottom: '1px solid #f9fafb' },
//   emptyCell: { padding: '24px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' },
//   nameCell: { display: 'flex', alignItems: 'center', gap: '10px' },
//   miniAvatar: { width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#4f46e5', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700' },
//   toggle: { width: '44px', height: '24px', borderRadius: '12px', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' },
//   toggleKnob: { width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#fff', position: 'absolute', top: '2px', transition: 'transform 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' },
//   actionRow: { display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' },
//   resetBtn: { padding: '10px 24px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: '14px', color: '#eab308', fontWeight: '600' },
//   submitBtn: { padding: '10px 24px', borderRadius: '8px', border: 'none', backgroundColor: '#4f46e5', color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
//   attendanceSummary: { display: 'flex', gap: '24px', padding: '12px 16px', backgroundColor: '#f9fafb', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' },
//   emptyState: { textAlign: 'center', padding: '60px 0' },
// }

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

const TABS = ['Take Attendance', 'Date Wise Attendance']

export default function Attendance() {
  const [activeTab, setActiveTab] = useState('Take Attendance')

  return (
    <div style={styles.container}>
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Attendance Dashboard</h1>
          <p style={styles.pageSubtitle}>Manage and track student presence efficiently</p>
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.tabContainer}>
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                ...styles.tab,
                backgroundColor: activeTab === tab ? '#fff' : 'transparent',
                color: activeTab === tab ? '#111827' : '#6b7280',
                boxShadow: activeTab === tab ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                fontWeight: activeTab === tab ? '600' : '500',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'Take Attendance' && <TakeAttendance />}
        {activeTab === 'Date Wise Attendance' && <DateWiseAttendance />}
      </div>
    </div>
  )
}

// ─── TAKE ATTENDANCE ───────────────────────────────────────
function TakeAttendance() {
  const [classes, setClasses] = useState([])
  const [sections, setSections] = useState([])
  const [students, setStudents] = useState([])
  const [attendance, setAttendance] = useState({})
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedSection, setSelectedSection] = useState('')
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    supabase.from('classes').select('*').order('id').then(({ data }) => setClasses(data || []))
  }, [])

  const handleClassChange = async (classId) => {
    setSelectedClass(classId)
    setSelectedSection('')
    setSections([])
    setStudents([])
    setSearched(false)
    const { data } = await supabase.from('sections').select('*').eq('class_id', classId)
    setSections(data || [])
  }

  const handleFind = async () => {
    if (!selectedClass) return
    setLoading(true)
    setSearched(true)

    let query = supabase
      .from('students')
      .select('id, roll_no, profiles(name)')
      .eq('class_id', selectedClass)
    if (selectedSection) query = query.eq('section_id', selectedSection)

    const { data } = await query.order('roll_no')
    const studentList = data || []
    setStudents(studentList)

    // Load today's existing attendance
    const today = new Date().toISOString().split('T')[0]
    const ids = studentList.map(s => s.id)
    if (ids.length > 0) {
      const { data: existing } = await supabase
        .from('attendance')
        .select('student_id, is_present')
        .in('student_id', ids)
        .eq('date', today)

      const map = {}
      studentList.forEach(s => map[s.id] = false)
      ;(existing || []).forEach(a => map[a.student_id] = a.is_present)
      setAttendance(map)
    }

    setLoading(false)
  }

  const toggleAttendance = (studentId) => {
    setAttendance(prev => ({ ...prev, [studentId]: !prev[studentId] }))
  }

  const handleSubmit = async () => {
    setSaving(true)
    setMessage('')
    const today = new Date().toISOString().split('T')[0]
    const { data: { user } } = await supabase.auth.getUser()

    const records = students.map(s => ({
      student_id: s.id,
      class_id: parseInt(selectedClass),
      section_id: selectedSection ? parseInt(selectedSection) : null,
      date: today,
      is_present: attendance[s.id] || false,
      status: attendance[s.id] ? 'present' : 'absent',
      marked_by: user.id,
    }))

    const { error } = await supabase
      .from('attendance')
      .upsert(records, { onConflict: 'student_id,date' })

    if (error) {
      setMessage('❌ Error saving attendance: ' + error.message)
    } else {
      setMessage('✅ Attendance saved successfully!')
      setTimeout(() => setMessage(''), 3000)
    }
    setSaving(false)
  }

  const handleReset = () => {
    const reset = {}
    students.forEach(s => reset[s.id] = false)
    setAttendance(reset)
  }

  const presentCount = Object.values(attendance).filter(Boolean).length

  return (
    <div style={styles.fadeIn}>
      <h2 style={styles.sectionTitle}>🎯 Select Criteria</h2>

      <div style={styles.filterBox}>
        <div style={styles.filterRow}>
          <div style={styles.filterGroup}>
            <label style={styles.label}>Class</label>
            <select style={styles.input} value={selectedClass} onChange={e => handleClassChange(e.target.value)}>
              <option value="">-- Select Class --</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div style={styles.filterGroup}>
            <label style={styles.label}>Section</label>
            <select style={styles.input} value={selectedSection} onChange={e => setSelectedSection(e.target.value)}>
              <option value="">-- Select Section --</option>
              {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <button style={styles.findBtn} onClick={handleFind}>
            <span style={{ marginRight: '6px' }}>🔍</span> Find Students
          </button>
        </div>
      </div>

      {searched && (
        <>
          {message && (
            <div style={{ ...styles.alertBox, backgroundColor: message.startsWith('✅') ? '#f0fdf4' : '#fef2f2', border: message.startsWith('✅') ? '1px solid #bbf7d0' : '1px solid #fecaca', color: message.startsWith('✅') ? '#15803d' : '#991b1b' }}>
              {message}
            </div>
          )}

          {students.length > 0 && (
            <div style={styles.attendanceSummary}>
              <div style={styles.statBox}>
                <span style={styles.statLabel}>Total</span>
                <span style={styles.statValue}>{students.length}</span>
              </div>
              <div style={{ ...styles.statBox, backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                <span style={{ ...styles.statLabel, color: '#16a34a' }}>Present</span>
                <span style={{ ...styles.statValue, color: '#16a34a' }}>{presentCount}</span>
              </div>
              <div style={{ ...styles.statBox, backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}>
                <span style={{ ...styles.statLabel, color: '#dc2626' }}>Absent</span>
                <span style={{ ...styles.statValue, color: '#dc2626' }}>{students.length - presentCount}</span>
              </div>
              <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                <span style={{ color: '#6b7280', fontSize: '13px', display: 'block' }}>Today's Date</span>
                <strong style={{ color: '#374151' }}>{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</strong>
              </div>
            </div>
          )}

          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>#</th>
                  <th style={styles.th}>Roll No.</th>
                  <th style={styles.th}>Student Name</th>
                  <th style={styles.th}>Status</th>
                  <th style={{ ...styles.th, textAlign: 'right', paddingRight: '24px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} style={styles.emptyCell}>⏳ Loading students...</td></tr>
                ) : students.length === 0 ? (
                  <tr><td colSpan={5} style={styles.emptyCell}>No students found in this selection.</td></tr>
                ) : (
                  students.map((s, i) => (
                    <tr key={s.id} style={{ ...styles.tr, backgroundColor: attendance[s.id] ? '#f8fafc' : '#fff' }}>
                      <td style={styles.td}>{i + 1}.</td>
                      <td style={{ ...styles.td, fontWeight: '500', color: '#64748b' }}>{s.roll_no || s.id.slice(0, 8)}</td>
                      <td style={styles.td}>
                        <div style={styles.nameCell}>
                          <div style={{ ...styles.miniAvatar, backgroundColor: ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'][i % 5] }}>
                            {s.profiles?.name?.charAt(0).toUpperCase()}
                          </div>
                          <span style={{ fontWeight: '500' }}>{s.profiles?.name}</span>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.badge,
                          backgroundColor: attendance[s.id] ? '#dcfce7' : '#f3f4f6',
                          color: attendance[s.id] ? '#16a34a' : '#6b7280',
                        }}>
                          {attendance[s.id] ? 'Present' : 'Absent'}
                        </span>
                      </td>
                      <td style={{ ...styles.td, textAlign: 'right', paddingRight: '24px' }}>
                        <div
                          onClick={() => toggleAttendance(s.id)}
                          style={{
                            ...styles.toggle,
                            backgroundColor: attendance[s.id] ? '#10b981' : '#cbd5e1',
                          }}
                        >
                          <div style={{
                            ...styles.toggleKnob,
                            transform: attendance[s.id] ? 'translateX(22px)' : 'translateX(2px)',
                          }} />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {students.length > 0 && (
            <div style={styles.actionRow}>
              <button style={styles.resetBtn} onClick={handleReset}>↺ Reset Form</button>
              <button style={styles.submitBtn} onClick={handleSubmit} disabled={saving}>
                {saving ? '⏳ Saving...' : '💾 Save Attendance'}
              </button>
            </div>
          )}
        </>
      )}

      {!searched && (
        <div style={styles.emptyState}>
          <div style={styles.emptyStateIcon}>📋</div>
          <h3 style={{ color: '#374151', margin: '0 0 8px 0' }}>Ready to take attendance</h3>
          <p style={{ color: '#6b7280', margin: 0, fontSize: '14px' }}>Select a class and section from the dropdowns above to begin.</p>
        </div>
      )}
    </div>
  )
}

// ─── DATE WISE ATTENDANCE ──────────────────────────────────
function DateWiseAttendance() {
  const [classes, setClasses] = useState([])
  const [sections, setSections] = useState([])
  const [records, setRecords] = useState([])
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedSection, setSelectedSection] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.from('classes').select('*').order('id').then(({ data }) => setClasses(data || []))
  }, [])

  const handleClassChange = async (classId) => {
    setSelectedClass(classId)
    setSelectedSection('')
    const { data } = await supabase.from('sections').select('*').eq('class_id', classId)
    setSections(data || [])
  }

  const handleFind = async () => {
    if (!selectedClass || !selectedDate) return
    setLoading(true)
    setSearched(true)

    let query = supabase
      .from('attendance')
      .select('*, students(roll_no, profiles(name))')
      .eq('class_id', selectedClass)
      .eq('date', selectedDate)

    if (selectedSection) query = query.eq('section_id', selectedSection)

    const { data } = await query
    setRecords(data || [])
    setLoading(false)
  }

  return (
    <div style={styles.fadeIn}>
      <h2 style={styles.sectionTitle}>📅 View History</h2>

      <div style={styles.filterBox}>
        <div style={styles.filterRow}>
          <div style={styles.filterGroup}>
            <label style={styles.label}>Class</label>
            <select style={styles.input} value={selectedClass} onChange={e => handleClassChange(e.target.value)}>
              <option value="">-- Select Class --</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div style={styles.filterGroup}>
            <label style={styles.label}>Section</label>
            <select style={styles.input} value={selectedSection} onChange={e => setSelectedSection(e.target.value)}>
              <option value="">-- Select Section --</option>
              {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div style={styles.filterGroup}>
            <label style={styles.label}>Date</label>
            <input
              style={styles.input}
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
            />
          </div>
          <button style={styles.findBtn} onClick={handleFind}>
            <span style={{ marginRight: '6px' }}>🔍</span> Fetch Records
          </button>
        </div>
      </div>

      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>#</th>
              <th style={styles.th}>Roll No.</th>
              <th style={styles.th}>Student Name</th>
              <th style={styles.th}>Recorded Status</th>
            </tr>
          </thead>
          <tbody>
            {!searched ? (
              <tr>
                <td colSpan={4} style={styles.emptyCell}>
                  <div style={styles.emptyState}>
                    <div style={{ ...styles.emptyStateIcon, fontSize: '40px' }}>🗂️</div>
                    <p style={{ color: '#6b7280', margin: 0 }}>Select parameters to view past attendance records.</p>
                  </div>
                </td>
              </tr>
            ) : loading ? (
              <tr><td colSpan={4} style={styles.emptyCell}>⏳ Loading records...</td></tr>
            ) : records.length === 0 ? (
              <tr>
                <td colSpan={4} style={styles.emptyCell}>
                  <div style={styles.emptyState}>
                    <div style={{ ...styles.emptyStateIcon, fontSize: '40px' }}>📁</div>
                    <p style={{ color: '#6b7280', margin: 0 }}>No attendance records found for this specific date.</p>
                  </div>
                </td>
              </tr>
            ) : (
              records.map((r, i) => (
                <tr key={r.id} style={styles.tr}>
                  <td style={styles.td}>{i + 1}.</td>
                  <td style={{ ...styles.td, fontWeight: '500', color: '#64748b' }}>{r.students?.roll_no || '—'}</td>
                  <td style={styles.td}>
                    <div style={styles.nameCell}>
                      <div style={{ ...styles.miniAvatar, backgroundColor: '#cbd5e1', color: '#475569' }}>
                        {r.students?.profiles?.name?.charAt(0).toUpperCase()}
                      </div>
                      <span style={{ fontWeight: '500' }}>{r.students?.profiles?.name}</span>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.badge,
                      backgroundColor: r.is_present ? '#dcfce7' : '#fee2e2',
                      color: r.is_present ? '#16a34a' : '#dc2626',
                    }}>
                      {r.is_present ? '✓ Present' : '✕ Absent'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── STYLES ────────────────────────────────────────────────
const styles = {
  container: { maxWidth: '1000px', margin: '0 auto', padding: '20px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' },
  pageHeader: { marginBottom: '32px' },
  pageTitle: { fontSize: '32px', fontWeight: '800', color: '#111827', margin: '0 0 8px 0', letterSpacing: '-0.5px' },
  pageSubtitle: { fontSize: '15px', color: '#6b7280', margin: 0 },
  
  card: { backgroundColor: '#fff', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)', border: '1px solid #f3f4f6' },
  
  tabContainer: { display: 'inline-flex', background: '#f1f5f9', padding: '4px', borderRadius: '12px', marginBottom: '32px' },
  tab: { padding: '10px 24px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', transition: 'all 0.2s ease' },
  
  fadeIn: { opacity: 1, transition: 'opacity 0.3s ease-in' },
  
  sectionTitle: { fontSize: '18px', fontWeight: '700', color: '#1f2937', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '8px' },
  
  filterBox: { backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', marginBottom: '24px' },
  filterRow: { display: 'flex', gap: '20px', alignItems: 'flex-end', flexWrap: 'wrap' },
  filterGroup: { display: 'flex', flexDirection: 'column', gap: '8px', flex: '1', minWidth: '200px' },
  label: { fontSize: '13px', fontWeight: '600', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' },
  input: { padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', backgroundColor: '#fff', color: '#1e293b', transition: 'border-color 0.2s', width: '100%' },
  
  findBtn: { padding: '12px 24px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', height: '44px', display: 'flex', alignItems: 'center', transition: 'background-color 0.2s', boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)' },
  
  alertBox: { padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center' },
  
  attendanceSummary: { display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 24px', backgroundColor: '#f8fafc', borderRadius: '12px', marginBottom: '24px', border: '1px solid #e2e8f0' },
  statBox: { display: 'flex', flexDirection: 'column', padding: '8px 16px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', minWidth: '90px', alignItems: 'center' },
  statLabel: { fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' },
  statValue: { fontSize: '20px', fontWeight: '700', color: '#0f172a', marginTop: '4px' },
  
  tableWrapper: { borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff' },
  th: { textAlign: 'left', fontSize: '12px', color: '#64748b', fontWeight: '700', padding: '16px 20px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textTransform: 'uppercase', letterSpacing: '0.5px' },
  tr: { borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.15s ease' },
  td: { padding: '16px 20px', fontSize: '14px', color: '#1e293b', verticalAlign: 'middle' },
  emptyCell: { padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '15px' },
  
  nameCell: { display: 'flex', alignItems: 'center', gap: '12px' },
  miniAvatar: { width: '36px', height: '36px', borderRadius: '10px', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
  
  badge: { padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', letterSpacing: '0.3px', display: 'inline-block' },
  
  toggle: { width: '48px', height: '26px', borderRadius: '13px', cursor: 'pointer', position: 'relative', transition: 'background-color 0.3s ease', display: 'inline-block', border: '1px solid rgba(0,0,0,0.05)' },
  toggleKnob: { width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#fff', position: 'absolute', top: '1px', transition: 'transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)', boxShadow: '0 2px 4px rgba(0,0,0,0.2), 0 0 1px rgba(0,0,0,0.1)' },
  
  actionRow: { display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #e2e8f0' },
  resetBtn: { padding: '12px 24px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontSize: '14px', color: '#475569', fontWeight: '600', transition: 'background-color 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' },
  submitBtn: { padding: '12px 32px', borderRadius: '8px', border: 'none', backgroundColor: '#10b981', color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: '600', transition: 'background-color 0.2s', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)' },
  
  emptyState: { textAlign: 'center', padding: '60px 20px', border: '2px dashed #e2e8f0', borderRadius: '12px', backgroundColor: '#fafaf9', marginTop: '16px' },
  emptyStateIcon: { fontSize: '56px', marginBottom: '16px', opacity: 0.8 },
}