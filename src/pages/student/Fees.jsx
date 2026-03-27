// src/pages/student/Fees.jsx
import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'

export default function StudentFees() {
  const { profile } = useAuth()
  const [assignments, setAssignments] = useState([])
  const [payments,    setPayments]    = useState([])
  const [loading,     setLoading]     = useState(true)
  const [tab,         setTab]         = useState('dues')

  useEffect(() => { loadData() }, [])

  const sb = async () => { const { supabase } = await import('../../lib/supabase'); return supabase }

  const loadData = async () => {
    setLoading(true)
    const s = await sb()
    const today = new Date().toISOString().split('T')[0]
    // Get actual student record id (different from profile.id)
    const { data: studentRec } = await s.from('students').select('id').eq('id', profile.id).single()
    const studentId = studentRec?.id || profile.id
    const { data: asgn } = await s.from('fee_assignments')
      .select('*, fee_structures(name, amount, category, frequency, classes(name))')
      .eq('student_id', studentId)
      .order('due_date', { ascending: true })
    const { data: pays } = await s.from('fee_payments')
      .select('*, fee_assignments(fee_structures(name, category))')
      .eq('student_id', studentId)
      .order('paid_date', { ascending: false })
    const updated = (asgn||[]).map(a => ({
      ...a,
      status: a.status === 'pending' && a.due_date < today ? 'overdue' : a.status
    }))
    setAssignments(updated)
    setPayments(pays || [])
    setLoading(false)
  }

  const printReceipt = (pay) => {
    const w = window.open('', '_blank')
    w.document.write(`
      <html><head><title>Fee Receipt</title><style>
        body { font-family: Arial, sans-serif; padding: 40px; max-width: 600px; margin: 0 auto; }
        .header { text-align: center; border-bottom: 3px double #1a1a2e; padding-bottom: 16px; margin-bottom: 20px; }
        .logo { width: 70px; height: 70px; border: 2px dashed #ccc; border-radius: 50%; margin: 0 auto 10px; display: flex; align-items: center; justify-content: center; font-size: 11px; color: #999; text-align:center; line-height:1.3; }
        h1 { margin: 0; font-size: 22px; color: #1a1a2e; }
        h3 { margin: 4px 0 0; color: #6b7280; font-size: 14px; font-weight: 400; }
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
        @media print { body { padding: 20px; } }
      </style></head><body>
      <div class="header">
        <div class="logo">SCHOOL<br/>LOGO</div>
        <h1>Sunrise Public School</h1>
        <h3>Fee Payment Receipt</h3>
      </div>
      <div class="receipt-no">
        <span>Receipt No: <strong>${pay.receipt_no}</strong></span>
        <span>Date: <strong>${pay.paid_date}</strong></span>
      </div>
      <table>
        <tr><td>Fee Type</td><td>${pay.fee_assignments?.fee_structures?.name || '—'}</td></tr>
        <tr><td>Category</td><td style="text-transform:capitalize">${pay.fee_assignments?.fee_structures?.category || '—'}</td></tr>
        <tr><td>Payment Mode</td><td style="text-transform:capitalize">${pay.mode}</td></tr>
        ${pay.notes ? `<tr><td>Notes</td><td>${pay.notes}</td></tr>` : ''}
        <tr class="amount-row"><td>Amount Paid</td><td>₹ ${Number(pay.amount).toLocaleString('en-IN')}</td></tr>
      </table>
      <div class="footer">
        <div class="sig"><div class="sig-line"></div><p>Student Signature</p></div>
        <div class="sig"><div class="sig-line"></div><p>School Stamp</p></div>
      </div>
      <script>window.onload=()=>{window.print()}<\/script>
      </body></html>
    `)
    w.document.close()
  }

  const totalDue  = assignments.filter(a=>a.status!=='paid').reduce((s,a)=>s+(Number(a.fee_structures?.amount)||0),0)
  const totalPaid = payments.reduce((s,p)=>s+(Number(p.amount)||0),0)

  const statusStyle = (s) => ({
    pending: { bg:'#fffbeb', color:'#d97706', border:'#fde68a' },
    paid:    { bg:'#f0fdf4', color:'#16a34a', border:'#86efac' },
    overdue: { bg:'#fef2f2', color:'#dc2626', border:'#fca5a5' },
  }[s] || { bg:'#f8fafc', color:'#64748b', border:'#e2e8f0' })

  return (
    <div style={S.page}>
      <div style={S.header}>
        <h2 style={S.title}>💰 My Fees</h2>
        <p style={S.sub}>View dues, payment history and download receipts</p>
      </div>

      <div style={S.summaryRow}>
        {[
          { label:'Total Due',     value:`₹${totalDue.toLocaleString('en-IN')}`,  color:'#dc2626', bg:'#fef2f2', icon:'📌' },
          { label:'Total Paid',    value:`₹${totalPaid.toLocaleString('en-IN')}`, color:'#16a34a', bg:'#f0fdf4', icon:'✅' },
          { label:'Transactions',  value:payments.length,                          color:'#6366f1', bg:'#eef2ff', icon:'🧾' },
        ].map(s=>(
          <div key={s.label} style={{...S.statCard, background:s.bg}}>
            <div style={{ display:'flex', justifyContent:'space-between' }}>
              <p style={{ margin:0, fontSize:'12px', color:'#6b7280', fontWeight:'700', textTransform:'uppercase' }}>{s.label}</p>
              <span>{s.icon}</span>
            </div>
            <p style={{ margin:'8px 0 0', fontSize:'24px', fontWeight:'800', color:s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div style={S.tabs}>
        {[['dues','⏳ Dues'],['history','🧾 Payment History']].map(([t,l])=>(
          <button key={t} onClick={()=>setTab(t)} style={{...S.tab,...(tab===t?S.tabActive:{})}}>{l}</button>
        ))}
      </div>

      {loading && <div style={S.empty}>Loading...</div>}

      {!loading && tab==='dues' && (
        assignments.length === 0 ? (
          <div style={S.empty}><span style={{fontSize:'40px'}}>🎉</span><p>No fee dues! You are all clear.</p></div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            {assignments.map(a => {
              const ss = statusStyle(a.status)
              return (
                <div key={a.id} style={S.card}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div>
                      <p style={{ margin:0, fontWeight:'700', fontSize:'15px', color:'#1e293b' }}>{a.fee_structures?.name}</p>
                      <p style={{ margin:'3px 0 0', fontSize:'13px', color:'#64748b' }}>
                        Class {a.fee_structures?.classes?.name} · <span style={{ textTransform:'capitalize' }}>{a.fee_structures?.category}</span> · <span style={{ textTransform:'capitalize' }}>{a.fee_structures?.frequency}</span>
                      </p>
                      <p style={{ margin:'3px 0 0', fontSize:'12px', color:'#94a3b8' }}>Due: {a.due_date}</p>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <p style={{ margin:'0 0 6px', fontSize:'22px', fontWeight:'800', color:'#16a34a' }}>₹{Number(a.fee_structures?.amount||0).toLocaleString('en-IN')}</p>
                      <span style={{ background:ss.bg, color:ss.color, border:`1px solid ${ss.border}`, padding:'3px 10px', borderRadius:'12px', fontSize:'12px', fontWeight:'700', textTransform:'capitalize' }}>
                        {a.status}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )
      )}

      {!loading && tab==='history' && (
        payments.length === 0 ? (
          <div style={S.empty}><span style={{fontSize:'40px'}}>📭</span><p>No payments yet.</p></div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            {payments.map(pay=>(
              <div key={pay.id} style={S.card}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div>
                    <p style={{ margin:0, fontWeight:'700', fontSize:'15px', color:'#1e293b' }}>{pay.fee_assignments?.fee_structures?.name || '—'}</p>
                    <p style={{ margin:'3px 0 0', fontSize:'13px', color:'#64748b' }}>
                      {pay.paid_date} · <span style={{ textTransform:'capitalize' }}>{pay.mode}</span>
                    </p>
                    <p style={{ margin:'3px 0 0', fontSize:'12px', color:'#94a3b8' }}>Receipt: {pay.receipt_no}</p>
                  </div>
                  <div style={{ textAlign:'right', display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'8px' }}>
                    <p style={{ margin:0, fontSize:'20px', fontWeight:'800', color:'#16a34a' }}>₹{Number(pay.amount).toLocaleString('en-IN')}</p>
                    <button style={{ padding:'5px 12px', background:'#eef2ff', color:'#6366f1', border:'none', borderRadius:'6px', fontSize:'12px', fontWeight:'700', cursor:'pointer' }} onClick={()=>printReceipt(pay)}>
                      🖨️ Receipt
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}

const S = {
  page:       { maxWidth:'800px', margin:'0 auto' },
  header:     { marginBottom:'20px' },
  title:      { margin:0, fontSize:'22px', fontWeight:'800', color:'#1e293b' },
  sub:        { margin:'4px 0 0', color:'#64748b', fontSize:'14px' },
  summaryRow: { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px', marginBottom:'20px' },
  statCard:   { borderRadius:'10px', padding:'16px', boxShadow:'0 1px 3px rgba(0,0,0,0.06)' },
  tabs:       { display:'flex', gap:'8px', marginBottom:'20px' },
  tab:        { padding:'8px 20px', borderRadius:'8px', border:'1px solid #e2e8f0', background:'#fff', cursor:'pointer', fontSize:'14px', fontWeight:'600', color:'#64748b' },
  tabActive:  { background:'#6366f1', color:'#fff', border:'1px solid #6366f1' },
  card:       { background:'#fff', borderRadius:'10px', padding:'16px', boxShadow:'0 1px 3px rgba(0,0,0,0.06)' },
  empty:      { textAlign:'center', padding:'60px', color:'#94a3b8' },
}
