import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

const TABS = ['Add Teacher', 'Show Teachers', 'Teachers Leave']

const STANDARD_SUBJECTS = [
  'Accountancy', 'Art', 'Biology', 'Business Studies', 'Chemistry',
  'Civics', 'Computer Science', 'Drawing', 'Economics', 'English',
  'Environmental Science', 'EVS', 'French', 'General Knowledge',
  'Geography', 'Hindi', 'History', 'Information Technology',
  'Mathematics', 'Moral Science', 'Music', 'Physical Education',
  'Physics', 'Punjabi', 'Sanskrit', 'Science', 'Social Studies'
]

export default function Teachers() {
  const [activeTab, setActiveTab] = useState('Add Teacher')

  return (
    <div>
      <div style={styles.pageHeader}>
        <h1 style={styles.pageTitle}>Teachers</h1>
        <p style={styles.pageSubtitle}>Manage faculty, assignments and leave requests</p>
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
              {tab === 'Add Teacher' && '➕ '}
              {tab === 'Show Teachers' && '👥 '}
              {tab === 'Teachers Leave' && '📋 '}
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'Add Teacher' && <AddTeacher />}
        {activeTab === 'Show Teachers' && <ShowTeachers />}
        {activeTab === 'Teachers Leave' && <TeachersLeave />}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// ADD TEACHER
// ─────────────────────────────────────────────
function AddTeacher() {
  const [teacherId, setTeacherId] = useState('')
  const [classes, setClasses] = useState([])
  const [sections, setSections] = useState([])
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedSections, setSelectedSections] = useState([])
  const [assignments, setAssignments] = useState([])
  const [selectedSubjectNames, setSelectedSubjectNames] = useState([]) // store names not IDs
  const [form, setForm] = useState({ name: '', password: '', email: '', phone: '', gender: 'male', birthday: '', address: '' })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const generateUniqueTeacherId = async () => {
    const year = new Date().getFullYear().toString().slice(2)
    let id, exists = true
    while (exists) {
      id = '2' + year + (Math.floor(Math.random() * 900) + 100)
      const { data } = await supabase.from('teachers').select('id').eq('teacher_id', id)
      exists = data && data.length > 0
    }
    return id
  }

  useEffect(() => {
    generateUniqueTeacherId().then(id => setTeacherId(id))
    supabase.from('classes').select('*').then(({ data }) => setClasses(data || []))
  }, [])

  const handleClassChange = async (classId) => {
    setSelectedClass(classId)
    setSelectedSections([])
    const { data } = await supabase.from('sections').select('*').eq('class_id', classId)
    setSections(data || [])
  }

  const addAssignment = () => {
    if (!selectedClass) return
    const cls = classes.find(c => String(c.id) === String(selectedClass))
    if (selectedSections.length === 0) {
      const already = assignments.find(a => String(a.class_id) === String(selectedClass) && !a.section_id)
      if (already) return
      setAssignments([...assignments, { class_id: selectedClass, class_name: cls?.name, section_id: null, section_name: 'All Sections' }])
    } else {
      const newOnes = selectedSections
        .filter(sid => !assignments.find(a => String(a.class_id) === String(selectedClass) && String(a.section_id) === String(sid)))
        .map(sid => {
          const sec = sections.find(s => String(s.id) === String(sid))
          return { class_id: selectedClass, class_name: cls?.name, section_id: sid, section_name: sec?.name }
        })
      setAssignments([...assignments, ...newOnes])
    }
    setSelectedClass('')
    setSelectedSections([])
    setSections([])
  }

  const removeAssignment = (index) => setAssignments(assignments.filter((_, i) => i !== index))

  const handleAdd = async () => {
    if (!form.name || !form.password) { setMessage('Name and password are required.'); return }
    if (!form.email) { setMessage('Email is required.'); return }
    setLoading(true)
    setMessage('')

    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
      body: JSON.stringify({ email: form.email, password: form.password }),
    })
    const authResult = await res.json()
    if (authResult.error) { setMessage(authResult.error); setLoading(false); return }

    const userId = authResult.user?.id
    const finalTeacherId = teacherId

    const { error: profileError } = await supabase.from('profiles').insert({
      id: userId, uid: finalTeacherId, role: 'teacher',
      name: form.name, email: form.email, phone: form.phone,
      gender: form.gender, birthday: form.birthday || null, address: form.address,
    })
    if (profileError) { setMessage(profileError.message); setLoading(false); return }

    await supabase.from('teachers').insert({ id: userId, teacher_id: finalTeacherId })

    // Insert class assignments
    if (assignments.length > 0) {
      const rows = assignments.map(a => ({ teacher_id: userId, class_id: parseInt(a.class_id), section_id: a.section_id || null }))
      await supabase.from('teacher_classes').insert(rows)
    }

    // Create subject rows: one per subject per assigned class
    if (selectedSubjectNames.length > 0 && assignments.length > 0) {
      const subjectRows = []
      for (const subName of selectedSubjectNames) {
        for (const assignment of assignments) {
          subjectRows.push({
            name: subName,
            class_id: parseInt(assignment.class_id),
            teacher_id: userId,
          })
        }
      }
      await supabase.from('subjects').insert(subjectRows)
    } else if (selectedSubjectNames.length > 0) {
      // No class assigned yet — insert without class_id
      const subjectRows = selectedSubjectNames.map(name => ({ name, teacher_id: userId }))
      await supabase.from('subjects').insert(subjectRows)
    }

    setMessage(`✅ Teacher added! Teacher ID: ${finalTeacherId}`)
    setForm({ name: '', email: '', phone: '', gender: 'male', birthday: '', address: '', password: '' })
    setTeacherId(await generateUniqueTeacherId())
    setAssignments([])
    setSelectedClass('')
    setSelectedSections([])
    setSelectedSubjectNames([])
    setLoading(false)
  }

  return (
    <div style={{ display: 'flex', gap: '28px', alignItems: 'flex-start' }}>
      <div style={{ flex: 1 }}>

        {/* Basic Info */}
        <div style={styles.formSection}>
          <div style={styles.formSectionHeader}>
            <span style={styles.formSectionIcon}>👤</span>
            <h3 style={styles.formSectionTitle}>Basic Information</h3>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={styles.label}>Teacher ID (Auto-Generated)</label>
            <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
              <div style={styles.idBadge}>{teacherId}</div>
              <button type="button" style={styles.refreshBtn}
                onClick={async () => setTeacherId(await generateUniqueTeacherId())}>
                🔄 Regenerate
              </button>
            </div>
          </div>

          <div style={styles.formGrid}>
            {[
              { label: 'Full Name *', key: 'name', type: 'text', placeholder: 'e.g. Rajesh Kumar' },
              { label: 'Email Address *', key: 'email', type: 'email', placeholder: 'teacher@school.com' },
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

        {/* Subject Assignments */}
        <div style={styles.formSection}>
          <div style={styles.formSectionHeader}>
            <span style={styles.formSectionIcon}>📚</span>
            <h3 style={styles.formSectionTitle}>Subject Assignments</h3>
          </div>
          <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 10px' }}>
            Subjects will be created for each class you assign below
          </p>
          <select style={styles.input} value="" onChange={e => {
            const name = e.target.value
            if (name && !selectedSubjectNames.includes(name)) setSelectedSubjectNames([...selectedSubjectNames, name])
          }}>
            <option value="">-- Select subjects to assign --</option>
            {STANDARD_SUBJECTS.map(name => <option key={name} value={name}>{name}</option>)}
          </select>
          {selectedSubjectNames.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
              {selectedSubjectNames.map(name => (
                <div key={name} style={styles.tagGreen}>
                  📖 {name}
                  <span style={styles.tagRemove} onClick={() => setSelectedSubjectNames(selectedSubjectNames.filter(s => s !== name))}>×</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Class Assignments */}
        <div style={styles.formSection}>
          <div style={styles.formSectionHeader}>
            <span style={styles.formSectionIcon}>🏫</span>
            <h3 style={styles.formSectionTitle}>Class & Section Assignments</h3>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label style={styles.label}>Class</label>
              <select style={{ ...styles.input, marginTop: '6px' }} value={selectedClass} onChange={e => handleClassChange(e.target.value)}>
                <option value="">-- Select Class --</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={styles.label}>Section (optional)</label>
              <select style={{ ...styles.input, marginTop: '6px' }} value={selectedSections[0] || ''} onChange={e => setSelectedSections(e.target.value ? [e.target.value] : [])}>
                <option value="">All Sections</option>
                {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <button type="button" style={styles.addAssignBtn} onClick={addAssignment}>+ Add</button>
          </div>
          {assignments.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
              {assignments.map((a, i) => (
                <div key={i} style={styles.tagBlue}>
                  🏫 {a.class_name} {a.section_name !== 'All Sections' ? `- ${a.section_name}` : '(All)'}
                  <span style={styles.tagRemove} onClick={() => removeAssignment(i)}>×</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {message && (
          <div style={{ ...styles.messageBox, backgroundColor: message.startsWith('✅') ? '#f0fdf4' : '#fef2f2', borderColor: message.startsWith('✅') ? '#86efac' : '#fca5a5', color: message.startsWith('✅') ? '#16a34a' : '#dc2626' }}>
            {message}
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
          <button style={styles.submitBtn} onClick={handleAdd} disabled={loading}>
            {loading ? '⏳ Adding Teacher...' : '✅ Add Teacher'}
          </button>
          <button style={styles.cancelBtn} onClick={() => {
            setForm({ name: '', email: '', phone: '', gender: 'male', birthday: '', address: '', password: '' })
            setAssignments([])
            setSelectedSubjectNames([])
            setMessage('')
          }}>Reset</button>
        </div>
      </div>

      {/* Tips Panel */}
      <div style={styles.tipsPanel}>
        <h4 style={styles.tipsPanelTitle}>💡 Quick Guide</h4>
        {[
          'Fill in basic info — name, email, and password are required.',
          'Select subjects this teacher will teach.',
          'Assign class/section combinations — subjects will be linked to each class automatically.',
          'Teacher ID is auto-generated — share it with the teacher for login.',
        ].map((tip, i) => (
          <div key={i} style={styles.tipItem}>
            <span style={styles.tipNum}>{i + 1}</span>
            <span>{tip}</span>
          </div>
        ))}
        <div style={{ marginTop: '20px', padding: '12px', backgroundColor: '#fffbeb', borderRadius: '8px', border: '1px solid #fde68a' }}>
          <p style={{ fontSize: '12px', color: '#92400e', margin: 0 }}>⚠️ The teacher uses their Teacher ID and password to log in — not email.</p>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// SHOW TEACHERS
// ─────────────────────────────────────────────
function ShowTeachers() {
  const [teachers, setTeachers] = useState([])
  const [teacherDetails, setTeacherDetails] = useState({})
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [editTeacher, setEditTeacher] = useState(null)
  const [editAssignments, setEditAssignments] = useState([])
  const [editClasses, setEditClasses] = useState([])
  const [editSections, setEditSections] = useState([])
  const [editSelClass, setEditSelClass] = useState('')
  const [editSelSection, setEditSelSection] = useState('')
  const [editSelectedSubjectNames, setEditSelectedSubjectNames] = useState([])
  const [deleteId, setDeleteId] = useState(null)
  const [page, setPage] = useState(1)
  const PER_PAGE = 8

  const avatarColors = ['#4f46e5', '#0891b2', '#059669', '#d97706', '#dc2626', '#7c3aed', '#db2777']

  useEffect(() => {
    fetchTeachers()
    supabase.from('classes').select('*').then(({ data }) => setEditClasses(data || []))
  }, [])

  const fetchTeachers = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('id, uid, name, email, phone, gender, birthday, address')
      .eq('role', 'teacher')
      .order('name')
    const list = data || []
    setTeachers(list)

    if (list.length > 0) {
      const ids = list.map(t => t.id)
      const { data: classData } = await supabase
        .from('teacher_classes')
        .select('teacher_id, classes(name), sections(name)')
        .in('teacher_id', ids)
      const { data: subData } = await supabase
        .from('subjects')
        .select('teacher_id, name')
        .in('teacher_id', ids)
      const details = {}
      list.forEach(t => {
        details[t.id] = {
          assignments: (classData || []).filter(c => c.teacher_id === t.id),
          // deduplicate subjects by name for display
          subjects: [...new Map(
            (subData || []).filter(s => s.teacher_id === t.id).map(s => [s.name, s])
          ).values()],
        }
      })
      setTeacherDetails(details)
    }
    setLoading(false)
  }

  const confirmDelete = async () => {
    const id = deleteId
    setDeleteId(null)
    await supabase.from('teacher_classes').delete().eq('teacher_id', id)
    await supabase.from('subjects').delete().eq('teacher_id', id)
    await supabase.from('teacher_leaves').delete().eq('teacher_id', id)
    await supabase.from('teachers').delete().eq('id', id)
    const { error } = await supabase.from('profiles').delete().eq('id', id)
    if (!error) {
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
        body: JSON.stringify({ userId: id }),
      })
      setTeachers(prev => prev.filter(t => t.id !== id))
      setTeacherDetails(prev => { const n = { ...prev }; delete n[id]; return n })
    } else {
      alert('Delete failed: ' + error.message)
    }
  }

  const handleEditTeacherOpen = async (t) => {
    setEditTeacher(t)
    setEditSelClass('')
    setEditSelSection('')
    setEditSections([])
    const { data } = await supabase
      .from('teacher_classes')
      .select('*, classes(name), sections(name)')
      .eq('teacher_id', t.id)
    setEditAssignments((data || []).map(a => ({
      id: a.id, class_id: a.class_id, class_name: a.classes?.name,
      section_id: a.section_id, section_name: a.sections?.name || 'All Sections',
    })))
    // Load unique subject names assigned to this teacher
    const { data: subData } = await supabase.from('subjects').select('name').eq('teacher_id', t.id)
    const uniqueNames = [...new Set((subData || []).map(s => s.name))]
    setEditSelectedSubjectNames(uniqueNames)
  }

  const handleEdit = async () => {
    const { data: existing } = await supabase
      .from('teachers').select('id').eq('teacher_id', editTeacher.uid).neq('id', editTeacher.id)
    if (existing && existing.length > 0) { alert('This Teacher ID is already taken!'); return }

    await supabase.from('profiles').update({
      name: editTeacher.name, email: editTeacher.email, phone: editTeacher.phone,
      gender: editTeacher.gender, birthday: editTeacher.birthday || null,
      address: editTeacher.address, uid: editTeacher.uid,
    }).eq('id', editTeacher.id)
    await supabase.from('teachers').update({ teacher_id: editTeacher.uid }).eq('id', editTeacher.id)

    // Delete all old subjects and recreate
    await supabase.from('subjects').delete().eq('teacher_id', editTeacher.id)

    // Insert class assignments
    await supabase.from('teacher_classes').delete().eq('teacher_id', editTeacher.id)
    if (editAssignments.length > 0) {
      await supabase.from('teacher_classes').insert(
        editAssignments.map(a => ({ teacher_id: editTeacher.id, class_id: parseInt(a.class_id), section_id: a.section_id || null }))
      )
    }

    // Re-create subjects: one per subject name per class
    if (editSelectedSubjectNames.length > 0 && editAssignments.length > 0) {
      const subjectRows = []
      for (const subName of editSelectedSubjectNames) {
        for (const assignment of editAssignments) {
          subjectRows.push({ name: subName, class_id: parseInt(assignment.class_id), teacher_id: editTeacher.id })
        }
      }
      await supabase.from('subjects').insert(subjectRows)
    } else if (editSelectedSubjectNames.length > 0) {
      await supabase.from('subjects').insert(
        editSelectedSubjectNames.map(name => ({ name, teacher_id: editTeacher.id }))
      )
    }

    setEditTeacher(null)
    fetchTeachers()
  }

  const filtered = teachers.filter(t =>
    t.name?.toLowerCase().includes(search.toLowerCase()) ||
    t.uid?.toLowerCase().includes(search.toLowerCase()) ||
    t.email?.toLowerCase().includes(search.toLowerCase())
  )
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  const totalPages = Math.ceil(filtered.length / PER_PAGE)

  return (
    <div>
      {/* Stats bar */}
      <div style={styles.statsBar}>
        {[
          { icon: '👥', value: teachers.length, label: 'Total Teachers' },
          { icon: '📚', value: Object.values(teacherDetails).reduce((s, d) => s + (d.subjects?.length || 0), 0), label: 'Subject Assignments' },
          { icon: '🏫', value: Object.values(teacherDetails).reduce((s, d) => s + (d.assignments?.length || 0), 0), label: 'Class Assignments' },
          { icon: '✅', value: teachers.filter(t => teacherDetails[t.id]?.assignments?.length > 0).length, label: 'Fully Assigned' },
        ].map(s => (
          <div key={s.label} style={styles.statPill}>
            <span style={{ fontSize: '22px' }}>{s.icon}</span>
            <div>
              <div style={styles.statPillValue}>{s.value}</div>
              <div style={styles.statPillLabel}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1a1a2e', margin: 0 }}>
          Faculty Members <span style={{ color: '#9ca3af', fontWeight: '400' }}>({filtered.length})</span>
        </h3>
        <input style={{ ...styles.input, width: '240px' }} placeholder="Search by name, ID or email..."
          value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
      </div>

      {/* Teacher Cards */}
      {loading ? (
        <div style={styles.emptyState}>⏳ Loading teachers...</div>
      ) : paginated.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>👨‍🏫</div>
          <div style={{ fontWeight: '600', color: '#374151' }}>No teachers found</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {paginated.map((t, i) => {
            const detail = teacherDetails[t.id] || { assignments: [], subjects: [] }
            const color = avatarColors[i % avatarColors.length]
            return (
              <div key={t.id} style={styles.teacherCard}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <div style={{ ...styles.avatar, backgroundColor: color }}>{t.name?.charAt(0).toUpperCase()}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: '700', fontSize: '15px', color: '#1a1a2e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>ID: {t.uid}</div>
                  </div>
                  <div style={{ ...styles.genderBadge, backgroundColor: t.gender === 'female' ? '#fdf2f8' : '#eff6ff', color: t.gender === 'female' ? '#9d174d' : '#1e40af' }}>
                    {t.gender === 'female' ? '👩' : '👨'} {t.gender || 'N/A'}
                  </div>
                </div>

                <div style={{ marginBottom: '10px' }}>
                  <div style={styles.cardInfoItem}><span>📧</span><span style={{ fontSize: '12px', color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.email || '—'}</span></div>
                  <div style={{ ...styles.cardInfoItem, marginTop: '4px' }}><span>📞</span><span style={{ fontSize: '12px', color: '#374151' }}>{t.phone || '—'}</span></div>
                </div>

                {detail.subjects.length > 0 && (
                  <div style={{ marginBottom: '8px' }}>
                    <div style={styles.cardSubLabel}>📖 Subjects</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {detail.subjects.slice(0, 3).map((s, j) => <span key={j} style={styles.subjectPill}>{s.name}</span>)}
                      {detail.subjects.length > 3 && <span style={styles.morePill}>+{detail.subjects.length - 3}</span>}
                    </div>
                  </div>
                )}

                {detail.assignments.length > 0 && (
                  <div style={{ marginBottom: '12px' }}>
                    <div style={styles.cardSubLabel}>🏫 Classes</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {detail.assignments.slice(0, 3).map((a, j) => (
                        <span key={j} style={styles.classPill}>{a.classes?.name}{a.sections?.name ? ` - ${a.sections.name}` : ' (All)'}</span>
                      ))}
                      {detail.assignments.length > 3 && <span style={styles.morePill}>+{detail.assignments.length - 3}</span>}
                    </div>
                  </div>
                )}

                {detail.subjects.length === 0 && detail.assignments.length === 0 && (
                  <div style={{ padding: '8px 12px', backgroundColor: '#fffbeb', borderRadius: '6px', fontSize: '12px', color: '#92400e', marginBottom: '12px' }}>
                    ⚠️ No subjects or classes assigned
                  </div>
                )}

                <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #f3f4f6', paddingTop: '10px' }}>
                  <button style={styles.cardEditBtn} onClick={() => handleEditTeacherOpen(t)}>✏️ Edit</button>
                  <button style={styles.cardDeleteBtn} onClick={() => setDeleteId(t.id)}>🗑 Delete</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div style={styles.pagination}>
          <button style={styles.pageBtn} onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Prev</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} style={{ ...styles.pageBtn, ...(p === page ? styles.pageActive : {}) }} onClick={() => setPage(p)}>{p}</button>
          ))}
          <button style={styles.pageBtn} onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next →</button>
        </div>
      )}

      {/* Edit Modal */}
      {editTeacher && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modal, width: '580px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{ ...styles.avatar, backgroundColor: '#4f46e5', width: '48px', height: '48px', fontSize: '20px' }}>{editTeacher.name?.charAt(0).toUpperCase()}</div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1a1a2e', margin: 0 }}>Edit Teacher</h3>
                <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>Update {editTeacher.name}'s information</p>
              </div>
            </div>

            <div style={styles.formGrid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Full Name</label>
                <input style={styles.input} value={editTeacher.name || ''} onChange={e => setEditTeacher({ ...editTeacher, name: e.target.value })} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Email</label>
                <input style={styles.input} type="email" value={editTeacher.email || ''} onChange={e => setEditTeacher({ ...editTeacher, email: e.target.value })} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Teacher ID</label>
                {/^2\d{2}\d{3}$/.test(editTeacher.uid) ? (
                  <input style={{ ...styles.input, backgroundColor: '#f9fafb', color: '#6b7280' }} value={editTeacher.uid} readOnly />
                ) : (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input style={{ ...styles.input, flex: 1 }} value={editTeacher.uid || ''} onChange={e => setEditTeacher({ ...editTeacher, uid: e.target.value })} />
                    <button type="button" style={styles.refreshBtn} onClick={async () => {
                      const year = new Date().getFullYear().toString().slice(2)
                      let id, exists = true
                      while (exists) {
                        id = '2' + year + (Math.floor(Math.random() * 900) + 100)
                        const { data } = await supabase.from('teachers').select('id').eq('teacher_id', id)
                        exists = data && data.length > 0
                      }
                      setEditTeacher({ ...editTeacher, uid: id })
                    }}>🔄</button>
                  </div>
                )}
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Phone</label>
                <input style={styles.input} value={editTeacher.phone || ''} onChange={e => setEditTeacher({ ...editTeacher, phone: e.target.value })} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Gender</label>
                <select style={styles.input} value={editTeacher.gender || 'male'} onChange={e => setEditTeacher({ ...editTeacher, gender: e.target.value })}>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Birthday</label>
                <input style={styles.input} type="date" value={editTeacher.birthday?.slice(0, 10) || ''} onChange={e => setEditTeacher({ ...editTeacher, birthday: e.target.value })} />
              </div>
            </div>

            <div style={{ ...styles.formGroup, marginTop: '12px' }}>
              <label style={styles.label}>Address</label>
              <input style={styles.input} value={editTeacher.address || ''} onChange={e => setEditTeacher({ ...editTeacher, address: e.target.value })} />
            </div>

            {/* Subjects */}
            <div style={{ ...styles.formGroup, marginTop: '16px' }}>
              <label style={styles.label}>Assigned Subjects</label>
              <p style={{ fontSize: '11px', color: '#6b7280', margin: '2px 0 6px' }}>Subjects will be linked to each class assigned below</p>
              <select style={styles.input} value="" onChange={e => {
                const name = e.target.value
                if (name && !editSelectedSubjectNames.includes(name)) setEditSelectedSubjectNames([...editSelectedSubjectNames, name])
              }}>
                <option value="">-- Add Subject --</option>
                {STANDARD_SUBJECTS.map(name => <option key={name} value={name}>{name}</option>)}
              </select>
              {editSelectedSubjectNames.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                  {editSelectedSubjectNames.map(name => (
                    <div key={name} style={styles.tagGreen}>
                      {name}
                      <span style={styles.tagRemove} onClick={() => setEditSelectedSubjectNames(editSelectedSubjectNames.filter(s => s !== name))}>×</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Class Assignments */}
            <div style={{ ...styles.formGroup, marginTop: '16px' }}>
              <label style={styles.label}>Class & Section Assignments</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                <select style={{ ...styles.input, flex: 1 }} value={editSelClass}
                  onChange={async e => {
                    setEditSelClass(e.target.value)
                    setEditSelSection('')
                    const { data } = await supabase.from('sections').select('*').eq('class_id', e.target.value)
                    setEditSections(data || [])
                  }}>
                  <option value="">-- Select Class --</option>
                  {editClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select style={{ ...styles.input, flex: 1 }} value={editSelSection} onChange={e => setEditSelSection(e.target.value)}>
                  <option value="">-- All Sections --</option>
                  {editSections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <button type="button" style={styles.addAssignBtn} onClick={() => {
                  if (!editSelClass) return
                  const cls = editClasses.find(c => String(c.id) === String(editSelClass))
                  const sec = editSections.find(s => String(s.id) === String(editSelSection))
                  const already = editAssignments.find(a =>
                    String(a.class_id) === String(editSelClass) && String(a.section_id) === String(editSelSection)
                  )
                  if (already) return
                  setEditAssignments([...editAssignments, {
                    class_id: editSelClass, class_name: cls?.name,
                    section_id: editSelSection || null, section_name: sec?.name || 'All Sections'
                  }])
                  setEditSelClass('')
                  setEditSelSection('')
                  setEditSections([])
                }}>+ Add</button>
              </div>
              {editAssignments.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {editAssignments.map((a, i) => (
                    <div key={i} style={styles.tagBlue}>
                      {a.class_name} {a.section_name !== 'All Sections' ? `- ${a.section_name}` : '(All)'}
                      <span style={styles.tagRemove} onClick={() => setEditAssignments(editAssignments.filter((_, j) => j !== i))}>×</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #f3f4f6' }}>
              <button style={styles.cancelBtn} onClick={() => setEditTeacher(null)}>Cancel</button>
              <button style={styles.submitBtn} onClick={handleEdit}>💾 Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteId && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modal, width: '360px', textAlign: 'center' }}>
            <div style={{ fontSize: '52px', marginBottom: '8px' }}>⚠️</div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1a1a2e', margin: '0 0 8px' }}>Delete Teacher?</h3>
            <p style={{ color: '#6b7280', fontSize: '14px', margin: '0 0 20px' }}>This will permanently remove the teacher and all their data.</p>
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
// TEACHERS LEAVE
// ─────────────────────────────────────────────
function TeachersLeave() {
  const [activeFilter, setActiveFilter] = useState('pending')
  const [leaves, setLeaves] = useState([])
  const [stats, setStats] = useState({ total: 0, approved: 0, pending: 0, rejected: 0 })
  const [loading, setLoading] = useState(true)
  const [expandedLeave, setExpandedLeave] = useState(null)

  useEffect(() => { fetchLeaves() }, [])

  const fetchLeaves = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('teacher_leaves')
      .select('*, profiles(name, uid)')
      .order('applied_date', { ascending: false })
    if (error) { console.error('fetchLeaves error:', error); setLoading(false); return }
    const all = data || []
    setLeaves(all)
    setStats({
      total: all.length,
      approved: all.filter(l => l.status === 'approved').length,
      pending: all.filter(l => l.status === 'pending').length,
      rejected: all.filter(l => l.status === 'rejected').length,
    })
    setLoading(false)
  }

  const updateStatus = async (id, status) => {
    await supabase.from('teacher_leaves').update({ status }).eq('id', id)
    setLeaves(leaves.map(l => l.id === id ? { ...l, status } : l))
    setStats(prev => {
      const old = leaves.find(l => l.id === id)?.status
      return { ...prev, [old]: (prev[old] || 1) - 1, [status]: (prev[status] || 0) + 1 }
    })
  }

  const getDays = (from, to) => {
    const d1 = new Date(from), d2 = new Date(to)
    return Math.round((d2 - d1) / (1000 * 60 * 60 * 24)) + 1
  }

  const filtered = leaves.filter(l => l.status === activeFilter)
  const statusConfig = {
    pending: { color: '#f59e0b', bg: '#fffbeb', border: '#fde68a', icon: '⏳' },
    approved: { color: '#10b981', bg: '#f0fdf4', border: '#86efac', icon: '✅' },
    rejected: { color: '#ef4444', bg: '#fef2f2', border: '#fca5a5', icon: '❌' },
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Total Requests', value: stats.total, icon: '📋', bg: '#f8fafc', border: '#e2e8f0' },
          { label: 'Approved', value: stats.approved, icon: '✅', bg: '#f0fdf4', border: '#86efac' },
          { label: 'Pending', value: stats.pending, icon: '⏳', bg: '#fffbeb', border: '#fde68a' },
          { label: 'Rejected', value: stats.rejected, icon: '❌', bg: '#fef2f2', border: '#fca5a5' },
        ].map(card => (
          <div key={card.label} style={{ backgroundColor: card.bg, border: `1px solid ${card.border}`, borderRadius: '12px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span style={{ fontSize: '26px' }}>{card.icon}</span>
            <div>
              <div style={{ fontSize: '26px', fontWeight: '800', color: '#1a1a2e', lineHeight: 1 }}>{card.value}</div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {['pending', 'approved', 'rejected'].map(f => (
          <button key={f} onClick={() => setActiveFilter(f)}
            style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '500', backgroundColor: activeFilter === f ? '#4f46e5' : '#f3f4f6', color: activeFilter === f ? '#fff' : '#374151' }}>
            {statusConfig[f].icon} {f.charAt(0).toUpperCase() + f.slice(1)} ({stats[f]})
          </button>
        ))}
      </div>

      {loading ? (
        <div style={styles.emptyState}>⏳ Loading leave requests...</div>
      ) : filtered.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📄</div>
          <div style={{ fontWeight: '600', color: '#374151' }}>No {activeFilter} leaves</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filtered.map(l => {
            const cfg = statusConfig[l.status] || statusConfig.pending
            const days = l.from_date && l.to_date ? getDays(l.from_date, l.to_date) : 1
            const isExpanded = expandedLeave === l.id
            return (
              <div key={l.id} style={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 18px' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: '#4f46e5', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: '700', flexShrink: 0 }}>
                    {l.profiles?.name?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: '700', fontSize: '14px', color: '#1a1a2e' }}>{l.profiles?.name || 'N/A'}</span>
                      <span style={{ fontSize: '11px', color: '#9ca3af' }}>ID: {l.profiles?.uid}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>📅 {l.from_date} → {l.to_date}</span>
                      <span style={{ fontSize: '11px', backgroundColor: '#f3f4f6', color: '#374151', padding: '2px 8px', borderRadius: '20px' }}>{days} day{days > 1 ? 's' : ''}</span>
                      <span style={{ fontSize: '11px', backgroundColor: '#ede9fe', color: '#6d28d9', padding: '2px 8px', borderRadius: '20px' }}>{l.leave_type}</span>
                    </div>
                  </div>
                  <div style={{ backgroundColor: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color, padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', flexShrink: 0 }}>
                    {cfg.icon} {l.status.charAt(0).toUpperCase() + l.status.slice(1)}
                  </div>
                  <button onClick={() => setExpandedLeave(isExpanded ? null : l.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#9ca3af', flexShrink: 0 }}>
                    {isExpanded ? '▲' : '▼'}
                  </button>
                </div>
                {isExpanded && (
                  <div style={{ padding: '0 18px 14px', borderTop: '1px solid #f3f4f6' }}>
                    {l.reason && (
                      <div style={{ backgroundColor: '#f8fafc', borderRadius: '8px', padding: '10px 12px', margin: '10px 0' }}>
                        <div style={{ fontSize: '11px', fontWeight: '700', color: '#6b7280', marginBottom: '4px' }}>REASON</div>
                        <div style={{ fontSize: '14px', color: '#374151' }}>{l.reason}</div>
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '12px', color: '#9ca3af' }}>Applied: {new Date(l.applied_date).toLocaleDateString('en-IN')}</span>
                      {activeFilter === 'pending' && (
                        <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
                          <button style={{ ...styles.cardEditBtn, backgroundColor: '#10b981' }} onClick={() => updateStatus(l.id, 'approved')}>✅ Approve</button>
                          <button style={styles.cardDeleteBtn} onClick={() => updateStatus(l.id, 'rejected')}>❌ Reject</button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
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
  formSection: { backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', marginBottom: '16px' },
  formSectionHeader: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' },
  formSectionIcon: { fontSize: '18px' },
  formSectionTitle: { fontSize: '14px', fontWeight: '700', color: '#374151', margin: 0 },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '12px', fontWeight: '600', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px' },
  input: { padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', outline: 'none', backgroundColor: '#fff' },
  idBadge: { padding: '10px 16px', backgroundColor: '#ede9fe', color: '#6d28d9', borderRadius: '8px', fontSize: '18px', fontWeight: '800', letterSpacing: '2px', border: '1px solid #ddd6fe' },
  refreshBtn: { padding: '8px 14px', backgroundColor: '#e5e7eb', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' },
  addAssignBtn: { padding: '10px 16px', backgroundColor: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', whiteSpace: 'nowrap' },
  submitBtn: { padding: '11px 24px', borderRadius: '8px', border: 'none', backgroundColor: '#4f46e5', color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
  cancelBtn: { padding: '10px 20px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: '14px' },
  messageBox: { padding: '12px 16px', borderRadius: '8px', border: '1px solid', fontSize: '14px', fontWeight: '500', marginBottom: '8px' },
  tipsPanel: { width: '240px', flexShrink: 0, backgroundColor: '#f0f4ff', border: '1px solid #c7d2fe', borderRadius: '12px', padding: '20px' },
  tipsPanelTitle: { fontSize: '14px', fontWeight: '700', color: '#3730a3', margin: '0 0 16px' },
  tipItem: { display: 'flex', gap: '10px', marginBottom: '14px', fontSize: '13px', color: '#4338ca', lineHeight: '1.5' },
  tipNum: { width: '22px', height: '22px', backgroundColor: '#4f46e5', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', flexShrink: 0 },
  tagGreen: { backgroundColor: '#dcfce7', color: '#16a34a', padding: '4px 10px', borderRadius: '20px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500' },
  tagBlue: { backgroundColor: '#dbeafe', color: '#1d4ed8', padding: '4px 10px', borderRadius: '20px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500' },
  tagRemove: { cursor: 'pointer', fontWeight: '800', opacity: 0.6, marginLeft: '2px' },
  statsBar: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' },
  statPill: { backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' },
  statPillValue: { fontSize: '22px', fontWeight: '800', color: '#1a1a2e', lineHeight: 1 },
  statPillLabel: { fontSize: '11px', color: '#6b7280', marginTop: '3px' },
  teacherCard: { backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px' },
  avatar: { width: '44px', height: '44px', borderRadius: '50%', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: '700', flexShrink: 0 },
  genderBadge: { padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', flexShrink: 0 },
  cardInfoItem: { display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' },
  cardSubLabel: { fontSize: '11px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' },
  subjectPill: { backgroundColor: '#ede9fe', color: '#6d28d9', padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '500' },
  classPill: { backgroundColor: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '500' },
  morePill: { backgroundColor: '#f3f4f6', color: '#6b7280', padding: '2px 8px', borderRadius: '20px', fontSize: '11px' },
  cardEditBtn: { flex: 1, padding: '7px', backgroundColor: '#22c55e', color: '#fff', border: 'none', borderRadius: '7px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', textAlign: 'center' },
  cardDeleteBtn: { flex: 1, padding: '7px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '7px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', textAlign: 'center' },
  pagination: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', marginTop: '24px' },
  pageBtn: { padding: '7px 14px', borderRadius: '7px', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: '13px' },
  pageActive: { backgroundColor: '#4f46e5', color: '#fff', border: '1px solid #4f46e5' },
  modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  modal: { backgroundColor: '#fff', borderRadius: '16px', padding: '28px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' },
  emptyState: { textAlign: 'center', padding: '60px', color: '#9ca3af', fontSize: '14px' },
}