import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

const TABS = ['Upload Marks', 'View Marks', 'Report Card']
const SESSIONS = ['2023-24', '2024-25', '2025-26', '2026-27']

export default function Marks() {
  const [activeTab, setActiveTab] = useState('Upload Marks')

  return (
    <div>
      <div style={styles.pageHeader}>
        <h1 style={styles.pageTitle}>Marks</h1>
      </div>

      <div style={styles.card}>
        <div style={styles.tabs}>
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                ...styles.tab,
                borderBottom: activeTab === tab ? '2px solid #22c55e' : '2px solid transparent',
                color: activeTab === tab ? '#22c55e' : '#6b7280',
                fontWeight: activeTab === tab ? '600' : '400',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'Upload Marks' && <UploadMarks />}
        {activeTab === 'View Marks' && <ViewMarks />}
        {activeTab === 'Report Card' && <ReportCard />}
      </div>
    </div>
  )
}

// ─── UPLOAD MARKS ──────────────────────────────────────────
function UploadMarks() {
  const [showForm, setShowForm] = useState(false)
  const [classes, setClasses] = useState([])
  const [sections, setSections] = useState([])
  const [subjects, setSubjects] = useState([])
  const [students, setStudents] = useState([])
  const [marksData, setMarksData] = useState({})
  const [form, setForm] = useState({
    class_id: '', section_id: '', subject_id: '',
    exam_name: '', session: '2025-26', exam_date: '', max_marks: 100
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [csvFile, setCsvFile] = useState(null)
  const [uploadMode, setUploadMode] = useState('manual') // 'manual' or 'csv'

  useEffect(() => {
    supabase.from('classes').select('*').order('id').then(({ data }) => setClasses(data || []))
  }, [])

  const handleClassChange = async (classId) => {
    setForm({ ...form, class_id: classId, section_id: '', subject_id: '' })
    const [{ data: secs }, { data: subs }] = await Promise.all([
      supabase.from('sections').select('*').eq('class_id', classId),
      supabase.from('subjects').select('*').eq('class_id', classId),
    ])
    setSections(secs || [])
    setSubjects(subs || [])
  }

  const loadStudents = async () => {
    if (!form.class_id) return
    setLoading(true)
    let query = supabase.from('students').select('id, roll_no, profiles(name)').eq('class_id', form.class_id)
    if (form.section_id) query = query.eq('section_id', form.section_id)
    const { data } = await query.order('roll_no')
    setStudents(data || [])
    const initMarks = {}
    data?.forEach(s => initMarks[s.id] = '')
    setMarksData(initMarks)
    setLoading(false)
  }

  const handleSaveMarks = async () => {
    if (!form.exam_name || !form.class_id) {
      setMessage('Exam name and class are required.')
      return
    }
    setSaving(true)
    setMessage('')
    const { data: { user } } = await supabase.auth.getUser()

    // Create exam
    const { data: exam, error: examError } = await supabase.from('exams').insert({
      class_id: parseInt(form.class_id),
      section_id: form.section_id ? parseInt(form.section_id) : null,
      subject_id: form.subject_id ? parseInt(form.subject_id) : null,
      exam_name: form.exam_name,
      session: form.session,
      exam_date: form.exam_date || null,
      max_marks: parseInt(form.max_marks),
      created_by: user.id,
    }).select().single()

    if (examError) {
      setMessage('Error creating exam: ' + examError.message)
      setSaving(false)
      return
    }

    // Insert marks
    const marksRecords = students
      .filter(s => marksData[s.id] !== '')
      .map(s => ({
        exam_id: exam.id,
        student_id: s.id,
        marks: parseFloat(marksData[s.id]),
        uploaded_by: user.id,
      }))

    if (marksRecords.length > 0) {
      const { error: marksError } = await supabase.from('marks').insert(marksRecords)
      if (marksError) {
        setMessage('Error saving marks: ' + marksError.message)
        setSaving(false)
        return
      }
    }

    setMessage(`✅ Marks saved for ${marksRecords.length} students!`)
    setShowForm(false)
    setStudents([])
    setMarksData({})
    setForm({ class_id: '', section_id: '', subject_id: '', exam_name: '', session: '2025-26', exam_date: '', max_marks: 100 })
    setSaving(false)
  }

  const handleCsvUpload = async () => {
    if (!csvFile) return
    setSaving(true)
    setMessage('')
    const ext = csvFile.name.split('.').pop()
    const fileName = `marks_${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('marks-files').upload(fileName, csvFile)
    if (error) {
      setMessage('Upload failed: ' + error.message)
    } else {
      setMessage('✅ CSV uploaded successfully! Process it manually from Supabase.')
    }
    setSaving(false)
  }

  return (
    <div>
      <div style={styles.sectionHeader}>
        <h2 style={styles.sectionTitle}>📋 Upload Marks</h2>
      </div>

      {message && (
        <p style={{ color: message.startsWith('✅') ? '#22c55e' : '#ef4444', fontSize: '14px', marginBottom: '16px' }}>
          {message}
        </p>
      )}

      {!showForm ? (
        <div>
          {/* Mode Selector */}
          <div style={styles.modeRow}>
            <button
              style={{ ...styles.modeBtn, backgroundColor: uploadMode === 'manual' ? '#4f46e5' : '#f3f4f6', color: uploadMode === 'manual' ? '#fff' : '#374151' }}
              onClick={() => setUploadMode('manual')}
            >
              ✏️ Manual Entry
            </button>
            <button
              style={{ ...styles.modeBtn, backgroundColor: uploadMode === 'csv' ? '#4f46e5' : '#f3f4f6', color: uploadMode === 'csv' ? '#fff' : '#374151' }}
              onClick={() => setUploadMode('csv')}
            >
              📊 CSV / Excel Upload
            </button>
          </div>

          {uploadMode === 'manual' ? (
            <div style={styles.actionCards}>
              <div style={styles.actionCard} onClick={() => setShowForm(true)}>
                <div style={{ ...styles.actionIcon, backgroundColor: '#dcfce7' }}>
                  <span style={{ fontSize: '28px' }}>⬆️</span>
                </div>
                <span style={styles.actionLabel}>Upload Marks</span>
              </div>
            </div>
          ) : (
            <div style={styles.csvBox}>
              <h3 style={styles.formTitle}>Upload CSV / Excel</h3>
              <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '12px' }}>
                Upload a CSV or Excel file with columns: student_id, marks, grade
              </p>
              <input type="file" accept=".csv,.xlsx,.xls" style={styles.fileInput}
                onChange={e => setCsvFile(e.target.files[0])} />
              {csvFile && <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '8px' }}>Selected: {csvFile.name}</p>}
              <button style={{ ...styles.submitBtn, marginTop: '16px', alignSelf: 'flex-start' }}
                onClick={handleCsvUpload} disabled={saving || !csvFile}>
                {saving ? 'Uploading...' : 'Upload File'}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div>
          {/* Exam Info Form */}
          <div style={styles.examForm}>
            <h3 style={styles.formTitle}>Exam Details</h3>
            <div style={styles.formGrid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Class *</label>
                <select style={styles.input} value={form.class_id} onChange={e => handleClassChange(e.target.value)}>
                  <option value="">-- Select Class --</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Section</label>
                <select style={styles.input} value={form.section_id} onChange={e => setForm({ ...form, section_id: e.target.value })}>
                  <option value="">-- Select Section --</option>
                  {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Subject</label>
                <select style={styles.input} value={form.subject_id} onChange={e => setForm({ ...form, subject_id: e.target.value })}>
                  <option value="">-- Select Subject --</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Exam Name *</label>
                <input style={styles.input} placeholder="e.g. Mid Term" value={form.exam_name}
                  onChange={e => setForm({ ...form, exam_name: e.target.value })} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Session</label>
                <select style={styles.input} value={form.session} onChange={e => setForm({ ...form, session: e.target.value })}>
                  {SESSIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Exam Date</label>
                <input style={styles.input} type="date" value={form.exam_date}
                  onChange={e => setForm({ ...form, exam_date: e.target.value })} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Max Marks</label>
                <input style={styles.input} type="number" value={form.max_marks}
                  onChange={e => setForm({ ...form, max_marks: e.target.value })} />
              </div>
            </div>
            <button style={styles.findBtn} onClick={loadStudents} disabled={loading}>
              {loading ? 'Loading...' : '🔍 Load Students'}
            </button>
          </div>

          {/* Marks Entry Table */}
          {students.length > 0 && (
            <div style={{ marginTop: '24px' }}>
              <h3 style={{ ...styles.formTitle, marginBottom: '12px' }}>Enter Marks</h3>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>#</th>
                    <th style={styles.th}>Roll No</th>
                    <th style={styles.th}>Student Name</th>
                    <th style={styles.th}>Marks (out of {form.max_marks})</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s, i) => (
                    <tr key={s.id}>
                      <td style={styles.td}>{i + 1}.</td>
                      <td style={styles.td}>{s.roll_no || '—'}</td>
                      <td style={styles.td}>
                        <div style={styles.nameCell}>
                          <div style={styles.miniAvatar}>{s.profiles?.name?.charAt(0).toUpperCase()}</div>
                          {s.profiles?.name}
                        </div>
                      </td>
                      <td style={styles.td}>
                        <input
                          style={{ ...styles.input, width: '100px' }}
                          type="number"
                          min="0"
                          max={form.max_marks}
                          placeholder="—"
                          value={marksData[s.id] || ''}
                          onChange={e => setMarksData({ ...marksData, [s.id]: e.target.value })}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={styles.formButtons}>
                <button style={styles.cancelBtn} onClick={() => { setShowForm(false); setStudents([]) }}>Cancel</button>
                <button style={styles.submitBtn} onClick={handleSaveMarks} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Marks'}
                </button>
              </div>
            </div>
          )}

          {students.length === 0 && (
            <div style={styles.formButtons}>
              <button style={styles.cancelBtn} onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── VIEW MARKS ────────────────────────────────────────────
function ViewMarks() {
  const [classes, setClasses] = useState([])
  const [sections, setSections] = useState([])
  const [exams, setExams] = useState([])
  const [marks, setMarks] = useState([])
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedSection, setSelectedSection] = useState('')
  const [selectedSession, setSelectedSession] = useState('2025-26')
  const [selectedExam, setSelectedExam] = useState('')
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.from('classes').select('*').order('id').then(({ data }) => setClasses(data || []))
  }, [])

  const handleClassChange = async (classId) => {
    setSelectedClass(classId)
    setSelectedSection('')
    setExams([])
    setMarks([])
    setSearched(false)
    const { data } = await supabase.from('sections').select('*').eq('class_id', classId)
    setSections(data || [])
  }

  const handleFind = async () => {
    if (!selectedClass) return
    setLoading(true)
    setSearched(true)

    let query = supabase.from('exams').select('*, subjects(name)')
      .eq('class_id', selectedClass)
      .eq('session', selectedSession)
    if (selectedSection) query = query.eq('section_id', selectedSection)
    const { data } = await query.order('created_at', { ascending: false })
    setExams(data || [])
    setMarks([])
    setSelectedExam('')
    setLoading(false)
  }

  const handleExamSelect = async (examId) => {
    setSelectedExam(examId)
    if (!examId) return
    const { data } = await supabase
      .from('marks')
      .select('*, students(roll_no, profiles(name))')
      .eq('exam_id', examId)
      .order('obtained_marks', { ascending: false })
    setMarks(data || [])
  }

  const handleDeleteExam = async (examId) => {
    if (!confirm('Delete this exam and all its marks?')) return
    await supabase.from('marks').delete().eq('exam_id', examId)
    await supabase.from('exams').delete().eq('id', examId)
    setExams(exams.filter(e => e.id !== examId))
    if (selectedExam === examId) { setSelectedExam(''); setMarks([]) }
  }

  return (
    <div>
      <h2 style={styles.sectionTitle}>📋 Information</h2>

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
            <label style={styles.label}>Session</label>
            <select style={styles.input} value={selectedSession} onChange={e => setSelectedSession(e.target.value)}>
              {SESSIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <button style={styles.findBtn} onClick={handleFind}>🔍 Find</button>
        </div>
      </div>

      {!searched ? (
        <div style={styles.emptyState}>
          <div style={{ fontSize: '64px' }}>🏆</div>
          <p style={{ color: '#9ca3af', marginTop: '12px' }}>Select filters and click Find</p>
        </div>
      ) : loading ? (
        <p style={{ color: '#9ca3af' }}>Loading...</p>
      ) : (
        <>
          <h3 style={{ ...styles.sectionTitle, marginBottom: '12px' }}>📋 Exams</h3>

          {exams.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={{ fontSize: '48px' }}>🗄️</div>
              <p style={{ color: '#9ca3af', marginTop: '12px' }}>No Record</p>
            </div>
          ) : (
            <>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>#</th>
                    <th style={styles.th}>Exam Name</th>
                    <th style={styles.th}>Subject</th>
                    <th style={styles.th}>Date</th>
                    <th style={styles.th}>Max Marks</th>
                    <th style={styles.th}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {exams.map((exam, i) => (
                    <tr key={exam.id} style={{ backgroundColor: selectedExam === exam.id ? '#f0f9ff' : '#fff' }}>
                      <td style={styles.td}>{i + 1}.</td>
                      <td style={styles.td}>{exam.exam_name}</td>
                      <td style={styles.td}>{exam.subjects?.name || '—'}</td>
                      <td style={styles.td}>{exam.exam_date ? new Date(exam.exam_date).toLocaleDateString('en-IN') : '—'}</td>
                      <td style={styles.td}>{exam.max_marks}</td>
                      <td style={styles.td}>
                        <div style={styles.actionBtns}>
                          <button style={styles.editBtn} onClick={() => handleExamSelect(exam.id)}>
                            👁 View Marks
                          </button>
                          <button style={styles.deleteBtn} onClick={() => handleDeleteExam(exam.id)}>
                            🗑 Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Marks Table */}
              {selectedExam && (
                <div style={{ marginTop: '24px' }}>
                  <h3 style={{ ...styles.sectionTitle, marginBottom: '12px' }}>
                    📊 Marks — {exams.find(e => e.id === selectedExam)?.exam_name}
                  </h3>
                  {marks.length === 0 ? (
                    <p style={{ color: '#9ca3af', fontSize: '14px' }}>No marks uploaded for this exam.</p>
                  ) : (
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th style={styles.th}>#</th>
                          <th style={styles.th}>Roll No</th>
                          <th style={styles.th}>Student Name</th>
                          <th style={styles.th}>Marks</th>
                          <th style={styles.th}>Grade</th>
                        </tr>
                      </thead>
                      <tbody>
                        {marks.map((m, i) => (
                          <tr key={m.id}>
                            <td style={styles.td}>{i + 1}.</td>
                            <td style={styles.td}>{m.students?.roll_no || '—'}</td>
                            <td style={styles.td}>
                              <div style={styles.nameCell}>
                                <div style={styles.miniAvatar}>
                                  {m.students?.profiles?.name?.charAt(0).toUpperCase()}
                                </div>
                                {m.students?.profiles?.name}
                              </div>
                            </td>
                            <td style={styles.td}>
                              <strong>{m.obtained_marks ?? m.marks ?? '—'}</strong>
                            </td>
                            <td style={styles.td}>
                              {m.grade ? <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', backgroundColor: '#dcfce7', color: '#16a34a' }}>{m.grade}</span> : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}

const styles = {
  pageHeader: { marginBottom: '24px' },
  pageTitle: { fontSize: '28px', fontWeight: '700', color: '#1a1a2e', margin: 0 },
  card: { backgroundColor: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  tabs: { display: 'flex', gap: '4px', borderBottom: '1px solid #e5e7eb', marginBottom: '24px' },
  tab: { padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', transition: 'all 0.2s' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  sectionTitle: { fontSize: '16px', fontWeight: '700', color: '#1a1a2e' },
  modeRow: { display: 'flex', gap: '12px', marginBottom: '24px' },
  modeBtn: { padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
  actionCards: { display: 'flex', gap: '20px', padding: '20px 0' },
  actionCard: { border: '2px solid #e5e7eb', borderRadius: '12px', padding: '32px 48px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', cursor: 'pointer', minWidth: '180px' },
  actionIcon: { width: '64px', height: '64px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: '16px', fontWeight: '600', color: '#374151' },
  csvBox: { backgroundColor: '#f9fafb', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', maxWidth: '500px' },
  examForm: { backgroundColor: '#f9fafb', borderRadius: '12px', padding: '20px', marginBottom: '16px' },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '16px' },
  filterBox: { backgroundColor: '#f9fafb', borderRadius: '10px', padding: '16px', marginBottom: '24px' },
  filterRow: { display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' },
  filterGroup: { display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '160px' },
  findBtn: { padding: '10px 20px', backgroundColor: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', height: '40px' },
  label: { fontSize: '13px', fontWeight: '600', color: '#374151' },
  input: { padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', outline: 'none' },
  fileInput: { padding: '8px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px' },
  formTitle: { fontSize: '16px', fontWeight: '700', color: '#1a1a2e', marginBottom: '12px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  formButtons: { display: 'flex', gap: '12px', marginTop: '20px' },
  cancelBtn: { padding: '10px 20px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: '14px' },
  submitBtn: { padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#4f46e5', color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', fontSize: '13px', color: '#6b7280', fontWeight: '600', padding: '10px 12px', borderBottom: '2px solid #f3f4f6' },
  td: { padding: '12px', fontSize: '14px', color: '#374151', borderBottom: '1px solid #f9fafb' },
  emptyCell: { padding: '24px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' },
  nameCell: { display: 'flex', alignItems: 'center', gap: '10px' },
  miniAvatar: { width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#4f46e5', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700' },
  actionBtns: { display: 'flex', gap: '8px' },
  editBtn: { padding: '6px 12px', backgroundColor: '#22c55e', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' },
  deleteBtn: { padding: '6px 12px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' },
  emptyState: { textAlign: 'center', padding: '60px 0' },
  filterGroup: { display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '160px' },
}
// ─── REPORT CARD ────────────────────────────────────────────
function ReportCard() {
  const [classes, setClasses] = useState([])
  const [sections, setSections] = useState([])
  const [students, setStudents] = useState([])
  const [exams, setExams] = useState([])
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedSection, setSelectedSection] = useState('')
  const [selectedStudent, setSelectedStudent] = useState('')
  const [selectedExam, setSelectedExam] = useState('')
  const [reportData, setReportData] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.from('classes').select('*').order('id').then(({ data }) => setClasses(data || []))
  }, [])

  const handleClassChange = async (classId) => {
    setSelectedClass(classId)
    setSelectedSection('')
    setSelectedStudent('')
    setSelectedExam('')
    setReportData(null)
    const [{ data: secs }, { data: exs }] = await Promise.all([
      supabase.from('sections').select('*').eq('class_id', classId),
      supabase.from('exams').select('*').eq('class_id', classId).order('exam_date', { ascending: false }),
    ])
    setSections(secs || [])
    setExams(exs || [])
    let q = supabase.from('students').select('id, roll_no, profiles(name)').eq('class_id', classId)
    const { data: studs } = await q.order('roll_no')
    setStudents(studs || [])
  }

  const handleGenerate = async () => {
    if (!selectedStudent || !selectedExam) return
    setLoading(true)
    const student = students.find(s => s.id === selectedStudent)
    const exam = exams.find(e => e.id === selectedExam)
    const { data: marks } = await supabase
      .from('marks')
      .select('*, subjects(name)')
      .eq('student_id', selectedStudent)
      .eq('exam_id', selectedExam)
    const { data: attData } = await supabase
      .from('attendance')
      .select('is_present, status')
      .eq('student_id', selectedStudent)
    const total = attData?.length || 0
    const present = attData?.filter(a => a.is_present || a.status === 'present').length || 0
    const attPct = total > 0 ? Math.round((present / total) * 100) : 0
    setReportData({ student, exam, marks: marks || [], attPct, present, total })
    setLoading(false)
  }

  const handleDownload = () => {
    if (!reportData) return
    const { student, exam, marks, attPct, present, total } = reportData
    const totalObt = marks.reduce((s, m) => s + (m.obtained_marks || 0), 0)
    const totalMax = marks.reduce((s, m) => s + (m.total_marks || 100), 0)
    const pct = totalMax > 0 ? Math.round((totalObt / totalMax) * 100) : 0
    const grade = pct >= 75 ? 'A' : pct >= 60 ? 'B' : pct >= 50 ? 'C' : pct >= 35 ? 'D' : 'F'
    const result = pct >= 35 ? 'PASS' : 'FAIL'

    // Generate HTML and print as PDF
    const html = `
      <html>
      <head>
        <title>Report Card</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 40px; color: #1a1a2e; }
          .header { text-align: center; border-bottom: 3px solid #4f46e5; padding-bottom: 20px; margin-bottom: 24px; }
          .school-name { font-size: 28px; font-weight: 800; color: #4f46e5; }
          .report-title { font-size: 16px; color: #6b7280; margin-top: 4px; letter-spacing: 2px; text-transform: uppercase; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px; background: #f9fafb; padding: 16px; border-radius: 8px; }
          .info-item { display: flex; flex-direction: column; gap: 2px; }
          .info-label { font-size: 11px; color: #9ca3af; text-transform: uppercase; font-weight: 600; }
          .info-value { font-size: 14px; font-weight: 700; color: #1a1a2e; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
          th { background: #4f46e5; color: white; padding: 10px 12px; text-align: left; font-size: 13px; }
          td { padding: 10px 12px; border-bottom: 1px solid #f3f4f6; font-size: 13px; }
          tr:nth-child(even) { background: #f9fafb; }
          .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
          .summary-card { text-align: center; padding: 16px; border-radius: 8px; }
          .summary-value { font-size: 24px; font-weight: 800; }
          .summary-label { font-size: 12px; color: #6b7280; margin-top: 4px; }
          .result-badge { display: inline-block; padding: 6px 20px; border-radius: 20px; font-weight: 800; font-size: 16px; }
          .pass { background: #dcfce7; color: #16a34a; }
          .fail { background: #fee2e2; color: #dc2626; }
          .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 12px; }
          .sign-row { display: grid; grid-template-columns: 1fr 1fr 1fr; margin-top: 40px; text-align: center; }
          .sign-line { border-top: 1px solid #374151; padding-top: 8px; margin: 0 20px; font-size: 12px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="school-name">🍊 School ERP System</div>
          <div class="report-title">Student Report Card</div>
        </div>
        <div class="info-grid">
          <div class="info-item"><span class="info-label">Student Name</span><span class="info-value">${student?.profiles?.name || '—'}</span></div>
          <div class="info-item"><span class="info-label">Roll Number</span><span class="info-value">${student?.roll_no || '—'}</span></div>
          <div class="info-item"><span class="info-label">Exam</span><span class="info-value">${exam?.exam_name || '—'}</span></div>
          <div class="info-item"><span class="info-label">Session</span><span class="info-value">${exam?.session || '—'}</span></div>
          <div class="info-item"><span class="info-label">Exam Date</span><span class="info-value">${exam?.exam_date ? new Date(exam.exam_date).toLocaleDateString('en-IN') : '—'}</span></div>
          <div class="info-item"><span class="info-label">Generated On</span><span class="info-value">${new Date().toLocaleDateString('en-IN')}</span></div>
        </div>
        <table>
          <thead><tr><th>#</th><th>Subject</th><th>Obtained Marks</th><th>Total Marks</th><th>Percentage</th><th>Grade</th></tr></thead>
          <tbody>
            ${marks.map((m, i) => {
              const p = m.total_marks > 0 ? Math.round((m.obtained_marks / m.total_marks) * 100) : 0
              const g = p >= 75 ? 'A' : p >= 60 ? 'B' : p >= 50 ? 'C' : p >= 35 ? 'D' : 'F'
              const row = '<tr><td>' + (i+1) + '</td><td>' + (m.subjects?.name || '—') + '</td><td><strong>' + m.obtained_marks + '</strong></td><td>' + m.total_marks + '</td><td>' + p + '%</td><td><strong>' + (m.grade || g) + '</strong></td></tr>'
              return row
            }).join('')}
          </tbody>
        </table>
        <div class="summary">
          <div class="summary-card" style="background:#dbeafe"><div class="summary-value" style="color:#1d4ed8">${totalObt}/${totalMax}</div><div class="summary-label">Total Marks</div></div>
          <div class="summary-card" style="background:#dcfce7"><div class="summary-value" style="color:#16a34a">${pct}%</div><div class="summary-label">Percentage</div></div>
          <div class="summary-card" style="background:#ede9fe"><div class="summary-value" style="color:#4f46e5">${grade}</div><div class="summary-label">Overall Grade</div></div>
          <div class="summary-card" style="background:${result === 'PASS' ? '#dcfce7' : '#fee2e2'}"><div class="summary-value" style="color:${result === 'PASS' ? '#16a34a' : '#dc2626'}">${result}</div><div class="summary-label">Result</div></div>
        </div>
        <div style="background:#f9fafb; padding:16px; border-radius:8px; margin-bottom:24px;">
          <strong>Attendance:</strong> ${present} / ${total} days present &nbsp;|&nbsp; <strong>${attPct}%</strong> attendance
          ${attPct < 75 ? '<span style="color:#ef4444; margin-left:12px;">⚠️ Below 75% — Attendance Shortage</span>' : ''}
        </div>
        <div class="sign-row">
          <div class="sign-line">Class Teacher</div>
          <div class="sign-line">Principal</div>
          <div class="sign-line">Parent / Guardian</div>
        </div>
        <div class="footer">This is a computer generated report card. — School ERP System</div>
      </body>
      </html>
    `
    const win = window.open('', '_blank')
    win.document.write(html)
    win.document.close()
    win.print()
  }

  return (
    <div>
      <h2 style={styles.sectionTitle}>🎓 Generate Report Card</h2>
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '20px', backgroundColor: '#f9fafb', padding: '16px', borderRadius: '10px' }}>
        <div style={styles.filterGroup}>
          <label style={styles.label}>Class *</label>
          <select style={styles.input} value={selectedClass} onChange={e => handleClassChange(e.target.value)}>
            <option value="">-- Select Class --</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div style={styles.filterGroup}>
          <label style={styles.label}>Student *</label>
          <select style={styles.input} value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)} disabled={!selectedClass}>
            <option value="">-- Select Student --</option>
            {students.map(s => <option key={s.id} value={s.id}>{s.profiles?.name} ({s.roll_no})</option>)}
          </select>
        </div>
        <div style={styles.filterGroup}>
          <label style={styles.label}>Exam *</label>
          <select style={styles.input} value={selectedExam} onChange={e => setSelectedExam(e.target.value)} disabled={!selectedClass}>
            <option value="">-- Select Exam --</option>
            {exams.map(e => <option key={e.id} value={e.id}>{e.exam_name}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button style={styles.findBtn} onClick={handleGenerate} disabled={loading || !selectedStudent || !selectedExam}>
            {loading ? 'Loading...' : '🔍 Generate'}
          </button>
        </div>
      </div>

      {reportData && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1a1a2e' }}>
              Report Card — {reportData.student?.profiles?.name}
            </h3>
            <button style={{ ...styles.findBtn, backgroundColor: '#22c55e', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={handleDownload}>
              📥 Download / Print PDF
            </button>
          </div>

          {/* Preview */}
          <div style={{ backgroundColor: '#fff', border: '2px solid #e5e7eb', borderRadius: '12px', padding: '24px' }}>
            <div style={{ textAlign: 'center', borderBottom: '3px solid #4f46e5', paddingBottom: '16px', marginBottom: '20px' }}>
              <p style={{ fontSize: '22px', fontWeight: '800', color: '#4f46e5' }}>🍊 School ERP System</p>
              <p style={{ color: '#6b7280', fontSize: '13px', letterSpacing: '2px' }}>STUDENT REPORT CARD</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', backgroundColor: '#f9fafb', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
              {[
                ['Student Name', reportData.student?.profiles?.name],
                ['Roll Number', reportData.student?.roll_no],
                ['Exam', reportData.exam?.exam_name],
                ['Session', reportData.exam?.session],
              ].map(([l, v]) => (
                <div key={l}><p style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '600', textTransform: 'uppercase' }}>{l}</p><p style={{ fontSize: '14px', fontWeight: '700' }}>{v || '—'}</p></div>
              ))}
            </div>
            <table style={styles.table}>
              <thead><tr>
                <th style={styles.th}>#</th>
                <th style={styles.th}>Subject</th>
                <th style={styles.th}>Obtained</th>
                <th style={styles.th}>Total</th>
                <th style={styles.th}>%</th>
                <th style={styles.th}>Grade</th>
              </tr></thead>
              <tbody>
                {reportData.marks.map((m, i) => {
                  const p = m.total_marks > 0 ? Math.round((m.obtained_marks / m.total_marks) * 100) : 0
                  const g = m.grade || (p >= 75 ? 'A' : p >= 60 ? 'B' : p >= 50 ? 'C' : p >= 35 ? 'D' : 'F')
                  return (
                    <tr key={m.id}>
                      <td style={styles.td}>{i+1}</td>
                      <td style={styles.td}>{m.subjects?.name || '—'}</td>
                      <td style={styles.td}><strong>{m.obtained_marks}</strong></td>
                      <td style={styles.td}>{m.total_marks}</td>
                      <td style={styles.td}>{p}%</td>
                      <td style={styles.td}><span style={{ backgroundColor: '#dcfce7', color: '#16a34a', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: '700' }}>{g}</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {(() => {
              const totalObt = reportData.marks.reduce((s, m) => s + (m.obtained_marks || 0), 0)
              const totalMax = reportData.marks.reduce((s, m) => s + (m.total_marks || 100), 0)
              const pct = totalMax > 0 ? Math.round((totalObt / totalMax) * 100) : 0
              const grade = pct >= 75 ? 'A' : pct >= 60 ? 'B' : pct >= 50 ? 'C' : pct >= 35 ? 'D' : 'F'
              const result = pct >= 35 ? 'PASS' : 'FAIL'
              return (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginTop: '16px' }}>
                  {[
                    { label: 'Total Marks', value: `${totalObt}/${totalMax}`, bg: '#dbeafe', color: '#1d4ed8' },
                    { label: 'Percentage', value: `${pct}%`, bg: '#dcfce7', color: '#16a34a' },
                    { label: 'Grade', value: grade, bg: '#ede9fe', color: '#4f46e5' },
                    { label: 'Result', value: result, bg: result === 'PASS' ? '#dcfce7' : '#fee2e2', color: result === 'PASS' ? '#16a34a' : '#dc2626' },
                  ].map(s => (
                    <div key={s.label} style={{ backgroundColor: s.bg, borderRadius: '8px', padding: '16px', textAlign: 'center' }}>
                      <p style={{ fontSize: '22px', fontWeight: '800', color: s.color, margin: 0 }}>{s.value}</p>
                      <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0' }}>{s.label}</p>
                    </div>
                  ))}
                </div>
              )
            })()}
            <div style={{ backgroundColor: '#f9fafb', padding: '12px 16px', borderRadius: '8px', marginTop: '16px', fontSize: '14px' }}>
              <strong>Attendance:</strong> {reportData.present}/{reportData.total} days &nbsp;|&nbsp; <strong>{reportData.attPct}%</strong>
              {reportData.attPct < 75 && <span style={{ color: '#ef4444', marginLeft: '12px' }}>⚠️ Attendance Shortage</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
