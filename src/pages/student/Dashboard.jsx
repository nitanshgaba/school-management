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

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const { data: studentData } = await supabase
      .from('students')
      .select('*')
      .eq('id', profile.id)
      .single()

    if (studentData) {
      const { count: attendanceCount } = await supabase
        .from('attendance')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', profile.id)
        .eq('status', 'present')

      const { count: subjectCount } = await supabase
        .from('subjects')
        .select('*', { count: 'exact', head: true })
        .eq('class_id', studentData.class_id)

      const { count: marksCount } = await supabase
        .from('marks')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', profile.id)

      setStats({ attendance: attendanceCount || 0, subjects: subjectCount || 0, marks: marksCount || 0 })
    }

    const { data: noticeData } = await supabase
      .from('notices')
      .select('*')
      .in('target', ['all', 'students'])
      .order('created_at', { ascending: false })
      .limit(5)
    setNotices(noticeData || [])

    const { data: reminderData } = await supabase
      .from('reminders')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
    setReminders(reminderData || [])

    setLoading(false)
  }

  const addReminder = async () => {
    if (!newReminder.trim()) return
    const { data } = await supabase.from('reminders').insert({
      user_id: profile.id,
      message: newReminder.trim(),
    }).select().single()
    if (data) { 
      setReminders([data, ...reminders])
      setNewReminder('') 
    }
  }

  const deleteReminder = async (id) => {
    // Optimistic UI update for immediate feedback
    setReminders(reminders.filter(r => r.id !== id))
    await supabase.from('reminders').delete().eq('id', id)
  }

  const todayDate = new Date().toLocaleDateString('en-IN', { 
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' 
  })

  if (loading) return (
    <div style={styles.loadingContainer}>
      <div style={{ fontSize: '40px', marginBottom: '16px' }}>🎓</div>
      <div style={{ color: '#64748b', fontSize: '16px', fontWeight: '600' }}>Loading your dashboard...</div>
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
                <p style={styles.modalDate}>
                  🗓️ Posted on {new Date(selectedNotice.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
              </div>
              <button style={styles.closeIconBtn} onClick={() => setSelectedNotice(null)}>✕</button>
            </div>
            <div style={styles.modalBodyWrapper}>
              <p style={styles.modalBody}>{selectedNotice.body || 'No description available.'}</p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button style={styles.closeBtn} onClick={() => setSelectedNotice(null)}>Acknowledge & Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Welcome Banner */}
      <div style={styles.welcomeBanner}>
        <div>
          <h1 style={styles.welcomeTitle}>Welcome back, {profile?.name?.split(' ')[0] || 'Student'}! 👋</h1>
          <p style={styles.welcomeSubtitle}>Here is your academic overview for today.</p>
        </div>
        <div style={styles.dateBadge}>
          <span style={{ fontSize: '16px' }}>📅</span>
          <span>{todayDate}</span>
        </div>
      </div>

      {/* Stats Row */}
      <div style={styles.statsGrid}>
        {[
          { label: 'Total Days Present', value: stats.attendance, icon: '✅', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
          { label: 'Enrolled Subjects', value: stats.subjects, icon: '📚', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
          { label: 'Exams/Marks Recorded', value: stats.marks, icon: '🏆', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
        ].map(stat => (
          <div key={stat.label} style={{ ...styles.statCard, backgroundColor: stat.bg, border: `1px solid ${stat.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={styles.statLabel}>{stat.label}</p>
                <p style={{ ...styles.statValue, color: stat.color }}>{stat.value}</p>
              </div>
              <div style={{ fontSize: '32px', opacity: 0.8 }}>{stat.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Dashboard Grid */}
      <div style={styles.grid}>
        
        {/* Left Column: Notices */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>📢 Latest School Announcements</h2>
          </div>
          
          <div style={styles.noticeList}>
            {notices.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={{ fontSize: '40px', marginBottom: '8px' }}>📭</div>
                <p style={styles.empty}>You're all caught up! No new notices.</p>
              </div>
            ) : (
              notices.map(n => {
                const dateObj = new Date(n.created_at)
                return (
                  <div key={n.id} style={styles.noticeItem} onClick={() => setSelectedNotice(n)}>
                    <div style={styles.noticeDateBox}>
                      <span style={styles.noticeMonth}>{dateObj.toLocaleString('default', { month: 'short' })}</span>
                      <span style={styles.noticeDay}>{dateObj.getDate()}</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={styles.noticeTitle}>{n.title}</p>
                      <p style={styles.noticePreview}>
                        {n.body ? (n.body.length > 60 ? n.body.substring(0, 60) + '...' : n.body) : 'Click to view details'}
                      </p>
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: '20px' }}>›</div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Right Column: Reminders / To-Do */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>📝 My Personal Tasks</h2>
          </div>
          
          <div style={styles.reminderInputBox}>
            <input 
              style={styles.input} 
              placeholder="What do you need to remember?" 
              value={newReminder}
              onChange={e => setNewReminder(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addReminder()} 
            />
            <button style={styles.addBtn} onClick={addReminder}>Add Task</button>
          </div>
          
          <div style={styles.reminderList}>
            {reminders.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={{ fontSize: '40px', marginBottom: '8px' }}>✨</div>
                <p style={styles.empty}>Your to-do list is clear!</p>
              </div>
            ) : (
              reminders.map(r => (
                <div key={r.id} style={styles.reminderItem}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input 
                      type="checkbox" 
                      style={styles.checkbox} 
                      onChange={() => deleteReminder(r.id)} 
                      title="Mark as done"
                    />
                    <span style={{ fontSize: '14px', color: '#1e293b', fontWeight: '500' }}>{r.message}</span>
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

// ─── STYLES ────────────────────────────────────────────────
const styles = {
  container: { 
    maxWidth: '1200px', 
    margin: '0 auto', 
    padding: '20px', 
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' 
  },
  
  loadingContainer: { 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center', 
    justifyContent: 'center', 
    minHeight: '60vh' 
  },
  
  fadeIn: { opacity: 1, transition: 'opacity 0.3s ease-in' },

  // Welcome Banner
  welcomeBanner: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    flexWrap: 'wrap',
    gap: '20px',
    background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)', 
    borderRadius: '16px', 
    padding: '32px', 
    color: '#fff', 
    marginBottom: '24px',
    boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.3)'
  },
  welcomeTitle: { margin: '0 0 8px 0', fontSize: '28px', fontWeight: '800', letterSpacing: '-0.5px' },
  welcomeSubtitle: { margin: 0, fontSize: '15px', opacity: 0.9, fontWeight: '500' },
  dateBadge: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '8px', 
    backgroundColor: 'rgba(255, 255, 255, 0.2)', 
    padding: '8px 16px', 
    borderRadius: '20px', 
    fontWeight: '600', 
    fontSize: '14px',
    backdropFilter: 'blur(4px)'
  },

  // Stats Grid
  statsGrid: { 
    display: 'grid', 
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
    gap: '20px', 
    marginBottom: '24px' 
  },
  statCard: { 
    borderRadius: '16px', 
    padding: '24px', 
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)', 
    transition: 'transform 0.2s ease',
    ':hover': { transform: 'translateY(-2px)' }
  },
  statLabel: { margin: '0 0 8px 0', fontSize: '13px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' },
  statValue: { margin: 0, fontSize: '36px', fontWeight: '800', lineHeight: 1 },

  // Main Grid
  grid: { 
    display: 'grid', 
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
    gap: '24px',
    alignItems: 'start'
  },
  card: { 
    backgroundColor: '#fff', 
    borderRadius: '16px', 
    padding: '28px', 
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)', 
    border: '1px solid #f1f5f9' 
  },
  cardHeader: { 
    borderBottom: '2px solid #f1f5f9', 
    paddingBottom: '16px', 
    marginBottom: '20px' 
  },
  cardTitle: { 
    fontSize: '18px', 
    fontWeight: '800', 
    color: '#0f172a', 
    margin: 0 
  },

  // Notices
  noticeList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  noticeItem: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '16px', 
    padding: '12px', 
    borderRadius: '12px', 
    cursor: 'pointer', 
    border: '1px solid transparent',
    transition: 'all 0.2s', 
    backgroundColor: '#f8fafc' 
  },
  noticeDateBox: { 
    backgroundColor: '#eff6ff', 
    border: '1px solid #bfdbfe',
    borderRadius: '10px', 
    padding: '8px', 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center', 
    minWidth: '50px' 
  },
  noticeMonth: { fontSize: '11px', fontWeight: '700', color: '#2563eb', textTransform: 'uppercase' },
  noticeDay: { fontSize: '18px', fontWeight: '800', color: '#1e3a8a', lineHeight: 1 },
  noticeTitle: { fontSize: '15px', fontWeight: '700', color: '#1e293b', margin: '0 0 4px 0' },
  noticePreview: { fontSize: '13px', color: '#64748b', margin: 0 },

  // Reminders
  reminderInputBox: { 
    display: 'flex', 
    gap: '12px', 
    marginBottom: '24px',
    backgroundColor: '#f8fafc',
    padding: '12px',
    borderRadius: '12px',
    border: '1px solid #e2e8f0'
  },
  input: { 
    flex: 1, 
    padding: '12px 16px', 
    borderRadius: '8px', 
    border: '1px solid #cbd5e1', 
    fontSize: '14px', 
    outline: 'none',
    transition: 'border-color 0.2s'
  },
  addBtn: { 
    padding: '12px 20px', 
    backgroundColor: '#0f172a', 
    color: '#fff', 
    border: 'none', 
    borderRadius: '8px', 
    cursor: 'pointer', 
    fontWeight: '700',
    fontSize: '14px',
    transition: 'background-color 0.2s'
  },
  reminderList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  reminderItem: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    border: '1px solid #e2e8f0',
    borderRadius: '10px', 
    padding: '14px 16px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
    transition: 'all 0.2s'
  },
  checkbox: { 
    width: '20px', 
    height: '20px', 
    cursor: 'pointer', 
    accentColor: '#10b981' 
  },

  emptyState: { 
    textAlign: 'center', 
    padding: '40px 20px', 
    backgroundColor: '#f8fafc', 
    borderRadius: '12px', 
    border: '2px dashed #e2e8f0' 
  },
  empty: { color: '#64748b', fontSize: '14px', margin: 0, fontWeight: '500' },

  // Modals
  modalOverlay: { 
    position: 'fixed', inset: 0, 
    backgroundColor: 'rgba(15, 23, 42, 0.6)', 
    backdropFilter: 'blur(6px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', 
    zIndex: 99999, padding: '20px'
  },
  modal: { 
    backgroundColor: '#fff', 
    borderRadius: '20px', 
    padding: '32px', 
    width: '100%', 
    maxWidth: '560px', 
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', 
    display: 'flex', flexDirection: 'column' 
  },
  modalHeader: { 
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', 
    borderBottom: '1px solid #e2e8f0', paddingBottom: '20px', marginBottom: '20px' 
  },
  modalTitle: { fontSize: '22px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px 0', lineHeight: 1.3 },
  modalDate: { fontSize: '13px', color: '#64748b', fontWeight: '600', margin: 0 },
  closeIconBtn: { 
    background: '#f1f5f9', border: 'none', borderRadius: '50%', 
    width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', color: '#475569', fontWeight: '700' 
  },
  modalBodyWrapper: { 
    backgroundColor: '#f8fafc', padding: '24px', borderRadius: '12px', border: '1px solid #f1f5f9',
    maxHeight: '400px', overflowY: 'auto'
  },
  modalBody: { fontSize: '15px', color: '#334155', lineHeight: '1.7', margin: 0, whiteSpace: 'pre-wrap' },
  closeBtn: { 
    padding: '12px 24px', backgroundColor: '#4f46e5', color: '#fff', border: 'none', 
    borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '14px',
    boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.2)'
  },
}