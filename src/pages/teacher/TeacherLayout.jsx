// // teacher/TeacherLayout.jsx 

// import { useState, useEffect } from 'react'
// import { Outlet, useNavigate, useLocation } from 'react-router-dom'
// import { useAuth } from '../../context/AuthContext'
// import { getSchoolSettings } from '../../lib/schoolSettings'

// const MENU = [
//   { label: 'Dashboard', icon: '📊', path: '/teacher/dashboard' },
//   { label: 'Attendance', icon: '✅', path: '/teacher/attendance' },
//   { label: 'Time Table', icon: '🗓️', path: '/teacher/timetable' },
//   { label: 'Syllabus', icon: '📖', path: '/teacher/syllabus' },
//   { label: 'Notes', icon: '📝', path: '/teacher/notes' },
//   { label: 'Marks', icon: '🏆', path: '/teacher/marks' },
//   { label: 'Leave', icon: '🏖️', path: '/teacher/leave' },
//   { label: 'Exams', icon: '📝', path: '/teacher/exams' },
//   { label: 'Events', icon: '🎉', path: '/teacher/events' },
//   { label: 'Announcements', icon: '📢', path: '/teacher/announcements' },
//   { label: 'Focus Logs', icon: '👁️', path: '/teacher/focus-logs' },
//   { label: 'Question Paper', icon: '📝', path: '/teacher/question-paper' },
//   { label: 'Feedback', icon: '💬', path: '/teacher/feedback' },
//   { label: 'Settings', icon: '⚙️', path: '/teacher/settings' },
// ]

// export default function TeacherLayout() {
//   const { profile, logout } = useAuth()
//   const navigate = useNavigate()
//   const location = useLocation()
//   const [collapsed, setCollapsed] = useState(false)
//   const [schoolName, setSchoolName] = useState('ERP')
//   const [schoolLogo, setSchoolLogo] = useState('')
//   useEffect(() => {
//     getSchoolSettings().then(s => {
//       if (s?.school_name) setSchoolName(s.school_name)
//       if (s?.logo_url) setSchoolLogo(s.logo_url)
//     })
//   }, [])
//   const [showProfile, setShowProfile] = useState(false)
//   const [teacherInfo, setTeacherInfo] = useState(null)

//   useEffect(() => {
//     if (profile?.id) fetchTeacherInfo()
//   }, [profile])

//   const fetchTeacherInfo = async () => {
//     const { supabase } = await import('../../lib/supabase')
//     const [{ data: profileData }, { data: assignments }, { data: subjects }] = await Promise.all([
//       supabase.from('profiles').select('*').eq('id', profile.id).single(),
//       supabase.from('teacher_classes').select('classes(name), sections(name)').eq('teacher_id', profile.id),
//       supabase.from('subjects').select('name, classes(name)').eq('teacher_id', profile.id),
//     ])
//     setTeacherInfo({ teacher: profileData, assignments: assignments || [], subjects: subjects || [] })
//   }

//   return (
//     <div style={styles.container}>
//       {/* Sidebar */}
//       <div style={{ ...styles.sidebar, width: collapsed ? '70px' : '220px' }}>
//         <div style={styles.logo} onClick={() => setCollapsed(!collapsed)}>
//           {!collapsed && <span style={styles.logoText}>{schoolName}</span>}
//           {collapsed && (schoolLogo ? <img src={schoolLogo} style={{width:'32px',height:'32px',borderRadius:'50%',objectFit:'cover'}} onError={e=>e.target.style.display='none'} /> : <span style={{fontSize:'20px',fontWeight:'800',color:'#fff'}}>{schoolName?.charAt(0)}</span>)}
//         </div>

//         <nav style={styles.nav}>
//           {MENU.map(item => (
//             <div
//               key={item.path}
//               onClick={() => navigate(item.path)}
//               style={{
//                 ...styles.navItem,
//                 backgroundColor: location.pathname === item.path ? '#22c55e' : 'transparent',
//                 color: location.pathname === item.path ? '#fff' : '#cbd5e1',
//               }}
//             >
//               <span style={{ fontSize: '18px' }}>{item.icon}</span>
//               {!collapsed && <span style={styles.navLabel}>{item.label}</span>}
//             </div>
//           ))}
//         </nav>

//         <div style={styles.logoutBtn} onClick={logout}>
//           <span>🚪</span>
//           {!collapsed && <span>Logout</span>}
//         </div>
//       </div>

//       {/* Main */}
//       <div style={styles.main}>
//         {/* Topbar */}
//         <div style={styles.topbar}>
//           <input style={styles.search} placeholder="Search..." />
//           <div style={styles.topbarRight}>
//             <span style={styles.profileName}>{profile?.name}</span>
//             <div style={{ ...styles.avatar, cursor: 'pointer' }} onClick={() => setShowProfile(true)}>
//               {profile?.name?.charAt(0).toUpperCase()}
//             </div>
//           </div>
//         </div>

//         {/* Profile Modal */}
//       {showProfile && teacherInfo && (
//         <div style={styles.overlay} onClick={() => setShowProfile(false)}>
//           <div style={styles.profileModal} onClick={e => e.stopPropagation()}>
//             <div style={styles.profileModalHeader}>
//               <div style={styles.bigAvatar}>{profile?.name?.charAt(0).toUpperCase()}</div>
//               <div>
//                 <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#1a1a2e' }}>{profile?.name}</h2>
//                 <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6b7280' }}>Teacher</p>
//               </div>
//               <button style={styles.modalCloseBtn} onClick={() => setShowProfile(false)}>✕</button>
//             </div>
//             <div style={styles.infoGrid}>
//               <div style={styles.infoItem}><span style={styles.infoLabel}>Teacher ID</span><span style={styles.infoValue}>{teacherInfo.teacher?.uid || '—'}</span></div>
//               <div style={styles.infoItem}><span style={styles.infoLabel}>Email</span><span style={styles.infoValue}>{teacherInfo.teacher?.email || '—'}</span></div>
//               <div style={styles.infoItem}><span style={styles.infoLabel}>Phone</span><span style={styles.infoValue}>{teacherInfo.teacher?.phone || '—'}</span></div>
//             </div>
//             <div style={{ marginTop: '16px' }}>
//               <p style={styles.infoLabel}>Assigned Classes</p>
//               {teacherInfo.assignments.length === 0 ? <p style={{ color: '#9ca3af', fontSize: '14px' }}>No classes assigned</p> : (
//                 <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
//                   {teacherInfo.assignments.map((a, i) => (
//                     <span key={i} style={{ backgroundColor: '#dbeafe', color: '#1d4ed8', padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '600' }}>
//                       Class {a.classes?.name}{a.sections?.name ? ` - ${a.sections.name}` : ''}
//                     </span>
//                   ))}
//                 </div>
//               )}
//               <p style={{ ...styles.infoLabel, marginTop: '16px' }}>Assigned Subjects</p>
//               {teacherInfo.subjects.length === 0 ? <p style={{ color: '#9ca3af', fontSize: '14px' }}>No subjects assigned</p> : (
//                 <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
//                   {teacherInfo.subjects.map((s, i) => (
//                     <span key={i} style={{ backgroundColor: '#dcfce7', color: '#16a34a', padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '600' }}>
//                       {s.name}{s.classes?.name ? ` (Class ${s.classes.name})` : ''}
//                     </span>
//                   ))}
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Content */}
//         <div style={styles.content}>
//           <Outlet />
//         </div>
//       </div>
//     </div>
//   )
// }

// const styles = {
//   container: { display: 'flex', height: '100vh', backgroundColor: '#f1f5f9' },
//   sidebar: { backgroundColor: '#1a1a2e', display: 'flex', flexDirection: 'column', transition: 'width 0.3s', overflow: 'hidden', flexShrink: 0, position: 'relative', zIndex: 1 },
//   logo: { padding: '20px 16px', cursor: 'pointer', borderBottom: '1px solid #ffffff15' },
//   logoText: { fontSize: '20px', fontWeight: '800', color: '#fff' },
//   nav: { flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto', overflowX: 'hidden' },
//   navItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap' },
//   navLabel: { fontSize: '14px', fontWeight: '500' },
//   logoutBtn: { padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', color: '#ef4444', cursor: 'pointer', fontSize: '14px', fontWeight: '600', borderTop: '1px solid #ffffff15' },
//   main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
//   topbar: { backgroundColor: '#fff', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
//   search: { padding: '8px 16px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', outline: 'none', width: '280px' },
//   topbarRight: { display: 'flex', alignItems: 'center', gap: '12px' },
//   profileName: { fontSize: '14px', fontWeight: '600', color: '#374151' },
//   avatar: { width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#22c55e', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700' },
//   content: { flex: 1, overflow: 'auto', padding: '24px' },
//   overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
//   profileModal: { backgroundColor: '#fff', borderRadius: '16px', padding: '28px', width: '480px', maxWidth: '90vw', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' },
//   profileModalHeader: { display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' },
//   bigAvatar: { width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#22c55e', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: '700', flexShrink: 0 },
//   modalCloseBtn: { marginLeft: 'auto', background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#9ca3af' },
//   infoGrid: { display: 'flex', flexDirection: 'column', gap: '10px', backgroundColor: '#f9fafb', borderRadius: '10px', padding: '16px' },
//   infoItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
//   infoLabel: { fontSize: '12px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' },
//   infoValue: { fontSize: '14px', fontWeight: '600', color: '#374151' },
//   th: { textAlign: 'left', fontSize: '12px', color: '#6b7280', fontWeight: '600', padding: '8px 10px', borderBottom: '2px solid #f3f4f6' },
//   td: { padding: '10px', fontSize: '14px', color: '#374151', borderBottom: '1px solid #f9fafb' },
// }


import { useState, useEffect, useRef } from 'react'
import { Outlet, useNavigate, useLocation, NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getSchoolSettings } from '../../lib/schoolSettings'

const MENU = [
  { label: 'Dashboard', icon: '📊', path: '/teacher/dashboard' },
  { label: 'Attendance', icon: '✅', path: '/teacher/attendance' },
  { label: 'Time Table', icon: '🗓️', path: '/teacher/timetable' },
  { label: 'Syllabus', icon: '📖', path: '/teacher/syllabus' },
  { label: 'Notes', icon: '📝', path: '/teacher/notes' },
  { label: 'Marks', icon: '🏆', path: '/teacher/marks' },
  { label: 'Leave', icon: '🏖️', path: '/teacher/leave' },
  { label: 'Exams', icon: '📄', path: '/teacher/exams' },
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
  
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [schoolName, setSchoolName] = useState('ERP System')
  const [schoolLogo, setSchoolLogo] = useState('')
  const [showProfile, setShowProfile] = useState(false)
  const [teacherInfo, setTeacherInfo] = useState(null)
  
  // Search Logic
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const searchRef = useRef(null)

  useEffect(() => {
    getSchoolSettings().then(s => {
      if (s?.school_name) setSchoolName(s.school_name)
      if (s?.logo_url) setSchoolLogo(s.logo_url)
    })

    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsSearchFocused(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

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

  const filteredMenu = MENU.filter(item => 
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const renderAvatar = (size = '36px', fontSize = '14px') => (
    <div style={{ 
      width: size, height: size, borderRadius: '50%', 
      backgroundColor: '#10b981', color: '#fff', 
      display: 'flex', alignItems: 'center', justifyContent: 'center', 
      fontWeight: '700', fontSize: fontSize, border: '2px solid #fff', 
      boxShadow: '0 2px 5px rgba(0,0,0,0.1)' 
    }}>
      {profile?.name?.charAt(0).toUpperCase() || 'T'}
    </div>
  )

  return (
    <div style={styles.wrapper}>
      {/* Sidebar */}
      <aside style={{ ...styles.sidebar, width: sidebarOpen ? '260px' : '0px' }}>
        <div style={styles.logoContainer}>
          {schoolLogo ? (
            <img src={schoolLogo} alt="Logo" style={styles.logoImg} onError={e => e.target.style.display = 'none'} />
          ) : (
            <div style={styles.logoPlaceholder}>🏫</div>
          )}
          <div style={styles.logoTextWrapper}>
            <span style={styles.logoText}>{schoolName}</span>
            <span style={styles.logoSubtext}>Faculty Portal</span>
          </div>
        </div>

        <nav style={styles.nav}>
          <div style={styles.navSectionTitle}>MAIN MENU</div>
          {MENU.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              style={({ isActive }) => ({
                ...styles.navItem,
                backgroundColor: isActive ? '#f0fdf4' : 'transparent',
                color: isActive ? '#059669' : '#475569',
                fontWeight: isActive ? '700' : '500',
                borderRight: isActive ? '3px solid #10b981' : '3px solid transparent',
              })}
            >
              <span style={styles.navIcon}>{item.icon}</span>
              <span style={styles.navLabel}>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div style={styles.sidebarFooter}>
          <button onClick={logout} style={styles.logoutBtn}>
            <span>🚪</span> <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={styles.main}>
        <header style={styles.topbar}>
          <div style={styles.topbarLeft}>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} style={styles.menuBtn}>☰</button>
            
            <div style={styles.searchWrapper} ref={searchRef}>
              <span style={styles.searchIcon}>🔍</span>
              <input 
                style={styles.searchInput} 
                placeholder="Search modules..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
              />
              {isSearchFocused && searchQuery && (
                <div style={styles.searchDropdown}>
                  {filteredMenu.map(item => (
                    <div key={item.path} style={styles.searchDropdownItem} onClick={() => { navigate(item.path); setSearchQuery(''); setIsSearchFocused(false); }}>
                      <span>{item.icon}</span> <span>{item.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={styles.topbarRight}>
            <div style={styles.profileTrigger} onClick={() => setShowProfile(true)}>
              <div style={styles.profileTextInfo}>
                <span style={styles.profileName}>{profile?.name}</span>
                <span style={styles.profileRole}>Faculty Member</span>
              </div>
              {renderAvatar('40px', '16px')}
            </div>
          </div>
        </header>

        {/* Profile Modal */}
        {showProfile && teacherInfo && (
          <div style={styles.overlay} onClick={() => setShowProfile(false)}>
            <div style={styles.profileModal} onClick={e => e.stopPropagation()}>
              <div style={styles.profileModalHeader}>
                {renderAvatar('64px', '24px')}
                <div>
                  <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>{profile?.name}</h2>
                  <p style={styles.modalBadge}>Teacher Account</p>
                </div>
                <button style={styles.modalCloseBtn} onClick={() => setShowProfile(false)}>✕</button>
              </div>
              
              <div style={styles.infoGrid}>
                <div style={styles.infoItem}><span style={styles.infoLabel}>Staff ID</span><span style={styles.infoValue}>{teacherInfo.teacher?.uid || '—'}</span></div>
                <div style={styles.infoItem}><span style={styles.infoLabel}>Official Email</span><span style={styles.infoValue}>{teacherInfo.teacher?.email || '—'}</span></div>
                <div style={styles.infoItem}><span style={styles.infoLabel}>Phone</span><span style={styles.infoValue}>{teacherInfo.teacher?.phone || '—'}</span></div>
              </div>

              <div style={styles.assignmentsSection}>
                <p style={styles.sectionHeading}>Current Assignments</p>
                <div style={styles.tagCloud}>
                  {teacherInfo.assignments.map((a, i) => (
                    <span key={i} style={styles.classTag}>
                      Class {a.classes?.name}{a.sections?.name ? `-${a.sections.name}` : ''}
                    </span>
                  ))}
                  {teacherInfo.subjects.map((s, i) => (
                    <span key={i} style={styles.subjectTag}>{s.name}</span>
                  ))}
                </div>
              </div>

              <button style={styles.modalLogoutBtn} onClick={logout}>🚪 Log Out Securely</button>
            </div>
          </div>
        )}

        <main style={styles.content}>
          <div style={styles.contentInner}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

const styles = {
  wrapper: { display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'Inter, sans-serif' },
  sidebar: { backgroundColor: '#fff', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', transition: 'width 0.3s ease', position: 'sticky', top: 0, height: '100vh', zIndex: 20, flexShrink: 0, overflowX: 'hidden' },
  
  // logoContainer: { display: 'flex', alignItems: 'center', gap: '12px', padding: '24px 20px', borderBottom: '1px solid #f1f5f9', minHeight: '90px', boxSizing: 'border-box' },
  logoImg: { width: '42px', height: '42px', borderRadius: '8px', objectFit: 'cover' },

  logoContainer: { 
  display: 'flex', 
  alignItems: 'center', 
  gap: '12px', 
  padding: '20px 16px', // Reduced padding slightly to give more room
  borderBottom: '1px solid #f1f5f9', 
  minHeight: '90px', 
  boxSizing: 'border-box',
  overflow: 'hidden' 
},
  logoPlaceholder: { width: '42px', height: '42px', borderRadius: '8px', backgroundColor: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' },
  logoTextWrapper: { display: 'flex', flexDirection: 'column', minWidth: 0 },
  // logoText: { fontSize: '15px', fontWeight: '800', color: '#0f172a', lineHeight: '1.2', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  logoSubtext: { fontSize: '11px', color: '#10b981', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' },

  logoText: { 
  fontSize: '14px',      // Slightly smaller font to help it fit
  fontWeight: '800', 
  color: '#0f172a', 
  lineHeight: '1.2', 
  whiteSpace: 'normal',   // Changed from 'nowrap' to 'normal' to allow wrapping
  wordBreak: 'break-word' // Ensures long words don't break the container
},

  nav: { display: 'flex', flexDirection: 'column', padding: '20px 12px', gap: '4px', flex: 1, overflowY: 'auto' },
  navSectionTitle: { fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', padding: '0 12px', marginBottom: '8px' },
  navItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderRadius: '8px 0 0 8px', textDecoration: 'none', transition: 'all 0.2s', whiteSpace: 'nowrap' },
  navIcon: { fontSize: '18px', width: '24px', display: 'flex', justifyContent: 'center' },
  navLabel: { fontSize: '14px', letterSpacing: '0.2px' },

  sidebarFooter: { padding: '16px', borderTop: '1px solid #f1f5f9', backgroundColor: '#fafaf9' },
  logoutBtn: { width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', backgroundColor: '#fff', border: '1px solid #fecaca', color: '#dc2626', fontWeight: '700', fontSize: '13px', cursor: 'pointer', borderRadius: '8px', transition: '0.2s' },

  main: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 },
  topbar: { backgroundColor: '#fff', borderBottom: '1px solid #e2e8f0', padding: '0 24px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 },
  topbarLeft: { display: 'flex', alignItems: 'center', gap: '20px', flex: 1 },
  menuBtn: { background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#475569' },

  searchWrapper: { position: 'relative', width: '100%', maxWidth: '350px' },
  searchIcon: { position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px', color: '#94a3b8' },
  searchInput: { width: '100%', padding: '10px 14px 10px 38px', borderRadius: '24px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none', backgroundColor: '#f8fafc', color: '#1e293b' },
  searchDropdown: { position: 'absolute', top: '110%', left: 0, width: '100%', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', zIndex: 50, maxHeight: '300px', overflowY: 'auto' },
  searchDropdownItem: { padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', color: '#334155', borderBottom: '1px solid #f1f5f9', cursor: 'pointer' },

  topbarRight: { display: 'flex', alignItems: 'center', gap: '16px' },
  profileTrigger: { display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '6px 8px', borderRadius: '32px', transition: 'background-color 0.2s' },
  profileTextInfo: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', textAlign: 'right' },
  profileName: { fontSize: '14px', fontWeight: '700', color: '#0f172a' },
  profileRole: { fontSize: '11px', color: '#64748b', fontWeight: '600' },

  content: { padding: '32px', flex: 1, overflowY: 'auto' },
  contentInner: { maxWidth: '1400px', margin: '0 auto', width: '100%' },

  overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' },
  profileModal: { backgroundColor: '#fff', borderRadius: '24px', padding: '32px', width: '100%', maxWidth: '480px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' },
  profileModalHeader: { display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid #f1f5f9' },
  modalBadge: { margin: '4px 0 0', fontSize: '12px', color: '#059669', fontWeight: '700', backgroundColor: '#f0fdf4', padding: '2px 10px', borderRadius: '12px', display: 'inline-block' },
  modalCloseBtn: { marginLeft: 'auto', alignSelf: 'flex-start', background: '#f1f5f9', border: 'none', fontSize: '16px', cursor: 'pointer', color: '#475569', width: '32px', height: '32px', borderRadius: '50%' },

  infoGrid: { display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: '#f8fafc', borderRadius: '12px', padding: '20px', border: '1px solid #f1f5f9' },
  infoItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px dashed #e2e8f0' },
  infoLabel: { fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' },
  infoValue: { fontSize: '14px', fontWeight: '600', color: '#0f172a' },

  assignmentsSection: { marginTop: '24px' },
  sectionHeading: { fontSize: '13px', fontWeight: '800', color: '#0f172a', marginBottom: '12px' },
  tagCloud: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  classTag: { backgroundColor: '#eff6ff', color: '#2563eb', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', border: '1px solid #dbeafe' },
  subjectTag: { backgroundColor: '#f0fdf4', color: '#059669', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', border: '1px solid #dcfce7' },
  
  modalLogoutBtn: { width: '100%', marginTop: '32px', padding: '14px', backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '12px', cursor: 'pointer', fontSize: '14px', fontWeight: '700' },
}