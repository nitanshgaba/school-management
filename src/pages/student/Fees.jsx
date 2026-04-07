import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getSchoolSettings } from '../../lib/schoolSettings'
import { supabase } from '../../lib/supabase'

export default function StudentFees() {
  const { profile } = useAuth()
  const [assignments, setAssignments] = useState([])
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('dues')
  const [schoolName, setSchoolName] = useState('School ERP')
  const [schoolLogo, setSchoolLogo] = useState('')

  useEffect(() => { 
    loadData() 
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await getSchoolSettings()
      let settings = response?.data || response
      if (Array.isArray(settings)) settings = settings[0]
      if (settings) {
        setSchoolName(settings.school_name || settings.schoolName || 'School ERP')
        setSchoolLogo(settings.logo_url || '')
      }
    } catch (err) { console.error(err) }
  }

  const loadData = async () => {
    setLoading(true)
    const today = new Date().toISOString().split('T')[0]
    
    // Get actual student record
    const { data: studentRec } = await supabase.from('students').select('id').eq('id', profile.id).single()
    const studentId = studentRec?.id || profile.id

    const { data: asgn } = await supabase.from('fee_assignments')
      .select('*, fee_structures(name, amount, category, frequency, classes(name))')
      .eq('student_id', studentId)
      .order('due_date', { ascending: true })

    const { data: pays } = await supabase.from('fee_payments')
      .select('*, fee_assignments(fee_structures(name, category))')
      .eq('student_id', studentId)
      .order('paid_date', { ascending: false })

    const updated = (asgn || []).map(a => ({
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
      <html><head><title>Fee Receipt - ${pay.receipt_no}</title><style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; }
        .header { text-align: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 24px; margin-bottom: 30px; }
        .school-info h1 { margin: 0; font-size: 28px; color: #1e3a8a; }
        .school-info p { margin: 4px 0 0; color: #64748b; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; }
        .receipt-header { display: flex; justify-content: space-between; margin-bottom: 30px; background: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; }
        .receipt-header span { font-size: 13px; font-weight: 600; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        th { text-align: left; padding: 12px; background: #f1f5f9; font-size: 13px; text-transform: uppercase; }
        td { padding: 14px 12px; border-bottom: 1px solid #f1f5f9; font-size: 15px; }
        .amount-box { text-align: right; background: #eff6ff; padding: 20px; border-radius: 12px; border: 1px solid #bfdbfe; }
        .amount-box h2 { margin: 0; color: #1d4ed8; font-size: 32px; }
        .footer { margin-top: 60px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; text-align: center; }
        .signature { border-top: 1px solid #cbd5e1; padding-top: 10px; font-size: 12px; color: #64748b; font-weight: 600; }
        @media print { body { padding: 20px; } }
      </style></head><body>
      <div class="header">
        <div class="school-info">
          <h1>${schoolName}</h1>
          <p>Official Fee Payment Receipt</p>
        </div>
      </div>
      <div class="receipt-header">
        <span>Receipt: #${pay.receipt_no}</span>
        <span>Date: ${new Date(pay.paid_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
      </div>
      <table>
        <thead><tr><th>Description</th><th>Details</th></tr></thead>
        <tbody>
          <tr><td>Fee Structure</td><td><strong>${pay.fee_assignments?.fee_structures?.name || '—'}</strong></td></tr>
          <tr><td>Category</td><td style="text-transform:capitalize">${pay.fee_assignments?.fee_structures?.category || '—'}</td></tr>
          <tr><td>Payment Mode</td><td style="text-transform:capitalize">${pay.mode}</td></tr>
          ${pay.notes ? `<tr><td>Additional Notes</td><td>${pay.notes}</td></tr>` : ''}
        </tbody>
      </table>
      <div class="amount-box">
        <p style="margin:0 0 4px; font-size:12px; font-weight:700; color:#1e40af;">TOTAL AMOUNT PAID</p>
        <h2>₹ ${Number(pay.amount).toLocaleString('en-IN')}</h2>
      </div>
      <div class="footer">
        <div class="signature">Authorized Signatory</div>
        <div class="signature">Student/Guardian Signature</div>
      </div>
      <script>window.onload=()=>{window.print()}<\/script>
      </body></html>
    `)
    w.document.close()
  }

  const totalDue = assignments.filter(a => a.status !== 'paid').reduce((s, a) => s + (Number(a.fee_structures?.amount) || 0), 0)
  const totalPaid = payments.reduce((s, p) => s + (Number(p.amount) || 0), 0)

  const getStatusStyles = (s) => {
    const map = {
      pending: { bg: '#fffbeb', color: '#b45309', border: '#fde68a', icon: '⏳' },
      paid: { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0', icon: '✅' },
      overdue: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca', icon: '⚠️' },
    }
    return map[s] || { bg: '#f8fafc', color: '#64748b', border: '#e2e8f0', icon: '•' }
  }

  return (
    <div style={styles.container}>
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Fee Management</h1>
          <p style={styles.pageSubtitle}>Track your invoices, dues, and transaction history</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={styles.statsRow}>
        {[
          { label: 'Pending Dues', value: `₹${totalDue.toLocaleString('en-IN')}`, color: '#dc2626', bg: '#fef2f2', border: '#fecaca', icon: '💳' },
          { label: 'Total Paid', value: `₹${totalPaid.toLocaleString('en-IN')}`, color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', icon: '💰' },
          { label: 'History Items', value: payments.length, color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', icon: '🧾' },
        ].map(s => (
          <div key={s.label} style={{ ...styles.statCard, backgroundColor: s.bg, border: `1px solid ${s.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={styles.statLabel}>{s.label}</p>
              <span style={{ fontSize: '20px' }}>{s.icon}</span>
            </div>
            <p style={{ ...styles.statValue, color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div style={styles.card}>
        {/* Modern Tab Switcher */}
        <div style={styles.tabContainer}>
          <button 
            onClick={() => setTab('dues')} 
            style={{ ...styles.tab, backgroundColor: tab === 'dues' ? '#fff' : 'transparent', color: tab === 'dues' ? '#0f172a' : '#64748b', boxShadow: tab === 'dues' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
          >
            ⏳ Outstanding Dues
          </button>
          <button 
            onClick={() => setTab('history')} 
            style={{ ...styles.tab, backgroundColor: tab === 'history' ? '#fff' : 'transparent', color: tab === 'history' ? '#0f172a' : '#64748b', boxShadow: tab === 'history' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
          >
            🧾 Payment History
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>⏳ Loading financial records...</div>
        ) : (
          <div style={styles.fadeIn}>
            {tab === 'dues' && (
              assignments.length === 0 ? (
                <div style={styles.emptyState}>
                  <div style={styles.emptyIcon}>🎉</div>
                  <h3 style={{ color: '#0f172a', margin: '0 0 8px 0' }}>All Clear!</h3>
                  <p style={{ color: '#64748b', margin: 0, fontSize: '14px' }}>You have no outstanding fee assignments at the moment.</p>
                </div>
              ) : (
                <div style={styles.list}>
                  {assignments.map(a => {
                    const ss = getStatusStyles(a.status)
                    return (
                      <div key={a.id} style={{ ...styles.feeCard, borderLeft: `6px solid ${ss.color}` }}>
                        <div style={styles.feeCardMain}>
                          <div>
                            <p style={styles.feeName}>{a.fee_structures?.name}</p>
                            <div style={styles.feeMeta}>
                              <span style={styles.metaBadge}>Category: {a.fee_structures?.category}</span>
                              <span style={styles.metaBadge}>{a.fee_structures?.frequency}</span>
                            </div>
                            <p style={styles.dueDate}>📅 Due by: {new Date(a.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <p style={styles.feeAmount}>₹{Number(a.fee_structures?.amount || 0).toLocaleString('en-IN')}</p>
                            <span style={{ backgroundColor: ss.bg, color: ss.color, border: `1px solid ${ss.border}`, ...styles.statusBadge }}>
                              {ss.icon} {a.status.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            )}

            {tab === 'history' && (
              payments.length === 0 ? (
                <div style={styles.emptyState}>
                  <div style={styles.emptyIcon}>🗃️</div>
                  <h3 style={{ color: '#0f172a', margin: '0 0 8px 0' }}>No Transactions</h3>
                  <p style={{ color: '#64748b', margin: 0, fontSize: '14px' }}>Your payment history will appear here once you make a payment.</p>
                </div>
              ) : (
                <div style={styles.list}>
                  {payments.map(pay => (
                    <div key={pay.id} style={styles.feeCard}>
                      <div style={styles.feeCardMain}>
                        <div>
                          <p style={styles.feeName}>{pay.fee_assignments?.fee_structures?.name || 'School Fee'}</p>
                          <p style={{ ...styles.dueDate, marginTop: '4px' }}>
                            Paid on: <strong>{new Date(pay.paid_date).toLocaleDateString('en-IN')}</strong> via <span style={{ textTransform: 'capitalize' }}>{pay.mode}</span>
                          </p>
                          <p style={{ ...styles.dueDate, fontSize: '11px', color: '#94a3b8' }}>Receipt ID: {pay.receipt_no}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ ...styles.feeAmount, color: '#16a34a' }}>₹{Number(pay.amount).toLocaleString('en-IN')}</p>
                          <button style={styles.printBtn} onClick={() => printReceipt(pay)}>
                            🖨️ Get Receipt
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  )
}

const styles = {
  container: { maxWidth: '900px', margin: '0 auto', padding: '20px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' },
  pageHeader: { marginBottom: '32px' },
  pageTitle: { fontSize: '32px', fontWeight: '800', color: '#111827', margin: '0 0 8px 0', letterSpacing: '-0.5px' },
  pageSubtitle: { fontSize: '15px', color: '#6b7280', margin: 0 },

  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' },
  statCard: { borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
  statLabel: { margin: 0, fontSize: '12px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' },
  statValue: { margin: '12px 0 0', fontSize: '28px', fontWeight: '800', lineHeight: 1 },

  card: { backgroundColor: '#fff', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)', border: '1px solid #f3f4f6' },
  
  tabContainer: { display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '12px', marginBottom: '32px', width: 'fit-content' },
  tab: { padding: '10px 24px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', transition: 'all 0.2s ease' },

  fadeIn: { opacity: 1, transition: 'opacity 0.3s ease-in' },
  list: { display: 'flex', flexDirection: 'column', gap: '16px' },

  feeCard: { backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', padding: '20px', transition: 'transform 0.15s ease', ':hover': { transform: 'translateY(-2px)' } },
  feeCardMain: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  feeName: { margin: 0, fontWeight: '800', fontSize: '17px', color: '#0f172a' },
  feeMeta: { display: 'flex', gap: '8px', marginTop: '6px' },
  metaBadge: { fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#64748b', backgroundColor: '#f1f5f9', padding: '2px 8px', borderRadius: '4px' },
  dueDate: { margin: '12px 0 0', fontSize: '13px', color: '#475569', fontWeight: '500' },
  feeAmount: { margin: '0 0 8px', fontSize: '24px', fontWeight: '900', color: '#1e293b' },
  statusBadge: { padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '6px' },

  printBtn: { padding: '8px 16px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s', ':hover': { background: '#2563eb', color: '#fff' } },

  emptyState: { textAlign: 'center', padding: '60px 20px', border: '2px dashed #e2e8f0', borderRadius: '16px', backgroundColor: '#fafaf9' },
  emptyIcon: { fontSize: '48px', marginBottom: '16px' },
}