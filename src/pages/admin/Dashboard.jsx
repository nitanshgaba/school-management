import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

export default function Dashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState({ teachers: 0, students: 0, notes: 0, notices: 0 })
  const [notices, setNotices] = useState([])
  const [reminders, setReminders] = useState([])
  const [newReminder, setNewReminder] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async () => {
    setLoading(true)
    await Promise.all([fetchStats(), fetchNotices(), fetchReminders()])
    setLoading(false)
  }

  const fetchStats = async () => {
    const [{ count: teachers }, { count: students }, { count: notes }, { count: notices }] =
      await Promise.all([
        supabase.from('teachers').select('*', { count: 'exact', head: true }),
        supabase.from('students').select('*', { count: 'exact', head: true }),
        supabase.from('notes').select('*', { count: 'exact', head: true }),
        supabase.from('notices').select('*', { count: 'exact', head: true }),
      ])
    setStats({ teachers: teachers || 0, students: students || 0, notes: notes || 0, notices: notices || 0 })
  }

  const fetchNotices = async () => {
    const { data } = await supabase
      .from('notices')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)
    setNotices(data || [])
  }

  const fetchReminders = async () => {
    const { data } = await supabase
      .from('reminders')
      .select('*')
      .eq('admin_id', (await supabase.auth.getUser()).data.user?.id)
      .order('created_at', { ascending: false })
    setReminders(data || [])
  }

  const addReminder = async () => {
    if (!newReminder.trim()) return
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase
      .from('reminders')
      .insert({ message: newReminder.trim(), admin_id: user.id })
      .select()
      .single()
    if (data) {
      setReminders([data, ...reminders])
      setNewReminder('')
    }
  }

  const deleteReminder = async (id) => {
    await supabase.from('reminders').delete().eq('id', id)
    setReminders(reminders.filter(r => r.id !== id))
  }

  const toggleReminder = async (id, current) => {
    await supabase.from('reminders').update({ is_done: !current }).eq('id', id)
    setReminders(reminders.map(r => r.id === id ? { ...r, is_done: !current } : r))
  }

  const importanceColor = (imp) => {
    if (imp === 'green') return '#22c55e'
    if (imp === 'yellow') return '#eab308'
    return '#ef4444'
  }

  const statCards = [
    { label: 'Teachers', value: stats.teachers, icon: '👨‍🏫', color: '#dbeafe', iconBg: '#3b82f6' },
    { label: 'Students', value: stats.students, icon: '👨‍🎓', color: '#fef9c3', iconBg: '#eab308' },
    { label: 'Notes', value: stats.notes, icon: '📝', color: '#dcfce7', iconBg: '#22c55e' },
    { label: 'Notices', value: stats.notices, icon: '📢', color: '#fee2e2', iconBg: '#ef4444' },
  ]

  return (
    <div>
      {/* Page Header */}
      <div style={styles.pageHeader}>
        <h1 style={styles.pageTitle}>Dashboard</h1>
        <p style={styles.pageSubtitle}>Analytics</p>
      </div>

      {/* Stat Cards */}
      <div style={styles.statsGrid}>
        {statCards.map((card) => (
          <div key={card.label} style={{ ...styles.statCard, backgroundColor: card.color }}>
            <div style={{ ...styles.statIcon, backgroundColor: card.iconBg }}>
              {card.icon}
            </div>
            <div>
              <div style={styles.statValue}>{loading ? '...' : card.value}</div>
              <div style={styles.statLabel}>{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Section */}
      <div style={styles.bottomGrid}>

        {/* Latest Notices */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>📋 Latest Notices</h2>
          </div>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Title</th>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Sender</th>
              </tr>
            </thead>
            <tbody>
              {notices.length === 0 ? (
                <tr>
                  <td colSpan={3} style={styles.emptyCell}>No notices yet</td>
                </tr>
              ) : (
                notices.map((n) => (
                  <tr key={n.id}>
                    <td style={styles.td}>
                      <div style={styles.noticeTitle}>
                        <span style={{
                          ...styles.dot,
                          backgroundColor: importanceColor(n.importance)
                        }} />
                        {n.title}
                      </div>
                    </td>
                    <td style={styles.td}>
                      {new Date(n.created_at).toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric'
                      })}
                    </td>
                    <td style={styles.td}>You</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Reminders */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>🔔 Reminders</h2>
            <div style={styles.addReminderRow}>
              <input
                style={styles.reminderInput}
                placeholder="Add a reminder..."
                value={newReminder}
                onChange={(e) => setNewReminder(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addReminder()}
              />
              <button style={styles.addBtn} onClick={addReminder}>+</button>
            </div>
          </div>
          <div style={styles.reminderList}>
            {reminders.length === 0 ? (
              <p style={styles.emptyText}>No reminders yet</p>
            ) : (
              reminders.map((r) => (
                <div key={r.id} style={{
                  ...styles.reminderItem,
                  borderLeft: `4px solid ${r.is_done ? '#22c55e' : '#eab308'}`
                }}>
                  <div style={styles.reminderLeft}>
                    <button
                      style={styles.doneBtn}
                      onClick={() => toggleReminder(r.id, r.is_done)}
                    >
                      {r.is_done ? '✅' : '⭕'}
                    </button>
                    <span style={{
                      ...styles.reminderText,
                      textDecoration: r.is_done ? 'line-through' : 'none',
                      color: r.is_done ? '#9ca3af' : '#374151'
                    }}>
                      {r.message}
                    </span>
                  </div>
                  <button
                    style={styles.deleteBtn}
                    onClick={() => deleteReminder(r.id)}
                  >
                    🗑
                  </button>
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
  pageHeader: {
    marginBottom: '24px',
  },
  pageTitle: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1a1a2e',
    margin: 0,
  },
  pageSubtitle: {
    color: '#6b7280',
    fontSize: '14px',
    marginTop: '4px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
    marginBottom: '24px',
  },
  statCard: {
    borderRadius: '12px',
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  statIcon: {
    width: '52px',
    height: '52px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
  },
  statValue: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1a1a2e',
  },
  statLabel: {
    fontSize: '14px',
    color: '#6b7280',
  },
  bottomGrid: {
    display: 'grid',
    gridTemplateColumns: '1.5fr 1fr',
    gap: '20px',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  },
  cardHeader: {
    marginBottom: '16px',
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: '12px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    textAlign: 'left',
    fontSize: '13px',
    color: '#6b7280',
    fontWeight: '600',
    padding: '8px 12px',
    borderBottom: '1px solid #f3f4f6',
  },
  td: {
    padding: '12px',
    fontSize: '14px',
    color: '#374151',
    borderBottom: '1px solid #f9fafb',
  },
  emptyCell: {
    padding: '24px',
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: '14px',
  },
  noticeTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  dot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  addReminderRow: {
    display: 'flex',
    gap: '8px',
  },
  reminderInput: {
    flex: 1,
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    fontSize: '13px',
    outline: 'none',
  },
  addBtn: {
    padding: '8px 14px',
    backgroundColor: '#4f46e5',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '18px',
    cursor: 'pointer',
    fontWeight: '600',
  },
  reminderList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  reminderItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 12px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
  },
  reminderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  doneBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    padding: 0,
  },
  reminderText: {
    fontSize: '14px',
  },
  deleteBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    color: '#ef4444',
  },
  emptyText: {
    color: '#9ca3af',
    fontSize: '14px',
    textAlign: 'center',
    padding: '20px 0',
  },
}