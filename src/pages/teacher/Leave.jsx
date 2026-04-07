import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

export default function TeacherLeave() {
  const { profile } = useAuth()
  const [leaves, setLeaves] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [form, setForm] = useState({ reason: '', from_date: '', to_date: '', type: 'sick' })

  useEffect(() => { fetchLeaves() }, [])

  const fetchLeaves = async () => {
    const { data } = await supabase
      .from('teacher_leaves')
      .select('*')
      .eq('teacher_id', profile.id)
      .order('created_at', { ascending: false })
    setLeaves(data || [])
    setLoading(false)
  }

  const handleApply = async () => {
    if (!form.reason || !form.from_date || !form.to_date) {
      setMessage('⚠️ All fields are required')
      return
    }
    setSaving(true)
    setMessage('')
    const { data, error } = await supabase.from('teacher_leaves').insert({
      teacher_id: profile.id,
      reason: form.reason,
      from_date: form.from_date,
      to_date: form.to_date,
      leave_type: form.type,
      status: 'pending',
    }).select().single()

    if (error) { 
      setMessage('❌ Error applying leave')
      setSaving(false)
      return 
    }
    setLeaves([data, ...leaves])
    setForm({ reason: '', from_date: '', to_date: '', type: 'sick' })
    setShowForm(false)
    setMessage('✅ Leave applied successfully!')
    setTimeout(() => setMessage(''), 4000)
    setSaving(false)
  }

  const getStatusStyle = (status) => {
    const s = status?.toLowerCase()
    if (s === 'approved') return { backgroundColor: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }
    if (s === 'rejected') return { backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }
    return { backgroundColor: '#fffbeb', color: '#d97706', border: '1px solid #fde68a' }
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  if (loading) return <div style={styles.loadingBox}>⌛ Loading leave records...</div>

  return (
    <div style={styles.container}>
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Leave Management</h1>
          <p style={styles.pageSubtitle}>Request time off and track your application status</p>
        </div>
        <button 
          style={{ ...styles.addBtn, backgroundColor: showForm ? '#64748b' : '#4f46e5' }} 
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? '✕ Cancel Request' : '＋ Apply New Leave'}
        </button>
      </div>

      {message && (
        <div style={{ 
          ...styles.alert, 
          backgroundColor: message.startsWith('✅') ? '#f0fdf4' : '#fef2f2',
          color: message.startsWith('✅') ? '#16a34a' : '#dc2626',
          border: `1px solid ${message.startsWith('✅') ? '#bbf7d0' : '#fecaca'}`
        }}>
          {message}
        </div>
      )}

      {showForm && (
        <div style={styles.formCard}>
          <h2 style={styles.cardTitle}>Application Form</h2>
          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Leave Type</label>
              <select style={styles.input} value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                <option value="sick">Sick Leave</option>
                <option value="casual">Casual Leave</option>
                <option value="emergency">Emergency Leave</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Start Date *</label>
              <input style={styles.input} type="date" value={form.from_date} onChange={e => setForm({ ...form, from_date: e.target.value })} />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>End Date *</label>
              <input style={styles.input} type="date" value={form.to_date} onChange={e => setForm({ ...form, to_date: e.target.value })} />
            </div>
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Reason for Request *</label>
            <textarea style={styles.textarea}
              value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })}
              placeholder="Briefly describe why you are taking this leave..." />
          </div>
          
          <div style={styles.formFooter}>
            <button style={styles.submitBtn} onClick={handleApply} disabled={saving}>
              {saving ? '⌛ Processing...' : '📩 Submit Application'}
            </button>
          </div>
        </div>
      )}

      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Application History</h2>
        <div style={styles.tableWrapper}>
          {leaves.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>🍃</div>
              <p style={{ color: '#64748b', fontWeight: '500' }}>No leave applications found.</p>
            </div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Type</th>
                  <th style={styles.th}>Duration</th>
                  <th style={styles.th}>Reason</th>
                  <th style={{ ...styles.th, textAlign: 'right', paddingRight: '20px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {leaves.map(l => (
                  <tr key={l.id} style={styles.tr}>
                    <td style={{ ...styles.td, fontWeight: '700', color: '#1e293b' }}>
                      {l.leave_type?.charAt(0).toUpperCase() + l.leave_type?.slice(1)}
                    </td>
                    <td style={styles.td}>
                      <div style={{ fontSize: '13px', color: '#475569' }}>{formatDate(l.from_date)}</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>to {formatDate(l.to_date)}</div>
                    </td>
                    <td style={{ ...styles.td, fontSize: '13px', color: '#64748b', maxWidth: '300px' }}>{l.reason}</td>
                    <td style={{ ...styles.td, textAlign: 'right', paddingRight: '20px' }}>
                      <span style={{ ...styles.badge, ...getStatusStyle(l.status) }}>
                        {l.status?.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: { maxWidth: '1000px', margin: '0 auto', padding: '20px', fontFamily: 'Inter, sans-serif' },
  loadingBox: { textAlign: 'center', padding: '80px', color: '#64748b', fontSize: '16px', fontWeight: '600' },
  
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: '20px' },
  pageTitle: { fontSize: '32px', fontWeight: '800', color: '#0f172a', margin: 0, letterSpacing: '-0.5px' },
  pageSubtitle: { fontSize: '15px', color: '#64748b', margin: '4px 0 0' },
  
  addBtn: { padding: '12px 24px', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '14px', transition: '0.2s', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' },
  
  alert: { padding: '14px 20px', borderRadius: '12px', marginBottom: '24px', fontSize: '14px', fontWeight: '600', animation: 'fadeIn 0.3s ease-in' },

  formCard: { backgroundColor: '#fff', borderRadius: '16px', padding: '28px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9', marginBottom: '32px', animation: 'slideDown 0.3s ease-out' },
  cardTitle: { fontSize: '18px', fontWeight: '800', color: '#1e293b', marginBottom: '20px' },
  
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '16px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' },
  input: { padding: '12px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', backgroundColor: '#fff', color: '#1e293b' },
  textarea: { padding: '12px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', height: '100px', resize: 'vertical', fontFamily: 'inherit', color: '#1e293b' },
  
  formFooter: { display: 'flex', justifyContent: 'flex-end', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #f1f5f9' },
  submitBtn: { padding: '12px 28px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '14px', boxShadow: '0 4px 10px rgba(16, 185, 129, 0.2)', transition: 'all 0.2s ease' },

  card: { backgroundColor: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' },
  tableWrapper: { borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', fontSize: '12px', color: '#64748b', fontWeight: '700', padding: '16px 20px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textTransform: 'uppercase' },
  tr: { borderBottom: '1px solid #f1f5f9', transition: '0.15s' },
  td: { padding: '16px 20px', verticalAlign: 'middle' },
  badge: { padding: '5px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '800', letterSpacing: '0.5px' },
  emptyState: { textAlign: 'center', padding: '60px 0' },
}