import { useState, useEffect, useRef } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getSchoolSettings } from '../../lib/schoolSettings'

const navItems = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: '🏠' },
  { path: '/admin/teachers', label: 'Teachers', icon: '👨‍🏫' },
  { path: '/admin/students', label: 'Students', icon: '👨‍🎓' },
  { path: '/admin/subjects', label: 'Subjects', icon: '📚' },
  { path: '/admin/attendance', label: 'Attendance', icon: '📋' },
  { path: '/admin/noticeboard', label: 'Notice Board', icon: '📢' },
  { path: '/admin/timetable', label: 'Time Table', icon: '🗓️' },
  { path: '/admin/syllabus', label: 'Syllabus', icon: '📖' },
  { path: '/admin/exams', label: 'Exams', icon: '📝' },
  { path: '/admin/marks', label: 'Marks & Results', icon: '🏆' },
  { path: '/admin/analytics', label: 'Analytics', icon: '📊' },
  { path: '/admin/fees', label: 'Fee Management', icon: '💰' },
  { path: '/admin/question-papers', label: 'Question Papers', icon: '📝' },
  { path: '/admin/activity-log', label: 'Activity Log', icon: '📋' },
  { path: '/admin/events', label: 'Events & Calendar', icon: '🎉' },
  { path: '/admin/school-profile', label: 'School Profile', icon: '🏫' },
  { path: '/admin/settings', label: 'Settings', icon: '⚙️' },
]

export default function AdminLayout() {
  const { profile, logout } = useAuth()
  const navigate = useNavigate()
  
  const [schoolName, setSchoolName] = useState('ERP System')
  const [schoolLogo, setSchoolLogo] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [showProfile, setShowProfile] = useState(false)
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const searchRef = useRef(null)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await getSchoolSettings()
        let settings = response?.data || response
        if (Array.isArray(settings)) settings = settings[0]

        if (settings) {
          const validName = settings.school_name || settings.schoolName || settings.name || settings.school_title
          if (validName) setSchoolName(validName)
          if (settings.logo_url) setSchoolLogo(settings.logo_url)
        }
      } catch (err) {
        console.error('Failed to fetch school settings', err)
      }
    }
    fetchSettings()

    // Close search dropdown if clicked outside
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchFocused(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to log out?")) {
      await logout()
      navigate('/login')
    }
  }

  const renderAvatar = (size = '36px', fontSize = '14px') => {
    if (profile?.avatar_url) {
      return <img src={profile.avatar_url} alt="Profile" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border: '2px solid #fff', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }} />
    }
    return (
      <div style={{ width: size, height: size, borderRadius: '50%', backgroundColor: '#4f46e5', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: fontSize, border: '2px solid #fff', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        {profile?.name?.charAt(0).toUpperCase() || 'A'}
      </div>
    )
  }

  // Filter Nav Items based on Search Query
  const filteredNavItems = navItems.filter(item => 
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div style={styles.wrapper}>
      {/* Sidebar */}
      <aside style={{ ...styles.sidebar, width: sidebarOpen ? '260px' : '0px', padding: sidebarOpen ? '0' : '0' }}>
        
        {/* School Branding */}
        <div style={styles.logoContainer}>
          {schoolLogo ? (
            <img src={schoolLogo} alt="Logo" style={styles.logoImg} onError={e => e.target.style.display = 'none'} />
          ) : (
            <div style={styles.logoPlaceholder}>🎓</div>
          )}
          <div style={styles.logoTextWrapper}>
            {/* FIX: Removed truncation to allow wrapping of long school names */}
            <span style={styles.logoText}>{schoolName}</span>
            <span style={styles.logoSubtext}>Admin Portal</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav style={styles.nav}>
          <div style={styles.navSectionTitle}>MAIN MENU</div>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              style={({ isActive }) => ({
                ...styles.navItem,
                backgroundColor: isActive ? '#eef2ff' : 'transparent',
                color: isActive ? '#4f46e5' : '#475569',
                fontWeight: isActive ? '700' : '500',
                borderRight: isActive ? '3px solid #4f46e5' : '3px solid transparent',
              })}
            >
              <span style={{ ...styles.navIcon, opacity: 1 }}>{item.icon}</span>
              <span style={styles.navLabel}>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer Action */}
        <div style={styles.sidebarFooter}>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            <span style={{ fontSize: '16px' }}>🚪</span> 
            <span>Secure Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={styles.main}>
        
        {/* Top Navigation Bar */}
        <header style={styles.topbar}>
          <div style={styles.topbarLeft}>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} style={styles.menuBtn} title="Toggle Sidebar">
              ☰
            </button>
            
            {/* FIX: Made the Search functionality fully operational */}
            <div style={styles.searchWrapper} ref={searchRef}>
              <span style={styles.searchIcon}>🔍</span>
              <input 
                style={styles.searchInput} 
                placeholder="Search modules..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
              />
              
              {/* Search Results Dropdown */}
              {isSearchFocused && searchQuery && (
                <div style={styles.searchDropdown}>
                  {filteredNavItems.length > 0 ? (
                    filteredNavItems.map(item => (
                      <div 
                        key={item.path} 
                        style={styles.searchDropdownItem}
                        onClick={() => {
                          navigate(item.path)
                          setSearchQuery('')
                          setIsSearchFocused(false)
                        }}
                      >
                        <span style={{ fontSize: '16px' }}>{item.icon}</span>
                        <span>{item.label}</span>
                      </div>
                    ))
                  ) : (
                    <div style={styles.searchDropdownEmpty}>
                      No modules found matching "{searchQuery}"
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div style={styles.topbarRight}>
            <div style={styles.profileTrigger} onClick={() => setShowProfile(true)}>
              <div style={styles.profileTextInfo}>
                <span style={styles.profileName}>{profile?.name || 'Administrator'}</span>
                <span style={styles.profileRole}>Admin Account</span>
              </div>
              {renderAvatar('40px', '16px')}
            </div>
          </div>
        </header>

        {/* Profile Modal Overlay */}
        {showProfile && (
          <div style={styles.overlay} onClick={() => setShowProfile(false)}>
            <div style={styles.profileModal} onClick={e => e.stopPropagation()}>
              <div style={styles.profileModalHeader}>
                {renderAvatar('64px', '24px')}
                <div>
                  <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>{profile?.name || 'Administrator'}</h2>
                  <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#2563eb', fontWeight: '600', backgroundColor: '#eff6ff', padding: '2px 8px', borderRadius: '12px', display: 'inline-block' }}>System Admin</p>
                </div>
                <button style={styles.modalCloseBtn} onClick={() => setShowProfile(false)}>✕</button>
              </div>
              
              <div style={styles.infoGrid}>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Admin ID</span>
                  <span style={styles.infoValue}>{profile?.uid || '—'}</span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Email Address</span>
                  <span style={styles.infoValue}>{profile?.email || '—'}</span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Phone Number</span>
                  <span style={styles.infoValue}>{profile?.phone || '—'}</span>
                </div>
              </div>

              <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
                <button style={styles.settingsBtn} onClick={() => { setShowProfile(false); navigate('/admin/settings'); }}>
                  ⚙️ Go to Settings
                </button>
                <button style={styles.modalLogoutBtn} onClick={handleLogout}>
                  🚪 Logout
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Dynamic Page Content */}
        <main style={styles.content}>
          <div style={styles.contentInner}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

// ─── STYLES ────────────────────────────────────────────────
const styles = {
  wrapper: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  
  sidebar: {
    backgroundColor: '#fff',
    borderRight: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'sticky',
    top: 0,
    height: '100vh',
    overflowY: 'hidden',
    boxShadow: '1px 0 10px rgba(0,0,0,0.02)',
    zIndex: 20,
    flexShrink: 0,
  },
  
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '24px 20px',
    borderBottom: '1px solid #f1f5f9',
    minHeight: '90px',
    boxSizing: 'border-box',
    overflow: 'hidden'
  },
  logoImg: { width: '42px', height: '42px', borderRadius: '8px', objectFit: 'cover', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', flexShrink: 0 },
  logoPlaceholder: { width: '42px', height: '42px', borderRadius: '8px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 },
  logoTextWrapper: { display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 },
  logoText: { 
    fontSize: '16px', 
    fontWeight: '800', 
    color: '#0f172a', 
    letterSpacing: '-0.3px', 
    lineHeight: '1.2', 
    whiteSpace: 'normal', 
    wordBreak: 'break-word',
    marginBottom: '2px'
  },
  logoSubtext: { fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' },
  
  nav: {
    display: 'flex',
    flexDirection: 'column',
    padding: '20px 12px',
    gap: '4px',
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
  },
  navSectionTitle: { fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', padding: '0 12px', marginBottom: '8px', marginTop: '8px' },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 14px',
    borderRadius: '8px 0 0 8px',
    textDecoration: 'none',
    transition: 'all 0.2s',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
  },
  navIcon: { fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px' },
  navLabel: { fontSize: '14px', letterSpacing: '0.3px' },
  
  sidebarFooter: {
    padding: '16px',
    borderTop: '1px solid #f1f5f9',
    backgroundColor: '#fafaf9',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
  },
  logoutBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 16px',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    color: '#dc2626',
    fontWeight: '700',
    fontSize: '14px',
    cursor: 'pointer',
    borderRadius: '8px',
    transition: 'all 0.2s',
  },
  
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  
  topbar: {
    backgroundColor: '#fff',
    borderBottom: '1px solid #e2e8f0',
    padding: '0 24px',
    height: '80px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'sticky',
    top: 0,
    zIndex: 10,
    boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
  },
  topbarLeft: { display: 'flex', alignItems: 'center', gap: '20px', flex: 1 },
  menuBtn: { background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#475569', padding: '8px', borderRadius: '8px', transition: 'background-color 0.2s' },
  
  searchWrapper: { position: 'relative', width: '100%', maxWidth: '350px', display: 'flex', alignItems: 'center' },
  searchIcon: { position: 'absolute', left: '14px', fontSize: '14px', color: '#94a3b8' },
  searchInput: { width: '100%', padding: '10px 14px 10px 38px', borderRadius: '24px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none', backgroundColor: '#f8fafc', color: '#1e293b', transition: 'border-color 0.2s, box-shadow 0.2s' },
  searchDropdown: { position: 'absolute', top: '100%', left: 0, width: '100%', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', marginTop: '8px', maxHeight: '300px', overflowY: 'auto', zIndex: 50 },
  searchDropdownItem: { padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', color: '#334155', borderBottom: '1px solid #f1f5f9', cursor: 'pointer' },
  searchDropdownEmpty: { padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '14px' },
  
  topbarRight: { display: 'flex', alignItems: 'center', gap: '16px' },
  
  profileTrigger: { display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '6px 8px', borderRadius: '32px', transition: 'background-color 0.2s', ':hover': { backgroundColor: '#f1f5f9' } },
  profileTextInfo: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', textAlign: 'right' },
  profileName: { fontSize: '14px', fontWeight: '700', color: '#0f172a' },
  profileRole: { fontSize: '11px', color: '#64748b', fontWeight: '600' },
  
  content: { padding: '32px', flex: 1, overflowY: 'auto' },
  contentInner: { maxWidth: '1400px', margin: '0 auto', width: '100%' },
  
  overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)', padding: '20px' },
  profileModal: { backgroundColor: '#fff', borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '440px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', animation: 'fadeIn 0.2s ease-out' },
  profileModalHeader: { display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid #e2e8f0' },
  modalCloseBtn: { marginLeft: 'auto', alignSelf: 'flex-start', background: '#f1f5f9', border: 'none', fontSize: '16px', cursor: 'pointer', color: '#475569', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  
  infoGrid: { display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: '#f8fafc', borderRadius: '12px', padding: '20px', border: '1px solid #f1f5f9' },
  infoItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px dashed #e2e8f0' },
  infoLabel: { fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' },
  infoValue: { fontSize: '14px', fontWeight: '600', color: '#0f172a' },
  
  settingsBtn: { flex: 1, padding: '12px', backgroundColor: '#f1f5f9', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', transition: 'all 0.2s' },
  modalLogoutBtn: { flex: 1, padding: '12px', backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', transition: 'all 0.2s' },
}