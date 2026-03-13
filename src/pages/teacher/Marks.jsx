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
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    supabase.from('classes').select('*').then(({ data }) => setClasses(data || []))
    supabase.from('subjects').select('*').eq('teacher_id', profile.id).then(({ data }) => setSubjects(data || []))
  }, [])

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
  )
}

const styles = {
  title: { fontSize: '24px', fontWeight: '700', color: '#1a1a2e', marginBottom: '24px' },
  card: { backgroundColor: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: '20px' },
  filterRow: { display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' },
  filterGroup: { display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '150px' },
  label: { fontSize: '13px', fontWeight: '600', color: '#374151' },
  input: { padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', outline: 'none' },
  findBtn: { padding: '10px 20px', backgroundColor: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', height: '42px' },
  sectionTitle: { fontSize: '16px', fontWeight: '700', color: '#1a1a2e', marginBottom: '16px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', fontSize: '13px', color: '#6b7280', fontWeight: '600', padding: '10px 12px', borderBottom: '2px solid #f3f4f6' },
  td: { padding: '10px 12px', fontSize: '14px', color: '#374151', borderBottom: '1px solid #f9fafb' },
  emptyCell: { padding: '24px', textAlign: 'center', color: '#9ca3af' },
  nameCell: { display: 'flex', alignItems: 'center', gap: '10px' },
  avatar: { width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#4f46e5', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700' },
  markInput: { width: '70px', padding: '6px 8px', borderRadius: '6px', border: '1px solid #e5e7eb', fontSize: '14px', outline: 'none', textAlign: 'center' },
  gradeSelect: { padding: '6px 8px', borderRadius: '6px', border: '1px solid #e5e7eb', fontSize: '14px', outline: 'none' },
  saveBtn: { marginTop: '16px', padding: '12px 24px', backgroundColor: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
}
