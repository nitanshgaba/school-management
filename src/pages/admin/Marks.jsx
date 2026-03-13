import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

const TABS = ['Upload Marks', 'View Marks']
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
}