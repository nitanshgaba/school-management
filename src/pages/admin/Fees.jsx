// src/pages/admin/Fees.jsx
import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'

const SESSION = '2024-25'

function genReceiptNo() {
  const yr = new Date().getFullYear()
  const rand = String(Math.floor(Math.random()*90000)+10000)
  return `RCP-${yr}-${rand}`
}

export default function AdminFees() {
  const { profile } = useAuth()
  const [tab, setTab] = useState('overview')
  const [classes, setClasses] = useState([])
  const [structures, setStructures] = useState([])
  const [assignments, setAssignments] = useState([])
  const [students, setStudents] = useState([])
  const [selClass, setSelClass] = useState('')
  const [selStatus, setSelStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [payModal, setPayModal] = useState(null)
  const [receiptData, setReceiptData] = useState(null)
  const [form, setForm] = useState({ name:'', class_id:'', amount:'', frequency:'monthly', category:'tuition', due_day:10, academic_session:SESSION })
  const [payForm, setPayForm] = useState({ mode:'cash', notes:'' })

  useEffect(() => { loadClasses(); loadStructures(); loadAssignments() }, [])
  useEffect(() => { if (tab === 'overview' || tab === 'collections') loadAssignments() }, [tab])

  const sb = async () => { const { supabase } = await import('../../lib/supabase'); return supabase }

  const loadClasses = async () => {
    const s = await sb()
    const { data } = await s.from('classes').select('*').order('name')
    setClasses(data || [])
  }

  const loadStructures = async () => {
    const s = await sb()
    const { data } = await s.from('fee_structures').select('*, classes(name)').order('created_at', { ascending: false })
    setStructures(data || [])
  }

  const loadAssignments = async () => {
    setLoading(true)
    const s = await sb()
    const { data } = await s.from('fee_assignments')
      .select('*, fee_structures(name, amount, category, frequency, classes(name)), students(id, roll_no, profiles(name))')
      .order('due_date', { ascending: true })
    // Auto-mark overdue
    const today = new Date().toISOString().split('T')[0]
    const updated = (data||[]).map(a => ({
      ...a,
      status: a.status === 'pending' && a.due_date < today ? 'overdue' : a.status
    }))
    setAssignments(updated)
    setLoading(false)
  }

  const saveStructure = async () => {
    if (!form.name || !form.class_id || !form.amount) { alert('Fill all fields'); return }
    const s = await sb()
    if (editItem) {
      await s.from('fee_structures').update({ ...form, class_id: parseInt(form.class_id), amount: parseFloat(form.amount) }).eq('id', editItem.id)
    } else {
      await s.from('fee_structures').insert({ ...form, class_id: parseInt(form.class_id), amount: parseFloat(form.amount) })
    }
    setShowForm(false); setEditItem(null)
    setForm({ name:'', class_id:'', amount:'', frequency:'monthly', category:'tuition', due_day:10, academic_session:SESSION })
    loadStructures()
  }

  const deleteStructure = async (id) => {
    if (!confirm('Delete this fee structure?')) return
    const s = await sb()
    await s.from('fee_structures').delete().eq('id', id)
    loadStructures()
  }

  const assignToClass = async (structure) => {
    const s = await sb()
    const { data: studs } = await s.from('students').select('id').eq('class_id', structure.class_id)
    if (!studs || studs.length === 0) { alert('No students in this class'); return }
    const today = new Date()
    const dueDate = new Date(today.getFullYear(), today.getMonth(), structure.due_day).toISOString().split('T')[0]
    const rows = studs.map(st => ({
      student_id: st.id,
      fee_structure_id: structure.id,
      due_date: dueDate,
      status: 'pending',
      academic_session: SESSION
    }))
    await s.from('fee_assignments').insert(rows)
    alert(`Assigned to ${studs.length} students`)
    loadAssignments()
  }

  const markPaid = async () => {
    const s = await sb()
    const rcpt = genReceiptNo()
    await s.from('fee_payments').insert({
      fee_assignment_id: payModal.id,
      student_id: payModal.students?.id,
      amount: payModal.fee_structures?.amount,
      mode: payForm.mode,
      paid_date: new Date().toISOString().split('T')[0],
      receipt_no: rcpt,
      collected_by: profile.id,
      notes: payForm.notes
    })
    await s.from('fee_assignments').update({ status: 'paid' }).eq('id', payModal.id)
    const rec = {
      receiptNo: rcpt,
      studentName: payModal.students?.profiles?.name,
      rollNo: payModal.students?.roll_no,
      className: payModal.fee_structures?.classes?.name,
      feeName: payModal.fee_structures?.name,
      category: payModal.fee_structures?.category,
      amount: payModal.fee_structures?.amount,
      mode: payForm.mode,
      notes: payForm.notes,
      paidDate: new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' }),
      collectedBy: profile?.name,
      session: SESSION
    }
    setPayModal(null)
    setPayForm({ mode:'cash', notes:'' })
    setReceiptData(rec)
    loadAssignments()
  }

  const printReceipt = () => {
    const w = window.open('', '_blank')
    w.document.write(`
      <html><head><title>Fee Receipt</title><style>
        body { font-family: Arial, sans-serif; padding: 40px; max-width: 600px; margin: 0 auto; }
        .header { text-align: center; border-bottom: 3px double #1a1a2e; padding-bottom: 16px; margin-bottom: 20px; }
        .logo { width: 70px; height: 70px; border: 2px dashed #ccc; border-radius: 50%; margin: 0 auto 10px; display: flex; align-items: center; justify-content: center; font-size: 11px; color: #999; line-height: 1.2; text-align: center; }
        h1 { margin: 0; font-size: 22px; color: #1a1a2e; } h3 { margin: 4px 0 0; color: #6b7280; font-size: 14px; font-weight: 400; }
        .receipt-no { background: #f1f5f9; padding: 8px 16px; border-radius: 6px; font-size: 13px; margin-bottom: 20px; display: flex; justify-content: space-between; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        td { padding: 10px 8px; border-bottom: 1px solid #f3f4f6; font-size: 14px; }
        td:first-child { color: #6b7280; width: 45%; }
        td:last-child { font-weight: 600; color: #1a1a2e; }
        .amount-row td { font-size: 18px; font-weight: 800; color: #16a34a; border-bottom: 2px solid #1a1a2e; }
        .footer { display: flex; justify-content: space-between; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
        .sig { text-align: center; }
        .sig-line { border-top: 1px solid #374151; width: 140px; margin: 0 auto 6px; }
        .sig p { margin: 0; font-size: 12px; color: #6b7280; }
        .badge { display: inline-block; background: #dcfce7; color: #16a34a; padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 700; }
        @media print { body { padding: 20px; } }
      </style></head><body>
      <div class="header">
        <div class="logo">SCHOOL<br/>LOGO</div>
        <h1>Sunrise Public School</h1>
        <h3>Fee Payment Receipt</h3>
      </div>
      <div class="receipt-no">
        <span>Receipt No: <strong>${receiptData.receiptNo}</strong></span>
        <span>Session: <strong>${receiptData.session}</strong></span>
      </div>
      <table>
        <tr><td>Student Name</td><td>${receiptData.studentName}</td></tr>
        <tr><td>Roll No</td><td>${receiptData.rollNo}</td></tr>
        <tr><td>Class</td><td>Class ${receiptData.className}</td></tr>
        <tr><td>Fee Type</td><td>${receiptData.feeName} <span class="badge">${receiptData.category}</span></td></tr>
        <tr><td>Payment Date</td><td>${receiptData.paidDate}</td></tr>
        <tr><td>Payment Mode</td><td style="text-transform:capitalize">${receiptData.mode}</td></tr>
        ${receiptData.notes ? `<tr><td>Notes</td><td>${receiptData.notes}</td></tr>` : ''}
        <tr class="amount-row"><td>Amount Paid</td><td>₹ ${receiptData.amount}</td></tr>
      </table>
      <div class="footer">
        <div class="sig"><div class="sig-line"></div><p>Student/Parent Signature</p></div>
        <div class="sig"><div class="sig-line"></div><p>Collected By: ${receiptData.collectedBy}</p></div>
      </div>
      <script>window.onload=()=>{window.print()}<\/script>
      </body></html>
    `)
    w.document.close()
  }

  // Stats
  const total     = assignments.length
  const paid      = assignments.filter(a=>a.status==='paid').length
  const pending   = assignments.filter(a=>a.status==='pending').length
  const overdue   = assignments.filter(a=>a.status==='overdue').length
  const collected = assignments.filter(a=>a.status==='paid').reduce((s,a)=>s+(a.fee_structures?.amount||0),0)
  const outstanding = assignments.filter(a=>a.status!=='paid').reduce((s,a)=>s+(a.fee_structures?.amount||0),0)

  const filtered = assignments.filter(a => {
    const classMatch  = !selClass  || String(a.fee_structures?.classes?.name) === selClass
    const statusMatch = !selStatus || a.status === selStatus
    return classMatch && statusMatch
  })

  const statusStyle = (s) => ({
    pending:  { bg:'#fffbeb', color:'#d97706', border:'#fde68a' },
    paid:     { bg:'#f0fdf4', color:'#16a34a', border:'#86efac' },
    overdue:  { bg:'#fef2f2', color:'#dc2626', border:'#fca5a5' },
  }[s] || { bg:'#f8fafc', color:'#64748b', border:'#e2e8f0' })

  return (
    <div style={S.page}>
      <div style={S.header}>
        <h2 style={S.title}>💰 Fee Management</h2>
        <p style={S.sub}>Manage fee structures, collections, and receipts</p>
      </div>

      <div style={S.tabs}>
        {[['overview','📊 Overview'],['structures','🏗️ Fee Structures'],['collections','💳 Collections']].map(([t,l])=>(
          <button key={t} onClick={()=>setTab(t)} style={{...S.tab,...(tab===t?S.tabActive:{})}}>{l}</button>
        ))}
      </div>

      {/* ── Overview ── */}
      {tab==='overview' && (
        <div>
          <div style={S.statsGrid}>
            {[
              { label:'Total Assigned', value:total,                    color:'#6366f1', bg:'#eef2ff', icon:'📋' },
              { label:'Paid',           value:paid,                     color:'#16a34a', bg:'#f0fdf4', icon:'✅' },
              { label:'Pending',        value:pending,                  color:'#d97706', bg:'#fffbeb', icon:'⏳' },
              { label:'Overdue',        value:overdue,                  color:'#dc2626', bg:'#fef2f2', icon:'⚠️' },
              { label:'Total Collected',value:`₹${collected.toLocaleString('en-IN')}`, color:'#16a34a', bg:'#f0fdf4', icon:'💵' },
              { label:'Outstanding',    value:`₹${outstanding.toLocaleString('en-IN')}`, color:'#dc2626', bg:'#fef2f2', icon:'📌' },
            ].map(s=>(
              <div key={s.label} style={{...S.statCard, background:s.bg}}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <p style={{ margin:0, fontSize:'12px', color:'#6b7280', fontWeight:'700', textTransform:'uppercase' }}>{s.label}</p>
                  <span style={{ fontSize:'20px' }}>{s.icon}</span>
                </div>
                <p style={{ margin:'8px 0 0', fontSize:'26px', fontWeight:'800', color:s.color }}>{s.value}</p>
              </div>
            ))}
          </div>

          {overdue > 0 && (
            <div style={{ background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:'10px', padding:'14px 18px', display:'flex', gap:'10px', alignItems:'center' }}>
              <span style={{ fontSize:'20px' }}>⚠️</span>
              <p style={{ margin:0, fontSize:'14px', color:'#dc2626', fontWeight:'600' }}>
                {overdue} fee payment{overdue>1?'s are':' is'} overdue — collect immediately.
              </p>
            </div>
          )}

          <div style={{ background:'#fff', borderRadius:'12px', padding:'20px', marginTop:'16px', boxShadow:'0 1px 4px rgba(0,0,0,0.07)' }}>
            <p style={{ margin:'0 0 14px', fontWeight:'700', color:'#374151' }}>Collection by Category</p>
            {['tuition','transport','library','exam','other'].map(cat => {
              const catPaid = assignments.filter(a=>a.status==='paid' && a.fee_structures?.category===cat).reduce((s,a)=>s+(a.fee_structures?.amount||0),0)
              const catTotal = assignments.filter(a=>a.fee_structures?.category===cat).reduce((s,a)=>s+(a.fee_structures?.amount||0),0)
              if (catTotal === 0) return null
              const pct = Math.round((catPaid/catTotal)*100)
              const colors = { tuition:'#6366f1', transport:'#f59e0b', library:'#0ea5e9', exam:'#8b5cf6', other:'#64748b' }
              return (
                <div key={cat} style={{ marginBottom:'12px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'4px' }}>
                    <span style={{ fontSize:'13px', fontWeight:'600', color:'#374151', textTransform:'capitalize' }}>{cat}</span>
                    <span style={{ fontSize:'13px', color:'#6b7280' }}>₹{catPaid.toLocaleString('en-IN')} / ₹{catTotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ height:'8px', background:'#e2e8f0', borderRadius:'4px', overflow:'hidden' }}>
                    <div style={{ width:`${pct}%`, height:'100%', background:colors[cat], borderRadius:'4px' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Fee Structures ── */}
      {tab==='structures' && (
        <div>
          <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:'16px' }}>
            <button style={S.btnPrimary} onClick={()=>{ setShowForm(true); setEditItem(null) }}>+ Add Fee Structure</button>
          </div>

          {showForm && (
            <div style={S.formCard}>
              <h3 style={{ margin:'0 0 16px', fontSize:'16px', fontWeight:'700', color:'#1e293b' }}>{editItem?'Edit':'New'} Fee Structure</h3>
              <div style={S.formGrid}>
                <div>
                  <label style={S.label}>Fee Name</label>
                  <input style={S.input} placeholder="e.g. Monthly Tuition" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} />
                </div>
                <div>
                  <label style={S.label}>Class</label>
                  <select style={S.input} value={form.class_id} onChange={e=>setForm({...form,class_id:e.target.value})}>
                    <option value="">Select Class</option>
                    {classes.map(c=><option key={c.id} value={c.id}>Class {c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={S.label}>Amount (₹)</label>
                  <input style={S.input} type="number" placeholder="0" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} />
                </div>
                <div>
                  <label style={S.label}>Category</label>
                  <select style={S.input} value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>
                    {['tuition','transport','library','exam','other'].map(c=><option key={c} value={c} style={{textTransform:'capitalize'}}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={S.label}>Frequency</label>
                  <select style={S.input} value={form.frequency} onChange={e=>setForm({...form,frequency:e.target.value})}>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="annually">Annually</option>
                  </select>
                </div>
                <div>
                  <label style={S.label}>Due Day of Month</label>
                  <input style={S.input} type="number" min="1" max="28" value={form.due_day} onChange={e=>setForm({...form,due_day:parseInt(e.target.value)})} />
                </div>
              </div>
              <div style={{ display:'flex', gap:'10px', marginTop:'16px' }}>
                <button style={S.btnPrimary} onClick={saveStructure}>💾 Save</button>
                <button style={S.btnGhost} onClick={()=>{ setShowForm(false); setEditItem(null) }}>Cancel</button>
              </div>
            </div>
          )}

          {structures.length === 0 ? (
            <div style={S.empty}><span style={{fontSize:'36px'}}>📋</span><p>No fee structures yet. Add one above.</p></div>
          ) : (
            <div style={{ background:'#fff', borderRadius:'12px', overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,0.07)' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr>{['Name','Class','Category','Frequency','Amount','Due Day','Session','Actions'].map(h=>(
                    <th key={h} style={S.th}>{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {structures.map(st=>(
                    <tr key={st.id}>
                      <td style={{...S.td, fontWeight:'600'}}>{st.name}</td>
                      <td style={S.td}>Class {st.classes?.name}</td>
                      <td style={S.td}><span style={{ textTransform:'capitalize', background:'#f1f5f9', padding:'2px 8px', borderRadius:'10px', fontSize:'12px', fontWeight:'600' }}>{st.category}</span></td>
                      <td style={S.td}><span style={{ textTransform:'capitalize' }}>{st.frequency}</span></td>
                      <td style={{...S.td, fontWeight:'700', color:'#16a34a'}}>₹{Number(st.amount).toLocaleString('en-IN')}</td>
                      <td style={S.td}>{st.due_day}th</td>
                      <td style={S.td}>{st.academic_session}</td>
                      <td style={S.td}>
                        <div style={{ display:'flex', gap:'6px' }}>
                          <button style={S.btnSm} onClick={()=>assignToClass(st)}>📤 Assign</button>
                          <button style={{...S.btnSm, background:'#fffbeb', color:'#d97706'}} onClick={()=>{ setEditItem(st); setForm({...st, class_id:String(st.class_id)}); setShowForm(true) }}>✏️</button>
                          <button style={{...S.btnSm, background:'#fef2f2', color:'#dc2626'}} onClick={()=>deleteStructure(st.id)}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Collections ── */}
      {tab==='collections' && (
        <div>
          <div style={{ display:'flex', gap:'12px', marginBottom:'16px', flexWrap:'wrap' }}>
            <select style={S.select} value={selClass} onChange={e=>setSelClass(e.target.value)}>
              <option value="">All Classes</option>
              {classes.map(c=><option key={c.id} value={c.name}>Class {c.name}</option>)}
            </select>
            <select style={S.select} value={selStatus} onChange={e=>setSelStatus(e.target.value)}>
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>

          {loading ? <div style={S.empty}>Loading...</div> : filtered.length === 0 ? (
            <div style={S.empty}><span style={{fontSize:'36px'}}>📭</span><p>No records found.</p></div>
          ) : (
            <div style={{ background:'#fff', borderRadius:'12px', overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,0.07)' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr>{['Student','Class','Fee','Category','Amount','Due Date','Status','Action'].map(h=>(
                    <th key={h} style={S.th}>{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {filtered.map(a=>{
                    const ss = statusStyle(a.status)
                    return (
                      <tr key={a.id}>
                        <td style={{...S.td, fontWeight:'600'}}>{a.students?.profiles?.name}</td>
                        <td style={S.td}>Class {a.fee_structures?.classes?.name}</td>
                        <td style={S.td}>{a.fee_structures?.name}</td>
                        <td style={S.td}><span style={{ textTransform:'capitalize', background:'#f1f5f9', padding:'2px 8px', borderRadius:'10px', fontSize:'12px', fontWeight:'600' }}>{a.fee_structures?.category}</span></td>
                        <td style={{...S.td, fontWeight:'700', color:'#16a34a'}}>₹{Number(a.fee_structures?.amount||0).toLocaleString('en-IN')}</td>
                        <td style={S.td}>{a.due_date}</td>
                        <td style={S.td}>
                          <span style={{ background:ss.bg, color:ss.color, border:`1px solid ${ss.border}`, padding:'3px 10px', borderRadius:'12px', fontSize:'12px', fontWeight:'700', textTransform:'capitalize' }}>
                            {a.status}
                          </span>
                        </td>
                        <td style={S.td}>
                          {a.status !== 'paid' ? (
                            <button style={{...S.btnSm, background:'#f0fdf4', color:'#16a34a'}} onClick={()=>setPayModal(a)}>💳 Collect</button>
                          ) : (
                            <span style={{ fontSize:'12px', color:'#94a3b8' }}>✅ Paid</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Pay Modal ── */}
      {payModal && (
        <div style={S.overlay} onClick={()=>setPayModal(null)}>
          <div style={S.modal} onClick={e=>e.stopPropagation()}>
            <h3 style={{ margin:'0 0 4px', fontSize:'18px', fontWeight:'800', color:'#1e293b' }}>💳 Collect Payment</h3>
            <p style={{ margin:'0 0 20px', color:'#64748b', fontSize:'14px' }}>{payModal.students?.profiles?.name} — {payModal.fee_structures?.name}</p>
            <div style={{ background:'#f8fafc', borderRadius:'10px', padding:'14px', marginBottom:'16px' }}>
              <div style={{ display:'flex', justifyContent:'space-between' }}>
                <span style={{ fontSize:'13px', color:'#6b7280' }}>Amount Due</span>
                <span style={{ fontSize:'20px', fontWeight:'800', color:'#16a34a' }}>₹{Number(payModal.fee_structures?.amount||0).toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', marginTop:'6px' }}>
                <span style={{ fontSize:'13px', color:'#6b7280' }}>Due Date</span>
                <span style={{ fontSize:'13px', fontWeight:'600', color:'#374151' }}>{payModal.due_date}</span>
              </div>
            </div>
            <div style={{ marginBottom:'12px' }}>
              <label style={S.label}>Payment Mode</label>
              <select style={S.input} value={payForm.mode} onChange={e=>setPayForm({...payForm,mode:e.target.value})}>
                <option value="cash">💵 Cash</option>
                <option value="online">💻 Online</option>
                <option value="cheque">🏦 Cheque</option>
              </select>
            </div>
            <div style={{ marginBottom:'16px' }}>
              <label style={S.label}>Notes (optional)</label>
              <input style={S.input} placeholder="Cheque no, transaction ID etc." value={payForm.notes} onChange={e=>setPayForm({...payForm,notes:e.target.value})} />
            </div>
            <div style={{ display:'flex', gap:'10px' }}>
              <button style={{...S.btnPrimary, background:'#16a34a'}} onClick={markPaid}>✅ Mark as Paid</button>
              <button style={S.btnGhost} onClick={()=>setPayModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Receipt Modal ── */}
      {receiptData && (
        <div style={S.overlay} onClick={()=>setReceiptData(null)}>
          <div style={{...S.modal, maxWidth:'460px'}} onClick={e=>e.stopPropagation()}>
            <div style={{ textAlign:'center', marginBottom:'16px' }}>
              <span style={{ fontSize:'40px' }}>🧾</span>
              <h3 style={{ margin:'8px 0 4px', fontSize:'18px', fontWeight:'800', color:'#1e293b' }}>Payment Successful!</h3>
              <p style={{ margin:0, color:'#64748b', fontSize:'14px' }}>Receipt generated successfully</p>
            </div>
            <div style={{ background:'#f8fafc', borderRadius:'10px', padding:'16px', marginBottom:'16px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'8px' }}>
                <span style={{ fontSize:'12px', color:'#6b7280', fontWeight:'600' }}>RECEIPT NO</span>
                <span style={{ fontSize:'13px', fontWeight:'800', color:'#6366f1' }}>{receiptData.receiptNo}</span>
              </div>
              {[['Student', receiptData.studentName],['Fee', receiptData.feeName],['Amount', `₹${Number(receiptData.amount).toLocaleString('en-IN')}`],['Mode', receiptData.mode],['Date', receiptData.paidDate]].map(([k,v])=>(
                <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid #f1f5f9' }}>
                  <span style={{ fontSize:'13px', color:'#6b7280' }}>{k}</span>
                  <span style={{ fontSize:'13px', fontWeight:'600', color:'#374151', textTransform:'capitalize' }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ display:'flex', gap:'10px' }}>
              <button style={{...S.btnPrimary, flex:1}} onClick={printReceipt}>🖨️ Print Receipt</button>
              <button style={{...S.btnGhost, flex:1}} onClick={()=>setReceiptData(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const S = {
  page:      { maxWidth:'1000px', margin:'0 auto' },
  header:    { marginBottom:'20px' },
  title:     { margin:0, fontSize:'22px', fontWeight:'800', color:'#1e293b' },
  sub:       { margin:'4px 0 0', color:'#64748b', fontSize:'14px' },
  tabs:      { display:'flex', gap:'8px', marginBottom:'20px' },
  tab:       { padding:'8px 20px', borderRadius:'8px', border:'1px solid #e2e8f0', background:'#fff', cursor:'pointer', fontSize:'14px', fontWeight:'600', color:'#64748b' },
  tabActive: { background:'#4f46e5', color:'#fff', border:'1px solid #4f46e5' },
  statsGrid: { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px', marginBottom:'16px' },
  statCard:  { borderRadius:'10px', padding:'16px', boxShadow:'0 1px 3px rgba(0,0,0,0.06)' },
  formCard:  { background:'#fff', borderRadius:'12px', padding:'20px', marginBottom:'20px', boxShadow:'0 1px 4px rgba(0,0,0,0.07)' },
  formGrid:  { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px' },
  label:     { display:'block', fontSize:'12px', fontWeight:'700', color:'#6b7280', marginBottom:'6px', textTransform:'uppercase' },
  input:     { width:'100%', padding:'9px 12px', borderRadius:'8px', border:'1px solid #e2e8f0', fontSize:'14px', outline:'none', boxSizing:'border-box', background:'#fff' },
  select:    { padding:'9px 12px', borderRadius:'8px', border:'1px solid #e2e8f0', fontSize:'14px', background:'#fff', outline:'none' },
  btnPrimary:{ padding:'10px 20px', background:'#4f46e5', color:'#fff', border:'none', borderRadius:'8px', fontSize:'14px', fontWeight:'700', cursor:'pointer' },
  btnGhost:  { padding:'10px 20px', background:'#f1f5f9', color:'#374151', border:'none', borderRadius:'8px', fontSize:'14px', fontWeight:'600', cursor:'pointer' },
  btnSm:     { padding:'5px 10px', background:'#f1f5f9', color:'#374151', border:'none', borderRadius:'6px', fontSize:'12px', fontWeight:'600', cursor:'pointer' },
  th:        { padding:'12px 16px', fontSize:'12px', fontWeight:'700', color:'#6b7280', textTransform:'uppercase', background:'#f8fafc', textAlign:'left', borderBottom:'2px solid #f1f5f9' },
  td:        { padding:'12px 16px', fontSize:'14px', color:'#374151', borderBottom:'1px solid #f8fafc' },
  empty:     { textAlign:'center', padding:'60px', color:'#94a3b8' },
  overlay:   { position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 },
  modal:     { background:'#fff', borderRadius:'16px', padding:'28px', width:'440px', maxWidth:'90vw', boxShadow:'0 20px 60px rgba(0,0,0,0.2)' },
}
