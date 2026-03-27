// src/pages/admin/ActivityLog.jsx
import { useState, useEffect } from 'react'

const ACTION_ICONS = {
  'Student Created':   '👤',
  'Student Deleted':   '🗑️',
  'Teacher Created':   '👨‍🏫',
  'Teacher Deleted':   '🗑️',
  'Attendance Marked': '✅',
  'Fee Collected':     '💰',
  'Exam Created':      '📝',
  'Marks Uploaded':    '🏆',
  'Notice Posted':     '📢',
  'Paper Published':   '📄',
  'Leave Applied':     '🏖️',
  'CSV Import':        '📥',
}

const ACTION_COLORS = {
  'Student Created':   '#16a34a',
  'Student Deleted':   '#ef4444',
  'Teacher Created':   '#6366f1',
  'Teacher Deleted':   '#ef4444',
  'Attendance Marked': '#0ea5e9',
  'Fee Collected':     '#16a34a',
  'Exam Created':      '#f59e0b',
  'Marks Uploaded':    '#8b5cf6',
  'Notice Posted':     '#f59e0b',
  'Paper Published':   '#6366f1',
  'Leave Applied':     '#f59e0b',
  'CSV Import':        '#0ea5e9',
}

export default function ActivityLog() {
  const [logs,      setLogs]      = useState([])
  const [filtered,  setFiltered]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [selAction, setSelAction] = useState('')
  const [selRole,   setSelRole]   = useState('')
  const [selDate,   setSelDate]   = useState('')
  const [search,    setSearch]    = useState('')

  useEffect(() => { loadLogs() }, [])
  useEffect(() => { applyFilters() }, [logs, selAction, selRole, selDate, search])

  const sb = async () => { const { supabase } = await import('../../lib/supabase'); return supabase }

  const loadLogs = async () => {
    setLoading(true)
    const s = await sb()
    const { data } = await s.from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500)
    setLogs(data || [])
    setLoading(false)
  }

  const applyFilters = () => {
    let f = [...logs]
    if (selAction) f = f.filter(l => l.action === selAction)
    if (selRole)   f = f.filter(l => l.role === selRole)
    if (selDate)   f = f.filter(l => l.created_at?.startsWith(selDate))
    if (search)    f = f.filter(l =>
      l.performed_by_name?.toLowerCase().includes(search.toLowerCase()) ||
      l.target_name?.toLowerCase().includes(search.toLowerCase()) ||
      l.details?.toLowerCase().includes(search.toLowerCase())
    )
    setFiltered(f)
  }

  const clearFilters = () => { setSelAction(''); setSelRole(''); setSelDate(''); setSearch('') }

  const fmt = (ts) => {
    const d = new Date(ts)
    return d.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) +
      ' ' + d.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })
  }

  const uniqueActions = [...new Set(logs.map(l => l.action))].sort()

  return (
    <div style={S.page}>
      <div style={S.header}>
        <h2 style={S.title}>📋 Activity Log</h2>
        <p style={S.sub}>Complete audit trail of all actions performed in the system</p>
      </div>

      {/* Stats */}
      <div style={S.statsRow}>
        {[
          { label:'Total Actions',  value:logs.length,                                    color:'#6366f1', bg:'#eef2ff' },
          { label:'Today',          value:logs.filter(l=>l.created_at?.startsWith(new Date().toISOString().split('T')[0])).length, color:'#0ea5e9', bg:'#f0f9ff' },
          { label:'This Week',      value:logs.filter(l=>new Date(l.created_at)>new Date(Date.now()-7*24*60*60*1000)).length, color:'#16a34a', bg:'#f0fdf4' },
          { label:'Showing',        value:filtered.length,                                color:'#f59e0b', bg:'#fffbeb' },
        ].map(s=>(
          <div key={s.label} style={{...S.statCard, background:s.bg}}>
            <p style={{ margin:0, fontSize:'11px', color:'#6b7280', fontWeight:'700', textTransform:'uppercase' }}>{s.label}</p>
            <p style={{ margin:'4px 0 0', fontSize:'26px', fontWeight:'800', color:s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={S.filterRow}>
        <input style={S.searchInput} placeholder="Search by name, target, details..." value={search} onChange={e=>setSearch(e.target.value)} />
        <select style={S.select} value={selAction} onChange={e=>setSelAction(e.target.value)}>
          <option value="">All Actions</option>
          {uniqueActions.map(a=><option key={a}>{a}</option>)}
        </select>
        <select style={S.select} value={selRole} onChange={e=>setSelRole(e.target.value)}>
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="teacher">Teacher</option>
          <option value="student">Student</option>
        </select>
        <input style={S.select} type="date" value={selDate} onChange={e=>setSelDate(e.target.value)} />
        {(selAction||selRole||selDate||search) && (
          <button style={S.btnClear} onClick={clearFilters}>✕ Clear</button>
        )}
        <button style={S.btnRefresh} onClick={loadLogs}>🔄</button>
      </div>

      {loading ? (
        <div style={S.empty}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div style={S.empty}><span style={{fontSize:'40px'}}>📭</span><p>No activity logs found.</p></div>
      ) : (
        <div style={{ background:'#fff', borderRadius:'12px', overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,0.07)' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr>
                {['Time','Action','Performed By','Role','Target','Details'].map(h=>(
                  <th key={h} style={S.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(log => {
                const color = ACTION_COLORS[log.action] || '#6366f1'
                const icon  = ACTION_ICONS[log.action]  || '📌'
                return (
                  <tr key={log.id} style={{ borderBottom:'1px solid #f8fafc' }}>
                    <td style={{...S.td, fontSize:'12px', color:'#94a3b8', whiteSpace:'nowrap'}}>{fmt(log.created_at)}</td>
                    <td style={S.td}>
                      <span style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                        <span style={{ background:`${color}15`, color, padding:'3px 10px', borderRadius:'12px', fontSize:'12px', fontWeight:'700', whiteSpace:'nowrap' }}>
                          {icon} {log.action}
                        </span>
                      </span>
                    </td>
                    <td style={{...S.td, fontWeight:'600'}}>{log.performed_by_name || '—'}</td>
                    <td style={S.td}>
                      <span style={{ textTransform:'capitalize', background:'#f1f5f9', padding:'2px 8px', borderRadius:'8px', fontSize:'12px', fontWeight:'600' }}>{log.role || '—'}</span>
                    </td>
                    <td style={S.td}>{log.target_name || '—'}</td>
                    <td style={{...S.td, color:'#64748b', fontSize:'13px'}}>{log.details || '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

const S = {
  page:       { maxWidth:'1100px', margin:'0 auto' },
  header:     { marginBottom:'20px' },
  title:      { margin:0, fontSize:'22px', fontWeight:'800', color:'#1e293b' },
  sub:        { margin:'4px 0 0', color:'#64748b', fontSize:'14px' },
  statsRow:   { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'12px', marginBottom:'20px' },
  statCard:   { borderRadius:'10px', padding:'14px', boxShadow:'0 1px 3px rgba(0,0,0,0.06)' },
  filterRow:  { display:'flex', gap:'10px', marginBottom:'16px', flexWrap:'wrap', alignItems:'center' },
  searchInput:{ padding:'9px 14px', borderRadius:'8px', border:'1px solid #e2e8f0', fontSize:'14px', outline:'none', minWidth:'220px', flex:1 },
  select:     { padding:'9px 12px', borderRadius:'8px', border:'1px solid #e2e8f0', fontSize:'14px', background:'#fff', outline:'none' },
  btnClear:   { padding:'9px 14px', background:'#fef2f2', color:'#ef4444', border:'none', borderRadius:'8px', fontSize:'13px', fontWeight:'600', cursor:'pointer' },
  btnRefresh: { padding:'9px 12px', background:'#f1f5f9', color:'#374151', border:'none', borderRadius:'8px', fontSize:'14px', cursor:'pointer' },
  th:         { padding:'12px 16px', fontSize:'11px', fontWeight:'700', color:'#6b7280', textTransform:'uppercase', background:'#f8fafc', textAlign:'left', borderBottom:'2px solid #f1f5f9', whiteSpace:'nowrap' },
  td:         { padding:'11px 16px', fontSize:'13px', color:'#374151' },
  empty:      { textAlign:'center', padding:'60px', color:'#94a3b8' },
}
