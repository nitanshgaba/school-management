// import { useState, useEffect } from 'react'
// import { supabase } from '../../lib/supabase'
// import { useAuth } from '../../context/AuthContext'

// export default function TeacherSyllabus() {
//   const { profile } = useAuth()
//   const [syllabi, setSyllabi] = useState([])
//   const [classes, setClasses] = useState([])
//   const [subjects, setSubjects] = useState([])
//   const [loading, setLoading] = useState(true)
//   const [uploading, setUploading] = useState(false)
//   const [showForm, setShowForm] = useState(false)
//   const [message, setMessage] = useState('')
//   const [form, setForm] = useState({ title: '', class_id: '', subject_id: '', description: '' })
//   const [file, setFile] = useState(null)

//   useEffect(() => {
//     fetchData()
//   }, [])

//   const fetchData = async () => {
//     const [{ data: s }, { data: c }, { data: sub }] = await Promise.all([
//       supabase.from('syllabus').select('*, classes(name), subjects(name)').eq('teacher_id', profile.id).order('created_at', { ascending: false }),
//       supabase.from('classes').select('*'),
//       supabase.from('subjects').select('*').eq('teacher_id', profile.id),
//     ])
//     setSyllabi(s || [])
//     setClasses(c || [])
//     setSubjects(sub || [])
//     setLoading(false)
//   }

//   const handleUpload = async () => {
//     if (!form.title || !form.class_id) { setMessage('Title and class are required'); return }
//     setUploading(true)
//     setMessage('')
//     let file_url = null

//     if (file) {
//       const ext = file.name.split('.').pop()
//       const fileName = `syllabus_${Date.now()}.${ext}`
//       const { error: uploadError } = await supabase.storage.from('syllabus-files').upload(fileName, file)
//       if (uploadError) { setMessage('File upload failed'); setUploading(false); return }
//       const { data: urlData } = supabase.storage.from('syllabus-files').getPublicUrl(fileName)
//       file_url = urlData.publicUrl
//     }

//     const { data, error } = await supabase.from('syllabus').insert({
//       title: form.title,
//       class_id: form.class_id || null,
//       subject_id: form.subject_id || null,
//       teacher_id: profile.id,
//       description: form.description,
//       file_url,
//     }).select('*, classes(name), subjects(name)').single()

//     if (error) { setMessage('Error saving syllabus'); setUploading(false); return }
//     setSyllabi([data, ...syllabi])
//     setForm({ title: '', class_id: '', subject_id: '', description: '' })
//     setFile(null)
//     setShowForm(false)
//     setMessage('✅ Syllabus uploaded!')
//     setUploading(false)
//   }

//   const handleDelete = async (id, fileUrl) => {
//     if (!confirm('Delete this syllabus?')) return
//     if (fileUrl) {
//       const fileName = fileUrl.split('/').pop()
//       await supabase.storage.from('syllabus-files').remove([fileName])
//     }
//     await supabase.from('syllabus').delete().eq('id', id)
//     setSyllabi(syllabi.filter(s => s.id !== id))
//   }

//   if (loading) return <div style={styles.loading}>Loading...</div>

//   return (
//     <div>
//       <div style={styles.header}>
//         <h1 style={styles.title}>Syllabus</h1>
//         <button style={styles.addBtn} onClick={() => setShowForm(!showForm)}>
//           {showForm ? '✕ Cancel' : '+ Upload Syllabus'}
//         </button>
//       </div>

//       {message && <p style={{ color: message.startsWith('✅') ? '#22c55e' : '#ef4444', marginBottom: '16px' }}>{message}</p>}

//       {showForm && (
//         <div style={styles.card}>
//           <h2 style={styles.cardTitle}>Upload New Syllabus</h2>
//           <div style={styles.formGrid}>
//             <div style={styles.formGroup}>
//               <label style={styles.label}>Title *</label>
//               <input style={styles.input} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Chapter 1 - Algebra" />
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
//         {syllabi.length === 0 ? (
//           <div style={styles.emptyState}>
//             <div style={{ fontSize: '64px' }}>📖</div>
//             <p style={{ color: '#9ca3af', marginTop: '12px' }}>No syllabus uploaded yet</p>
//           </div>
//         ) : syllabi.map(s => (
//           <div key={s.id} style={styles.syllabusCard}>
//             <div style={styles.syllabusIcon}>📖</div>
//             <div style={styles.syllabusInfo}>
//               <p style={styles.syllabusTitle}>{s.title}</p>
//               <p style={styles.syllabusMeta}>{s.classes?.name} {s.subjects?.name && `· ${s.subjects.name}`}</p>
//               {s.description && <p style={styles.syllabusDesc}>{s.description}</p>}
//             </div>
//             <div style={styles.syllabusActions}>
//               {s.file_url && <a href={s.file_url} target="_blank" rel="noreferrer" style={styles.viewBtn}>📥 View</a>}
//               <button style={styles.deleteBtn} onClick={() => handleDelete(s.id, s.file_url)}>🗑</button>
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
//   syllabusCard: { backgroundColor: '#fff', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: '16px' },
//   syllabusIcon: { fontSize: '32px', flexShrink: 0 },
//   syllabusInfo: { flex: 1 },
//   syllabusTitle: { fontSize: '15px', fontWeight: '600', color: '#1a1a2e', margin: 0 },
//   syllabusMeta: { fontSize: '13px', color: '#6b7280', margin: '2px 0 0' },
//   syllabusDesc: { fontSize: '13px', color: '#9ca3af', margin: '4px 0 0' },
//   syllabusActions: { display: 'flex', gap: '8px', alignItems: 'center' },
//   viewBtn: { padding: '6px 12px', backgroundColor: '#dbeafe', color: '#1d4ed8', borderRadius: '6px', fontSize: '13px', textDecoration: 'none', fontWeight: '500' },
//   deleteBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' },
// }






import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

export default function TeacherSyllabus() {
  const { profile } = useAuth()
  const [syllabi, setSyllabi] = useState([])
  const [classes, setClasses] = useState([])
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [message, setMessage] = useState('')
  const [form, setForm] = useState({ title: '', class_id: '', subject_id: '' })
  const [file, setFile] = useState(null)

  useEffect(() => {
    if (profile?.id) fetchData()
  }, [profile?.id])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [{ data: s, error: sErr }, { data: c }, { data: sub }] = await Promise.all([
        supabase
          .from('syllabus')
          .select('*, classes(name), subjects(name)')
          .order('created_at', { ascending: false }),
        supabase.from('classes').select('*'),
        supabase.from('subjects').select('*').eq('teacher_id', profile.id),
      ])

      if (sErr) throw sErr
      setSyllabi(s || [])
      setClasses(c || [])
      setSubjects(sub || [])
    } catch (err) {
      console.error('Syllabus Fetch Error:', err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async () => {
    if (!form.title || !form.class_id) {
      setMessage('❌ Title and Class are required.')
      return
    }
    if (!file) {
      setMessage('❌ Please attach a PDF or Document file.')
      return
    }

    setUploading(true)
    setMessage('')
    let file_url = null

    try {
      const sanitizedName = file.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()
      const fileName = `${Date.now()}_${sanitizedName}`
      const filePath = `${profile.id}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('syllabus')
        .upload(filePath, file)

      if (uploadError) throw new Error(`Storage Error: ${uploadError.message}`)

      const { data: urlData } = supabase.storage.from('syllabus').getPublicUrl(filePath)
      file_url = urlData.publicUrl

      const { data, error: dbError } = await supabase
        .from('syllabus')
        .insert([{
          title: form.title,
          class_id: form.class_id,
          subject_id: form.subject_id || null,
          file_url,
        }])
        .select('*, classes(name), subjects(name)')
        .single()

      if (dbError) throw dbError

      setSyllabi([data, ...syllabi])
      setForm({ title: '', class_id: '', subject_id: '' })
      setFile(null)
      setShowForm(false)
      setMessage('✅ Syllabus published successfully!')
      setTimeout(() => setMessage(''), 4000)
    } catch (err) {
      console.error(err)
      setMessage(`❌ Error: ${err.message}`)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id, fileUrl) => {
    if (!confirm('Are you sure? Students will no longer be able to access this file.')) return
    try {
      if (fileUrl) {
        const pathMatch = fileUrl.split('/syllabus/')
        if (pathMatch.length > 1) {
          await supabase.storage.from('syllabus').remove([pathMatch[1]])
        }
      }
      await supabase.from('syllabus').delete().eq('id', id)
      setSyllabi(syllabi.filter(s => s.id !== id))
    } catch (err) {
      alert('Delete failed: ' + err.message)
    }
  }

  if (loading) return <div style={styles.loadingBox}>⌛ Loading syllabus...</div>

  return (
    <div style={styles.container}>
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Curriculum Management</h1>
          <p style={styles.pageSubtitle}>Upload and track academic syllabus documents for your classes</p>
        </div>
        <button
          style={{ ...styles.addBtn, backgroundColor: showForm ? '#ef4444' : '#4f46e5' }}
          onClick={() => { setShowForm(!showForm); setMessage('') }}
        >
          {showForm ? '✕ Close Form' : '＋ New Document'}
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
          <h2 style={styles.cardTitle}>New Syllabus Entry</h2>
          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Document Title *</label>
              <input style={styles.input} value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Final Term Mathematics 2026" />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Class *</label>
              <select style={styles.input} value={form.class_id} onChange={e => setForm({ ...form, class_id: e.target.value })}>
                <option value="">-- Select Class --</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Subject (Optional)</label>
              <select style={styles.input} value={form.subject_id} onChange={e => setForm({ ...form, subject_id: e.target.value })}>
                <option value="">-- Select Subject --</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Attachment (PDF/DOC)</label>
              <input style={styles.fileInput} type="file" accept=".pdf,.doc,.docx"
                onChange={e => setFile(e.target.files[0])} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
            <button style={styles.submitBtn} onClick={handleUpload} disabled={uploading}>
              {uploading ? '⌛ Uploading...' : '📤 Publish Document'}
            </button>
          </div>
        </div>
      )}

      <div style={styles.listSection}>
        {syllabi.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>📚</div>
            <h3 style={{ color: '#0f172a', margin: '0 0 8px 0' }}>Repository is Empty</h3>
            <p style={{ color: '#64748b', margin: 0 }}>No syllabus documents have been uploaded yet.</p>
          </div>
        ) : (
          <div style={styles.grid}>
            {syllabi.map((s, index) => (
              <div key={s.id} style={styles.syllabusCard}>
                <div style={{ ...styles.iconBox, backgroundColor: ['#eff6ff', '#f0fdf4', '#fffbeb'][index % 3] }}>
                  <span style={{ fontSize: '24px' }}>📄</span>
                </div>
                <div style={styles.syllabusInfo}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <h3 style={styles.syllabusTitle}>{s.title}</h3>
                    <span style={styles.classBadge}>CLASS {s.classes?.name}</span>
                  </div>
                  <p style={styles.syllabusMeta}>
                    <span style={{ color: '#4f46e5', fontWeight: '700' }}>{s.subjects?.name || 'General Curriculum'}</span>
                    <span style={{ margin: '0 8px', color: '#cbd5e1' }}>•</span>
                    <span>{new Date(s.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </p>
                </div>
                <div style={styles.syllabusActions}>
                  {s.file_url && (
                    <a href={s.file_url} target="_blank" rel="noreferrer" style={styles.viewBtn}>View PDF</a>
                  )}
                  <button style={styles.deleteBtn} onClick={() => handleDelete(s.id, s.file_url)}>🗑️</button>
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
  container: { maxWidth: '1100px', margin: '0 auto', padding: '32px', fontFamily: 'Inter, system-ui, sans-serif' },
  loadingBox: { textAlign: 'center', padding: '120px', color: '#64748b', fontSize: '18px', fontWeight: '600' },
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', flexWrap: 'wrap', gap: '20px' },
  pageTitle: { fontSize: '32px', fontWeight: '900', color: '#0f172a', margin: 0, letterSpacing: '-1px' },
  pageSubtitle: { fontSize: '16px', color: '#64748b', margin: '4px 0 0' },
  addBtn: { padding: '12px 28px', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '700', fontSize: '14px' },
  alert: { padding: '16px 24px', borderRadius: '14px', marginBottom: '32px', fontSize: '14px', fontWeight: '600' },
  formCard: { backgroundColor: '#fff', borderRadius: '20px', padding: '32px', border: '1px solid #f1f5f9', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)', marginBottom: '40px' },
  cardTitle: { fontSize: '18px', fontWeight: '800', color: '#1e293b', marginBottom: '24px' },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', marginBottom: '24px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' },
  input: { padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none' },
  fileInput: { padding: '10px', border: '1px dashed #cbd5e1', borderRadius: '10px', backgroundColor: '#f8fafc' },
  submitBtn: { padding: '14px 32px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' },
  listSection: {},
  grid: { display: 'flex', flexDirection: 'column', gap: '16px' },
  syllabusCard: { backgroundColor: '#fff', borderRadius: '20px', padding: '24px', display: 'flex', alignItems: 'center', gap: '24px', border: '1px solid #f1f5f9' },
  iconBox: { width: '60px', height: '60px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  syllabusInfo: { flex: 1 },
  syllabusTitle: { fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0 },
  classBadge: { backgroundColor: '#f1f5f9', color: '#475569', padding: '4px 10px', borderRadius: '8px', fontSize: '10px', fontWeight: '800' },
  syllabusMeta: { fontSize: '13px', color: '#94a3b8', margin: '4px 0 0', display: 'flex', alignItems: 'center' },
  syllabusActions: { display: 'flex', gap: '12px', alignItems: 'center', flexShrink: 0 },
  viewBtn: { padding: '10px 20px', backgroundColor: '#eff6ff', color: '#2563eb', borderRadius: '10px', fontSize: '13px', textDecoration: 'none', fontWeight: '800', border: '1px solid #dbeafe' },
  deleteBtn: { background: '#fef2f2', border: '1px solid #fee2e2', padding: '10px', borderRadius: '10px', cursor: 'pointer', fontSize: '16px' },
  emptyState: { textAlign: 'center', padding: '100px 40px', border: '2px dashed #e2e8f0', borderRadius: '24px', backgroundColor: '#f8fafc' },
}