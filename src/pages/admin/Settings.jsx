// import { useState, useEffect } from 'react'
// import { supabase } from '../../lib/supabase'
// import { useAuth } from '../../context/AuthContext'

// export default function Settings() {
//   const { profile, user } = useAuth()
//   const [editMode, setEditMode] = useState(false)
//   const [form, setForm] = useState({
//     name: '', phone: '', gender: '', birthday: '', address: '', email: ''
//   })
//   const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' })
//   const [showPasswordForm, setShowPasswordForm] = useState(false)
//   const [avatarFile, setAvatarFile] = useState(null)
//   const [avatarUrl, setAvatarUrl] = useState(null)
//   const [saving, setSaving] = useState(false)
//   const [message, setMessage] = useState('')
//   const [passwordMessage, setPasswordMessage] = useState('')

//   useEffect(() => {
//     if (profile) {
//       setForm({
//         name: profile.name || '',
//         phone: profile.phone || '',
//         gender: profile.gender || '',
//         birthday: profile.birthday || '',
//         address: profile.address || '',
//         email: profile.email || '',
//       })
//       setAvatarUrl(profile.avatar_url || null)
//     }
//   }, [profile])

//   const handleSaveProfile = async () => {
//     setSaving(true)
//     setMessage('')

//     let newAvatarUrl = avatarUrl

//     // Upload avatar if changed
//     if (avatarFile) {
//       const ext = avatarFile.name.split('.').pop()
//       const fileName = `avatar_${user.id}.${ext}`
//       const { error: uploadError } = await supabase.storage
//         .from('avatars')
//         .upload(fileName, avatarFile, { upsert: true })

//       if (uploadError) {
//         setMessage('Avatar upload failed: ' + uploadError.message)
//         setSaving(false)
//         return
//       }

//       const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName)
//       newAvatarUrl = urlData.publicUrl
//     }

//     const { error } = await supabase.from('profiles').update({
//       name: form.name,
//       phone: form.phone,
//       gender: form.gender,
//       birthday: form.birthday || null,
//       address: form.address,
//       avatar_url: newAvatarUrl,
//     }).eq('id', user.id)

//     if (error) {
//       setMessage('Error: ' + error.message)
//     } else {
//       setAvatarUrl(newAvatarUrl)
//       setAvatarFile(null)
//       setMessage('✅ Profile updated successfully!')
//       setEditMode(false)
//       setTimeout(() => setMessage(''), 3000)
//     }
//     setSaving(false)
//   }

//   const handleChangePassword = async () => {
//     setPasswordMessage('')
//     if (!passwordForm.new || !passwordForm.confirm) {
//       setPasswordMessage('Please fill all fields.')
//       return
//     }
//     if (passwordForm.new !== passwordForm.confirm) {
//       setPasswordMessage('Passwords do not match.')
//       return
//     }
//     if (passwordForm.new.length < 6) {
//       setPasswordMessage('Password must be at least 6 characters.')
//       return
//     }
//     setSaving(true)
//     const { error } = await supabase.auth.updateUser({ password: passwordForm.new })
//     if (error) {
//       setPasswordMessage('Error: ' + error.message)
//     } else {
//       setPasswordMessage('✅ Password changed successfully!')
//       setPasswordForm({ current: '', new: '', confirm: '' })
//       setShowPasswordForm(false)
//       setTimeout(() => setPasswordMessage(''), 3000)
//     }
//     setSaving(false)
//   }

//   const handleAvatarChange = (e) => {
//     const file = e.target.files[0]
//     if (file) {
//       setAvatarFile(file)
//       setAvatarUrl(URL.createObjectURL(file))
//     }
//   }

//   const profileFields = [
//     { label: 'UID', value: profile?.uid, icon: '🪪' },
//     { label: 'Name', value: profile?.name, icon: '👤' },
//     { label: 'BirthDay', value: profile?.birthday, icon: '📅' },
//     { label: 'Email', value: profile?.email, icon: '✉️' },
//     { label: 'Phone', value: profile?.phone, icon: '📞' },
//     { label: 'Gender', value: profile?.gender, icon: '👫' },
//     { label: 'Address', value: profile?.address, icon: '📍' },
//   ]

//   return (
//     <div>
//       <div style={styles.pageHeader}>
//         <h1 style={styles.pageTitle}>Settings</h1>
//         <p style={styles.pageSubtitle}>Update Or Manage Your Profile</p>
//       </div>

//       <div style={styles.card}>
//         <div style={styles.cardHeader}>
//           <h2 style={styles.sectionTitle}>⚙️ Profile Settings</h2>
//         </div>

//         {message && (
//           <p style={{ color: message.startsWith('✅') ? '#22c55e' : '#ef4444', fontSize: '14px', marginBottom: '16px' }}>
//             {message}
//           </p>
//         )}

//         <div style={styles.profileGrid}>
//           {/* Left: Avatar */}
//           <div style={styles.avatarSection}>
//             <p style={styles.label}>Profile Image</p>
//             <div style={styles.avatarBox}>
//               {avatarUrl ? (
//                 <img src={avatarUrl} alt="avatar" style={styles.avatarImg} />
//               ) : (
//                 <div style={styles.avatarPlaceholder}>
//                   <div style={styles.avatarInitial}>
//                     {profile?.name?.charAt(0).toUpperCase() || 'A'}
//                   </div>
//                 </div>
//               )}
//               {editMode && (
//                 <label style={styles.avatarUploadBtn}>
//                   ⬆️
//                   <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
//                 </label>
//               )}
//             </div>
//             <p style={{ fontSize: '12px', color: '#9ca3af', textAlign: 'center', marginTop: '8px' }}>
//               For best results, use an image at least 128px by 128px in .jpg format
//             </p>

//             {/* Buttons */}
//             <div style={styles.profileBtns}>
//               {!showPasswordForm ? (
//                 <button style={styles.passwordBtn} onClick={() => setShowPasswordForm(true)}>
//                   🔑 Change Password
//                 </button>
//               ) : (
//                 <div style={styles.passwordForm}>
//                   <div style={styles.formGroup}>
//                     <label style={styles.label}>New Password</label>
//                     <input style={styles.input} type="password" placeholder="Min 6 characters"
//                       value={passwordForm.new} onChange={e => setPasswordForm({ ...passwordForm, new: e.target.value })} />
//                   </div>
//                   <div style={styles.formGroup}>
//                     <label style={styles.label}>Confirm Password</label>
//                     <input style={styles.input} type="password" placeholder="Repeat password"
//                       value={passwordForm.confirm} onChange={e => setPasswordForm({ ...passwordForm, confirm: e.target.value })} />
//                   </div>
//                   {passwordMessage && (
//                     <p style={{ color: passwordMessage.startsWith('✅') ? '#22c55e' : '#ef4444', fontSize: '13px' }}>
//                       {passwordMessage}
//                     </p>
//                   )}
//                   <div style={styles.formButtons}>
//                     <button style={styles.cancelBtn} onClick={() => setShowPasswordForm(false)}>Cancel</button>
//                     <button style={styles.submitBtn} onClick={handleChangePassword} disabled={saving}>
//                       {saving ? 'Saving...' : 'Update'}
//                     </button>
//                   </div>
//                 </div>
//               )}

//               {!editMode ? (
//                 <button style={styles.editBtn} onClick={() => setEditMode(true)}>
//                   ✏️ Edit Profile
//                 </button>
//               ) : (
//                 <div style={styles.formButtons}>
//                   <button style={styles.cancelBtn} onClick={() => { setEditMode(false); setMessage('') }}>Cancel</button>
//                   <button style={styles.submitBtn} onClick={handleSaveProfile} disabled={saving}>
//                     {saving ? 'Saving...' : 'Save Profile'}
//                   </button>
//                 </div>
//               )}
//             </div>
//           </div>

//           {/* Right: Profile Info */}
//           <div style={styles.profileInfo}>
//             <p style={styles.label}>Profile info</p>
//             <div style={styles.infoBox}>
//               {!editMode ? (
//                 profileFields.map(field => (
//                   <div key={field.label} style={styles.infoRow}>
//                     <span style={styles.infoIcon}>{field.icon}</span>
//                     <span style={styles.infoLabel}>{field.label}</span>
//                     <span style={styles.infoDash}>—</span>
//                     <span style={styles.infoValue}>{field.value || 'Not set'}</span>
//                   </div>
//                 ))
//               ) : (
//                 <div style={styles.editForm}>
//                   {[
//                     { label: 'Full Name', key: 'name', type: 'text' },
//                     { label: 'Phone', key: 'phone', type: 'text' },
//                     { label: 'Birthday', key: 'birthday', type: 'date' },
//                     { label: 'Address', key: 'address', type: 'text' },
//                   ].map(field => (
//                     <div key={field.key} style={styles.formGroup}>
//                       <label style={styles.label}>{field.label}</label>
//                       <input
//                         style={styles.input}
//                         type={field.type}
//                         value={form[field.key]}
//                         onChange={e => setForm({ ...form, [field.key]: e.target.value })}
//                       />
//                     </div>
//                   ))}
//                   <div style={styles.formGroup}>
//                     <label style={styles.label}>Gender</label>
//                     <select style={styles.input} value={form.gender}
//                       onChange={e => setForm({ ...form, gender: e.target.value })}>
//                       <option value="">-- Select --</option>
//                       <option value="male">Male</option>
//                       <option value="female">Female</option>
//                       <option value="other">Other</option>
//                     </select>
//                   </div>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }

// const styles = {
//   pageHeader: { marginBottom: '24px' },
//   pageTitle: { fontSize: '28px', fontWeight: '700', color: '#1a1a2e', margin: 0 },
//   pageSubtitle: { color: '#6b7280', fontSize: '14px', marginTop: '4px' },
//   card: { backgroundColor: '#fff', borderRadius: '12px', padding: '28px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
//   cardHeader: { marginBottom: '24px' },
//   sectionTitle: { fontSize: '16px', fontWeight: '700', color: '#1a1a2e' },
//   profileGrid: { display: 'grid', gridTemplateColumns: '280px 1fr', gap: '32px' },
//   avatarSection: { display: 'flex', flexDirection: 'column', gap: '12px' },
//   avatarBox: { position: 'relative', width: '100%', aspectRatio: '1', backgroundColor: '#f3f4f6', borderRadius: '12px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' },
//   avatarImg: { width: '100%', height: '100%', objectFit: 'cover' },
//   avatarPlaceholder: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' },
//   avatarInitial: { width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#4f46e5', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: '700' },
//   avatarUploadBtn: { position: 'absolute', bottom: '12px', left: '50%', transform: 'translateX(-50%)', padding: '8px 16px', backgroundColor: '#4f46e5', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
//   profileBtns: { display: 'flex', flexDirection: 'column', gap: '10px' },
//   passwordBtn: { padding: '10px', backgroundColor: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', width: '100%' },
//   editBtn: { padding: '10px', backgroundColor: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', width: '100%' },
//   passwordForm: { backgroundColor: '#f9fafb', borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' },
//   profileInfo: { display: 'flex', flexDirection: 'column', gap: '8px' },
//   infoBox: { backgroundColor: '#f9fafb', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' },
//   infoRow: { display: 'flex', alignItems: 'center', gap: '10px' },
//   infoIcon: { fontSize: '16px', width: '24px' },
//   infoLabel: { fontSize: '14px', fontWeight: '600', color: '#374151', width: '80px' },
//   infoDash: { color: '#9ca3af' },
//   infoValue: { fontSize: '14px', color: '#22c55e', fontWeight: '500' },
//   editForm: { display: 'flex', flexDirection: 'column', gap: '14px' },
//   formGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
//   label: { fontSize: '13px', fontWeight: '600', color: '#374151' },
//   input: { padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', outline: 'none' },
//   formButtons: { display: 'flex', gap: '10px' },
//   cancelBtn: { flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: '14px' },
//   submitBtn: { flex: 1, padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: '#4f46e5', color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
// }

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
        setMessage('❌ Avatar upload failed: ' + uploadError.message)
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
      setMessage('❌ Error: ' + error.message)
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
      setPasswordMessage('❌ Please fill all fields.')
      return
    }
    if (passwordForm.new !== passwordForm.confirm) {
      setPasswordMessage('❌ Passwords do not match.')
      return
    }
    if (passwordForm.new.length < 6) {
      setPasswordMessage('❌ Password must be at least 6 characters.')
      return
    }
    
    setSaving(true)
    const { error } = await supabase.auth.updateUser({ password: passwordForm.new })
    
    if (error) {
      setPasswordMessage('❌ Error: ' + error.message)
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
    { label: 'System UID', value: profile?.uid, icon: '🪪' },
    { label: 'Full Name', value: profile?.name, icon: '👤' },
    { label: 'Email Address', value: profile?.email, icon: '✉️' },
    { label: 'Phone Number', value: profile?.phone, icon: '📞' },
    { label: 'Date of Birth', value: profile?.birthday ? new Date(profile.birthday).toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' }) : null, icon: '📅' },
    { label: 'Gender', value: profile?.gender ? profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1) : null, icon: '👫' },
    { label: 'Home Address', value: profile?.address, icon: '📍' },
  ]

  return (
    <div style={styles.container}>
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Account Settings</h1>
          <p style={styles.pageSubtitle}>Manage your personal information and security preferences</p>
        </div>
      </div>

      {message && (
        <div style={{ ...styles.alertBox, backgroundColor: message.startsWith('✅') ? '#f0fdf4' : '#fef2f2', border: message.startsWith('✅') ? '1px solid #bbf7d0' : '1px solid #fecaca', color: message.startsWith('✅') ? '#15803d' : '#991b1b' }}>
          {message}
        </div>
      )}

      <div style={styles.card}>
        <div style={styles.profileGrid}>
          
          {/* Left Column: Avatar & Actions */}
          <div style={styles.leftColumn}>
            <div style={styles.avatarCard}>
              <div style={styles.avatarWrapper}>
                {avatarUrl ? (
                  <img src={avatarUrl} alt="User Avatar" style={styles.avatarImg} />
                ) : (
                  <div style={styles.avatarPlaceholder}>
                    {profile?.name?.charAt(0).toUpperCase() || 'A'}
                  </div>
                )}
                
                {editMode && (
                  <label style={styles.avatarUploadOverlay}>
                    <span style={{ fontSize: '20px', marginBottom: '4px' }}>📷</span>
                    <span style={{ fontSize: '12px', fontWeight: '600' }}>Change Photo</span>
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
                  </label>
                )}
              </div>
              
              <h2 style={styles.userName}>{profile?.name || 'Administrator'}</h2>
              <p style={styles.userRole}>
                <span style={styles.roleBadge}>{profile?.role ? profile.role.toUpperCase() : 'ADMIN'}</span>
              </p>

              {editMode && (
                <p style={{ fontSize: '12px', color: '#64748b', textAlign: 'center', marginTop: '16px', padding: '0 20px' }}>
                  Allowed formats: JPG, PNG. Max size: 2MB.
                </p>
              )}
            </div>

            <div style={styles.actionCard}>
              {!showPasswordForm ? (
                <button style={styles.secondaryBtn} onClick={() => { setShowPasswordForm(true); setEditMode(false); }}>
                  <span style={{ marginRight: '8px' }}>🔐</span> Change Password
                </button>
              ) : (
                <div style={styles.passwordFormWrapper}>
                  <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', margin: '0 0 16px 0' }}>Security Update</h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>New Password</label>
                      <input style={styles.input} type="password" placeholder="Minimum 6 characters"
                        value={passwordForm.new} onChange={e => setPasswordForm({ ...passwordForm, new: e.target.value })} />
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Confirm New Password</label>
                      <input style={styles.input} type="password" placeholder="Repeat new password"
                        value={passwordForm.confirm} onChange={e => setPasswordForm({ ...passwordForm, confirm: e.target.value })} />
                    </div>
                  </div>

                  {passwordMessage && (
                    <div style={{ padding: '8px 12px', borderRadius: '6px', backgroundColor: passwordMessage.startsWith('✅') ? '#dcfce7' : '#fee2e2', color: passwordMessage.startsWith('✅') ? '#16a34a' : '#dc2626', fontSize: '13px', fontWeight: '500', marginTop: '16px' }}>
                      {passwordMessage}
                    </div>
                  )}

                  <div style={styles.formButtons}>
                    <button style={styles.cancelBtnSmall} onClick={() => { setShowPasswordForm(false); setPasswordMessage(''); }}>Cancel</button>
                    <button style={styles.submitBtnSmall} onClick={handleChangePassword} disabled={saving}>
                      {saving ? '⏳...' : 'Update Password'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Profile Details */}
          <div style={styles.rightColumn}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid #e2e8f0', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Personal Information</h2>
              {!editMode && !showPasswordForm && (
                <button style={styles.primaryBtn} onClick={() => setEditMode(true)}>
                  <span style={{ marginRight: '6px' }}>✏️</span> Edit Details
                </button>
              )}
            </div>

            {!editMode ? (
              <div style={styles.infoGrid}>
                {profileFields.map((field, index) => (
                  <div key={field.label} style={{ ...styles.infoCard, gridColumn: field.label === 'Home Address' ? '1 / -1' : 'auto' }}>
                    <div style={styles.infoIconBox}>{field.icon}</div>
                    <div>
                      <p style={styles.infoLabel}>{field.label}</p>
                      <p style={styles.infoValue}>{field.value || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Not provided</span>}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={styles.editFormWrapper}>
                <div style={styles.editGrid}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Full Name <span style={{color: '#ef4444'}}>*</span></label>
                    <input style={styles.input} type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Enter your full name" />
                  </div>
                  
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Phone Number</label>
                    <input style={styles.input} type="text" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+91 XXXXX XXXXX" />
                  </div>
                  
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Date of Birth</label>
                    <input style={styles.input} type="date" value={form.birthday} onChange={e => setForm({ ...form, birthday: e.target.value })} />
                  </div>
                  
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Gender</label>
                    <select style={styles.input} value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}>
                      <option value="">-- Select Gender --</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  
                  <div style={{ ...styles.formGroup, gridColumn: '1 / -1' }}>
                    <label style={styles.label}>Home Address</label>
                    <textarea style={{ ...styles.input, minHeight: '80px', resize: 'vertical' }} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Enter your full residential address" />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #e2e8f0' }}>
                  <button style={styles.cancelBtn} onClick={() => { setEditMode(false); setMessage(''); setAvatarFile(null); setAvatarUrl(profile?.avatar_url || null); }}>
                    Cancel Changes
                  </button>
                  <button style={styles.saveBtn} onClick={handleSaveProfile} disabled={saving || !form.name}>
                    {saving ? '⏳ Saving...' : '💾 Save Profile'}
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}

// ─── STYLES ────────────────────────────────────────────────
const styles = {
  container: { maxWidth: '1100px', margin: '0 auto', padding: '20px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' },
  pageHeader: { marginBottom: '32px' },
  pageTitle: { fontSize: '32px', fontWeight: '800', color: '#111827', margin: '0 0 8px 0', letterSpacing: '-0.5px' },
  pageSubtitle: { fontSize: '15px', color: '#6b7280', margin: 0 },
  
  alertBox: { padding: '16px 20px', borderRadius: '12px', marginBottom: '24px', fontSize: '15px', fontWeight: '600', display: 'flex', alignItems: 'center' },
  
  card: { backgroundColor: '#fff', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)', border: '1px solid #f3f4f6' },
  
  profileGrid: { display: 'grid', gridTemplateColumns: '300px 1fr', gap: '40px', alignItems: 'start' },
  
  leftColumn: { display: 'flex', flexDirection: 'column', gap: '24px' },
  
  avatarCard: { backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '32px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' },
  avatarWrapper: { position: 'relative', width: '160px', height: '160px', borderRadius: '50%', overflow: 'hidden', border: '4px solid #fff', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', marginBottom: '20px', backgroundColor: '#e0e7ff' },
  avatarImg: { width: '100%', height: '100%', objectFit: 'cover' },
  avatarPlaceholder: { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '64px', fontWeight: '800', color: '#4f46e5', background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)' },
  avatarUploadOverlay: { position: 'absolute', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: 0, transition: 'opacity 0.2s', ':hover': { opacity: 1 } },
  userName: { margin: '0 0 8px 0', fontSize: '20px', fontWeight: '800', color: '#0f172a' },
  userRole: { margin: 0 },
  roleBadge: { backgroundColor: '#eff6ff', color: '#2563eb', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', letterSpacing: '0.5px', border: '1px solid #bfdbfe' },
  
  actionCard: { backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px' },
  passwordFormWrapper: { display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.3s ease-in' },
  
  rightColumn: { display: 'flex', flexDirection: 'column' },
  
  infoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' },
  infoCard: { display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px' },
  infoIconBox: { width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#fff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', flexShrink: 0 },
  infoLabel: { margin: '0 0 4px 0', fontSize: '12px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' },
  infoValue: { margin: 0, fontSize: '15px', fontWeight: '600', color: '#0f172a', wordBreak: 'break-word' },
  
  editFormWrapper: { backgroundColor: '#fff', animation: 'fadeIn 0.3s ease-in' },
  editGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' },
  
  formGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '13px', fontWeight: '600', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' },
  input: { padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', backgroundColor: '#fff', color: '#1e293b', transition: 'border-color 0.2s', width: '100%', boxSizing: 'border-box' },
  
  primaryBtn: { padding: '10px 20px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)' },
  secondaryBtn: { padding: '12px', width: '100%', backgroundColor: '#fff', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  
  formButtons: { display: 'flex', gap: '12px', marginTop: '20px' },
  cancelBtnSmall: { flex: 1, padding: '10px', backgroundColor: '#fff', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', transition: 'all 0.2s' },
  submitBtnSmall: { flex: 1, padding: '10px', backgroundColor: '#0f172a', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', transition: 'all 0.2s' },
  
  cancelBtn: { padding: '12px 24px', backgroundColor: '#fff', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' },
  saveBtn: { padding: '12px 32px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)' },
}