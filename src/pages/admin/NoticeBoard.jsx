// import { useState, useEffect } from 'react'
// import { supabase } from '../../lib/supabase'

// const TABS = ['Create Notice', 'Notice Board']

// export default function NoticeBoard() {
//   const [activeTab, setActiveTab] = useState('Create Notice')

//   return (
//     <div>
//       <div style={styles.pageHeader}>
//         <h1 style={styles.pageTitle}>Notice Board</h1>
//       </div>

//       <div style={styles.card}>
//         <div style={styles.tabs}>
//           {TABS.map(tab => (
//             <button
//               key={tab}
//               onClick={() => setActiveTab(tab)}
//               style={{
//                 ...styles.tab,
//                 borderBottom: activeTab === tab ? '2px solid #22c55e' : '2px solid transparent',
//                 color: activeTab === tab ? '#22c55e' : '#6b7280',
//                 fontWeight: activeTab === tab ? '600' : '400',
//               }}
//             >
//               {tab}
//             </button>
//           ))}
//         </div>

//         {activeTab === 'Create Notice' && <CreateNotice onCreated={() => setActiveTab('Notice Board')} />}
//         {activeTab === 'Notice Board' && <ViewNotices />}
//       </div>
//     </div>
//   )
// }

// // ─── CREATE NOTICE ─────────────────────────────────────────
// function CreateNotice({ onCreated }) {
//   const [form, setForm] = useState({ title: '', body: '', importance: 'green', target: 'all' })
//   const [file, setFile] = useState(null)
//   const [loading, setLoading] = useState(false)
//   const [message, setMessage] = useState('')

//   const handlePost = async () => {
//     if (!form.title.trim()) {
//       setMessage('Notice title is required.')
//       return
//     }
//     setLoading(true)
//     setMessage('')

//     let fileUrl = null
//     let fileSize = null

//     if (file) {
//       const ext = file.name.split('.').pop()
//       const fileName = `notice_${Date.now()}.${ext}`
//       const { data: uploadData, error: uploadError } = await supabase.storage
//         .from('notices-files')
//         .upload(fileName, file)

//       if (uploadError) {
//         setMessage('File upload failed: ' + uploadError.message)
//         setLoading(false)
//         return
//       }

//       const { data: urlData } = supabase.storage.from('notices-files').getPublicUrl(fileName)
//       fileUrl = urlData.publicUrl
//       fileSize = (file.size / 1024).toFixed(0) + 'KB (' + ext + ')'
//     }

//     const { data: { user } } = await supabase.auth.getUser()
//     const { error } = await supabase.from('notices').insert({
//       title: form.title.trim(),
//       body: form.body.trim(),
//       importance: form.importance,
//       target: form.target,
//       file_url: fileUrl,
//       file_size: fileSize,
//       created_by: user.id,
//     })

//     if (error) {
//       setMessage('Error: ' + error.message)
//     } else {
//       setMessage('✅ Notice posted!')
//       setForm({ title: '', body: '', importance: 'green' })
//       setFile(null)
//       setTimeout(() => onCreated(), 1000)
//     }
//     setLoading(false)
//   }

//   const handleReset = () => {
//     setForm({ title: '', body: '', importance: 'green' })
//     setFile(null)
//     setMessage('')
//   }

//   return (
//     <div>
//       <div style={styles.sectionHeader}>
//         <h2 style={styles.sectionTitle}>📋 Create Notice</h2>
//       </div>

//       <div style={styles.form}>
//         <div style={styles.formGroup}>
//           <label style={styles.label}>Notice Title</label>
//           <input
//             style={styles.input}
//             placeholder="title of notice"
//             value={form.title}
//             onChange={e => setForm({ ...form, title: e.target.value })}
//           />
//         </div>

//         <div style={styles.formGroup}>
//           <label style={styles.label}>Notice Body</label>
//           <textarea
//             style={styles.textarea}
//             placeholder="Write notice body..."
//             value={form.body}
//             onChange={e => setForm({ ...form, body: e.target.value })}
//             rows={5}
//           />
//         </div>

//         <div style={styles.formGroup}>
//           <label style={styles.label}>Any file</label>
//           <input
//             type="file"
//             style={styles.fileInput}
//             onChange={e => setFile(e.target.files[0])}
//           />
//           {file && <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>Selected: {file.name}</p>}
//         </div>

//         <div style={styles.formGroup}>
//           <label style={styles.label}>Send To</label>
//           <div style={{ display: 'flex', gap: '12px' }}>
//             {[
//               { value: 'all', label: '👥 Everyone', color: '#4f46e5' },
//               { value: 'teachers', label: '👨‍🏫 Teachers Only', color: '#22c55e' },
//               { value: 'students', label: '👨‍🎓 Students Only', color: '#f59e0b' },
//             ].map(opt => (
//               <div key={opt.value} onClick={() => setForm({ ...form, target: opt.value })}
//                 style={{ padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600',
//                   backgroundColor: form.target === opt.value ? opt.color : '#f3f4f6',
//                   color: form.target === opt.value ? '#fff' : '#6b7280',
//                   border: form.target === opt.value ? `2px solid ${opt.color}` : '2px solid transparent',
//                 }}>
//                 {opt.label}
//               </div>
//             ))}
//           </div>
//         </div>
//         <div style={styles.formGroup}>
//           <label style={styles.label}>Importance</label>
//           <div style={styles.importanceRow}>
//             {['green', 'yellow', 'red'].map(color => (
//               <div
//                 key={color}
//                 onClick={() => setForm({ ...form, importance: color })}
//                 style={{
//                   ...styles.importanceDot,
//                   backgroundColor: color === 'green' ? '#22c55e' : color === 'yellow' ? '#eab308' : '#ef4444',
//                   border: form.importance === color ? '3px solid #1a1a2e' : '3px solid transparent',
//                   cursor: 'pointer',
//                 }}
//               >
//                 {form.importance === color && <span style={{ color: '#fff', fontSize: '12px' }}>✓</span>}
//               </div>
//             ))}
//           </div>
//         </div>

//         {message && (
//           <p style={{ color: message.startsWith('✅') ? '#22c55e' : '#ef4444', fontSize: '14px' }}>{message}</p>
//         )}

//         <div style={styles.formButtons}>
//           <button style={styles.resetBtn} onClick={handleReset}>Reset</button>
//           <button style={styles.submitBtn} onClick={handlePost} disabled={loading}>
//             {loading ? 'Posting...' : 'Post'}
//           </button>
//         </div>
//       </div>
//     </div>
//   )
// }

// // ─── VIEW NOTICES ──────────────────────────────────────────
// function ViewNotices() {
//   const [notices, setNotices] = useState([])
//   const [loading, setLoading] = useState(true)
//   const [editNotice, setEditNotice] = useState(null)
//   const [saving, setSaving] = useState(false)
//   const [page, setPage] = useState(1)
//   const PER_PAGE = 9

//   useEffect(() => { fetchNotices() }, [])

//   const fetchNotices = async () => {
//     setLoading(true)
//     const { data } = await supabase
//       .from('notices')
//       .select('*')
//       .order('created_at', { ascending: false })
//     setNotices(data || [])
//     setLoading(false)
//   }

//   const handleDelete = async (id, fileUrl) => {
//     if (!confirm('Delete this notice?')) return
//     if (fileUrl) {
//       const fileName = fileUrl.split('/').pop()
//       await supabase.storage.from('notices-files').remove([fileName])
//     }
//     await supabase.from('notices').delete().eq('id', id)
//     setNotices(notices.filter(n => n.id !== id))
//   }

//   const handleEdit = async () => {
//     setSaving(true)
//     const { error } = await supabase.from('notices').update({
//       title: editNotice.title,
//       body: editNotice.body,
//       importance: editNotice.importance,
//       target: editNotice.target,
//     }).eq('id', editNotice.id)
//     if (!error) {
//       setNotices(notices.map(n => n.id === editNotice.id ? { ...n, ...editNotice } : n))
//       setEditNotice(null)
//     }
//     setSaving(false)
//   }

//   const importanceColor = (imp) => {
//     if (imp === 'green') return '#22c55e'
//     if (imp === 'yellow') return '#eab308'
//     return '#ef4444'
//   }

//   const paginated = notices.slice((page - 1) * PER_PAGE, page * PER_PAGE)
//   const totalPages = Math.ceil(notices.length / PER_PAGE)

//   return (
//     <div>
//       {/* Edit Modal */}
//       {editNotice && (
//         <div style={styles.modalOverlay}>
//           <div style={styles.modal}>
//             <h3 style={styles.formTitle}>Edit Notice</h3>
//             <div style={styles.formGroup}>
//               <label style={styles.label}>Title</label>
//               <input style={styles.input} value={editNotice.title}
//                 onChange={e => setEditNotice({ ...editNotice, title: e.target.value })} />
//             </div>
//             <div style={styles.formGroup}>
//               <label style={styles.label}>Body</label>
//               <textarea style={styles.textarea} rows={4} value={editNotice.body || ''}
//                 onChange={e => setEditNotice({ ...editNotice, body: e.target.value })} />
//             </div>
//             <div style={styles.formGroup}>
//               <label style={styles.label}>Send To</label>
//               <div style={{ display: 'flex', gap: '12px' }}>
//                 {[
//                   { value: 'all', label: '👥 Everyone', color: '#4f46e5' },
//                   { value: 'teachers', label: '👨‍🏫 Teachers', color: '#22c55e' },
//                   { value: 'students', label: '👨‍🎓 Students', color: '#f59e0b' },
//                 ].map(opt => (
//                   <div key={opt.value} onClick={() => setEditNotice({ ...editNotice, target: opt.value })}
//                     style={{ padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600',
//                       backgroundColor: editNotice.target === opt.value ? opt.color : '#f3f4f6',
//                       color: editNotice.target === opt.value ? '#fff' : '#6b7280',
//                       border: editNotice.target === opt.value ? `2px solid ${opt.color}` : '2px solid transparent',
//                     }}>
//                     {opt.label}
//                   </div>
//                 ))}
//               </div>
//             </div>
//             <div style={styles.formGroup}>
//               <label style={styles.label}>Importance</label>
//               <div style={styles.importanceRow}>
//                 {['green', 'yellow', 'red'].map(color => (
//                   <div
//                     key={color}
//                     onClick={() => setEditNotice({ ...editNotice, importance: color })}
//                     style={{
//                       ...styles.importanceDot,
//                       backgroundColor: color === 'green' ? '#22c55e' : color === 'yellow' ? '#eab308' : '#ef4444',
//                       border: editNotice.importance === color ? '3px solid #1a1a2e' : '3px solid transparent',
//                       cursor: 'pointer',
//                     }}
//                   >
//                     {editNotice.importance === color && <span style={{ color: '#fff', fontSize: '12px' }}>✓</span>}
//                   </div>
//                 ))}
//               </div>
//             </div>
//             <div style={styles.formButtons}>
//               <button style={styles.resetBtn} onClick={() => setEditNotice(null)}>Cancel</button>
//               <button style={styles.submitBtn} onClick={handleEdit} disabled={saving}>
//                 {saving ? 'Saving...' : 'Save'}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       <div style={styles.sectionHeader}>
//         <h2 style={styles.sectionTitle}>📋 Notice Board</h2>
//       </div>

//       {loading ? (
//         <p style={{ color: '#9ca3af' }}>Loading...</p>
//       ) : notices.length === 0 ? (
//         <div style={styles.emptyState}>
//           <div style={{ fontSize: '64px' }}>📢</div>
//           <p style={{ color: '#9ca3af', marginTop: '12px' }}>No notices yet</p>
//         </div>
//       ) : (
//         <>
//           <div style={styles.noticeGrid}>
//             {paginated.map(n => (
//               <div key={n.id} style={styles.noticeCard}>
//                 {/* Card Header */}
//                 <div style={styles.noticeCardHeader}>
//                   <div>
//                     <h3 style={styles.noticeCardTitle}>{n.title}</h3>
//                     <p style={styles.noticeCardDate}>
//                       <span style={{ backgroundColor: n.target === 'teachers' ? '#dcfce7' : n.target === 'students' ? '#fef9c3' : '#dbeafe', color: n.target === 'teachers' ? '#16a34a' : n.target === 'students' ? '#ca8a04' : '#1d4ed8', padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', marginRight: '6px' }}>{n.target === 'teachers' ? '👨‍🏫 Teachers' : n.target === 'students' ? '👨‍🎓 Students' : '👥 Everyone'}</span>
//                       {new Date(n.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
//                     </p>
//                   </div>
//                   <div style={{
//                     width: '14px', height: '14px', borderRadius: '50%',
//                     backgroundColor: importanceColor(n.importance), flexShrink: 0,
//                   }} />
//                 </div>

//                 {/* Body */}
//                 {n.body && (
//                   <p style={{ ...styles.noticeCardBody, color: importanceColor(n.importance) }}>
//                     {n.body}
//                   </p>
//                 )}

//                 {/* Footer */}
//                 <div style={styles.noticeCardFooter}>
//                   <div style={styles.noticeCardActions}>
//                     {n.file_url && (
//                       <>
//                         <a href={n.file_url} target="_blank" rel="noreferrer" style={styles.iconBtn} title="View">👁</a>
//                         <a href={n.file_url} download style={styles.iconBtn} title="Download">⬇️</a>
//                         <span style={{ fontSize: '12px', color: '#9ca3af' }}>{n.file_size}</span>
//                       </>
//                     )}
//                   </div>
//                   <div style={styles.noticeCardActions}>
//                     <button style={styles.iconBtn} onClick={() => setEditNotice(n)} title="Edit">✏️</button>
//                     <button style={{ ...styles.iconBtn, color: '#ef4444' }} onClick={() => handleDelete(n.id, n.file_url)} title="Delete">🗑</button>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>

//           {totalPages > 1 && (
//             <div style={styles.pagination}>
//               <button style={styles.pageBtn} onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>prev</button>
//               <span style={styles.pageNum}>{page}</span>
//               <button style={styles.pageBtn} onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>next</button>
//             </div>
//           )}
//         </>
//       )}
//     </div>
//   )
// }

// const styles = {
//   pageHeader: { marginBottom: '24px' },
//   pageTitle: { fontSize: '28px', fontWeight: '700', color: '#1a1a2e', margin: 0 },
//   card: { backgroundColor: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
//   tabs: { display: 'flex', gap: '4px', borderBottom: '1px solid #e5e7eb', marginBottom: '24px' },
//   tab: { padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', transition: 'all 0.2s' },
//   sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
//   sectionTitle: { fontSize: '16px', fontWeight: '700', color: '#1a1a2e' },
//   form: { maxWidth: '560px', display: 'flex', flexDirection: 'column', gap: '20px' },
//   formGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
//   label: { fontSize: '13px', fontWeight: '600', color: '#374151' },
//   input: { padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', outline: 'none' },
//   textarea: { padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', outline: 'none', resize: 'vertical', fontFamily: 'inherit' },
//   fileInput: { padding: '8px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px' },
//   importanceRow: { display: 'flex', gap: '12px', alignItems: 'center' },
//   importanceDot: { width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'border 0.2s' },
//   formButtons: { display: 'flex', gap: '12px' },
//   resetBtn: { padding: '10px 24px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: '14px', color: '#eab308', fontWeight: '600' },
//   submitBtn: { padding: '10px 24px', borderRadius: '8px', border: 'none', backgroundColor: '#4f46e5', color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
//   noticeGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' },
//   noticeCard: { backgroundColor: '#f9fafb', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', border: '1px solid #e5e7eb' },
//   noticeCardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' },
//   noticeCardTitle: { fontSize: '15px', fontWeight: '700', color: '#1a1a2e', margin: 0 },
//   noticeCardDate: { fontSize: '12px', color: '#9ca3af', margin: '4px 0 0' },
//   noticeCardBody: { fontSize: '13px', margin: 0 },
//   noticeCardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' },
//   noticeCardActions: { display: 'flex', alignItems: 'center', gap: '8px' },
//   iconBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', padding: '2px', textDecoration: 'none' },
//   pagination: { display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px', marginTop: '20px' },
//   pageBtn: { padding: '6px 12px', borderRadius: '6px', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: '13px' },
//   pageNum: { padding: '6px 12px', borderRadius: '6px', backgroundColor: '#4f46e5', color: '#fff', fontSize: '13px' },
//   emptyState: { textAlign: 'center', padding: '60px 0' },
//   modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
//   modal: { backgroundColor: '#fff', borderRadius: '12px', padding: '28px', width: '460px', display: 'flex', flexDirection: 'column', gap: '16px' },
//   formTitle: { fontSize: '18px', fontWeight: '700', color: '#1a1a2e' },
// }


import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

const TABS = ['Create Notice', 'Notice Board']

export default function NoticeBoard() {
  const [activeTab, setActiveTab] = useState('Create Notice')

  return (
    <div style={styles.container}>
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Notice Board</h1>
          <p style={styles.pageSubtitle}>Broadcast announcements to students and teachers</p>
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.tabContainer}>
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                ...styles.tab,
                backgroundColor: activeTab === tab ? '#fff' : 'transparent',
                color: activeTab === tab ? '#111827' : '#6b7280',
                boxShadow: activeTab === tab ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                fontWeight: activeTab === tab ? '600' : '500',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'Create Notice' && <CreateNotice onCreated={() => setActiveTab('Notice Board')} />}
        {activeTab === 'Notice Board' && <ViewNotices />}
      </div>
    </div>
  )
}

// ─── CREATE NOTICE ─────────────────────────────────────────
function CreateNotice({ onCreated }) {
  const [form, setForm] = useState({ title: '', body: '', importance: 'green', target: 'all' })
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handlePost = async () => {
    if (!form.title.trim()) {
      setMessage('❌ Notice title is required.')
      return
    }
    setLoading(true)
    setMessage('')

    let fileUrl = null
    let fileSize = null

    if (file) {
      const ext = file.name.split('.').pop()
      const fileName = `notice_${Date.now()}.${ext}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('notices-files')
        .upload(fileName, file)

      if (uploadError) {
        setMessage('❌ File upload failed: ' + uploadError.message)
        setLoading(false)
        return
      }

      const { data: urlData } = supabase.storage.from('notices-files').getPublicUrl(fileName)
      fileUrl = urlData.publicUrl
      fileSize = (file.size / 1024).toFixed(0) + 'KB (' + ext.toUpperCase() + ')'
    }

    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('notices').insert({
      title: form.title.trim(),
      body: form.body.trim(),
      importance: form.importance,
      target: form.target,
      file_url: fileUrl,
      file_size: fileSize,
      created_by: user.id,
    })

    if (error) {
      setMessage('❌ Error: ' + error.message)
    } else {
      setMessage('✅ Notice posted successfully!')
      setForm({ title: '', body: '', importance: 'green', target: 'all' })
      setFile(null)
      setTimeout(() => onCreated(), 1500)
    }
    setLoading(false)
  }

  const handleReset = () => {
    setForm({ title: '', body: '', importance: 'green', target: 'all' })
    setFile(null)
    setMessage('')
  }

  return (
    <div style={styles.fadeIn}>
      <div style={styles.sectionHeader}>
        <h2 style={styles.sectionTitle}>✍️ Draft Announcement</h2>
      </div>

      <div style={styles.form}>
        <div style={styles.formGroup}>
          <label style={styles.label}>Notice Title</label>
          <input
            style={styles.input}
            placeholder="e.g. Annual Sports Day 2024"
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Notice Body</label>
          <textarea
            style={styles.textarea}
            placeholder="Write the full details of the announcement here..."
            value={form.body}
            onChange={e => setForm({ ...form, body: e.target.value })}
            rows={5}
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Attachment (Optional)</label>
          <div style={styles.fileUploadWrapper}>
            <input
              type="file"
              style={styles.fileInput}
              onChange={e => setFile(e.target.files[0])}
              id="notice-file"
            />
          </div>
          {file && <p style={{ fontSize: '13px', color: '#10b981', marginTop: '6px', fontWeight: '500' }}>📎 Selected: {file.name}</p>}
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Target Audience</label>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {[
              { value: 'all', label: '👥 Everyone', color: '#3b82f6', bg: '#eff6ff' },
              { value: 'teachers', label: '👨‍🏫 Teachers Only', color: '#10b981', bg: '#f0fdf4' },
              { value: 'students', label: '👨‍🎓 Students Only', color: '#f59e0b', bg: '#fffbeb' },
            ].map(opt => (
              <div key={opt.value} onClick={() => setForm({ ...form, target: opt.value })}
                style={{
                  ...styles.selectorPill,
                  backgroundColor: form.target === opt.value ? opt.color : '#f8fafc',
                  color: form.target === opt.value ? '#fff' : '#64748b',
                  border: form.target === opt.value ? `1px solid ${opt.color}` : '1px solid #e2e8f0',
                }}>
                {opt.label}
              </div>
            ))}
          </div>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Priority Level</label>
          <div style={styles.importanceRow}>
            {[
              { color: 'green', hex: '#10b981', label: 'Normal' },
              { color: 'yellow', hex: '#f59e0b', label: 'Important' },
              { color: 'red', hex: '#ef4444', label: 'Urgent' }
            ].map(lvl => (
              <div
                key={lvl.color}
                onClick={() => setForm({ ...form, importance: lvl.color })}
                style={{
                  ...styles.importancePill,
                  backgroundColor: form.importance === lvl.color ? lvl.hex : '#f8fafc',
                  color: form.importance === lvl.color ? '#fff' : '#64748b',
                  borderColor: form.importance === lvl.color ? lvl.hex : '#e2e8f0',
                }}
              >
                <div style={{
                  width: '10px', height: '10px', borderRadius: '50%',
                  backgroundColor: form.importance === lvl.color ? '#fff' : lvl.hex
                }} />
                {lvl.label}
              </div>
            ))}
          </div>
        </div>

        {message && (
          <div style={{ ...styles.alertBox, backgroundColor: message.startsWith('✅') ? '#f0fdf4' : '#fef2f2', border: message.startsWith('✅') ? '1px solid #bbf7d0' : '1px solid #fecaca', color: message.startsWith('✅') ? '#15803d' : '#991b1b' }}>
            {message}
          </div>
        )}

        <div style={styles.formButtons}>
          <button style={styles.resetBtn} onClick={handleReset}>↺ Clear Form</button>
          <button style={styles.submitBtn} onClick={handlePost} disabled={loading}>
            {loading ? '⏳ Posting...' : '📢 Publish Notice'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── VIEW NOTICES ──────────────────────────────────────────
function ViewNotices() {
  const [notices, setNotices] = useState([])
  const [loading, setLoading] = useState(true)
  const [editNotice, setEditNotice] = useState(null)
  const [saving, setSaving] = useState(false)
  const [page, setPage] = useState(1)
  const PER_PAGE = 9

  useEffect(() => { fetchNotices() }, [])

  const fetchNotices = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('notices')
      .select('*')
      .order('created_at', { ascending: false })
    setNotices(data || [])
    setLoading(false)
  }

  const handleDelete = async (id, fileUrl) => {
    if (!window.confirm('Are you sure you want to delete this notice?')) return
    if (fileUrl) {
      const fileName = fileUrl.split('/').pop()
      await supabase.storage.from('notices-files').remove([fileName])
    }
    await supabase.from('notices').delete().eq('id', id)
    setNotices(notices.filter(n => n.id !== id))
  }

  const handleEdit = async () => {
    setSaving(true)
    const { error } = await supabase.from('notices').update({
      title: editNotice.title,
      body: editNotice.body,
      importance: editNotice.importance,
      target: editNotice.target,
    }).eq('id', editNotice.id)
    
    if (!error) {
      setNotices(notices.map(n => n.id === editNotice.id ? { ...n, ...editNotice } : n))
      setEditNotice(null)
    }
    setSaving(false)
  }

  const getTargetStyles = (target) => {
    if (target === 'teachers') return { bg: '#f0fdf4', color: '#16a34a', text: '👨‍🏫 Teachers' }
    if (target === 'students') return { bg: '#fffbeb', color: '#d97706', text: '👨‍🎓 Students' }
    return { bg: '#eff6ff', color: '#2563eb', text: '👥 Everyone' }
  }

  const paginated = notices.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  const totalPages = Math.ceil(notices.length / PER_PAGE)

  return (
    <div style={styles.fadeIn}>
      {/* Edit Modal */}
      {editNotice && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3 style={styles.formTitle}>Edit Notice</h3>
            <div style={styles.formGroup}>
              <label style={styles.label}>Title</label>
              <input style={styles.input} value={editNotice.title}
                onChange={e => setEditNotice({ ...editNotice, title: e.target.value })} />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Body</label>
              <textarea style={styles.textarea} rows={4} value={editNotice.body || ''}
                onChange={e => setEditNotice({ ...editNotice, body: e.target.value })} />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Send To</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[
                  { value: 'all', label: '👥 Everyone', color: '#3b82f6' },
                  { value: 'teachers', label: '👨‍🏫 Teachers', color: '#10b981' },
                  { value: 'students', label: '👨‍🎓 Students', color: '#f59e0b' },
                ].map(opt => (
                  <div key={opt.value} onClick={() => setEditNotice({ ...editNotice, target: opt.value })}
                    style={{
                      ...styles.selectorPill, padding: '6px 12px',
                      backgroundColor: editNotice.target === opt.value ? opt.color : '#f8fafc',
                      color: editNotice.target === opt.value ? '#fff' : '#64748b',
                      border: editNotice.target === opt.value ? `1px solid ${opt.color}` : '1px solid #e2e8f0',
                    }}>
                    {opt.label}
                  </div>
                ))}
              </div>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Priority</label>
              <div style={styles.importanceRow}>
                {[
                  { color: 'green', hex: '#10b981', label: 'Normal' },
                  { color: 'yellow', hex: '#f59e0b', label: 'Important' },
                  { color: 'red', hex: '#ef4444', label: 'Urgent' }
                ].map(lvl => (
                  <div key={lvl.color} onClick={() => setEditNotice({ ...editNotice, importance: lvl.color })}
                    style={{
                      ...styles.importancePill, padding: '6px 12px',
                      backgroundColor: editNotice.importance === lvl.color ? lvl.hex : '#f8fafc',
                      color: editNotice.importance === lvl.color ? '#fff' : '#64748b',
                      borderColor: editNotice.importance === lvl.color ? lvl.hex : '#e2e8f0',
                    }}>
                    {lvl.label}
                  </div>
                ))}
              </div>
            </div>
            <div style={styles.formButtons}>
              <button style={styles.resetBtn} onClick={() => setEditNotice(null)}>Cancel</button>
              <button style={styles.submitBtn} onClick={handleEdit} disabled={saving}>
                {saving ? '⏳ Saving...' : '💾 Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={styles.sectionHeader}>
        <h2 style={styles.sectionTitle}>📌 Published Notices</h2>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>⏳ Loading announcements...</div>
      ) : notices.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyStateIcon}>📢</div>
          <h3 style={{ color: '#374151', margin: '0 0 8px 0' }}>Notice Board is empty</h3>
          <p style={{ color: '#6b7280', margin: 0, fontSize: '14px' }}>There are currently no active announcements.</p>
        </div>
      ) : (
        <>
          <div style={styles.noticeGrid}>
            {paginated.map(n => {
              const targetStyle = getTargetStyles(n.target)
              const dotColor = n.importance === 'green' ? '#10b981' : n.importance === 'yellow' ? '#f59e0b' : '#ef4444'
              
              return (
                <div key={n.id} style={{...styles.noticeCard, borderTop: `4px solid ${dotColor}`}}>
                  
                  <div style={styles.noticeCardHeader}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%', gap: '12px' }}>
                      <h3 style={styles.noticeCardTitle}>{n.title}</h3>
                      <span style={{ 
                        backgroundColor: targetStyle.bg, 
                        color: targetStyle.color, 
                        padding: '4px 10px', 
                        borderRadius: '20px', 
                        fontSize: '11px', 
                        fontWeight: '700', 
                        whiteSpace: 'nowrap' 
                      }}>
                        {targetStyle.text}
                      </span>
                    </div>
                    <p style={styles.noticeCardDate}>
                      🗓️ {new Date(n.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>

                  {n.body && (
                    <div style={styles.noticeCardBodyWrapper}>
                      <p style={styles.noticeCardBody}>{n.body}</p>
                    </div>
                  )}

                  <div style={styles.noticeCardFooter}>
                    <div style={styles.noticeCardActions}>
                      {n.file_url ? (
                        <div style={styles.attachmentBadge}>
                          📎 <a href={n.file_url} target="_blank" rel="noreferrer" style={{ color: '#2563eb', textDecoration: 'none' }}>View</a>
                          <span style={{ margin: '0 4px', color: '#cbd5e1' }}>|</span>
                          <a href={n.file_url} download style={{ color: '#2563eb', textDecoration: 'none' }}>⬇️ Save</a>
                          <span style={{ fontSize: '11px', color: '#94a3b8', marginLeft: '6px' }}>({n.file_size})</span>
                        </div>
                      ) : (
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>No attachments</span>
                      )}
                    </div>
                    
                    <div style={styles.noticeCardActions}>
                      <button style={styles.actionBtn} onClick={() => setEditNotice(n)} title="Edit">✏️</button>
                      <button style={{ ...styles.actionBtn, color: '#dc2626', backgroundColor: '#fef2f2' }} onClick={() => handleDelete(n.id, n.file_url)} title="Delete">🗑️</button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {totalPages > 1 && (
            <div style={styles.pagination}>
              <button style={styles.pageBtn} onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Previous</button>
              <span style={styles.pageNum}>Page {page} of {totalPages}</span>
              <button style={styles.pageBtn} onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── STYLES ────────────────────────────────────────────────
const styles = {
  container: { maxWidth: '1100px', margin: '0 auto', padding: '20px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' },
  pageHeader: { marginBottom: '32px' },
  pageTitle: { fontSize: '32px', fontWeight: '800', color: '#111827', margin: '0 0 8px 0', letterSpacing: '-0.5px' },
  pageSubtitle: { fontSize: '15px', color: '#6b7280', margin: 0 },
  
  card: { backgroundColor: '#fff', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)', border: '1px solid #f3f4f6' },
  
  tabContainer: { display: 'inline-flex', background: '#f1f5f9', padding: '4px', borderRadius: '12px', marginBottom: '32px' },
  tab: { padding: '10px 24px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', transition: 'all 0.2s ease' },
  
  fadeIn: { opacity: 1, transition: 'opacity 0.3s ease-in' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  sectionTitle: { fontSize: '18px', fontWeight: '700', color: '#1f2937', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' },
  
  form: { maxWidth: '650px', display: 'flex', flexDirection: 'column', gap: '24px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '13px', fontWeight: '600', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' },
  input: { padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', backgroundColor: '#fff', color: '#1e293b', transition: 'border-color 0.2s', width: '100%' },
  textarea: { padding: '16px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', resize: 'vertical', fontFamily: 'inherit', color: '#1e293b', minHeight: '120px' },
  fileUploadWrapper: { padding: '8px', border: '1px dashed #cbd5e1', borderRadius: '8px', backgroundColor: '#f8fafc' },
  fileInput: { width: '100%', fontSize: '14px', color: '#64748b' },
  
  selectorPill: { padding: '10px 20px', borderRadius: '24px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', gap: '6px' },
  importanceRow: { display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' },
  importancePill: { padding: '8px 16px', borderRadius: '24px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', transition: 'all 0.2s ease', fontSize: '13px', fontWeight: '600', border: '1px solid' },
  
  alertBox: { padding: '12px 16px', borderRadius: '8px', marginBottom: '8px', fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center' },
  
  formButtons: { display: 'flex', gap: '16px', marginTop: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '24px' },
  resetBtn: { padding: '12px 24px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontSize: '14px', color: '#475569', fontWeight: '600', transition: 'background-color 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' },
  submitBtn: { padding: '12px 32px', borderRadius: '8px', border: 'none', backgroundColor: '#2563eb', color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: '600', transition: 'background-color 0.2s', boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.3)' },
  
  noticeGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' },
  noticeCard: { backgroundColor: '#fff', borderRadius: '12px', display: 'flex', flexDirection: 'column', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', transition: 'transform 0.2s, box-shadow 0.2s', overflow: 'hidden' },
  noticeCardHeader: { padding: '16px 20px 12px', borderBottom: '1px solid #f1f5f9', backgroundColor: '#f8fafc' },
  noticeCardTitle: { fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: 0, lineHeight: '1.4' },
  noticeCardDate: { fontSize: '12px', color: '#64748b', margin: '8px 0 0', fontWeight: '500' },
  noticeCardBodyWrapper: { padding: '16px 20px', flexGrow: 1 },
  noticeCardBody: { fontSize: '14px', margin: 0, color: '#334155', lineHeight: '1.6', whiteSpace: 'pre-wrap' },
  noticeCardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderTop: '1px solid #f1f5f9', backgroundColor: '#f8fafc' },
  noticeCardActions: { display: 'flex', alignItems: 'center', gap: '8px' },
  attachmentBadge: { fontSize: '13px', backgroundColor: '#eff6ff', padding: '6px 10px', borderRadius: '6px', border: '1px solid #bfdbfe', display: 'inline-flex', alignItems: 'center' },
  actionBtn: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', padding: '6px 10px', transition: 'all 0.2s' },
  
  pagination: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '32px', paddingTop: '20px', borderTop: '1px solid #e2e8f0' },
  pageBtn: { padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: '500', color: '#334155', transition: 'background-color 0.2s' },
  pageNum: { fontSize: '14px', fontWeight: '600', color: '#64748b' },
  
  emptyState: { textAlign: 'center', padding: '60px 20px', border: '2px dashed #e2e8f0', borderRadius: '12px', backgroundColor: '#fafaf9', marginTop: '16px' },
  emptyStateIcon: { fontSize: '56px', marginBottom: '16px', opacity: 0.8 },
  
  modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, backdropFilter: 'blur(4px)' },
  modal: { backgroundColor: '#fff', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' },
  formTitle: { fontSize: '20px', fontWeight: '700', color: '#0f172a', margin: 0 },
}