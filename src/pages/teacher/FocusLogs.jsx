// src/pages/teacher/FocusLogs.jsx
import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'

export default function FocusLogs() {
  const { profile } = useAuth()
  const [classes,  setClasses]  = useState([])
  const [students, setStudents] = useState([])
  const [logs,     setLogs]     = useState([])
  const [selClass,  setSelClass]  = useState('')
  const [selStudent,setSelStudent]= useState('')
  const [loading,  setLoading]  = useState(false)

  useEffect(() => { loadClasses() }, [])
  useEffect(() => { if (selClass) loadStudents(selClass) }, [selClass])
  useEffect(() => { if (selStudent) loadLogs(selStudent) }, [selStudent])

  const loadClasses = async () => {
    const { supabase } = await import('../../lib/supabase')
    const { data } = await supabase
      .from('teacher_classes')
      .select('class_id, classes(name), section_id, sections(name)')
      .eq('teacher_id', profile.id)
    setClasses(data || [])
  }

  const loadStudents = async (classId) => {
    setSelStudent(''); setLogs([])
    const { supabase } = await import('../../lib/supabase')
    const { data } = await supabase
      .from('students')
      .select('id, roll_no, profiles(name)')
      .eq('class_id', parseInt(classId))
      .order('roll_no')
    setStudents(data || [])
  }

  const loadLogs = async (studentId) => {
    setLoading(true)
    const { supabase } = await import('../../lib/supabase')
    const { data } = await supabase
      .from('focus_logs')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(30)
    setLogs(data || [])
    setLoading(false)
  }

  const fmt = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`

  const avg = logs.length ? Math.round(logs.reduce((a,l)=>a+l.attention_percent,0)/logs.length) : null
  const scoreColor = v => v>70?'#16a34a':v>40?'#f59e0b':'#ef4444'

  return (
    <div style={S.page}>
      <div style={S.header}>
        <h2 style={S.title}>👁️ Student Focus Logs</h2>
        <p style={S.sub}>View attention session history for your students</p>
      </div>

      <div style={S.filters}>
        <select style={S.select} value={selClass} onChange={e=>setSelClass(e.target.value)}>
          <option value="">Select Class</option>
          {classes.map((c,i) => (
            <option key={i} value={c.class_id}>Class {c.classes?.name}{c.sections?.name ? ` - ${c.sections.name}` : ''}</option>
          ))}
        </select>
        <select style={S.select} value={selStudent} onChange={e=>setSelStudent(e.target.value)} disabled={!selClass}>
          <option value="">Select Student</option>
          {students.map(s => (
            <option key={s.id} value={s.id}>{s.profiles?.name} (Roll {s.roll_no})</option>
          ))}
        </select>
      </div>

      {selStudent && avg !== null && (
        <div style={S.summaryRow}>
          {[
            { label:'Total Sessions', value: logs.length, color:'#6366f1', bg:'#eef2ff' },
            { label:'Avg Focus Score', value:`${avg}%`, color:scoreColor(avg), bg:`${scoreColor(avg)}15` },
            { label:'Total Study Time', value: fmt(logs.reduce((a,l)=>a+l.duration_seconds,0)), color:'#0ea5e9', bg:'#f0f9ff' },
          ].map(s=>(
            <div key={s.label} style={{...S.sumCard, background:s.bg}}>
              <p style={{ margin:0, fontSize:'11px', color:'#6b7280', fontWeight:'600', textTransform:'uppercase' }}>{s.label}</p>
              <p style={{ margin:'4px 0 0', fontSize:'26px', fontWeight:'800', color:s.color }}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {loading && <div style={S.empty}>Loading...</div>}

      {!loading && selStudent && logs.length===0 && (
        <div style={S.empty}><span style={{fontSize:'36px'}}>📭</span><p>No focus sessions recorded for this student.</p></div>
      )}

      {!loading && logs.length>0 && (
        <div style={S.tableWrap}>
          <table style={S.table}>
            <thead>
              <tr>
                {['Date','Duration','Attentive','Drowsy','Focus Score','Rating'].map(h=>(
                  <th key={h} style={S.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map(log => {
                const c = scoreColor(log.attention_percent)
                return (
                  <tr key={log.id}>
                    <td style={S.td}>{log.session_date}</td>
                    <td style={S.td}>{fmt(log.duration_seconds)}</td>
                    <td style={{...S.td, color:'#16a34a', fontWeight:'600'}}>{fmt(log.attentive_seconds)}</td>
                    <td style={{...S.td, color:'#ef4444', fontWeight:'600'}}>{fmt(log.drowsy_seconds)}</td>
                    <td style={S.td}>
                      <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                        <div style={{ flex:1, height:'6px', background:'#e2e8f0', borderRadius:'3px' }}>
                          <div style={{ width:`${log.attention_percent}%`, height:'100%', background:c, borderRadius:'3px' }} />
                        </div>
                        <span style={{ fontWeight:'700', color:c, minWidth:'36px' }}>{log.attention_percent}%</span>
                      </div>
                    </td>
                    <td style={S.td}>
                      <span style={{ padding:'3px 10px', borderRadius:'12px', fontSize:'12px', fontWeight:'700', background:`${c}15`, color:c }}>
                        {log.attention_percent>70?'Good':log.attention_percent>40?'Average':'Poor'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {!selStudent && !loading && (
        <div style={S.empty}><span style={{fontSize:'40px'}}>🔍</span><p>Select a class and student to view focus logs.</p></div>
      )}
    </div>
  )
}

const S = {
  page:      { maxWidth:'900px', margin:'0 auto' },
  header:    { marginBottom:'20px' },
  title:     { margin:0, fontSize:'22px', fontWeight:'800', color:'#1e293b' },
  sub:       { margin:'4px 0 0', color:'#64748b', fontSize:'14px' },
  filters:   { display:'flex', gap:'12px', marginBottom:'20px', flexWrap:'wrap' },
  select:    { padding:'10px 14px', borderRadius:'8px', border:'1px solid #e2e8f0', fontSize:'14px', minWidth:'220px', background:'#fff', outline:'none' },
  summaryRow:{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px', marginBottom:'20px' },
  sumCard:   { borderRadius:'10px', padding:'16px' },
  tableWrap: { background:'#fff', borderRadius:'12px', overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,0.07)' },
  table:     { width:'100%', borderCollapse:'collapse' },
  th:        { padding:'12px 16px', fontSize:'12px', fontWeight:'700', color:'#6b7280', textTransform:'uppercase', background:'#f8fafc', textAlign:'left', borderBottom:'2px solid #f1f5f9' },
  td:        { padding:'12px 16px', fontSize:'14px', color:'#374151', borderBottom:'1px solid #f8fafc' },
  empty:     { textAlign:'center', padding:'60px', color:'#94a3b8' },
}
