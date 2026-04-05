// import { useState, useEffect } from 'react'
// import { supabase } from '../../lib/supabase'
// import { useAuth } from '../../context/AuthContext'

// export default function TeacherNotes() {
//   const { profile } = useAuth()
//   const [notes, setNotes] = useState([])
//   const [classes, setClasses] = useState([])
//   const [subjects, setSubjects] = useState([])
//   const [loading, setLoading] = useState(true)
//   const [uploading, setUploading] = useState(false)
//   const [showForm, setShowForm] = useState(false)
//   const [message, setMessage] = useState('')
//   const [form, setForm] = useState({ title: '', class_id: '', subject_id: '', description: '' })
//   const [file, setFile] = useState(null)

//   useEffect(() => { fetchData() }, [])

//   const fetchData = async () => {
//     const [{ data: n }, { data: c }, { data: s }] = await Promise.all([
//       supabase.from('notes').select('*, classes(name), subjects(name)').eq('teacher_id', profile.id).order('created_at', { ascending: false }),
//       supabase.from('classes').select('*'),
//       supabase.from('subjects').select('*').eq('teacher_id', profile.id),
//     ])
//     setNotes(n || [])
//     setClasses(c || [])
//     setSubjects(s || [])
//     setLoading(false)
//   }

//   const handleUpload = async () => {
//     if (!form.title || !form.class_id) { setMessage('Title and class are required'); return }
//     setUploading(true)
//     setMessage('')
//     let file_url = null

//     if (file) {
//       const ext = file.name.split('.').pop()
//       const fileName = `note_${Date.now()}.${ext}`
//       const { error: uploadError } = await supabase.storage.from('notes-files').upload(fileName, file)
//       if (uploadError) { setMessage('File upload failed'); setUploading(false); return }
//       const { data: urlData } = supabase.storage.from('notes-files').getPublicUrl(fileName)
//       file_url = urlData.publicUrl
//     }

//     const { data, error } = await supabase.from('notes').insert({
//       title: form.title,
//       class_id: form.class_id || null,
//       subject_id: form.subject_id || null,
//       teacher_id: profile.id,
//       description: form.description,
//       file_url,
//     }).select('*, classes(name), subjects(name)').single()

//     if (error) { setMessage('Error saving note'); setUploading(false); return }
//     setNotes([data, ...notes])
//     setForm({ title: '', class_id: '', subject_id: '', description: '' })
//     setFile(null)
//     setShowForm(false)
//     setMessage('✅ Note uploaded!')
//     setUploading(false)
//   }

//   const handleDelete = async (id, fileUrl) => {
//     if (!confirm('Delete this note?')) return
//     if (fileUrl) {
//       const fileName = fileUrl.split('/').pop()
//       await supabase.storage.from('notes-files').remove([fileName])
//     }
//     await supabase.from('notes').delete().eq('id', id)
//     setNotes(notes.filter(n => n.id !== id))
//   }

//   if (loading) return <div style={styles.loading}>Loading...</div>

//   return (
//     <div>
//       <div style={styles.header}>
//         <h1 style={styles.title}>Notes</h1>
//         <button style={styles.addBtn} onClick={() => setShowForm(!showForm)}>
//           {showForm ? '✕ Cancel' : '+ Upload Note'}
//         </button>
//       </div>

//       {message && <p style={{ color: message.startsWith('✅') ? '#22c55e' : '#ef4444', marginBottom: '16px' }}>{message}</p>}

//       {showForm && (
//         <div style={styles.card}>
//           <h2 style={styles.cardTitle}>Upload New Note</h2>
//           <div style={styles.formGrid}>
//             <div style={styles.formGroup}>
//               <label style={styles.label}>Title *</label>
//               <input style={styles.input} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Chapter 2 Notes" />
//             </div>
//             <div style={styles.formGroup}>
//               <label style={styles.label}>Class *</label>
//               <select style={styles.input} value={form.class_id} onChange={e => setForm({ ...form, class_id: e.target.value })}>
//                 <option value="">-- Select Class --</option>
//                 {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
//               </select>
//             </div>
//             <div style={styles.formGroup}>
//               <label style={styles.label}>Subject</label>
//               <select style={styles.input} value={form.subject_id} onChange={e => setForm({ ...form, subject_id: e.target.value })}>
//                 <option value="">-- Select Subject --</option>
//                 {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
//               </select>
//             </div>
//             <div style={styles.formGroup}>
//               <label style={styles.label}>File (PDF/DOC)</label>
//               <input style={styles.input} type="file" accept=".pdf,.doc,.docx" onChange={e => setFile(e.target.files[0])} />
//             </div>
//           </div>
//           <div style={styles.formGroup}>
//             <label style={styles.label}>Description</label>
//             <textarea style={{ ...styles.input, height: '80px', resize: 'vertical' }} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Optional description..." />
//           </div>
//           <button style={styles.submitBtn} onClick={handleUpload} disabled={uploading}>
//             {uploading ? 'Uploading...' : '📤 Upload'}
//           </button>
//         </div>
//       )}

//       <div style={styles.grid}>
//         {notes.length === 0 ? (
//           <div style={styles.emptyState}>
//             <div style={{ fontSize: '64px' }}>📝</div>
//             <p style={{ color: '#9ca3af', marginTop: '12px' }}>No notes uploaded yet</p>
//           </div>
//         ) : notes.map(n => (
//           <div key={n.id} style={styles.noteCard}>
//             <div style={styles.noteIcon}>📝</div>
//             <div style={styles.noteInfo}>
//               <p style={styles.noteTitle}>{n.title}</p>
//               <p style={styles.noteMeta}>{n.classes?.name} {n.subjects?.name && `· ${n.subjects.name}`}</p>
//               {n.description && <p style={styles.noteDesc}>{n.description}</p>}
//             </div>
//             <div style={styles.noteActions}>
//               {n.file_url && <a href={n.file_url} target="_blank" rel="noreferrer" style={styles.viewBtn}>📥 View</a>}
//               <button style={styles.deleteBtn} onClick={() => handleDelete(n.id, n.file_url)}>🗑</button>
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   )
// }

// const styles = {
//   loading: { textAlign: 'center', padding: '40px', color: '#9ca3af' },
//   header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
//   title: { fontSize: '24px', fontWeight: '700', color: '#1a1a2e', margin: 0 },
//   addBtn: { padding: '10px 20px', backgroundColor: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
//   card: { backgroundColor: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: '20px' },
//   cardTitle: { fontSize: '16px', fontWeight: '700', color: '#1a1a2e', marginBottom: '16px' },
//   formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' },
//   formGroup: { display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' },
//   label: { fontSize: '13px', fontWeight: '600', color: '#374151' },
//   input: { padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', outline: 'none' },
//   submitBtn: { padding: '10px 24px', backgroundColor: '#22c55e', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
//   grid: { display: 'flex', flexDirection: 'column', gap: '12px' },
//   emptyState: { textAlign: 'center', padding: '80px 0' },
//   noteCard: { backgroundColor: '#fff', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: '16px' },
//   noteIcon: { fontSize: '32px', flexShrink: 0 },
//   noteInfo: { flex: 1 },
//   noteTitle: { fontSize: '15px', fontWeight: '600', color: '#1a1a2e', margin: 0 },
//   noteMeta: { fontSize: '13px', color: '#6b7280', margin: '2px 0 0' },
//   noteDesc: { fontSize: '13px', color: '#9ca3af', margin: '4px 0 0' },
//   noteActions: { display: 'flex', gap: '8px', alignItems: 'center' },
//   viewBtn: { padding: '6px 12px', backgroundColor: '#dbeafe', color: '#1d4ed8', borderRadius: '6px', fontSize: '13px', textDecoration: 'none', fontWeight: '500' },
//   deleteBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' },
// }



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
    if (!form.title || !form.class_id) { setMessage('❌ Title and class are required'); return }
    setUploading(true)
    setMessage('')
    let file_url = null

    if (file) {
      const ext = file.name.split('.').pop()
      const fileName = `note_${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage.from('notes-files').upload(fileName, file)
      if (uploadError) { setMessage('❌ File upload failed'); setUploading(false); return }
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

    if (error) { setMessage('❌ Error saving note'); setUploading(false); return }
    setNotes([data, ...notes])
    setForm({ title: '', class_id: '', subject_id: '', description: '' })
    setFile(null)
    setShowForm(false)
    setMessage('✅ Note uploaded successfully!')
    setTimeout(() => setMessage(''), 3000)
    setUploading(false)
  }

  const handleDelete = async (id, fileUrl) => {
    if (!confirm('Are you sure you want to delete this study note?')) return
    if (fileUrl) {
      const fileName = fileUrl.split('/').pop()
      await supabase.storage.from('notes-files').remove([fileName])
    }
    await supabase.from('notes').delete().eq('id', id)
    setNotes(notes.filter(n => n.id !== id))
  }

  if (loading) return <div style={styles.loadingBox}>⌛ Loading your resource library...</div>

  return (
    <div style={styles.container}>
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Study Materials</h1>
          <p style={styles.pageSubtitle}>Manage and share lecture notes and digital resources with your classes</p>
        </div>
        <button 
          style={{ ...styles.addBtn, backgroundColor: showForm ? '#64748b' : '#4f46e5' }} 
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? '✕ Close Form' : '＋ Add New Note'}
        </button>
      </div>

      {message && (
        <div style={{ 
          ...styles.alert, 
          backgroundColor: message.startsWith('✅') ? '#f0fdf4' : '#fef2f2',
          color: message.startsWith('✅') ? '#16a34a' : '#dc2626',
          border: `1px solid ${message.startsWith('✅') ? '#bbf7d0' : '#fecaca'}`
        }}>
          {message}
        </div>
      )}

      {showForm && (
        <div style={styles.formCard}>
          <h2 style={styles.cardTitle}>Upload Study Resource</h2>
          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Note Title *</label>
              <input style={styles.input} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Intro to Quantum Mechanics" />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Assign to Class *</label>
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
              <label style={styles.label}>Upload File (PDF/DOC)</label>
              <input style={styles.fileInput} type="file" accept=".pdf,.doc,.docx" onChange={e => setFile(e.target.files[0])} />
            </div>
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Brief Description</label>
            <textarea style={styles.textarea} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="What should students know about this note?" />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
            <button style={styles.submitBtn} onClick={handleUpload} disabled={uploading}>
              {uploading ? '⌛ Uploading...' : '🚀 Publish Note'}
            </button>
          </div>
        </div>
      )}

      <div style={styles.listSection}>
        {notes.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={{ fontSize: '56px', marginBottom: '16px' }}>📑</div>
            <h3 style={{ color: '#0f172a', margin: '0 0 8px 0' }}>Empty Library</h3>
            <p style={{ color: '#64748b', margin: 0 }}>You haven't uploaded any study materials yet.</p>
          </div>
        ) : (
          <div style={styles.grid}>
            {notes.map((n, index) => (
              <div key={n.id} style={styles.noteCard}>
                <div style={{ ...styles.iconBox, backgroundColor: ['#eff6ff', '#f5f3ff', '#fff1f2', '#f0fdf4'][index % 4] }}>
                  <span style={{ fontSize: '24px' }}>📝</span>
                </div>
                <div style={styles.noteInfo}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <h3 style={styles.noteTitle}>{n.title}</h3>
                    <span style={styles.classBadge}>Class {n.classes?.name}</span>
                  </div>
                  <p style={styles.noteMeta}>
                    <span style={{ color: '#4f46e5', fontWeight: '600' }}>{n.subjects?.name || 'General'}</span>
                    <span style={{ margin: '0 8px', color: '#cbd5e1' }}>•</span>
                    <span>Created {new Date(n.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                  </p>
                  {n.description && <p style={styles.noteDesc}>{n.description}</p>}
                </div>
                <div style={styles.noteActions}>
                  {n.file_url && (
                    <a href={n.file_url} target="_blank" rel="noreferrer" style={styles.viewBtn}>
                      📥 Download
                    </a>
                  )}
                  <button style={styles.deleteBtn} onClick={() => handleDelete(n.id, n.file_url)} title="Delete note">
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const styles = {
  container: { maxWidth: '1000px', margin: '0 auto', padding: '20px', fontFamily: 'Inter, sans-serif' },
  loadingBox: { textAlign: 'center', padding: '100px', color: '#64748b', fontSize: '16px', fontWeight: '600' },
  
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: '20px' },
  pageTitle: { fontSize: '32px', fontWeight: '800', color: '#111827', margin: 0, letterSpacing: '-0.5px' },
  pageSubtitle: { fontSize: '15px', color: '#64748b', margin: '4px 0 0' },
  
  addBtn: { padding: '12px 24px', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '14px', transition: '0.2s', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' },
  
  alert: { padding: '14px 20px', borderRadius: '12px', marginBottom: '24px', fontSize: '14px', fontWeight: '600', animation: 'fadeIn 0.3s ease-in' },

  formCard: { backgroundColor: '#fff', borderRadius: '16px', padding: '28px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9', marginBottom: '32px', animation: 'slideDown 0.3s ease-out' },
  cardTitle: { fontSize: '18px', fontWeight: '800', color: '#1e293b', marginBottom: '24px' },
  
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '16px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' },
  input: { padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', color: '#1e293b', transition: 'border-color 0.2s' },
  fileInput: { padding: '8px', fontSize: '13px', color: '#64748b' },
  textarea: { padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', height: '100px', resize: 'vertical', fontFamily: 'inherit' },
  submitBtn: { padding: '12px 28px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '14px', boxShadow: '0 4px 10px rgba(16, 185, 129, 0.2)' },

  listSection: { animation: 'fadeIn 0.4s ease-in' },
  grid: { display: 'flex', flexDirection: 'column', gap: '16px' },
  
  noteCard: { backgroundColor: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '20px', border: '1px solid #f1f5f9', transition: 'transform 0.2s', ':hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' } },
  iconBox: { width: '56px', height: '56px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  
  noteInfo: { flex: 1 },
  noteTitle: { fontSize: '17px', fontWeight: '800', color: '#0f172a', margin: 0 },
  classBadge: { backgroundColor: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700' },
  noteMeta: { fontSize: '13px', color: '#94a3b8', margin: '4px 0', display: 'flex', alignItems: 'center' },
  noteDesc: { fontSize: '14px', color: '#64748b', margin: '8px 0 0', lineHeight: '1.5' },
  
  noteActions: { display: 'flex', gap: '12px', alignItems: 'center' },
  viewBtn: { padding: '8px 16px', backgroundColor: '#eef2ff', color: '#4f46e5', borderRadius: '8px', fontSize: '13px', textDecoration: 'none', fontWeight: '700', border: '1px solid #c7d2fe', transition: 'all 0.2s' },
  deleteBtn: { background: '#fef2f2', border: '1px solid #fecaca', padding: '8px', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', transition: '0.2s' },

  emptyState: { textAlign: 'center', padding: '80px 20px', border: '2px dashed #e2e8f0', borderRadius: '20px', backgroundColor: '#fafaf9' },
}