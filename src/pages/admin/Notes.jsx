import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function Notes() {
  const [classes, setClasses] = useState([])
  const [notes, setNotes] = useState([])
  const [selectedClass, setSelectedClass] = useState('')
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editNote, setEditNote] = useState(null)
  const [form, setForm] = useState({ title: '', body: '' })
  const [file, setFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [page, setPage] = useState(1)
  const PER_PAGE = 9

  useEffect(() => {
    supabase.from('classes').select('*').order('id').then(({ data }) => setClasses(data || []))
  }, [])

  const handleFind = async () => {
    if (!selectedClass) return
    setLoading(true)
    setSearched(true)
    const { data } = await supabase
      .from('notes')
      .select('*')
      .eq('class_id', selectedClass)
      .order('created_at', { ascending: false })
    setNotes(data || [])
    setLoading(false)
    setPage(1)
  }

  const handleUpload = async () => {
    if (!form.title.trim()) {
      setMessage('Title is required.')
      return
    }
    setSaving(true)
    setMessage('')

    let fileUrl = null
    let fileSize = null

    if (file) {
      const ext = file.name.split('.').pop()
      const fileName = `note_${selectedClass}_${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('notes-files')
        .upload(fileName, file)

      if (uploadError) {
        setMessage('File upload failed: ' + uploadError.message)
        setSaving(false)
        return
      }

      const { data: urlData } = supabase.storage.from('notes-files').getPublicUrl(fileName)
      fileUrl = urlData.publicUrl
      fileSize = (file.size / 1024).toFixed(0) + 'KB (' + ext + ')'
    }

    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase.from('notes').insert({
      class_id: parseInt(selectedClass),
      title: form.title.trim(),
      body: form.body.trim(),
      file_url: fileUrl,
      file_size: fileSize,
      uploaded_by: user.id,
    }).select().single()

    if (error) {
      setMessage('Error: ' + error.message)
    } else {
      setNotes([data, ...notes])
      setForm({ title: '', body: '' })
      setFile(null)
      setShowModal(false)
      setMessage('✅ Note uploaded!')
      setTimeout(() => setMessage(''), 3000)
    }
    setSaving(false)
  }

  const handleEditSave = async () => {
    setSaving(true)
    const { error } = await supabase.from('notes').update({
      title: editNote.title,
      body: editNote.body,
    }).eq('id', editNote.id)
    if (!error) {
      setNotes(notes.map(n => n.id === editNote.id ? { ...n, ...editNote } : n))
      setEditNote(null)
      setMessage('✅ Note updated!')
      setTimeout(() => setMessage(''), 3000)
    }
    setSaving(false)
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

  const paginated = notes.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  const totalPages = Math.ceil(notes.length / PER_PAGE)

  return (
    <div>
      <div style={styles.pageHeader}>
        <h1 style={styles.pageTitle}>Notes</h1>
      </div>

      <div style={styles.card}>
        {/* Upload Modal */}
        {showModal && (
          <div style={styles.modalOverlay}>
            <div style={styles.modal}>
              <h3 style={styles.formTitle}>Upload Note</h3>
              <div style={styles.formGroup}>
                <label style={styles.label}>Title *</label>
                <input style={styles.input} placeholder="Note title"
                  value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Body</label>
                <textarea style={styles.textarea} rows={3} placeholder="Note description..."
                  value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>File (optional)</label>
                <input type="file" style={styles.fileInput}
                  onChange={e => setFile(e.target.files[0])} />
                {file && <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>{file.name}</p>}
              </div>
              {message && <p style={{ color: message.startsWith('✅') ? '#22c55e' : '#ef4444', fontSize: '13px' }}>{message}</p>}
              <div style={styles.formButtons}>
                <button style={styles.cancelBtn} onClick={() => { setShowModal(false); setMessage('') }}>Cancel</button>
                <button style={styles.submitBtn} onClick={handleUpload} disabled={saving}>
                  {saving ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editNote && (
          <div style={styles.modalOverlay}>
            <div style={styles.modal}>
              <h3 style={styles.formTitle}>Edit Note</h3>
              <div style={styles.formGroup}>
                <label style={styles.label}>Title</label>
                <input style={styles.input} value={editNote.title}
                  onChange={e => setEditNote({ ...editNote, title: e.target.value })} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Body</label>
                <textarea style={styles.textarea} rows={3} value={editNote.body || ''}
                  onChange={e => setEditNote({ ...editNote, body: e.target.value })} />
              </div>
              <div style={styles.formButtons}>
                <button style={styles.cancelBtn} onClick={() => setEditNote(null)}>Cancel</button>
                <button style={styles.submitBtn} onClick={handleEditSave} disabled={saving}>
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div style={styles.cardHeader}>
          <h2 style={styles.sectionTitle}>📝 Notes</h2>
          {searched && (
            <button style={styles.uploadBtn} onClick={() => setShowModal(true)}>
              ⬆️ Upload Notes
            </button>
          )}
        </div>

        {message && !showModal && (
          <p style={{ color: '#22c55e', fontSize: '14px', marginBottom: '12px' }}>{message}</p>
        )}

        {/* Filter */}
        <div style={styles.filterBox}>
          <div style={styles.filterRow}>
            <div style={styles.filterGroup}>
              <label style={styles.label}>Class</label>
              <select style={styles.input} value={selectedClass}
                onChange={e => { setSelectedClass(e.target.value); setSearched(false); setNotes([]) }}>
                <option value="">-- Select Class --</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <button style={styles.findBtn} onClick={handleFind}>🔍 Find</button>
          </div>
        </div>

        {/* Notes Grid */}
        {!searched ? (
          <div style={styles.emptyState}>
            <div style={{ fontSize: '64px' }}>📝</div>
            <p style={{ color: '#9ca3af', marginTop: '12px' }}>Select a class to view notes</p>
          </div>
        ) : loading ? (
          <p style={{ color: '#9ca3af' }}>Loading...</p>
        ) : notes.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={{ fontSize: '48px' }}>📝</div>
            <p style={{ color: '#9ca3af', marginTop: '12px' }}>No notes yet. Click "Upload Notes" to add one.</p>
          </div>
        ) : (
          <>
            <div style={styles.notesGrid}>
              {paginated.map(note => (
                <div key={note.id} style={styles.noteCard}>
                  {/* Card Header */}
                  <div>
                    <h3 style={styles.noteTitle}>{note.title}</h3>
                    <p style={styles.noteDate}>
                      {new Date(note.created_at).toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric'
                      })}
                    </p>
                  </div>

                  {/* Body */}
                  {note.body && (
                    <p style={styles.noteBody}>{note.body}</p>
                  )}

                  {/* Footer */}
                  <div style={styles.noteFooter}>
                    <div style={styles.noteActions}>
                      {note.file_url && (
                        <>
                          <a href={note.file_url} target="_blank" rel="noreferrer"
                            style={styles.iconBtn} title="View">👁</a>
                          <a href={note.file_url} download
                            style={styles.iconBtn} title="Download">⬇️</a>
                          <span style={{ fontSize: '12px', color: '#9ca3af' }}>{note.file_size}</span>
                        </>
                      )}
                    </div>
                    <div style={styles.noteActions}>
                      <button style={styles.iconBtn} onClick={() => setEditNote(note)} title="Edit">✏️</button>
                      <button style={{ ...styles.iconBtn, color: '#ef4444' }}
                        onClick={() => handleDelete(note.id, note.file_url)} title="Delete">🗑</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

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
    </div>
  )
}

const styles = {
  pageHeader: { marginBottom: '24px' },
  pageTitle: { fontSize: '28px', fontWeight: '700', color: '#1a1a2e', margin: 0 },
  card: { backgroundColor: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  sectionTitle: { fontSize: '16px', fontWeight: '700', color: '#1a1a2e' },
  uploadBtn: { padding: '8px 16px', backgroundColor: '#22c55e', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
  filterBox: { backgroundColor: '#f9fafb', borderRadius: '10px', padding: '16px', marginBottom: '24px' },
  filterRow: { display: 'flex', gap: '16px', alignItems: 'flex-end' },
  filterGroup: { display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '200px' },
  findBtn: { padding: '10px 20px', backgroundColor: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', height: '40px' },
  label: { fontSize: '13px', fontWeight: '600', color: '#374151' },
  input: { padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', outline: 'none' },
  textarea: { padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', outline: 'none', resize: 'vertical', fontFamily: 'inherit' },
  fileInput: { padding: '8px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px' },
  notesGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' },
  noteCard: { backgroundColor: '#f9fafb', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', border: '1px solid #e5e7eb' },
  noteTitle: { fontSize: '15px', fontWeight: '700', color: '#1a1a2e', margin: 0 },
  noteDate: { fontSize: '12px', color: '#9ca3af', margin: '4px 0 0' },
  noteBody: { fontSize: '13px', color: '#22c55e', margin: 0 },
  noteFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' },
  noteActions: { display: 'flex', alignItems: 'center', gap: '8px' },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', padding: '2px', textDecoration: 'none' },
  pagination: { display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px', marginTop: '20px' },
  pageBtn: { padding: '6px 12px', borderRadius: '6px', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: '13px' },
  pageNum: { padding: '6px 12px', borderRadius: '6px', backgroundColor: '#4f46e5', color: '#fff', fontSize: '13px' },
  emptyState: { textAlign: 'center', padding: '60px 0' },
  modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  modal: { backgroundColor: '#fff', borderRadius: '12px', padding: '28px', width: '460px', display: 'flex', flexDirection: 'column', gap: '16px' },
  formTitle: { fontSize: '18px', fontWeight: '700', color: '#1a1a2e' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  formButtons: { display: 'flex', gap: '12px', marginTop: '4px' },
  cancelBtn: { padding: '10px 20px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: '14px' },
  submitBtn: { padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#4f46e5', color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
}