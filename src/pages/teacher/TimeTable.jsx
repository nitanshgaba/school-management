// import { useState, useEffect } from 'react'
// import { supabase } from '../../lib/supabase'
// import { useAuth } from '../../context/AuthContext'

// const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

// export default function TeacherTimeTable() {
//   const { profile } = useAuth()
//   const [timetable, setTimetable] = useState([])
//   const [loading, setLoading] = useState(true)

//   useEffect(() => {
//     fetchTimetable()
//   }, [])

//   const fetchTimetable = async () => {
//     // Get subjects assigned to this teacher
//     const { data: subjectData } = await supabase
//       .from('subjects')
//       .select('id, name, class_id')
//       .eq('teacher_id', profile.id)

//     if (!subjectData || subjectData.length === 0) { setLoading(false); return }

//     const subjectIds = subjectData.map(s => s.id)

//     const { data } = await supabase
//       .from('timetable')
//       .select('*, subjects(name), classes(name), sections(name)')
//       .in('subject_id', subjectIds)
//       .order('day')
//       .order('period_start')
//     setTimetable(data || [])
//     setLoading(false)
//   }

//   const groupedByDay = DAYS.reduce((acc, day) => {
//     acc[day] = timetable.filter(t => t.day === day)
//     return acc
//   }, {})

//   if (loading) return <div style={styles.loading}>Loading...</div>

//   return (
//     <div>
//       <h1 style={styles.title}>My Time Table</h1>
//       {timetable.length === 0 ? (
//         <div style={styles.emptyState}>
//           <div style={{ fontSize: '64px' }}>🗓️</div>
//           <p style={{ color: '#9ca3af', marginTop: '12px' }}>No timetable assigned yet</p>
//         </div>
//       ) : (
//         <div style={styles.grid}>
//           {DAYS.map(day => (
//             groupedByDay[day].length > 0 && (
//               <div key={day} style={styles.dayCard}>
//                 <div style={styles.dayHeader}>
//                   <h2 style={styles.dayTitle}>{day}</h2>
//                   <span style={styles.dayCount}>{groupedByDay[day].length} periods</span>
//                 </div>
//                 <div style={styles.periods}>
//                   {groupedByDay[day].map(t => (
//                     <div key={t.id} style={styles.periodItem}>
//                       <div style={styles.timeBox}>
//                         <span style={styles.time}>{t.period_start?.slice(0,5)}</span>
//                         <span style={styles.timeSep}>—</span>
//                         <span style={styles.time}>{t.period_end?.slice(0,5)}</span>
//                       </div>
//                       <div style={styles.periodInfo}>
//                         <p style={styles.subjectName}>{t.subjects?.name || '—'}</p>
//                         <p style={styles.classInfo}>{t.classes?.name} {t.sections?.name && `- ${t.sections.name}`}</p>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             )
//           ))}
//         </div>
//       )}
//     </div>
//   )
// }

// const styles = {
//   loading: { textAlign: 'center', padding: '40px', color: '#9ca3af' },
//   title: { fontSize: '24px', fontWeight: '700', color: '#1a1a2e', marginBottom: '24px' },
//   emptyState: { textAlign: 'center', padding: '80px 0' },
//   grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' },
//   dayCard: { backgroundColor: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
//   dayHeader: { backgroundColor: '#4f46e5', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
//   dayTitle: { fontSize: '15px', fontWeight: '700', color: '#fff', margin: 0 },
//   dayCount: { fontSize: '12px', color: '#c7d2fe', backgroundColor: '#4338ca', padding: '2px 8px', borderRadius: '20px' },
//   periods: { padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' },
//   periodItem: { display: 'flex', gap: '12px', alignItems: 'center', padding: '10px', backgroundColor: '#f9fafb', borderRadius: '8px' },
//   timeBox: { display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '60px' },
//   time: { fontSize: '12px', fontWeight: '700', color: '#4f46e5' },
//   timeSep: { fontSize: '10px', color: '#9ca3af' },
//   periodInfo: { flex: 1 },
//   subjectName: { fontSize: '14px', fontWeight: '600', color: '#1a1a2e', margin: 0 },
//   classInfo: { fontSize: '12px', color: '#6b7280', margin: '2px 0 0' },
// }


import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function TeacherTimeTable() {
  const { profile } = useAuth()
  const [timetable, setTimetable] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchTimetable() }, [])

  const fetchTimetable = async () => {
    const { data: subjectData } = await supabase
      .from('subjects')
      .select('id')
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

  const formatTime = (timeStr) => {
    if (!timeStr) return ''
    const [h, m] = timeStr.split(':')
    let hours = parseInt(h, 10)
    const ampm = hours >= 12 ? 'PM' : 'AM'
    hours = hours % 12 || 12
    return `${hours}:${m} ${ampm}`
  }

  const todayName = new Date().toLocaleDateString('en-IN', { weekday: 'long' })

  if (loading) return (
    <div style={styles.loadingContainer}>
      <div style={{ fontSize: '40px', marginBottom: '16px' }}>🗓️</div>
      <div style={{ color: '#64748b', fontSize: '16px', fontWeight: '600' }}>Loading your teaching schedule...</div>
    </div>
  )

  return (
    <div style={styles.container}>
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Teaching Schedule</h1>
          <p style={styles.pageSubtitle}>Your weekly lecture roadmap and class assignments</p>
        </div>
      </div>

      {timetable.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyStateIcon}>🗓️</div>
          <h3 style={{ color: '#374151', margin: '0 0 8px 0' }}>No Schedule Assigned</h3>
          <p style={{ color: '#6b7280', margin: 0, fontSize: '14px' }}>You don't have any periods assigned in the system yet.</p>
        </div>
      ) : (
        <div style={styles.boardCard}>
          <div style={styles.boardHeader}>
            <div style={styles.boardHeaderTitle}>📅 Weekly Matrix View</div>
          </div>

          <div style={styles.matrixContainer}>
            {DAYS.map(day => {
              const dayPeriods = groupedByDay[day]
              const isToday = day === todayName

              return (
                <div key={day} style={{ ...styles.dayRow, backgroundColor: isToday ? '#f0f9ff' : 'transparent' }}>
                  
                  {/* Left Label */}
                  <div style={styles.dayLabelBox}>
                    <h3 style={{ ...styles.dayLabelText, color: isToday ? '#2563eb' : '#334155' }}>
                      {day}
                    </h3>
                    {isToday && <span style={styles.todayBadge}>📍 Today</span>}
                  </div>

                  {/* Horizontal Scroll Track */}
                  <div style={styles.periodsTrack}>
                    {dayPeriods.length === 0 ? (
                      <div style={styles.emptyDayBlock}>No lectures scheduled</div>
                    ) : (
                      dayPeriods.map(t => (
                        <div key={t.id} style={styles.periodBlock}>
                          <div style={styles.blockTime}>
                            {formatTime(t.period_start)} - {formatTime(t.period_end)}
                          </div>
                          <div style={styles.blockSubject}>
                            {t.subjects?.name || 'Lecture'}
                          </div>
                          <div style={styles.classTag}>
                             🏫 Class {t.classes?.name} {t.sections?.name && `• ${t.sections.name}`}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  container: { maxWidth: '1200px', margin: '0 auto', padding: '20px', fontFamily: 'Inter, sans-serif' },
  pageHeader: { marginBottom: '32px' },
  pageTitle: { fontSize: '32px', fontWeight: '800', color: '#111827', margin: 0, letterSpacing: '-0.5px' },
  pageSubtitle: { fontSize: '15px', color: '#64748b', margin: '4px 0 0' },
  
  loadingContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' },
  emptyState: { textAlign: 'center', padding: '80px 20px', border: '2px dashed #e2e8f0', borderRadius: '16px', backgroundColor: '#fafaf9' },
  emptyStateIcon: { fontSize: '56px', marginBottom: '16px', opacity: 0.8 },

  boardCard: { backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', overflow: 'hidden' },
  boardHeader: { backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', padding: '16px 24px' },
  boardHeaderTitle: { fontSize: '14px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' },
  
  matrixContainer: { display: 'flex', flexDirection: 'column' },
  dayRow: { display: 'flex', borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.2s', minHeight: '110px' },
  
  dayLabelBox: { width: '130px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'center', borderRight: '1px dashed #e2e8f0', flexShrink: 0 },
  dayLabelText: { margin: 0, fontSize: '15px', fontWeight: '800' },
  todayBadge: { marginTop: '8px', display: 'inline-block', backgroundColor: '#2563eb', color: '#fff', padding: '2px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: '700', alignSelf: 'flex-start', textTransform: 'uppercase' },
  
  periodsTrack: { flex: 1, padding: '16px', display: 'flex', gap: '12px', overflowX: 'auto', alignItems: 'stretch' },
  
  periodBlock: { 
    minWidth: '180px',
    backgroundColor: '#fff', 
    border: '1px solid #e2e8f0', 
    borderLeft: '4px solid #10b981', // Teacher accent color (Green)
    borderRadius: '10px', 
    padding: '12px 16px', 
    display: 'flex', 
    flexDirection: 'column', 
    justifyContent: 'center',
    boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
    flexShrink: 0
  },
  blockTime: { fontSize: '11px', color: '#94a3b8', fontWeight: '700', letterSpacing: '0.5px', marginBottom: '4px' },
  blockSubject: { fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  classTag: { fontSize: '12px', color: '#059669', fontWeight: '700', backgroundColor: '#ecfdf5', padding: '4px 8px', borderRadius: '6px', width: 'fit-content' },
  
  emptyDayBlock: { display: 'flex', alignItems: 'center', color: '#94a3b8', fontSize: '14px', fontStyle: 'italic', padding: '0 16px' }
}

