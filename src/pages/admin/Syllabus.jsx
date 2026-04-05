// import { useState, useEffect } from 'react'
// import { supabase } from '../../lib/supabase'

// export default function Syllabus() {
//   const [classes, setClasses] = useState([])
//   const [subjects, setSubjects] = useState([])
//   const [syllabus, setSyllabus] = useState([])
//   const [selectedClass, setSelectedClass] = useState('')
//   const [selectedClassName, setSelectedClassName] = useState('')
//   const [searched, setSearched] = useState(false)
//   const [loading, setLoading] = useState(false)
//   const [uploading, setUploading] = useState({})
//   const [message, setMessage] = useState('')

//   useEffect(() => {
//     supabase.from('classes').select('*').order('id').then(({ data }) => setClasses(data || []))
//   }, [])

//   const handleFind = async () => {
//     if (!selectedClass) return
//     setLoading(true)
//     setSearched(true)

//     // Get subjects for class
//     const { data: subjectsData } = await supabase
//       .from('subjects')
//       .select('*')
//       .eq('class_id', selectedClass)
//       .order('name')

//     // Get existing syllabus uploads
//     const { data: syllabusData } = await supabase
//       .from('syllabus')
//       .select('*')
//       .eq('class_id', selectedClass)

//     setSubjects(subjectsData || [])
//     setSyllabus(syllabusData || [])
//     setLoading(false)
//   }

//   const getSyllabusForSubject = (subjectId) => {
//     return syllabus.find(s => s.subject_id === subjectId)
//   }

//   const handleUpload = async (subjectId, file) => {
//     if (!file) return
//     setUploading(prev => ({ ...prev, [subjectId]: true }))
//     setMessage('')

//     const ext = file.name.split('.').pop()
//     const fileName = `syllabus_${selectedClass}_${subjectId}_${Date.now()}.${ext}`

//     const { error: uploadError } = await supabase.storage
//       .from('syllabus-files')
//       .upload(fileName, file, { upsert: true })

//     if (uploadError) {
//       setMessage('Upload failed: ' + uploadError.message)
//       setUploading(prev => ({ ...prev, [subjectId]: false }))
//       return
//     }

//     const { data: urlData } = supabase.storage.from('syllabus-files').getPublicUrl(fileName)
//     const fileUrl = urlData.publicUrl
//     const { data: { user } } = await supabase.auth.getUser()

//     // Upsert syllabus record
//     const existing = getSyllabusForSubject(subjectId)
//     if (existing) {
//       await supabase.from('syllabus').update({
//         file_url: fileUrl,
//         uploaded_by: user.id,
//         uploaded_at: new Date().toISOString(),
//       }).eq('id', existing.id)
//       setSyllabus(syllabus.map(s => s.id === existing.id ? { ...s, file_url: fileUrl } : s))
//     } else {
//       const { data: newRecord } = await supabase.from('syllabus').insert({
//         class_id: parseInt(selectedClass),
//         subject_id: subjectId,
//         file_url: fileUrl,
//         uploaded_by: user.id,
//       }).select().single()
//       if (newRecord) setSyllabus([...syllabus, newRecord])
//     }

//     setMessage('✅ Syllabus uploaded successfully!')
//     setTimeout(() => setMessage(''), 3000)
//     setUploading(prev => ({ ...prev, [subjectId]: false }))
//   }

//   const handleUploadAll = () => {
//     document.getElementById('uploadAllInput').click()
//   }

//   return (
//     <div>
//       <div style={styles.pageHeader}>
//         <h1 style={styles.pageTitle}>Syllabus</h1>
//       </div>

//       <div style={styles.card}>
//         {/* Header */}
//         <div style={styles.cardHeader}>
//           <h2 style={styles.sectionTitle}>📖 Syllabus</h2>
//           {searched && (
//             <>
//               <input
//                 id="uploadAllInput"
//                 type="file"
//                 style={{ display: 'none' }}
//                 accept=".pdf,.doc,.docx"
//               />
//               <button style={styles.uploadBtn} onClick={handleUploadAll}>
//                 ⬆️ Upload Syllabus
//               </button>
//             </>
//           )}
//         </div>

//         {message && (
//           <p style={{ color: message.startsWith('✅') ? '#22c55e' : '#ef4444', fontSize: '14px', marginBottom: '12px' }}>
//             {message}
//           </p>
//         )}

//         {/* Filter */}
//         <div style={styles.filterBox}>
//           <div style={styles.filterRow}>
//             <div style={styles.filterGroup}>
//               <label style={styles.label}>Class</label>
//               <select
//                 style={styles.input}
//                 value={selectedClass}
//                 onChange={e => {
//                   setSelectedClass(e.target.value)
//                   setSelectedClassName(classes.find(c => c.id == e.target.value)?.name || '')
//                   setSearched(false)
//                   setSubjects([])
//                   setSyllabus([])
//                 }}
//               >
//                 <option value="">-- Select Class --</option>
//                 {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
//               </select>
//             </div>
//             <button style={styles.findBtn} onClick={handleFind}>🔍 Find</button>
//           </div>
//         </div>

//         {/* Syllabus Table */}
//         {!searched ? (
//           <div style={styles.emptyState}>
//             <div style={{ fontSize: '64px' }}>📖</div>
//             <p style={{ color: '#9ca3af', marginTop: '12px' }}>Select a class to manage syllabus</p>
//           </div>
//         ) : loading ? (
//           <p style={{ color: '#9ca3af' }}>Loading...</p>
//         ) : subjects.length === 0 ? (
//           <div style={styles.emptyState}>
//             <div style={{ fontSize: '48px' }}>📚</div>
//             <p style={{ color: '#9ca3af', marginTop: '12px' }}>
//               No subjects found for {selectedClassName}. Add subjects first.
//             </p>
//           </div>
//         ) : (
//           <table style={styles.table}>
//             <thead>
//               <tr>
//                 <th style={styles.th}>#</th>
//                 <th style={styles.th}>Subject</th>
//                 <th style={styles.th}>Syllabus</th>
//               </tr>
//             </thead>
//             <tbody>
//               {subjects.map((subject, i) => {
//                 const syllabusRecord = getSyllabusForSubject(subject.id)
//                 return (
//                   <tr key={subject.id}>
//                     <td style={styles.td}>{i + 1}.</td>
//                     <td style={styles.td}>{subject.name}</td>
//                     <td style={styles.td}>
//                       <div style={styles.syllabusActions}>
//                         {/* Download */}
//                         {syllabusRecord?.file_url ? (
//                           <a
//                             href={syllabusRecord.file_url}
//                             download
//                             style={styles.downloadBtn}
//                           >
//                             ⬇️ Download
//                           </a>
//                         ) : (
//                           <button style={styles.downloadBtnDisabled} disabled>
//                             ⬇️ Download
//                           </button>
//                         )}

//                         {/* Upload */}
//                         <label style={styles.uploadBtnSmall}>
//                           {uploading[subject.id] ? 'Uploading...' : '⬆️ Upload'}
//                           <input
//                             type="file"
//                             style={{ display: 'none' }}
//                             accept=".pdf,.doc,.docx,.ppt,.pptx"
//                             onChange={e => handleUpload(subject.id, e.target.files[0])}
//                             disabled={uploading[subject.id]}
//                           />
//                         </label>
//                       </div>
//                     </td>
//                   </tr>
//                 )
//               })}
//             </tbody>
//           </table>
//         )}
//       </div>
//     </div>
//   )
// }

// const styles = {
//   pageHeader: { marginBottom: '24px' },
//   pageTitle: { fontSize: '28px', fontWeight: '700', color: '#1a1a2e', margin: 0 },
//   card: { backgroundColor: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
//   cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
//   sectionTitle: { fontSize: '16px', fontWeight: '700', color: '#1a1a2e' },
//   uploadBtn: { padding: '8px 16px', backgroundColor: '#22c55e', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
//   filterBox: { backgroundColor: '#f9fafb', borderRadius: '10px', padding: '16px', marginBottom: '24px' },
//   filterRow: { display: 'flex', gap: '16px', alignItems: 'flex-end' },
//   filterGroup: { display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '200px' },
//   findBtn: { padding: '10px 20px', backgroundColor: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', height: '40px' },
//   label: { fontSize: '13px', fontWeight: '600', color: '#374151' },
//   input: { padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', outline: 'none' },
//   table: { width: '100%', borderCollapse: 'collapse' },
//   th: { textAlign: 'left', fontSize: '13px', color: '#6b7280', fontWeight: '600', padding: '10px 12px', borderBottom: '2px solid #f3f4f6' },
//   td: { padding: '12px', fontSize: '14px', color: '#374151', borderBottom: '1px solid #f9fafb' },
//   syllabusActions: { display: 'flex', gap: '10px', alignItems: 'center' },
//   downloadBtn: { padding: '6px 14px', backgroundColor: '#22c55e', color: '#fff', border: 'none', borderRadius: '20px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', textDecoration: 'none', display: 'inline-block' },
//   downloadBtnDisabled: { padding: '6px 14px', backgroundColor: '#d1d5db', color: '#fff', border: 'none', borderRadius: '20px', fontSize: '13px', fontWeight: '600', cursor: 'not-allowed' },
//   uploadBtnSmall: { padding: '6px 14px', backgroundColor: '#4f46e5', color: '#fff', border: 'none', borderRadius: '20px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', display: 'inline-block' },
//   emptyState: { textAlign: 'center', padding: '60px 0' },
// }


import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function Syllabus() {
  const [classes, setClasses] = useState([])
  const [subjects, setSubjects] = useState([])
  const [syllabus, setSyllabus] = useState([])
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedClassName, setSelectedClassName] = useState('')
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState({})
  const [message, setMessage] = useState('')

  useEffect(() => {
    supabase.from('classes').select('*').order('id').then(({ data }) => setClasses(data || []))
  }, [])

  const handleFind = async () => {
    if (!selectedClass) return
    setLoading(true)
    setSearched(true)

    // Get subjects for class
    const { data: subjectsData } = await supabase
      .from('subjects')
      .select('*')
      .eq('class_id', selectedClass)
      .order('name')

    // Get existing syllabus uploads
    const { data: syllabusData } = await supabase
      .from('syllabus')
      .select('*')
      .eq('class_id', selectedClass)

    setSubjects(subjectsData || [])
    setSyllabus(syllabusData || [])
    setLoading(false)
  }

  const getSyllabusForSubject = (subjectId) => {
    return syllabus.find(s => s.subject_id === subjectId)
  }

  const handleUpload = async (subjectId, file) => {
    if (!file) return
    setUploading(prev => ({ ...prev, [subjectId]: true }))
    setMessage('')

    const ext = file.name.split('.').pop()
    const fileName = `syllabus_${selectedClass}_${subjectId}_${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('syllabus-files')
      .upload(fileName, file, { upsert: true })

    if (uploadError) {
      setMessage('❌ Upload failed: ' + uploadError.message)
      setUploading(prev => ({ ...prev, [subjectId]: false }))
      return
    }

    const { data: urlData } = supabase.storage.from('syllabus-files').getPublicUrl(fileName)
    const fileUrl = urlData.publicUrl
    const { data: { user } } = await supabase.auth.getUser()

    // Upsert syllabus record
    const existing = getSyllabusForSubject(subjectId)
    if (existing) {
      await supabase.from('syllabus').update({
        file_url: fileUrl,
        uploaded_by: user.id,
        uploaded_at: new Date().toISOString(),
      }).eq('id', existing.id)
      setSyllabus(syllabus.map(s => s.id === existing.id ? { ...s, file_url: fileUrl } : s))
    } else {
      const { data: newRecord } = await supabase.from('syllabus').insert({
        class_id: parseInt(selectedClass),
        subject_id: subjectId,
        file_url: fileUrl,
        uploaded_by: user.id,
      }).select().single()
      if (newRecord) setSyllabus([...syllabus, newRecord])
    }

    setMessage('✅ Syllabus uploaded successfully!')
    setTimeout(() => setMessage(''), 3000)
    setUploading(prev => ({ ...prev, [subjectId]: false }))
  }

  const handleUploadAll = () => {
    document.getElementById('uploadAllInput').click()
  }

  return (
    <div style={styles.container}>
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Syllabus Management</h1>
          <p style={styles.pageSubtitle}>Upload and manage course curriculum documents</p>
        </div>
      </div>

      <div style={styles.card}>
        {/* Header */}
        <div style={styles.cardHeader}>
          <h2 style={styles.sectionTitle}>🎯 Select Class to View</h2>
          {searched && (
            <>
              <input
                id="uploadAllInput"
                type="file"
                style={{ display: 'none' }}
                accept=".pdf,.doc,.docx"
              />
              <button style={styles.uploadBulkBtn} onClick={handleUploadAll}>
                <span style={{ marginRight: '6px' }}>⬆️</span> Bulk Upload
              </button>
            </>
          )}
        </div>

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
                  setSyllabus([])
                }}
              >
                <option value="">-- Select Class --</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <button style={styles.findBtn} onClick={handleFind}>
              <span style={{ marginRight: '6px' }}>🔍</span> Fetch Syllabus
            </button>
          </div>
        </div>

        {message && (
          <div style={{ ...styles.alertBox, backgroundColor: message.startsWith('✅') ? '#f0fdf4' : '#fef2f2', border: message.startsWith('✅') ? '1px solid #bbf7d0' : '1px solid #fecaca', color: message.startsWith('✅') ? '#15803d' : '#991b1b' }}>
            {message}
          </div>
        )}

        {/* Syllabus Table */}
        {!searched ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyStateIcon}>📖</div>
            <h3 style={{ color: '#374151', margin: '0 0 8px 0' }}>Ready to manage curriculum</h3>
            <p style={{ color: '#6b7280', margin: 0, fontSize: '14px' }}>Select a class from the dropdown above to view or upload documents.</p>
          </div>
        ) : loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>⏳ Loading subjects...</div>
        ) : subjects.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyStateIcon}>📚</div>
            <h3 style={{ color: '#374151', margin: '0 0 8px 0' }}>No subjects found</h3>
            <p style={{ color: '#6b7280', margin: 0, fontSize: '14px' }}>
              Add subjects to Class {selectedClassName} first before uploading syllabus.
            </p>
          </div>
        ) : (
          <div style={styles.fadeIn}>
            <div style={styles.tableTopHeader}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                📋 Class {selectedClassName} Syllabus
              </h3>
            </div>

            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>#</th>
                    <th style={{ ...styles.th, width: '50%' }}>Subject</th>
                    <th style={{ ...styles.th, textAlign: 'right', paddingRight: '24px' }}>Curriculum Document</th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.map((subject, i) => {
                    const syllabusRecord = getSyllabusForSubject(subject.id)
                    return (
                      <tr key={subject.id} style={styles.tr}>
                        <td style={{ ...styles.td, color: '#64748b', fontWeight: '500' }}>{i + 1}.</td>
                        <td style={{ ...styles.td, fontWeight: '600', color: '#334155' }}>
                          <div style={styles.nameCell}>
                            <div style={{ ...styles.miniAvatar, backgroundColor: ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'][i % 5] }}>
                              {subject.name.charAt(0).toUpperCase()}
                            </div>
                            {subject.name}
                          </div>
                        </td>
                        <td style={{ ...styles.td, textAlign: 'right', paddingRight: '20px' }}>
                          <div style={styles.syllabusActions}>
                            {/* Download */}
                            {syllabusRecord?.file_url ? (
                              <a
                                href={syllabusRecord.file_url}
                                target="_blank"
                                rel="noreferrer"
                                download
                                style={styles.downloadBtn}
                              >
                                ⬇️ Download PDF
                              </a>
                            ) : (
                              <button style={styles.downloadBtnDisabled} disabled>
                                📄 Not Uploaded
                              </button>
                            )}

                            {/* Upload */}
                            <label style={uploading[subject.id] ? styles.uploadBtnSmallLoading : styles.uploadBtnSmall}>
                              {uploading[subject.id] ? '⏳ Uploading...' : '⬆️ Update File'}
                              <input
                                type="file"
                                style={{ display: 'none' }}
                                accept=".pdf,.doc,.docx,.ppt,.pptx"
                                onChange={e => handleUpload(subject.id, e.target.files[0])}
                                disabled={uploading[subject.id]}
                              />
                            </label>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── STYLES ────────────────────────────────────────────────
const styles = {
  container: { maxWidth: '1000px', margin: '0 auto', padding: '20px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' },
  pageHeader: { marginBottom: '32px' },
  pageTitle: { fontSize: '32px', fontWeight: '800', color: '#111827', margin: '0 0 8px 0', letterSpacing: '-0.5px' },
  pageSubtitle: { fontSize: '15px', color: '#6b7280', margin: 0 },
  
  card: { backgroundColor: '#fff', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)', border: '1px solid #f3f4f6' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  sectionTitle: { fontSize: '18px', fontWeight: '700', color: '#1f2937', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' },
  
  fadeIn: { opacity: 1, transition: 'opacity 0.3s ease-in' },
  
  uploadBulkBtn: { padding: '10px 20px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)', transition: 'background-color 0.2s' },
  
  filterBox: { backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', marginBottom: '24px' },
  filterRow: { display: 'flex', gap: '20px', alignItems: 'flex-end', flexWrap: 'wrap' },
  filterGroup: { display: 'flex', flexDirection: 'column', gap: '8px', flex: '1', minWidth: '200px' },
  label: { fontSize: '13px', fontWeight: '600', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' },
  input: { padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', backgroundColor: '#fff', color: '#1e293b', transition: 'border-color 0.2s', width: '100%' },
  
  findBtn: { padding: '12px 24px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', height: '44px', display: 'flex', alignItems: 'center', transition: 'background-color 0.2s', boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)' },
  
  alertBox: { padding: '12px 16px', borderRadius: '8px', marginBottom: '24px', fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center' },
  
  tableTopHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', padding: '0 4px' },
  tableWrapper: { borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff' },
  th: { textAlign: 'left', fontSize: '12px', color: '#64748b', fontWeight: '700', padding: '16px 20px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textTransform: 'uppercase', letterSpacing: '0.5px' },
  tr: { borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.15s ease' },
  td: { padding: '16px 20px', fontSize: '14px', color: '#1e293b', verticalAlign: 'middle' },
  
  nameCell: { display: 'flex', alignItems: 'center', gap: '12px' },
  miniAvatar: { width: '32px', height: '32px', borderRadius: '8px', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
  
  syllabusActions: { display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'flex-end' },
  downloadBtn: { padding: '8px 16px', backgroundColor: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: '20px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', textDecoration: 'none', display: 'inline-block', transition: 'all 0.2s' },
  downloadBtnDisabled: { padding: '8px 16px', backgroundColor: '#f8fafc', color: '#94a3b8', border: '1px solid #e2e8f0', borderRadius: '20px', fontSize: '13px', fontWeight: '600', cursor: 'not-allowed', display: 'inline-block' },
  
  uploadBtnSmall: { padding: '8px 16px', backgroundColor: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '20px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', display: 'inline-block', transition: 'all 0.2s' },
  uploadBtnSmallLoading: { padding: '8px 16px', backgroundColor: '#cbd5e1', color: '#475569', border: '1px solid #94a3b8', borderRadius: '20px', cursor: 'wait', fontSize: '13px', fontWeight: '600', display: 'inline-block' },
  
  emptyState: { textAlign: 'center', padding: '60px 20px', border: '2px dashed #e2e8f0', borderRadius: '12px', backgroundColor: '#fafaf9', marginTop: '16px' },
  emptyStateIcon: { fontSize: '56px', marginBottom: '16px', opacity: 0.8 },
}