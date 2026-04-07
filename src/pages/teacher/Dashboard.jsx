import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function TeacherDashboard() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState({ students: 0, subjects: 0, leaves: 0, attendanceRate: 0 })
  const [notices, setNotices] = useState([])
  const [selectedNotice, setSelectedNotice] = useState(null)
  const [reminders, setReminders] = useState([])
  const [newReminder, setNewReminder] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (profile?.id) fetchData() }, [profile])

  const fetchData = async () => {
    // 1. Fetch Subjects Count
    const { count: subjectCount } = await supabase
      .from('subjects')
      .select('*', { count: 'exact', head: true })
      .eq('teacher_id', profile.id)

    // 2. Fetch Pending Leaves
    const { count: leaveCount } = await supabase
      .from('teacher_leaves')
      .select('*', { count: 'exact', head: true })
      .eq('teacher_id', profile.id)
      .eq('status', 'pending')

    // 3. Count students from assigned classes
    const { data: assignedClasses } = await supabase
      .from('teacher_classes')
      .select('class_id, section_id')
      .eq('teacher_id', profile.id)

    let studentCount = 0
    let studentIds = []

    if (assignedClasses && assignedClasses.length > 0) {
      const sectionIds = assignedClasses.filter(a => a.section_id).map(a => a.section_id)
      const classIdsOnly = assignedClasses.filter(a => !a.class_id).map(a => a.class_id)

      const { data: stData } = await supabase
        .from('students')
        .select('id')
        .or(`section_id.in.(${sectionIds.length ? sectionIds.join(',') : '0'}),class_id.in.(${classIdsOnly.length ? classIdsOnly.join(',') : '0'})`)
      
      studentCount = stData?.length || 0
      studentIds = stData?.map(s => s.id) || []
    }

    // 4. Calculate Attendance Rate
    let attendanceRate = 0
    if (studentIds.length > 0) {
      const { data: attData } = await supabase.from('attendance').select('status').in('student_id', studentIds)
      if (attData?.length > 0) {
        const presentCount = attData.filter(a => a.status === 'present').length
        attendanceRate = Math.round((presentCount / attData.length) * 100)
      }
    }

    setStats({ students: studentCount, subjects: subjectCount || 0, leaves: leaveCount || 0, attendanceRate: attendanceRate || 0 })

    // 5. Notices & Reminders (FIXED COLUMN NAME TO admin_id)
    const { data: noticeData } = await supabase
      .from('notices')
      .select('*')
      .in('target', ['all', 'teachers'])
      .order('created_at', { ascending: false }).limit(5)
    setNotices(noticeData || [])

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
    
    // Create the task object (FIXED COLUMN NAME TO admin_id)
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
      alert("Error adding reminder: " + error.message)
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

  if (loading) return <div style={styles.loadingBox}>⌛ Syncing Dashboard...</div>

  return (
    <div style={styles.container}>
      <div style={styles.headerSection}>
        <div>
          <h1 style={styles.title}>Welcome, {profile?.name?.split(' ')[0]} 👋</h1>
          <p style={styles.subtitle}>Track class performance and manage your schedule.</p>
        </div>
        <button style={styles.primaryActionBtn} onClick={() => navigate('/teacher/attendance')}>
          ✅ Mark Attendance
        </button>
      </div>

      <div style={styles.statsGrid}>
        {[
          { label: 'Total Students', value: stats.students, icon: '👨‍🎓', color: '#16a34a', bg: '#f0fdf4' },
          { label: 'Active Subjects', value: stats.subjects, icon: '📚', color: '#2563eb', bg: '#eff6ff' },
          { label: 'Avg Attendance', value: `${stats.attendanceRate}%`, icon: '📈', color: '#d97706', bg: '#fffbeb' },
          { label: 'Leave Requests', value: stats.leaves, icon: '🏖️', color: '#dc2626', bg: '#fef2f2' },
        ].map(stat => (
          <div key={stat.label} style={{ ...styles.statCard, borderBottom: `4px solid ${stat.color}`, backgroundColor: stat.bg }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ ...styles.statLabel, color: stat.color }}>{stat.label}</p>
                <p style={styles.statValue}>{stat.value}</p>
              </div>
              <span style={{ fontSize: '32px' }}>{stat.icon}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={styles.mainGrid}>
        <div style={styles.leftCol}>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>🚀 Quick Actions</h2>
            <div style={styles.actionBento}>
              <div style={{...styles.bentoItem, background: '#f5f3ff'}} onClick={() => navigate('/teacher/marks')}>🏆 Add Marks</div>
              <div style={{...styles.bentoItem, background: '#fdf2f8'}} onClick={() => navigate('/teacher/announcements')}>📢 Announce</div>
              <div style={{...styles.bentoItem, background: '#f0f9ff'}} onClick={() => navigate('/teacher/notes')}>📝 Upload Notes</div>
              <div style={{...styles.bentoItem, background: '#f0fdf4'}} onClick={() => navigate('/teacher/leave')}>🗓️ Request Leave</div>
            </div>
          </div>

          <div style={{...styles.card, marginTop: '24px'}}>
             <h2 style={styles.cardTitle}>📊 Attendance Trend</h2>
             <div style={styles.attendanceBarContainer}>
                <div style={{...styles.attendanceBarFill, width: `${stats.attendanceRate}%`}}></div>
             </div>
             <p style={{fontSize: '13px', color: '#64748b', marginTop: '12px'}}>Your class attendance is currently at <strong>{stats.attendanceRate}%</strong>.</p>
          </div>
        </div>

        <div style={styles.rightCol}>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>📢 Notices</h2>
            <div style={styles.noticeList}>
              {notices.map(n => (
                <div key={n.id} style={styles.noticeItem} onClick={() => setSelectedNotice(n)}>
                  <div style={styles.noticeDot}></div>
                  <div style={{flex: 1}}>
                    <p style={styles.noticeTitle}>{n.title}</p>
                    <p style={styles.noticeDate}>{new Date(n.created_at).toLocaleDateString('en-IN', {day:'numeric', month:'short'})}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{...styles.card, marginTop: '24px'}}>
            <h2 style={styles.cardTitle}>⏰ Tasks</h2>
            <div style={styles.reminderInputBox}>
              <input style={styles.input} placeholder="New task..." value={newReminder} onChange={e => setNewReminder(e.target.value)} onKeyDown={e => e.key === 'Enter' && addReminder()} />
              <button style={styles.addBtn} onClick={addReminder}>Add</button>
            </div>
            <div style={styles.reminderList}>
              {reminders.map(r => (
                <div key={r.id} style={styles.reminderItem}>
                  <input type="checkbox" onChange={() => deleteReminder(r.id)} style={styles.checkbox} />
                  <span style={styles.reminderText}>{r.message}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {selectedNotice && (
        <div style={styles.modalOverlay} onClick={() => setSelectedNotice(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>{selectedNotice.title}</h2>
              <button style={styles.modalClose} onClick={() => setSelectedNotice(null)}>✕</button>
            </div>
            <div style={styles.modalBody}>{selectedNotice.body}</div>
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  container: { maxWidth: '1200px', margin: '0 auto', padding: '20px', fontFamily: 'Inter, sans-serif' },
  loadingBox: { textAlign: 'center', padding: '100px', color: '#64748b', fontSize: '18px', fontWeight: '600' },
  headerSection: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '20px' },
  title: { fontSize: '32px', fontWeight: '800', color: '#0f172a', margin: 0, letterSpacing: '-1px' },
  subtitle: { color: '#64748b', fontSize: '16px', marginTop: '4px' },
  primaryActionBtn: { padding: '12px 24px', backgroundColor: '#4f46e5', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' },
  statCard: { borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
  statLabel: { fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px' },
  statValue: { fontSize: '32px', fontWeight: '900', color: '#0f172a', margin: 0 },
  mainGrid: { display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px' },
  card: { backgroundColor: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' },
  cardTitle: { fontSize: '18px', fontWeight: '800', color: '#1e293b', marginBottom: '20px' },
  actionBento: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  bentoItem: { padding: '20px', borderRadius: '12px', textAlign: 'center', cursor: 'pointer', fontSize: '13px', fontWeight: '700', color: '#475569', border: '1px solid rgba(0,0,0,0.03)' },
  attendanceBarContainer: { height: '12px', backgroundColor: '#f1f5f9', borderRadius: '6px', overflow: 'hidden', marginTop: '20px' },
  attendanceBarFill: { height: '100%', backgroundColor: '#10b981', borderRadius: '6px', transition: 'width 1s ease-out' },
  noticeList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  noticeItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '10px', backgroundColor: '#f8fafc', cursor: 'pointer' },
  noticeDot: { width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#4f46e5' },
  noticeTitle: { fontSize: '14px', fontWeight: '700', color: '#334155', margin: 0 },
  noticeDate: { fontSize: '12px', color: '#94a3b8', margin: 0 },
  reminderInputBox: { display: 'flex', gap: '8px', marginBottom: '16px' },
  input: { flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '14px' },
  addBtn: { padding: '10px 16px', backgroundColor: '#0f172a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' },
  reminderList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  reminderItem: { display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px' },
  checkbox: { width: '16px', height: '16px', cursor: 'pointer', accentColor: '#4f46e5' },
  reminderText: { fontSize: '14px', color: '#475569', fontWeight: '500' },
  modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { backgroundColor: '#fff', borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '500px' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  modalTitle: { fontSize: '22px', fontWeight: '800', color: '#0f172a', margin: 0 },
  modalClose: { background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#94a3b8' },
  modalBody: { fontSize: '15px', color: '#334155', lineHeight: '1.7', backgroundColor: '#f8fafc', padding: '20px', borderRadius: '12px' },
}