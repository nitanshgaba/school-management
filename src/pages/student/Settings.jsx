import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

export default function StudentSettings() {
  const { profile } = useAuth()
  const [form, setForm] = useState({
    name: profile?.name || '',
    phone: profile?.phone || '',
    address: profile?.address || '',
  })
  const [passwords, setPasswords] = useState({ newPass: '', confirm: '' })
  const [message, setMessage] = useState('')
  const [passMessage, setPassMessage] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    setMessage('')
    const { error } = await supabase.from('profiles').update({
      name: form.name,
      phone: form.phone,
      address: form.address,
    }).eq('id', profile.id)
    setMessage(error ? '❌ Error saving profile' : '✅ Profile updated successfully!')
    setSaving(false)
  }

  const handleChangePassword = async () => {
    if (!passwords.newPass || !passwords.confirm) { setPassMessage('Please fill all fields'); return }
    if (passwords.newPass !== passwords.confirm) { setPassMessage('❌ Passwords do not match'); return }
    if (passwords.newPass.length < 6) { setPassMessage('❌ Password must be at least 6 characters'); return }
    const { error } = await supabase.auth.updateUser({ password: passwords.newPass })
    setPassMessage(error ? '❌ Error changing password' : '✅ Password changed successfully!')
    setPasswords({ newPass: '', confirm: '' })
  }

  return (
    <div>
      <h1 style={styles.title}>Settings</h1>

      <div style={styles.card}>
        <div style={styles.profileHeader}>
          <div style={styles.avatar}>{profile?.name?.charAt(0).toUpperCase()}</div>
          <div>
            <p style={styles.profileName}>{profile?.name}</p>
            <p style={styles.profileRole}>Student · Roll No: {profile?.uid}</p>
          </div>
        </div>
      </div>

      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Profile Information</h2>
        <div style={styles.formGrid}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Full Name</label>
            <input style={styles.input} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Phone</label>
            <input style={styles.input} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
          </div>
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Address</label>
          <input style={styles.input} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
        </div>
        {message && <p style={{ color: message.startsWith('✅') ? '#22c55e' : '#ef4444', fontSize: '14px', marginTop: '8px' }}>{message}</p>}
        <button style={styles.saveBtn} onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : '💾 Save Changes'}
        </button>
      </div>

      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Change Password</h2>
        <div style={styles.formGrid}>
          <div style={styles.formGroup}>
            <label style={styles.label}>New Password</label>
            <input style={styles.input} type="password" value={passwords.newPass} onChange={e => setPasswords({ ...passwords, newPass: e.target.value })} />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Confirm Password</label>
            <input style={styles.input} type="password" value={passwords.confirm} onChange={e => setPasswords({ ...passwords, confirm: e.target.value })} />
          </div>
        </div>
        {passMessage && <p style={{ color: passMessage.startsWith('✅') ? '#22c55e' : '#ef4444', fontSize: '14px', marginTop: '8px' }}>{passMessage}</p>}
        <button style={styles.saveBtn} onClick={handleChangePassword}>🔒 Change Password</button>
      </div>
    </div>
  )
}

const styles = {
  title: { fontSize: '24px', fontWeight: '700', color: '#1a1a2e', marginBottom: '24px' },
  card: { backgroundColor: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: '20px' },
  profileHeader: { display: 'flex', alignItems: 'center', gap: '16px' },
  avatar: { width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#4f46e5', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: '700' },
  profileName: { fontSize: '18px', fontWeight: '700', color: '#1a1a2e', margin: 0 },
  profileRole: { fontSize: '14px', color: '#6b7280', margin: '4px 0 0' },
  cardTitle: { fontSize: '16px', fontWeight: '700', color: '#1a1a2e', marginBottom: '16px' },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '12px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' },
  label: { fontSize: '13px', fontWeight: '600', color: '#374151' },
  input: { padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', outline: 'none' },
  saveBtn: { padding: '10px 24px', backgroundColor: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
}
