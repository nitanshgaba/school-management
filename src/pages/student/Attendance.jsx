import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

export default function StudentAttendance() {
  const { profile } = useAuth()
  const [attendance, setAttendance] = useState([])
  const [stats, setStats] = useState({ present: 0, absent: 0, late: 0, total: 0 })
  const [loading, setLoading] = useState(true)
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7))

  useEffect(() => { fetchAttendance() }, [month])

  const fetchAttendance = async () => {
    setLoading(true)
    const from = month + '-01'
    const to = month + '-31'
    const { data } = await supabase
      .from('attendance')
      .select('*')
      .eq('student_id', profile.id)
      .gte('date', from)
      .lte('date', to)
      .order('date', { ascending: false })
    const list = data || []
    setAttendance(list)
    setStats({
      present: list.filter(a => a.status === 'present').length,
      absent: list.filter(a => a.status === 'absent').length,
      late: list.filter(a => a.status === 'late').length,
      total: list.length,
    })
    setLoading(false)
  }

  const getStatusStyle = (status) => {
    if (status === 'present') return { backgroundColor: '#dcfce7', color: '#16a34a' }
    if (status === 'absent') return { backgroundColor: '#fee2e2', color: '#dc2626' }
    return { backgroundColor: '#fef9c3', color: '#ca8a04' }
  }

  const percent = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0

  return (
    <div>
      <h1 style={styles.title}>My Attendance</h1>

      <div style={styles.statsGrid}>
        {[
          { label: 'Present', value: stats.present, color: '#dcfce7', text: '#16a34a', icon: '✅' },
          { label: 'Absent', value: stats.absent, color: '#fee2e2', text: '#dc2626', icon: '❌' },
          { label: 'Late', value: stats.late, color: '#fef9c3', text: '#ca8a04', icon: '⏰' },
          { label: 'Attendance %', value: percent + '%', color: '#dbeafe', text: '#1d4ed8', icon: '📊' },
        ].map(s => (
          <div key={s.label} style={styles.statCard}>
            <div style={{ ...styles.statIcon, backgroundColor: s.color }}>
              <span style={{ fontSize: '24px' }}>{s.icon}</span>
            </div>
            <div>
              <p style={{ ...styles.statValue, color: s.text }}>{s.value}</p>
              <p style={styles.statLabel}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h2 style={styles.cardTitle}>Attendance Record</h2>
          <input style={styles.monthInput} type="month" value={month} onChange={e => setMonth(e.target.value)} />
        </div>

        {loading ? <p style={styles.empty}>Loading...</p> :
          attendance.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={{ fontSize: '48px' }}>📅</div>
              <p style={{ color: '#9ca3af', marginTop: '8px' }}>No attendance records for this month</p>
            </div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>#</th>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Day</th>
                  <th style={styles.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map((a, i) => (
                  <tr key={a.id}>
                    <td style={styles.td}>{i + 1}</td>
                    <td style={styles.td}>{new Date(a.date).toLocaleDateString('en-IN')}</td>
                    <td style={styles.td}>{new Date(a.date).toLocaleDateString('en-IN', { weekday: 'long' })}</td>
                    <td style={styles.td}>
                      <span style={{ ...styles.badge, ...getStatusStyle(a.status) }}>
                        {a.status?.charAt(0).toUpperCase() + a.status?.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        }
      </div>
    </div>
  )
}

const styles = {
  title: { fontSize: '24px', fontWeight: '700', color: '#1a1a2e', marginBottom: '24px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' },
  statCard: { backgroundColor: '#fff', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  statIcon: { width: '48px', height: '48px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: '24px', fontWeight: '800', margin: 0 },
  statLabel: { fontSize: '12px', color: '#6b7280', margin: 0 },
  card: { backgroundColor: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  cardTitle: { fontSize: '16px', fontWeight: '700', color: '#1a1a2e', margin: 0 },
  monthInput: { padding: '8px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', outline: 'none' },
  empty: { color: '#9ca3af', fontSize: '14px' },
  emptyState: { textAlign: 'center', padding: '40px 0' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', fontSize: '13px', color: '#6b7280', fontWeight: '600', padding: '10px 12px', borderBottom: '2px solid #f3f4f6' },
  td: { padding: '12px', fontSize: '14px', color: '#374151', borderBottom: '1px solid #f9fafb' },
  badge: { padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' },
}
