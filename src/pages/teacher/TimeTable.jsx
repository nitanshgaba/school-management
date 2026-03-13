import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function TeacherTimeTable() {
  const { profile } = useAuth()
  const [timetable, setTimetable] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTimetable()
  }, [])

  const fetchTimetable = async () => {
    // Get subjects assigned to this teacher
    const { data: subjectData } = await supabase
      .from('subjects')
      .select('id, name, class_id')
      .eq('teacher_id', profile.id)

    if (!subjectData || subjectData.length === 0) { setLoading(false); return }

    const subjectIds = subjectData.map(s => s.id)

    const { data } = await supabase
      .from('timetable')
      .select('*, subjects(name), classes(name), sections(name)')
      .in('subject_id', subjectIds)
      .order('day')
      .order('period_start')
    setTimetable(data || [])
    setLoading(false)
  }

  const groupedByDay = DAYS.reduce((acc, day) => {
    acc[day] = timetable.filter(t => t.day === day)
    return acc
  }, {})

  if (loading) return <div style={styles.loading}>Loading...</div>

  return (
    <div>
      <h1 style={styles.title}>My Time Table</h1>
      {timetable.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={{ fontSize: '64px' }}>🗓️</div>
          <p style={{ color: '#9ca3af', marginTop: '12px' }}>No timetable assigned yet</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {DAYS.map(day => (
            groupedByDay[day].length > 0 && (
              <div key={day} style={styles.dayCard}>
                <div style={styles.dayHeader}>
                  <h2 style={styles.dayTitle}>{day}</h2>
                  <span style={styles.dayCount}>{groupedByDay[day].length} periods</span>
                </div>
                <div style={styles.periods}>
                  {groupedByDay[day].map(t => (
                    <div key={t.id} style={styles.periodItem}>
                      <div style={styles.timeBox}>
                        <span style={styles.time}>{t.period_start?.slice(0,5)}</span>
                        <span style={styles.timeSep}>—</span>
                        <span style={styles.time}>{t.period_end?.slice(0,5)}</span>
                      </div>
                      <div style={styles.periodInfo}>
                        <p style={styles.subjectName}>{t.subjects?.name || '—'}</p>
                        <p style={styles.classInfo}>{t.classes?.name} {t.sections?.name && `- ${t.sections.name}`}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          ))}
        </div>
      )}
    </div>
  )
}

const styles = {
  loading: { textAlign: 'center', padding: '40px', color: '#9ca3af' },
  title: { fontSize: '24px', fontWeight: '700', color: '#1a1a2e', marginBottom: '24px' },
  emptyState: { textAlign: 'center', padding: '80px 0' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' },
  dayCard: { backgroundColor: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  dayHeader: { backgroundColor: '#4f46e5', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  dayTitle: { fontSize: '15px', fontWeight: '700', color: '#fff', margin: 0 },
  dayCount: { fontSize: '12px', color: '#c7d2fe', backgroundColor: '#4338ca', padding: '2px 8px', borderRadius: '20px' },
  periods: { padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' },
  periodItem: { display: 'flex', gap: '12px', alignItems: 'center', padding: '10px', backgroundColor: '#f9fafb', borderRadius: '8px' },
  timeBox: { display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '60px' },
  time: { fontSize: '12px', fontWeight: '700', color: '#4f46e5' },
  timeSep: { fontSize: '10px', color: '#9ca3af' },
  periodInfo: { flex: 1 },
  subjectName: { fontSize: '14px', fontWeight: '600', color: '#1a1a2e', margin: 0 },
  classInfo: { fontSize: '12px', color: '#6b7280', margin: '2px 0 0' },
}
