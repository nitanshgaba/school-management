import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

export default function FocusLogs() {
  const { profile } = useAuth()
  const [classes, setClasses] = useState([])
  const [students, setStudents] = useState([])
  const [logs, setLogs] = useState([])
  const [allLogs, setAllLogs] = useState([])
  const [selClass, setSelClass] = useState('')
  const [selStudent, setSelStudent] = useState('')
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState('student')
  const [selLog, setSelLog] = useState(null)

  useEffect(() => { loadClasses() }, [])
  useEffect(() => { if (selClass) { loadStudents(selClass); loadClassInsights(selClass) } }, [selClass])
  useEffect(() => { if (selStudent) loadLogs(selStudent) }, [selStudent])

  const loadClasses = async () => {
    const { data } = await supabase
      .from('teacher_classes').select('class_id, classes(name), section_id, sections(name)')
      .eq('teacher_id', profile.id)
    setClasses(data || [])
  }

  const loadStudents = async (classId) => {
    setSelStudent(''); setLogs([])
    const { data } = await supabase
      .from('students').select('id, roll_no, profiles(name)')
      .eq('class_id', parseInt(classId)).order('roll_no')
    setStudents(data || [])
  }

  const loadLogs = async (studentId) => {
    setLoading(true)
    const { data } = await supabase
      .from('focus_logs').select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false }).limit(30)
    setLogs(data || [])
    setLoading(false)
  }

  const loadClassInsights = async (classId) => {
    const { data: studs } = await supabase
      .from('students').select('id, roll_no, profiles(name)')
      .eq('class_id', parseInt(classId))
    if (!studs || studs.length === 0) { setAllLogs([]); return }
    const ids = studs.map(s => s.id)
    const { data: logData } = await supabase
      .from('focus_logs').select('*')
      .in('student_id', ids)
      .order('created_at', { ascending: false })
    
    const enriched = (logData || []).map(l => ({
      ...l,
      studentName: studs.find(s => s.id === l.student_id)?.profiles?.name || '—',
      rollNo: studs.find(s => s.id === l.student_id)?.roll_no || '—'
    }))
    setAllLogs(enriched)
  }

  const fmt = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
  const sc = v => v > 70 ? '#16a34a' : v > 40 ? '#f59e0b' : '#ef4444'
  const sb = v => v > 70 ? '#f0fdf4' : v > 40 ? '#fffbeb' : '#fef2f2'

  const studentAverages = (() => {
    if (allLogs.length === 0) return []
    const map = {}
    allLogs.forEach(l => {
      if (!map[l.student_id]) map[l.student_id] = { name: l.studentName, roll: l.rollNo, scores: [], totalTime: 0 }
      map[l.student_id].scores.push(l.attention_percent)
      map[l.student_id].totalTime += l.duration_seconds
    })
    return Object.entries(map).map(([id, v]) => ({
      id, name: v.name, roll: v.roll,
      avg: Math.round(v.scores.reduce((a, b) => a + b, 0) / v.scores.length),
      sessions: v.scores.length,
      totalTime: v.totalTime,
      trend: v.scores.length >= 2 ? v.scores[0] - v.scores[v.scores.length - 1] : 0
    })).sort((a, b) => a.avg - b.avg)
  })()

  const atRisk = studentAverages.filter(s => s.avg < 50)

  const TimelineHeatmap = ({ timeline }) => {
    if (!timeline || timeline.length === 0) return null
    const colorMap = { A: '#22c55e', D: '#ef4444', S: '#f59e0b' }
    return (
      <div style={styles.heatmapWrapper}>
        <p style={styles.boxLabel}>Session Attention Timeline</p>
        <div style={styles.heatmapTrack}>
          {timeline.map((s, i) => (
            <div key={i} style={{ ...styles.heatmapBar, background: colorMap[s] || '#e2e8f0' }} />
          ))}
        </div>
        <div style={styles.heatmapLegend}>
          <span style={{ color: '#22c55e' }}>● Attentive</span>
          <span style={{ color: '#f59e0b' }}>● Distracted</span>
          <span style={{ color: '#ef4444' }}>● Drowsy</span>
        </div>
      </div>
    )
  }

  if (loading && tab === 'student' && !logs.length) return <div style={styles.loadingBox}>⌛ Analyzing attention data...</div>

  return (
    <div style={styles.container}>
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Focus & Attention Logs</h1>
          <p style={styles.pageSubtitle}>Monitor student engagement levels and AI-powered focus metrics</p>
        </div>
      </div>

      <div style={styles.filterCard}>
        <div style={styles.filterGroup}>
          <label style={styles.label}>Choose Class</label>
          <select style={styles.input} value={selClass} onChange={e => setSelClass(e.target.value)}>
            <option value="">-- Select Class --</option>
            {classes.map((c, i) => (
              <option key={i} value={c.class_id}>Class {c.classes?.name}{c.sections?.name ? ` - ${c.sections.name}` : ''}</option>
            ))}
          </select>
        </div>
      </div>

      {selClass && (
        <div style={styles.tabContainer}>
          {[['student', '👤 Individual'], ['insights', '📊 Class Stats'], ['atrisk', '⚠️ Attention Alerts']].map(([t, l]) => (
            <button key={t} onClick={() => setTab(t)} style={{ ...styles.tab, backgroundColor: tab === t ? '#fff' : 'transparent', color: tab === t ? '#4f46e5' : '#64748b', boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>{l}</button>
          ))}
        </div>
      )}

      {/* --- Individual View --- */}
      {tab === 'student' && selClass && (
        <div style={styles.fadeIn}>
          <div style={{ ...styles.filterCard, marginTop: '-12px', marginBottom: '24px' }}>
            <label style={styles.label}>Select Student</label>
            <select style={styles.input} value={selStudent} onChange={e => setSelStudent(e.target.value)}>
              <option value="">-- Select Student --</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.profiles?.name} (Roll {s.roll_no})</option>
              ))}
            </select>
          </div>

          {selStudent && logs.length > 0 && (
            <>
              <div style={styles.bentoGrid}>
                {[
                  { label: 'Total Sessions', value: logs.length, icon: '📅', color: '#4f46e5', bg: '#eff6ff' },
                  { label: 'Avg Focus', value: `${Math.round(logs.reduce((a, l) => a + l.attention_percent, 0) / logs.length)}%`, icon: '🎯', color: sc(Math.round(logs.reduce((a, l) => a + l.attention_percent, 0) / logs.length)), bg: sb(Math.round(logs.reduce((a, l) => a + l.attention_percent, 0) / logs.length)) },
                  { label: 'Time Logged', value: fmt(logs.reduce((a, l) => a + l.duration_seconds, 0)), icon: '⏱️', color: '#0ea5e9', bg: '#f0f9ff' },
                  { label: 'Blink Count', value: logs.reduce((a, l) => a + (l.blink_count || 0), 0), icon: '👁️', color: '#8b5cf6', bg: '#f5f3ff' },
                ].map(s => (
                  <div key={s.label} style={{ ...styles.bentoCard, backgroundColor: s.bg }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <p style={styles.bentoLabel}>{s.label}</p>
                      <span>{s.icon}</span>
                    </div>
                    <p style={{ ...styles.bentoValue, color: s.color }}>{s.value}</p>
                  </div>
                ))}
              </div>

              <div style={styles.logList}>
                {logs.map(log => {
                  const c = sc(log.attention_percent)
                  const open = selLog === log.id
                  return (
                    <div key={log.id} style={{ ...styles.logCard, borderLeft: `6px solid ${c}` }}>
                      <div style={styles.logHeader} onClick={() => setSelLog(open ? null : log.id)}>
                        <div style={{ flex: 1 }}>
                          <p style={styles.logDate}>{new Date(log.session_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                          <div style={styles.statRow}>
                            <span>⏱ {fmt(log.duration_seconds)}</span>
                            <span style={{ color: '#16a34a' }}>✅ {fmt(log.attentive_seconds)}</span>
                            <span style={{ color: '#ef4444' }}>😴 {fmt(log.drowsy_seconds)}</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <span style={{ ...styles.scoreBadge, backgroundColor: sb(log.attention_percent), color: c }}>{log.attention_percent}% Focus</span>
                          <span style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.2s' }}>▼</span>
                        </div>
                      </div>
                      {open && (
                        <div style={styles.logBody}>
                          <TimelineHeatmap timeline={log.timeline} />
                          {log.ai_recommendation && (
                            <div style={styles.aiBox}>
                              <p style={styles.aiLabel}>🤖 AI Insights & Recovery</p>
                              <p style={styles.aiText}>{log.ai_recommendation}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* --- Class Insights --- */}
      {tab === 'insights' && (
        <div style={styles.fadeIn}>
          <div style={styles.tableCard}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Student Name</th>
                  <th style={styles.th}>Sessions</th>
                  <th style={styles.th}>Avg Focus</th>
                  <th style={styles.th}>Activity</th>
                  <th style={styles.th}>Trend</th>
                </tr>
              </thead>
              <tbody>
                {studentAverages.map(s => (
                  <tr key={s.id} style={styles.tr}>
                    <td style={{ ...styles.td, fontWeight: '700' }}>{s.name} <span style={{ color: '#94a3b8', fontSize: '11px' }}>#{s.roll}</span></td>
                    <td style={styles.td}>{s.sessions}</td>
                    <td style={styles.td}>
                      <div style={styles.progressWrapper}>
                        <div style={styles.progressBar}><div style={{ ...styles.progressFill, width: `${s.avg}%`, background: sc(s.avg) }} /></div>
                        <span style={{ fontWeight: '800', color: sc(s.avg), fontSize: '13px' }}>{s.avg}%</span>
                      </div>
                    </td>
                    <td style={styles.td}>{fmt(s.totalTime)}</td>
                    <td style={styles.td}>
                      <span style={{ color: s.trend > 5 ? '#16a34a' : s.trend < -5 ? '#ef4444' : '#f59e0b', fontWeight: '700', fontSize: '12px' }}>
                        {s.trend > 5 ? '📈 Improving' : s.trend < -5 ? '📉 Declining' : '➡️ Stable'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- At Risk --- */}
      {tab === 'atrisk' && (
        <div style={styles.fadeIn}>
          {atRisk.length === 0 ? (
            <div style={styles.emptyState}>🎉 All students are currently meeting focus benchmarks.</div>
          ) : (
            <>
              <div style={styles.alertBanner}>
                <span>⚠️</span>
                <p>{atRisk.length} students have focus averages below 50%. Immediate intervention may be helpful.</p>
              </div>
              <div style={styles.logList}>
                {atRisk.map(s => (
                  <div key={s.id} style={styles.riskCard}>
                    <div>
                      <p style={{ margin: 0, fontWeight: '800', fontSize: '16px' }}>{s.name}</p>
                      <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>Roll: {s.roll} • {s.sessions} sessions logged</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '24px', fontWeight: '900', color: '#ef4444' }}>{s.avg}%</span>
                      <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8', fontWeight: '700' }}>CRITICAL LEVEL</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {!selClass && (
        <div style={styles.emptyState}>
          <div style={{ fontSize: '56px', marginBottom: '16px' }}>👁️</div>
          <h3 style={{ color: '#0f172a', margin: '0 0 8px 0' }}>Select a Class</h3>
          <p style={{ color: '#64748b', margin: 0 }}>Choose a class above to analyze student focus and engagement levels.</p>
        </div>
      )}
    </div>
  )
}

const styles = {
  container: { maxWidth: '1100px', margin: '0 auto', padding: '20px', fontFamily: 'Inter, sans-serif' },
  pageHeader: { marginBottom: '32px' },
  pageTitle: { fontSize: '32px', fontWeight: '800', color: '#0f172a', margin: 0, letterSpacing: '-1px' },
  pageSubtitle: { fontSize: '15px', color: '#64748b', marginTop: '4px' },
  
  filterCard: { backgroundColor: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
  filterGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' },
  input: { padding: '12px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', backgroundColor: '#fff', width: '100%', boxSizing: 'border-box' },

  tabContainer: { display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '12px', margin: '24px 0', width: 'fit-content' },
  tab: { padding: '10px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', transition: '0.2s' },

  bentoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' },
  bentoCard: { padding: '20px', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.05)' },
  bentoLabel: { fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', margin: 0 },
  bentoValue: { fontSize: '28px', fontWeight: '900', margin: '8px 0 0' },

  logList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  logCard: { backgroundColor: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
  logHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' },
  logDate: { fontSize: '16px', fontWeight: '800', color: '#1e293b', margin: 0 },
  statRow: { display: 'flex', gap: '12px', marginTop: '6px', fontSize: '13px', fontWeight: '600', color: '#64748b' },
  scoreBadge: { padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '800' },
  logBody: { marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #f1f5f9' },

  heatmapWrapper: { marginBottom: '20px' },
  boxLabel: { fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' },
  heatmapTrack: { display: 'flex', height: '14px', borderRadius: '4px', overflow: 'hidden', gap: '1px' },
  heatmapBar: { flex: 1, minWidth: '4px' },
  heatmapLegend: { display: 'flex', gap: '16px', marginTop: '8px', fontSize: '11px', fontWeight: '700' },

  aiBox: { backgroundColor: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: '12px', padding: '16px' },
  aiLabel: { fontSize: '12px', fontWeight: '800', color: '#7c3aed', marginBottom: '6px' },
  aiText: { fontSize: '14px', color: '#4c1d95', lineHeight: '1.6', margin: 0 },

  tableCard: { backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '16px 20px', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '16px 20px', fontSize: '14px', color: '#1e293b' },
  progressWrapper: { display: 'flex', alignItems: 'center', gap: '10px' },
  progressBar: { width: '80px', height: '6px', backgroundColor: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: '3px' },

  alertBanner: { backgroundColor: '#fef2f2', border: '1px solid #fecaca', padding: '16px', borderRadius: '12px', display: 'flex', gap: '12px', alignItems: 'center', color: '#991b1b', fontWeight: '600', fontSize: '14px', marginBottom: '20px' },
  riskCard: { backgroundColor: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #fee2e2', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },

  loadingBox: { textAlign: 'center', padding: '100px', color: '#64748b', fontSize: '16px', fontWeight: '600' },
  emptyState: { textAlign: 'center', padding: '80px 20px', border: '2px dashed #e2e8f0', borderRadius: '20px', backgroundColor: '#fafaf9' },
  fadeIn: { animation: 'fadeIn 0.3s ease-in' }
}