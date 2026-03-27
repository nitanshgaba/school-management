// teacher/TeacherLayout.jsx 

import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const MENU = [
  { label: 'Dashboard', icon: '📊', path: '/teacher/dashboard' },
  { label: 'Attendance', icon: '✅', path: '/teacher/attendance' },
  { label: 'Time Table', icon: '🗓️', path: '/teacher/timetable' },
  { label: 'Syllabus', icon: '📖', path: '/teacher/syllabus' },
  { label: 'Notes', icon: '📝', path: '/teacher/notes' },
  { label: 'Marks', icon: '🏆', path: '/teacher/marks' },
  { label: 'Leave', icon: '🏖️', path: '/teacher/leave' },
  { label: 'Exams', icon: '📝', path: '/teacher/exams' },
  { label: 'Events', icon: '🎉', path: '/teacher/events' },
  { label: 'Announcements', icon: '📢', path: '/teacher/announcements' },
  { label: 'Focus Logs', icon: '👁️', path: '/teacher/focus-logs' },
  { label: 'Question Paper', icon: '📝', path: '/teacher/question-paper' },
  { label: 'Feedback', icon: '💬', path: '/teacher/feedback' },
  { label: 'Settings', icon: '⚙️', path: '/teacher/settings' },
]

export default function TeacherLayout() {
  const { profile, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [teacherInfo, setTeacherInfo] = useState(null)

  useEffect(() => {
    if (profile?.id) fetchTeacherInfo()
  }, [profile])

  const fetchTeacherInfo = async () => {
    const { supabase } = await import('../../lib/supabase')
    const [{ data: profileData }, { data: assignments }, { data: subjects }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', profile.id).single(),
      supabase.from('teacher_classes').select('classes(name), sections(name)').eq('teacher_id', profile.id),
      supabase.from('subjects').select('name, classes(name)').eq('teacher_id', profile.id),
    ])
    setTeacherInfo({ teacher: profileData, assignments: assignments || [], subjects: subjects || [] })
  }

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <div style={{ ...styles.sidebar, width: collapsed ? '70px' : '220px' }}>
        <div style={styles.logo} onClick={() => setCollapsed(!collapsed)}>
          {!collapsed && <span style={styles.logoText}>🍊 ERP</span>}
          {collapsed && <span style={{ fontSize: '24px' }}>🍊</span>}
        </div>

        <nav style={styles.nav}>
          {MENU.map(item => (
            <div
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                ...styles.navItem,
                backgroundColor: location.pathname === item.path ? '#22c55e' : 'transparent',
                color: location.pathname === item.path ? '#fff' : '#cbd5e1',
              }}
            >
              <span style={{ fontSize: '18px' }}>{item.icon}</span>
              {!collapsed && <span style={styles.navLabel}>{item.label}</span>}
            </div>
          ))}
        </nav>

        <div style={styles.logoutBtn} onClick={logout}>
          <span>🚪</span>
          {!collapsed && <span>Logout</span>}
        </div>
      </div>

      {/* Main */}
      <div style={styles.main}>
        {/* Topbar */}
        <div style={styles.topbar}>
          <input style={styles.search} placeholder="Search..." />
          <div style={styles.topbarRight}>
            <span style={styles.profileName}>{profile?.name}</span>
            <div style={{ ...styles.avatar, cursor: 'pointer' }} onClick={() => setShowProfile(true)}>
              {profile?.name?.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>

        {/* Profile Modal */}
      {showProfile && teacherInfo && (
        <div style={styles.overlay} onClick={() => setShowProfile(false)}>
          <div style={styles.profileModal} onClick={e => e.stopPropagation()}>
            <div style={styles.profileModalHeader}>
              <div style={styles.bigAvatar}>{profile?.name?.charAt(0).toUpperCase()}</div>
              <div>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#1a1a2e' }}>{profile?.name}</h2>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6b7280' }}>Teacher</p>
              </div>
              <button style={styles.modalCloseBtn} onClick={() => setShowProfile(false)}>✕</button>
            </div>
            <div style={styles.infoGrid}>
              <div style={styles.infoItem}><span style={styles.infoLabel}>Teacher ID</span><span style={styles.infoValue}>{teacherInfo.teacher?.uid || '—'}</span></div>
              <div style={styles.infoItem}><span style={styles.infoLabel}>Email</span><span style={styles.infoValue}>{teacherInfo.teacher?.email || '—'}</span></div>
              <div style={styles.infoItem}><span style={styles.infoLabel}>Phone</span><span style={styles.infoValue}>{teacherInfo.teacher?.phone || '—'}</span></div>
            </div>
            <div style={{ marginTop: '16px' }}>
              <p style={styles.infoLabel}>Assigned Classes</p>
              {teacherInfo.assignments.length === 0 ? <p style={{ color: '#9ca3af', fontSize: '14px' }}>No classes assigned</p> : (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                  {teacherInfo.assignments.map((a, i) => (
                    <span key={i} style={{ backgroundColor: '#dbeafe', color: '#1d4ed8', padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '600' }}>
                      Class {a.classes?.name}{a.sections?.name ? ` - ${a.sections.name}` : ''}
                    </span>
                  ))}
                </div>
              )}
              <p style={{ ...styles.infoLabel, marginTop: '16px' }}>Assigned Subjects</p>
              {teacherInfo.subjects.length === 0 ? <p style={{ color: '#9ca3af', fontSize: '14px' }}>No subjects assigned</p> : (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                  {teacherInfo.subjects.map((s, i) => (
                    <span key={i} style={{ backgroundColor: '#dcfce7', color: '#16a34a', padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '600' }}>
                      {s.name}{s.classes?.name ? ` (Class ${s.classes.name})` : ''}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
        <div style={styles.content}>
          <Outlet />
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: { display: 'flex', height: '100vh', backgroundColor: '#f1f5f9' },
  sidebar: { backgroundColor: '#1a1a2e', display: 'flex', flexDirection: 'column', transition: 'width 0.3s', overflow: 'hidden', flexShrink: 0, position: 'relative', zIndex: 1 },
  logo: { padding: '20px 16px', cursor: 'pointer', borderBottom: '1px solid #ffffff15' },
  logoText: { fontSize: '20px', fontWeight: '800', color: '#fff' },
  nav: { flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: '4px' },
  navItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap' },
  navLabel: { fontSize: '14px', fontWeight: '500' },
  logoutBtn: { padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', color: '#ef4444', cursor: 'pointer', fontSize: '14px', fontWeight: '600', borderTop: '1px solid #ffffff15' },
  main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  topbar: { backgroundColor: '#fff', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
  search: { padding: '8px 16px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', outline: 'none', width: '280px' },
  topbarRight: { display: 'flex', alignItems: 'center', gap: '12px' },
  profileName: { fontSize: '14px', fontWeight: '600', color: '#374151' },
  avatar: { width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#22c55e', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700' },
  content: { flex: 1, overflow: 'auto', padding: '24px' },
  overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  profileModal: { backgroundColor: '#fff', borderRadius: '16px', padding: '28px', width: '480px', maxWidth: '90vw', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' },
  profileModalHeader: { display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' },
  bigAvatar: { width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#22c55e', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: '700', flexShrink: 0 },
  modalCloseBtn: { marginLeft: 'auto', background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#9ca3af' },
  infoGrid: { display: 'flex', flexDirection: 'column', gap: '10px', backgroundColor: '#f9fafb', borderRadius: '10px', padding: '16px' },
  infoItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  infoLabel: { fontSize: '12px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' },
  infoValue: { fontSize: '14px', fontWeight: '600', color: '#374151' },
  th: { textAlign: 'left', fontSize: '12px', color: '#6b7280', fontWeight: '600', padding: '8px 10px', borderBottom: '2px solid #f3f4f6' },
  td: { padding: '10px', fontSize: '14px', color: '#374151', borderBottom: '1px solid #f9fafb' },
}
