import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const navItems = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: '🏠' },
  { path: '/admin/teachers', label: 'Teacher', icon: '👨‍🏫' },
  { path: '/admin/students', label: 'Student', icon: '👨‍🎓' },
  { path: '/admin/subjects', label: 'Subjects', icon: '📚' },
  { path: '/admin/attendance', label: 'Attendance', icon: '📋' },
  { path: '/admin/noticeboard', label: 'Notice Board', icon: '📢' },
  { path: '/admin/timetable', label: 'Time Table', icon: '🗓️' },
  { path: '/admin/syllabus', label: 'Syllabus', icon: '📖' },
  { path: '/admin/exams', label: 'Exams', icon: '📝' },
  { path: '/admin/marks', label: 'Marks', icon: '🏆' },
  { path: '/admin/analytics', label: 'Analytics', icon: '📊' },
  { path: '/admin/fees', label: 'Fees', icon: '💰' },
  { path: '/admin/question-papers', label: 'Question Papers', icon: '📝' },
  { path: '/admin/activity-log', label: 'Activity Log', icon: '📋' },
  { path: '/admin/events', label: 'Events', icon: '🎉' },
  { path: '/admin/settings', label: 'Settings', icon: '⚙️' },
]

export default function AdminLayout() {
  const { profile, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const [pageLoading, setPageLoading] = useState(false)
  const [showProfile, setShowProfile] = useState(false)

  return (
    <div style={styles.wrapper}>
      {/* Sidebar */}
      <aside style={{ ...styles.sidebar, width: sidebarOpen ? '220px' : '0px', overflow: 'hidden' }}>
        {/* Logo */}
        <div style={styles.logo}>
          <span style={styles.logoIcon}>🍊</span>
          <span style={styles.logoText}>ERP</span>
        </div>

        {/* Nav Items */}
        <nav style={styles.nav}>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              style={({ isActive }) => ({
                ...styles.navItem,
                backgroundColor: isActive ? '#e8f5e9' : 'transparent',
                color: isActive ? '#2e7d32' : '#374151',
                fontWeight: isActive ? '600' : '400',
              })}
            >
              <span style={styles.navIcon}>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <button onClick={handleLogout} style={styles.logoutBtn}>
          🚪 Logout
        </button>
      </aside>

      {/* Main content */}
      <div style={styles.main}>
        {/* Topbar */}
        <header style={styles.topbar}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={styles.menuBtn}
          >
            ☰
          </button>
          <input style={styles.searchInput} placeholder="Search..." />
          <div style={styles.topbarRight}>
            <span style={styles.profileName}>{profile?.name || 'Admin'}</span>
            <div style={{ ...styles.avatar, cursor: 'pointer' }} onClick={() => setShowProfile(true)}>
              {profile?.name?.charAt(0).toUpperCase() || 'A'}
            </div>
          </div>
        </header>

        {showProfile && (
          <div style={styles.overlay} onClick={() => setShowProfile(false)}>
            <div style={styles.profileModal} onClick={e => e.stopPropagation()}>
              <div style={styles.profileModalHeader}>
                <div style={styles.bigAvatar}>{profile?.name?.charAt(0).toUpperCase() || 'A'}</div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#1a1a2e' }}>{profile?.name || 'Admin'}</h2>
                  <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6b7280' }}>Administrator</p>
                </div>
                <button style={styles.modalCloseBtn} onClick={() => setShowProfile(false)}>✕</button>
              </div>
              <div style={styles.infoGrid}>
                <div style={styles.infoItem}><span style={styles.infoLabel}>Admin ID</span><span style={styles.infoValue}>{profile?.uid || '—'}</span></div>
                <div style={styles.infoItem}><span style={styles.infoLabel}>Email</span><span style={styles.infoValue}>{profile?.email || '—'}</span></div>
                <div style={styles.infoItem}><span style={styles.infoLabel}>Phone</span><span style={styles.infoValue}>{profile?.phone || '—'}</span></div>
                <div style={styles.infoItem}><span style={styles.infoLabel}>Role</span><span style={styles.infoValue}>Administrator</span></div>
              </div>
            </div>
          </div>
        )}
        {/* Page content */}
        <main style={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

const styles = {
  wrapper: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#f3f4f6',
    fontFamily: 'Inter, sans-serif',
  },
  sidebar: {
    backgroundColor: '#fff',
    borderRight: '1px solid #e5e7eb',
    display: 'flex',
    flexDirection: 'column',
    transition: 'width 0.3s ease',
    position: 'sticky',
    top: 0,
    height: '100vh',
    overflowY: 'auto',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '20px 16px',
    borderBottom: '1px solid #f3f4f6',
  },
  logoIcon: { fontSize: '28px' },
  logoText: {
    fontSize: '22px',
    fontWeight: '800',
    color: '#1a1a2e',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    padding: '12px 8px',
    gap: '2px',
    flex: 1,
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontSize: '14px',
    transition: 'background 0.2s',
    whiteSpace: 'nowrap',
  },
  navIcon: { fontSize: '16px' },
  logoutBtn: {
    margin: '12px',
    padding: '10px 12px',
    background: 'none',
    border: 'none',
    color: '#ef4444',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
    textAlign: 'left',
    borderRadius: '8px',
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  topbar: {
    backgroundColor: '#fff',
    borderBottom: '1px solid #e5e7eb',
    padding: '12px 24px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  menuBtn: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    color: '#374151',
  },
  searchInput: {
    flex: 1,
    maxWidth: '320px',
    padding: '8px 14px',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    fontSize: '14px',
    outline: 'none',
    backgroundColor: '#f9fafb',
  },
  topbarRight: {
    marginLeft: 'auto',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  profileName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
  },
  avatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: '#4f46e5',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    fontSize: '14px',
  },
  content: { padding: '28px', flex: 1 },
  overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  profileModal: { backgroundColor: '#fff', borderRadius: '16px', padding: '28px', width: '420px', maxWidth: '90vw', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' },
  profileModalHeader: { display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' },
  bigAvatar: { width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#4f46e5', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: '700', flexShrink: 0 },
  modalCloseBtn: { marginLeft: 'auto', background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#9ca3af' },
  infoGrid: { display: 'flex', flexDirection: 'column', gap: '10px', backgroundColor: '#f9fafb', borderRadius: '10px', padding: '16px' },
  infoItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  infoLabel: { fontSize: '12px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' },
  infoValue: { fontSize: '14px', fontWeight: '600', color: '#374151' },
}