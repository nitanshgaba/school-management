import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

export default function TeacherSettings() {
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
    
    if (error) {
      setMessage('❌ Error: Could not update profile.')
    } else {
      setMessage('✅ Profile updated successfully!')
      setTimeout(() => setMessage(''), 3000)
    }
    setSaving(false)
  }

  const handleChangePassword = async () => {
    setPassMessage('')
    if (!passwords.newPass || !passwords.confirm) { 
      setPassMessage('❌ Please fill all password fields.'); 
      return 
    }
    if (passwords.newPass !== passwords.confirm) { 
      setPassMessage('❌ Passwords do not match.'); 
      return 
    }
    if (passwords.newPass.length < 6) { 
      setPassMessage('❌ Password must be at least 6 characters.'); 
      return 
    }
    
    setSaving(true)
    const { error } = await supabase.auth.updateUser({ password: passwords.newPass })
    
    if (error) {
      setPassMessage('❌ ' + error.message)
    } else {
      setPassMessage('✅ Password changed successfully!')
      setPasswords({ newPass: '', confirm: '' })
      setTimeout(() => setPassMessage(''), 3000)
    }
    setSaving(false)
  }

  return (
    <div style={styles.container}>
      <div style={styles.pageHeader}>
        <h1 style={styles.pageTitle}>Account Settings</h1>
        <p style={styles.pageSubtitle}>Manage your profile details and security preferences</p>
      </div>

      {/* Header Card */}
      <div style={styles.headerCard}>
        <div style={styles.profileHeader}>
          <div style={styles.avatar}>
            {profile?.name?.charAt(0).toUpperCase()}
          </div>
          <div style={styles.profileInfo}>
            <p style={styles.profileName}>{profile?.name || 'Teacher'}</p>
            <div style={styles.badgeRow}>
              <span style={styles.roleBadge}>👩‍🏫 Faculty Member</span>
              <span style={styles.idBadge}>ID: {profile?.uid || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>

      <div style={styles.grid}>
        {/* Profile Info Section */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>📋 Personal Information</h2>
          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Full Name</label>
              <input 
                style={styles.input} 
                value={form.name} 
                onChange={e => setForm({ ...form, name: e.target.value })} 
                placeholder="Full Name"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Contact Number</label>
              <input 
                style={styles.input} 
                value={form.phone} 
                onChange={e => setForm({ ...form, phone: e.target.value })} 
                placeholder="+91 XXXXX XXXXX"
              />
            </div>
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Home Address</label>
            <textarea 
              style={{ ...styles.input, minHeight: '80px', resize: 'vertical' }} 
              value={form.address} 
              onChange={e => setForm({ ...form, address: e.target.value })} 
              placeholder="Enter your permanent address"
            />
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
          
          <button style={styles.saveBtn} onClick={handleSave} disabled={saving}>
            {saving ? '⏳ Saving...' : '💾 Save Profile'}
          </button>
        </div>

        {/* Password Section */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>🔒 Security Settings</h2>
          <p style={styles.cardSubText}>Update your account password regularly to maintain security.</p>
          
          <div style={styles.formGroup}>
            <label style={styles.label}>New Password</label>
            <input 
              style={styles.input} 
              type="password" 
              value={passwords.newPass} 
              onChange={e => setPasswords({ ...passwords, newPass: e.target.value })} 
              placeholder="New password (6+ chars)"
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Confirm Password</label>
            <input 
              style={styles.input} 
              type="password" 
              value={passwords.confirm} 
              onChange={e => setPasswords({ ...passwords, confirm: e.target.value })} 
              placeholder="Repeat new password"
            />
          </div>

          {passMessage && (
            <div style={{ 
              ...styles.alert, 
              backgroundColor: passMessage.startsWith('✅') ? '#f0fdf4' : '#fef2f2',
              color: passMessage.startsWith('✅') ? '#16a34a' : '#dc2626',
              border: `1px solid ${passMessage.startsWith('✅') ? '#bbf7d0' : '#fecaca'}`
            }}>
              {passMessage}
            </div>
          )}
          
          <button style={{ ...styles.saveBtn, backgroundColor: '#0f172a' }} onClick={handleChangePassword} disabled={saving}>
             Update Password
          </button>
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: { maxWidth: '1100px', margin: '0 auto', padding: '20px', fontFamily: 'Inter, sans-serif' },
  pageHeader: { marginBottom: '32px' },
  pageTitle: { fontSize: '32px', fontWeight: '800', color: '#0f172a', margin: 0, letterSpacing: '-1px' },
  pageSubtitle: { fontSize: '15px', color: '#64748b', marginTop: '4px' },
  
  headerCard: { backgroundColor: '#fff', borderRadius: '24px', padding: '32px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '24px', border: '1px solid #f1f5f9' },
  profileHeader: { display: 'flex', alignItems: 'center', gap: '24px' },
  avatar: { width: '85px', height: '85px', borderRadius: '50%', backgroundColor: '#10b981', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: '800', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' },
  profileInfo: { display: 'flex', flexDirection: 'column', gap: '10px' },
  profileName: { fontSize: '26px', fontWeight: '800', color: '#0f172a', margin: 0 },
  badgeRow: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  roleBadge: { backgroundColor: '#f0fdf4', color: '#16a34a', padding: '4px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', border: '1px solid #bbf7d0' },
  idBadge: { backgroundColor: '#f8fafc', color: '#64748b', padding: '4px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', border: '1px solid #e2e8f0' },
  
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' },
  card: { backgroundColor: '#fff', borderRadius: '24px', padding: '32px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' },
  cardTitle: { fontSize: '18px', fontWeight: '800', color: '#1e293b', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' },
  cardSubText: { fontSize: '14px', color: '#64748b', marginBottom: '24px', lineHeight: '1.5' },
  
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '8px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' },
  label: { fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' },
  input: { padding: '12px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none', transition: '0.2s', color: '#1e293b', backgroundColor: '#fcfcfd' },
  
  alert: { padding: '12px 16px', borderRadius: '10px', fontSize: '14px', fontWeight: '600', marginBottom: '20px' },
  
  saveBtn: { width: '100%', padding: '14px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '700', fontSize: '15px', transition: '0.2s', boxShadow: '0 4px 10px rgba(16, 185, 129, 0.2)' },
}