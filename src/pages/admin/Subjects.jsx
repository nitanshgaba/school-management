// import { useState, useEffect } from 'react'
// import { supabase } from '../../lib/supabase'

// export default function Subjects() {
//   const [classes, setClasses] = useState([])
//   const [subjects, setSubjects] = useState([])
//   const [selectedClass, setSelectedClass] = useState('')
//   const [selectedClassName, setSelectedClassName] = useState('')
//   const [searched, setSearched] = useState(false)
//   const [loading, setLoading] = useState(false)
//   const [showAddModal, setShowAddModal] = useState(false)
//   const [editSubject, setEditSubject] = useState(null)
//   const [newSubjectName, setNewSubjectName] = useState('')
//   const [teachers, setTeachers] = useState([])
//   const [selectedTeacher, setSelectedTeacher] = useState('')
//   const [saving, setSaving] = useState(false)
//   const [message, setMessage] = useState('')

//   useEffect(() => {
//     supabase.from('classes').select('*').order('id').then(({ data }) => setClasses(data || []))
//     supabase.from('profiles').select('id, name').eq('role', 'teacher').then(({ data }) => setTeachers(data || []))
//   }, [])

//   const handleFind = async () => {
//     if (!selectedClass) return
//     setLoading(true)
//     setSearched(true)
//     const { data } = await supabase
//       .from('subjects')
//       .select('*')
//       .eq('class_id', selectedClass)
//       .order('name')
//     setSubjects(data || [])
//     setLoading(false)
//   }

//   const handleAdd = async () => {
//     if (!newSubjectName.trim()) return
//     setSaving(true)
//     const { data, error } = await supabase
//       .from('subjects')
//       .insert({ name: newSubjectName.trim(), class_id: selectedClass, teacher_id: selectedTeacher || null })
//       .select()
//       .single()
//     console.log('INSERT ERROR:', error)
//     console.log('INSERT DATA:', data)
//     if (!error && data) {
//       setSubjects([...subjects, data])
//       setNewSubjectName('')
//       setSelectedTeacher('')
//       setShowAddModal(false)
//       setMessage('✅ Subject added!')
//       setTimeout(() => setMessage(''), 3000)
//     }
//     setSaving(false)
//   }

//   const handleEdit = async () => {
//     if (!editSubject?.name.trim()) return
//     setSaving(true)
//     const { error } = await supabase
//       .from('subjects')
//       .update({ name: editSubject.name })
//       .eq('id', editSubject.id)
//     if (!error) {
//       setSubjects(subjects.map(s => s.id === editSubject.id ? editSubject : s))
//       setEditSubject(null)
//       setMessage('✅ Subject updated!')
//       setTimeout(() => setMessage(''), 3000)
//     }
//     setSaving(false)
//   }

//   const handleDelete = async (id) => {
//     if (!confirm('Delete this subject?')) return
//     await supabase.from('subjects').delete().eq('id', id)
//     setSubjects(subjects.filter(s => s.id !== id))
//   }

//   return (
//     <div>
//       <div style={styles.pageHeader}>
//         <h1 style={styles.pageTitle}>Subjects</h1>
//       </div>

//       <div style={styles.card}>
//         {/* Add Modal */}
//         {showAddModal && (
//           <div style={styles.modalOverlay}>
//             <div style={styles.modal}>
//               <h3 style={styles.formTitle}>Add New Subject</h3>
//               <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>
//                 Class: <strong>{selectedClassName}</strong>
//               </p>
//               <div style={styles.formGroup}>
//                 <label style={styles.label}>Assign Teacher</label>
//                 <select style={styles.input} value={selectedTeacher} onChange={e => setSelectedTeacher(e.target.value)}>
//                   <option value=''>-- No Teacher --</option>
//                   {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
//                 </select>
//               </div>
//               <div style={styles.formGroup}>
//                 <label style={styles.label}>Subject Name</label>
//                 <input
//                   style={styles.input}
//                   placeholder="e.g. Mathematics"
//                   value={newSubjectName}
//                   onChange={e => setNewSubjectName(e.target.value)}
//                   onKeyDown={e => e.key === 'Enter' && handleAdd()}
//                   autoFocus
//                 />
//               </div>
//               <div style={styles.formButtons}>
//                 <button style={styles.cancelBtn} onClick={() => { setShowAddModal(false); setNewSubjectName('') }}>Cancel</button>
//                 <button style={styles.submitBtn} onClick={handleAdd} disabled={saving}>
//                   {saving ? 'Adding...' : 'Add Subject'}
//                 </button>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Edit Modal */}
//         {editSubject && (
//           <div style={styles.modalOverlay}>
//             <div style={styles.modal}>
//               <h3 style={styles.formTitle}>Edit Subject</h3>
//               <div style={styles.formGroup}>
//                 <label style={styles.label}>Assign Teacher</label>
//                 <select style={styles.input} value={selectedTeacher} onChange={e => setSelectedTeacher(e.target.value)}>
//                   <option value=''>-- No Teacher --</option>
//                   {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
//                 </select>
//               </div>
//               <div style={styles.formGroup}>
//                 <label style={styles.label}>Subject Name</label>
//                 <input
//                   style={styles.input}
//                   value={editSubject.name}
//                   onChange={e => setEditSubject({ ...editSubject, name: e.target.value })}
//                   autoFocus
//                 />
//               </div>
//               <div style={styles.formButtons}>
//                 <button style={styles.cancelBtn} onClick={() => setEditSubject(null)}>Cancel</button>
//                 <button style={styles.submitBtn} onClick={handleEdit} disabled={saving}>
//                   {saving ? 'Saving...' : 'Save Changes'}
//                 </button>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Header */}
//         <div style={styles.cardHeader}>
//           <h2 style={styles.sectionTitle}>📚 Subjects</h2>
//           {searched && selectedClass && (
//             <button style={styles.addBtn} onClick={() => setShowAddModal(true)}>
//               ＋ Add
//             </button>
//           )}
//         </div>

//         {message && <p style={{ color: '#22c55e', fontSize: '14px', marginBottom: '12px' }}>{message}</p>}

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
//                 }}
//               >
//                 <option value="">-- Select Class --</option>
//                 {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
//               </select>
//             </div>
//             <button style={styles.findBtn} onClick={handleFind}>🔍 Find</button>
//           </div>
//         </div>

//         {/* Subjects Table */}
//         {searched && (
//           <>
//             <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1a1a2e', marginBottom: '12px' }}>
//               📋 {selectedClassName} Subjects
//             </h3>
//             <table style={styles.table}>
//               <thead>
//                 <tr>
//                   <th style={styles.th}>#</th>
//                   <th style={styles.th}>Subject</th>
//                   <th style={styles.th}>Action</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {loading ? (
//                   <tr><td colSpan={3} style={styles.emptyCell}>Loading...</td></tr>
//                 ) : subjects.length === 0 ? (
//                   <tr>
//                     <td colSpan={3} style={styles.emptyCell}>
//                       <div style={{ textAlign: 'center', padding: '32px' }}>
//                         <div style={{ fontSize: '48px', marginBottom: '8px' }}>📚</div>
//                         <div>No subjects found. Click "+ Add" to add one.</div>
//                       </div>
//                     </td>
//                   </tr>
//                 ) : (
//                   subjects.map((s, i) => (
//                     <tr key={s.id}>
//                       <td style={styles.td}>{i + 1}.</td>
//                       <td style={styles.td}>{s.name}</td>
//                       <td style={styles.td}>
//                         <div style={styles.actionBtns}>
//                           <button style={styles.editBtn} onClick={() => setEditSubject(s)}>✏️ Edit</button>
//                           <button style={styles.deleteBtn} onClick={() => handleDelete(s.id)}>🗑 Delete</button>
//                         </div>
//                       </td>
//                     </tr>
//                   ))
//                 )}
//               </tbody>
//             </table>
//           </>
//         )}

//         {!searched && (
//           <div style={styles.emptyState}>
//             <div style={{ fontSize: '64px' }}>📚</div>
//             <p style={{ color: '#9ca3af', marginTop: '12px' }}>Select a class and click Find to view subjects</p>
//           </div>
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
//   addBtn: { padding: '8px 16px', backgroundColor: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
//   filterBox: { backgroundColor: '#f9fafb', borderRadius: '10px', padding: '16px', marginBottom: '24px' },
//   filterRow: { display: 'flex', gap: '16px', alignItems: 'flex-end' },
//   filterGroup: { display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '200px' },
//   findBtn: { padding: '10px 20px', backgroundColor: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', height: '40px' },
//   label: { fontSize: '13px', fontWeight: '600', color: '#374151' },
//   input: { padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', outline: 'none' },
//   table: { width: '100%', borderCollapse: 'collapse' },
//   th: { textAlign: 'left', fontSize: '13px', color: '#6b7280', fontWeight: '600', padding: '10px 12px', borderBottom: '2px solid #f3f4f6' },
//   td: { padding: '12px', fontSize: '14px', color: '#374151', borderBottom: '1px solid #f9fafb' },
//   emptyCell: { padding: '24px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' },
//   actionBtns: { display: 'flex', gap: '8px' },
//   editBtn: { padding: '6px 12px', backgroundColor: '#22c55e', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' },
//   deleteBtn: { padding: '6px 12px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' },
//   modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
//   modal: { backgroundColor: '#fff', borderRadius: '12px', padding: '28px', width: '400px', display: 'flex', flexDirection: 'column', gap: '16px' },
//   formTitle: { fontSize: '18px', fontWeight: '700', color: '#1a1a2e' },
//   formGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
//   formButtons: { display: 'flex', gap: '12px', marginTop: '4px' },
//   cancelBtn: { padding: '10px 20px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: '14px' },
//   submitBtn: { padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#4f46e5', color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
//   emptyState: { textAlign: 'center', padding: '60px 0' },
// }



// import { useState, useEffect } from 'react'
// import { supabase } from '../../lib/supabase'

// export default function Subjects() {
//   const [classes, setClasses] = useState([])
//   const [subjects, setSubjects] = useState([])
//   const [selectedClass, setSelectedClass] = useState('')
//   const [selectedClassName, setSelectedClassName] = useState('')
//   const [searched, setSearched] = useState(false)
//   const [loading, setLoading] = useState(false)
//   const [showAddModal, setShowAddModal] = useState(false)
//   const [editSubject, setEditSubject] = useState(null)
//   const [newSubjectName, setNewSubjectName] = useState('')
//   const [teachers, setTeachers] = useState([])
//   const [selectedTeacher, setSelectedTeacher] = useState('')
//   const [saving, setSaving] = useState(false)
//   const [message, setMessage] = useState('')

//   useEffect(() => {
//     supabase.from('classes').select('*').order('id').then(({ data }) => setClasses(data || []))
//     supabase.from('profiles').select('id, name').eq('role', 'teacher').then(({ data }) => setTeachers(data || []))
//   }, [])

//   const handleFind = async () => {
//     if (!selectedClass) return
//     setLoading(true)
//     setSearched(true)
//     const { data } = await supabase
//       .from('subjects')
//       .select('*')
//       .eq('class_id', selectedClass)
//       .order('name')
//     setSubjects(data || [])
//     setLoading(false)
//   }

//   const handleAdd = async () => {
//     if (!newSubjectName.trim()) return
//     setSaving(true)
//     const { data, error } = await supabase
//       .from('subjects')
//       .insert({ name: newSubjectName.trim(), class_id: selectedClass, teacher_id: selectedTeacher || null })
//       .select()
//       .single()
    
//     if (!error && data) {
//       setSubjects([...subjects, data])
//       setNewSubjectName('')
//       setSelectedTeacher('')
//       setShowAddModal(false)
//       setMessage('✅ Subject added successfully!')
//       setTimeout(() => setMessage(''), 3000)
//     }
//     setSaving(false)
//   }

//   const handleEdit = async () => {
//     if (!editSubject?.name.trim()) return
//     setSaving(true)
    
//     // Determine the new teacher ID (null if empty string)
//     const updatedTeacherId = selectedTeacher ? selectedTeacher : null;

//     const { error } = await supabase
//       .from('subjects')
//       // FIX: Now we are updating both the name AND the teacher_id
//       .update({ 
//         name: editSubject.name,
//         teacher_id: updatedTeacherId 
//       })
//       .eq('id', editSubject.id)

//     if (!error) {
//       // FIX: Update the local state array with the newly assigned teacher_id so it shows up immediately
//       setSubjects(subjects.map(s => s.id === editSubject.id ? { ...editSubject, teacher_id: updatedTeacherId } : s))
//       setEditSubject(null)
//       setSelectedTeacher('') // Reset the dropdown
//       setMessage('✅ Subject updated successfully!')
//       setTimeout(() => setMessage(''), 3000)
//     }
//     setSaving(false)
//   }

//   const handleDelete = async (id) => {
//     if (!window.confirm('Are you sure you want to delete this subject?')) return
//     await supabase.from('subjects').delete().eq('id', id)
//     setSubjects(subjects.filter(s => s.id !== id))
//   }

//   return (
//     <div style={styles.container}>
//       <div style={styles.pageHeader}>
//         <div>
//           <h1 style={styles.pageTitle}>Curriculum Management</h1>
//           <p style={styles.pageSubtitle}>Manage and assign subjects to your classes</p>
//         </div>
//       </div>

//       <div style={styles.card}>
//         {/* Add Modal */}
//         {showAddModal && (
//           <div style={styles.modalOverlay}>
//             <div style={styles.modal}>
//               <div style={styles.modalHeader}>
//                 <h3 style={styles.formTitle}>Add New Subject</h3>
//                 <span style={styles.modalBadge}>{selectedClassName}</span>
//               </div>
              
//               <div style={styles.formGroup}>
//                 <label style={styles.label}>Assign Teacher</label>
//                 <select style={styles.input} value={selectedTeacher} onChange={e => setSelectedTeacher(e.target.value)}>
//                   <option value=''>-- No Teacher --</option>
//                   {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
//                 </select>
//               </div>
//               <div style={styles.formGroup}>
//                 <label style={styles.label}>Subject Name</label>
//                 <input
//                   style={styles.input}
//                   placeholder="e.g. Advanced Mathematics"
//                   value={newSubjectName}
//                   onChange={e => setNewSubjectName(e.target.value)}
//                   onKeyDown={e => e.key === 'Enter' && handleAdd()}
//                   autoFocus
//                 />
//               </div>
//               <div style={styles.formButtons}>
//                 <button style={styles.cancelBtn} onClick={() => { setShowAddModal(false); setNewSubjectName(''); setSelectedTeacher(''); }}>Cancel</button>
//                 <button style={styles.submitBtn} onClick={handleAdd} disabled={saving}>
//                   {saving ? '⏳ Adding...' : '＋ Add Subject'}
//                 </button>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Edit Modal */}
//         {editSubject && (
//           <div style={styles.modalOverlay}>
//             <div style={styles.modal}>
//               <h3 style={styles.formTitle}>Edit Subject</h3>
//               <div style={styles.formGroup}>
//                 <label style={styles.label}>Assign Teacher</label>
//                 <select style={styles.input} value={selectedTeacher} onChange={e => setSelectedTeacher(e.target.value)}>
//                   <option value=''>-- No Teacher --</option>
//                   {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
//                 </select>
//               </div>
//               <div style={styles.formGroup}>
//                 <label style={styles.label}>Subject Name</label>
//                 <input
//                   style={styles.input}
//                   value={editSubject.name}
//                   onChange={e => setEditSubject({ ...editSubject, name: e.target.value })}
//                   onKeyDown={e => e.key === 'Enter' && handleEdit()}
//                   autoFocus
//                 />
//               </div>
//               <div style={styles.formButtons}>
//                 <button style={styles.cancelBtn} onClick={() => { setEditSubject(null); setSelectedTeacher(''); }}>Cancel</button>
//                 <button style={styles.submitBtn} onClick={handleEdit} disabled={saving}>
//                   {saving ? '⏳ Saving...' : '💾 Save Changes'}
//                 </button>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Header */}
//         <div style={styles.cardHeader}>
//           <h2 style={styles.sectionTitle}>🎯 Select Class</h2>
//         </div>

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
//                 }}
//               >
//                 <option value="">-- Select Class --</option>
//                 {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
//               </select>
//             </div>
//             <button style={styles.findBtn} onClick={handleFind}>
//               <span style={{ marginRight: '6px' }}>🔍</span> Find Subjects
//             </button>
//           </div>
//         </div>

//         {message && (
//           <div style={{ ...styles.alertBox, backgroundColor: message.startsWith('✅') ? '#f0fdf4' : '#fef2f2', border: message.startsWith('✅') ? '1px solid #bbf7d0' : '1px solid #fecaca', color: message.startsWith('✅') ? '#15803d' : '#991b1b' }}>
//             {message}
//           </div>
//         )}

//         {/* Subjects Table */}
//         {searched && (
//           <div style={styles.fadeIn}>
//             <div style={styles.tableTopHeader}>
//               <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
//                 📋 {selectedClassName} Subjects
//               </h3>
//               {selectedClass && (
//                 <button style={styles.addBtn} onClick={() => { setShowAddModal(true); setSelectedTeacher(''); }}>
//                   ＋ Add New Subject
//                 </button>
//               )}
//             </div>

//             <div style={styles.tableWrapper}>
//               <table style={styles.table}>
//                 <thead>
//                   <tr>
//                     <th style={styles.th}>#</th>
//                     <th style={{ ...styles.th, width: '40%' }}>Subject Name</th>
//                     {/* Added a Teacher Column for better visibility */}
//                     <th style={{ ...styles.th, width: '30%' }}>Assigned Teacher</th>
//                     <th style={{ ...styles.th, textAlign: 'right', paddingRight: '24px' }}>Actions</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {loading ? (
//                     <tr><td colSpan={4} style={styles.emptyCell}>⏳ Loading subjects...</td></tr>
//                   ) : subjects.length === 0 ? (
//                     <tr>
//                       <td colSpan={4} style={styles.emptyCell}>
//                         <div style={{ textAlign: 'center', padding: '24px' }}>
//                           <p style={{ color: '#64748b', margin: 0 }}>No subjects assigned to this class yet.</p>
//                         </div>
//                       </td>
//                     </tr>
//                   ) : (
//                     subjects.map((s, i) => (
//                       <tr key={s.id} style={styles.tr}>
//                         <td style={{ ...styles.td, color: '#64748b', fontWeight: '500' }}>{i + 1}.</td>
//                         <td style={{ ...styles.td, fontWeight: '600', color: '#334155' }}>
//                           <div style={styles.nameCell}>
//                             <div style={styles.miniAvatar}>
//                               {s.name.charAt(0).toUpperCase()}
//                             </div>
//                             {s.name}
//                           </div>
//                         </td>
//                         {/* Render the matching teacher's name or show Unassigned */}
//                         <td style={{ ...styles.td, color: '#475569' }}>
//                           {teachers.find(t => t.id === s.teacher_id)?.name || (
//                             <span style={{ color: '#9ca3af', fontStyle: 'italic', fontSize: '13px' }}>Unassigned</span>
//                           )}
//                         </td>
//                         <td style={{ ...styles.td, textAlign: 'right', paddingRight: '20px' }}>
//                           <div style={styles.actionBtns}>
//                             <button style={styles.editBtn} onClick={() => {
//                               setEditSubject(s);
//                               // FIX: Populate the dropdown with the existing teacher when clicking edit!
//                               setSelectedTeacher(s.teacher_id || '');
//                             }}>✏️ Edit</button>
//                             <button style={styles.deleteBtn} onClick={() => handleDelete(s.id)}>🗑️ Delete</button>
//                           </div>
//                         </td>
//                       </tr>
//                     ))
//                   )}
//                 </tbody>
//               </table>
//             </div>
//           </div>
//         )}

//         {!searched && (
//           <div style={styles.emptyState}>
//             <div style={styles.emptyStateIcon}>📚</div>
//             <h3 style={{ color: '#374151', margin: '0 0 8px 0' }}>Ready to manage subjects</h3>
//             <p style={{ color: '#6b7280', margin: 0, fontSize: '14px' }}>Select a class from the dropdown above to view or add subjects.</p>
//           </div>
//         )}
//       </div>
//     </div>
//   )
// }

// // ─── STYLES ────────────────────────────────────────────────
// const styles = {
//   container: { maxWidth: '1000px', margin: '0 auto', padding: '20px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' },
//   pageHeader: { marginBottom: '32px' },
//   pageTitle: { fontSize: '32px', fontWeight: '800', color: '#111827', margin: '0 0 8px 0', letterSpacing: '-0.5px' },
//   pageSubtitle: { fontSize: '15px', color: '#6b7280', margin: 0 },
  
//   card: { backgroundColor: '#fff', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)', border: '1px solid #f3f4f6' },
//   cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
//   sectionTitle: { fontSize: '18px', fontWeight: '700', color: '#1f2937', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' },
  
//   fadeIn: { opacity: 1, transition: 'opacity 0.3s ease-in' },
  
//   filterBox: { backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', marginBottom: '24px' },
//   filterRow: { display: 'flex', gap: '20px', alignItems: 'flex-end', flexWrap: 'wrap' },
//   filterGroup: { display: 'flex', flexDirection: 'column', gap: '8px', flex: '1', minWidth: '200px' },
//   label: { fontSize: '13px', fontWeight: '600', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' },
//   input: { padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', backgroundColor: '#fff', color: '#1e293b', transition: 'border-color 0.2s', width: '100%' },
  
//   findBtn: { padding: '12px 24px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', height: '44px', display: 'flex', alignItems: 'center', transition: 'background-color 0.2s', boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)' },
//   addBtn: { padding: '10px 20px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)' },
  
//   alertBox: { padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center' },
  
//   tableTopHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', padding: '0 4px' },
//   tableWrapper: { borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' },
//   table: { width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff' },
//   th: { textAlign: 'left', fontSize: '12px', color: '#64748b', fontWeight: '700', padding: '16px 20px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textTransform: 'uppercase', letterSpacing: '0.5px' },
//   tr: { borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.15s ease' },
//   td: { padding: '16px 20px', fontSize: '14px', color: '#1e293b', verticalAlign: 'middle' },
//   emptyCell: { padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '15px' },
  
//   nameCell: { display: 'flex', alignItems: 'center', gap: '12px' },
//   miniAvatar: { width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#e2e8f0', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700' },
  
//   actionBtns: { display: 'flex', gap: '8px', justifyContent: 'flex-end' },
//   editBtn: { padding: '6px 12px', backgroundColor: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', transition: 'all 0.2s' },
//   deleteBtn: { padding: '6px 12px', backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', transition: 'all 0.2s' },
  
//   modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, backdropFilter: 'blur(4px)' },
//   modal: { backgroundColor: '#fff', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '440px', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' },
//   modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
//   formTitle: { fontSize: '20px', fontWeight: '700', color: '#0f172a', margin: 0 },
//   modalBadge: { backgroundColor: '#f1f5f9', color: '#475569', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' },
//   formGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
//   formButtons: { display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' },
//   cancelBtn: { padding: '10px 20px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: '#475569' },
//   submitBtn: { padding: '10px 24px', borderRadius: '8px', border: 'none', backgroundColor: '#2563eb', color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: '600', boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)' },
  
//   emptyState: { textAlign: 'center', padding: '60px 20px', border: '2px dashed #e2e8f0', borderRadius: '12px', backgroundColor: '#fafaf9', marginTop: '16px' },
//   emptyStateIcon: { fontSize: '56px', marginBottom: '16px', opacity: 0.8 },
// }











// import { useState, useEffect } from 'react'
// import { supabase } from '../../lib/supabase'

// export default function Subjects() {
//   const [classes, setClasses] = useState([])
//   const [subjects, setSubjects] = useState([])
//   const [selectedClass, setSelectedClass] = useState('')
//   const [selectedClassName, setSelectedClassName] = useState('')
//   const [searched, setSearched] = useState(false)
//   const [loading, setLoading] = useState(false)
//   const [showAddModal, setShowAddModal] = useState(false)
//   const [editSubject, setEditSubject] = useState(null)
//   const [newSubjectName, setNewSubjectName] = useState('')
//   const [teachers, setTeachers] = useState([])
//   const [selectedTeacher, setSelectedTeacher] = useState('')
//   const [saving, setSaving] = useState(false)
//   const [message, setMessage] = useState('')

//   useEffect(() => {
//     // Fetch classes and teachers on load
//     supabase.from('classes').select('*').order('name').then(({ data }) => setClasses(data || []))
//     supabase.from('profiles').select('id, name').eq('role', 'teacher').then(({ data }) => setTeachers(data || []))
//   }, [])

//   const handleFind = async () => {
//     if (!selectedClass) return
//     setLoading(true)
//     setSearched(true)
    
//     // We fetch subjects and the linked teacher profile name in one go
//     const { data, error } = await supabase
//       .from('subjects')
//       .select(`
//         *,
//         profiles:teacher_id (name)
//       `)
//       .eq('class_id', selectedClass)
//       .order('name')
    
//     if (error) {
//       console.error(error)
//     } else {
//       setSubjects(data || [])
//     }
//     setLoading(false)
//   }

//   const handleAdd = async () => {
//     if (!newSubjectName.trim()) return
//     setSaving(true)
    
//     const { data, error } = await supabase
//       .from('subjects')
//       .insert({ 
//         name: newSubjectName.trim(), 
//         class_id: selectedClass, 
//         teacher_id: selectedTeacher || null 
//       })
//       .select(`*, profiles:teacher_id (name)`)
//       .single()
    
//     if (!error && data) {
//       setSubjects([...subjects, data])
//       setNewSubjectName('')
//       setSelectedTeacher('')
//       setShowAddModal(false)
//       setMessage('✅ Subject added successfully!')
//       setTimeout(() => setMessage(''), 3000)
//     }
//     setSaving(false)
//   }

//   const handleEdit = async () => {
//     if (!editSubject?.name.trim()) return
//     setSaving(true)
    
//     const updatedTeacherId = selectedTeacher || null;

//     const { error } = await supabase
//       .from('subjects')
//       .update({ 
//         name: editSubject.name,
//         teacher_id: updatedTeacherId 
//       })
//       .eq('id', editSubject.id)

//     if (!error) {
//       // Find the teacher name locally to update UI instantly without re-fetching
//       const teacherObj = teachers.find(t => t.id === updatedTeacherId);
      
//       setSubjects(subjects.map(s => s.id === editSubject.id ? { 
//         ...editSubject, 
//         teacher_id: updatedTeacherId,
//         profiles: teacherObj ? { name: teacherObj.name } : null 
//       } : s))
      
//       setEditSubject(null)
//       setSelectedTeacher('')
//       setMessage('✅ Subject updated successfully!')
//       setTimeout(() => setMessage(''), 3000)
//     }
//     setSaving(false)
//   }

//   const handleDelete = async (id) => {
//     if (!window.confirm('Are you sure you want to delete this subject?')) return
//     const { error } = await supabase.from('subjects').delete().eq('id', id)
//     if (!error) {
//       setSubjects(subjects.filter(s => s.id !== id))
//     }
//   }

//   return (
//     <div style={styles.container}>
//       <div style={styles.pageHeader}>
//         <div>
//           <h1 style={styles.pageTitle}>Curriculum Management</h1>
//           <p style={styles.pageSubtitle}>Manage and assign subjects to your classes</p>
//         </div>
//       </div>

//       <div style={styles.card}>
//         {/* ADD MODAL */}
//         {showAddModal && (
//           <div style={styles.modalOverlay}>
//             <div style={styles.modal}>
//               <div style={styles.modalHeader}>
//                 <h3 style={styles.formTitle}>Add New Subject</h3>
//                 <span style={styles.modalBadge}>{selectedClassName}</span>
//               </div>
              
//               <div style={styles.formGroup}>
//                 <label style={styles.label}>Subject Name</label>
//                 <input
//                   style={styles.input}
//                   placeholder="e.g. Mathematics"
//                   value={newSubjectName}
//                   onChange={e => setNewSubjectName(e.target.value)}
//                 />
//               </div>

//               <div style={styles.formGroup}>
//                 <label style={styles.label}>Assign Teacher</label>
//                 <select style={styles.input} value={selectedTeacher} onChange={e => setSelectedTeacher(e.target.value)}>
//                   <option value=''>-- Select Teacher --</option>
//                   {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
//                 </select>
//               </div>

//               <div style={styles.formButtons}>
//                 <button style={styles.cancelBtn} onClick={() => setShowAddModal(false)}>Cancel</button>
//                 <button style={styles.submitBtn} onClick={handleAdd} disabled={saving}>
//                     {saving ? '⏳ Adding...' : '＋ Add Subject'}
//                 </button>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* EDIT MODAL */}
//         {editSubject && (
//           <div style={styles.modalOverlay}>
//             <div style={styles.modal}>
//               <h3 style={styles.formTitle}>Edit Subject</h3>
//               <div style={styles.formGroup}>
//                 <label style={styles.label}>Subject Name</label>
//                 <input
//                   style={styles.input}
//                   value={editSubject.name}
//                   onChange={e => setEditSubject({ ...editSubject, name: e.target.value })}
//                 />
//               </div>
//               <div style={styles.formGroup}>
//                 <label style={styles.label}>Assign Teacher</label>
//                 <select style={styles.input} value={selectedTeacher} onChange={e => setSelectedTeacher(e.target.value)}>
//                   <option value=''>-- Unassigned --</option>
//                   {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
//                 </select>
//               </div>
//               <div style={styles.formButtons}>
//                 <button style={styles.cancelBtn} onClick={() => setEditSubject(null)}>Cancel</button>
//                 <button style={styles.submitBtn} onClick={handleEdit} disabled={saving}>
//                     {saving ? '⏳ Saving...' : '💾 Save Changes'}
//                 </button>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* CLASS SELECTION */}
//         <div style={styles.cardHeader}>
//           <h2 style={styles.sectionTitle}>🎯 Select Class</h2>
//         </div>

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
//                 }}
//               >
//                 <option value="">-- Select Class --</option>
//                 {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
//               </select>
//             </div>
//             <button style={styles.findBtn} onClick={handleFind}>🔍 Find Subjects</button>
//           </div>
//         </div>

//         {message && (
//           <div style={{ ...styles.alertBox, backgroundColor: message.startsWith('✅') ? '#f0fdf4' : '#fef2f2', border: message.startsWith('✅') ? '1px solid #bbf7d0' : '1px solid #fecaca', color: message.startsWith('✅') ? '#15803d' : '#991b1b' }}>
//             {message}
//           </div>
//         )}

//         {/* SUBJECTS TABLE */}
//         {searched && (
//           <div style={styles.fadeIn}>
//             <div style={styles.tableTopHeader}>
//               <h3 style={styles.sectionTitle}>📋 {selectedClassName} Subjects</h3>
//               <button style={styles.addBtn} onClick={() => { setShowAddModal(true); setSelectedTeacher(''); }}>
//                 ＋ Add New Subject
//               </button>
//             </div>

//             <div style={styles.tableWrapper}>
//               <table style={styles.table}>
//                 <thead>
//                   <tr>
//                     <th style={styles.th}>#</th>
//                     <th style={{ ...styles.th, width: '40%' }}>Subject Name</th>
//                     <th style={{ ...styles.th, width: '30%' }}>Assigned Teacher</th>
//                     <th style={{ ...styles.th, textAlign: 'right', paddingRight: '24px' }}>Actions</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {loading ? (
//                     <tr><td colSpan={4} style={styles.emptyCell}>⏳ Loading...</td></tr>
//                   ) : subjects.length === 0 ? (
//                     <tr><td colSpan={4} style={styles.emptyCell}>No subjects assigned to this class yet.</td></tr>
//                   ) : (
//                     subjects.map((s, i) => (
//                       <tr key={s.id} style={styles.tr}>
//                         <td style={{ ...styles.td, color: '#64748b' }}>{i + 1}.</td>
//                         <td style={{ ...styles.td, fontWeight: '600' }}>
//                           <div style={styles.nameCell}>
//                             <div style={styles.miniAvatar}>{s.name.charAt(0).toUpperCase()}</div>
//                             {s.name}
//                           </div>
//                         </td>
//                         <td style={styles.td}>
//                           {s.profiles?.name ? (
//                             <span style={{ color: '#2563eb', fontWeight: '500' }}>👤 {s.profiles.name}</span>
//                           ) : (
//                             <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Unassigned</span>
//                           )}
//                         </td>
//                         <td style={{ ...styles.td, textAlign: 'right', paddingRight: '20px' }}>
//                           <div style={styles.actionBtns}>
//                             <button style={styles.editBtn} onClick={() => {
//                               setEditSubject(s);
//                               setSelectedTeacher(s.teacher_id || '');
//                             }}>✏️ Edit</button>
//                             <button style={styles.deleteBtn} onClick={() => handleDelete(s.id)}>🗑️ Delete</button>
//                           </div>
//                         </td>
//                       </tr>
//                     ))
//                   )}
//                 </tbody>
//               </table>
//             </div>
//           </div>
//         )}

//         {!searched && (
//           <div style={styles.emptyState}>
//             <div style={styles.emptyStateIcon}>📚</div>
//             <h3 style={{ color: '#374151', margin: '0 0 8px 0' }}>Ready to manage subjects</h3>
//             <p style={{ color: '#6b7280', margin: 0, fontSize: '14px' }}>Select a class to view or add subjects.</p>
//           </div>
//         )}
//       </div>
//     </div>
//   )
// }




// import { useState, useEffect } from 'react'
// import { supabase } from '../../lib/supabase'

// const MASTER_SUBJECT_LIST = [
//   'Physics', 'Chemistry', 'Biology', 'Computer Science', 
//   'History', 'Geography', 'Economics', 'Civics',
//   'Physical Education', 'Art', 'Music', 'Information Technology',
//   'Accountancy', 'Business Studies', 'Environmental Science',
//   'Punjabi', 'Hindi', 'English', 'Maths'
// ];

// export default function Subjects() {
//   const [classes, setClasses] = useState([])
//   const [subjects, setSubjects] = useState([])
//   const [selectedClass, setSelectedClass] = useState('')
//   const [selectedClassName, setSelectedClassName] = useState('')
//   const [searched, setSearched] = useState(false)
//   const [loading, setLoading] = useState(false)
//   const [showAddModal, setShowAddModal] = useState(false)
//   const [editSubject, setEditSubject] = useState(null)
  
//   const [selectedSubjectName, setSelectedSubjectName] = useState('')
//   const [selectedTeacher, setSelectedTeacher] = useState('')
  
//   const [allTeachers, setAllTeachers] = useState([]) // Stores everyone
//   const [filteredTeachers, setFilteredTeachers] = useState([]) // Stores only matching teachers
//   const [saving, setSaving] = useState(false)
//   const [message, setMessage] = useState('')

//   useEffect(() => {
//     supabase.from('classes').select('*').order('name').then(({ data }) => setClasses(data || []))
    
//     // Fetch teachers AND the subjects they are assigned to teach
//     // Assuming 'teacher_classes' or 'subjects' table links them
//     fetchTeachers();
//   }, [])

//   const fetchTeachers = async () => {
//     // We get teachers and their assigned subjects from the profiles/subjects table
//     const { data } = await supabase
//       .from('profiles')
//       .select(`
//         id, 
//         name,
//         subjects (name)
//       `)
//       .eq('role', 'teacher')
//     setAllTeachers(data || [])
//   }

//   // Effect to filter teachers whenever the Subject Name changes in the Modal
//   useEffect(() => {
//     if (!selectedSubjectName) {
//       setFilteredTeachers([]);
//     } else {
//       // Filter teachers who have this subject name in their 'subjects' list
//       const matching = allTeachers.filter(t => 
//         t.subjects?.some(s => s.name.toLowerCase() === selectedSubjectName.toLowerCase())
//       );
//       setFilteredTeachers(matching);
//     }
//   }, [selectedSubjectName, allTeachers]);

//   const handleFind = async () => {
//     if (!selectedClass) return
//     setLoading(true)
//     setSearched(true)
//     const { data } = await supabase
//       .from('subjects')
//       .select(`*, profiles:teacher_id (name)`)
//       .eq('class_id', selectedClass)
//       .order('name')
//     setSubjects(data || [])
//     setLoading(false)
//   }

//   const handleAdd = async () => {
//     if (!selectedSubjectName || !selectedClass) return
//     setSaving(true)
//     const { data, error } = await supabase
//       .from('subjects')
//       .insert({ 
//         name: selectedSubjectName, 
//         class_id: selectedClass, 
//         teacher_id: selectedTeacher || null 
//       })
//       .select(`*, profiles:teacher_id (name)`)
//       .single()
    
//     if (!error) {
//       setSubjects([...subjects, data])
//       setShowAddModal(false); resetForm();
//       setMessage('✅ Subject Assigned!');
//       setTimeout(() => setMessage(''), 3000)
//     }
//     setSaving(false)
//   }

//   const resetForm = () => {
//     setSelectedSubjectName('');
//     setSelectedTeacher('');
//   }

//   const handleDelete = async (id) => {
//     if (!window.confirm('Remove this subject?')) return
//     await supabase.from('subjects').delete().eq('id', id)
//     setSubjects(subjects.filter(s => s.id !== id))
//   }

//   return (
//     <div style={styles.container}>
//       <div style={styles.pageHeader}>
//         <h1 style={styles.pageTitle}>Curriculum Management</h1>
//         <p style={styles.pageSubtitle}>Assign subjects based on teacher expertise</p>
//       </div>

//       <div style={styles.card}>
//         {/* ADD MODAL */}
//         {showAddModal && (
//           <div style={styles.modalOverlay}>
//             <div style={styles.modal}>
//               <h3 style={styles.formTitle}>Assign Subject</h3>
              
//               <div style={styles.formGroup}>
//                 <label style={styles.label}>1. Select Subject</label>
//                 <select style={styles.input} value={selectedSubjectName} onChange={e => setSelectedSubjectName(e.target.value)}>
//                   <option value="">-- Choose Subject --</option>
//                   {MASTER_SUBJECT_LIST.sort().map(sub => <option key={sub} value={sub}>{sub}</option>)}
//                 </select>
//               </div>

//               <div style={styles.formGroup}>
//                 <label style={styles.label}>2. Assign Qualified Teacher</label>
//                 <select 
//                   style={styles.input} 
//                   value={selectedTeacher} 
//                   onChange={e => setSelectedTeacher(e.target.value)}
//                   disabled={!selectedSubjectName}
//                 >
//                   <option value=''>-- Select Teacher --</option>
//                   {filteredTeachers.map(t => (
//                     <option key={t.id} value={t.id}>{t.name}</option>
//                   ))}
//                 </select>
//                 {selectedSubjectName && filteredTeachers.length === 0 && (
//                   <p style={{color: '#ef4444', fontSize: '11px', marginTop: '4px'}}>
//                     ⚠️ No teachers are currently assigned to teach {selectedSubjectName}.
//                   </p>
//                 )}
//               </div>

//               <div style={styles.formButtons}>
//                 <button style={styles.cancelBtn} onClick={() => {setShowAddModal(false); resetForm();}}>Cancel</button>
//                 <button style={styles.submitBtn} onClick={handleAdd} disabled={!selectedTeacher || saving}>
//                   {saving ? 'Saving...' : 'Assign Subject'}
//                 </button>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* SELECTION UI */}
//         <div style={styles.filterBox}>
//           <div style={styles.filterRow}>
//             <div style={styles.filterGroup}>
//               <label style={styles.label}>Class</label>
//               <select style={styles.input} value={selectedClass} onChange={e => {
//                 setSelectedClass(e.target.value);
//                 setSelectedClassName(classes.find(c => c.id == e.target.value)?.name || '');
//                 setSearched(false);
//               }}>
//                 <option value="">-- Select Class --</option>
//                 {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
//               </select>
//             </div>
//             <button style={styles.findBtn} onClick={handleFind}>Find Subjects</button>
//           </div>
//         </div>

//         {searched && (
//           <div style={styles.fadeIn}>
//             <div style={styles.tableTopHeader}>
//               <h3 style={styles.sectionTitle}>Subjects for {selectedClassName}</h3>
//               <button style={styles.addBtn} onClick={() => setShowAddModal(true)}>＋ Assign Subject</button>
//             </div>

//             <div style={styles.tableWrapper}>
//               <table style={styles.table}>
//                 <thead>
//                   <tr>
//                     <th style={styles.th}>#</th>
//                     <th style={styles.th}>Subject Name</th>
//                     <th style={styles.th}>Assigned Teacher</th>
//                     <th style={{ ...styles.th, textAlign: 'right' }}>Actions</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {subjects.map((s, i) => (
//                     <tr key={s.id} style={styles.tr}>
//                       <td style={styles.td}>{i + 1}.</td>
//                       <td style={{ ...styles.td, fontWeight: '600' }}>{s.name}</td>
//                       <td style={styles.td}>
//                         {s.profiles?.name ? (
//                           <span style={{ color: '#2563eb', fontWeight: '500' }}>👤 {s.profiles.name}</span>
//                         ) : (
//                           <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Unassigned</span>
//                         )}
//                       </td>
//                       <td style={{ ...styles.td, textAlign: 'right' }}>
//                         <button style={styles.deleteBtn} onClick={() => handleDelete(s.id)}>🗑️ Remove</button>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   )
// }
// // ... Styles remain the same

// const styles = {
//   container: { maxWidth: '1000px', margin: '0 auto', padding: '20px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' },
//   pageHeader: { marginBottom: '32px' },
//   pageTitle: { fontSize: '32px', fontWeight: '800', color: '#111827', margin: '0 0 8px 0', letterSpacing: '-0.5px' },
//   pageSubtitle: { fontSize: '15px', color: '#6b7280', margin: 0 },
//   card: { backgroundColor: '#fff', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #f3f4f6' },
//   cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
//   sectionTitle: { fontSize: '18px', fontWeight: '700', color: '#1f2937', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' },
//   fadeIn: { opacity: 1, transition: 'opacity 0.3s ease-in' },
//   filterBox: { backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', marginBottom: '24px' },
//   filterRow: { display: 'flex', gap: '20px', alignItems: 'flex-end', flexWrap: 'wrap' },
//   filterGroup: { display: 'flex', flexDirection: 'column', gap: '8px', flex: '1', minWidth: '200px' },
//   label: { fontSize: '13px', fontWeight: '600', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' },
//   input: { padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', backgroundColor: '#fff', color: '#1e293b', width: '100%' },
//   findBtn: { padding: '12px 24px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', height: '44px' },
//   addBtn: { padding: '10px 20px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
//   alertBox: { padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', fontWeight: '500' },
//   tableTopHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', padding: '0 4px' },
//   tableWrapper: { borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' },
//   table: { width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff' },
//   th: { textAlign: 'left', fontSize: '12px', color: '#64748b', fontWeight: '700', padding: '16px 20px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textTransform: 'uppercase' },
//   tr: { borderBottom: '1px solid #f1f5f9' },
//   td: { padding: '16px 20px', fontSize: '14px', color: '#1e293b' },
//   emptyCell: { padding: '40px', textAlign: 'center', color: '#64748b' },
//   nameCell: { display: 'flex', alignItems: 'center', gap: '12px' },
//   miniAvatar: { width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#e2e8f0', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700' },
//   actionBtns: { display: 'flex', gap: '8px', justifyContent: 'flex-end' },
//   editBtn: { padding: '6px 12px', backgroundColor: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' },
//   deleteBtn: { padding: '6px 12px', backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' },
//   modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, backdropFilter: 'blur(4px)' },
//   modal: { backgroundColor: '#fff', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '440px', display: 'flex', flexDirection: 'column', gap: '20px' },
//   modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
//   formTitle: { fontSize: '20px', fontWeight: '700', color: '#0f172a', margin: 0 },
//   modalBadge: { backgroundColor: '#f1f5f9', color: '#475569', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' },
//   formGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
//   formButtons: { display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' },
//   cancelBtn: { padding: '10px 20px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
//   submitBtn: { padding: '10px 24px', borderRadius: '8px', border: 'none', backgroundColor: '#2563eb', color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
//   emptyState: { textAlign: 'center', padding: '60px 20px', border: '2px dashed #e2e8f0', borderRadius: '12px', backgroundColor: '#fafaf9', marginTop: '16px' },
//   emptyStateIcon: { fontSize: '56px', marginBottom: '16px', opacity: 0.8 },
// }





// import { useState, useEffect } from 'react'
// import { supabase } from '../../lib/supabase'

// export default function Subjects() {
//   const [classes, setClasses] = useState([])
//   const [subjects, setSubjects] = useState([])
//   const [selectedClass, setSelectedClass] = useState('')
//   const [selectedClassName, setSelectedClassName] = useState('')
//   const [searched, setSearched] = useState(false)
//   const [loading, setLoading] = useState(false)
//   const [showAddModal, setShowAddModal] = useState(false)
//   const [teachers, setTeachers] = useState([])
//   const [selectedTeacher, setSelectedTeacher] = useState('')
//   const [newSubjectName, setNewSubjectName] = useState('')
//   const [saving, setSaving] = useState(false)

//   useEffect(() => {
//     // 1. Load classes for the dropdown
//     supabase.from('classes').select('*').order('name').then(({ data }) => setClasses(data || []))
//     // 2. Load teachers for the assignment modal
//     supabase.from('profiles').select('id, name').eq('role', 'teacher').then(({ data }) => setTeachers(data || []))
//   }, [])

//   const handleFind = async () => {
//     if (!selectedClass) return
//     setLoading(true)
//     setSearched(true)
    
//     // CRITICAL FIX: This query ONLY gets subjects linked to the selected class ID
//     const { data, error } = await supabase
//       .from('subjects')
//       .select(`
//         id, 
//         name, 
//         teacher_id, 
//         profiles:teacher_id (name)
//       `)
//       .eq('class_id', selectedClass) // <--- THIS IS THE FILTER
//       .order('name')
    
//     if (error) {
//       console.error("Error fetching subjects:", error)
//     } else {
//       setSubjects(data || [])
//     }
//     setLoading(false)
//   }

//   const handleAdd = async () => {
//     if (!newSubjectName.trim() || !selectedClass) return
//     setSaving(true)
    
//     const { data, error } = await supabase
//       .from('subjects')
//       .insert({ 
//         name: newSubjectName.trim(), 
//         class_id: selectedClass, 
//         teacher_id: selectedTeacher || null 
//       })
//       .select(`*, profiles:teacher_id (name)`)
//       .single()
    
//     if (!error) {
//       setSubjects([...subjects, data])
//       setShowAddModal(false)
//       setNewSubjectName('')
//       setSelectedTeacher('')
//     }
//     setSaving(false)
//   }

//   const handleDelete = async (id) => {
//     if (!window.confirm('Delete this subject assignment?')) return
//     const { error } = await supabase.from('subjects').delete().eq('id', id)
//     if (!error) {
//       setSubjects(subjects.filter(s => s.id !== id))
//     }
//   }

//   return (
//     <div style={styles.container}>
//       <div style={styles.pageHeader}>
//         <h1 style={styles.pageTitle}>Curriculum Management</h1>
//         <p style={styles.pageSubtitle}>View and manage subjects for specific classes</p>
//       </div>

//       <div style={styles.card}>
//         {/* Class Selection Filter */}
//         <div style={styles.filterBox}>
//           <div style={styles.filterRow}>
//             <div style={styles.filterGroup}>
//               <label style={styles.label}>Select Class to View</label>
//               <select
//                 style={styles.input}
//                 value={selectedClass}
//                 onChange={e => {
//                   setSelectedClass(e.target.value)
//                   setSelectedClassName(classes.find(c => c.id == e.target.value)?.name || '')
//                   setSearched(false) // Reset view when class changes
//                 }}
//               >
//                 <option value="">-- Choose Class --</option>
//                 {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
//               </select>
//             </div>
//             <button style={styles.findBtn} onClick={handleFind}>
//               🔍 Find Subjects
//             </button>
//           </div>
//         </div>

//         {/* Results Table */}
//         {searched && (
//           <div>
//             <div style={styles.tableTopHeader}>
//               <h3 style={styles.sectionTitle}>Subjects assigned to Class {selectedClassName}</h3>
//               <button style={styles.addBtn} onClick={() => setShowAddModal(true)}>＋ Add Subject</button>
//             </div>

//             <div style={styles.tableWrapper}>
//               <table style={styles.table}>
//                 <thead>
//                   <tr>
//                     <th style={styles.th}>Subject</th>
//                     <th style={styles.th}>Teacher</th>
//                     <th style={{ ...styles.th, textAlign: 'right' }}>Actions</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {loading ? (
//                     <tr><td colSpan={3} style={styles.emptyCell}>Loading...</td></tr>
//                   ) : subjects.length === 0 ? (
//                     <tr><td colSpan={3} style={styles.emptyCell}>No subjects found for this class.</td></tr>
//                   ) : (
//                     subjects.map((s) => (
//                       <tr key={s.id} style={styles.tr}>
//                         <td style={{ ...styles.td, fontWeight: '700' }}>{s.name}</td>
//                         <td style={styles.td}>
//                           {s.profiles?.name ? (
//                             <span style={{ color: '#2563eb', fontWeight: '500' }}>👤 {s.profiles.name}</span>
//                           ) : (
//                             <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Unassigned</span>
//                           )}
//                         </td>
//                         <td style={{ ...styles.td, textAlign: 'right' }}>
//                           <button style={styles.deleteBtn} onClick={() => handleDelete(s.id)}>🗑️ Remove</button>
//                         </td>
//                       </tr>
//                     ))
//                   )}
//                 </tbody>
//               </table>
//             </div>
//           </div>
//         )}

//         {/* Add Subject Modal */}
//         {showAddModal && (
//           <div style={styles.modalOverlay}>
//             <div style={styles.modal}>
//               <h3 style={styles.formTitle}>Add Subject to {selectedClassName}</h3>
//               <div style={styles.formGroup}>
//                 <label style={styles.label}>Subject Name</label>
//                 <input 
//                   style={styles.input} 
//                   placeholder="e.g. Mathematics" 
//                   value={newSubjectName} 
//                   onChange={e => setNewSubjectName(e.target.value)} 
//                 />
//               </div>
//               <div style={styles.formGroup}>
//                 <label style={styles.label}>Assign Teacher</label>
//                 <select style={styles.input} value={selectedTeacher} onChange={e => setSelectedTeacher(e.target.value)}>
//                   <option value="">-- No Teacher --</option>
//                   {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
//                 </select>
//               </div>
//               <div style={styles.formButtons}>
//                 <button style={styles.cancelBtn} onClick={() => setShowAddModal(false)}>Cancel</button>
//                 <button style={styles.submitBtn} onClick={handleAdd} disabled={saving}>Save</button>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   )
// }

// const styles = {
//   container: { maxWidth: '900px', margin: '0 auto', padding: '20px' },
//   pageHeader: { marginBottom: '24px' },
//   pageTitle: { fontSize: '28px', fontWeight: '800', color: '#1a1a2e', margin: 0 },
//   pageSubtitle: { fontSize: '14px', color: '#6b7280' },
//   card: { backgroundColor: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' },
//   filterBox: { backgroundColor: '#f9fafb', padding: '20px', borderRadius: '10px', marginBottom: '24px', border: '1px solid #e5e7eb' },
//   filterRow: { display: 'flex', gap: '16px', alignItems: 'flex-end' },
//   filterGroup: { display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 },
//   label: { fontSize: '12px', fontWeight: '700', color: '#4b5563', textTransform: 'uppercase' },
//   input: { padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' },
//   findBtn: { padding: '10px 20px', backgroundColor: '#4f46e5', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' },
//   tableTopHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
//   sectionTitle: { fontSize: '16px', fontWeight: '700', color: '#374151', margin: 0 },
//   addBtn: { padding: '8px 16px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' },
//   tableWrapper: { border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' },
//   table: { width: '100%', borderCollapse: 'collapse' },
//   th: { textAlign: 'left', padding: '12px', backgroundColor: '#f9fafb', fontSize: '12px', color: '#6b7280', borderBottom: '1px solid #e5e7eb' },
//   td: { padding: '12px', fontSize: '14px', borderBottom: '1px solid #f3f4f6' },
//   tr: { transition: 'background 0.2s' },
//   deleteBtn: { padding: '4px 10px', color: '#ef4444', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' },
//   emptyCell: { textAlign: 'center', padding: '40px', color: '#9ca3af' },
//   modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
//   modal: { backgroundColor: '#fff', padding: '24px', borderRadius: '12px', width: '380px', display: 'flex', flexDirection: 'column', gap: '16px' },
//   formTitle: { margin: 0, fontSize: '18px', fontWeight: '700' },
//   formGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
//   formButtons: { display: 'flex', justifyContent: 'flex-end', gap: '10px' },
//   cancelBtn: { padding: '8px 16px', border: '1px solid #d1d5db', background: 'none', borderRadius: '6px', cursor: 'pointer' },
//   submitBtn: { padding: '8px 20px', backgroundColor: '#4f46e5', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }
// }



// import { useState, useEffect } from 'react'
// import { supabase } from '../../lib/supabase'

// export default function Subjects() {
//   const [classes, setClasses] = useState([])
//   const [subjects, setSubjects] = useState([])
//   const [selectedClass, setSelectedClass] = useState('')
//   const [selectedClassName, setSelectedClassName] = useState('')
//   const [searched, setSearched] = useState(false)
//   const [loading, setLoading] = useState(false)
//   const [showAddModal, setShowAddModal] = useState(false)
//   const [teachers, setTeachers] = useState([])
//   const [selectedTeacher, setSelectedTeacher] = useState('')
//   const [newSubjectName, setNewSubjectName] = useState('')
//   const [saving, setSaving] = useState(false)
//   const [editSubject, setEditSubject] = useState(null)
//   const [editTeacher, setEditTeacher] = useState('')

//   useEffect(() => {
//     supabase.from('classes').select('*').order('name').then(({ data }) => setClasses(data || []))
//     supabase.from('profiles').select('id, name').eq('role', 'teacher').order('name').then(({ data }) => setTeachers(data || []))
//   }, [])

//   const handleFind = async () => {
//     if (!selectedClass) return
//     setLoading(true)
//     setSearched(true)
//     const { data } = await supabase
//       .from('subjects')
//       .select('id, name, teacher_id, profiles:teacher_id (name)')
//       .eq('class_id', selectedClass)
//       .not('teacher_id', 'is', null)  // only show subjects WITH a teacher
//       .order('name')
//     setSubjects(data || [])
//     setLoading(false)
//   }

//   const handleAdd = async () => {
//     if (!newSubjectName.trim() || !selectedClass) return
//     setSaving(true)
//     const { data, error } = await supabase
//       .from('subjects')
//       .insert({
//         name: newSubjectName.trim(),
//         class_id: parseInt(selectedClass),
//         teacher_id: selectedTeacher || null
//       })
//       .select('*, profiles:teacher_id (name)')
//       .single()
//     if (!error && data) {
//       // only add to list if teacher assigned (matches our filter)
//       if (data.teacher_id) setSubjects([...subjects, data])
//       setShowAddModal(false)
//       setNewSubjectName('')
//       setSelectedTeacher('')
//     }
//     setSaving(false)
//   }

//   const handleDelete = async (id) => {
//     if (!window.confirm('Remove this subject?')) return
//     const { error } = await supabase.from('subjects').delete().eq('id', id)
//     if (!error) setSubjects(subjects.filter(s => s.id !== id))
//   }

//   const handleEditSave = async () => {
//     const { error } = await supabase
//       .from('subjects')
//       .update({ teacher_id: editTeacher || null })
//       .eq('id', editSubject.id)
//     if (!error) {
//       setSubjects(subjects.map(s => s.id === editSubject.id
//         ? { ...s, teacher_id: editTeacher, profiles: teachers.find(t => t.id === editTeacher) || null }
//         : s
//       ))
//       setEditSubject(null)
//     }
//   }

//   const stats = {
//     total: subjects.length,
//     assigned: subjects.filter(s => s.profiles?.name).length,
//     unassigned: subjects.filter(s => !s.profiles?.name).length,
//   }

//   return (
//     <div>
//       <div style={styles.pageHeader}>
//         <h1 style={styles.pageTitle}>Subjects</h1>
//         <p style={styles.pageSubtitle}>Manage subjects and teacher assignments per class</p>
//       </div>

//       <div style={styles.card}>
//         {/* Filter */}
//         <div style={styles.filterBox}>
//           <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
//             <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: '200px' }}>
//               <label style={styles.label}>Select Class</label>
//               <select style={styles.input} value={selectedClass} onChange={e => {
//                 setSelectedClass(e.target.value)
//                 setSelectedClassName(classes.find(c => String(c.id) === e.target.value)?.name || '')
//                 setSearched(false)
//                 setSubjects([])
//               }}>
//                 <option value="">-- Choose Class --</option>
//                 {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
//               </select>
//             </div>
//             <button style={styles.findBtn} onClick={handleFind} disabled={!selectedClass}>
//               🔍 Find Subjects
//             </button>
//           </div>
//         </div>

//         {searched && (
//           <>
//             {/* Stats */}
//             <div style={styles.statsRow}>
//               <div style={styles.statCard}>
//                 <div style={styles.statVal}>{stats.total}</div>
//                 <div style={styles.statLabel}>Total Subjects</div>
//               </div>
//               <div style={{ ...styles.statCard, backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
//                 <div style={{ ...styles.statVal, color: '#16a34a' }}>{stats.assigned}</div>
//                 <div style={styles.statLabel}>Teacher Assigned</div>
//               </div>
//               <div style={{ ...styles.statCard, backgroundColor: '#fffbeb', border: '1px solid #fde68a' }}>
//                 <div style={{ ...styles.statVal, color: '#d97706' }}>{stats.unassigned}</div>
//                 <div style={styles.statLabel}>Unassigned</div>
//               </div>
//             </div>

//             {/* Header */}
//             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
//               <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1a1a2e', margin: 0 }}>
//                 Class {selectedClassName} — Subjects
//                 <span style={{ color: '#9ca3af', fontWeight: '400', marginLeft: '8px' }}>({subjects.length})</span>
//               </h3>
//               <button style={styles.addBtn} onClick={() => setShowAddModal(true)}>＋ Add Subject</button>
//             </div>

//             {/* Table */}
//             {loading ? (
//               <div style={styles.emptyState}>⏳ Loading...</div>
//             ) : subjects.length === 0 ? (
//               <div style={styles.emptyState}>
//                 <div style={{ fontSize: '40px', marginBottom: '10px' }}>📚</div>
//                 <div style={{ fontWeight: '600', color: '#374151' }}>No subjects with teachers assigned</div>
//                 <div style={{ fontSize: '13px', color: '#9ca3af', marginTop: '4px' }}>Click "+ Add Subject" to assign one</div>
//               </div>
//             ) : (
//               <div style={styles.tableWrapper}>
//                 <table style={styles.table}>
//                   <thead>
//                     <tr>
//                       <th style={styles.th}>#</th>
//                       <th style={styles.th}>Subject Name</th>
//                       <th style={styles.th}>Assigned Teacher</th>
//                       <th style={{ ...styles.th, textAlign: 'right' }}>Actions</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {subjects.map((s, i) => (
//                       <tr key={s.id}>
//                         <td style={{ ...styles.td, color: '#9ca3af', width: '40px' }}>{i + 1}</td>
//                         <td style={{ ...styles.td, fontWeight: '700', color: '#1a1a2e' }}>{s.name}</td>
//                         <td style={styles.td}>
//                           {s.profiles?.name ? (
//                             <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
//                               <div style={styles.miniAvatar}>{s.profiles.name.charAt(0).toUpperCase()}</div>
//                               <span style={{ color: '#374151', fontWeight: '500' }}>{s.profiles.name}</span>
//                             </div>
//                           ) : (
//                             <span style={{ color: '#f59e0b', fontSize: '13px' }}>⚠️ Unassigned</span>
//                           )}
//                         </td>
//                         <td style={{ ...styles.td, textAlign: 'right' }}>
//                           <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
//                             <button style={styles.editBtn} onClick={() => { setEditSubject(s); setEditTeacher(s.teacher_id || '') }}>✏️ Change Teacher</button>
//                             <button style={styles.deleteBtn} onClick={() => handleDelete(s.id)}>🗑 Remove</button>
//                           </div>
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             )}
//           </>
//         )}

//         {!searched && (
//           <div style={styles.emptyState}>
//             <div style={{ fontSize: '48px', marginBottom: '12px' }}>📖</div>
//             <div style={{ fontWeight: '600', color: '#374151', fontSize: '16px' }}>Select a class to view subjects</div>
//             <div style={{ fontSize: '13px', color: '#9ca3af', marginTop: '4px' }}>Only subjects with an assigned teacher will be shown</div>
//           </div>
//         )}
//       </div>

//       {/* Add Subject Modal */}
//       {showAddModal && (
//         <div style={styles.modalOverlay}>
//           <div style={styles.modal}>
//             <h3 style={styles.modalTitle}>Add Subject to Class {selectedClassName}</h3>
//             <p style={{ fontSize: '13px', color: '#6b7280', margin: '-8px 0 16px' }}>Type the subject name and assign a teacher</p>

//             <div style={styles.formGroup}>
//               <label style={styles.label}>Subject Name *</label>
//               <input style={styles.input} placeholder="e.g. Mathematics, Science, Hindi..."
//                 value={newSubjectName} onChange={e => setNewSubjectName(e.target.value)}
//                 onKeyDown={e => e.key === 'Enter' && handleAdd()} />
//             </div>

//             <div style={styles.formGroup}>
//               <label style={styles.label}>Assign Teacher</label>
//               <select style={styles.input} value={selectedTeacher} onChange={e => setSelectedTeacher(e.target.value)}>
//                 <option value="">-- No Teacher (won't appear in list) --</option>
//                 {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
//               </select>
//               {!selectedTeacher && (
//                 <p style={{ fontSize: '11px', color: '#f59e0b', margin: '4px 0 0' }}>⚠️ Subject won't show in the list until a teacher is assigned</p>
//               )}
//             </div>

//             <div style={styles.formButtons}>
//               <button style={styles.cancelBtn} onClick={() => { setShowAddModal(false); setNewSubjectName(''); setSelectedTeacher('') }}>Cancel</button>
//               <button style={styles.submitBtn} onClick={handleAdd} disabled={saving || !newSubjectName.trim()}>
//                 {saving ? 'Saving...' : 'Add Subject'}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Edit Teacher Modal */}
//       {editSubject && (
//         <div style={styles.modalOverlay}>
//           <div style={styles.modal}>
//             <h3 style={styles.modalTitle}>Change Teacher for "{editSubject.name}"</h3>
//             <div style={styles.formGroup}>
//               <label style={styles.label}>Assign Teacher</label>
//               <select style={styles.input} value={editTeacher} onChange={e => setEditTeacher(e.target.value)}>
//                 <option value="">-- Unassign --</option>
//                 {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
//               </select>
//             </div>
//             <div style={styles.formButtons}>
//               <button style={styles.cancelBtn} onClick={() => setEditSubject(null)}>Cancel</button>
//               <button style={styles.submitBtn} onClick={handleEditSave}>Save</button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }

// const styles = {
//   pageHeader: { marginBottom: '24px' },
//   pageTitle: { fontSize: '28px', fontWeight: '800', color: '#1a1a2e', margin: '0 0 4px' },
//   pageSubtitle: { fontSize: '14px', color: '#6b7280', margin: 0 },
//   card: { backgroundColor: '#fff', borderRadius: '16px', padding: '28px', boxShadow: '0 1px 8px rgba(0,0,0,0.07)' },
//   filterBox: { backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', marginBottom: '24px' },
//   label: { fontSize: '12px', fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px' },
//   input: { padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', outline: 'none', backgroundColor: '#fff' },
//   findBtn: { padding: '10px 24px', backgroundColor: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '14px' },
//   addBtn: { padding: '9px 18px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '14px' },

//   statsRow: { display: 'flex', gap: '12px', marginBottom: '20px' },
//   statCard: { flex: 1, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px 18px', textAlign: 'center' },
//   statVal: { fontSize: '24px', fontWeight: '800', color: '#1a1a2e' },
//   statLabel: { fontSize: '12px', color: '#6b7280', marginTop: '2px' },

//   tableWrapper: { border: '1px solid #e5e7eb', borderRadius: '10px', overflow: 'hidden' },
//   table: { width: '100%', borderCollapse: 'collapse' },
//   th: { textAlign: 'left', padding: '12px 16px', backgroundColor: '#f9fafb', fontSize: '12px', color: '#6b7280', fontWeight: '700', borderBottom: '1px solid #e5e7eb', textTransform: 'uppercase', letterSpacing: '0.5px' },
//   td: { padding: '13px 16px', fontSize: '14px', color: '#374151', borderBottom: '1px solid #f3f4f6' },
//   miniAvatar: { width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#4f46e5', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', flexShrink: 0 },
//   editBtn: { padding: '5px 12px', backgroundColor: '#ede9fe', color: '#6d28d9', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' },
//   deleteBtn: { padding: '5px 12px', backgroundColor: '#fef2f2', color: '#ef4444', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' },
//   emptyState: { textAlign: 'center', padding: '60px 20px', color: '#9ca3af', fontSize: '14px' },

//   modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
//   modal: { backgroundColor: '#fff', padding: '28px', borderRadius: '16px', width: '420px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' },
//   modalTitle: { margin: 0, fontSize: '18px', fontWeight: '700', color: '#1a1a2e' },
//   formGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
//   formButtons: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px' },
//   cancelBtn: { padding: '9px 18px', border: '1px solid #e5e7eb', background: '#fff', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' },
//   submitBtn: { padding: '9px 20px', backgroundColor: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' },
// }



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