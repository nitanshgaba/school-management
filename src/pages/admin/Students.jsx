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

        {activeTab === 'Add Students' && <AddStudents />}
        {activeTab === 'Show Students' && <ShowStudents />}
        {activeTab === 'Feedback' && <StudentFeedback />}
      </div>
    </div>
  )
}

function AddStudents() {
  const { profile } = useAuth()
  const [showForm, setShowForm] = useState(false)
  const [showRemove, setShowRemove] = useState(false)
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
    if (!form.name || !form.password) {
      setMessage('Name and password are required.')
      return
    }
    setLoading(true)
    setMessage('')

    if (!form.email) {
      setMessage('Email is required.')
      setLoading(false)
      return
    }
    const roll_no = form.roll_no
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
      body: JSON.stringify({ email: form.email, password: form.password }),
    })
    const authResult = await res.json()
    if (authResult.error) {
      setMessage(authResult.error)
      setLoading(false)
      return
    }

    const userId = authResult.user?.id
    const studentId = roll_no

    const { error: profileError } = await supabase.from('profiles').insert({
      id: userId,
      uid: studentId,
      role: 'student',
      name: form.name,
      email: form.email,
      phone: form.phone,
      gender: form.gender,
      birthday: form.birthday || null,
      address: form.address,
    })

    if (profileError) {
      setMessage(profileError.message)
      setLoading(false)
      return
    }

    await supabase.from('students').insert({
      id: userId,
      student_id: studentId,
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
      <div style={styles.sectionHeader}>
        <h2 style={styles.sectionTitle}>📋 Students</h2>
        <button onClick={()=>setShowCSV(true)} style={{ padding:'8px 16px', background:'#0ea5e9', color:'#fff', border:'none', borderRadius:'8px', fontSize:'13px', fontWeight:'700', cursor:'pointer' }}>📥 Import CSV</button>
      </div>

      {!showForm && !showRemove ? (
        <div style={styles.actionCards}>
          <div style={styles.actionCard} onClick={() => setShowForm(true)}>
            <div style={{ ...styles.actionIcon, backgroundColor: '#dcfce7' }}>
              <span style={{ fontSize: '28px' }}>👨‍🎓</span>
            </div>
            <span style={styles.actionLabel}>Add Student</span>
          </div>
          <div style={styles.actionCard} onClick={() => setShowRemove(true)}>
            <div style={{ ...styles.actionIcon, backgroundColor: '#fee2e2' }}>
              <span style={{ fontSize: '28px' }}>🗑</span>
            </div>
            <span style={styles.actionLabel}>Remove Student</span>
          </div>
        </div>
      ) : showForm ? (
        <div style={styles.form}>
          <h3 style={styles.formTitle}>Add New Student</h3>
          {[
            { label: 'Full Name *', key: 'name', type: 'text' },
            { label: 'Email *', key: 'email', type: 'email' },
            { label: 'Password *', key: 'password', type: 'password' },
          ].map(field => (
            <div key={field.key} style={styles.formGroup}>
              <label style={styles.label}>{field.label}</label>
              <input style={styles.input} type={field.type} value={form[field.key]} onChange={e => setForm({ ...form, [field.key]: e.target.value })} />
            </div>
          ))}
          <div style={styles.formGroup}>
            <label style={styles.label}>Roll No (Auto Generated)</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input style={{ ...styles.input, flex: 1, backgroundColor: '#f9fafb', color: '#6b7280' }} value={form.roll_no} readOnly />
              <button type="button" style={{ padding: '10px 14px', backgroundColor: '#e5e7eb', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '18px' }} onClick={async () => { const r = await getUniqueRollNo(); setForm({ ...form, roll_no: r }) }}>🔄</button>
            </div>
          </div>
          {[
            { label: 'Phone', key: 'phone', type: 'text' },
            { label: 'Birthday', key: 'birthday', type: 'date' },
            { label: 'Address', key: 'address', type: 'text' },
          ].map(field => (
            <div key={field.key} style={styles.formGroup}>
              <label style={styles.label}>{field.label}</label>
              <input
                style={styles.input}
                type={field.type}
                value={form[field.key]}
                onChange={e => setForm({ ...form, [field.key]: e.target.value })}
              />
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
          {message && <p style={{ color: message.startsWith('✅') ? '#22c55e' : '#ef4444', fontSize: '14px' }}>{message}</p>}
          <div style={styles.formButtons}>
            <button style={styles.cancelBtn} onClick={() => { setShowForm(false); setMessage('') }}>Cancel</button>
            <button style={styles.submitBtn} onClick={handleAdd} disabled={loading}>
              {loading ? 'Adding...' : 'Add Student'}
            </button>
          </div>
        </div>
      ) : (
        <RemoveStudent onCancel={() => setShowRemove(false)} />
      )}
      {showCSV && <CSVImport onClose={()=>setShowCSV(false)} onDone={()=>setShowCSV(false)} />}
    </div>
  )
}

function RemoveStudent({ onCancel }) {
  const [students, setStudents] = useState([])
  const [selected, setSelected] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    supabase.from('profiles').select('id, name, uid').eq('role', 'student').then(({ data }) => setStudents(data || []))
  }, [])

  const handleRemove = async () => {
    if (!selected) return
    setLoading(true)
    // deleted via cascade
    await supabase.from('profiles').delete().eq('id', selected)
    setMessage('✅ Student removed successfully.')
    setStudents(students.filter(s => s.id !== selected))
    setSelected('')
    setLoading(false)
  }

  return (
    <div style={styles.form}>
      <h3 style={styles.formTitle}>Remove Student</h3>
      <div style={styles.formGroup}>
        <label style={styles.label}>Select Student</label>
        <select style={styles.input} value={selected} onChange={e => setSelected(e.target.value)}>
          <option value="">-- Select --</option>
          {students.map(s => (
            <option key={s.id} value={s.id}>{s.name} ({s.uid})</option>
          ))}
        </select>
      </div>
      {message && <p style={{ color: '#22c55e', fontSize: '14px' }}>{message}</p>}
      <div style={styles.formButtons}>
        <button style={styles.cancelBtn} onClick={onCancel}>Cancel</button>
        <button style={{ ...styles.submitBtn, backgroundColor: '#ef4444' }} onClick={handleRemove} disabled={loading || !selected}>
          {loading ? 'Removing...' : 'Remove Student'}
        </button>
      </div>
    </div>
  )
}

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
  const [page, setPage] = useState(1)
  const PER_PAGE = 10

  useEffect(() => {
    supabase.from('classes').select('*').then(({ data }) => setClasses(data || []))
  }, [])

  const handleClassChange = async (classId) => {
    setSelectedClass(classId)
    setSelectedSection('')
    const { data } = await supabase.from('sections').select('*').eq('class_id', classId)
    setSections(data || [])
  }

  const handleFind = async () => {
    setLoading(true)
    setSearched(true)
    let query = supabase.from('students').select('*, profiles(name, uid, email, phone), classes(name), sections(name)')
    if (selectedClass) query = query.eq('class_id', selectedClass)
    if (selectedSection) query = query.eq('section_id', selectedSection)
    const { data } = await query
    setStudents(data || [])
    setLoading(false)
    setPage(1)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure?')) return
    const student = students.find(s => s.id === id)
    await supabase.from('profiles').delete().eq('id', id)
    setStudents(students.filter(s => s.id !== id))
    await logActivity({
      performed_by: profile.id, performed_by_name: profile.name, role: 'admin',
      action: 'Student Deleted', target_type: 'student',
      target_name: student?.profiles?.name || 'Unknown',
      details: `Student removed from system`
    })
  }

  const handleEdit = async () => {
    // Check roll_no uniqueness (exclude current student)
    const { data: existing } = await supabase
      .from('students')
      .select('id')
      .eq('roll_no', editStudent.roll_no)
      .neq('id', editStudent.id)
    if (existing && existing.length > 0) {
      alert('❌ This Roll No is already assigned to another student!')
      return
    }
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
      {editStudent && (
        <div style={styles.modalOverlay}>
          <div style={{...styles.modal, width: '560px', maxHeight: '90vh', overflowY: 'auto'}}>
            <h3 style={styles.formTitle}>Edit Student</h3>
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
                <input style={{...styles.input, backgroundColor: '#f9fafb', color: '#6b7280'}} value={editStudent.roll_no} readOnly />
              ) : (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input style={{...styles.input, flex: 1}} value={editStudent.roll_no || ''}
                    onChange={e => setEditStudent({ ...editStudent, roll_no: e.target.value })} />
                  <button type="button" style={{ padding: '10px 14px', backgroundColor: '#e5e7eb', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '18px' }}
                    onClick={async () => {
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
              <input style={styles.input} type="date" value={editStudent.profiles?.birthday?.slice(0,10) || ''}
                onChange={e => setEditStudent({ ...editStudent, profiles: { ...editStudent.profiles, birthday: e.target.value } })} />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Address</label>
              <input style={styles.input} value={editStudent.profiles?.address || ''}
                onChange={e => setEditStudent({ ...editStudent, profiles: { ...editStudent.profiles, address: e.target.value } })} />
            </div>
            <div style={styles.formGroup}>
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
            <div style={styles.formGroup}>
              <label style={styles.label}>Section</label>
              <select style={styles.input} value={editStudent.section_id || ''}
                onChange={e => setEditStudent({ ...editStudent, section_id: e.target.value })}>
                <option value="">-- Select Section --</option>
                {editSections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div style={styles.formButtons}>
              <button style={styles.cancelBtn} onClick={() => setEditStudent(null)}>Cancel</button>
              <button style={styles.submitBtn} onClick={handleEdit}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      <div style={styles.filterBox}>
        <h2 style={styles.sectionTitle}>Students List</h2>
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
          <button style={{ ...styles.findBtn, backgroundColor: '#22c55e' }} onClick={() => {
            setSelectedClass('')
            setSelectedSection('')
            setSections([])
            setSearched(true)
            setLoading(true)
            supabase.from('students').select('*, profiles(name, uid, email, phone), classes(name), sections(name)').then(({ data }) => {
              setStudents(data || [])
              setLoading(false)
              setPage(1)
            })
          }}>👥 All Students</button>
        </div>
      </div>

      {searched && (
        <>
          <div style={styles.tableHeader}>
            <h2 style={styles.sectionTitle}>📋 Students List</h2>
            <div style={styles.searchRow}>
              <input style={styles.searchInput} placeholder="Search..."
                value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
              <button style={styles.searchBtn}>🔍</button>
            </div>
          </div>

          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>#</th>
                <th style={styles.th}>Student ID</th>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} style={styles.emptyCell}>Loading...</td></tr>
              ) : paginated.length === 0 ? (
                <tr><td colSpan={4} style={styles.emptyCell}>No students found</td></tr>
              ) : (
                paginated.map((s, i) => (
                  <tr key={s.id}>
                    <td style={styles.td}>{(page - 1) * PER_PAGE + i + 1}.</td>
                    <td style={styles.td}>{s.roll_no || s.profiles?.uid}</td>
                    <td style={styles.td}>
                      <div style={styles.nameCell}>
                        <div style={styles.miniAvatar}>{s.profiles?.name?.charAt(0).toUpperCase()}</div>
                        {s.profiles?.name}
                      </div>
                    </td>
                    <td style={styles.td}>{s.classes?.name || '—'} {s.sections?.name && `- ${s.sections.name}`}</td>
                    <td style={styles.td}>
                      <div style={styles.actionBtns}>
                        <button style={styles.editBtn} onClick={() => handleEditOpen(s)}>✏️ Edit</button>
                        <button style={styles.deleteBtn} onClick={() => handleDelete(s.id)}>🗑 Delete</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div style={styles.pagination}>
              <button style={styles.pageBtn} onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>prev</button>
              <span style={styles.pageNum}>{page}</span>
              <button style={styles.pageBtn} onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>next</button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

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
    if (data) {
      setFeedbacks([data, ...feedbacks])
      setNewFeedback('')
    }
  }

  return (
    <div>
      <div style={styles.sectionHeader}>
        <h2 style={styles.sectionTitle}>💬 Student Feedback</h2>
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
          <button style={styles.findBtn} onClick={handleFind}>🔍 Find</button>
          <button style={{ ...styles.findBtn, backgroundColor: '#22c55e' }} onClick={() => {
            setSelectedClass('')
            setSelectedSection('')
            setSections([])
            setSearched(true)
            setLoading(true)
            supabase.from('students').select('*, profiles(name, uid, email, phone), classes(name), sections(name)').then(({ data }) => {
              setStudents(data || [])
              setLoading(false)
              setPage(1)
            })
          }}>👥 All Students</button>
        </div>
      </div>

      {!searched ? (
        <div style={styles.emptyState}>
          <div style={{ fontSize: '64px' }}>💬</div>
          <p style={{ color: '#9ca3af', marginTop: '12px' }}>Send Feedbacks</p>
        </div>
      ) : (
        <div style={{ marginTop: '20px' }}>
          <div style={styles.feedbackInputRow}>
            <input style={{ ...styles.input, flex: 1 }} placeholder="Write feedback..."
              value={newFeedback} onChange={e => setNewFeedback(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendFeedback()} />
            <button style={styles.submitBtn} onClick={sendFeedback}>Send</button>
          </div>
          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {loading ? <p style={{ color: '#9ca3af' }}>Loading...</p> :
              feedbacks.length === 0 ? <p style={{ color: '#9ca3af' }}>No feedback yet.</p> :
                feedbacks.map(f => (
                  <div key={f.id} style={styles.feedbackItem}>
                    <p style={{ margin: 0, fontSize: '14px', color: '#374151' }}>{f.message}</p>
                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#9ca3af' }}>
                      {new Date(f.created_at).toLocaleString('en-IN')}
                    </p>
                  </div>
                ))
            }
          </div>
        </div>
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
  actionCards: { display: 'flex', gap: '20px', padding: '20px 0' },
  actionCard: { border: '2px solid #e5e7eb', borderRadius: '12px', padding: '32px 48px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', cursor: 'pointer', minWidth: '180px' },
  actionIcon: { width: '64px', height: '64px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: '16px', fontWeight: '600', color: '#374151' },
  form: { maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '16px', padding: '8px 0' },
  formTitle: { fontSize: '18px', fontWeight: '700', color: '#1a1a2e', marginBottom: '8px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: '600', color: '#374151' },
  input: { padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', outline: 'none' },
  formButtons: { display: 'flex', gap: '12px', marginTop: '8px' },
  cancelBtn: { padding: '10px 20px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: '14px' },
  submitBtn: { padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#4f46e5', color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
  filterBox: { backgroundColor: '#f9fafb', borderRadius: '10px', padding: '16px', marginBottom: '20px' },
  filterRow: { display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' },
  filterGroup: { display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '160px' },
  findBtn: { padding: '10px 20px', backgroundColor: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', height: '40px' },
  tableHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  searchRow: { display: 'flex', gap: '8px' },
  searchInput: { padding: '8px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', outline: 'none', width: '200px' },
  searchBtn: { padding: '8px 12px', backgroundColor: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', fontSize: '13px', color: '#6b7280', fontWeight: '600', padding: '10px 12px', borderBottom: '2px solid #f3f4f6' },
  td: { padding: '12px', fontSize: '14px', color: '#374151', borderBottom: '1px solid #f9fafb' },
  emptyCell: { padding: '24px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' },
  nameCell: { display: 'flex', alignItems: 'center', gap: '10px' },
  miniAvatar: { width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#4f46e5', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700' },
  actionBtns: { display: 'flex', gap: '8px' },
  editBtn: { padding: '6px 12px', backgroundColor: '#22c55e', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' },
  deleteBtn: { padding: '6px 12px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' },
  pagination: { display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px', marginTop: '16px' },
  pageBtn: { padding: '6px 12px', borderRadius: '6px', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: '13px' },
  pageNum: { padding: '6px 12px', borderRadius: '6px', backgroundColor: '#4f46e5', color: '#fff', fontSize: '13px' },
  modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  modal: { backgroundColor: '#fff', borderRadius: '12px', padding: '28px', width: '420px', display: 'flex', flexDirection: 'column', gap: '16px' },
  emptyState: { textAlign: 'center', padding: '60px 0' },
  feedbackInputRow: { display: 'flex', gap: '12px', alignItems: 'center' },
  feedbackItem: { backgroundColor: '#f9fafb', borderRadius: '8px', padding: '12px 16px', borderLeft: '4px solid #4f46e5' },
}