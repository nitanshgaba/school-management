import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function StudentTimeTable() {
  const { profile } = useAuth()
  const [timetable, setTimetable] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchTimetable() }, [])

  const fetchTimetable = async () => {
    const { data: studentData } = await supabase
      .from('students')
      .select('class_id, section_id')
      .eq('id', profile.id)
      .single()
      
    if (!studentData) { 
      setLoading(false)
      return 
    }
    
    const { data } = await supabase
      .from('timetable')
      .select('*, subjects(name), classes(name), sections(name)')
      .eq('class_id', studentData.class_id)
      .order('day')
      .order('period_start')
      
    setTimetable(data || [])
    setLoading(false)
  }

  const groupedByDay = DAYS.reduce((acc, day) => {
    acc[day] = timetable.filter(t => t.day === day)
    return acc
  }, {})

  // Helper to format 24h time to 12h AM/PM
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
      <div style={{ color: '#64748b', fontSize: '16px', fontWeight: '600' }}>Loading weekly schedule...</div>
    </div>
  )

  return (
    <div style={styles.container}>
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Weekly Class Schedule</h1>
          <p style={styles.pageSubtitle}>Your entire week at a glance</p>
        </div>
      </div>

      {timetable.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyStateIcon}>🗓️</div>
          <h3 style={{ color: '#374151', margin: '0 0 8px 0' }}>No Schedule Found</h3>
          <p style={{ color: '#6b7280', margin: 0, fontSize: '14px' }}>Your class timetable hasn't been published yet.</p>
        </div>
      ) : (
        <div style={styles.boardCard}>
          <div style={styles.boardHeader}>
            <div style={styles.boardHeaderTitle}>📅 Timetable Matrix</div>
          </div>

          <div style={styles.matrixContainer}>
            {DAYS.map(day => {
              const dayPeriods = groupedByDay[day]
              const isToday = day === todayName

              return (
                <div key={day} style={{ ...styles.dayRow, backgroundColor: isToday ? '#f0f9ff' : 'transparent' }}>
                  
                  {/* Row Header (Day Name) */}
                  <div style={styles.dayLabelBox}>
                    <h3 style={{ ...styles.dayLabelText, color: isToday ? '#2563eb' : '#334155' }}>
                      {day}
                    </h3>
                    {isToday && <span style={styles.todayBadge}>📍 Today</span>}
                  </div>

                  {/* Row Content (Periods horizontally) */}
                  <div style={styles.periodsTrack}>
                    {dayPeriods.length === 0 ? (
                      <div style={styles.emptyDayBlock}>No classes scheduled</div>
                    ) : (
                      dayPeriods.map(t => {
                        
                        // ─── FULL HOLIDAY ───
                        if (t.is_holiday) {
                          return (
                            <div key={t.id} style={styles.holidayBlock}>
                              <span style={{ fontSize: '18px', marginRight: '8px' }}>🏝️</span>
                              <div>
                                <div style={{ fontWeight: '800', color: '#dc2626', letterSpacing: '0.5px', fontSize: '14px' }}>FULL DAY HOLIDAY</div>
                                <div style={{ fontSize: '12px', color: '#ef4444', fontWeight: '500' }}>No classes today</div>
                              </div>
                            </div>
                          )
                        }

                        // ─── LUNCH BREAK ───
                        if (t.is_lunch) {
                          return (
                            <div key={t.id} style={styles.lunchBlock}>
                              <div style={styles.blockTime}>{formatTime(t.period_start)} - {formatTime(t.period_end)}</div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                                <span>🍱</span>
                                <span style={{ fontWeight: '700', color: '#15803d', fontSize: '14px' }}>LUNCH</span>
                              </div>
                            </div>
                          )
                        }

                        // ─── STANDARD LECTURE ───
                        return (
                          <div key={t.id} style={styles.periodBlock}>
                            <div style={styles.blockTime}>
                              {formatTime(t.period_start)} - {formatTime(t.period_end)}
                            </div>
                            <div style={styles.blockSubject}>
                              {t.subjects?.name || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>General</span>}
                            </div>
                            <div style={styles.blockClass}>
                              Class {t.classes?.name} {t.sections?.name && `• Sec ${t.sections.name}`}
                            </div>
                          </div>
                        )
                      })
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

// ─── STYLES ────────────────────────────────────────────────
const styles = {
  container: { maxWidth: '1200px', margin: '0 auto', padding: '20px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' },
  pageHeader: { marginBottom: '24px' },
  pageTitle: { fontSize: '32px', fontWeight: '800', color: '#111827', margin: '0 0 8px 0', letterSpacing: '-0.5px' },
  pageSubtitle: { fontSize: '15px', color: '#6b7280', margin: 0 },
  
  loadingContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' },
  
  emptyState: { textAlign: 'center', padding: '80px 20px', border: '2px dashed #e2e8f0', borderRadius: '16px', backgroundColor: '#fafaf9', marginTop: '16px' },
  emptyStateIcon: { fontSize: '56px', marginBottom: '16px', opacity: 0.8 },

  // Main Board Matrix
  boardCard: { backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)', overflow: 'hidden', animation: 'fadeIn 0.3s ease-in' },
  boardHeader: { backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', padding: '16px 24px' },
  boardHeaderTitle: { fontSize: '16px', fontWeight: '800', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.5px' },
  
  matrixContainer: { display: 'flex', flexDirection: 'column' },
  
  // Row Styles
  dayRow: { display: 'flex', borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.2s', minHeight: '100px' },
  
  // Left Column (Day Labels)
  dayLabelBox: { width: '140px', padding: '20px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'center', borderRight: '1px dashed #e2e8f0', flexShrink: 0 },
  dayLabelText: { margin: 0, fontSize: '16px', fontWeight: '800' },
  todayBadge: { marginTop: '8px', display: 'inline-block', backgroundColor: '#2563eb', color: '#fff', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '700', alignSelf: 'flex-start', textTransform: 'uppercase' },
  
  // Right Column (Horizontal Periods Track)
  periodsTrack: { flex: 1, padding: '16px', display: 'flex', gap: '16px', overflowX: 'auto', alignItems: 'stretch' },
  
  // Period Blocks
  periodBlock: { 
    minWidth: '160px',
    backgroundColor: '#fff', 
    border: '1px solid #e2e8f0', 
    borderLeft: '4px solid #4f46e5', // Primary accent color for periods
    borderRadius: '8px', 
    padding: '12px 16px', 
    display: 'flex', 
    flexDirection: 'column', 
    justifyContent: 'center',
    boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
    flexShrink: 0
  },
  blockTime: { fontSize: '11px', color: '#64748b', fontWeight: '700', letterSpacing: '0.5px' },
  blockSubject: { fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: '4px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  blockClass: { fontSize: '12px', color: '#475569', fontWeight: '500' },
  
  // Special Blocks
  lunchBlock: { 
    minWidth: '140px',
    backgroundColor: '#f0fdf4', 
    border: '1px dashed #bbf7d0', 
    borderRadius: '8px', 
    padding: '12px 16px', 
    display: 'flex', 
    flexDirection: 'column', 
    justifyContent: 'center',
    flexShrink: 0
  },
  holidayBlock: { 
    flex: 1, // Stretches to fill the empty space
    minWidth: '200px',
    backgroundColor: '#fef2f2', 
    border: '1px dashed #fecaca', 
    borderRadius: '8px', 
    padding: '12px 20px', 
    display: 'flex', 
    alignItems: 'center',
  },
  
  emptyDayBlock: { display: 'flex', alignItems: 'center', color: '#94a3b8', fontSize: '14px', fontStyle: 'italic', padding: '0 16px' }
}