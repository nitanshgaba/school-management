import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function Analytics() {
  const [stats, setStats] = useState({ teachers: 0, students: 0, exams: 0, notices: 0 })
  const [attendanceData, setAttendanceData] = useState([])
  const [classData, setClassData] = useState([])
  const [marksData, setMarksData] = useState([])
  const [atRisk, setAtRisk] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    const [
      { count: teachers },
      { count: students },
      { count: exams },
      { count: notices },
    ] = await Promise.all([
      supabase.from('teachers').select('*', { count: 'exact', head: true }),
      supabase.from('students').select('*', { count: 'exact', head: true }),
      supabase.from('exams').select('*', { count: 'exact', head: true }),
      supabase.from('notices').select('*', { count: 'exact', head: true }),
    ])
    setStats({ teachers: teachers || 0, students: students || 0, exams: exams || 0, notices: notices || 0 })

    // Attendance breakdown
    const { data: attData } = await supabase.from('attendance').select('status, is_present')
    const present = attData?.filter(a => a.is_present || a.status === 'present').length || 0
    const absent = attData?.filter(a => !a.is_present && a.status !== 'present').length || 0
    setAttendanceData([
      { label: 'Present', value: present, color: '#22c55e' },
      { label: 'Absent', value: absent, color: '#ef4444' },
    ])

    // Students per class
    const { data: classStudents } = await supabase.from('students').select('class_id, classes(name)')
    const classMap = {}
    classStudents?.forEach(s => {
      const name = 'Class ' + (s.classes?.name || s.class_id)
      classMap[name] = (classMap[name] || 0) + 1
    })
    setClassData(Object.entries(classMap).map(([label, value]) => ({ label, value })))

    // Marks distribution
    const { data: marks } = await supabase.from('marks').select('obtained_marks, total_marks')
    const dist = { 'A (75-100)': 0, 'B (60-74)': 0, 'C (50-59)': 0, 'D (35-49)': 0, 'F (<35)': 0 }
    marks?.forEach(m => {
      const pct = m.total_marks > 0 ? (m.obtained_marks / m.total_marks) * 100 : 0
      if (pct >= 75) dist['A (75-100)']++
      else if (pct >= 60) dist['B (60-74)']++
      else if (pct >= 50) dist['C (50-59)']++
      else if (pct >= 35) dist['D (35-49)']++
      else dist['F (<35)']++
    })
    setMarksData(Object.entries(dist).map(([label, value]) => ({ label, value })))

    // At-risk students (attendance < 75% or marks < 40%)
    const { data: allStudents } = await supabase.from('students').select('id, roll_no, profiles(name)')
    const risks = []
    for (const s of (allStudents || [])) {
      const { data: att } = await supabase.from('attendance').select('is_present, status').eq('student_id', s.id)
      const total = att?.length || 0
      const presentCount = att?.filter(a => a.is_present || a.status === 'present').length || 0
      const attPct = total > 0 ? Math.round((presentCount / total) * 100) : 100
      const { data: studentMarks } = await supabase.from('marks').select('obtained_marks, total_marks').eq('student_id', s.id)
      const avgPct = studentMarks?.length > 0
        ? Math.round(studentMarks.reduce((sum, m) => sum + (m.total_marks > 0 ? (m.obtained_marks / m.total_marks) * 100 : 0), 0) / studentMarks.length)
        : null
      if (attPct < 75 || (avgPct !== null && avgPct < 40)) {
        risks.push({ name: s.profiles?.name, roll: s.roll_no, attPct, avgPct, reason: attPct < 75 ? 'Low Attendance' : 'Low Marks' })
      }
    }
    setAtRisk(risks)
    setLoading(false)
  }

  const maxClassVal = Math.max(...classData.map(d => d.value), 1)
  const maxMarksVal = Math.max(...marksData.map(d => d.value), 1)
  const totalAtt = attendanceData.reduce((s, d) => s + d.value, 0)

  if (loading) return <div style={styles.loading}>Loading analytics...</div>

  return (
    <div>
      <h1 style={styles.title}>Analytics</h1>

      {/* Stat Cards */}
      <div style={styles.statsGrid}>
        {[
          { label: 'Total Teachers', value: stats.teachers, icon: '👨‍🏫', color: '#dbeafe', text: '#1d4ed8' },
          { label: 'Total Students', value: stats.students, icon: '👨‍🎓', color: '#dcfce7', text: '#16a34a' },
          { label: 'Total Exams', value: stats.exams, icon: '📝', color: '#fef9c3', text: '#ca8a04' },
          { label: 'Total Notices', value: stats.notices, icon: '📢', color: '#fee2e2', text: '#dc2626' },
        ].map(s => (
          <div key={s.label} style={{ ...styles.statCard, backgroundColor: s.color }}>
            <span style={{ fontSize: '32px' }}>{s.icon}</span>
            <div>
              <p style={{ ...styles.statValue, color: s.text }}>{s.value}</p>
              <p style={styles.statLabel}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={styles.row}>
        {/* Attendance Pie */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>📊 Attendance Overview</h2>
          {totalAtt === 0 ? <p style={styles.empty}>No attendance data yet</p> : (
            <div style={styles.pieContainer}>
              <svg viewBox="0 0 120 120" style={{ width: '160px', height: '160px' }}>
                {(() => {
                  let offset = 0
                  const r = 40, cx = 60, cy = 60, circ = 2 * Math.PI * r
                  return attendanceData.map((d, i) => {
                    const pct = d.value / totalAtt
                    const dash = pct * circ
                    const el = (
                      <circle key={i} cx={cx} cy={cy} r={r}
                        fill="none" stroke={d.color} strokeWidth="20"
                        strokeDasharray={`${dash} ${circ - dash}`}
                        strokeDashoffset={-offset * circ}
                        transform={`rotate(-90 ${cx} ${cy})`} />
                    )
                    offset += pct
                    return el
                  })
                })()}
                <text x="60" y="64" textAnchor="middle" fontSize="14" fontWeight="700" fill="#1a1a2e">
                  {Math.round((attendanceData[0]?.value || 0) / totalAtt * 100)}%
                </text>
              </svg>
              <div style={styles.legend}>
                {attendanceData.map(d => (
                  <div key={d.label} style={styles.legendItem}>
                    <span style={{ ...styles.legendDot, backgroundColor: d.color }} />
                    <span style={styles.legendText}>{d.label}: <strong>{d.value}</strong></span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Students per Class */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>🏫 Students per Class</h2>
          {classData.length === 0 ? <p style={styles.empty}>No data yet</p> : (
            <div style={styles.barChart}>
              {classData.map(d => (
                <div key={d.label} style={styles.barRow}>
                  <span style={styles.barLabel}>{d.label}</span>
                  <div style={styles.barTrack}>
                    <div style={{ ...styles.barFill, width: `${(d.value / maxClassVal) * 100}%`, backgroundColor: '#4f46e5' }} />
                  </div>
                  <span style={styles.barValue}>{d.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Marks Distribution */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>📈 Marks Distribution</h2>
        {marksData.every(d => d.value === 0) ? <p style={styles.empty}>No marks data yet</p> : (
          <div style={styles.barChart}>
            {marksData.map((d, i) => {
              const colors = ['#22c55e', '#3b82f6', '#eab308', '#f97316', '#ef4444']
              return (
                <div key={d.label} style={styles.barRow}>
                  <span style={styles.barLabel}>{d.label}</span>
                  <div style={styles.barTrack}>
                    <div style={{ ...styles.barFill, width: `${(d.value / maxMarksVal) * 100}%`, backgroundColor: colors[i] }} />
                  </div>
                  <span style={styles.barValue}>{d.value} students</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* At Risk Students */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>⚠️ At-Risk Students</h2>
        {atRisk.length === 0 ? (
          <div style={styles.noRisk}><span style={{ fontSize: '32px' }}>✅</span><p>All students are performing well!</p></div>
        ) : (
          <table style={styles.table}>
            <thead><tr>
              <th style={styles.th}>Student</th>
              <th style={styles.th}>Roll No</th>
              <th style={styles.th}>Attendance</th>
              <th style={styles.th}>Avg Marks</th>
              <th style={styles.th}>Risk Reason</th>
            </tr></thead>
            <tbody>
              {atRisk.map((s, i) => (
                <tr key={i}>
                  <td style={styles.td}>{s.name}</td>
                  <td style={styles.td}>{s.roll}</td>
                  <td style={styles.td}>
                    <span style={{ color: s.attPct < 75 ? '#ef4444' : '#22c55e', fontWeight: '700' }}>{s.attPct}%</span>
                  </td>
                  <td style={styles.td}>
                    {s.avgPct !== null ? <span style={{ color: s.avgPct < 40 ? '#ef4444' : '#22c55e', fontWeight: '700' }}>{s.avgPct}%</span> : '—'}
                  </td>
                  <td style={styles.td}>
                    <span style={{ backgroundColor: '#fee2e2', color: '#dc2626', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>{s.reason}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

const styles = {
  loading: { textAlign: 'center', padding: '60px', color: '#9ca3af', fontSize: '16px' },
  title: { fontSize: '24px', fontWeight: '700', color: '#1a1a2e', marginBottom: '24px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' },
  statCard: { borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  statValue: { fontSize: '28px', fontWeight: '800', margin: 0 },
  statLabel: { fontSize: '13px', color: '#6b7280', margin: 0 },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' },
  card: { backgroundColor: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: '20px' },
  cardTitle: { fontSize: '16px', fontWeight: '700', color: '#1a1a2e', marginBottom: '20px' },
  empty: { color: '#9ca3af', fontSize: '14px' },
  pieContainer: { display: 'flex', alignItems: 'center', gap: '32px' },
  legend: { display: 'flex', flexDirection: 'column', gap: '12px' },
  legendItem: { display: 'flex', alignItems: 'center', gap: '8px' },
  legendDot: { width: '12px', height: '12px', borderRadius: '50%', flexShrink: 0 },
  legendText: { fontSize: '14px', color: '#374151' },
  barChart: { display: 'flex', flexDirection: 'column', gap: '14px' },
  barRow: { display: 'flex', alignItems: 'center', gap: '12px' },
  barLabel: { fontSize: '13px', color: '#374151', width: '120px', flexShrink: 0 },
  barTrack: { flex: 1, backgroundColor: '#f3f4f6', borderRadius: '8px', height: '20px', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: '8px', transition: 'width 0.5s ease' },
  barValue: { fontSize: '13px', color: '#6b7280', width: '80px', textAlign: 'right', flexShrink: 0 },
  noRisk: { textAlign: 'center', padding: '32px', color: '#22c55e', fontWeight: '600' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', fontSize: '13px', color: '#6b7280', fontWeight: '600', padding: '10px 12px', borderBottom: '2px solid #f3f4f6' },
  td: { padding: '12px', fontSize: '14px', color: '#374151', borderBottom: '1px solid #f9fafb' },
}
