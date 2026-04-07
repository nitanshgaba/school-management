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
  const [form, setForm] = useState({ title: '', class_id: '', subject_id: '', body: '' })
  const [file, setFile] = useState(null)

  useEffect(() => {
    if (profile?.id) fetchData()
  }, [profile?.id])

  const fetchData = async () => {
    setLoading(true)
    try {
      // 1. Fetch data separately to avoid "relationship not found" errors
      const [notesRes, classesRes, subjectsRes] = await Promise.all([
        supabase.from('notes').select('*').eq('uploaded_by', profile.id).order('created_at', { ascending: false }),
        supabase.from('classes').select('id, name'),
        // Your subject table might use teacher_id or uploaded_by, adjust if needed
        supabase.from('subjects').select('id, name').eq('teacher_id', profile.id)
      ])

      setClasses(classesRes.data || [])
      setSubjects(subjectsRes.data || [])

      // 2. Manually map Class names to the Notes for the UI
      const mappedNotes = (notesRes.data || []).map(note => ({
        ...note,
        className: classesRes.data?.find(c => c.id === note.class_id)?.name || 'N/A',
        subjectName: subjectsRes.data?.find(s => s.id === note.subject_id)?.name || 'General'
      }))

      setNotes(mappedNotes)
    } catch (err) {
      console.error("Data Load Error:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async () => {
    if (!form.title || !form.class_id || !file) { 
      setMessage('❌ Title, Class, and File are required'); 
      return 
    }
    
    setUploading(true)
    setMessage('')

    try {
      // Create unique path in storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}_${file.name.replace(/[^a-z0-9]/gi, '_')}`
      const filePath = `${profile.id}/${fileName}`

      // Upload to your 'notes-files' bucket
      const { error: uploadError } = await supabase.storage
        .from('notes-files')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('notes-files')
        .getPublicUrl(filePath)

      // 3. INSERT - Using 'uploaded_by' to match your SQL Schema screenshot
      const { data: insertedData, error: dbError } = await supabase
        .from('notes')
        .insert([{
          title: form.title,
          body: form.body, // Added body column from your schema
          class_id: form.class_id,
          subject_id: form.subject_id || null,
          file_url: publicUrl,
          uploaded_by: profile.id, // MATCHES YOUR SCHEMA
          file_size: (file.size / 1024).toFixed(1) + ' KB' // Optional: filling file_size
        }])
        .select()
        .single()

      if (dbError) throw dbError

      // Update UI
      const newNote = {
        ...insertedData,
        className: classes.find(c => c.id === insertedData.class_id)?.name || 'N/A',
        subjectName: subjects.find(s => s.id === insertedData.subject_id)?.name || 'General'
      }

      setNotes([newNote, ...notes])
      setForm({ title: '', class_id: '', subject_id: '', body: '' })
      setFile(null)
      setShowForm(false)
      setMessage('✅ Study material published!')
    } catch (err) {
      setMessage(`❌ Error: ${err.message}`)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id, fileUrl) => {
    if (!confirm('Delete this material?')) return
    try {
      if (fileUrl) {
        const path = fileUrl.split('/notes-files/')[1]
        if (path) await supabase.storage.from('notes-files').remove([path])
      }
      await supabase.from('notes').delete().eq('id', id)
      setNotes(prev => prev.filter(n => n.id !== id))
    } catch (err) { alert(err.message) }
  }

  if (loading) return <div style={styles.loadingBox}>⌛ Loading library...</div>

  return (
    <div style={styles.container}>
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Study Materials</h1>
          <p style={styles.pageSubtitle}>Manage digital resources for your classes</p>
        </div>
        <button style={styles.addBtn} onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Close' : '＋ Add Material'}
        </button>
      </div>

      {message && <div style={{...styles.alert, color: message.startsWith('✅') ? '#10b981' : '#ef4444'}}>{message}</div>}

      {showForm && (
        <div style={styles.formCard}>
          <div style={styles.formGrid}>
            <div style={styles.fGroup}>
               <label style={styles.fLabel}>Document Title</label>
               <input style={styles.input} value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. Chapter 1 Notes" />
            </div>
            <div style={styles.fGroup}>
               <label style={styles.fLabel}>Class</label>
               <select style={styles.input} value={form.class_id} onChange={e => setForm({...form, class_id: e.target.value})}>
                 <option value="">Select Class</option>
                 {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
               </select>
            </div>
            <div style={styles.fGroup}>
               <label style={styles.fLabel}>File</label>
               <input type="file" onChange={e => setFile(e.target.files[0])} style={styles.input} />
            </div>
          </div>
          <div style={{marginTop: '15px'}}>
             <label style={styles.fLabel}>Notes / Description</label>
             <textarea style={{...styles.input, width:'100%', height:'80px'}} value={form.body} onChange={e => setForm({...form, body: e.target.value})} placeholder="Enter additional details..." />
          </div>
          <button style={styles.submitBtn} onClick={handleUpload} disabled={uploading}>{uploading ? 'Processing...' : '🚀 Publish Material'}</button>
        </div>
      )}

      <div style={styles.grid}>
        {notes.length === 0 ? <p style={{textAlign: 'center', padding: '60px', color: '#94a3b8'}}>No study materials found.</p> : 
          notes.map(n => (
            <div key={n.id} style={styles.noteCard}>
              <div style={styles.noteInfo}>
                <h3 style={styles.noteTitle}>{n.title}</h3>
                <p style={styles.noteMeta}>Class: {n.className} • {n.subjectName}</p>
                {n.body && <p style={{fontSize:'12px', color:'#94a3b8', marginTop:'5px'}}>{n.body}</p>}
              </div>
              <div style={styles.noteActions}>
                <a href={n.file_url} target="_blank" rel="noreferrer" style={styles.viewBtn}>View</a>
                <button onClick={() => handleDelete(n.id, n.file_url)} style={styles.deleteBtn}>Delete</button>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  )
}

const styles = {
  container: { padding: '32px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'Inter, sans-serif' },
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' },
  pageTitle: { fontSize: '28px', fontWeight: '800', margin: 0 },
  addBtn: { padding: '12px 24px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '700' },
  formCard: { background: '#fff', padding: '32px', borderRadius: '20px', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', marginBottom: '32px' },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' },
  fGroup: { display: 'flex', flexDirection: 'column', gap: '5px' },
  fLabel: { fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' },
  input: { padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none' },
  submitBtn: { padding: '14px 28px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '700', width: '100%', marginTop: '20px' },
  alert: { padding: '16px', borderRadius: '12px', marginBottom: '24px', fontWeight: '700', background: '#f8fafc', border: '1px solid #e2e8f0' },
  grid: { display: 'flex', flexDirection: 'column', gap: '16px' },
  noteCard: { background: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  noteTitle: { margin: 0, fontSize: '17px', fontWeight: '700' },
  noteMeta: { margin: '4px 0 0', color: '#64748b', fontSize: '13px' },
  viewBtn: { textDecoration: 'none', color: '#4f46e5', fontWeight: '700', padding: '8px 16px', background: '#eff6ff', borderRadius: '8px' },
  deleteBtn: { background: 'none', border: 'none', color: '#ef4444', fontWeight: '600', cursor: 'pointer' },
  loadingBox: { textAlign: 'center', padding: '100px' }
}