import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

export default function TeacherNotes() {
  const { profile } = useAuth()
  const [notes, setNotes] = useState([])
  const [classes, setClasses] = useState([])
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [message, setMessage] = useState('')
  const [form, setForm] = useState({ title: '', class_id: '', subject_id: '', description: '' })
  const [file, setFile] = useState(null)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const [{ data: n }, { data: c }, { data: s }] = await Promise.all([
      supabase.from('notes').select('*, classes(name), subjects(name)').eq('teacher_id', profile.id).order('created_at', { ascending: false }),
      supabase.from('classes').select('*'),
      supabase.from('subjects').select('*').eq('teacher_id', profile.id),
    ])
    setNotes(n || [])
    setClasses(c || [])
    setSubjects(s || [])
    setLoading(false)
  }

  const handleUpload = async () => {
    if (!form.title || !form.class_id) { setMessage('Title and class are required'); return }
    setUploading(true)
    setMessage('')
    let file_url = null

    if (file) {
      const ext = file.name.split('.').pop()
      const fileName = `note_${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage.from('notes-files').upload(fileName, file)
      if (uploadError) { setMessage('File upload failed'); setUploading(false); return }
      const { data: urlData } = supabase.storage.from('notes-files').getPublicUrl(fileName)
      file_url = urlData.publicUrl
    }

    const { data, error } = await supabase.from('notes').insert({
      title: form.title,
      class_id: form.class_id || null,
      subject_id: form.subject_id || null,
      teacher_id: profile.id,
      description: form.description,
      file_url,
    }).select('*, classes(name), subjects(name)').single()

    if (error) { setMessage('Error saving note'); setUploading(false); return }
    setNotes([data, ...notes])
    setForm({ title: '', class_id: '', subject_id: '', description: '' })
    setFile(null)
    setShowForm(false)
    setMessage('✅ Note uploaded!')
    setUploading(false)
  }

  const handleDelete = async (id, fileUrl) => {
    if (!confirm('Delete this note?')) return
    if (fileUrl) {
      const fileName = fileUrl.split('/').pop()
      await supabase.storage.from('notes-files').remove([fileName])
    }
    await supabase.from('notes').delete().eq('id', id)
    setNotes(notes.filter(n => n.id !== id))
  }

  if (loading) return <div style={styles.loading}>Loading...</div>

  return (
    <div>
      <div style={styles.header}>
        <h1 style={styles.title}>Notes</h1>
        <button style={styles.addBtn} onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Cancel' : '+ Upload Note'}
        </button>
      </div>

      {message && <p style={{ color: message.startsWith('✅') ? '#22c55e' : '#ef4444', marginBottom: '16px' }}>{message}</p>}

      {showForm && (
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Upload New Note</h2>
          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Title *</label>
              <input style={styles.input} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Chapter 2 Notes" />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Class *</label>
              <select style={styles.input} value={form.class_id} onChange={e => setForm({ ...form, class_id: e.target.value })}>
                <option value="">-- Select Class --</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
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
              <label style={styles.label}>File (PDF/DOC)</label>
              <input style={styles.input} type="file" accept=".pdf,.doc,.docx" onChange={e => setFile(e.target.files[0])} />
            </div>
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Description</label>
            <textarea style={{ ...styles.input, height: '80px', resize: 'vertical' }} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Optional description..." />
          </div>
          <button style={styles.submitBtn} onClick={handleUpload} disabled={uploading}>
            {uploading ? 'Uploading...' : '📤 Upload'}
          </button>
        </div>
      )}

      <div style={styles.grid}>
        {notes.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={{ fontSize: '64px' }}>📝</div>
            <p style={{ color: '#9ca3af', marginTop: '12px' }}>No notes uploaded yet</p>
          </div>
        ) : notes.map(n => (
          <div key={n.id} style={styles.noteCard}>
            <div style={styles.noteIcon}>📝</div>
            <div style={styles.noteInfo}>
              <p style={styles.noteTitle}>{n.title}</p>
              <p style={styles.noteMeta}>{n.classes?.name} {n.subjects?.name && `· ${n.subjects.name}`}</p>
              {n.description && <p style={styles.noteDesc}>{n.description}</p>}
            </div>
            <div style={styles.noteActions}>
              {n.file_url && <a href={n.file_url} target="_blank" rel="noreferrer" style={styles.viewBtn}>📥 View</a>}
              <button style={styles.deleteBtn} onClick={() => handleDelete(n.id, n.file_url)}>🗑</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const styles = {
  loading: { textAlign: 'center', padding: '40px', color: '#9ca3af' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  title: { fontSize: '24px', fontWeight: '700', color: '#1a1a2e', margin: 0 },
  addBtn: { padding: '10px 20px', backgroundColor: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
  card: { backgroundColor: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: '20px' },
  cardTitle: { fontSize: '16px', fontWeight: '700', color: '#1a1a2e', marginBottom: '16px' },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' },
  label: { fontSize: '13px', fontWeight: '600', color: '#374151' },
  input: { padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', outline: 'none' },
  submitBtn: { padding: '10px 24px', backgroundColor: '#22c55e', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
  grid: { display: 'flex', flexDirection: 'column', gap: '12px' },
  emptyState: { textAlign: 'center', padding: '80px 0' },
  noteCard: { backgroundColor: '#fff', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: '16px' },
  noteIcon: { fontSize: '32px', flexShrink: 0 },
  noteInfo: { flex: 1 },
  noteTitle: { fontSize: '15px', fontWeight: '600', color: '#1a1a2e', margin: 0 },
  noteMeta: { fontSize: '13px', color: '#6b7280', margin: '2px 0 0' },
  noteDesc: { fontSize: '13px', color: '#9ca3af', margin: '4px 0 0' },
  noteActions: { display: 'flex', gap: '8px', alignItems: 'center' },
  viewBtn: { padding: '6px 12px', backgroundColor: '#dbeafe', color: '#1d4ed8', borderRadius: '6px', fontSize: '13px', textDecoration: 'none', fontWeight: '500' },
  deleteBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' },
}
