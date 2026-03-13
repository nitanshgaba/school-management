import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

const TABS = ['Add Teacher', 'Show Teachers', 'Teachers Leave']

export default function Teachers() {
  const [activeTab, setActiveTab] = useState('Add Teacher')

  return (
    <div>
      <div style={styles.pageHeader}>
        <h1 style={styles.pageTitle}>Teacher</h1>
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

        {activeTab === 'Add Teacher' && <AddTeacher />}
        {activeTab === 'Show Teachers' && <ShowTeachers />}
        {activeTab === 'Teachers Leave' && <TeachersLeave />}
      </div>
    </div>
  )
}

function AddTeacher() {
  const [showForm, setShowForm] = useState(false)
  const [showRemove, setShowRemove] = useState(false)
  const [teacherId, setTeacherId] = useState('')
  const [classes, setClasses] = useState([])
  const [sections, setSections] = useState([])
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedSections, setSelectedSections] = useState([])
  const [assignments, setAssignments] = useState([])
  const [allSubjects, setAllSubjects] = useState([])
  const [selectedSubjects, setSelectedSubjects] = useState([]) // [{class_id, class_name, section_id, section_name}]
  const [form, setForm] = useState({
    name: '', password: '', phone: '', gender: 'male', birthday: '', address: ''
  })
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
    supabase.from('subjects').select('*, classes(name)').then(({ data }) => setAllSubjects(data || []))
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
      // add all sections of class
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

  const removeAssignment = (index) => {
    setAssignments(assignments.filter((_, i) => i !== index))
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
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
      body: JSON.stringify({ email: form.email, password: form.password }),
    })
    const authResult = await res.json()
    const authError = authResult.error ? { message: authResult.error } : null
    const authData = { user: authResult.user }

    if (authError) {
      setMessage(authError.message)
      setLoading(false)
      return
    }

    const userId = authData.user?.id
    const finalTeacherId = teacherId

    const { error: profileError } = await supabase.from('profiles').insert({
      id: userId,
      uid: finalTeacherId,
      role: 'teacher',
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

    await supabase.from('teachers').insert({ id: userId, teacher_id: finalTeacherId })

    // Insert class assignments
    if (assignments.length > 0) {
      const rows = assignments.map(a => ({
        teacher_id: userId,
        class_id: a.class_id,
        section_id: a.section_id || null,
      }))
      await supabase.from('teacher_classes').insert(rows)
    }

    // Assign subjects to teacher
    if (selectedSubjects.length > 0) {
      for (const subId of selectedSubjects) {
        await supabase.from('subjects').update({ teacher_id: userId }).eq('id', subId)
      }
    }

    setMessage(`✅ Teacher added! Teacher ID: ${finalTeacherId}`)
    setForm({ name: '', email: '', phone: '', gender: 'male', birthday: '', address: '', password: '' })
    const newId = await generateUniqueTeacherId()
    setTeacherId(newId)
    setAssignments([])
    setSelectedClass('')
    setSelectedSections([])
    setSelectedSubjects([])
    setLoading(false)
  }

  return (
    <div>
      <div style={styles.sectionHeader}>
        <h2 style={styles.sectionTitle}>📋 Teachers</h2>
      </div>

      {!showForm && !showRemove ? (
        <div style={styles.actionCards}>
          <div style={styles.actionCard} onClick={() => setShowForm(true)}>
            <div style={{ ...styles.actionIcon, backgroundColor: '#dcfce7' }}>
              <span style={{ fontSize: '28px' }}>👨‍🏫</span>
            </div>
            <span style={styles.actionLabel}>Add Teacher</span>
          </div>
          <div style={styles.actionCard} onClick={() => setShowRemove(true)}>
            <div style={{ ...styles.actionIcon, backgroundColor: '#fee2e2' }}>
              <span style={{ fontSize: '28px' }}>🗑</span>
            </div>
            <span style={styles.actionLabel}>Remove Teacher</span>
          </div>
        </div>
      ) : showForm ? (
        <div style={styles.form}>
          <h3 style={styles.formTitle}>Add New Teacher</h3>
          <div style={styles.formGroup}>
            <label style={styles.label}>Teacher ID (Auto Generated)</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input style={{ ...styles.input, flex: 1, backgroundColor: '#f9fafb', color: '#6b7280' }} value={teacherId} readOnly />
              <button type="button" style={{ padding: '10px 14px', backgroundColor: '#e5e7eb', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '18px' }}
                onClick={async () => { const id = await generateUniqueTeacherId(); setTeacherId(id) }}>🔄</button>
            </div>
          </div>
          {[
            { label: 'Full Name *', key: 'name', type: 'text' },
            { label: 'Email *', key: 'email', type: 'email' },
            { label: 'Password *', key: 'password', type: 'password' },
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
            <label style={styles.label}>Assign Subjects</label>
            <select style={styles.input} value="" onChange={e => {
              const id = e.target.value
              if (id && !selectedSubjects.includes(id)) setSelectedSubjects([...selectedSubjects, id])
            }}>
              <option value="">-- Select Subject --</option>
              {allSubjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.classes?.name})</option>)}
            </select>
            {selectedSubjects.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                {selectedSubjects.map(sid => {
                  const sub = allSubjects.find(s => String(s.id) === String(sid))
                  return (
                    <div key={sid} style={{ backgroundColor: '#dcfce7', color: '#16a34a', padding: '4px 10px', borderRadius: '20px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {sub?.name} ({sub?.classes?.name})
                      <span style={{ cursor: 'pointer', fontWeight: '700' }} onClick={() => setSelectedSubjects(selectedSubjects.filter(s => s !== sid))}>×</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Assign Classes & Sections</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
              <select style={{ ...styles.input, flex: 1 }} value={selectedClass} onChange={e => handleClassChange(e.target.value)}>
                <option value="">-- Select Class --</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select style={{ ...styles.input, flex: 1 }} value={selectedSections[0] || ''} onChange={e => setSelectedSections(e.target.value ? [e.target.value] : [])}>
                <option value="">-- All Sections --</option>
                {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <button type="button" style={{ ...styles.submitBtn, padding: '10px 16px' }} onClick={addAssignment}>+ Add</button>
            </div>
            {assignments.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                {assignments.map((a, i) => (
                  <div key={i} style={{ backgroundColor: '#dbeafe', color: '#1d4ed8', padding: '4px 10px', borderRadius: '20px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {a.class_name} {a.section_name !== 'All Sections' ? `- ${a.section_name}` : '(All)'}
                    <span style={{ cursor: 'pointer', fontWeight: '700' }} onClick={() => removeAssignment(i)}>×</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          {message && <p style={{ color: message.startsWith('✅') ? '#22c55e' : '#ef4444', fontSize: '14px' }}>{message}</p>}
          <div style={styles.formButtons}>
            <button style={styles.cancelBtn} onClick={() => { setShowForm(false); setMessage('') }}>Cancel</button>
            <button style={styles.submitBtn} onClick={handleAdd} disabled={loading}>
              {loading ? 'Adding...' : 'Add Teacher'}
            </button>
          </div>
        </div>
      ) : (
        <RemoveTeacher onCancel={() => setShowRemove(false)} />
      )}
    </div>
  )
}

function RemoveTeacher({ onCancel }) {
  const [teachers, setTeachers] = useState([])
  const [selected, setSelected] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    supabase.from('profiles').select('id, name, uid').eq('role', 'teacher').then(({ data }) => setTeachers(data || []))
  }, [])

  const handleRemove = async () => {
    if (!selected) return
    setLoading(true)
    await supabase.from('profiles').delete().eq('id', selected)
    setMessage('✅ Teacher removed successfully.')
    setTeachers(teachers.filter(t => t.id !== selected))
    setSelected('')
    setLoading(false)
  }

  return (
    <div style={styles.form}>
      <h3 style={styles.formTitle}>Remove Teacher</h3>
      <div style={styles.formGroup}>
        <label style={styles.label}>Select Teacher</label>
        <select style={styles.input} value={selected} onChange={e => setSelected(e.target.value)}>
          <option value="">-- Select --</option>
          {teachers.map(t => (
            <option key={t.id} value={t.id}>{t.name} ({t.uid})</option>
          ))}
        </select>
      </div>
      {message && <p style={{ color: '#22c55e', fontSize: '14px' }}>{message}</p>}
      <div style={styles.formButtons}>
        <button style={styles.cancelBtn} onClick={onCancel}>Cancel</button>
        <button style={{ ...styles.submitBtn, backgroundColor: '#ef4444' }} onClick={handleRemove} disabled={loading || !selected}>
          {loading ? 'Removing...' : 'Remove Teacher'}
        </button>
      </div>
    </div>
  )
}

function ShowTeachers() {
  const [teachers, setTeachers] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [editTeacher, setEditTeacher] = useState(null)
  const [editAssignments, setEditAssignments] = useState([])
  const [editClasses, setEditClasses] = useState([])
  const [editSections, setEditSections] = useState([])
  const [editSelClass, setEditSelClass] = useState('')
  const [editSelSection, setEditSelSection] = useState('')
  const [allSubjects, setAllSubjects] = useState([])
  const [editSelectedSubjects, setEditSelectedSubjects] = useState([])
  const [page, setPage] = useState(1)
  const PER_PAGE = 10

  useEffect(() => {
    fetchTeachers()
    supabase.from('classes').select('*').then(({ data }) => setEditClasses(data || []))
    supabase.from('subjects').select('*, classes(name)').then(({ data }) => setAllSubjects(data || []))
  }, [])

  const fetchTeachers = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('id, uid, name, email, phone, gender, birthday, address')
      .eq('role', 'teacher')
      .order('name')
    setTeachers(data || [])
    setLoading(false)
  }

  const [deleteId, setDeleteId] = useState(null)

  const handleDelete = (id) => setDeleteId(id)

  const confirmDelete = async () => {
    const id = deleteId
    setDeleteId(null)
    await supabase.from('teacher_classes').delete().eq('teacher_id', id)
    await supabase.from('subjects').update({ teacher_id: null }).eq('teacher_id', id)
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
      id: a.id,
      class_id: a.class_id,
      class_name: a.classes?.name,
      section_id: a.section_id,
      section_name: a.sections?.name || 'All Sections',
    })))
    // Fetch assigned subjects
    const { data: subData } = await supabase
      .from('subjects')
      .select('id')
      .eq('teacher_id', t.id)
    setEditSelectedSubjects((subData || []).map(s => String(s.id)))
  }

  const handleEdit = async () => {
    const { data: existing } = await supabase
      .from('teachers')
      .select('id')
      .eq('teacher_id', editTeacher.uid)
      .neq('id', editTeacher.id)
    if (existing && existing.length > 0) {
      alert('❌ This Teacher ID is already assigned to another teacher!')
      return
    }
    await supabase.from('profiles').update({
      name: editTeacher.name,
      email: editTeacher.email,
      phone: editTeacher.phone,
      gender: editTeacher.gender,
      birthday: editTeacher.birthday || null,
      address: editTeacher.address,
      uid: editTeacher.uid,
    }).eq('id', editTeacher.id)
    await supabase.from('teachers').update({
      teacher_id: editTeacher.uid,
    }).eq('id', editTeacher.id)
    // Update subject assignments - remove old, assign new
    await supabase.from('subjects').update({ teacher_id: null }).eq('teacher_id', editTeacher.id)
    for (const subId of editSelectedSubjects) {
      await supabase.from('subjects').update({ teacher_id: editTeacher.id }).eq('id', subId)
    }
    // Remove old assignments and insert new ones
    await supabase.from('teacher_classes').delete().eq('teacher_id', editTeacher.id)
    const newAssignments = editAssignments.filter(a => !a.id)
    const kept = editAssignments.filter(a => a.id)
    if (kept.length > 0) {
      await supabase.from('teacher_classes').insert(
        kept.map(a => ({ teacher_id: editTeacher.id, class_id: a.class_id, section_id: a.section_id || null }))
      )
    }
    if (newAssignments.length > 0) {
      await supabase.from('teacher_classes').insert(
        newAssignments.map(a => ({ teacher_id: editTeacher.id, class_id: a.class_id, section_id: a.section_id || null }))
      )
    }
    setTeachers(teachers.map(t => t.id === editTeacher.id ? { ...t, ...editTeacher } : t))
    setEditTeacher(null)
  }

  const filtered = teachers.filter(t =>
    t.name?.toLowerCase().includes(search.toLowerCase()) ||
    t.uid?.toLowerCase().includes(search.toLowerCase())
  )
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  const totalPages = Math.ceil(filtered.length / PER_PAGE)

  return (
    <div>
      {editTeacher && (
        <div style={styles.modalOverlay}>
          <div style={{...styles.modal, width: '560px', maxHeight: '90vh', overflowY: 'auto'}}>
            <h3 style={styles.formTitle}>Edit Teacher</h3>
            <div style={styles.formGroup}>
              <label style={styles.label}>Full Name</label>
              <input style={styles.input} value={editTeacher.name || ''}
                onChange={e => setEditTeacher({ ...editTeacher, name: e.target.value })} />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Email</label>
              <input style={styles.input} type="email" value={editTeacher.email || ''}
                onChange={e => setEditTeacher({ ...editTeacher, email: e.target.value })} />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Teacher ID</label>
              {/^2\d{2}\d{3}$/.test(editTeacher.uid) ? (
                <input style={{...styles.input, backgroundColor: '#f9fafb', color: '#6b7280'}} value={editTeacher.uid} readOnly />
              ) : (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input style={{...styles.input, flex: 1}} value={editTeacher.uid || ''}
                    onChange={e => setEditTeacher({ ...editTeacher, uid: e.target.value })} />
                  <button type="button" style={{ padding: '10px 14px', backgroundColor: '#e5e7eb', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '18px' }}
                    onClick={async () => {
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
              {!/^2\d{2}\d{3}$/.test(editTeacher.uid) && (
                <p style={{ fontSize: '11px', color: '#ef4444', margin: '2px 0 0' }}>⚠️ Invalid format — use 🔄 to auto-generate</p>
              )}
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Phone</label>
              <input style={styles.input} value={editTeacher.phone || ''}
                onChange={e => setEditTeacher({ ...editTeacher, phone: e.target.value })} />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Gender</label>
              <select style={styles.input} value={editTeacher.gender || 'male'}
                onChange={e => setEditTeacher({ ...editTeacher, gender: e.target.value })}>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Birthday</label>
              <input style={styles.input} type="date" value={editTeacher.birthday?.slice(0,10) || ''}
                onChange={e => setEditTeacher({ ...editTeacher, birthday: e.target.value })} />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Address</label>
              <input style={styles.input} value={editTeacher.address || ''}
                onChange={e => setEditTeacher({ ...editTeacher, address: e.target.value })} />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Assigned Subjects</label>
              <select style={styles.input} value="" onChange={e => {
                const id = e.target.value
                if (id && !editSelectedSubjects.includes(id)) setEditSelectedSubjects([...editSelectedSubjects, id])
              }}>
                <option value="">-- Select Subject --</option>
                {allSubjects.map(s => <option key={s.id} value={String(s.id)}>{s.name} ({s.classes?.name})</option>)}
              </select>
              {editSelectedSubjects.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                  {editSelectedSubjects.map(sid => {
                    const sub = allSubjects.find(s => String(s.id) === String(sid))
                    return (
                      <div key={sid} style={{ backgroundColor: '#dcfce7', color: '#16a34a', padding: '4px 10px', borderRadius: '20px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {sub?.name} ({sub?.classes?.name})
                        <span style={{ cursor: 'pointer', fontWeight: '700' }} onClick={() => setEditSelectedSubjects(editSelectedSubjects.filter(s => s !== sid))}>×</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Assigned Classes & Sections</label>
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
                <button type="button" style={{ ...styles.submitBtn, padding: '10px 16px' }} onClick={() => {
                  if (!editSelClass) return
                  const cls = editClasses.find(c => String(c.id) === String(editSelClass))
                  const sec = editSections.find(s => String(s.id) === String(editSelSection))
                  const already = editAssignments.find(a =>
                    String(a.class_id) === String(editSelClass) &&
                    String(a.section_id) === String(editSelSection)
                  )
                  if (already) return
                  setEditAssignments([...editAssignments, {
                    class_id: editSelClass, class_name: cls?.name,
                    section_id: editSelSection || null,
                    section_name: sec?.name || 'All Sections'
                  }])
                  setEditSelClass('')
                  setEditSelSection('')
                  setEditSections([])
                }}>+ Add</button>
              </div>
              {editAssignments.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {editAssignments.map((a, i) => (
                    <div key={i} style={{ backgroundColor: '#dbeafe', color: '#1d4ed8', padding: '4px 10px', borderRadius: '20px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {a.class_name} {a.section_name !== 'All Sections' ? `- ${a.section_name}` : '(All)'}
                      <span style={{ cursor: 'pointer', fontWeight: '700' }} onClick={() => setEditAssignments(editAssignments.filter((_, j) => j !== i))}>×</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={styles.formButtons}>
              <button style={styles.cancelBtn} onClick={() => setEditTeacher(null)}>Cancel</button>
              <button style={styles.submitBtn} onClick={handleEdit}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modal, width: '360px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px' }}>🗑</div>
            <h3 style={{ ...styles.formTitle, textAlign: 'center' }}>Delete Teacher?</h3>
            <p style={{ color: '#6b7280', fontSize: '14px', margin: '0 0 16px' }}>This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button style={styles.cancelBtn} onClick={() => setDeleteId(null)}>Cancel</button>
              <button style={{ ...styles.submitBtn, backgroundColor: '#ef4444' }} onClick={confirmDelete}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}
      <div style={styles.tableHeader}>
        <h2 style={styles.sectionTitle}>📋 Teacher List</h2>
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
            <th style={styles.th}>Teacher ID</th>
            <th style={styles.th}>Name</th>
            <th style={styles.th}>Action</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={4} style={styles.emptyCell}>Loading...</td></tr>
          ) : paginated.length === 0 ? (
            <tr><td colSpan={4} style={styles.emptyCell}>No teachers found</td></tr>
          ) : (
            paginated.map((t, i) => (
              <tr key={t.id}>
                <td style={styles.td}>{(page - 1) * PER_PAGE + i + 1}.</td>
                <td style={styles.td}>{t.uid}</td>
                <td style={styles.td}>
                  <div style={styles.nameCell}>
                    <div style={styles.miniAvatar}>{t.name?.charAt(0).toUpperCase()}</div>
                    {t.name}
                  </div>
                </td>
                <td style={styles.td}>
                  <div style={styles.actionBtns}>
                    <button style={styles.editBtn} onClick={() => handleEditTeacherOpen(t)}>✏️ Edit</button>
                    <button style={styles.deleteBtn} onClick={() => handleDelete(t.id)}>🗑 Delete</button>
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
    </div>
  )
}

function TeachersLeave() {
  const [activeFilter, setActiveFilter] = useState('pending')
  const [leaves, setLeaves] = useState([])
  const [stats, setStats] = useState({ total: 0, approved: 0, pending: 0, rejected: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchLeaves() }, [])

  const fetchLeaves = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('teacher_leaves')
      .select('*, profiles(name)')
      .order('created_at', { ascending: false })
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
      return { ...prev, [old]: prev[old] - 1, [status]: prev[status] + 1 }
    })
  }

  const filtered = leaves.filter(l => l.status === activeFilter)
  const leaveStatCards = [
    { label: 'Total Teachers', value: stats.total, icon: '👨‍🏫', color: '#dbeafe' },
    { label: 'Approved Leaves', value: stats.approved, icon: '✅', color: '#dcfce7' },
    { label: 'Pending Leaves', value: stats.pending, icon: '⏳', color: '#fef9c3' },
    { label: 'Rejected Leaves', value: stats.rejected, icon: '❌', color: '#fee2e2' },
  ]

  return (
    <div>
      <div style={styles.statsGrid}>
        {leaveStatCards.map(card => (
          <div key={card.label} style={{ ...styles.leaveStatCard, backgroundColor: card.color }}>
            <span style={{ fontSize: '28px' }}>{card.icon}</span>
            <div>
              <div style={styles.statValue}>{card.value}</div>
              <div style={styles.statLabel}>{card.label}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={styles.filterTabs}>
        {['pending', 'approved', 'rejected'].map(f => (
          <button key={f} onClick={() => setActiveFilter(f)}
            style={{ ...styles.filterTab, backgroundColor: activeFilter === f ? '#1a1a2e' : '#f3f4f6', color: activeFilter === f ? '#fff' : '#374151' }}>
            {f.charAt(0).toUpperCase() + f.slice(1)} Leaves
          </button>
        ))}
      </div>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Staff Name</th>
            <th style={styles.th}>Leave Type</th>
            <th style={styles.th}>Applied Date</th>
            <th style={styles.th}>Date Range</th>
            <th style={styles.th}>Action</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={5} style={styles.emptyCell}>Loading...</td></tr>
          ) : filtered.length === 0 ? (
            <tr><td colSpan={5} style={styles.emptyCell}>
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>📄</div>
                <div style={{ color: '#9ca3af' }}>No Leaves</div>
              </div>
            </td></tr>
          ) : (
            filtered.map(l => (
              <tr key={l.id}>
                <td style={styles.td}>{l.profiles?.name || 'N/A'}</td>
                <td style={styles.td}>{l.leave_type}</td>
                <td style={styles.td}>{new Date(l.applied_date).toLocaleDateString('en-IN')}</td>
                <td style={styles.td}>{l.from_date} → {l.to_date}</td>
                <td style={styles.td}>
                  {activeFilter === 'pending' ? (
                    <div style={styles.actionBtns}>
                      <button style={styles.editBtn} onClick={() => updateStatus(l.id, 'approved')}>✅ Approve</button>
                      <button style={styles.deleteBtn} onClick={() => updateStatus(l.id, 'rejected')}>❌ Reject</button>
                    </div>
                  ) : (
                    <span style={{ color: '#9ca3af', fontSize: '13px' }}>
                      {l.status.charAt(0).toUpperCase() + l.status.slice(1)}
                    </span>
                  )}
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
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  sectionTitle: { fontSize: '16px', fontWeight: '700', color: '#1a1a2e' },
  actionCards: { display: 'flex', gap: '20px', padding: '20px 0' },
  actionCard: { border: '2px solid #e5e7eb', borderRadius: '12px', padding: '32px 48px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', cursor: 'pointer', transition: 'all 0.2s', minWidth: '180px' },
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
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '20px' },
  leaveStatCard: { borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' },
  statValue: { fontSize: '24px', fontWeight: '700', color: '#1a1a2e' },
  statLabel: { fontSize: '13px', color: '#6b7280' },
  filterTabs: { display: 'flex', gap: '8px', marginBottom: '16px' },
  filterTab: { padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '500' },
  modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  modal: { backgroundColor: '#fff', borderRadius: '12px', padding: '28px', width: '420px', display: 'flex', flexDirection: 'column', gap: '16px' },
}