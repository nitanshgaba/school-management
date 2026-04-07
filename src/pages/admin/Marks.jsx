import { useState, useEffect } from 'react'
import { getSchoolSettings } from '../../lib/schoolSettings'
import { supabase } from '../../lib/supabase'

const TABS = ['Upload Marks', 'View Marks', 'Report Card']
const SESSIONS = ['2023-24', '2024-25', '2025-26', '2026-27']

export default function Marks() {
  const [activeTab, setActiveTab] = useState('Upload Marks')

  return (
    <div style={styles.container}>
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Academic Performance</h1>
          <p style={styles.pageSubtitle}>Manage grades, upload marks, and generate report cards</p>
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

        <div style={styles.fadeIn}>
          {activeTab === 'Upload Marks' && <UploadMarks />}
          {activeTab === 'View Marks' && <ViewMarks />}
          {activeTab === 'Report Card' && <ReportCard />}
        </div>
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
  const [uploadMode, setUploadMode] = useState('manual')

  useEffect(() => {
    supabase.from('classes').select('*').order('id').then(({ data }) => setClasses(data || []))
  }, [])

  const handleClassChange = async (classId) => {
    setForm({ ...form, class_id: classId, section_id: '', subject_id: '' })
    if (!classId) {
      setSections([])
      setSubjects([])
      return
    }
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
      setMessage('❌ Exam name and class are required.')
      return
    }
    setSaving(true)
    setMessage('')
    const { data: { user } } = await supabase.auth.getUser()

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
      setMessage('❌ Error creating exam: ' + examError.message)
      setSaving(false)
      return
    }

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
        setMessage('❌ Error saving marks: ' + marksError.message)
        setSaving(false)
        return
      }
    }

    setMessage(`✅ Marks saved successfully for ${marksRecords.length} students!`)
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
      setMessage('❌ Upload failed: ' + error.message)
    } else {
      setMessage('✅ CSV uploaded successfully! Process it manually from Supabase.')
    }
    setSaving(false)
  }

  return (
    <div style={styles.fadeIn}>
      <div style={styles.sectionHeader}>
        <h2 style={styles.sectionTitle}>📝 Upload Marks</h2>
      </div>

      {message && (
        <div style={{ ...styles.alertBox, backgroundColor: message.startsWith('✅') ? '#f0fdf4' : '#fef2f2', border: message.startsWith('✅') ? '1px solid #bbf7d0' : '1px solid #fecaca', color: message.startsWith('✅') ? '#15803d' : '#991b1b' }}>
          {message}
        </div>
      )}

      {!showForm ? (
        <div>
          {/* Mode Selector */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
            <button
              style={{ ...styles.modeBtn, backgroundColor: uploadMode === 'manual' ? '#eff6ff' : '#f8fafc', color: uploadMode === 'manual' ? '#2563eb' : '#64748b', border: uploadMode === 'manual' ? '1px solid #bfdbfe' : '1px solid #e2e8f0' }}
              onClick={() => setUploadMode('manual')}
            >
              ✏️ Manual Data Entry
            </button>
            <button
              style={{ ...styles.modeBtn, backgroundColor: uploadMode === 'csv' ? '#f0fdf4' : '#f8fafc', color: uploadMode === 'csv' ? '#16a34a' : '#64748b', border: uploadMode === 'csv' ? '1px solid #bbf7d0' : '1px solid #e2e8f0' }}
              onClick={() => setUploadMode('csv')}
            >
              📊 Bulk CSV Upload
            </button>
          </div>

          {uploadMode === 'manual' ? (
            <div style={styles.actionCards}>
              <div style={styles.actionCard} onClick={() => setShowForm(true)}>
                <div style={{ ...styles.actionIcon, backgroundColor: '#e0e7ff', color: '#4f46e5' }}>
                  <span style={{ fontSize: '28px' }}>✍️</span>
                </div>
                <div>
                  <h3 style={{ margin: '0 0 4px 0', color: '#1e293b', fontSize: '16px' }}>Start Manual Entry</h3>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>Select class, subject, and enter marks manually.</p>
                </div>
              </div>
            </div>
          ) : (
            <div style={styles.csvBox}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ fontSize: '32px' }}>📁</div>
                <div>
                  <h3 style={{ ...styles.formTitle, margin: 0 }}>Upload CSV / Excel File</h3>
                  <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
                    File must contain columns: <strong style={{ color: '#334155' }}>student_id, marks, grade</strong>
                  </p>
                </div>
              </div>
              
              <div style={styles.fileUploadWrapper}>
                <input type="file" accept=".csv,.xlsx,.xls" style={styles.fileInput} onChange={e => setCsvFile(e.target.files[0])} />
              </div>
              {csvFile && <p style={{ fontSize: '13px', color: '#10b981', marginTop: '8px', fontWeight: '500' }}>📎 Selected: {csvFile.name}</p>}
              
              <button style={{ ...styles.submitBtn, marginTop: '20px', alignSelf: 'flex-start' }} onClick={handleCsvUpload} disabled={saving || !csvFile}>
                {saving ? '⏳ Uploading...' : '⬆️ Upload Data File'}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div style={styles.fadeIn}>
          {/* Exam Info Form */}
          <div style={styles.examForm}>
            <h3 style={styles.formTitle}>Step 1: Exam Configuration</h3>
            <div style={styles.formGrid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Class <span style={{color: '#ef4444'}}>*</span></label>
                <select style={styles.input} value={form.class_id} onChange={e => handleClassChange(e.target.value)}>
                  <option value="">-- Select Class --</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Section (Optional)</label>
                <select style={styles.input} value={form.section_id} onChange={e => setForm({ ...form, section_id: e.target.value })}>
                  <option value="">-- All Sections --</option>
                  {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Subject (Optional)</label>
                <select style={styles.input} value={form.subject_id} onChange={e => setForm({ ...form, subject_id: e.target.value })}>
                  <option value="">-- General / Overall --</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Exam Name <span style={{color: '#ef4444'}}>*</span></label>
                <input style={styles.input} placeholder="e.g. Final Term" value={form.exam_name} onChange={e => setForm({ ...form, exam_name: e.target.value })} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Academic Session</label>
                <select style={styles.input} value={form.session} onChange={e => setForm({ ...form, session: e.target.value })}>
                  {SESSIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Exam Date</label>
                <input style={styles.input} type="date" value={form.exam_date} onChange={e => setForm({ ...form, exam_date: e.target.value })} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Max Marks</label>
                <input style={styles.input} type="number" value={form.max_marks} onChange={e => setForm({ ...form, max_marks: e.target.value })} />
              </div>
            </div>
            <button style={{...styles.submitBtn, marginTop: '16px'}} onClick={loadStudents} disabled={loading || !form.class_id}>
              {loading ? '⏳ Loading...' : '🔍 Fetch Students'}
            </button>
          </div>

          {/* Marks Entry Table */}
          {students.length > 0 && (
            <div style={{ marginTop: '32px' }} className={styles.fadeIn}>
              <h3 style={{ ...styles.formTitle, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                ✍️ Step 2: Enter Marks
                <span style={styles.modalBadge}>Max: {form.max_marks}</span>
              </h3>
              
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>#</th>
                      <th style={styles.th}>Roll No</th>
                      <th style={styles.th}>Student Details</th>
                      <th style={{ ...styles.th, textAlign: 'right', paddingRight: '24px' }}>Marks Obtained</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s, i) => (
                      <tr key={s.id} style={{ ...styles.tr, backgroundColor: marksData[s.id] ? '#f8fafc' : '#fff' }}>
                        <td style={{ ...styles.td, color: '#64748b' }}>{i + 1}.</td>
                        <td style={{ ...styles.td, fontWeight: '500', color: '#475569' }}>{s.roll_no || '—'}</td>
                        <td style={styles.td}>
                          <div style={styles.nameCell}>
                            <div style={{ ...styles.miniAvatar, backgroundColor: '#e2e8f0', color: '#475569' }}>
                              {s.profiles?.name?.charAt(0).toUpperCase()}
                            </div>
                            <span style={{ fontWeight: '600', color: '#1e293b' }}>{s.profiles?.name}</span>
                          </div>
                        </td>
                        <td style={{ ...styles.td, textAlign: 'right', paddingRight: '20px' }}>
                          <input
                            style={{ ...styles.input, width: '120px', textAlign: 'center', fontWeight: '600', color: '#0f172a' }}
                            type="number"
                            min="0"
                            max={form.max_marks}
                            placeholder={`/ ${form.max_marks}`}
                            value={marksData[s.id] || ''}
                            onChange={e => setMarksData({ ...marksData, [s.id]: e.target.value })}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={styles.formButtons}>
                <button style={styles.cancelBtn} onClick={() => { setShowForm(false); setStudents([]) }}>Cancel</button>
                <button style={{ ...styles.submitBtn, backgroundColor: '#10b981' }} onClick={handleSaveMarks} disabled={saving}>
                  {saving ? '⏳ Saving Data...' : '💾 Save All Marks'}
                </button>
              </div>
            </div>
          )}

          {students.length === 0 && (
            <div style={styles.formButtons}>
              <button style={styles.cancelBtn} onClick={() => setShowForm(false)}>Cancel / Go Back</button>
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
    if (!classId) return
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
    if (!window.confirm('Are you sure you want to delete this exam and all its marks?')) return
    await supabase.from('marks').delete().eq('exam_id', examId)
    await supabase.from('exams').delete().eq('id', examId)
    setExams(exams.filter(e => e.id !== examId))
    if (selectedExam === examId) { setSelectedExam(''); setMarks([]) }
  }

  return (
    <div style={styles.fadeIn}>
      <div style={styles.cardHeader}>
        <h2 style={styles.sectionTitle}>🎯 Select Parameters</h2>
      </div>

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
            <label style={styles.label}>Section (Optional)</label>
            <select style={styles.input} value={selectedSection} onChange={e => setSelectedSection(e.target.value)}>
              <option value="">-- All Sections --</option>
              {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div style={styles.filterGroup}>
            <label style={styles.label}>Session</label>
            <select style={styles.input} value={selectedSession} onChange={e => setSelectedSession(e.target.value)}>
              {SESSIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <button style={styles.findBtn} onClick={handleFind}>
            <span style={{ marginRight: '6px' }}>🔍</span> Fetch Data
          </button>
        </div>
      </div>

      {!searched ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyStateIcon}>🏆</div>
          <h3 style={{ color: '#374151', margin: '0 0 8px 0' }}>Ready to view results</h3>
          <p style={{ color: '#6b7280', margin: 0, fontSize: '14px' }}>Select class and session parameters above to view exams.</p>
        </div>
      ) : loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>⏳ Loading exams...</div>
      ) : (
        <div style={styles.fadeIn}>
          <h3 style={{ ...styles.sectionTitle, marginBottom: '16px' }}>📋 Scheduled Exams</h3>

          {exams.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyStateIcon}>🗂️</div>
              <h3 style={{ color: '#374151', margin: '0 0 8px 0' }}>No Records Found</h3>
              <p style={{ color: '#6b7280', margin: 0, fontSize: '14px' }}>There are no exams recorded for this selection.</p>
            </div>
          ) : (
            <>
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Exam Details</th>
                      <th style={styles.th}>Subject</th>
                      <th style={styles.th}>Date</th>
                      <th style={styles.th}>Max Marks</th>
                      <th style={{ ...styles.th, textAlign: 'right', paddingRight: '24px' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exams.map((exam) => (
                      <tr key={exam.id} style={{ ...styles.tr, backgroundColor: selectedExam === exam.id ? '#f0f9ff' : '#fff', borderLeft: selectedExam === exam.id ? '4px solid #3b82f6' : '4px solid transparent' }}>
                        <td style={styles.td}>
                          <div style={{ fontWeight: '600', color: '#0f172a' }}>{exam.exam_name}</div>
                        </td>
                        <td style={styles.td}>
                          {exam.subjects?.name ? <span style={{ fontWeight: '500', color: '#334155' }}>{exam.subjects.name}</span> : <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>General</span>}
                        </td>
                        <td style={{ ...styles.td, color: '#475569' }}>
                          {exam.exam_date ? new Date(exam.exam_date).toLocaleDateString('en-IN') : '—'}
                        </td>
                        <td style={styles.td}>
                          <span style={styles.modalBadge}>{exam.max_marks}</span>
                        </td>
                        <td style={{ ...styles.td, textAlign: 'right', paddingRight: '20px' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button style={selectedExam === exam.id ? { ...styles.editBtnLight, backgroundColor: '#3b82f6', color: '#fff', borderColor: '#3b82f6' } : { ...styles.editBtnLight, color: '#2563eb', borderColor: '#bfdbfe', backgroundColor: '#eff6ff' }} onClick={() => handleExamSelect(exam.id)}>
                              👁 View Results
                            </button>
                            <button style={styles.deleteBtnLight} onClick={() => handleDeleteExam(exam.id)}>
                              🗑️ Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Marks Table */}
              {selectedExam && (
                <div style={{ marginTop: '32px' }} className={styles.fadeIn}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <h3 style={{ ...styles.sectionTitle, margin: 0 }}>
                      📊 Results Overview
                    </h3>
                    <span style={{ ...styles.modalBadge, backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' }}>
                      {exams.find(e => e.id === selectedExam)?.exam_name}
                    </span>
                  </div>

                  {marks.length === 0 ? (
                    <div style={{ backgroundColor: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '12px', padding: '32px', textAlign: 'center' }}>
                      <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>No marks uploaded for this exam yet.</p>
                    </div>
                  ) : (
                    <div style={styles.tableWrapper}>
                      <table style={styles.table}>
                        <thead>
                          <tr>
                            <th style={styles.th}>Rank</th>
                            <th style={styles.th}>Roll No</th>
                            <th style={styles.th}>Student Details</th>
                            <th style={styles.th}>Score</th>
                            <th style={styles.th}>Grade</th>
                          </tr>
                        </thead>
                        <tbody>
                          {marks.map((m, i) => (
                            <tr key={m.id} style={styles.tr}>
                              <td style={{ ...styles.td, color: '#64748b', fontWeight: i < 3 ? '700' : '500' }}>
                                {i === 0 ? '🥇 1st' : i === 1 ? '🥈 2nd' : i === 2 ? '🥉 3rd' : `${i + 1}.`}
                              </td>
                              <td style={{ ...styles.td, color: '#475569' }}>{m.students?.roll_no || '—'}</td>
                              <td style={styles.td}>
                                <div style={styles.nameCell}>
                                  <div style={{ ...styles.miniAvatar, backgroundColor: '#e2e8f0', color: '#475569' }}>
                                    {m.students?.profiles?.name?.charAt(0).toUpperCase()}
                                  </div>
                                  <span style={{ fontWeight: '600', color: '#1e293b' }}>{m.students?.profiles?.name}</span>
                                </div>
                              </td>
                              <td style={styles.td}>
                                <span style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>
                                  {m.obtained_marks ?? m.marks ?? '—'}
                                </span>
                              </td>
                              <td style={styles.td}>
                                {m.grade ? (
                                  <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', backgroundColor: '#dcfce7', color: '#16a34a', border: '1px solid #bbf7d0' }}>
                                    {m.grade}
                                  </span>
                                ) : <span style={{ color: '#94a3b8' }}>—</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
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
  
  // FIX: Bulletproof fetching of dynamic school name
  const [schoolName, setSchoolName] = useState('School ERP System')

  useEffect(() => {
    supabase.from('classes').select('*').order('id').then(({ data }) => setClasses(data || []))
    
    // Robust settings fetcher
    const fetchSettings = async () => {
      try {
        const response = await getSchoolSettings()
        // Unpack if it's nested in { data: ... }
        let settings = response?.data || response
        // Unpack if it's an array
        if (Array.isArray(settings)) settings = settings[0]

        if (settings) {
          // Check all possible key names for safety
          const validName = settings.school_name || settings.schoolName || settings.name || settings.school_title
          if (validName) {
            setSchoolName(validName)
          }
        }
      } catch (err) {
        console.error('Failed to fetch school settings', err)
      }
    }
    fetchSettings()
  }, [])

  const handleClassChange = async (classId) => {
    setSelectedClass(classId)
    setSelectedSection('')
    setSelectedStudent('')
    setSelectedExam('')
    setReportData(null)
    
    if (!classId) return
    
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
    const totalObt = marks.reduce((s, m) => s + (m.obtained_marks || m.marks || 0), 0)
    const totalMax = marks.reduce((s, m) => s + (m.total_marks || 100), 0)
    const pct = totalMax > 0 ? Math.round((totalObt / totalMax) * 100) : 0
    const grade = pct >= 75 ? 'A' : pct >= 60 ? 'B' : pct >= 50 ? 'C' : pct >= 35 ? 'D' : 'F'
    const result = pct >= 35 ? 'PASS' : 'FAIL'

    const html = `
      <html>
      <head>
        <title>Report Card - ${student?.profiles?.name}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 40px; color: #0f172a; line-height: 1.5; }
          .header { text-align: center; border-bottom: 3px solid #2563eb; padding-bottom: 24px; margin-bottom: 32px; }
          .school-name { font-size: 32px; font-weight: 800; color: #1e3a8a; letter-spacing: -0.5px; }
          .report-title { font-size: 14px; color: #64748b; margin-top: 8px; letter-spacing: 3px; text-transform: uppercase; font-weight: 600; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 32px; background: #f8fafc; padding: 24px; border-radius: 12px; border: 1px solid #e2e8f0; }
          .info-item { display: flex; flex-direction: column; gap: 4px; }
          .info-label { font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; }
          .info-value { font-size: 15px; font-weight: 700; color: #0f172a; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 32px; }
          th { background: #f1f5f9; color: #475569; padding: 12px 16px; text-align: left; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #cbd5e1; }
          td { padding: 14px 16px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #334155; }
          tr:nth-child(even) { background: #f8fafc; }
          .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px; }
          .summary-card { text-align: center; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; background: #fff; }
          .summary-value { font-size: 28px; font-weight: 800; }
          .summary-label { font-size: 12px; color: #64748b; margin-top: 8px; font-weight: 600; text-transform: uppercase; }
          .result-pass { color: #16a34a; }
          .result-fail { color: #dc2626; }
          .att-box { background: #f8fafc; padding: 20px; border-radius: 12px; margin-bottom: 32px; border: 1px solid #e2e8f0; text-align: center; font-size: 15px; color: #334155; }
          .footer { text-align: center; margin-top: 60px; padding-top: 24px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 12px; }
          .sign-row { display: grid; grid-template-columns: 1fr 1fr 1fr; margin-top: 80px; text-align: center; gap: 40px; }
          .sign-line { border-top: 1px solid #94a3b8; padding-top: 12px; font-size: 13px; color: #475569; font-weight: 600; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="school-name">🎓 ${schoolName}</div>
          <div class="report-title">Official Student Report Card</div>
        </div>
        
        <div class="info-grid">
          <div class="info-item"><span class="info-label">Student Name</span><span class="info-value">${student?.profiles?.name || '—'}</span></div>
          <div class="info-item"><span class="info-label">Roll Number</span><span class="info-value">${student?.roll_no || '—'}</span></div>
          <div class="info-item"><span class="info-label">Examination</span><span class="info-value">${exam?.exam_name || '—'}</span></div>
          <div class="info-item"><span class="info-label">Academic Session</span><span class="info-value">${exam?.session || '—'}</span></div>
          <div class="info-item"><span class="info-label">Date of Exam</span><span class="info-value">${exam?.exam_date ? new Date(exam.exam_date).toLocaleDateString('en-IN') : '—'}</span></div>
          <div class="info-item"><span class="info-label">Date Generated</span><span class="info-value">${new Date().toLocaleDateString('en-IN')}</span></div>
        </div>

        <table>
          <thead><tr><th>#</th><th>Subject</th><th>Obtained Marks</th><th>Total Marks</th><th>Percentage</th><th>Grade</th></tr></thead>
          <tbody>
            ${marks.map((m, i) => {
              const obt = m.obtained_marks ?? m.marks ?? 0
              const max = m.total_marks || 100
              const p = max > 0 ? Math.round((obt / max) * 100) : 0
              const g = m.grade || (p >= 75 ? 'A' : p >= 60 ? 'B' : p >= 50 ? 'C' : p >= 35 ? 'D' : 'F')
              return '<tr><td>' + (i+1) + '</td><td><strong>' + (m.subjects?.name || '—') + '</strong></td><td><strong>' + obt + '</strong></td><td>' + max + '</td><td>' + p + '%</td><td><strong>' + g + '</strong></td></tr>'
            }).join('')}
          </tbody>
        </table>

        <div class="summary">
          <div class="summary-card"><div class="summary-value" style="color:#2563eb">${totalObt} / ${totalMax}</div><div class="summary-label">Total Score</div></div>
          <div class="summary-card"><div class="summary-value" style="color:#0f172a">${pct}%</div><div class="summary-label">Overall Percentage</div></div>
          <div class="summary-card"><div class="summary-value" style="color:#0f172a">${grade}</div><div class="summary-label">Final Grade</div></div>
          <div class="summary-card"><div class="summary-value ${result === 'PASS' ? 'result-pass' : 'result-fail'}">${result}</div><div class="summary-label">Final Status</div></div>
        </div>

        <div class="att-box">
          <strong>Attendance Record:</strong> Present <strong>${present}</strong> out of <strong>${total}</strong> working days &nbsp;|&nbsp; <strong>${attPct}%</strong> overall attendance
          ${attPct < 75 ? '<div style="color:#dc2626; margin-top:8px; font-weight:700; font-size:13px;">⚠️ Warning: Attendance is below the required 75% minimum.</div>' : ''}
        </div>

        <div class="sign-row">
          <div class="sign-line">Class Teacher Signature</div>
          <div class="sign-line">Principal Signature</div>
          <div class="sign-line">Parent / Guardian Signature</div>
        </div>

        <div class="footer">This is a computer generated document and does not require a physical signature unless stamped.</div>
      </body>
      </html>
    `
    const win = window.open('', '_blank')
    win.document.write(html)
    win.document.close()
    win.print()
  }

  return (
    <div style={styles.fadeIn}>
      <div style={styles.cardHeader}>
        <h2 style={styles.sectionTitle}>🎯 Select Report Parameters</h2>
      </div>

      <div style={styles.filterBox}>
        <div style={styles.filterRow}>
          <div style={styles.filterGroup}>
            <label style={styles.label}>Class <span style={{color: '#ef4444'}}>*</span></label>
            <select style={styles.input} value={selectedClass} onChange={e => handleClassChange(e.target.value)}>
              <option value="">-- Select Class --</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div style={styles.filterGroup}>
            <label style={styles.label}>Student <span style={{color: '#ef4444'}}>*</span></label>
            <select style={styles.input} value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)} disabled={!selectedClass}>
              <option value="">-- Select Student --</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.profiles?.name} ({s.roll_no})</option>)}
            </select>
          </div>
          <div style={styles.filterGroup}>
            <label style={styles.label}>Exam <span style={{color: '#ef4444'}}>*</span></label>
            <select style={styles.input} value={selectedExam} onChange={e => setSelectedExam(e.target.value)} disabled={!selectedClass}>
              <option value="">-- Select Exam --</option>
              {exams.map(e => <option key={e.id} value={e.id}>{e.exam_name}</option>)}
            </select>
          </div>
          <button style={styles.findBtn} onClick={handleGenerate} disabled={loading || !selectedStudent || !selectedExam}>
            {loading ? '⏳ Generating...' : '📄 Generate Preview'}
          </button>
        </div>
      </div>

      {!reportData && !loading && (
         <div style={styles.emptyState}>
            <div style={styles.emptyStateIcon}>🎓</div>
            <h3 style={{ color: '#374151', margin: '0 0 8px 0' }}>Generate Report Card</h3>
            <p style={{ color: '#6b7280', margin: 0, fontSize: '14px' }}>Select a class, student, and exam to preview and print the report card.</p>
         </div>
      )}

      {reportData && (
        <div style={styles.fadeIn}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', margin: 0 }}>
              📄 Report Card Preview
            </h3>
            <button style={{ ...styles.submitBtn, backgroundColor: '#10b981', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px' }} onClick={handleDownload}>
              📥 Print / Save PDF
            </button>
          </div>

          {/* On-Screen Document Preview */}
          <div style={styles.previewSheet}>
            <div style={{ textAlign: 'center', borderBottom: '3px solid #2563eb', paddingBottom: '20px', marginBottom: '24px' }}>
              <p style={{ fontSize: '26px', fontWeight: '800', color: '#1e3a8a', margin: '0 0 4px 0' }}>🎓 {schoolName}</p>
              <p style={{ color: '#64748b', fontSize: '12px', letterSpacing: '3px', fontWeight: '600', margin: 0 }}>OFFICIAL STUDENT REPORT CARD</p>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', backgroundColor: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
              {[
                ['Student Name', reportData.student?.profiles?.name],
                ['Roll Number', reportData.student?.roll_no],
                ['Examination', reportData.exam?.exam_name],
                ['Academic Session', reportData.exam?.session],
              ].map(([l, v]) => (
                <div key={l} style={{ borderBottom: '1px solid #cbd5e1', paddingBottom: '4px' }}>
                  <p style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', margin: '0 0 2px 0' }}>{l}</p>
                  <p style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', margin: 0 }}>{v || '—'}</p>
                </div>
              ))}
            </div>

            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>#</th>
                    <th style={styles.th}>Subject</th>
                    <th style={styles.th}>Score</th>
                    <th style={styles.th}>Max</th>
                    <th style={styles.th}>%</th>
                    <th style={{ ...styles.th, textAlign: 'right', paddingRight: '20px' }}>Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.marks.length === 0 ? (
                    <tr><td colSpan={6} style={styles.emptyCell}>No marks recorded for this exam.</td></tr>
                  ) : (
                    reportData.marks.map((m, i) => {
                      const obt = m.obtained_marks ?? m.marks ?? 0
                      const max = m.total_marks || 100
                      const p = max > 0 ? Math.round((obt / max) * 100) : 0
                      const g = m.grade || (p >= 75 ? 'A' : p >= 60 ? 'B' : p >= 50 ? 'C' : p >= 35 ? 'D' : 'F')
                      return (
                        <tr key={m.id} style={styles.tr}>
                          <td style={styles.td}>{i+1}</td>
                          <td style={{ ...styles.td, fontWeight: '600' }}>{m.subjects?.name || '—'}</td>
                          <td style={{ ...styles.td, fontWeight: '700', color: '#0f172a' }}>{obt}</td>
                          <td style={{ ...styles.td, color: '#64748b' }}>{max}</td>
                          <td style={{ ...styles.td, color: '#64748b' }}>{p}%</td>
                          <td style={{ ...styles.td, textAlign: 'right', paddingRight: '20px' }}>
                            <span style={{ backgroundColor: '#f1f5f9', color: '#0f172a', padding: '4px 10px', borderRadius: '6px', fontSize: '13px', fontWeight: '800', border: '1px solid #cbd5e1' }}>{g}</span>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {reportData.marks.length > 0 && (() => {
              const totalObt = reportData.marks.reduce((s, m) => s + (m.obtained_marks || m.marks || 0), 0)
              const totalMax = reportData.marks.reduce((s, m) => s + (m.total_marks || 100), 0)
              const pct = totalMax > 0 ? Math.round((totalObt / totalMax) * 100) : 0
              const grade = pct >= 75 ? 'A' : pct >= 60 ? 'B' : pct >= 50 ? 'C' : pct >= 35 ? 'D' : 'F'
              const result = pct >= 35 ? 'PASS' : 'FAIL'
              
              return (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginTop: '24px' }}>
                  {[
                    { label: 'Total Score', value: `${totalObt}/${totalMax}`, color: '#2563eb' },
                    { label: 'Percentage', value: `${pct}%`, color: '#0f172a' },
                    { label: 'Final Grade', value: grade, color: '#0f172a' },
                    { label: 'Status', value: result, color: result === 'PASS' ? '#16a34a' : '#dc2626' },
                  ].map(s => (
                    <div key={s.label} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', textAlign: 'center', backgroundColor: '#fff' }}>
                      <p style={{ fontSize: '24px', fontWeight: '800', color: s.color, margin: 0 }}>{s.value}</p>
                      <p style={{ fontSize: '12px', color: '#64748b', margin: '6px 0 0', fontWeight: '600', textTransform: 'uppercase' }}>{s.label}</p>
                    </div>
                  ))}
                </div>
              )
            })()}

            <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '12px', marginTop: '24px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#334155' }}>
              <strong>Attendance Record:</strong> {reportData.present} / {reportData.total} days present &nbsp;|&nbsp; <strong>{reportData.attPct}%</strong> overall attendance
              {reportData.attPct < 75 && <div style={{ color: '#dc2626', marginTop: '8px', fontWeight: '700', fontSize: '13px' }}>⚠️ Warning: Attendance is below the required minimum.</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── STYLES ────────────────────────────────────────────────
const styles = {
  container: { maxWidth: '1100px', margin: '0 auto', padding: '20px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' },
  pageHeader: { marginBottom: '32px' },
  pageTitle: { fontSize: '32px', fontWeight: '800', color: '#111827', margin: '0 0 8px 0', letterSpacing: '-0.5px' },
  pageSubtitle: { fontSize: '15px', color: '#6b7280', margin: 0 },
  
  card: { backgroundColor: '#fff', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)', border: '1px solid #f3f4f6' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  sectionHeader: { marginBottom: '24px' },
  sectionTitle: { fontSize: '18px', fontWeight: '700', color: '#1f2937', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' },
  
  tabContainer: { display: 'inline-flex', background: '#f1f5f9', padding: '4px', borderRadius: '12px', marginBottom: '32px' },
  tab: { padding: '10px 24px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', transition: 'all 0.2s ease' },
  
  fadeIn: { opacity: 1, transition: 'opacity 0.3s ease-in' },
  
  modeBtn: { padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px' },
  actionCards: { display: 'flex', gap: '20px', padding: '10px 0' },
  actionCard: { border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px 32px', display: 'flex', alignItems: 'center', gap: '20px', cursor: 'pointer', backgroundColor: '#f8fafc', transition: 'transform 0.2s, box-shadow 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' },
  actionIcon: { width: '56px', height: '56px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  
  csvBox: { backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '32px', display: 'flex', flexDirection: 'column', maxWidth: '600px' },
  fileUploadWrapper: { padding: '12px', border: '2px dashed #cbd5e1', borderRadius: '8px', backgroundColor: '#fff', marginTop: '16px' },
  fileInput: { width: '100%', fontSize: '14px', color: '#64748b' },
  
  examForm: { backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', marginBottom: '24px' },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '20px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '8px', flex: '1' },
  label: { fontSize: '13px', fontWeight: '600', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' },
  input: { padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', backgroundColor: '#fff', color: '#1e293b', transition: 'border-color 0.2s', width: '100%' },
  
  filterBox: { backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', marginBottom: '24px' },
  filterRow: { display: 'flex', gap: '20px', alignItems: 'flex-end', flexWrap: 'wrap' },
  findBtn: { padding: '12px 24px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', height: '44px', display: 'flex', alignItems: 'center', transition: 'background-color 0.2s', boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)' },
  
  alertBox: { padding: '12px 16px', borderRadius: '8px', marginBottom: '24px', fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center' },
  
  tableWrapper: { borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff' },
  th: { textAlign: 'left', fontSize: '12px', color: '#64748b', fontWeight: '700', padding: '16px 20px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textTransform: 'uppercase', letterSpacing: '0.5px' },
  tr: { borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.15s ease' },
  td: { padding: '16px 20px', fontSize: '14px', color: '#1e293b', verticalAlign: 'middle' },
  emptyCell: { padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '15px' },
  
  nameCell: { display: 'flex', alignItems: 'center', gap: '12px' },
  miniAvatar: { width: '32px', height: '32px', borderRadius: '8px', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700' },
  modalBadge: { backgroundColor: '#eff6ff', color: '#2563eb', padding: '4px 12px', borderRadius: '12px', fontSize: '13px', fontWeight: '700', border: '1px solid #bfdbfe' },
  
  editBtnLight: { padding: '6px 12px', backgroundColor: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', transition: 'all 0.2s' },
  deleteBtnLight: { padding: '6px 12px', backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', transition: 'all 0.2s' },
  
  formButtons: { display: 'flex', justifyContent: 'flex-start', gap: '16px', marginTop: '24px' },
  submitBtn: { padding: '12px 32px', borderRadius: '8px', border: 'none', backgroundColor: '#2563eb', color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: '600', transition: 'background-color 0.2s', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' },
  cancelBtn: { padding: '12px 24px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontSize: '14px', color: '#475569', fontWeight: '600', transition: 'background-color 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' },
  
  emptyState: { textAlign: 'center', padding: '60px 20px', border: '2px dashed #e2e8f0', borderRadius: '12px', backgroundColor: '#fafaf9', marginTop: '16px' },
  emptyStateIcon: { fontSize: '56px', marginBottom: '16px', opacity: 0.8 },
  
  previewSheet: { backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '40px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', margin: '0 auto', maxWidth: '900px' }
}