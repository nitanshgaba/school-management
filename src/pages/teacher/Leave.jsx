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
      setMessage('All fields are required')
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

    if (error) { setMessage('❌ Error applying leave'); setSaving(false); return }
    setLeaves([data, ...leaves])
    setForm({ reason: '', from_date: '', to_date: '', type: 'sick' })
    setShowForm(false)
    setMessage('✅ Leave applied successfully!')
    setSaving(false)
  }

  const getStatusStyle = (status) => {
    if (status === 'approved') return { backgroundColor: '#dcfce7', color: '#16a34a' }
    if (status === 'rejected') return { backgroundColor: '#fee2e2', color: '#dc2626' }
    return { backgroundColor: '#fef9c3', color: '#ca8a04' }
  }

  if (loading) return <div style={styles.loading}>Loading...</div>

  return (
    <div>
      <div style={styles.header}>
        <h1 style={styles.title}>Leave Applications</h1>
        <button style={styles.addBtn} onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Cancel' : '+ Apply Leave'}
        </button>
      </div>

      {message && <p style={{ color: message.startsWith('✅') ? '#22c55e' : '#ef4444', marginBottom: '16px' }}>{message}</p>}

      {showForm && (
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Apply for Leave</h2>
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
              <label style={styles.label}>From Date *</label>
              <input style={styles.input} type="date" value={form.from_date} onChange={e => setForm({ ...form, from_date: e.target.value })} />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>To Date *</label>
              <input style={styles.input} type="date" value={form.to_date} onChange={e => setForm({ ...form, to_date: e.target.value })} />
            </div>
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Reason *</label>
            <textarea style={{ ...styles.input, height: '80px', resize: 'vertical' }}
              value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })}
              placeholder="Describe your reason..." />
          </div>
          <button style={styles.submitBtn} onClick={handleApply} disabled={saving}>
            {saving ? 'Applying...' : '📝 Apply Leave'}
          </button>
        </div>
      )}

      <div style={styles.card}>
        <h2 style={styles.cardTitle}>My Leave History</h2>
        {leaves.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={{ fontSize: '48px' }}>🏖️</div>
            <p style={{ color: '#9ca3af', marginTop: '8px' }}>No leave applications yet</p>
          </div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Type</th>
                <th style={styles.th}>From</th>
                <th style={styles.th}>To</th>
                <th style={styles.th}>Reason</th>
                <th style={styles.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {leaves.map(l => (
                <tr key={l.id}>
                  <td style={styles.td}>{l.leave_type?.charAt(0).toUpperCase() + l.leave_type?.slice(1)}</td>
                  <td style={styles.td}>{new Date(l.from_date).toLocaleDateString('en-IN')}</td>
                  <td style={styles.td}>{new Date(l.to_date).toLocaleDateString('en-IN')}</td>
                  <td style={styles.td}>{l.reason}</td>
                  <td style={styles.td}>
                    <span style={{ ...styles.badge, ...getStatusStyle(l.status) }}>
                      {l.status?.charAt(0).toUpperCase() + l.status?.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

const styles = {
  loading: { textAlign: 'center', padding: '40px', color: '#9ca3af' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  title: { fontSize: '24px', fontWeight: '700', color: '#1a1a2e', margin: 0 },
  addBtn: { padding: '10px 20px', backgroundColor: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
  card: { backgroundColor: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: '20px' },
  cardTitle: { fontSize: '16px', fontWeight: '700', color: '#1a1a2e', marginBottom: '16px' },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' },
  label: { fontSize: '13px', fontWeight: '600', color: '#374151' },
  input: { padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', outline: 'none' },
  submitBtn: { padding: '10px 24px', backgroundColor: '#22c55e', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
  emptyState: { textAlign: 'center', padding: '40px 0' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', fontSize: '13px', color: '#6b7280', fontWeight: '600', padding: '10px 12px', borderBottom: '2px solid #f3f4f6' },
  td: { padding: '12px', fontSize: '14px', color: '#374151', borderBottom: '1px solid #f9fafb' },
  badge: { padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' },
}
