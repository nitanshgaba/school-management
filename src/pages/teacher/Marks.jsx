

// import { useState, useEffect } from 'react'
// import { supabase } from '../../lib/supabase'
// import { useAuth } from '../../context/AuthContext'

// export default function TeacherMarks() {
//   const { profile } = useAuth()
//   const [classes, setClasses] = useState([])
//   const [sections, setSections] = useState([])
//   const [subjects, setSubjects] = useState([])
//   const [exams, setExams] = useState([])
//   const [students, setStudents] = useState([])
//   const [marks, setMarks] = useState({})
//   const [selectedClass, setSelectedClass] = useState('')
//   const [selectedSection, setSelectedSection] = useState('')
//   const [selectedSubject, setSelectedSubject] = useState('')
//   const [selectedExam, setSelectedExam] = useState('')
//   const [activeTab, setActiveTab] = useState('Enter Marks')
//   const [loading, setLoading] = useState(false)
//   const [saving, setSaving] = useState(false)
//   const [message, setMessage] = useState('')

//   useEffect(() => {
//     supabase.from('classes').select('*').then(({ data }) => setClasses(data || []))
//     supabase.from('subjects').select('*').eq('teacher_id', profile.id).then(({ data }) => setSubjects(data || []))
//   }, [profile.id])

//   const handleClassChange = async (classId) => {
//     setSelectedClass(classId)
//     setSelectedSection('')
//     setSelectedExam('')
//     setStudents([])
//     const [secRes, examRes] = await Promise.all([
//       supabase.from('sections').select('*').eq('class_id', classId),
//       supabase.from('exams').select('*').eq('class_id', classId).order('exam_date', { ascending: false }),
//     ])
//     setSections(secRes.data || [])
//     setExams(examRes.data || [])
//   }

//   const handleLoad = async () => {
//     if (!selectedClass || !selectedExam) { setMessage('Please select class and exam'); return }
//     setLoading(true)
//     setMessage('')

//     let query = supabase.from('students').select('id, roll_no, profiles(name)').eq('class_id', selectedClass)
//     if (selectedSection) query = query.eq('section_id', selectedSection)
//     const { data: studentData } = await query
//     setStudents(studentData || [])

//     const { data: existingMarks } = await supabase
//       .from('marks')
//       .select('*')
//       .eq('exam_id', selectedExam)
//       .in('student_id', (studentData || []).map(s => s.id))

//     const marksMap = {}
//     existingMarks?.forEach(m => marksMap[m.student_id] = { obtained: m.obtained_marks, total: m.total_marks, grade: m.grade })
//     setMarks(marksMap)
//     setLoading(false)
//   }

//   const handleSave = async () => {
//     if (students.length === 0) return
//     setSaving(true)
//     setMessage('')

//     const records = students.map(s => ({
//       student_id: s.id,
//       exam_id: selectedExam || null,
//       subject_id: selectedSubject || null,
//       class_id: selectedClass || null,
//       teacher_id: profile.id,
//       obtained_marks: parseFloat(marks[s.id]?.obtained) || 0,
//       total_marks: parseFloat(marks[s.id]?.total) || 100,
//       grade: marks[s.id]?.grade || '',
//     }))

//     const { error } = await supabase.from('marks').upsert(records, { onConflict: 'student_id,exam_id' })
//     setMessage(error ? '❌ Error saving marks' : '✅ Marks saved successfully!')
//     setSaving(false)
//   }

//   const updateMark = (studentId, field, value) => {
//     setMarks(prev => ({ ...prev, [studentId]: { ...prev[studentId], [field]: value } }))
//   }

//   return (
//     <div>
//       <h1 style={styles.title}>Marks</h1>
//       <div style={styles.tabs}>
//         {['Enter Marks', 'Report Card'].map(tab => (
//           <button key={tab} onClick={() => setActiveTab(tab)} style={{
//             ...styles.tab,
//             borderBottom: activeTab === tab ? '2px solid #4f46e5' : '2px solid transparent',
//             color: activeTab === tab ? '#4f46e5' : '#6b7280',
//             fontWeight: activeTab === tab ? '600' : '400',
//           }}>{tab}</button>
//         ))}
//       </div>

//       {activeTab === 'Report Card' ? (
//         <TeacherReportCard profile={profile} />
//       ) : (
//         <div>
//           <div style={styles.card}>
//             <div style={styles.filterRow}>
//               <div style={styles.filterGroup}>
//                 <label style={styles.label}>Class *</label>
//                 <select style={styles.input} value={selectedClass} onChange={e => handleClassChange(e.target.value)}>
//                   <option value="">-- Select Class --</option>
//                   {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
//                 </select>
//               </div>
//               <div style={styles.filterGroup}>
//                 <label style={styles.label}>Section</label>
//                 <select style={styles.input} value={selectedSection} onChange={e => setSelectedSection(e.target.value)}>
//                   <option value="">-- All --</option>
//                   {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
//                 </select>
//               </div>
//               <div style={styles.filterGroup}>
//                 <label style={styles.label}>Subject</label>
//                 <select style={styles.input} value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}>
//                   <option value="">-- Select Subject --</option>
//                   {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
//                 </select>
//               </div>
//               <div style={styles.filterGroup}>
//                 <label style={styles.label}>Exam *</label>
//                 <select style={styles.input} value={selectedExam} onChange={e => setSelectedExam(e.target.value)}>
//                   <option value="">-- Select Exam --</option>
//                   {exams.map(e => <option key={e.id} value={e.id}>{e.exam_name}</option>)}
//                 </select>
//               </div>
//               <button style={styles.findBtn} onClick={handleLoad}>🔍 Load</button>
//             </div>
//           </div>

//           {students.length > 0 && (
//             <div style={styles.card}>
//               <h2 style={styles.sectionTitle}>Enter Marks</h2>
//               <table style={styles.table}>
//                 <thead>
//                   <tr>
//                     <th style={styles.th}>#</th>
//                     <th style={styles.th}>Student</th>
//                     <th style={styles.th}>Obtained</th>
//                     <th style={styles.th}>Total</th>
//                     <th style={styles.th}>Grade</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {loading ? (
//                     <tr><td colSpan={5} style={styles.emptyCell}>Loading...</td></tr>
//                   ) : students.map((s, i) => (
//                     <tr key={s.id}>
//                       <td style={styles.td}>{i + 1}</td>
//                       <td style={styles.td}>
//                         <div style={styles.nameCell}>
//                           <div style={styles.avatar}>{s.profiles?.name?.charAt(0).toUpperCase()}</div>
//                           {s.profiles?.name}
//                         </div>
//                       </td>
//                       <td style={styles.td}>
//                         <input style={styles.markInput} type="number" min="0"
//                           value={marks[s.id]?.obtained || ''}
//                           onChange={e => updateMark(s.id, 'obtained', e.target.value)}
//                           placeholder="0" />
//                       </td>
//                       <td style={styles.td}>
//                         <input style={styles.markInput} type="number" min="0"
//                           value={marks[s.id]?.total || ''}
//                           onChange={e => updateMark(s.id, 'total', e.target.value)}
//                           placeholder="100" />
//                       </td>
//                       <td style={styles.td}>
//                         <select style={styles.gradeSelect}
//                           value={marks[s.id]?.grade || ''}
//                           onChange={e => updateMark(s.id, 'grade', e.target.value)}>
//                           <option value="">--</option>
//                           {['A+','A','B+','B','C+','C','D','F'].map(g => <option key={g} value={g}>{g}</option>)}
//                         </select>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//               {message && <p style={{ color: message.startsWith('✅') ? '#22c55e' : '#ef4444', fontSize: '14px', marginTop: '12px' }}>{message}</p>}
//               <button style={styles.saveBtn} onClick={handleSave} disabled={saving}>
//                 {saving ? 'Saving...' : '💾 Save Marks'}
//               </button>
//             </div>
//           )}
//         </div>
//       )}
//     </div>
//   )
// }

// function TeacherReportCard({ profile }) {
//   const [classes, setClasses] = useState([])
//   const [students, setStudents] = useState([])
//   const [exams, setExams] = useState([])
//   const [selClass, setSelClass] = useState('')
//   const [selStudent, setSelStudent] = useState('')
//   const [selExam, setSelExam] = useState('')
//   const [reportData, setReportData] = useState(null)
//   const [loading, setLoading] = useState(false)

//   useEffect(() => {
//     supabase.from('teacher_classes').select('class_id, classes(name)').eq('teacher_id', profile.id)
//       .then(({ data }) => setClasses(data || []))
//   }, [])

//   const loadStudents = async (classId) => {
//     setSelClass(classId); setSelStudent(''); setReportData(null)
//     const { data } = await supabase.from('students').select('id, roll_no, profiles(name)').eq('class_id', parseInt(classId))
//     setStudents(data || [])
//     const { data: examData } = await supabase.from('exams').select('*').eq('class_id', parseInt(classId))
//     setExams(examData || [])
//   }

//   const generateReport = async () => {
//     if (!selStudent || !selExam) { alert('Select student and exam'); return }
//     setLoading(true)
//     const student = students.find(s => s.id === selStudent)
//     const exam = exams.find(e => e.id === selExam)
//     const { data: marksData } = await supabase.from('marks')
//       .select('*, subjects(name)').eq('student_id', selStudent).eq('exam_id', selExam)
//     const total = marksData?.reduce((a, m) => a + (m.obtained_marks || 0), 0)
//     const maxTotal = marksData?.reduce((a, m) => a + (m.total_marks || 0), 0)
//     setReportData({ student, exam, marks: marksData || [], total, maxTotal })
//     setLoading(false)
//   }

//   const printReport = async () => {
//     if (!reportData) return
//     const { getSchoolSettings } = await import('../../lib/schoolSettings')
//     const school = await getSchoolSettings()
//     const pct = reportData.maxTotal > 0 ? Math.round((reportData.total / reportData.maxTotal) * 100) : 0
//     const w = window.open('', '_blank')
//     w.document.write(`
//       <html><head><title>Report Card</title><style>
//         body{font-family:Arial,sans-serif;padding:40px;max-width:700px;margin:0 auto}
//         .header{text-align:center;border-bottom:3px double #1a1a2e;padding-bottom:16px;margin-bottom:20px}
//         h1{margin:0;font-size:22px}h3{margin:4px 0 0;font-weight:400;font-size:14px;color:#666}
//         table{width:100%;border-collapse:collapse;margin:20px 0}
//         th{background:#f1f5f9;padding:10px;text-align:left;font-size:13px}
//         td{padding:10px;border-bottom:1px solid #f3f4f6;font-size:14px}
//         .summary{background:#f8fafc;padding:16px;border-radius:8px;display:flex;justify-content:space-around;margin-top:16px}
//         @media print{body{padding:20px}}
//       </style></head><body>
//       <div class="header">
//         <h1>${school?.school_name || 'School'}</h1>
//         ${school?.tagline ? `<h3>${school.tagline}</h3>` : ''}
//         <h3>Report Card — ${reportData.exam?.exam_name}</h3>
//       </div>
//       <p><strong>Student:</strong> ${reportData.student?.profiles?.name} &nbsp;|&nbsp; <strong>Roll No:</strong> ${reportData.student?.roll_no}</p>
//       <table>
//         <thead><tr><th>Subject</th><th>Obtained</th><th>Total</th><th>Grade</th></tr></thead>
//         <tbody>
//           ${reportData.marks.map(m => `<tr><td>${m.subjects?.name||'—'}</td><td>${m.obtained_marks}</td><td>${m.total_marks}</td><td>${m.grade||'—'}</td></tr>`).join('')}
//         </tbody>
//       </table>
//       <div class="summary">
//         <div><strong>Total:</strong> ${reportData.total} / ${reportData.maxTotal}</div>
//         <div><strong>Percentage:</strong> ${pct}%</div>
//         <div><strong>Result:</strong> ${pct >= 33 ? 'PASS' : 'FAIL'}</div>
//       </div>
//       <script>window.onload=()=>{window.print()}<\/script>
//       </body></html>
//     `)
//     w.document.close()
//   }

//   return (
//     <div style={styles.card}>
//       <h2 style={styles.sectionTitle}>📄 Report Card</h2>
//       <div style={styles.filterRow}>
//         <div style={styles.filterGroup}>
//           <label style={styles.label}>Class</label>
//           <select style={styles.input} value={selClass} onChange={e=>loadStudents(e.target.value)}>
//             <option value="">Select Class</option>
//             {classes.map((c,i)=><option key={i} value={c.class_id}>Class {c.classes?.name}</option>)}
//           </select>
//         </div>
//         <div style={styles.filterGroup}>
//           <label style={styles.label}>Student</label>
//           <select style={styles.input} value={selStudent} onChange={e=>setSelStudent(e.target.value)}>
//             <option value="">Select Student</option>
//             {students.map(s=><option key={s.id} value={s.id}>{s.profiles?.name} ({s.roll_no})</option>)}
//           </select>
//         </div>
//         <div style={styles.filterGroup}>
//           <label style={styles.label}>Exam</label>
//           <select style={styles.input} value={selExam} onChange={e=>setSelExam(e.target.value)}>
//             <option value="">Select Exam</option>
//             {exams.map(e=><option key={e.id} value={e.id}>{e.exam_name}</option>)}
//           </select>
//         </div>
//         <button style={styles.findBtn} onClick={generateReport} disabled={loading}>{loading?'Loading...':'📊 Generate'}</button>
//       </div>

//       {reportData && (
//         <div style={{ marginTop:'20px' }}>
//           <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'12px' }}>
//             <h3 style={{ margin:0 }}>{reportData.student?.profiles?.name} — {reportData.exam?.exam_name}</h3>
//             <button style={{...styles.saveBtn, background:'#6366f1'}} onClick={printReport}>🖨️ Print</button>
//           </div>
//           <table style={styles.table}>
//             <thead><tr>
//               <th style={styles.th}>Subject</th>
//               <th style={styles.th}>Obtained</th>
//               <th style={styles.th}>Total</th>
//               <th style={styles.th}>Grade</th>
//             </tr></thead>
//             <tbody>
//               {reportData.marks.map(m=>(
//                 <tr key={m.id}>
//                   <td style={styles.td}>{m.subjects?.name||'—'}</td>
//                   <td style={styles.td}>{m.obtained_marks}</td>
//                   <td style={styles.td}>{m.total_marks}</td>
//                   <td style={styles.td}>{m.grade||'—'}</td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//           <div style={{ display:'flex', gap:'20px', padding:'14px', background:'#f8fafc', borderRadius:'8px', marginTop:'12px' }}>
//             <span><strong>Total:</strong> {reportData.total}/{reportData.maxTotal}</span>
//             <span><strong>%:</strong> {reportData.maxTotal>0?Math.round((reportData.total/reportData.maxTotal)*100):0}%</span>
//             <span style={{ color: reportData.maxTotal>0&&(reportData.total/reportData.maxTotal)>=0.33?'#16a34a':'#ef4444', fontWeight:'700' }}>
//               {reportData.maxTotal>0&&(reportData.total/reportData.maxTotal)>=0.33?'✅ PASS':'❌ FAIL'}
//             </span>
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }

// const styles = {
//   title: { fontSize: '24px', fontWeight: '700', color: '#1a1a2e', marginBottom: '16px' },
//   tabs: { display: 'flex', gap: '4px', borderBottom: '1px solid #e5e7eb', marginBottom: '24px' },
//   tab: { padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', transition: 'all 0.2s' },
//   card: { backgroundColor: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: '20px' },
//   filterRow: { display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' },
//   filterGroup: { display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '160px' },
//   label: { fontSize: '13px', fontWeight: '600', color: '#374151' },
//   input: { padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', outline: 'none' },
//   findBtn: { padding: '10px 20px', backgroundColor: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', height: '40px' },
//   sectionTitle: { fontSize: '16px', fontWeight: '700', color: '#1a1a2e', marginBottom: '16px' },
//   table: { width: '100%', borderCollapse: 'collapse' },
//   th: { textAlign: 'left', fontSize: '13px', color: '#6b7280', fontWeight: '600', padding: '10px 12px', borderBottom: '2px solid #f3f4f6' },
//   td: { padding: '12px', fontSize: '14px', color: '#374151', borderBottom: '1px solid #f9fafb' },
//   emptyCell: { padding: '24px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' },
//   nameCell: { display: 'flex', alignItems: 'center', gap: '10px' },
//   avatar: { width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#4f46e5', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700' },
//   markInput: { padding: '8px', borderRadius: '6px', border: '1px solid #e5e7eb', fontSize: '14px', width: '80px', outline: 'none' },
//   gradeSelect: { padding: '8px', borderRadius: '6px', border: '1px solid #e5e7eb', fontSize: '14px', outline: 'none' },
//   saveBtn: { marginTop: '16px', padding: '10px 24px', backgroundColor: '#22c55e', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
// }


import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { getSchoolSettings } from '../../lib/schoolSettings'

export default function TeacherMarks() {
  const { profile } = useAuth()
  const [classes, setClasses] = useState([])
  const [sections, setSections] = useState([])
  const [subjects, setSubjects] = useState([])
  const [exams, setExams] = useState([])
  const [students, setStudents] = useState([])
  const [marks, setMarks] = useState({})
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedSection, setSelectedSection] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedExam, setSelectedExam] = useState('')
  const [activeTab, setActiveTab] = useState('Enter Marks')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    supabase.from('classes').select('*').then(({ data }) => setClasses(data || []))
    supabase.from('subjects').select('*').eq('teacher_id', profile.id).then(({ data }) => setSubjects(data || []))
  }, [profile.id])

  const handleClassChange = async (classId) => {
    setSelectedClass(classId); setSelectedSection(''); setSelectedExam(''); setStudents([])
    const [secRes, examRes] = await Promise.all([
      supabase.from('sections').select('*').eq('class_id', classId),
      supabase.from('exams').select('*').eq('class_id', classId).order('exam_date', { ascending: false }),
    ])
    setSections(secRes.data || [])
    setExams(examRes.data || [])
  }

  const handleLoad = async () => {
    if (!selectedClass || !selectedExam) { setMessage('⚠️ Select class and exam'); return }
    setLoading(true); setMessage('')

    let query = supabase.from('students').select('id, roll_no, profiles(name, avatar_url)').eq('class_id', selectedClass)
    if (selectedSection) query = query.eq('section_id', selectedSection)
    const { data: studentData } = await query
    setStudents(studentData || [])

    const { data: existingMarks } = await supabase.from('marks').select('*').eq('exam_id', selectedExam).in('student_id', (studentData || []).map(s => s.id))
    const marksMap = {}
    existingMarks?.forEach(m => marksMap[m.student_id] = { obtained: m.obtained_marks, total: m.total_marks, grade: m.grade })
    setMarks(marksMap); setLoading(false)
  }

  const handleSave = async () => {
    if (students.length === 0) return
    setSaving(true); setMessage('')
    const records = students.map(s => ({
      student_id: s.id,
      exam_id: selectedExam || null,
      subject_id: selectedSubject || null,
      class_id: selectedClass || null,
      teacher_id: profile.id,
      obtained_marks: parseFloat(marks[s.id]?.obtained) || 0,
      total_marks: parseFloat(marks[s.id]?.total) || 100,
      grade: marks[s.id]?.grade || '',
    }))

    const { error } = await supabase.from('marks').upsert(records, { onConflict: 'student_id,exam_id' })
    setMessage(error ? '❌ Error saving marks' : '✅ Marks saved successfully!')
    setSaving(false)
    setTimeout(() => setMessage(''), 3000)
  }

  const updateMark = (studentId, field, value) => {
    setMarks(prev => ({ ...prev, [studentId]: { ...prev[studentId], [field]: value } }))
  }

  return (
    <div style={styles.container}>
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Academic Grading</h1>
          <p style={styles.pageSubtitle}>Input student marks and generate printable report cards</p>
        </div>
      </div>

      <div style={styles.tabBar}>
        {['Enter Marks', 'Report Card'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            ...styles.tab,
            color: activeTab === tab ? '#4f46e5' : '#64748b',
            borderBottom: activeTab === tab ? '3px solid #4f46e5' : '3px solid transparent',
            fontWeight: activeTab === tab ? '700' : '500',
          }}>{tab}</button>
        ))}
      </div>

      {activeTab === 'Report Card' ? (
        <TeacherReportCard profile={profile} />
      ) : (
        <div style={styles.fadeIn}>
          <div style={styles.card}>
            <div style={styles.filterRow}>
              <div style={styles.filterGroup}><label style={styles.label}>Class *</label>
                <select style={styles.input} value={selectedClass} onChange={e => handleClassChange(e.target.value)}>
                  <option value="">-- Choose --</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div style={styles.filterGroup}><label style={styles.label}>Section</label>
                <select style={styles.input} value={selectedSection} onChange={e => setSelectedSection(e.target.value)}>
                  <option value="">-- All --</option>
                  {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div style={styles.filterGroup}><label style={styles.label}>Subject</label>
                <select style={styles.input} value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}>
                  <option value="">-- Choose --</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div style={styles.filterGroup}><label style={styles.label}>Exam *</label>
                <select style={styles.input} value={selectedExam} onChange={e => setSelectedExam(e.target.value)}>
                  <option value="">-- Choose --</option>
                  {exams.map(e => <option key={e.id} value={e.id}>{e.exam_name}</option>)}
                </select>
              </div>
              <button style={styles.findBtn} onClick={handleLoad}>🔍 Fetch Roster</button>
            </div>
          </div>

          {students.length > 0 && (
            <div style={{ ...styles.card, marginTop: '24px' }}>
              <div style={styles.tableHeader}>
                 <h2 style={styles.sectionTitle}>Mark Entry — {exams.find(e => e.id === selectedExam)?.exam_name}</h2>
                 <span style={styles.countBadge}>{students.length} Students</span>
              </div>
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={{ ...styles.th, width: '60px', textAlign: 'center' }}>#</th>
                      <th style={styles.th}>Student Name</th>
                      <th style={styles.th}>Obtained</th>
                      <th style={styles.th}>Total</th>
                      <th style={{ ...styles.th, textAlign: 'right', paddingRight: '40px' }}>Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={5} style={styles.emptyCell}>⌛ Loading student data...</td></tr>
                    ) : students.map((s, i) => (
                      <tr key={s.id} style={styles.tr}>
                        <td style={{ ...styles.td, textAlign: 'center', color: '#94a3b8', fontWeight: '600' }}>{i + 1}</td>
                        <td style={styles.td}>
                          <div style={styles.nameCell}>
                            {s.profiles?.avatar_url ? (
                              <img src={s.profiles.avatar_url} style={styles.avatar} alt="P" />
                            ) : (
                              <div style={{ ...styles.avatar, backgroundColor: ['#4f46e5', '#10b981', '#f59e0b', '#ef4444'][i % 4] }}>
                                {s.profiles?.name?.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                               <p style={{ margin: 0, fontWeight: '700', color: '#1e293b' }}>{s.profiles?.name}</p>
                               <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>Roll: {s.roll_no}</p>
                            </div>
                          </div>
                        </td>
                        <td style={styles.td}>
                          <input style={styles.markInput} type="number" 
                            value={marks[s.id]?.obtained || ''}
                            onChange={e => updateMark(s.id, 'obtained', e.target.value)}
                            placeholder="0" />
                        </td>
                        <td style={styles.td}>
                          <input style={styles.markInput} type="number"
                            value={marks[s.id]?.total || ''}
                            onChange={e => updateMark(s.id, 'total', e.target.value)}
                            placeholder="100" />
                        </td>
                        <td style={{ ...styles.td, textAlign: 'right', paddingRight: '20px' }}>
                          <select style={styles.gradeSelect}
                            value={marks[s.id]?.grade || ''}
                            onChange={e => updateMark(s.id, 'grade', e.target.value)}>
                            <option value="">Grade</option>
                            {['A+','A','B+','B','C+','C','D','F'].map(g => <option key={g} value={g}>{g}</option>)}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={styles.footerAction}>
                {message && <div style={{ ...styles.alert, backgroundColor: message.startsWith('✅') ? '#f0fdf4' : '#fef2f2', color: message.startsWith('✅') ? '#16a34a' : '#dc2626' }}>{message}</div>}
                <button style={styles.saveBtn} onClick={handleSave} disabled={saving}>
                  {saving ? '⌛ Saving...' : '💾 Submit Results'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function TeacherReportCard({ profile }) {
  const [classes, setClasses] = useState([]); const [students, setStudents] = useState([]); const [exams, setExams] = useState([])
  const [selClass, setSelClass] = useState(''); const [selStudent, setSelStudent] = useState(''); const [selExam, setSelExam] = useState('')
  const [reportData, setReportData] = useState(null); const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.from('teacher_classes').select('class_id, classes(name)').eq('teacher_id', profile.id).then(({ data }) => setClasses(data || []))
  }, [])

  const loadStudents = async (classId) => {
    setSelClass(classId); setSelStudent(''); setReportData(null)
    const { data } = await supabase.from('students').select('id, roll_no, profiles(name)').eq('class_id', parseInt(classId))
    setStudents(data || [])
    const { data: examData } = await supabase.from('exams').select('*').eq('class_id', parseInt(classId))
    setExams(examData || [])
  }

  const generateReport = async () => {
    if (!selStudent || !selExam) { alert('Select student and exam'); return }
    setLoading(true)
    const student = students.find(s => s.id === selStudent); const exam = exams.find(e => e.id === selExam)
    const { data: marksData } = await supabase.from('marks').select('*, subjects(name)').eq('student_id', selStudent).eq('exam_id', selExam)
    const total = marksData?.reduce((a, m) => a + (m.obtained_marks || 0), 0)
    const maxTotal = marksData?.reduce((a, m) => a + (m.total_marks || 0), 0)
    setReportData({ student, exam, marks: marksData || [], total, maxTotal }); setLoading(false)
  }

  const printReport = async () => {
    if (!reportData) return
    const school = await getSchoolSettings()
    const pct = reportData.maxTotal > 0 ? Math.round((reportData.total / reportData.maxTotal) * 100) : 0
    const w = window.open('', '_blank')
    w.document.write(`
      <html><head><title>Report Card - ${reportData.student?.profiles?.name}</title><style>
        body{font-family: 'Segoe UI', sans-serif; padding:50px; color:#1e293b}
        .header{text-align:center; border-bottom:4px solid #1e3a8a; padding-bottom:20px; margin-bottom:30px}
        h1{margin:0; font-size:28px; color:#1e3a8a}
        h3{margin:5px 0 0; color:#64748b; font-size:14px; text-transform:uppercase; letter-spacing:1px}
        .meta{display:flex; justify-content:space-between; background:#f8fafc; padding:15px; border-radius:8px; margin-bottom:20px; font-weight:700}
        table{width:100%; border-collapse:collapse; margin-bottom:30px}
        th{background:#f1f5f9; padding:12px; text-align:left; font-size:12px; text-transform:uppercase}
        td{padding:12px; border-bottom:1px solid #f1f5f9; font-size:14px}
        .summary{display:grid; grid-template-columns:1fr 1fr 1fr; gap:20px; background:#eff6ff; padding:20px; border-radius:12px; text-align:center; border:1px solid #bfdbfe}
        .summary div{font-weight:800; font-size:18px; color:#1e40af}
      </style></head><body>
      <div class="header"><h1>${school?.school_name || 'Academic Institution'}</h1><h3>${reportData.exam?.exam_name} Official Report</h3></div>
      <div class="meta"><span>STUDENT: ${reportData.student?.profiles?.name}</span><span>ROLL NO: ${reportData.student?.roll_no}</span></div>
      <table><thead><tr><th>Subject</th><th>Marks Obtained</th><th>Total Marks</th><th>Grade</th></tr></thead>
        <tbody>${reportData.marks.map(m => `<tr><td>${m.subjects?.name||'General'}</td><td>${m.obtained_marks}</td><td>${m.total_marks}</td><td><strong>${m.grade||'N/A'}</strong></td></tr>`).join('')}</tbody>
      </table>
      <div class="summary"><div>Total: ${reportData.total} / ${reportData.maxTotal}</div><div>Percentage: ${pct}%</div><div>Status: ${pct >= 33 ? 'PASS' : 'FAIL'}</div></div>
      </body></html>
    `)
    w.document.close()
  }

  return (
    <div style={styles.fadeIn}>
       <div style={styles.card}>
          <h2 style={styles.sectionTitle}>📄 Report Card Generation</h2>
          <div style={styles.filterRow}>
            <div style={styles.filterGroup}><label style={styles.label}>Class</label>
              <select style={styles.input} value={selClass} onChange={e=>loadStudents(e.target.value)}>
                <option value="">Select Class</option>
                {classes.map((c,i)=><option key={i} value={c.class_id}>Class {c.classes?.name}</option>)}
              </select>
            </div>
            <div style={styles.filterGroup}><label style={styles.label}>Student</label>
              <select style={styles.input} value={selStudent} onChange={e=>setSelStudent(e.target.value)}>
                <option value="">Select Student</option>
                {students.map(s=><option key={s.id} value={s.id}>{s.profiles?.name}</option>)}
              </select>
            </div>
            <div style={styles.filterGroup}><label style={styles.label}>Exam</label>
              <select style={styles.input} value={selExam} onChange={e=>setSelExam(e.target.value)}>
                <option value="">Select Exam</option>
                {exams.map(e=><option key={e.id} value={e.id}>{e.exam_name}</option>)}
              </select>
            </div>
            <button style={{...styles.findBtn, backgroundColor: '#0f172a'}} onClick={generateReport} disabled={loading}>{loading?'⌛':'📊 Preview Report'}</button>
          </div>
       </div>

       {reportData && (
          <div style={{ ...styles.card, marginTop: '24px', animation: 'slideIn 0.4s ease-out' }}>
             <div style={{ display:'flex', justifyContent:'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin:0, fontWeight: '800' }}>Preview for {reportData.student?.profiles?.name}</h3>
                <button style={styles.printBtn} onClick={printReport}>🖨️ Print Final Report</button>
             </div>
             <div style={styles.tableWrapper}>
                <table style={styles.table}>
                   <thead><tr><th style={styles.th}>Subject</th><th style={styles.th}>Obtained</th><th style={styles.th}>Total</th><th style={styles.th}>Grade</th></tr></thead>
                   <tbody>
                      {reportData.marks.map(m=>(
                        <tr key={m.id} style={styles.tr}>
                          <td style={styles.td}>{m.subjects?.name||'—'}</td>
                          <td style={styles.td}><strong>{m.obtained_marks}</strong></td>
                          <td style={styles.td}>{m.total_marks}</td>
                          <td style={styles.td}><span style={styles.countBadge}>{m.grade||'—'}</span></td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
             <div style={styles.summaryFooter}>
                <div style={styles.summaryStat}><span>Total Marks</span><strong>{reportData.total}/{reportData.maxTotal}</strong></div>
                <div style={styles.summaryStat}><span>Percentage</span><strong>{reportData.maxTotal>0?Math.round((reportData.total/reportData.maxTotal)*100):0}%</strong></div>
                <div style={{ ...styles.summaryStat, color: reportData.maxTotal>0&&(reportData.total/reportData.maxTotal)>=0.33?'#16a34a':'#dc2626' }}>
                   <span>Result</span><strong>{reportData.maxTotal>0&&(reportData.total/reportData.maxTotal)>=0.33?'PASSED':'FAILED'}</strong>
                </div>
             </div>
          </div>
       )}
    </div>
  )
}

const styles = {
  container: { maxWidth: '1100px', margin: '0 auto', padding: '20px', fontFamily: 'Inter, sans-serif' },
  pageHeader: { marginBottom: '32px' },
  pageTitle: { fontSize: '32px', fontWeight: '800', color: '#0f172a', margin: 0, letterSpacing: '-1px' },
  pageSubtitle: { fontSize: '15px', color: '#64748b', marginTop: '4px' },
  
  tabBar: { display: "flex", gap: "24px", marginBottom: "32px", borderBottom: "1px solid #e2e8f0" },
  tab: { padding: "12px 4px", background: "none", border: "none", cursor: "pointer", fontSize: "15px", transition: '0.2s' },

  card: { backgroundColor: "#fff", borderRadius: "20px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", border: "1px solid #f1f5f9" },
  filterRow: { display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' },
  filterGroup: { display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, minWidth: '160px' },
  label: { fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' },
  input: { padding: '12px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', backgroundColor: '#fff' },
  findBtn: { padding: '0 24px', backgroundColor: '#4f46e5', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: '700', height: '45px' },

  tableHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  sectionTitle: { fontSize: "18px", fontWeight: "800", color: "#1e2937", margin: 0 },
  countBadge: { fontSize: '11px', fontWeight: '700', color: '#6366f1', backgroundColor: '#eef2ff', padding: '4px 10px', borderRadius: '12px' },

  tableWrapper: { borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', fontSize: '12px', color: '#64748b', fontWeight: '700', padding: '16px 20px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textTransform: 'uppercase' },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '14px 20px', fontSize: '14px', color: '#1e293b' },

  nameCell: { display: 'flex', alignItems: 'center', gap: '12px' },
  avatar: { width: '36px', height: '36px', borderRadius: '50%', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '800' },
  markInput: { padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', width: '90px', outline: 'none', fontWeight: '700', color: '#1e293b' },
  gradeSelect: { padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', width: '100px', outline: 'none', fontWeight: '600' },
  
  footerAction: { marginTop: '24px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px' },
  saveBtn: { padding: '14px 32px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontSize: '15px', fontWeight: '700', boxShadow: '0 4px 10px rgba(16, 185, 129, 0.2)' },
  printBtn: { padding: '10px 20px', backgroundColor: '#4f46e5', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' },
  
  alert: { padding: '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: '600' },
  summaryFooter: { marginTop: '24px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' },
  summaryStat: { backgroundColor: '#f8fafc', padding: '20px', borderRadius: '12px', textAlign: 'center', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '4px' },
  fadeIn: { animation: 'fadeIn 0.3s ease-in' }
}