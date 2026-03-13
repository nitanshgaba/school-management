import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

export default function TeacherDashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState({ students: 0, subjects: 0, leaves: 0 })
  const [notices, setNotices] = useState([])
  const [selectedNotice, setSelectedNotice] = useState(null)
  const [reminders, setReminders] = useState([])
  const [newReminder, setNewReminder] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const { count: subjectCount } = await supabase
      .from('subjects')
      .select('*', { count: 'exact', head: true })
      .eq('teacher_id', profile.id)

    const { count: leaveCount } = await supabase
      .from('teacher_leaves')
      .select('*', { count: 'exact', head: true })
      .eq('teacher_id', profile.id)
      .eq('status', 'pending')

    // Count students from assigned classes in teacher_classes
    const { data: assignedClasses } = await supabase
      .from('teacher_classes')
      .select('class_id, section_id')
      .eq('teacher_id', profile.id)

    let studentCount = 0
    if (assignedClasses && assignedClasses.length > 0) {
      // If section_id is set, count by section; else count by class
      const sectionIds = assignedClasses.filter(a => a.section_id).map(a => a.section_id)
      const classIdsOnly = assignedClasses.filter(a => !a.section_id).map(a => a.class_id)

      let total = 0
      if (sectionIds.length > 0) {
        const { count } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true })
          .in('section_id', sectionIds)
        total += count || 0
      }
      if (classIdsOnly.length > 0) {
        const { count } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true })
          .in('class_id', classIdsOnly)
        total += count || 0
      }
      studentCount = total
    }

    setStats({ students: studentCount, subjects: subjectCount || 0, leaves: leaveCount || 0 })

    const { data: noticeData } = await supabase
      .from('notices')
      .select('*')
      .in('target', ['all', 'teachers'])
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
    await supabase.from('reminders').delete().eq('id', id)
    setReminders(reminders.filter(r => r.id !== id))
  }

  if (loading) return <div style={styles.loading}>Loading...</div>

  return (
    <div>


      <h1 style={styles.title}>Welcome, {profile?.name} 👋</h1>
      <p style={styles.subtitle}>Here's what's happening today</p>

      {/* Stats */}
      <div style={styles.statsGrid}>
        {[
          { label: 'My Students', value: stats.students, icon: '👨‍🎓', color: '#dcfce7', text: '#16a34a' },
          { label: 'My Subjects', value: stats.subjects, icon: '📚', color: '#dbeafe', text: '#1d4ed8' },
          { label: 'Pending Leaves', value: stats.leaves, icon: '🏖️', color: '#fef9c3', text: '#ca8a04' },
        ].map(stat => (
          <div key={stat.label} style={styles.statCard}>
            <div style={{ ...styles.statIcon, backgroundColor: stat.color }}>
              <span style={{ fontSize: '28px' }}>{stat.icon}</span>
            </div>
            <div>
              <p style={styles.statValue}>{stat.value}</p>
              <p style={styles.statLabel}>{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={styles.grid}>
        {/* Notices */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>📢 Latest Notices</h2>
          {notices.length === 0 ? (
            <p style={styles.empty}>No notices yet</p>
          ) : (
            notices.map(n => (
              <div key={n.id} style={{...styles.noticeItem, cursor: 'pointer'}} onClick={() => setSelectedNotice(n)}>
                <p style={styles.noticeTitle}>{n.title}</p>
                <p style={styles.noticeDate}>{new Date(n.created_at).toLocaleDateString('en-IN')}</p>
              </div>
            ))
          )}
        </div>

        {/* Reminders */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>⏰ My Reminders</h2>
          <div style={styles.reminderInput}>
            <input
              style={styles.input}
              placeholder="Add reminder..."
              value={newReminder}
              onChange={e => setNewReminder(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addReminder()}
            />
            <button style={styles.addBtn} onClick={addReminder}>Add</button>
          </div>
          <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {reminders.length === 0 ? (
              <p style={styles.empty}>No reminders yet</p>
            ) : (
              reminders.map(r => (
                <div key={r.id} style={styles.reminderItem}>
                  <span style={{ fontSize: '14px', color: '#374151' }}>{r.message}</span>
                  <button style={styles.deleteBtn} onClick={() => deleteReminder(r.id)}>🗑</button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      {selectedNotice && (
        <div style={styles.modalOverlay} onClick={() => setSelectedNotice(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <h2 style={styles.modalTitle}>{selectedNotice.title}</h2>
              <button style={styles.closeBtn} onClick={() => setSelectedNotice(null)}>✕</button>
            </div>
            <p style={styles.modalDate}>
              📅 {new Date(selectedNotice.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
              {selectedNotice.target && <span style={{ marginLeft: '12px', backgroundColor: '#ede9fe', color: '#4f46e5', padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>For: {selectedNotice.target}</span>}
            </p>
            <div style={styles.modalBody}>
              {selectedNotice.message || selectedNotice.body || selectedNotice.content || selectedNotice.description || 'No details available.'}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  loading: { textAlign: 'center', padding: '40px', color: '#9ca3af' },
  title: { fontSize: '24px', fontWeight: '700', color: '#1a1a2e', margin: 0 },
  subtitle: { color: '#6b7280', marginTop: '4px', marginBottom: '24px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' },
  statCard: { backgroundColor: '#fff', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  statIcon: { width: '56px', height: '56px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: '28px', fontWeight: '800', color: '#1a1a2e', margin: 0 },
  statLabel: { fontSize: '13px', color: '#6b7280', margin: 0 },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
  card: { backgroundColor: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  cardTitle: { fontSize: '16px', fontWeight: '700', color: '#1a1a2e', marginBottom: '16px' },
  empty: { color: '#9ca3af', fontSize: '14px' },
  noticeItem: { padding: '10px 0', borderBottom: '1px solid #f3f4f6' },
  noticeTitle: { fontSize: '14px', fontWeight: '600', color: '#374151', margin: 0 },
  noticeDate: { fontSize: '12px', color: '#9ca3af', margin: '2px 0 0' },
  reminderInput: { display: 'flex', gap: '8px' },
  input: { flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', outline: 'none' },
  addBtn: { padding: '8px 16px', backgroundColor: '#22c55e', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
  reminderItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9fafb', borderRadius: '8px', padding: '10px 12px' },
  deleteBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' },
  modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { backgroundColor: '#fff', borderRadius: '16px', padding: '28px', width: '520px', maxWidth: '90vw', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' },
  modalTitle: { fontSize: '20px', fontWeight: '700', color: '#1a1a2e', margin: 0 },
  modalDate: { fontSize: '13px', color: '#9ca3af', margin: '6px 0 16px', display: 'flex', alignItems: 'center', gap: '4px' },
  modalBody: { fontSize: '15px', color: '#374151', lineHeight: '1.75', backgroundColor: '#f9fafb', padding: '16px', borderRadius: '10px', whiteSpace: 'pre-wrap' },
  closeBtn: { background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#9ca3af', lineHeight: 1 },
}
