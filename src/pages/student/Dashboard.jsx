// import { useState, useEffect } from 'react'
// import { supabase } from '../../lib/supabase'
// import { useAuth } from '../../context/AuthContext'

// export default function StudentDashboard() {
//   const { profile } = useAuth()
//   const [stats, setStats] = useState({ attendance: 0, subjects: 0, marks: 0 })
//   const [notices, setNotices] = useState([])
//   const [reminders, setReminders] = useState([])
//   const [newReminder, setNewReminder] = useState('')
//   const [selectedNotice, setSelectedNotice] = useState(null)
//   const [loading, setLoading] = useState(true)

//   useEffect(() => { fetchData() }, [])

//   const fetchData = async () => {
//     const { data: studentData } = await supabase
//       .from('students')
//       .select('*')
//       .eq('id', profile.id)
//       .single()

//     if (studentData) {
//       const { count: attendanceCount } = await supabase
//         .from('attendance')
//         .select('*', { count: 'exact', head: true })
//         .eq('student_id', profile.id)
//         .eq('status', 'present')

//       const { count: subjectCount } = await supabase
//         .from('subjects')
//         .select('*', { count: 'exact', head: true })
//         .eq('class_id', studentData.class_id)

//       const { count: marksCount } = await supabase
//         .from('marks')
//         .select('*', { count: 'exact', head: true })
//         .eq('student_id', profile.id)

//       setStats({ attendance: attendanceCount || 0, subjects: subjectCount || 0, marks: marksCount || 0 })
//     }

//     const { data: noticeData } = await supabase
//       .from('notices')
//       .select('*')
//       .in('target', ['all', 'students'])
//       .order('created_at', { ascending: false })
//       .limit(5)
//     setNotices(noticeData || [])

//     const { data: reminderData } = await supabase
//       .from('reminders')
//       .select('*')
//       .eq('user_id', profile.id)
//       .order('created_at', { ascending: false })
//     setReminders(reminderData || [])

//     setLoading(false)
//   }

//   const addReminder = async () => {
//     if (!newReminder.trim()) return
//     const { data } = await supabase.from('reminders').insert({
//       user_id: profile.id,
//       message: newReminder.trim(),
//     }).select().single()
//     if (data) { setReminders([data, ...reminders]); setNewReminder('') }
//   }

//   const deleteReminder = async (id) => {
//     await supabase.from('reminders').delete().eq('id', id)
//     setReminders(reminders.filter(r => r.id !== id))
//   }

//   if (loading) return <div style={styles.loading}>Loading...</div>

//   return (
//     <div>
//       {selectedNotice && (
//         <div style={styles.modalOverlay} onClick={() => setSelectedNotice(null)}>
//           <div style={styles.modal} onClick={e => e.stopPropagation()}>
//             <h2 style={styles.modalTitle}>{selectedNotice.title}</h2>
//             <p style={styles.modalDate}>{new Date(selectedNotice.created_at).toLocaleDateString('en-IN')}</p>
//             <p style={styles.modalBody}>{selectedNotice.body || 'No description available.'}</p>
//             <button style={styles.closeBtn} onClick={() => setSelectedNotice(null)}>✕ Close</button>
//           </div>
//         </div>
//       )}

//       <h1 style={styles.title}>Welcome, {profile?.name} 👋</h1>
//       <p style={styles.subtitle}>Here's your academic overview</p>

//       <div style={styles.statsGrid}>
//         {[
//           { label: 'Days Present', value: stats.attendance, icon: '✅', color: '#dcfce7' },
//           { label: 'My Subjects', value: stats.subjects, icon: '📚', color: '#dbeafe' },
//           { label: 'Marks Recorded', value: stats.marks, icon: '🏆', color: '#fef9c3' },
//         ].map(stat => (
//           <div key={stat.label} style={styles.statCard}>
//             <div style={{ ...styles.statIcon, backgroundColor: stat.color }}>
//               <span style={{ fontSize: '28px' }}>{stat.icon}</span>
//             </div>
//             <div>
//               <p style={styles.statValue}>{stat.value}</p>
//               <p style={styles.statLabel}>{stat.label}</p>
//             </div>
//           </div>
//         ))}
//       </div>

//       <div style={styles.grid}>
//         <div style={styles.card}>
//           <h2 style={styles.cardTitle}>📢 Latest Notices</h2>
//           {notices.length === 0 ? <p style={styles.empty}>No notices yet</p> :
//             notices.map(n => (
//               <div key={n.id} style={{ ...styles.noticeItem, cursor: 'pointer' }} onClick={() => setSelectedNotice(n)}>
//                 <p style={styles.noticeTitle}>{n.title}</p>
//                 <p style={styles.noticeDate}>{new Date(n.created_at).toLocaleDateString('en-IN')}</p>
//               </div>
//             ))
//           }
//         </div>

//         <div style={styles.card}>
//           <h2 style={styles.cardTitle}>⏰ My Reminders</h2>
//           <div style={styles.reminderInput}>
//             <input style={styles.input} placeholder="Add reminder..." value={newReminder}
//               onChange={e => setNewReminder(e.target.value)}
//               onKeyDown={e => e.key === 'Enter' && addReminder()} />
//             <button style={styles.addBtn} onClick={addReminder}>Add</button>
//           </div>
//           <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
//             {reminders.length === 0 ? <p style={styles.empty}>No reminders yet</p> :
//               reminders.map(r => (
//                 <div key={r.id} style={styles.reminderItem}>
//                   <span style={{ fontSize: '14px', color: '#374151' }}>{r.message}</span>
//                   <button style={styles.deleteBtn} onClick={() => deleteReminder(r.id)}>🗑</button>
//                 </div>
//               ))
//             }
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }

// const styles = {
//   loading: { textAlign: 'center', padding: '40px', color: '#9ca3af' },
//   title: { fontSize: '24px', fontWeight: '700', color: '#1a1a2e', margin: 0 },
//   subtitle: { color: '#6b7280', marginTop: '4px', marginBottom: '24px' },
//   statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' },
//   statCard: { backgroundColor: '#fff', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
//   statIcon: { width: '56px', height: '56px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
//   statValue: { fontSize: '28px', fontWeight: '800', color: '#1a1a2e', margin: 0 },
//   statLabel: { fontSize: '13px', color: '#6b7280', margin: 0 },
//   grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
//   card: { backgroundColor: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
//   cardTitle: { fontSize: '16px', fontWeight: '700', color: '#1a1a2e', marginBottom: '16px' },
//   empty: { color: '#9ca3af', fontSize: '14px' },
//   noticeItem: { padding: '10px 0', borderBottom: '1px solid #f3f4f6' },
//   noticeTitle: { fontSize: '14px', fontWeight: '600', color: '#374151', margin: 0 },
//   noticeDate: { fontSize: '12px', color: '#9ca3af', margin: '2px 0 0' },
//   reminderInput: { display: 'flex', gap: '8px' },
//   input: { flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', outline: 'none' },
//   addBtn: { padding: '8px 16px', backgroundColor: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
//   reminderItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9fafb', borderRadius: '8px', padding: '10px 12px' },
//   deleteBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' },
//   modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999 },
//   modal: { backgroundColor: '#fff', borderRadius: '16px', padding: '32px', width: '520px', maxWidth: '90vw', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', gap: '12px' },
//   modalTitle: { fontSize: '20px', fontWeight: '700', color: '#1a1a2e', margin: 0 },
//   modalDate: { fontSize: '13px', color: '#9ca3af', margin: 0 },
//   modalBody: { fontSize: '15px', color: '#374151', lineHeight: '1.6' },
//   closeBtn: { padding: '10px 24px', backgroundColor: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', alignSelf: 'flex-end', marginTop: '8px' },
// }







import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

export default function StudentDashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState({ attendance: 0, subjects: 0, marks: 0 })
  const [notices, setNotices] = useState([])
  const [reminders, setReminders] = useState([])
  const [newReminder, setNewReminder] = useState('')
  const [selectedNotice, setSelectedNotice] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (profile?.id) fetchData() }, [profile])

  const fetchData = async () => {
    // 1. Get Student specific data for stats
    const { data: studentData } = await supabase
      .from('students')
      .select('*')
      .eq('id', profile.id)
      .single()

    if (studentData) {
      const [{ count: att }, { count: sub }, { count: mrk }] = await Promise.all([
        supabase.from('attendance').select('*', { count: 'exact', head: true }).eq('student_id', profile.id).eq('status', 'present'),
        supabase.from('subjects').select('*', { count: 'exact', head: true }).eq('class_id', studentData.class_id),
        supabase.from('marks').select('*', { count: 'exact', head: true }).eq('student_id', profile.id)
      ])
      setStats({ attendance: att || 0, subjects: sub || 0, marks: mrk || 0 })
    }

    // 2. Fetch Notices
    const { data: noticeData } = await supabase
      .from('notices')
      .select('*')
      .in('target', ['all', 'students'])
      .order('created_at', { ascending: false })
      .limit(5)
    setNotices(noticeData || [])

    // 3. Fetch Reminders (FIXED COLUMN NAME TO admin_id)
    const { data: reminderData } = await supabase
      .from('reminders')
      .select('*')
      .eq('admin_id', profile.id) 
      .order('created_at', { ascending: false })
    setReminders(reminderData || [])

    setLoading(false)
  }

  const addReminder = async () => {
    if (!newReminder.trim()) return
    
    // Create the object to send (FIXED COLUMN NAME TO admin_id)
    const newTask = {
      admin_id: profile.id, 
      message: newReminder.trim(),
    }

    const { data, error } = await supabase
      .from('reminders')
      .insert([newTask])
      .select()

    if (error) {
      console.error("Database Error:", error.message)
      alert("Failed to add task. Check console for details.")
      return
    }

    if (data && data.length > 0) { 
      setReminders([data[0], ...reminders])
      setNewReminder('') 
    }
  }

  const deleteReminder = async (id) => {
    setReminders(prev => prev.filter(r => r.id !== id))
    await supabase.from('reminders').delete().eq('id', id)
  }

  const todayDate = new Date().toLocaleDateString('en-IN', { 
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' 
  })

  if (loading) return (
    <div style={styles.loadingContainer}>
      <div style={{ fontSize: '40px', marginBottom: '16px' }}>🎓</div>
      <div style={{ color: '#64748b', fontSize: '16px', fontWeight: '600' }}>Syncing Dashboard...</div>
    </div>
  )

  return (
    <div style={styles.container}>
      {/* Notice Modal */}
      {selectedNotice && (
        <div style={styles.modalOverlay} onClick={() => setSelectedNotice(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div>
                <h2 style={styles.modalTitle}>{selectedNotice.title}</h2>
                <p style={styles.modalDate}>Posted on {new Date(selectedNotice.created_at).toLocaleDateString()}</p>
              </div>
              <button style={styles.closeIconBtn} onClick={() => setSelectedNotice(null)}>✕</button>
            </div>
            <div style={styles.modalBodyWrapper}>
              <p style={styles.modalBody}>{selectedNotice.body}</p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={styles.welcomeBanner}>
        <div>
          <h1 style={styles.welcomeTitle}>Welcome back, {profile?.name?.split(' ')[0]}! 👋</h1>
          <p style={styles.welcomeSubtitle}>Your academic summary for {todayDate}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={styles.statsGrid}>
        <div style={{ ...styles.statCard, borderLeft: '6px solid #16a34a' }}>
          <p style={styles.statLabel}>Days Present</p>
          <p style={{ ...styles.statValue, color: '#16a34a' }}>{stats.attendance}</p>
        </div>
        <div style={{ ...styles.statCard, borderLeft: '6px solid #2563eb' }}>
          <p style={styles.statLabel}>Active Subjects</p>
          <p style={{ ...styles.statValue, color: '#2563eb' }}>{stats.subjects}</p>
        </div>
        <div style={{ ...styles.statCard, borderLeft: '6px solid #d97706' }}>
          <p style={styles.statLabel}>Recorded Marks</p>
          <p style={{ ...styles.statValue, color: '#d97706' }}>{stats.marks}</p>
        </div>
      </div>

      <div style={styles.grid}>
        {/* Notices */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>📢 Announcements</h2>
          <div style={styles.noticeList}>
            {notices.map(n => (
              <div key={n.id} style={styles.noticeItem} onClick={() => setSelectedNotice(n)}>
                <div style={styles.dateBubble}>
                  <span style={styles.bubbleM}>{new Date(n.created_at).toLocaleString('default',{month:'short'})}</span>
                  <span style={styles.bubbleD}>{new Date(n.created_at).getDate()}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={styles.noticeTitle}>{n.title}</p>
                  <p style={styles.noticePreview}>{n.body?.substring(0, 50)}...</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reminders - TASK SYSTEM */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>📝 Tasks & Reminders</h2>
          <div style={styles.reminderInputBox}>
            <input 
              style={styles.input} 
              placeholder="Add a quick task..." 
              value={newReminder}
              onChange={e => setNewReminder(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addReminder()} 
            />
            <button style={styles.addBtn} onClick={addReminder}>Add Task</button>
          </div>
          
          <div style={styles.reminderList}>
            {reminders.length === 0 ? (
              <div style={styles.emptyState}>No active tasks.</div>
            ) : (
              reminders.map(r => (
                <div key={r.id} style={styles.reminderItem}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input type="checkbox" style={styles.checkbox} onChange={() => deleteReminder(r.id)} />
                    <span style={styles.reminderText}>{r.message}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: { padding: '24px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Inter, sans-serif' },
  loadingContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' },
  welcomeBanner: { background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)', borderRadius: '24px', padding: '40px', color: '#fff', marginBottom: '32px' },
  welcomeTitle: { margin: 0, fontSize: '32px', fontWeight: '800' },
  welcomeSubtitle: { margin: '8px 0 0', fontSize: '16px', opacity: 0.8 },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' },
  statCard: { backgroundColor: '#fff', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' },
  statLabel: { margin: 0, fontSize: '13px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' },
  statValue: { margin: '8px 0 0', fontSize: '32px', fontWeight: '800' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' },
  card: { backgroundColor: '#fff', borderRadius: '24px', padding: '32px', border: '1px solid #f1f5f9' },
  cardTitle: { fontSize: '18px', fontWeight: '800', marginBottom: '24px', color: '#1e293b' },
  noticeItem: { display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', borderRadius: '16px', backgroundColor: '#f8fafc', marginBottom: '12px', cursor: 'pointer' },
  dateBubble: { backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '50px' },
  bubbleM: { fontSize: '10px', fontWeight: '800', color: '#6366f1', textTransform: 'uppercase' },
  bubbleD: { fontSize: '18px', fontWeight: '800', color: '#1e293b' },
  noticeTitle: { fontSize: '15px', fontWeight: '700', margin: 0 },
  noticePreview: { fontSize: '13px', color: '#64748b', margin: '2px 0 0' },
  reminderInputBox: { display: 'flex', gap: '12px', marginBottom: '24px' },
  input: { flex: 1, padding: '14px 18px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', backgroundColor: '#f8fafc' },
  addBtn: { padding: '0 24px', backgroundColor: '#1e293b', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' },
  reminderItem: { display: 'flex', alignItems: 'center', padding: '16px', borderBottom: '1px solid #f1f5f9' },
  checkbox: { width: '20px', height: '20px', cursor: 'pointer', accentColor: '#10b981' },
  reminderText: { fontSize: '15px', color: '#334155', fontWeight: '500' },
  modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { backgroundColor: '#fff', borderRadius: '24px', padding: '40px', width: '500px' },
  modalBodyWrapper: { marginTop: '20px', padding: '20px', backgroundColor: '#f8fafc', borderRadius: '16px' },
  closeIconBtn: { background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer' }
}