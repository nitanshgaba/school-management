import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

export default function StudentAttendance() {
  const { profile } = useAuth()
  const [attendance, setAttendance] = useState([])
  const [stats, setStats] = useState({ present: 0, absent: 0, late: 0, total: 0 })
  const [loading, setLoading] = useState(true)
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7))

  // Wrap fetch in useCallback to keep the dependency stable
  const fetchAttendance = useCallback(async () => {
    if (!profile?.id) return
    
    setLoading(true)
    const year = new Date(month).getFullYear()
    const mon = new Date(month).getMonth()
    const from = `${month}-01`
    const lastDay = new Date(year, mon + 1, 0).getDate()
    const to = `${month}-${lastDay}`
    
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('student_id', profile.id)
      .gte('date', from)
      .lte('date', to)
      .order('date', { ascending: false })
      
    if (error) {
      console.error("Attendance Fetch Error:", error.message)
      setLoading(false)
      return
    }

    const list = data || []
    setAttendance(list)
    setStats({
      present: list.filter(a => a.status === 'present').length,
      absent: list.filter(a => a.status === 'absent').length,
      late: list.filter(a => a.status === 'late').length,
      total: list.length,
    })
    setLoading(false)
  }, [month, profile?.id]) // Depend only on the ID string, not the whole object

  useEffect(() => {
    fetchAttendance()
  }, [fetchAttendance])

  const getStatusStyle = (status) => {
    switch (status) {
      case 'present': return { backgroundColor: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' };
      case 'absent': return { backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' };
      case 'late': return { backgroundColor: '#fffbeb', color: '#d97706', border: '1px solid #fde68a' };
      default: return { backgroundColor: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0' };
    }
  }

  const percent = stats.total > 0 ? Math.round(((stats.present + stats.late) / stats.total) * 100) : 0

  return (
    <div style={styles.container}>
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Attendance Insights</h1>
          <p style={styles.pageSubtitle}>View your academic presence and consistency metrics</p>
        </div>
      </div>

      <div style={styles.statsGrid}>
        {[
          { label: 'Present', value: stats.present, color: '#16a34a', icon: '✅' },
          { label: 'Absent', value: stats.absent, color: '#dc2626', icon: '❌' },
          { label: 'Late', value: stats.late, color: '#d97706', icon: '⏰' },
        ].map(s => (
          <div key={s.label} style={styles.statCard}>
            <p style={styles.statLabel}>{s.label}</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <h2 style={{ ...styles.statValue, color: s.color }}>{s.value}</h2>
              <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600' }}>Days</span>
            </div>
            <div style={{ ...styles.indicator, backgroundColor: s.color }} />
          </div>
        ))}
        
        <div style={{ ...styles.statCard, backgroundColor: '#eff6ff', border: '1px solid #dbeafe' }}>
          <p style={{ ...styles.statLabel, color: '#1d4ed8' }}>Overall Focus</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ ...styles.statValue, color: '#1e40af' }}>{percent}%</h2>
            {percent < 75 && percent > 0 && <span style={styles.warningBadge}>Low Consistency</span>}
          </div>
          <div style={styles.progressTrack}>
            <div style={{ ...styles.progressFill, width: `${percent}%` }} />
          </div>
        </div>
      </div>

      <div style={styles.mainContent}>
        <div style={styles.tableHeaderSection}>
          <h2 style={styles.sectionTitle}>📋 Monthly Attendance Logs</h2>
          <div style={styles.monthSelector}>
            <input style={styles.monthInput} type="month" value={month} onChange={e => setMonth(e.target.value)} />
          </div>
        </div>

        {loading ? (
          <div style={styles.loadingBox}>⌛ Syncing...</div>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={{ ...styles.th, textAlign: 'center', width: '50px' }}>#</th>
                  <th style={styles.th}>Date & Day</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map((a, i) => (
                  <tr key={a.id} style={styles.tr}>
                    <td style={styles.tdCenter}>{i + 1}</td>
                    <td style={styles.td}>
                      <div style={styles.dateCell}>
                        <span style={styles.dateText}>{new Date(a.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                        <span style={styles.dayText}>{new Date(a.date).toLocaleDateString('en-IN', { weekday: 'long' })}</span>
                      </div>
                    </td>
                    <td style={{ ...styles.td, textAlign: 'right' }}>
                      <span style={{ ...styles.statusPill, ...getStatusStyle(a.status) }}>
                        {a.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {attendance.length === 0 && <div style={styles.empty}>No records found.</div>}
          </div>
        )}
      </div>
    </div>
  )
}

const styles = {
  container: { maxWidth: '1100px', margin: '0 auto', padding: '32px', fontFamily: 'Inter, sans-serif' },
  pageHeader: { marginBottom: '40px' },
  pageTitle: { fontSize: '32px', fontWeight: '900', color: '#0f172a', margin: 0 },
  pageSubtitle: { fontSize: '15px', color: '#64748b' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '40px' },
  statCard: { backgroundColor: '#fff', borderRadius: '24px', padding: '24px', border: '1px solid #f1f5f9', position: 'relative', overflow: 'hidden' },
  statLabel: { fontSize: '12px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' },
  statValue: { fontSize: '32px', fontWeight: '900', margin: 0 },
  indicator: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '4px' },
  progressTrack: { height: '6px', backgroundColor: '#dbeafe', borderRadius: '10px', marginTop: '12px' },
  progressFill: { height: '100%', backgroundColor: '#2563eb', borderRadius: '10px' },
  warningBadge: { backgroundColor: '#fee2e2', color: '#dc2626', padding: '4px 10px', borderRadius: '12px', fontSize: '10px', fontWeight: '800' },
  mainContent: { backgroundColor: '#fff', borderRadius: '32px', padding: '32px', border: '1px solid #f1f5f9' },
  tableHeaderSection: { display: 'flex', justifyContent: 'space-between', marginBottom: '24px' },
  sectionTitle: { fontSize: '18px', fontWeight: '800' },
  monthSelector: { backgroundColor: '#f8fafc', padding: '8px 12px', borderRadius: '12px', border: '1px solid #e2e8f0' },
  monthInput: { border: 'none', background: 'transparent', fontWeight: '700', outline: 'none' },
  tableWrapper: { borderRadius: '16px', border: '1px solid #f1f5f9', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', padding: '16px 20px', backgroundColor: '#fcfcfd' },
  tr: { borderBottom: '1px solid #f8fafc' },
  td: { padding: '16px 20px' },
  tdCenter: { textAlign: 'center', color: '#cbd5e1', fontWeight: '700' },
  dateCell: { display: 'flex', flexDirection: 'column' },
  dateText: { fontSize: '15px', fontWeight: '800' },
  dayText: { fontSize: '12px', color: '#94a3b8' },
  statusPill: { padding: '4px 12px', borderRadius: '10px', fontSize: '11px', fontWeight: '800' },
  loadingBox: { textAlign: 'center', padding: '50px', color: '#64748b' },
  empty: { textAlign: 'center', padding: '30px', color: '#94a3b8', fontSize: '14px' }
}