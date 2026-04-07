import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { logActivity } from '../../lib/logActivity'
import CSVImport from './CSVImport'

const TABS = ['Add Students', 'Show Students', 'Feedback']

export default function Students() {
  const [activeTab, setActiveTab] = useState('Add Students')

  return (
    <div>
      <div style={styles.pageHeader}>
        <h1 style={styles.pageTitle}>Students</h1>
        <p style={styles.pageSubtitle}>Manage student enrollment, records and feedback</p>
      </div>

      <div style={styles.card}>
        <div style={styles.tabs}>
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                ...styles.tab,
                borderBottom: activeTab === tab ? '2px solid #4f46e5' : '2px solid transparent',
                color: activeTab === tab ? '#4f46e5' : '#6b7280',
                fontWeight: activeTab === tab ? '600' : '400',
                backgroundColor: activeTab === tab ? '#f5f3ff' : 'transparent',
              }}
            >
              {tab === 'Add Students' && '➕ '}
              {tab === 'Show Students' && '👥 '}
              {tab === 'Feedback' && '💬 '}
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'Add Students' && <AddStudents />}
        {activeTab === 'Show Students' && <ShowStudents />}
        {activeTab === 'Feedback' && <StudentFeedback />}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// ADD STUDENTS
// ─────────────────────────────────────────────
function AddStudents() {
  const { profile } = useAuth()
  const [classes, setClasses] = useState([])
  const [sections, setSections] = useState([])
  const generateRollNo = () => { const year = new Date().getFullYear().toString().slice(2); const rand4 = Math.floor(Math.random() * 9000) + 1000; return '1' + year + rand4 }
  const getUniqueRollNo = async () => {
    let roll_no, exists = true
    while (exists) {
      roll_no = generateRollNo()
      const { data } = await supabase.from('students').select('id').eq('roll_no', roll_no)
      exists = data && data.length > 0
    }
    return roll_no
  }
  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '', gender: 'male',
    birthday: '', address: '', class_id: '', section_id: '', roll_no: generateRollNo()
  })
  const [loading, setLoading] = useState(false)
  const [showCSV, setShowCSV] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    supabase.from('classes').select('*').then(({ data }) => setClasses(data || []))
  }, [])

  const handleClassChange = async (classId) => {
    setForm({ ...form, class_id: classId, section_id: '' })
    const { data } = await supabase.from('sections').select('*').eq('class_id', classId)
    setSections(data || [])
  }

  const handleAdd = async () => {
    if (!form.name || !form.password) { setMessage('Name and password are required.'); return }
    if (!form.email) { setMessage('Email is required.'); return }
    setLoading(true)
    setMessage('')

    const roll_no = form.roll_no
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
      body: JSON.stringify({ email: form.email, password: form.password }),
    })
    const authResult = await res.json()
    if (authResult.error) { setMessage(authResult.error); setLoading(false); return }

    const userId = authResult.user?.id
    const studentId = roll_no

    const { error: profileError } = await supabase.from('profiles').insert({
      id: userId, uid: studentId, role: 'student',
      name: form.name, email: form.email, phone: form.phone,
      gender: form.gender, birthday: form.birthday || null, address: form.address,
    })
    if (profileError) { setMessage(profileError.message); setLoading(false); return }

    await supabase.from('students').insert({
      id: userId, student_id: studentId,
      class_id: form.class_id || null,
      section_id: form.section_id || null,
      roll_no: roll_no,
    })

    setMessage(`✅ Student added! Student ID: ${studentId}`)
    setForm({ name: '', email: '', password: '', phone: '', gender: 'male', birthday: '', address: '', class_id: '', section_id: '', roll_no: generateRollNo() })
    await logActivity({
      performed_by: profile.id, performed_by_name: profile.name, role: 'admin',
      action: 'Student Created', target_type: 'student',
      target_name: form.name,
      details: `Student ID: ${studentId}, Class: ${form.class_id || 'N/A'}`
    })
    setLoading(false)
  }

  return (
    <div>
      {/* Header row with CSV import */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#1a1a2e', margin: '0 0 2px' }}>Enroll New Student</h2>
          <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>Fill in the form below to add a student</p>
        </div>
        <button onClick={() => setShowCSV(true)} style={styles.csvBtn}>
          📥 Import CSV
        </button>
      </div>

      <div style={{ display: 'flex', gap: '28px', alignItems: 'flex-start' }}>

        {/* ── Left: Form ── */}
        <div style={{ flex: 1 }}>

          {/* Basic Info */}
          <div style={styles.formSection}>
            <div style={styles.formSectionHeader}>
              <span style={styles.formSectionIcon}>👤</span>
              <h3 style={styles.formSectionTitle}>Basic Information</h3>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={styles.label}>Roll No (Auto-Generated)</label>
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <div style={styles.idBadge}>{form.roll_no}</div>
                <button type="button" style={styles.refreshBtn}
                  onClick={async () => { const r = await getUniqueRollNo(); setForm({ ...form, roll_no: r }) }}>
                  🔄 Regenerate
                </button>
              </div>
            </div>

            <div style={styles.formGrid}>
              {[
                { label: 'Full Name *', key: 'name', type: 'text', placeholder: 'e.g. Arjun Sharma' },
                { label: 'Email Address *', key: 'email', type: 'email', placeholder: 'student@school.com' },
                { label: 'Password *', key: 'password', type: 'password', placeholder: 'Min. 6 characters' },
                { label: 'Phone Number', key: 'phone', type: 'text', placeholder: '+91 XXXXX XXXXX' },
                { label: 'Date of Birth', key: 'birthday', type: 'date', placeholder: '' },
                { label: 'Address', key: 'address', type: 'text', placeholder: 'City, State' },
              ].map(field => (
                <div key={field.key} style={styles.formGroup}>
                  <label style={styles.label}>{field.label}</label>
                  <input style={styles.input} type={field.type} placeholder={field.placeholder}
                    value={form[field.key]} onChange={e => setForm({ ...form, [field.key]: e.target.value })} />
                </div>
              ))}
              <div style={styles.formGroup}>
                <label style={styles.label}>Gender</label>
                <select style={styles.input} value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Class & Section */}
          <div style={styles.formSection}>
            <div style={styles.formSectionHeader}>
              <span style={styles.formSectionIcon}>🏫</span>
              <h3 style={styles.formSectionTitle}>Class & Section</h3>
            </div>
            <div style={styles.formGrid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Class</label>
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
            </div>
          </div>

          {message && (
            <div style={{ ...styles.messageBox, backgroundColor: message.startsWith('✅') ? '#f0fdf4' : '#fef2f2', borderColor: message.startsWith('✅') ? '#86efac' : '#fca5a5', color: message.startsWith('✅') ? '#16a34a' : '#dc2626' }}>
              {message}
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button style={styles.submitBtn} onClick={handleAdd} disabled={loading}>
              {loading ? '⏳ Adding Student...' : '✅ Add Student'}
            </button>
            <button style={styles.cancelBtn} onClick={() => {
              setForm({ name: '', email: '', password: '', phone: '', gender: 'male', birthday: '', address: '', class_id: '', section_id: '', roll_no: generateRollNo() })
              setMessage('')
            }}>Reset</button>
          </div>
        </div>

        {/* ── Right: Tips Panel ── */}
        <div style={styles.tipsPanel}>
          <h4 style={styles.tipsPanelTitle}>💡 Quick Guide</h4>
          {[
            'Fill in basic info — name, email, and password are required.',
            'Roll No is auto-generated and used as the Student ID for login.',
            'Assign the correct class and section for proper management.',
            'Use CSV Import to add multiple students at once.',
          ].map((tip, i) => (
            <div key={i} style={styles.tipItem}>
              <span style={styles.tipNum}>{i + 1}</span>
              <span>{tip}</span>
            </div>
          ))}
          <div style={{ marginTop: '20px', padding: '12px', backgroundColor: '#fffbeb', borderRadius: '8px', border: '1px solid #fde68a' }}>
            <p style={{ fontSize: '12px', color: '#92400e', margin: 0 }}>⚠️ The student uses their Roll No and password to log in — not email.</p>
          </div>
        </div>
      </div>

      {showCSV && <CSVImport onClose={() => setShowCSV(false)} onDone={() => setShowCSV(false)} />}
    </div>
  )
}

// ─────────────────────────────────────────────
// SHOW STUDENTS
// ─────────────────────────────────────────────
function ShowStudents() {
  const { profile } = useAuth()
  const [classes, setClasses] = useState([])
  const [sections, setSections] = useState([])
  const [students, setStudents] = useState([])
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedSection, setSelectedSection] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [editStudent, setEditStudent] = useState(null)
  const [editSections, setEditSections] = useState([])
  const [deleteId, setDeleteId] = useState(null)
  const [page, setPage] = useState(1)
  const PER_PAGE = 9

  const avatarColors = ['#4f46e5', '#0891b2', '#059669', '#d97706', '#dc2626', '#7c3aed', '#db2777']

  useEffect(() => {
    supabase.from('classes').select('*').then(({ data }) => setClasses(data || []))
  }, [])

  const handleClassChange = async (classId) => {
    setSelectedClass(classId)
    setSelectedSection('')
    const { data } = await supabase.from('sections').select('*').eq('class_id', classId)
    setSections(data || [])
  }

  const fetchStudents = async (classId, sectionId) => {
    setLoading(true)
    setSearched(true)
    let query = supabase.from('students').select('*, profiles(name, uid, email, phone, gender), classes(name), sections(name)')
    if (classId) query = query.eq('class_id', classId)
    if (sectionId) query = query.eq('section_id', sectionId)
    const { data } = await query
    setStudents(data || [])
    setLoading(false)
    setPage(1)
  }

  // const confirmDelete = async () => {
  //   const id = deleteId
  //   setDeleteId(null)
  //   const student = students.find(s => s.id === id)
  //   await supabase.from('profiles').delete().eq('id', id)
  //   setStudents(students.filter(s => s.id !== id))
  //   await logActivity({
  //     performed_by: profile.id, performed_by_name: profile.name, role: 'admin',
  //     action: 'Student Deleted', target_type: 'student',
  //     target_name: student?.profiles?.name || 'Unknown',
  //     details: 'Student removed from system'
  //   })
  // }






  // const confirmDelete = async () => {
  //   const id = deleteId
  //   setDeleteId(null)
  //   const student = students.find(s => s.id === id)

  //   // Delete all related data first
  //   await supabase.from('attendance').delete().eq('student_id', id)
  //   await supabase.from('marks').delete().eq('student_id', id)
  //   await supabase.from('fee_assignments').delete().eq('student_id', id)
  //   await supabase.from('fee_payments').delete().eq('student_id', id)
  //   await supabase.from('feedback').delete().eq('student_id', id)
  //   await supabase.from('focus_logs').delete().eq('student_id', id)
  //   await supabase.from('assignment_analysis').delete().eq('student_id', id)
  //   await supabase.from('students').delete().eq('id', id)
  //   await supabase.from('profiles').delete().eq('id', id)

  //   // Delete from Supabase Auth (removes from Authentication > Users)
  //   await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`, {
  //     method: 'DELETE',
  //     headers: {
  //       'Content-Type': 'application/json',
  //       'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
  //     },
  //     body: JSON.stringify({ userId: id })
  //   })

  //   setStudents(students.filter(s => s.id !== id))
  //   await logActivity({
  //     performed_by: profile.id, performed_by_name: profile.name, role: 'admin',
  //     action: 'Student Deleted', target_type: 'student',
  //     target_name: student?.profiles?.name || 'Unknown',
  //     details: 'Student removed from system'
  //   })
  // }



  const confirmDelete = async () => {
  const id = deleteId
  setDeleteId(null)
  const student = students.find(s => s.id === id)

  // 1. Delete from Supabase Auth FIRST
  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({ userId: id })
  })
  const result = await res.json()
  console.log('Auth delete result:', result)

  // 2. Then delete from DB tables
  await supabase.from('attendance').delete().eq('student_id', id)
  await supabase.from('marks').delete().eq('student_id', id)
  await supabase.from('fee_assignments').delete().eq('student_id', id)
  await supabase.from('fee_payments').delete().eq('student_id', id)
  await supabase.from('feedback').delete().eq('student_id', id)
  await supabase.from('focus_logs').delete().eq('student_id', id)
  await supabase.from('assignment_analysis').delete().eq('student_id', id)
  await supabase.from('students').delete().eq('id', id)
  await supabase.from('profiles').delete().eq('id', id)

  // 3. Update UI
  setStudents(prev => prev.filter(s => s.id !== id))

  await logActivity({
    performed_by: profile.id, performed_by_name: profile.name, role: 'admin',
    action: 'Student Deleted', target_type: 'student',
    target_name: student?.profiles?.name || 'Unknown',
    details: 'Student removed from system'
  })
}

  const handleEdit = async () => {
    const { data: existing } = await supabase
      .from('students').select('id').eq('roll_no', editStudent.roll_no).neq('id', editStudent.id)
    if (existing && existing.length > 0) { alert('This Roll No is already assigned to another student!'); return }

    await supabase.from('profiles').update({
      name: editStudent.profiles?.name,
      email: editStudent.profiles?.email,
      phone: editStudent.profiles?.phone,
      gender: editStudent.profiles?.gender,
      birthday: editStudent.profiles?.birthday || null,
      address: editStudent.profiles?.address,
      uid: editStudent.roll_no,
    }).eq('id', editStudent.id)
    await supabase.from('students').update({
      roll_no: editStudent.roll_no,
      student_id: editStudent.roll_no,
      class_id: editStudent.class_id || null,
      section_id: editStudent.section_id || null,
    }).eq('id', editStudent.id)
    setStudents(students.map(s => s.id === editStudent.id ? editStudent : s))
    setEditStudent(null)
  }

  const handleEditOpen = async (s) => {
    setEditStudent(s)
    if (s.class_id) {
      const { data } = await supabase.from('sections').select('*').eq('class_id', s.class_id)
      setEditSections(data || [])
    }
  }

  const filtered = students.filter(s =>
    s.profiles?.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.profiles?.uid?.toLowerCase().includes(search.toLowerCase())
  )
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  const totalPages = Math.ceil(filtered.length / PER_PAGE)

  return (
    <div>
      {/* Filter bar */}
      <div style={styles.filterBox}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={styles.filterGroup}>
            <label style={styles.label}>Class</label>
            <select style={styles.input} value={selectedClass} onChange={e => handleClassChange(e.target.value)}>
              <option value="">-- All Classes --</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div style={styles.filterGroup}>
            <label style={styles.label}>Section</label>
            <select style={styles.input} value={selectedSection} onChange={e => setSelectedSection(e.target.value)}>
              <option value="">-- All Sections --</option>
              {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <button style={styles.findBtn} onClick={() => fetchStudents(selectedClass, selectedSection)}>🔍 Find</button>
          <button style={{ ...styles.findBtn, backgroundColor: '#22c55e' }} onClick={() => fetchStudents('', '')}>👥 All Students</button>
        </div>
      </div>

      {!searched ? (
        <div style={styles.emptyState}>
          <div style={{ fontSize: '56px', marginBottom: '12px' }}>🎓</div>
          <div style={{ fontWeight: '600', color: '#374151', fontSize: '16px', marginBottom: '4px' }}>Search for students</div>
          <div style={{ fontSize: '13px', color: '#9ca3af' }}>Select a class and section, or click "All Students"</div>
        </div>
      ) : (
        <>
          {/* Stats + Search row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1a1a2e', margin: 0 }}>
                Students <span style={{ color: '#9ca3af', fontWeight: '400' }}>({filtered.length})</span>
              </h3>
              {selectedClass && (
                <span style={{ fontSize: '12px', backgroundColor: '#ede9fe', color: '#6d28d9', padding: '3px 10px', borderRadius: '20px', fontWeight: '500' }}>
                  {classes.find(c => String(c.id) === String(selectedClass))?.name || ''}
                  {selectedSection && sections.find(s => String(s.id) === String(selectedSection)) ? ` - ${sections.find(s => String(s.id) === String(selectedSection))?.name}` : ''}
                </span>
              )}
            </div>
            <input
              style={{ ...styles.input, width: '220px' }}
              placeholder="Search by name or ID..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
            />
          </div>

          {/* Student Cards Grid */}
          {loading ? (
            <div style={styles.emptyState}>⏳ Loading students...</div>
          ) : paginated.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎓</div>
              <div style={{ fontWeight: '600', color: '#374151' }}>No students found</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
              {paginated.map((s, i) => {
                const color = avatarColors[i % avatarColors.length]
                const gender = s.profiles?.gender
                return (
                  <div key={s.id} style={styles.studentCard}>
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                      <div style={{ ...styles.avatar, backgroundColor: color }}>
                        {s.profiles?.name?.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: '700', fontSize: '14px', color: '#1a1a2e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.profiles?.name}</div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>Roll No: {s.roll_no}</div>
                      </div>
                      <div style={{ ...styles.genderBadge, backgroundColor: gender === 'female' ? '#fdf2f8' : '#eff6ff', color: gender === 'female' ? '#9d174d' : '#1e40af' }}>
                        {gender === 'female' ? '👩' : '👦'} {gender || 'N/A'}
                      </div>
                    </div>

                    {/* Info */}
                    <div style={{ marginBottom: '10px' }}>
                      <div style={styles.cardInfoItem}><span>📧</span><span style={{ fontSize: '12px', color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.profiles?.email || '—'}</span></div>
                      <div style={{ ...styles.cardInfoItem, marginTop: '4px' }}><span>📞</span><span style={{ fontSize: '12px', color: '#374151' }}>{s.profiles?.phone || '—'}</span></div>
                    </div>

                    {/* Class badge */}
                    <div style={{ marginBottom: '12px' }}>
                      {s.classes?.name ? (
                        <span style={styles.classPill}>
                          🏫 {s.classes.name}{s.sections?.name ? ` - ${s.sections.name}` : ''}
                        </span>
                      ) : (
                        <span style={{ fontSize: '12px', backgroundColor: '#fffbeb', color: '#92400e', padding: '3px 10px', borderRadius: '20px' }}>⚠️ No class assigned</span>
                      )}
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #f3f4f6', paddingTop: '10px' }}>
                      <button style={styles.cardEditBtn} onClick={() => handleEditOpen(s)}>✏️ Edit</button>
                      <button style={styles.cardDeleteBtn} onClick={() => setDeleteId(s.id)}>🗑 Delete</button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={styles.pagination}>
              <button style={styles.pageBtn} onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Prev</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} style={{ ...styles.pageBtn, ...(p === page ? styles.pageActive : {}) }} onClick={() => setPage(p)}>{p}</button>
              ))}
              <button style={styles.pageBtn} onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next →</button>
            </div>
          )}
        </>
      )}

      {/* Edit Modal */}
      {editStudent && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modal, width: '580px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{ ...styles.avatar, backgroundColor: '#4f46e5', width: '48px', height: '48px', fontSize: '20px' }}>{editStudent.profiles?.name?.charAt(0).toUpperCase()}</div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1a1a2e', margin: 0 }}>Edit Student</h3>
                <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>Update {editStudent.profiles?.name}'s information</p>
              </div>
            </div>

            <div style={styles.formGrid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Full Name</label>
                <input style={styles.input} value={editStudent.profiles?.name || ''}
                  onChange={e => setEditStudent({ ...editStudent, profiles: { ...editStudent.profiles, name: e.target.value } })} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Email</label>
                <input style={styles.input} type="email" value={editStudent.profiles?.email || ''}
                  onChange={e => setEditStudent({ ...editStudent, profiles: { ...editStudent.profiles, email: e.target.value } })} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Roll No</label>
                {/^1\d{2}\d{4}$/.test(editStudent.roll_no) ? (
                  <input style={{ ...styles.input, backgroundColor: '#f9fafb', color: '#6b7280' }} value={editStudent.roll_no} readOnly />
                ) : (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input style={{ ...styles.input, flex: 1 }} value={editStudent.roll_no || ''}
                      onChange={e => setEditStudent({ ...editStudent, roll_no: e.target.value })} />
                    <button type="button" style={styles.refreshBtn} onClick={async () => {
                      const year = new Date().getFullYear().toString().slice(2)
                      let roll, exists = true
                      while (exists) {
                        roll = '1' + year + (Math.floor(Math.random() * 9000) + 1000)
                        const { data } = await supabase.from('students').select('id').eq('roll_no', roll)
                        exists = data && data.length > 0
                      }
                      setEditStudent({ ...editStudent, roll_no: roll })
                    }}>🔄</button>
                  </div>
                )}
                {!/^1\d{2}\d{4}$/.test(editStudent.roll_no) && (
                  <p style={{ fontSize: '11px', color: '#ef4444', margin: '2px 0 0' }}>⚠️ Invalid format — use 🔄 to auto-generate</p>
                )}
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Phone</label>
                <input style={styles.input} value={editStudent.profiles?.phone || ''}
                  onChange={e => setEditStudent({ ...editStudent, profiles: { ...editStudent.profiles, phone: e.target.value } })} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Gender</label>
                <select style={styles.input} value={editStudent.profiles?.gender || 'male'}
                  onChange={e => setEditStudent({ ...editStudent, profiles: { ...editStudent.profiles, gender: e.target.value } })}>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Birthday</label>
                <input style={styles.input} type="date" value={editStudent.profiles?.birthday?.slice(0, 10) || ''}
                  onChange={e => setEditStudent({ ...editStudent, profiles: { ...editStudent.profiles, birthday: e.target.value } })} />
              </div>
            </div>

            <div style={{ ...styles.formGroup, marginTop: '12px' }}>
              <label style={styles.label}>Address</label>
              <input style={styles.input} value={editStudent.profiles?.address || ''}
                onChange={e => setEditStudent({ ...editStudent, profiles: { ...editStudent.profiles, address: e.target.value } })} />
            </div>

            <div style={styles.formGrid2}>
              <div style={{ ...styles.formGroup, marginTop: '12px' }}>
                <label style={styles.label}>Class</label>
                <select style={styles.input} value={editStudent.class_id || ''}
                  onChange={async e => {
                    const cid = e.target.value
                    const { data } = await supabase.from('sections').select('*').eq('class_id', cid)
                    setEditSections(data || [])
                    setEditStudent({ ...editStudent, class_id: cid, section_id: '' })
                  }}>
                  <option value="">-- Select Class --</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div style={{ ...styles.formGroup, marginTop: '12px' }}>
                <label style={styles.label}>Section</label>
                <select style={styles.input} value={editStudent.section_id || ''}
                  onChange={e => setEditStudent({ ...editStudent, section_id: e.target.value })}>
                  <option value="">-- Select Section --</option>
                  {editSections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #f3f4f6' }}>
              <button style={styles.cancelBtn} onClick={() => setEditStudent(null)}>Cancel</button>
              <button style={styles.submitBtn} onClick={handleEdit}>💾 Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteId && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modal, width: '360px', textAlign: 'center' }}>
            <div style={{ fontSize: '52px', marginBottom: '8px' }}>⚠️</div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1a1a2e', margin: '0 0 8px' }}>Delete Student?</h3>
            <p style={{ color: '#6b7280', fontSize: '14px', margin: '0 0 20px' }}>This will permanently remove the student and all their data. Cannot be undone.</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button style={styles.cancelBtn} onClick={() => setDeleteId(null)}>Cancel</button>
              <button style={{ ...styles.submitBtn, backgroundColor: '#ef4444' }} onClick={confirmDelete}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// STUDENT FEEDBACK
// ─────────────────────────────────────────────
function StudentFeedback() {
  const [classes, setClasses] = useState([])
  const [sections, setSections] = useState([])
  const [students, setStudents] = useState([])
  const [feedbacks, setFeedbacks] = useState([])
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedSection, setSelectedSection] = useState('')
  const [selectedStudent, setSelectedStudent] = useState('')
  const [newFeedback, setNewFeedback] = useState('')
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    supabase.from('classes').select('*').then(({ data }) => setClasses(data || []))
  }, [])

  const handleClassChange = async (classId) => {
    setSelectedClass(classId)
    setSelectedSection('')
    setSelectedStudent('')
    setStudents([])
    const { data } = await supabase.from('sections').select('*').eq('class_id', classId)
    setSections(data || [])
  }

  const handleSectionChange = async (sectionId) => {
    setSelectedSection(sectionId)
    setSelectedStudent('')
    const { data } = await supabase.from('students').select('id, profiles(name)').eq('section_id', sectionId)
    setStudents(data || [])
  }

  const handleFind = async () => {
    if (!selectedStudent) return
    setLoading(true)
    setSearched(true)
    const { data } = await supabase
      .from('feedback')
      .select('*, profiles(name)')
      .eq('student_id', selectedStudent)
      .order('created_at', { ascending: false })
    setFeedbacks(data || [])
    setLoading(false)
  }

  const sendFeedback = async () => {
    if (!newFeedback.trim() || !selectedStudent) return
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase.from('feedback').insert({
      student_id: selectedStudent,
      class_id: selectedClass || null,
      section_id: selectedSection || null,
      message: newFeedback.trim(),
      sent_by: user.id,
    }).select('*, profiles(name)').single()
    if (data) { setFeedbacks([data, ...feedbacks]); setNewFeedback('') }
  }

  const selectedStudentName = students.find(s => s.id === selectedStudent)?.profiles?.name

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#1a1a2e', margin: '0 0 2px' }}>💬 Student Feedback</h2>
        <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>Select a student to view or send feedback</p>
      </div>

      {/* Filter */}
      <div style={styles.filterBox}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={styles.filterGroup}>
            <label style={styles.label}>Class</label>
            <select style={styles.input} value={selectedClass} onChange={e => handleClassChange(e.target.value)}>
              <option value="">-- Select Class --</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div style={styles.filterGroup}>
            <label style={styles.label}>Section</label>
            <select style={styles.input} value={selectedSection} onChange={e => handleSectionChange(e.target.value)}>
              <option value="">-- Select Section --</option>
              {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div style={styles.filterGroup}>
            <label style={styles.label}>Student</label>
            <select style={styles.input} value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)}>
              <option value="">-- Select Student --</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.profiles?.name}</option>)}
            </select>
          </div>
          <button style={styles.findBtn} onClick={handleFind} disabled={!selectedStudent}>🔍 Load Feedback</button>
        </div>
      </div>

      {!searched ? (
        <div style={styles.emptyState}>
          <div style={{ fontSize: '56px', marginBottom: '12px' }}>💬</div>
          <div style={{ fontWeight: '600', color: '#374151', fontSize: '16px', marginBottom: '4px' }}>No student selected</div>
          <div style={{ fontSize: '13px', color: '#9ca3af' }}>Pick a class, section, and student above to load feedback</div>
        </div>
      ) : (
        <div style={{ marginTop: '4px' }}>
          {/* Student header */}
          {selectedStudentName && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', backgroundColor: '#f5f3ff', borderRadius: '10px', marginBottom: '16px', border: '1px solid #ddd6fe' }}>
              <div style={{ ...styles.avatar, backgroundColor: '#4f46e5', width: '40px', height: '40px', fontSize: '16px' }}>{selectedStudentName.charAt(0).toUpperCase()}</div>
              <div>
                <div style={{ fontWeight: '700', fontSize: '14px', color: '#1a1a2e' }}>{selectedStudentName}</div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>{feedbacks.length} feedback message{feedbacks.length !== 1 ? 's' : ''}</div>
              </div>
            </div>
          )}

          {/* Input */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '16px' }}>
            <input style={{ ...styles.input, flex: 1 }} placeholder="Write a feedback message and press Enter or Send..."
              value={newFeedback} onChange={e => setNewFeedback(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendFeedback()} />
            <button style={styles.submitBtn} onClick={sendFeedback}>Send</button>
          </div>

          {/* Feedback list */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>⏳ Loading feedback...</div>
          ) : feedbacks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '40px', marginBottom: '10px' }}>📭</div>
              <div style={{ color: '#9ca3af', fontSize: '14px' }}>No feedback yet for this student</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {feedbacks.map(f => (
                <div key={f.id} style={styles.feedbackItem}>
                  <p style={{ margin: 0, fontSize: '14px', color: '#374151', lineHeight: '1.5' }}>{f.message}</p>
                  <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#9ca3af' }}>
                    {new Date(f.created_at).toLocaleString('en-IN')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────
const styles = {
  pageHeader: { marginBottom: '24px' },
  pageTitle: { fontSize: '28px', fontWeight: '800', color: '#1a1a2e', margin: '0 0 4px' },
  pageSubtitle: { fontSize: '14px', color: '#6b7280', margin: 0 },
  card: { backgroundColor: '#fff', borderRadius: '16px', padding: '28px', boxShadow: '0 1px 8px rgba(0,0,0,0.07)' },
  tabs: { display: 'flex', gap: '4px', borderBottom: '1px solid #e5e7eb', marginBottom: '28px' },
  tab: { padding: '10px 18px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', transition: 'all 0.2s', borderRadius: '8px 8px 0 0' },

  // Form
  formSection: { backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', marginBottom: '16px' },
  formSectionHeader: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' },
  formSectionIcon: { fontSize: '18px' },
  formSectionTitle: { fontSize: '14px', fontWeight: '700', color: '#374151', margin: 0 },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' },
  formGrid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '12px', fontWeight: '600', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px' },
  input: { padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', outline: 'none', backgroundColor: '#fff' },
  idBadge: { padding: '10px 16px', backgroundColor: '#ede9fe', color: '#6d28d9', borderRadius: '8px', fontSize: '18px', fontWeight: '800', letterSpacing: '2px', border: '1px solid #ddd6fe' },
  refreshBtn: { padding: '8px 14px', backgroundColor: '#e5e7eb', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' },
  submitBtn: { padding: '11px 24px', borderRadius: '8px', border: 'none', backgroundColor: '#4f46e5', color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
  cancelBtn: { padding: '10px 20px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: '14px' },
  messageBox: { padding: '12px 16px', borderRadius: '8px', border: '1px solid', fontSize: '14px', fontWeight: '500', marginBottom: '8px' },
  csvBtn: { padding: '9px 18px', backgroundColor: '#0ea5e9', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' },

  // Tips
  tipsPanel: { width: '240px', flexShrink: 0, backgroundColor: '#f0f4ff', border: '1px solid #c7d2fe', borderRadius: '12px', padding: '20px' },
  tipsPanelTitle: { fontSize: '14px', fontWeight: '700', color: '#3730a3', margin: '0 0 16px' },
  tipItem: { display: 'flex', gap: '10px', marginBottom: '14px', fontSize: '13px', color: '#4338ca', lineHeight: '1.5' },
  tipNum: { width: '22px', height: '22px', backgroundColor: '#4f46e5', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', flexShrink: 0 },

  // Filter
  filterBox: { backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '16px', marginBottom: '20px' },
  filterGroup: { display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '160px' },
  findBtn: { padding: '10px 20px', backgroundColor: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', alignSelf: 'flex-end' },

  // Student cards
  studentCard: { backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px' },
  avatar: { width: '44px', height: '44px', borderRadius: '50%', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: '700', flexShrink: 0 },
  genderBadge: { padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', flexShrink: 0 },
  cardInfoItem: { display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' },
  classPill: { backgroundColor: '#dbeafe', color: '#1e40af', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '500' },
  cardEditBtn: { flex: 1, padding: '7px', backgroundColor: '#22c55e', color: '#fff', border: 'none', borderRadius: '7px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', textAlign: 'center' },
  cardDeleteBtn: { flex: 1, padding: '7px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '7px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', textAlign: 'center' },

  // Pagination
  pagination: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', marginTop: '24px' },
  pageBtn: { padding: '7px 14px', borderRadius: '7px', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: '13px' },
  pageActive: { backgroundColor: '#4f46e5', color: '#fff', border: '1px solid #4f46e5' },

  // Modal
  modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  modal: { backgroundColor: '#fff', borderRadius: '16px', padding: '28px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' },

  // Empty state
  emptyState: { textAlign: 'center', padding: '60px 0', color: '#9ca3af', fontSize: '14px' },

  // Feedback
  feedbackItem: { backgroundColor: '#f9fafb', borderRadius: '8px', padding: '12px 16px', borderLeft: '4px solid #4f46e5' },
}

