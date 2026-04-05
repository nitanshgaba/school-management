// import { useState, useEffect } from 'react'
// import { supabase } from '../../lib/supabase'
// import { useAuth } from '../../context/AuthContext'

// export default function StudentAttendance() {
//   const { profile } = useAuth()
//   const [attendance, setAttendance] = useState([])
//   const [stats, setStats] = useState({ present: 0, absent: 0, late: 0, total: 0 })
//   const [loading, setLoading] = useState(true)
//   const [month, setMonth] = useState(new Date().toISOString().slice(0, 7))

//   useEffect(() => { fetchAttendance() }, [month])

//   const fetchAttendance = async () => {
//     setLoading(true)
//     const from = month + '-01'
//     const to = month + '-31'
//     const { data } = await supabase
//       .from('attendance')
//       .select('*')
//       .eq('student_id', profile.id)
//       .gte('date', from)
//       .lte('date', to)
//       .order('date', { ascending: false })
//     const list = data || []
//     setAttendance(list)
//     setStats({
//       present: list.filter(a => a.status === 'present').length,
//       absent: list.filter(a => a.status === 'absent').length,
//       late: list.filter(a => a.status === 'late').length,
//       total: list.length,
//     })
//     setLoading(false)
//   }

//   const getStatusStyle = (status) => {
//     if (status === 'present') return { backgroundColor: '#dcfce7', color: '#16a34a' }
//     if (status === 'absent') return { backgroundColor: '#fee2e2', color: '#dc2626' }
//     return { backgroundColor: '#fef9c3', color: '#ca8a04' }
//   }

//   const percent = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0

//   return (
//     <div>
//       <h1 style={styles.title}>My Attendance</h1>

//       <div style={styles.statsGrid}>
//         {[
//           { label: 'Present', value: stats.present, color: '#dcfce7', text: '#16a34a', icon: '✅' },
//           { label: 'Absent', value: stats.absent, color: '#fee2e2', text: '#dc2626', icon: '❌' },
//           { label: 'Late', value: stats.late, color: '#fef9c3', text: '#ca8a04', icon: '⏰' },
//           { label: 'Attendance %', value: percent + '%', color: '#dbeafe', text: '#1d4ed8', icon: '📊' },
//         ].map(s => (
//           <div key={s.label} style={styles.statCard}>
//             <div style={{ ...styles.statIcon, backgroundColor: s.color }}>
//               <span style={{ fontSize: '24px' }}>{s.icon}</span>
//             </div>
//             <div>
//               <p style={{ ...styles.statValue, color: s.text }}>{s.value}</p>
//               <p style={styles.statLabel}>{s.label}</p>
//             </div>
//           </div>
//         ))}
//       </div>

//       <div style={styles.card}>
//         <div style={styles.cardHeader}>
//           <h2 style={styles.cardTitle}>Attendance Record</h2>
//           <input style={styles.monthInput} type="month" value={month} onChange={e => setMonth(e.target.value)} />
//         </div>

//         {loading ? <p style={styles.empty}>Loading...</p> :
//           attendance.length === 0 ? (
//             <div style={styles.emptyState}>
//               <div style={{ fontSize: '48px' }}>📅</div>
//               <p style={{ color: '#9ca3af', marginTop: '8px' }}>No attendance records for this month</p>
//             </div>
//           ) : (
//             <table style={styles.table}>
//               <thead>
//                 <tr>
//                   <th style={styles.th}>#</th>
//                   <th style={styles.th}>Date</th>
//                   <th style={styles.th}>Day</th>
//                   <th style={styles.th}>Status</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {attendance.map((a, i) => (
//                   <tr key={a.id}>
//                     <td style={styles.td}>{i + 1}</td>
//                     <td style={styles.td}>{new Date(a.date).toLocaleDateString('en-IN')}</td>
//                     <td style={styles.td}>{new Date(a.date).toLocaleDateString('en-IN', { weekday: 'long' })}</td>
//                     <td style={styles.td}>
//                       <span style={{ ...styles.badge, ...getStatusStyle(a.status) }}>
//                         {a.status?.charAt(0).toUpperCase() + a.status?.slice(1)}
//                       </span>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           )
//         }
//       </div>
//     </div>
//   )
// }

// const styles = {
//   title: { fontSize: '24px', fontWeight: '700', color: '#1a1a2e', marginBottom: '24px' },
//   statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' },
//   statCard: { backgroundColor: '#fff', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
//   statIcon: { width: '48px', height: '48px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
//   statValue: { fontSize: '24px', fontWeight: '800', margin: 0 },
//   statLabel: { fontSize: '12px', color: '#6b7280', margin: 0 },
//   card: { backgroundColor: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
//   cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
//   cardTitle: { fontSize: '16px', fontWeight: '700', color: '#1a1a2e', margin: 0 },
//   monthInput: { padding: '8px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', outline: 'none' },
//   empty: { color: '#9ca3af', fontSize: '14px' },
//   emptyState: { textAlign: 'center', padding: '40px 0' },
//   table: { width: '100%', borderCollapse: 'collapse' },
//   th: { textAlign: 'left', fontSize: '13px', color: '#6b7280', fontWeight: '600', padding: '10px 12px', borderBottom: '2px solid #f3f4f6' },
//   td: { padding: '12px', fontSize: '14px', color: '#374151', borderBottom: '1px solid #f9fafb' },
//   badge: { padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' },
// }


import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

export default function StudentAttendance() {
  const { profile } = useAuth()
  const [attendance, setAttendance] = useState([])
  const [stats, setStats] = useState({ present: 0, absent: 0, late: 0, total: 0 })
  const [loading, setLoading] = useState(true)
  
  // Format current month for input default (YYYY-MM)
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7))

  useEffect(() => { fetchAttendance() }, [month])

  const fetchAttendance = async () => {
    setLoading(true)
    const from = month + '-01'
    const to = month + '-31' // Supabase handles this gracefully for months with < 31 days
    
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
    if (status === 'present') return { backgroundColor: '#dcfce7', color: '#16a34a', border: '1px solid #bbf7d0' }
    if (status === 'absent') return { backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca' }
    if (status === 'late') return { backgroundColor: '#fef3c7', color: '#d97706', border: '1px solid #fde68a' }
    return { backgroundColor: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0' }
  }

  const getStatusIcon = (status) => {
    if (status === 'present') return '✅'
    if (status === 'absent') return '❌'
    if (status === 'late') return '⏰'
    return '➖'
  }

  const percent = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0

  return (
    <div style={styles.container}>
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>My Attendance Record</h1>
          <p style={styles.pageSubtitle}>Track your daily presence and attendance percentage</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={styles.statsGrid}>
        {[
          { label: 'Days Present', value: stats.present, color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', icon: '✅' },
          { label: 'Days Absent', value: stats.absent, color: '#dc2626', bg: '#fef2f2', border: '#fecaca', icon: '❌' },
          { label: 'Days Late', value: stats.late, color: '#d97706', bg: '#fffbeb', border: '#fde68a', icon: '⏰' },
        ].map(s => (
          <div key={s.label} style={styles.statCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={styles.statLabel}>{s.label}</p>
                <p style={{ ...styles.statValue, color: s.color }}>{s.value}</p>
              </div>
              <div style={{ ...styles.statIconBox, backgroundColor: s.bg, border: `1px solid ${s.border}` }}>
                {s.icon}
              </div>
            </div>
          </div>
        ))}
        
        {/* Highlighted Percentage Card */}
        <div style={{ ...styles.statCard, backgroundColor: '#eff6ff', border: '1px solid #bfdbfe' }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ ...styles.statLabel, color: '#2563eb' }}>Overall Attendance</p>
                <p style={{ ...styles.statValue, color: '#1d4ed8' }}>{percent}%</p>
                {percent > 0 && percent < 75 && (
                  <div style={{ marginTop: '8px', display: 'inline-block', backgroundColor: '#fef2f2', color: '#dc2626', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '700', border: '1px solid #fecaca' }}>
                    ⚠️ Below 75% Target
                  </div>
                )}
              </div>
              <div style={{ ...styles.statIconBox, backgroundColor: '#fff', border: '1px solid #bfdbfe', color: '#2563eb', fontSize: '20px' }}>
                📊
              </div>
            </div>
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h2 style={styles.sectionTitle}>📅 Monthly Records</h2>
        </div>

        {/* Filter Bar */}
        <div style={styles.filterBox}>
          <div style={styles.filterRow}>
            <div style={styles.filterGroup}>
              <label style={styles.label}>Select Month to View</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input 
                  style={styles.input} 
                  type="month" 
                  value={month} 
                  onChange={e => setMonth(e.target.value)} 
                />
                <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>
                  Showing records for {new Date(month + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Table Area */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>⏳ Fetching attendance records...</div>
        ) : attendance.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyStateIcon}>🗓️</div>
            <h3 style={{ color: '#374151', margin: '0 0 8px 0' }}>No Records Found</h3>
            <p style={{ color: '#6b7280', margin: 0, fontSize: '14px' }}>There is no attendance data recorded for this month.</p>
          </div>
        ) : (
          <div style={styles.fadeIn}>
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={{ ...styles.th, width: '60px', textAlign: 'center' }}>#</th>
                    <th style={styles.th}>Date</th>
                    <th style={styles.th}>Day of Week</th>
                    <th style={{ ...styles.th, textAlign: 'right', paddingRight: '24px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.map((a, i) => (
                    <tr key={a.id} style={styles.tr}>
                      <td style={{ ...styles.td, textAlign: 'center', color: '#64748b', fontWeight: '500' }}>{i + 1}</td>
                      <td style={{ ...styles.td, fontWeight: '600', color: '#1e293b' }}>
                        {new Date(a.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td style={{ ...styles.td, color: '#475569' }}>
                        {new Date(a.date).toLocaleDateString('en-IN', { weekday: 'long' })}
                      </td>
                      <td style={{ ...styles.td, textAlign: 'right', paddingRight: '20px' }}>
                        <span style={{ ...styles.badge, ...getStatusStyle(a.status) }}>
                          <span style={{ marginRight: '4px' }}>{getStatusIcon(a.status)}</span>
                          {a.status?.charAt(0).toUpperCase() + a.status?.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
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
  container: { maxWidth: '1100px', margin: '0 auto', padding: '20px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' },
  pageHeader: { marginBottom: '32px' },
  pageTitle: { fontSize: '32px', fontWeight: '800', color: '#111827', margin: '0 0 8px 0', letterSpacing: '-0.5px' },
  pageSubtitle: { fontSize: '15px', color: '#6b7280', margin: 0 },
  
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '32px' },
  statCard: { backgroundColor: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9', transition: 'transform 0.2s', ':hover': { transform: 'translateY(-2px)' } },
  statLabel: { margin: '0 0 8px 0', fontSize: '13px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' },
  statValue: { margin: 0, fontSize: '36px', fontWeight: '800', lineHeight: 1 },
  statIconBox: { width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' },
  
  card: { backgroundColor: '#fff', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)', border: '1px solid #f3f4f6' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  sectionTitle: { fontSize: '18px', fontWeight: '700', color: '#1f2937', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' },
  
  filterBox: { backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', marginBottom: '24px' },
  filterRow: { display: 'flex', gap: '20px', alignItems: 'flex-end', flexWrap: 'wrap' },
  filterGroup: { display: 'flex', flexDirection: 'column', gap: '8px', flex: '1', minWidth: '200px' },
  label: { fontSize: '13px', fontWeight: '600', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' },
  input: { padding: '10px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none', backgroundColor: '#fff', color: '#1e293b', transition: 'border-color 0.2s', fontFamily: 'inherit', cursor: 'pointer' },
  
  fadeIn: { opacity: 1, transition: 'opacity 0.3s ease-in' },
  
  tableWrapper: { borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff' },
  th: { textAlign: 'left', fontSize: '12px', color: '#64748b', fontWeight: '700', padding: '16px 20px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textTransform: 'uppercase', letterSpacing: '0.5px' },
  tr: { borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.15s ease' },
  td: { padding: '16px 20px', fontSize: '15px', color: '#1e293b', verticalAlign: 'middle' },
  
  badge: { padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '700', display: 'inline-flex', alignItems: 'center' },
  
  emptyState: { textAlign: 'center', padding: '60px 20px', border: '2px dashed #e2e8f0', borderRadius: '12px', backgroundColor: '#fafaf9', marginTop: '16px' },
  emptyStateIcon: { fontSize: '56px', marginBottom: '16px', opacity: 0.8 },
}