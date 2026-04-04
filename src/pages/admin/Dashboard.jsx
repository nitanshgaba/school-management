import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

export default function Dashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState({ teachers: 0, students: 0, notes: 0, notices: 0, subjects: 0, exams: 0 })
  const [notices, setNotices] = useState([])
  const [reminders, setReminders] = useState([])
  const [newReminder, setNewReminder] = useState('')
  const [loading, setLoading] = useState(true)
  const [attendance, setAttendance] = useState({ present: 0, total: 0 })
  const [fees, setFees] = useState({ collected: 0, pending: 0, overdue: 0 })
  const [activityLogs, setActivityLogs] = useState([])
  const [classDistribution, setClassDistribution] = useState([])

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    await Promise.all([fetchStats(), fetchNotices(), fetchReminders(), fetchAttendance(), fetchFees(), fetchActivity(), fetchClassDist()])
    setLoading(false)
  }

  const fetchStats = async () => {
    const [{ count: teachers }, { count: students }, { count: notes }, { count: notices }, { count: subjects }, { count: exams }] =
      await Promise.all([
        supabase.from('teachers').select('*', { count: 'exact', head: true }),
        supabase.from('students').select('*', { count: 'exact', head: true }),
        supabase.from('notes').select('*', { count: 'exact', head: true }),
        supabase.from('notices').select('*', { count: 'exact', head: true }),
        supabase.from('subjects').select('*', { count: 'exact', head: true }),
        supabase.from('exams').select('*', { count: 'exact', head: true }),
      ])
    setStats({ teachers: teachers||0, students: students||0, notes: notes||0, notices: notices||0, subjects: subjects||0, exams: exams||0 })
  }

  const fetchNotices = async () => {
    const { data } = await supabase.from('notices').select('*').order('created_at', { ascending: false }).limit(5)
    setNotices(data || [])
  }

  const fetchReminders = async () => {
    const { data } = await supabase.from('reminders').select('*')
      .eq('admin_id', (await supabase.auth.getUser()).data.user?.id)
      .order('created_at', { ascending: false })
    setReminders(data || [])
  }

  const fetchAttendance = async () => {
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase.from('attendance').select('is_present').eq('date', today)
    if (data && data.length > 0) {
      setAttendance({ present: data.filter(a => a.is_present).length, total: data.length })
    }
  }

  const fetchFees = async () => {
    const { data } = await supabase.from('fee_assignments').select('status, fee_structures(amount)')
    if (!data) return
    const today = new Date().toISOString().split('T')[0]
    let collected = 0, pending = 0, overdue = 0
    data.forEach(f => {
      const amt = f.fee_structures?.amount || 0
      if (f.status === 'paid') collected += amt
      else if (f.status === 'overdue') overdue += amt
      else pending += amt
    })
    setFees({ collected, pending, overdue })
  }

  const fetchActivity = async () => {
    const { data } = await supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(6)
    setActivityLogs(data || [])
  }

  const fetchClassDist = async () => {
    const { data } = await supabase.from('students').select('class_id, classes(name)')
    if (!data) return
    const map = {}
    data.forEach(s => {
      const name = `Class ${s.classes?.name || '?'}`
      map[name] = (map[name] || 0) + 1
    })
    setClassDistribution(Object.entries(map).map(([name, count]) => ({ name, count })).sort((a,b) => a.name.localeCompare(b.name)))
  }

  const addReminder = async () => {
    if (!newReminder.trim()) return
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase.from('reminders').insert({ message: newReminder.trim(), admin_id: user.id }).select().single()
    if (data) { setReminders([data, ...reminders]); setNewReminder('') }
  }

  const deleteReminder = async (id) => {
    await supabase.from('reminders').delete().eq('id', id)
    setReminders(reminders.filter(r => r.id !== id))
  }

  const toggleReminder = async (id, current) => {
    await supabase.from('reminders').update({ is_done: !current }).eq('id', id)
    setReminders(reminders.map(r => r.id === id ? { ...r, is_done: !current } : r))
  }

  const attPct = attendance.total > 0 ? Math.round((attendance.present / attendance.total) * 100) : null
  const totalFee = fees.collected + fees.pending + fees.overdue
  const feePct = totalFee > 0 ? Math.round((fees.collected / totalFee) * 100) : 0
  const maxClassCount = Math.max(...classDistribution.map(c => c.count), 1)

  const ACTION_ICONS = {
    'Student Created': '👤', 'Student Deleted': '🗑️', 'Teacher Created': '👨‍🏫',
    'Fee Collected': '💰', 'CSV Import': '📥', 'Paper Published': '📄',
    'Attendance Marked': '✅', 'Marks Uploaded': '🏆',
  }

  return (
    <div>
      <div style={S.pageHeader}>
        <h1 style={S.pageTitle}>Dashboard</h1>
        <p style={S.pageSubtitle}>Welcome back, {profile?.name} 👋</p>
      </div>

      {/* ── Stat Cards ── */}
      <div style={S.statsGrid}>
        {[
          { label:'Teachers',  value:stats.teachers, icon:'👨‍🏫', color:'#dbeafe', iconBg:'#3b82f6' },
          { label:'Students',  value:stats.students, icon:'👨‍🎓', color:'#fef9c3', iconBg:'#eab308' },
          { label:'Subjects',  value:stats.subjects, icon:'📚', color:'#dcfce7', iconBg:'#22c55e' },
          { label:'Exams',     value:stats.exams,    icon:'📝', color:'#fce7f3', iconBg:'#ec4899' },
          { label:'Notes',     value:stats.notes,    icon:'📋', color:'#ede9fe', iconBg:'#8b5cf6' },
          { label:'Notices',   value:stats.notices,  icon:'📢', color:'#fee2e2', iconBg:'#ef4444' },
        ].map(card => (
          <div key={card.label} style={{...S.statCard, backgroundColor:card.color}}>
            <div style={{...S.statIcon, backgroundColor:card.iconBg}}>{card.icon}</div>
            <div>
              <div style={S.statValue}>{loading?'...':card.value}</div>
              <div style={S.statLabel}>{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Metrics Row ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'16px', marginBottom:'20px' }}>

        {/* Attendance */}
        <div style={S.card}>
          <p style={S.cardTitle}>✅ Today's Attendance</p>
          {attPct === null ? (
            <p style={{ color:'#94a3b8', fontSize:'13px' }}>No attendance marked today</p>
          ) : (
            <>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'8px' }}>
                <span style={{ fontSize:'13px', color:'#64748b' }}>{attendance.present} / {attendance.total} present</span>
                <span style={{ fontSize:'20px', fontWeight:'800', color: attPct>75?'#16a34a':attPct>50?'#f59e0b':'#ef4444' }}>{attPct}%</span>
              </div>
              <div style={{ height:'8px', background:'#e2e8f0', borderRadius:'4px', overflow:'hidden' }}>
                <div style={{ width:`${attPct}%`, height:'100%', background: attPct>75?'#22c55e':attPct>50?'#f59e0b':'#ef4444', borderRadius:'4px' }} />
              </div>
            </>
          )}
        </div>

        {/* Fee Collection */}
        <div style={S.card}>
          <p style={S.cardTitle}>💰 Fee Collection</p>
          {totalFee === 0 ? (
            <p style={{ color:'#94a3b8', fontSize:'13px' }}>No fee data yet</p>
          ) : (
            <>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'8px' }}>
                <span style={{ fontSize:'13px', color:'#64748b' }}>₹{fees.collected.toLocaleString('en-IN')} collected</span>
                <span style={{ fontSize:'20px', fontWeight:'800', color:'#16a34a' }}>{feePct}%</span>
              </div>
              <div style={{ height:'8px', background:'#e2e8f0', borderRadius:'4px', overflow:'hidden' }}>
                <div style={{ width:`${feePct}%`, height:'100%', background:'#22c55e', borderRadius:'4px' }} />
              </div>
              <div style={{ display:'flex', gap:'12px', marginTop:'8px' }}>
                <span style={{ fontSize:'11px', color:'#f59e0b', fontWeight:'600' }}>⏳ ₹{fees.pending.toLocaleString('en-IN')} pending</span>
                <span style={{ fontSize:'11px', color:'#ef4444', fontWeight:'600' }}>⚠️ ₹{fees.overdue.toLocaleString('en-IN')} overdue</span>
              </div>
            </>
          )}
        </div>

        {/* Quick Info */}
        <div style={S.card}>
          <p style={S.cardTitle}>📊 Quick Info</p>
          <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
            {[
              { label:'Avg students/class', value: classDistribution.length > 0 ? Math.round(stats.students/classDistribution.length) : 0 },
              { label:'Total classes', value: classDistribution.length },
              { label:'Subjects per teacher', value: stats.teachers > 0 ? Math.round(stats.subjects/stats.teachers) : 0 },
            ].map(item => (
              <div key={item.label} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid #f1f5f9' }}>
                <span style={{ fontSize:'13px', color:'#64748b' }}>{item.label}</span>
                <span style={{ fontSize:'14px', fontWeight:'700', color:'#1e293b' }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Charts + Activity Row ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'20px' }}>

        {/* Class Distribution Bar Chart */}
        <div style={S.card}>
          <p style={S.cardTitle}>👥 Students by Class</p>
          {classDistribution.length === 0 ? (
            <p style={{ color:'#94a3b8', fontSize:'13px' }}>No student data</p>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
              {classDistribution.map((c, i) => {
                const colors = ['#6366f1','#22c55e','#f59e0b','#ef4444','#0ea5e9','#8b5cf6','#ec4899','#14b8a6']
                const color = colors[i % colors.length]
                const pct = Math.round((c.count / maxClassCount) * 100)
                return (
                  <div key={c.name}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'3px' }}>
                      <span style={{ fontSize:'12px', fontWeight:'600', color:'#374151' }}>{c.name}</span>
                      <span style={{ fontSize:'12px', fontWeight:'700', color }}>{c.count} students</span>
                    </div>
                    <div style={{ height:'8px', background:'#e2e8f0', borderRadius:'4px', overflow:'hidden' }}>
                      <div style={{ width:`${pct}%`, height:'100%', background:color, borderRadius:'4px', transition:'width 0.5s' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div style={S.card}>
          <p style={S.cardTitle}>📋 Recent Activity</p>
          {activityLogs.length === 0 ? (
            <p style={{ color:'#94a3b8', fontSize:'13px' }}>No activity yet</p>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
              {activityLogs.map(log => (
                <div key={log.id} style={{ display:'flex', gap:'10px', alignItems:'flex-start' }}>
                  <span style={{ fontSize:'18px', flexShrink:0 }}>{ACTION_ICONS[log.action] || '📌'}</span>
                  <div>
                    <p style={{ margin:0, fontSize:'13px', fontWeight:'600', color:'#1e293b' }}>{log.action}</p>
                    <p style={{ margin:'1px 0 0', fontSize:'11px', color:'#94a3b8' }}>
                      {log.performed_by_name} · {new Date(log.created_at).toLocaleDateString('en-IN', { day:'2-digit', month:'short' })}
                      {log.target_name ? ` · ${log.target_name}` : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom Row ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1.5fr 1fr', gap:'20px' }}>

        {/* Latest Notices */}
        <div style={S.card}>
          <p style={S.cardTitle}>📢 Latest Notices</p>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr>
                <th style={S.th}>Title</th>
                <th style={S.th}>Date</th>
                <th style={S.th}>Target</th>
              </tr>
            </thead>
            <tbody>
              {notices.length === 0 ? (
                <tr><td colSpan={3} style={{ padding:'20px', textAlign:'center', color:'#94a3b8', fontSize:'13px' }}>No notices</td></tr>
              ) : notices.map(n => (
                <tr key={n.id}>
                  <td style={S.td}>
                    <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                      <span style={{ width:'8px', height:'8px', borderRadius:'50%', background: n.importance==='green'?'#22c55e':n.importance==='yellow'?'#eab308':'#ef4444', flexShrink:0, display:'inline-block' }} />
                      {n.title}
                    </div>
                  </td>
                  <td style={S.td}>{new Date(n.created_at).toLocaleDateString('en-IN',{day:'2-digit',month:'short'})}</td>
                  <td style={S.td}><span style={{ textTransform:'capitalize', background:'#f1f5f9', padding:'2px 8px', borderRadius:'8px', fontSize:'11px', fontWeight:'600' }}>{n.target||'all'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Reminders */}
        <div style={S.card}>
          <p style={S.cardTitle}>🔔 Reminders</p>
          <div style={{ display:'flex', gap:'8px', marginBottom:'12px' }}>
            <input style={{ flex:1, padding:'8px 12px', borderRadius:'8px', border:'1px solid #e5e7eb', fontSize:'13px', outline:'none' }}
              placeholder="Add a reminder..." value={newReminder}
              onChange={e=>setNewReminder(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&addReminder()} />
            <button style={{ padding:'8px 14px', backgroundColor:'#4f46e5', color:'#fff', border:'none', borderRadius:'8px', fontSize:'18px', cursor:'pointer', fontWeight:'600' }} onClick={addReminder}>+</button>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
            {reminders.length === 0 ? (
              <p style={{ color:'#94a3b8', fontSize:'13px', textAlign:'center', padding:'16px 0' }}>No reminders yet</p>
            ) : reminders.map(r => (
              <div key={r.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 12px', backgroundColor:'#f9fafb', borderRadius:'8px', borderLeft:`4px solid ${r.is_done?'#22c55e':'#eab308'}` }}>
                <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                  <button style={{ background:'none', border:'none', cursor:'pointer', fontSize:'16px', padding:0 }} onClick={()=>toggleReminder(r.id, r.is_done)}>
                    {r.is_done?'✅':'⭕'}
                  </button>
                  <span style={{ fontSize:'14px', textDecoration:r.is_done?'line-through':'none', color:r.is_done?'#9ca3af':'#374151' }}>{r.message}</span>
                </div>
                <button style={{ background:'none', border:'none', cursor:'pointer', fontSize:'16px', color:'#ef4444' }} onClick={()=>deleteReminder(r.id)}>🗑</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

const S = {
  pageHeader:  { marginBottom:'24px' },
  pageTitle:   { fontSize:'28px', fontWeight:'700', color:'#1a1a2e', margin:0 },
  pageSubtitle:{ color:'#6b7280', fontSize:'14px', marginTop:'4px' },
  statsGrid:   { display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:'12px', marginBottom:'20px' },
  statCard:    { borderRadius:'12px', padding:'16px', display:'flex', alignItems:'center', gap:'12px' },
  statIcon:    { width:'44px', height:'44px', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px', flexShrink:0 },
  statValue:   { fontSize:'24px', fontWeight:'700', color:'#1a1a2e' },
  statLabel:   { fontSize:'12px', color:'#6b7280' },
  card:        { backgroundColor:'#fff', borderRadius:'12px', padding:'20px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' },
  cardTitle:   { margin:'0 0 14px', fontSize:'14px', fontWeight:'700', color:'#1a1a2e' },
  th:          { textAlign:'left', fontSize:'12px', color:'#6b7280', fontWeight:'600', padding:'8px 10px', borderBottom:'1px solid #f3f4f6' },
  td:          { padding:'10px', fontSize:'13px', color:'#374151', borderBottom:'1px solid #f9fafb' },
}
