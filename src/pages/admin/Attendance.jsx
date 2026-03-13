import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

const TABS = ['Take Attendance', 'Date Wise Attendance']

export default function Attendance() {
  const [activeTab, setActiveTab] = useState('Take Attendance')

  return (
    <div>
      <div style={styles.pageHeader}>
        <h1 style={styles.pageTitle}>Attendance</h1>
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
    <div>
      <h2 style={styles.sectionTitle}>📋 Show Attendance</h2>

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
          <button style={styles.findBtn} onClick={handleFind}>🔍 Find</button>
        </div>
      </div>

      {searched && (
        <>
          {message && (
            <p style={{ color: message.startsWith('✅') ? '#22c55e' : '#ef4444', fontSize: '14px', marginBottom: '12px' }}>
              {message}
            </p>
          )}

          {students.length > 0 && (
            <div style={styles.attendanceSummary}>
              <span>Total: <strong>{students.length}</strong></span>
              <span style={{ color: '#22c55e' }}>Present: <strong>{presentCount}</strong></span>
              <span style={{ color: '#ef4444' }}>Absent: <strong>{students.length - presentCount}</strong></span>
              <span style={{ color: '#6b7280', fontSize: '13px' }}>
                Date: <strong>{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</strong>
              </span>
            </div>
          )}

          <div style={styles.tableHeader}>
            <h2 style={styles.sectionTitle}>📋 Student List</h2>
          </div>

          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>#</th>
                <th style={styles.th}>Roll No.</th>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Total Days</th>
                <th style={styles.th}>Present</th>
                <th style={styles.th}>Mark Present</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={styles.emptyCell}>Loading...</td></tr>
              ) : students.length === 0 ? (
                <tr><td colSpan={6} style={styles.emptyCell}>No students found in this class/section</td></tr>
              ) : (
                students.map((s, i) => (
                  <tr key={s.id} style={{ backgroundColor: attendance[s.id] ? '#f0fdf4' : '#fff' }}>
                    <td style={styles.td}>{i + 1}.</td>
                    <td style={styles.td}>{s.roll_no || s.id.slice(0, 8)}</td>
                    <td style={styles.td}>
                      <div style={styles.nameCell}>
                        <div style={styles.miniAvatar}>{s.profiles?.name?.charAt(0).toUpperCase()}</div>
                        {s.profiles?.name}
                      </div>
                    </td>
                    <td style={styles.td}>—</td>
                    <td style={styles.td}>
                      <span style={{ color: attendance[s.id] ? '#22c55e' : '#ef4444', fontWeight: '600' }}>
                        {attendance[s.id] ? 'P' : 'A'}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <div
                        onClick={() => toggleAttendance(s.id)}
                        style={{
                          ...styles.toggle,
                          backgroundColor: attendance[s.id] ? '#22c55e' : '#d1d5db',
                        }}
                      >
                        <div style={{
                          ...styles.toggleKnob,
                          transform: attendance[s.id] ? 'translateX(20px)' : 'translateX(2px)',
                        }} />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {students.length > 0 && (
            <div style={styles.actionRow}>
              <button style={styles.resetBtn} onClick={handleReset}>Reset</button>
              <button style={styles.submitBtn} onClick={handleSubmit} disabled={saving}>
                {saving ? 'Saving...' : 'Submit'}
              </button>
            </div>
          )}
        </>
      )}

      {!searched && (
        <div style={styles.emptyState}>
          <div style={{ fontSize: '64px' }}>📋</div>
          <p style={{ color: '#9ca3af', marginTop: '12px' }}>Select class and section to take attendance</p>
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
            <label style={styles.label}>Date</label>
            <input
              style={styles.input}
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
            />
          </div>
          <button style={styles.findBtn} onClick={handleFind}>🔍 Find</button>
        </div>
      </div>

      <h2 style={{ ...styles.sectionTitle, marginBottom: '12px' }}>📋 Attendance Sheet</h2>

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>#</th>
            <th style={styles.th}>Roll No.</th>
            <th style={styles.th}>Name</th>
            <th style={styles.th}>Attendance</th>
          </tr>
        </thead>
        <tbody>
          {!searched ? (
            <tr>
              <td colSpan={4} style={styles.emptyCell}>
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <div style={{ fontSize: '48px', marginBottom: '8px' }}>🗄️</div>
                  <div>No Data</div>
                </div>
              </td>
            </tr>
          ) : loading ? (
            <tr><td colSpan={4} style={styles.emptyCell}>Loading...</td></tr>
          ) : records.length === 0 ? (
            <tr>
              <td colSpan={4} style={styles.emptyCell}>
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <div style={{ fontSize: '48px', marginBottom: '8px' }}>🗄️</div>
                  <div>No attendance records for this date</div>
                </div>
              </td>
            </tr>
          ) : (
            records.map((r, i) => (
              <tr key={r.id}>
                <td style={styles.td}>{i + 1}.</td>
                <td style={styles.td}>{r.students?.roll_no || '—'}</td>
                <td style={styles.td}>
                  <div style={styles.nameCell}>
                    <div style={styles.miniAvatar}>
                      {r.students?.profiles?.name?.charAt(0).toUpperCase()}
                    </div>
                    {r.students?.profiles?.name}
                  </div>
                </td>
                <td style={styles.td}>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '13px',
                    fontWeight: '600',
                    backgroundColor: r.is_present ? '#dcfce7' : '#fee2e2',
                    color: r.is_present ? '#16a34a' : '#dc2626',
                  }}>
                    {r.is_present ? 'Present' : 'Absent'}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

const styles = {
  pageHeader: { marginBottom: '24px' },
  pageTitle: { fontSize: '28px', fontWeight: '700', color: '#1a1a2e', margin: 0 },
  card: { backgroundColor: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  tabs: { display: 'flex', gap: '4px', borderBottom: '1px solid #e5e7eb', marginBottom: '24px' },
  tab: { padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', transition: 'all 0.2s' },
  sectionTitle: { fontSize: '16px', fontWeight: '700', color: '#1a1a2e', marginBottom: '16px' },
  filterBox: { backgroundColor: '#f9fafb', borderRadius: '10px', padding: '16px', marginBottom: '24px' },
  filterRow: { display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' },
  filterGroup: { display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '160px' },
  findBtn: { padding: '10px 20px', backgroundColor: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', height: '40px' },
  label: { fontSize: '13px', fontWeight: '600', color: '#374151' },
  input: { padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', outline: 'none' },
  tableHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', fontSize: '13px', color: '#6b7280', fontWeight: '600', padding: '10px 12px', borderBottom: '2px solid #f3f4f6' },
  td: { padding: '12px', fontSize: '14px', color: '#374151', borderBottom: '1px solid #f9fafb' },
  emptyCell: { padding: '24px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' },
  nameCell: { display: 'flex', alignItems: 'center', gap: '10px' },
  miniAvatar: { width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#4f46e5', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700' },
  toggle: { width: '44px', height: '24px', borderRadius: '12px', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' },
  toggleKnob: { width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#fff', position: 'absolute', top: '2px', transition: 'transform 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' },
  actionRow: { display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' },
  resetBtn: { padding: '10px 24px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: '14px', color: '#eab308', fontWeight: '600' },
  submitBtn: { padding: '10px 24px', borderRadius: '8px', border: 'none', backgroundColor: '#4f46e5', color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
  attendanceSummary: { display: 'flex', gap: '24px', padding: '12px 16px', backgroundColor: '#f9fafb', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' },
  emptyState: { textAlign: 'center', padding: '60px 0' },
}