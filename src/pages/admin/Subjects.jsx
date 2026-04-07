import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

const STANDARD_SUBJECTS = [
  'Accountancy', 'Art', 'Biology', 'Business Studies', 'Chemistry',
  'Civics', 'Computer Science', 'Drawing', 'Economics', 'English',
  'Environmental Science', 'EVS', 'French', 'General Knowledge',
  'Geography', 'Hindi', 'History', 'Information Technology',
  'Mathematics', 'Moral Science', 'Music', 'Physical Education',
  'Physics', 'Punjabi', 'Sanskrit', 'Science', 'Social Studies'
].sort()

export default function Subjects() {
  const [classes, setClasses] = useState([])
  const [subjects, setSubjects] = useState([])
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedClassName, setSelectedClassName] = useState('')
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newSubjectName, setNewSubjectName] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.from('classes').select('*').order('name').then(({ data }) => setClasses(data || []))
  }, [])

  const handleFind = async () => {
    if (!selectedClass) return
    setLoading(true)
    setSearched(true)
    
    const { data } = await supabase
      .from('subjects')
      .select('id, name, class_id')
      .eq('class_id', selectedClass)
      .order('name')
      
    setSubjects(data || [])
    setLoading(false)
  }

  const handleAdd = async () => {
    if (!newSubjectName.trim() || !selectedClass) return

    setSaving(true)
    const { data, error } = await supabase
      .from('subjects')
      .insert({
        name: newSubjectName.trim(),
        class_id: parseInt(selectedClass)
      })
      .select()
      .single()
      
    if (!error && data) {
      setSubjects([...subjects, data].sort((a, b) => a.name.localeCompare(b.name)))
      setShowAddModal(false)
      setNewSubjectName('')
    } else if (error) {
      alert("Error adding subject: " + error.message)
    }
    setSaving(false)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this subject from the class curriculum?')) return
    const { error } = await supabase.from('subjects').delete().eq('id', id)
    if (!error) setSubjects(subjects.filter(s => s.id !== id))
  }

  // CRITICAL: Filter out subjects that are already assigned to this class
  const availableSubjects = STANDARD_SUBJECTS.filter(
    stdSub => !subjects.some(assignedSub => assignedSub.name.toLowerCase() === stdSub.toLowerCase())
  )

  return (
    <div>
      <div style={styles.pageHeader}>
        <h1 style={styles.pageTitle}>Curriculum / Subjects</h1>
        <p style={styles.pageSubtitle}>Manage the master syllabus for each class</p>
      </div>

      <div style={styles.card}>
        {/* Filter Box */}
        <div style={styles.filterBox}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: '200px' }}>
              <label style={styles.label}>Select Class</label>
              <select style={styles.input} value={selectedClass} onChange={e => {
                setSelectedClass(e.target.value)
                setSelectedClassName(classes.find(c => String(c.id) === e.target.value)?.name || '')
                setSearched(false)
                setSubjects([])
              }}>
                <option value="">-- Choose Class --</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <button style={styles.findBtn} onClick={handleFind} disabled={!selectedClass}>
              🔍 Find Subjects
            </button>
          </div>
        </div>

        {searched && (
          <>
            {/* Stats */}
            <div style={styles.statsRow}>
              <div style={styles.statCard}>
                <div style={styles.statVal}>{subjects.length}</div>
                <div style={styles.statLabel}>Total Subjects in Syllabus</div>
              </div>
            </div>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1a1a2e', margin: 0 }}>
                Class {selectedClassName} — Curriculum
              </h3>
              <button style={styles.addBtn} onClick={() => setShowAddModal(true)}>＋ Add Subject</button>
            </div>

            {/* Table */}
            {loading ? (
              <div style={styles.emptyState}>⏳ Loading...</div>
            ) : subjects.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={{ fontSize: '40px', marginBottom: '10px' }}>📚</div>
                <div style={{ fontWeight: '600', color: '#374151' }}>No subjects added to this class yet</div>
                <div style={{ fontSize: '13px', color: '#9ca3af', marginTop: '4px' }}>Click "+ Add Subject" to build the syllabus</div>
              </div>
            ) : (
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>#</th>
                      <th style={styles.th}>Subject Name</th>
                      <th style={{ ...styles.th, textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjects.map((s, i) => (
                      <tr key={s.id}>
                        <td style={{ ...styles.td, color: '#9ca3af', width: '40px' }}>{i + 1}</td>
                        <td style={{ ...styles.td, fontWeight: '700', color: '#1a1a2e' }}>{s.name}</td>
                        <td style={{ ...styles.td, textAlign: 'right' }}>
                          <button style={styles.deleteBtn} onClick={() => handleDelete(s.id)}>🗑 Remove</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {!searched && (
          <div style={styles.emptyState}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>📖</div>
            <div style={{ fontWeight: '600', color: '#374151', fontSize: '16px' }}>Select a class to view its syllabus</div>
          </div>
        )}
      </div>

      {/* Add Subject Modal */}
      {showAddModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3 style={styles.modalTitle}>Add Subject to Class {selectedClassName}</h3>
            <p style={{ fontSize: '13px', color: '#6b7280', margin: '-8px 0 16px' }}>Select a subject to add to the syllabus</p>

            <div style={styles.formGroup}>
              <label style={styles.label}>Select Subject *</label>
              {availableSubjects.length > 0 ? (
                <select 
                  style={styles.input} 
                  value={newSubjectName} 
                  onChange={e => setNewSubjectName(e.target.value)}
                >
                  <option value="">-- Choose Subject --</option>
                  {availableSubjects.map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              ) : (
                <p style={{ fontSize: '13px', color: '#16a34a', margin: '4px 0', padding: '10px', backgroundColor: '#f0fdf4', borderRadius: '6px', border: '1px solid #bbf7d0' }}>
                  ✅ All standard subjects have been assigned to this class!
                </p>
              )}
            </div>

            <div style={styles.formButtons}>
              <button style={styles.cancelBtn} onClick={() => { setShowAddModal(false); setNewSubjectName(''); }}>Cancel</button>
              <button style={styles.submitBtn} onClick={handleAdd} disabled={saving || !newSubjectName.trim() || availableSubjects.length === 0}>
                {saving ? 'Saving...' : 'Add Subject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  pageHeader: { marginBottom: '24px' },
  pageTitle: { fontSize: '28px', fontWeight: '800', color: '#1a1a2e', margin: '0 0 4px' },
  pageSubtitle: { fontSize: '14px', color: '#6b7280', margin: 0 },
  card: { backgroundColor: '#fff', borderRadius: '16px', padding: '28px', boxShadow: '0 1px 8px rgba(0,0,0,0.07)' },
  filterBox: { backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', marginBottom: '24px' },
  label: { fontSize: '12px', fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px' },
  input: { padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', outline: 'none', backgroundColor: '#fff', width: '100%' },
  findBtn: { padding: '10px 24px', backgroundColor: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '14px' },
  addBtn: { padding: '9px 18px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '14px' },

  statsRow: { display: 'flex', gap: '12px', marginBottom: '20px' },
  statCard: { flex: 1, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px 18px', textAlign: 'center' },
  statVal: { fontSize: '24px', fontWeight: '800', color: '#1a1a2e' },
  statLabel: { fontSize: '12px', color: '#6b7280', marginTop: '2px' },

  tableWrapper: { border: '1px solid #e5e7eb', borderRadius: '10px', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '12px 16px', backgroundColor: '#f9fafb', fontSize: '12px', color: '#6b7280', fontWeight: '700', borderBottom: '1px solid #e5e7eb', textTransform: 'uppercase', letterSpacing: '0.5px' },
  td: { padding: '13px 16px', fontSize: '14px', color: '#374151', borderBottom: '1px solid #f3f4f6' },
  deleteBtn: { padding: '5px 12px', backgroundColor: '#fef2f2', color: '#ef4444', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' },
  emptyState: { textAlign: 'center', padding: '60px 20px', color: '#9ca3af', fontSize: '14px' },

  modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  modal: { backgroundColor: '#fff', padding: '28px', borderRadius: '16px', width: '420px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' },
  modalTitle: { margin: 0, fontSize: '18px', fontWeight: '700', color: '#1a1a2e' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  formButtons: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px' },
  cancelBtn: { padding: '9px 18px', border: '1px solid #e5e7eb', background: '#fff', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' },
  submitBtn: { padding: '9px 20px', backgroundColor: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' },
}