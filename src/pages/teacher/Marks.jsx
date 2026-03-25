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
//   }, [])

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
//       {activeTab === 'Report Card' && <TeacherReportCard profile={profile} />}
//       {activeTab === 'Enter Marks' && <div><div style={styles.card}>
//         <div style={styles.filterRow}>
//           <div style={styles.filterGroup}>
//             <label style={styles.label}>Class *</label>
//             <select style={styles.input} value={selectedClass} onChange={e => handleClassChange(e.target.value)}>
//               <option value="">-- Select Class --</option>
//               {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
//             </select>
//           </div>
//           <div style={styles.filterGroup}>
//             <label style={styles.label}>Section</label>
//             <select style={styles.input} value={selectedSection} onChange={e => setSelectedSection(e.target.value)}>
//               <option value="">-- All --</option>
//               {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
//             </select>
//           </div>
//           <div style={styles.filterGroup}>
//             <label style={styles.label}>Subject</label>
//             <select style={styles.input} value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}>
//               <option value="">-- Select Subject --</option>
//               {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
//             </select>
//           </div>
//           <div style={styles.filterGroup}>
//             <label style={styles.label}>Exam *</label>
//             <select style={styles.input} value={selectedExam} onChange={e => setSelectedExam(e.target.value)}>
//               <option value="">-- Select Exam --</option>
//               {exams.map(e => <option key={e.id} value={e.id}>{e.exam_name}</option>)}
//             </select>
//           </div>
//           <button style={styles.findBtn} onClick={handleLoad}>🔍 Load</button>
//         </div>
//       </div>

//       {students.length > 0 && (
//         <div style={styles.card}>
//           <h2 style={styles.sectionTitle}>Enter Marks</h2>
//           <table style={styles.table}>
//             <thead>
//               <tr>
//                 <th style={styles.th}>#</th>
//                 <th style={styles.th}>Student</th>
//                 <th style={styles.th}>Obtained</th>
//                 <th style={styles.th}>Total</th>
//                 <th style={styles.th}>Grade</th>
//               </tr>
//             </thead>
//             <tbody>
//               {loading ? (
//                 <tr><td colSpan={5} style={styles.emptyCell}>Loading...</td></tr>
//               ) : students.map((s, i) => (
//                 <tr key={s.id}>
//                   <td style={styles.td}>{i + 1}</td>
//                   <td style={styles.td}>
//                     <div style={styles.nameCell}>
//                       <div style={styles.avatar}>{s.profiles?.name?.charAt(0).toUpperCase()}</div>
//                       {s.profiles?.name}
//                     </div>
//                   </td>
//                   <td style={styles.td}>
//                     <input style={styles.markInput} type="number" min="0"
//                       value={marks[s.id]?.obtained || ''}
//                       onChange={e => updateMark(s.id, 'obtained', e.target.value)}
//                       placeholder="0" />
//                   </td>
//                   <td style={styles.td}>
//                     <input style={styles.markInput} type="number" min="0"
//                       value={marks[s.id]?.total || ''}
//                       onChange={e => updateMark(s.id, 'total', e.target.value)}
//                       placeholder="100" />
//                   </td>
//                   <td style={styles.td}>
//                     <select style={styles.gradeSelect}
//                       value={marks[s.id]?.grade || ''}
//                       onChange={e => updateMark(s.id, 'grade', e.target.value)}>
//                       <option value="">--</option>
//                       {['A+','A','B+','B','C+','C','D','F'].map(g => <option key={g} value={g}>{g}</option>)}
//                     </select>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//           {message && <p style={{ color: message.startsWith('✅') ? '#22c55e' : '#ef4444', fontSize: '14px', marginTop: '12px' }}>{message}</p>}
//           <button style={styles.saveBtn} onClick={handleSave} disabled={saving}>
//             {saving ? 'Saving...' : '💾 Save Marks'}
//           </button>
//         </div>
//       )}
//     </div></div>
//   )
// }

// const styles = {
//   title: { fontSize: '24px', fontWeight: '700', color: '#1a1a2e', marginBottom: '24px' },
//   card: { backgroundColor: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: '20px' },
//   filterRow: { display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' },
//   filterGroup: { display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '150px' },
//   label: { fontSize: '13px', fontWeight: '600', color: '#374151' },
//   input: { padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', outline: 'none' },
//   findBtn: { padding: '10px 20px', backgroundColor: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', height: '42px' },
//   sectionTitle: { fontSize: '16px', fontWeight: '700', color: '#1a1a2e', marginBottom: '16px' },
//   table: { width: '100%', borderCollapse: 'collapse' },
//   th: { textAlign: 'left', fontSize: '13px', color: '#6b7280', fontWeight: '600', padding: '10px 12px', borderBottom: '2px solid #f3f4f6' },
//   td: { padding: '10px 12px', fontSize: '14px', color: '#374151', borderBottom: '1px solid #f9fafb' },
//   emptyCell: { padding: '24px', textAlign: 'center', color: '#9ca3af' },
//   nameCell: { display: 'flex', alignItems: 'center', gap: '10px' },
//   avatar: { width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#4f46e5', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700' },
//   markInput: { width: '70px', padding: '6px 8px', borderRadius: '6px', border: '1px solid #e5e7eb', fontSize: '14px', outline: 'none', textAlign: 'center' },
//   gradeSelect: { padding: '6px 8px', borderRadius: '6px', border: '1px solid #e5e7eb', fontSize: '14px', outline: 'none' },
//   saveBtn: { marginTop: '16px', padding: '12px 24px', backgroundColor: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
//   tabs: { display: 'flex', gap: '4px', borderBottom: '1px solid #e5e7eb', marginBottom: '24px' },
//   tab: { padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', transition: 'all 0.2s' },
// }

// function TeacherReportCard({ profile }) {
//   const [classes, setClasses] = useState([])
//   const [students, setStudents] = useState([])
//   const [exams, setExams] = useState([])
//   const [selectedClass, setSelectedClass] = useState('')
//   const [selectedStudent, setSelectedStudent] = useState('')
//   const [selectedExam, setSelectedExam] = useState('')
//   const [reportData, setReportData] = useState(null)
//   const [loading, setLoading] = useState(false)

//   useEffect(() => {
//     const fetchClasses = async () => {
//       const { data } = await supabase.from('teacher_classes').select('class_id, classes(id, name)').eq('teacher_id', profile.id)
//       const unique = {}
//       data?.forEach(a => { if (!unique[a.class_id]) unique[a.class_id] = a.classes })
//       setClasses(Object.values(unique))
//     }
//     fetchClasses()
//   }, [])

//   const handleClassChange = async (classId) => {
//     setSelectedClass(classId)
//     setSelectedStudent('')
//     setSelectedExam('')
//     setReportData(null)
//     const [{ data: studs }, { data: exs }] = await Promise.all([
//       supabase.from('students').select('id, roll_no, profiles(name)').eq('class_id', classId),
//       supabase.from('exams').select('*').eq('class_id', classId).order('exam_date', { ascending: false }),
//     ])
//     setStudents(studs || [])
//     setExams(exs || [])
//   }

//   const handleGenerate = async () => {
//     if (!selectedStudent || !selectedExam) return
//     setLoading(true)
//     const student = students.find(s => s.id === selectedStudent)
//     const exam = exams.find(e => e.id === selectedExam)
//     const { data: marks } = await supabase.from('marks').select('*, subjects(name)').eq('student_id', selectedStudent).eq('exam_id', selectedExam)
//     const { data: attData } = await supabase.from('attendance').select('is_present, status').eq('student_id', selectedStudent)
//     const total = attData?.length || 0
//     const present = attData?.filter(a => a.is_present || a.status === 'present').length || 0
//     const attPct = total > 0 ? Math.round((present / total) * 100) : 0
//     setReportData({ student, exam, marks: marks || [], attPct, present, total })
//     setLoading(false)
//   }

//   const handleDownload = () => {
//     if (!reportData) return
//     const { student, exam, marks, attPct, present, total } = reportData
//     const totalObt = marks.reduce((s, m) => s + (m.obtained_marks || 0), 0)
//     const totalMax = marks.reduce((s, m) => s + (m.total_marks || 100), 0)
//     const pct = totalMax > 0 ? Math.round((totalObt / totalMax) * 100) : 0
//     const grade = pct >= 75 ? 'A' : pct >= 60 ? 'B' : pct >= 50 ? 'C' : pct >= 35 ? 'D' : 'F'
//     const result = pct >= 35 ? 'PASS' : 'FAIL'
//     const rows = marks.map((m, i) => {
//       const p = m.total_marks > 0 ? Math.round((m.obtained_marks / m.total_marks) * 100) : 0
//       const g = m.grade || (p >= 75 ? 'A' : p >= 60 ? 'B' : p >= 50 ? 'C' : p >= 35 ? 'D' : 'F')
//       return '<tr><td>' + (i+1) + '</td><td>' + (m.subjects?.name || '—') + '</td><td><strong>' + m.obtained_marks + '</strong></td><td>' + m.total_marks + '</td><td>' + p + '%</td><td><strong>' + g + '</strong></td></tr>'
//     }).join('')
//     const html = '<html><head><title>Report Card</title><style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:Arial,sans-serif;padding:40px;color:#1a1a2e;}.header{text-align:center;border-bottom:3px solid #4f46e5;padding-bottom:20px;margin-bottom:24px;}.school-name{font-size:28px;font-weight:800;color:#4f46e5;}table{width:100%;border-collapse:collapse;margin-bottom:24px;}th{background:#4f46e5;color:white;padding:10px 12px;text-align:left;font-size:13px;}td{padding:10px 12px;border-bottom:1px solid #f3f4f6;font-size:13px;}tr:nth-child(even){background:#f9fafb;}.summary{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px;}.sc{text-align:center;padding:16px;border-radius:8px;}.sv{font-size:24px;font-weight:800;}.sl{font-size:12px;color:#6b7280;margin-top:4px;}.info{display:grid;grid-template-columns:1fr 1fr;gap:12px;background:#f9fafb;padding:16px;border-radius:8px;margin-bottom:24px;}.il{font-size:11px;color:#9ca3af;text-transform:uppercase;font-weight:600;}.iv{font-size:14px;font-weight:700;}.sign-row{display:grid;grid-template-columns:1fr 1fr 1fr;margin-top:40px;text-align:center;}.sign-line{border-top:1px solid #374151;padding-top:8px;margin:0 20px;font-size:12px;color:#6b7280;}.footer{text-align:center;margin-top:40px;padding-top:20px;border-top:1px solid #e5e7eb;color:#9ca3af;font-size:12px;}</style></head><body>'
//       + '<div class="header"><div class="school-name">🍊 School ERP System</div><div style="color:#6b7280;font-size:13px;letter-spacing:2px;margin-top:4px;">STUDENT REPORT CARD</div></div>'
//       + '<div class="info"><div><div class="il">Student Name</div><div class="iv">' + (student?.profiles?.name || '—') + '</div></div><div><div class="il">Roll Number</div><div class="iv">' + (student?.roll_no || '—') + '</div></div><div><div class="il">Exam</div><div class="iv">' + (exam?.exam_name || '—') + '</div></div><div><div class="il">Session</div><div class="iv">' + (exam?.session || '—') + '</div></div></div>'
//       + '<table><thead><tr><th>#</th><th>Subject</th><th>Obtained</th><th>Total</th><th>%</th><th>Grade</th></tr></thead><tbody>' + rows + '</tbody></table>'
//       + '<div class="summary"><div class="sc" style="background:#dbeafe"><div class="sv" style="color:#1d4ed8">' + totalObt + '/' + totalMax + '</div><div class="sl">Total Marks</div></div><div class="sc" style="background:#dcfce7"><div class="sv" style="color:#16a34a">' + pct + '%</div><div class="sl">Percentage</div></div><div class="sc" style="background:#ede9fe"><div class="sv" style="color:#4f46e5">' + grade + '</div><div class="sl">Grade</div></div><div class="sc" style="background:' + (result==='PASS'?'#dcfce7':'#fee2e2') + '"><div class="sv" style="color:' + (result==='PASS'?'#16a34a':'#dc2626') + '">' + result + '</div><div class="sl">Result</div></div></div>'
//       + '<div style="background:#f9fafb;padding:12px 16px;border-radius:8px;font-size:14px;margin-bottom:24px;"><strong>Attendance:</strong> ' + present + '/' + total + ' days | <strong>' + attPct + '%</strong>' + (attPct < 75 ? ' <span style="color:#ef4444">⚠️ Attendance Shortage</span>' : '') + '</div>'
//       + '<div class="sign-row"><div class="sign-line">Class Teacher</div><div class="sign-line">Principal</div><div class="sign-line">Parent / Guardian</div></div>'
//       + '<div class="footer">This is a computer generated report card. — School ERP System</div></body></html>'
//     const win = window.open('', '_blank')
//     win.document.write(html)
//     win.document.close()
//     win.print()
//   }

//   const rStyles = {
//     card: { backgroundColor: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: '20px' },
//     filterRow: { display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap', backgroundColor: '#f9fafb', padding: '16px', borderRadius: '10px', marginBottom: '20px' },
//     filterGroup: { display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '160px' },
//     label: { fontSize: '13px', fontWeight: '600', color: '#374151' },
//     input: { padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', outline: 'none' },
//     findBtn: { padding: '10px 20px', backgroundColor: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', height: '42px' },
//     table: { width: '100%', borderCollapse: 'collapse' },
//     th: { textAlign: 'left', fontSize: '13px', color: '#6b7280', fontWeight: '600', padding: '10px 12px', borderBottom: '2px solid #f3f4f6' },
//     td: { padding: '12px', fontSize: '14px', color: '#374151', borderBottom: '1px solid #f9fafb' },
//   }

//   return (
//     <div>
//       <div style={rStyles.filterRow}>
//         <div style={rStyles.filterGroup}>
//           <label style={rStyles.label}>Class *</label>
//           <select style={rStyles.input} value={selectedClass} onChange={e => handleClassChange(e.target.value)}>
//             <option value="">-- Select Class --</option>
//             {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
//           </select>
//         </div>
//         <div style={rStyles.filterGroup}>
//           <label style={rStyles.label}>Student *</label>
//           <select style={rStyles.input} value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)} disabled={!selectedClass}>
//             <option value="">-- Select Student --</option>
//             {students.map(s => <option key={s.id} value={s.id}>{s.profiles?.name} ({s.roll_no})</option>)}
//           </select>
//         </div>
//         <div style={rStyles.filterGroup}>
//           <label style={rStyles.label}>Exam *</label>
//           <select style={rStyles.input} value={selectedExam} onChange={e => setSelectedExam(e.target.value)} disabled={!selectedClass}>
//             <option value="">-- Select Exam --</option>
//             {exams.map(e => <option key={e.id} value={e.id}>{e.exam_name}</option>)}
//           </select>
//         </div>
//         <button style={rStyles.findBtn} onClick={handleGenerate} disabled={loading || !selectedStudent || !selectedExam}>
//           {loading ? 'Loading...' : '🔍 Generate'}
//         </button>
//       </div>

//       {reportData && (
//         <div style={rStyles.card}>
//           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
//             <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1a1a2e' }}>Report Card — {reportData.student?.profiles?.name}</h3>
//             <button style={{ ...rStyles.findBtn, backgroundColor: '#22c55e' }} onClick={handleDownload}>📥 Download / Print PDF</button>
//           </div>
//           <div style={{ backgroundColor: '#fff', border: '2px solid #e5e7eb', borderRadius: '12px', padding: '24px' }}>
//             <div style={{ textAlign: 'center', borderBottom: '3px solid #4f46e5', paddingBottom: '16px', marginBottom: '20px' }}>
//               <p style={{ fontSize: '22px', fontWeight: '800', color: '#4f46e5' }}>🍊 School ERP System</p>
//               <p style={{ color: '#6b7280', fontSize: '13px', letterSpacing: '2px' }}>STUDENT REPORT CARD</p>
//             </div>
//             <table style={rStyles.table}>
//               <thead><tr><th style={rStyles.th}>#</th><th style={rStyles.th}>Subject</th><th style={rStyles.th}>Obtained</th><th style={rStyles.th}>Total</th><th style={rStyles.th}>%</th><th style={rStyles.th}>Grade</th></tr></thead>
//               <tbody>
//                 {reportData.marks.map((m, i) => {
//                   const p = m.total_marks > 0 ? Math.round((m.obtained_marks / m.total_marks) * 100) : 0
//                   const g = m.grade || (p >= 75 ? 'A' : p >= 60 ? 'B' : p >= 50 ? 'C' : p >= 35 ? 'D' : 'F')
//                   return <tr key={m.id}><td style={rStyles.td}>{i+1}</td><td style={rStyles.td}>{m.subjects?.name || '—'}</td><td style={rStyles.td}><strong>{m.obtained_marks}</strong></td><td style={rStyles.td}>{m.total_marks}</td><td style={rStyles.td}>{p}%</td><td style={rStyles.td}><span style={{ backgroundColor: '#dcfce7', color: '#16a34a', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: '700' }}>{g}</span></td></tr>
//                 })}
//               </tbody>
//             </table>
//             {(() => {
//               const totalObt = reportData.marks.reduce((s, m) => s + (m.obtained_marks || 0), 0)
//               const totalMax = reportData.marks.reduce((s, m) => s + (m.total_marks || 100), 0)
//               const pct = totalMax > 0 ? Math.round((totalObt / totalMax) * 100) : 0
//               const grade = pct >= 75 ? 'A' : pct >= 60 ? 'B' : pct >= 50 ? 'C' : pct >= 35 ? 'D' : 'F'
//               const result = pct >= 35 ? 'PASS' : 'FAIL'
//               return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginTop: '16px' }}>
//                 {[{l:'Total Marks',v:`${totalObt}/${totalMax}`,bg:'#dbeafe',c:'#1d4ed8'},{l:'Percentage',v:`${pct}%`,bg:'#dcfce7',c:'#16a34a'},{l:'Grade',v:grade,bg:'#ede9fe',c:'#4f46e5'},{l:'Result',v:result,bg:result==='PASS'?'#dcfce7':'#fee2e2',c:result==='PASS'?'#16a34a':'#dc2626'}].map(s=>(
//                   <div key={s.l} style={{backgroundColor:s.bg,borderRadius:'8px',padding:'16px',textAlign:'center'}}>
//                     <p style={{fontSize:'22px',fontWeight:'800',color:s.c,margin:0}}>{s.v}</p>
//                     <p style={{fontSize:'12px',color:'#6b7280',margin:'4px 0 0'}}>{s.l}</p>
//                   </div>
//                 ))}
//               </div>
//             })()}
//             <div style={{ backgroundColor: '#f9fafb', padding: '12px 16px', borderRadius: '8px', marginTop: '16px', fontSize: '14px' }}>
//               <strong>Attendance:</strong> {reportData.present}/{reportData.total} days | <strong>{reportData.attPct}%</strong>
//               {reportData.attPct < 75 && <span style={{ color: '#ef4444', marginLeft: '12px' }}>⚠️ Attendance Shortage</span>}
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }






import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

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
    setSelectedClass(classId)
    setSelectedSection('')
    setSelectedExam('')
    setStudents([])
    const [secRes, examRes] = await Promise.all([
      supabase.from('sections').select('*').eq('class_id', classId),
      supabase.from('exams').select('*').eq('class_id', classId).order('exam_date', { ascending: false }),
    ])
    setSections(secRes.data || [])
    setExams(examRes.data || [])
  }

  const handleLoad = async () => {
    if (!selectedClass || !selectedExam) { setMessage('Please select class and exam'); return }
    setLoading(true)
    setMessage('')

    let query = supabase.from('students').select('id, roll_no, profiles(name)').eq('class_id', selectedClass)
    if (selectedSection) query = query.eq('section_id', selectedSection)
    const { data: studentData } = await query
    setStudents(studentData || [])

    const { data: existingMarks } = await supabase
      .from('marks')
      .select('*')
      .eq('exam_id', selectedExam)
      .in('student_id', (studentData || []).map(s => s.id))

    const marksMap = {}
    existingMarks?.forEach(m => marksMap[m.student_id] = { obtained: m.obtained_marks, total: m.total_marks, grade: m.grade })
    setMarks(marksMap)
    setLoading(false)
  }

  const handleSave = async () => {
    if (students.length === 0) return
    setSaving(true)
    setMessage('')

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
  }

  const updateMark = (studentId, field, value) => {
    setMarks(prev => ({ ...prev, [studentId]: { ...prev[studentId], [field]: value } }))
  }

  return (
    <div>
      <h1 style={styles.title}>Marks</h1>
      <div style={styles.tabs}>
        {['Enter Marks', 'Report Card'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            ...styles.tab,
            borderBottom: activeTab === tab ? '2px solid #4f46e5' : '2px solid transparent',
            color: activeTab === tab ? '#4f46e5' : '#6b7280',
            fontWeight: activeTab === tab ? '600' : '400',
          }}>{tab}</button>
        ))}
      </div>

      {activeTab === 'Report Card' ? (
        <TeacherReportCard profile={profile} />
      ) : (
        <div>
          <div style={styles.card}>
            <div style={styles.filterRow}>
              <div style={styles.filterGroup}>
                <label style={styles.label}>Class *</label>
                <select style={styles.input} value={selectedClass} onChange={e => handleClassChange(e.target.value)}>
                  <option value="">-- Select Class --</option>
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
              <div style={styles.filterGroup}>
                <label style={styles.label}>Subject</label>
                <select style={styles.input} value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}>
                  <option value="">-- Select Subject --</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div style={styles.filterGroup}>
                <label style={styles.label}>Exam *</label>
                <select style={styles.input} value={selectedExam} onChange={e => setSelectedExam(e.target.value)}>
                  <option value="">-- Select Exam --</option>
                  {exams.map(e => <option key={e.id} value={e.id}>{e.exam_name}</option>)}
                </select>
              </div>
              <button style={styles.findBtn} onClick={handleLoad}>🔍 Load</button>
            </div>
          </div>

          {students.length > 0 && (
            <div style={styles.card}>
              <h2 style={styles.sectionTitle}>Enter Marks</h2>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>#</th>
                    <th style={styles.th}>Student</th>
                    <th style={styles.th}>Obtained</th>
                    <th style={styles.th}>Total</th>
                    <th style={styles.th}>Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={5} style={styles.emptyCell}>Loading...</td></tr>
                  ) : students.map((s, i) => (
                    <tr key={s.id}>
                      <td style={styles.td}>{i + 1}</td>
                      <td style={styles.td}>
                        <div style={styles.nameCell}>
                          <div style={styles.avatar}>{s.profiles?.name?.charAt(0).toUpperCase()}</div>
                          {s.profiles?.name}
                        </div>
                      </td>
                      <td style={styles.td}>
                        <input style={styles.markInput} type="number" min="0"
                          value={marks[s.id]?.obtained || ''}
                          onChange={e => updateMark(s.id, 'obtained', e.target.value)}
                          placeholder="0" />
                      </td>
                      <td style={styles.td}>
                        <input style={styles.markInput} type="number" min="0"
                          value={marks[s.id]?.total || ''}
                          onChange={e => updateMark(s.id, 'total', e.target.value)}
                          placeholder="100" />
                      </td>
                      <td style={styles.td}>
                        <select style={styles.gradeSelect}
                          value={marks[s.id]?.grade || ''}
                          onChange={e => updateMark(s.id, 'grade', e.target.value)}>
                          <option value="">--</option>
                          {['A+','A','B+','B','C+','C','D','F'].map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {message && <p style={{ color: message.startsWith('✅') ? '#22c55e' : '#ef4444', fontSize: '14px', marginTop: '12px' }}>{message}</p>}
              <button style={styles.saveBtn} onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : '💾 Save Marks'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
