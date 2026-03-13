import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

export default function Settings() {
  const { profile, user } = useAuth()
  const [editMode, setEditMode] = useState(false)
  const [form, setForm] = useState({
    name: '', phone: '', gender: '', birthday: '', address: '', email: ''
  })
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' })
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarUrl, setAvatarUrl] = useState(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [passwordMessage, setPasswordMessage] = useState('')

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name || '',
        phone: profile.phone || '',
        gender: profile.gender || '',
        birthday: profile.birthday || '',
        address: profile.address || '',
        email: profile.email || '',
      })
      setAvatarUrl(profile.avatar_url || null)
    }
  }, [profile])

  const handleSaveProfile = async () => {
    setSaving(true)
    setMessage('')

    let newAvatarUrl = avatarUrl

    // Upload avatar if changed
    if (avatarFile) {
      const ext = avatarFile.name.split('.').pop()
      const fileName = `avatar_${user.id}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, avatarFile, { upsert: true })

      if (uploadError) {
        setMessage('Avatar upload failed: ' + uploadError.message)
        setSaving(false)
        return
      }

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName)
      newAvatarUrl = urlData.publicUrl
    }

    const { error } = await supabase.from('profiles').update({
      name: form.name,
      phone: form.phone,
      gender: form.gender,
      birthday: form.birthday || null,
      address: form.address,
      avatar_url: newAvatarUrl,
    }).eq('id', user.id)

    if (error) {
      setMessage('Error: ' + error.message)
    } else {
      setAvatarUrl(newAvatarUrl)
      setAvatarFile(null)
      setMessage('✅ Profile updated successfully!')
      setEditMode(false)
      setTimeout(() => setMessage(''), 3000)
    }
    setSaving(false)
  }

  const handleChangePassword = async () => {
    setPasswordMessage('')
    if (!passwordForm.new || !passwordForm.confirm) {
      setPasswordMessage('Please fill all fields.')
      return
    }
    if (passwordForm.new !== passwordForm.confirm) {
      setPasswordMessage('Passwords do not match.')
      return
    }
    if (passwordForm.new.length < 6) {
      setPasswordMessage('Password must be at least 6 characters.')
      return
    }
    setSaving(true)
    const { error } = await supabase.auth.updateUser({ password: passwordForm.new })
    if (error) {
      setPasswordMessage('Error: ' + error.message)
    } else {
      setPasswordMessage('✅ Password changed successfully!')
      setPasswordForm({ current: '', new: '', confirm: '' })
      setShowPasswordForm(false)
      setTimeout(() => setPasswordMessage(''), 3000)
    }
    setSaving(false)
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setAvatarFile(file)
      setAvatarUrl(URL.createObjectURL(file))
    }
  }

  const profileFields = [
    { label: 'UID', value: profile?.uid, icon: '🪪' },
    { label: 'Name', value: profile?.name, icon: '👤' },
    { label: 'BirthDay', value: profile?.birthday, icon: '📅' },
    { label: 'Email', value: profile?.email, icon: '✉️' },
    { label: 'Phone', value: profile?.phone, icon: '📞' },
    { label: 'Gender', value: profile?.gender, icon: '👫' },
    { label: 'Address', value: profile?.address, icon: '📍' },
  ]

  return (
    <div>
      <div style={styles.pageHeader}>
        <h1 style={styles.pageTitle}>Settings</h1>
        <p style={styles.pageSubtitle}>Update Or Manage Your Profile</p>
      </div>

      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h2 style={styles.sectionTitle}>⚙️ Profile Settings</h2>
        </div>

        {message && (
          <p style={{ color: message.startsWith('✅') ? '#22c55e' : '#ef4444', fontSize: '14px', marginBottom: '16px' }}>
            {message}
          </p>
        )}

        <div style={styles.profileGrid}>
          {/* Left: Avatar */}
          <div style={styles.avatarSection}>
            <p style={styles.label}>Profile Image</p>
            <div style={styles.avatarBox}>
              {avatarUrl ? (
                <img src={avatarUrl} alt="avatar" style={styles.avatarImg} />
              ) : (
                <div style={styles.avatarPlaceholder}>
                  <div style={styles.avatarInitial}>
                    {profile?.name?.charAt(0).toUpperCase() || 'A'}
                  </div>
                </div>
              )}
              {editMode && (
                <label style={styles.avatarUploadBtn}>
                  ⬆️
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
                </label>
              )}
            </div>
            <p style={{ fontSize: '12px', color: '#9ca3af', textAlign: 'center', marginTop: '8px' }}>
              For best results, use an image at least 128px by 128px in .jpg format
            </p>

            {/* Buttons */}
            <div style={styles.profileBtns}>
              {!showPasswordForm ? (
                <button style={styles.passwordBtn} onClick={() => setShowPasswordForm(true)}>
                  🔑 Change Password
                </button>
              ) : (
                <div style={styles.passwordForm}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>New Password</label>
                    <input style={styles.input} type="password" placeholder="Min 6 characters"
                      value={passwordForm.new} onChange={e => setPasswordForm({ ...passwordForm, new: e.target.value })} />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Confirm Password</label>
                    <input style={styles.input} type="password" placeholder="Repeat password"
                      value={passwordForm.confirm} onChange={e => setPasswordForm({ ...passwordForm, confirm: e.target.value })} />
                  </div>
                  {passwordMessage && (
                    <p style={{ color: passwordMessage.startsWith('✅') ? '#22c55e' : '#ef4444', fontSize: '13px' }}>
                      {passwordMessage}
                    </p>
                  )}
                  <div style={styles.formButtons}>
                    <button style={styles.cancelBtn} onClick={() => setShowPasswordForm(false)}>Cancel</button>
                    <button style={styles.submitBtn} onClick={handleChangePassword} disabled={saving}>
                      {saving ? 'Saving...' : 'Update'}
                    </button>
                  </div>
                </div>
              )}

              {!editMode ? (
                <button style={styles.editBtn} onClick={() => setEditMode(true)}>
                  ✏️ Edit Profile
                </button>
              ) : (
                <div style={styles.formButtons}>
                  <button style={styles.cancelBtn} onClick={() => { setEditMode(false); setMessage('') }}>Cancel</button>
                  <button style={styles.submitBtn} onClick={handleSaveProfile} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Profile'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right: Profile Info */}
          <div style={styles.profileInfo}>
            <p style={styles.label}>Profile info</p>
            <div style={styles.infoBox}>
              {!editMode ? (
                profileFields.map(field => (
                  <div key={field.label} style={styles.infoRow}>
                    <span style={styles.infoIcon}>{field.icon}</span>
                    <span style={styles.infoLabel}>{field.label}</span>
                    <span style={styles.infoDash}>—</span>
                    <span style={styles.infoValue}>{field.value || 'Not set'}</span>
                  </div>
                ))
              ) : (
                <div style={styles.editForm}>
                  {[
                    { label: 'Full Name', key: 'name', type: 'text' },
                    { label: 'Phone', key: 'phone', type: 'text' },
                    { label: 'Birthday', key: 'birthday', type: 'date' },
                    { label: 'Address', key: 'address', type: 'text' },
                  ].map(field => (
                    <div key={field.key} style={styles.formGroup}>
                      <label style={styles.label}>{field.label}</label>
                      <input
                        style={styles.input}
                        type={field.type}
                        value={form[field.key]}
                        onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                      />
                    </div>
                  ))}
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Gender</label>
                    <select style={styles.input} value={form.gender}
                      onChange={e => setForm({ ...form, gender: e.target.value })}>
                      <option value="">-- Select --</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const styles = {
  pageHeader: { marginBottom: '24px' },
  pageTitle: { fontSize: '28px', fontWeight: '700', color: '#1a1a2e', margin: 0 },
  pageSubtitle: { color: '#6b7280', fontSize: '14px', marginTop: '4px' },
  card: { backgroundColor: '#fff', borderRadius: '12px', padding: '28px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  cardHeader: { marginBottom: '24px' },
  sectionTitle: { fontSize: '16px', fontWeight: '700', color: '#1a1a2e' },
  profileGrid: { display: 'grid', gridTemplateColumns: '280px 1fr', gap: '32px' },
  avatarSection: { display: 'flex', flexDirection: 'column', gap: '12px' },
  avatarBox: { position: 'relative', width: '100%', aspectRatio: '1', backgroundColor: '#f3f4f6', borderRadius: '12px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  avatarImg: { width: '100%', height: '100%', objectFit: 'cover' },
  avatarPlaceholder: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' },
  avatarInitial: { width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#4f46e5', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: '700' },
  avatarUploadBtn: { position: 'absolute', bottom: '12px', left: '50%', transform: 'translateX(-50%)', padding: '8px 16px', backgroundColor: '#4f46e5', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
  profileBtns: { display: 'flex', flexDirection: 'column', gap: '10px' },
  passwordBtn: { padding: '10px', backgroundColor: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', width: '100%' },
  editBtn: { padding: '10px', backgroundColor: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', width: '100%' },
  passwordForm: { backgroundColor: '#f9fafb', borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' },
  profileInfo: { display: 'flex', flexDirection: 'column', gap: '8px' },
  infoBox: { backgroundColor: '#f9fafb', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' },
  infoRow: { display: 'flex', alignItems: 'center', gap: '10px' },
  infoIcon: { fontSize: '16px', width: '24px' },
  infoLabel: { fontSize: '14px', fontWeight: '600', color: '#374151', width: '80px' },
  infoDash: { color: '#9ca3af' },
  infoValue: { fontSize: '14px', color: '#22c55e', fontWeight: '500' },
  editForm: { display: 'flex', flexDirection: 'column', gap: '14px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: '600', color: '#374151' },
  input: { padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', outline: 'none' },
  formButtons: { display: 'flex', gap: '10px' },
  cancelBtn: { flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: '14px' },
  submitBtn: { flex: 1, padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: '#4f46e5', color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
}