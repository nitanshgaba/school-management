import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function Subjects() {
  const [classes, setClasses] = useState([])
  const [subjects, setSubjects] = useState([])
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedClassName, setSelectedClassName] = useState('')
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editSubject, setEditSubject] = useState(null)
  const [newSubjectName, setNewSubjectName] = useState('')
  const [teachers, setTeachers] = useState([])
  const [selectedTeacher, setSelectedTeacher] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    supabase.from('classes').select('*').order('id').then(({ data }) => setClasses(data || []))
    supabase.from('profiles').select('id, name').eq('role', 'teacher').then(({ data }) => setTeachers(data || []))
  }, [])

  const handleFind = async () => {
    if (!selectedClass) return
    setLoading(true)
    setSearched(true)
    const { data } = await supabase
      .from('subjects')
      .select('*')
      .eq('class_id', selectedClass)
      .order('name')
    setSubjects(data || [])
    setLoading(false)
  }

  const handleAdd = async () => {
    if (!newSubjectName.trim()) return
    setSaving(true)
    const { data, error } = await supabase
      .from('subjects')
      .insert({ name: newSubjectName.trim(), class_id: selectedClass, teacher_id: selectedTeacher || null })
      .select()
      .single()
    console.log('INSERT ERROR:', error)
    console.log('INSERT DATA:', data)
    if (!error && data) {
      setSubjects([...subjects, data])
      setNewSubjectName('')
      setSelectedTeacher('')
      setShowAddModal(false)
      setMessage('✅ Subject added!')
      setTimeout(() => setMessage(''), 3000)
    }
    setSaving(false)
  }

  const handleEdit = async () => {
    if (!editSubject?.name.trim()) return
    setSaving(true)
    const { error } = await supabase
      .from('subjects')
      .update({ name: editSubject.name })
      .eq('id', editSubject.id)
    if (!error) {
      setSubjects(subjects.map(s => s.id === editSubject.id ? editSubject : s))
      setEditSubject(null)
      setMessage('✅ Subject updated!')
      setTimeout(() => setMessage(''), 3000)
    }
    setSaving(false)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this subject?')) return
    await supabase.from('subjects').delete().eq('id', id)
    setSubjects(subjects.filter(s => s.id !== id))
  }

  return (
    <div>
      <div style={styles.pageHeader}>
        <h1 style={styles.pageTitle}>Subjects</h1>
      </div>

      <div style={styles.card}>
        {/* Add Modal */}
        {showAddModal && (
          <div style={styles.modalOverlay}>
            <div style={styles.modal}>
              <h3 style={styles.formTitle}>Add New Subject</h3>
              <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>
                Class: <strong>{selectedClassName}</strong>
              </p>
              <div style={styles.formGroup}>
                <label style={styles.label}>Assign Teacher</label>
                <select style={styles.input} value={selectedTeacher} onChange={e => setSelectedTeacher(e.target.value)}>
                  <option value=''>-- No Teacher --</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Subject Name</label>
                <input
                  style={styles.input}
                  placeholder="e.g. Mathematics"
                  value={newSubjectName}
                  onChange={e => setNewSubjectName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAdd()}
                  autoFocus
                />
              </div>
              <div style={styles.formButtons}>
                <button style={styles.cancelBtn} onClick={() => { setShowAddModal(false); setNewSubjectName('') }}>Cancel</button>
                <button style={styles.submitBtn} onClick={handleAdd} disabled={saving}>
                  {saving ? 'Adding...' : 'Add Subject'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editSubject && (
          <div style={styles.modalOverlay}>
            <div style={styles.modal}>
              <h3 style={styles.formTitle}>Edit Subject</h3>
              <div style={styles.formGroup}>
                <label style={styles.label}>Assign Teacher</label>
                <select style={styles.input} value={selectedTeacher} onChange={e => setSelectedTeacher(e.target.value)}>
                  <option value=''>-- No Teacher --</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Subject Name</label>
                <input
                  style={styles.input}
                  value={editSubject.name}
                  onChange={e => setEditSubject({ ...editSubject, name: e.target.value })}
                  autoFocus
                />
              </div>
              <div style={styles.formButtons}>
                <button style={styles.cancelBtn} onClick={() => setEditSubject(null)}>Cancel</button>
                <button style={styles.submitBtn} onClick={handleEdit} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div style={styles.cardHeader}>
          <h2 style={styles.sectionTitle}>📚 Subjects</h2>
          {searched && selectedClass && (
            <button style={styles.addBtn} onClick={() => setShowAddModal(true)}>
              ＋ Add
            </button>
          )}
        </div>

        {message && <p style={{ color: '#22c55e', fontSize: '14px', marginBottom: '12px' }}>{message}</p>}

        {/* Filter */}
        <div style={styles.filterBox}>
          <div style={styles.filterRow}>
            <div style={styles.filterGroup}>
              <label style={styles.label}>Class</label>
              <select
                style={styles.input}
                value={selectedClass}
                onChange={e => {
                  setSelectedClass(e.target.value)
                  setSelectedClassName(classes.find(c => c.id == e.target.value)?.name || '')
                  setSearched(false)
                  setSubjects([])
                }}
              >
                <option value="">-- Select Class --</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <button style={styles.findBtn} onClick={handleFind}>🔍 Find</button>
          </div>
        </div>

        {/* Subjects Table */}
        {searched && (
          <>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1a1a2e', marginBottom: '12px' }}>
              📋 {selectedClassName} Subjects
            </h3>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>#</th>
                  <th style={styles.th}>Subject</th>
                  <th style={styles.th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={3} style={styles.emptyCell}>Loading...</td></tr>
                ) : subjects.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={styles.emptyCell}>
                      <div style={{ textAlign: 'center', padding: '32px' }}>
                        <div style={{ fontSize: '48px', marginBottom: '8px' }}>📚</div>
                        <div>No subjects found. Click "+ Add" to add one.</div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  subjects.map((s, i) => (
                    <tr key={s.id}>
                      <td style={styles.td}>{i + 1}.</td>
                      <td style={styles.td}>{s.name}</td>
                      <td style={styles.td}>
                        <div style={styles.actionBtns}>
                          <button style={styles.editBtn} onClick={() => setEditSubject(s)}>✏️ Edit</button>
                          <button style={styles.deleteBtn} onClick={() => handleDelete(s.id)}>🗑 Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </>
        )}

        {!searched && (
          <div style={styles.emptyState}>
            <div style={{ fontSize: '64px' }}>📚</div>
            <p style={{ color: '#9ca3af', marginTop: '12px' }}>Select a class and click Find to view subjects</p>
          </div>
        )}
      </div>
    </div>
  )
}

const styles = {
  pageHeader: { marginBottom: '24px' },
  pageTitle: { fontSize: '28px', fontWeight: '700', color: '#1a1a2e', margin: 0 },
  card: { backgroundColor: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  sectionTitle: { fontSize: '16px', fontWeight: '700', color: '#1a1a2e' },
  addBtn: { padding: '8px 16px', backgroundColor: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
  filterBox: { backgroundColor: '#f9fafb', borderRadius: '10px', padding: '16px', marginBottom: '24px' },
  filterRow: { display: 'flex', gap: '16px', alignItems: 'flex-end' },
  filterGroup: { display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '200px' },
  findBtn: { padding: '10px 20px', backgroundColor: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', height: '40px' },
  label: { fontSize: '13px', fontWeight: '600', color: '#374151' },
  input: { padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', outline: 'none' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', fontSize: '13px', color: '#6b7280', fontWeight: '600', padding: '10px 12px', borderBottom: '2px solid #f3f4f6' },
  td: { padding: '12px', fontSize: '14px', color: '#374151', borderBottom: '1px solid #f9fafb' },
  emptyCell: { padding: '24px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' },
  actionBtns: { display: 'flex', gap: '8px' },
  editBtn: { padding: '6px 12px', backgroundColor: '#22c55e', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' },
  deleteBtn: { padding: '6px 12px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' },
  modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  modal: { backgroundColor: '#fff', borderRadius: '12px', padding: '28px', width: '400px', display: 'flex', flexDirection: 'column', gap: '16px' },
  formTitle: { fontSize: '18px', fontWeight: '700', color: '#1a1a2e' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  formButtons: { display: 'flex', gap: '12px', marginTop: '4px' },
  cancelBtn: { padding: '10px 20px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: '14px' },
  submitBtn: { padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#4f46e5', color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
  emptyState: { textAlign: 'center', padding: '60px 0' },
}